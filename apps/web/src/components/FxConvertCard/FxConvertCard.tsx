import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import styles from "./FxConvertCard.module.css";
import { getFxEstimate } from "../../api/fx";

// 통화별 자리수/로케일
const CCY_META: Record<string, { locale: string; fraction: number }> = {
  USD: { locale: "en-US", fraction: 2 },
  EUR: { locale: "de-DE", fraction: 2 },
  KRW: { locale: "ko-KR", fraction: 0 },
  JPY: { locale: "ja-JP", fraction: 0 },
};
const fallbackMeta = { locale: "en-US", fraction: 2 };
const getMeta = (ccy: string) => CCY_META[ccy] ?? fallbackMeta;

const stripCommas = (s: string) => s.replace(/,/g, "");
const formatByCcy = (ccy: string, value: number) => {
  const { locale, fraction } = getMeta(ccy);
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fraction,
  });
};
const sanitizeNumericString = (input: string, fraction: number) => {
  let s = input.replace(/[^0-9.]/g, "");
  if (s.startsWith(".")) s = "0" + s;
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    const head = s.slice(0, firstDot);
    const tail = s.slice(firstDot + 1).replace(/\./g, "");
    s = head + "." + tail;
  }
  s = s.replace(/^0+(?=\d)/, "");
  if (s === "") s = "0";
  if (fraction === 0) {
    s = s.split(".")[0] ?? s;
  } else if (s.includes(".")) {
    const [i, f = ""] = s.split(".");
    s = i + "." + f.slice(0, fraction);
  }
  return s;
};

type Props = {
  currencies?: string[];
  defaultFrom?: string; // 보낼 통화(입력)
  defaultTo?: string;   // 받을 통화(결과)
};

export default function FxConvertCard({
  currencies = ["USD", "KRW", "JPY", "EUR"],
  defaultFrom = "USD",
  defaultTo = "KRW",
}: Props) {
  const [fromCurrency, setFromCurrency] = useState(defaultFrom); // 보낼 통화
  const [toCurrency, setToCurrency] = useState(defaultTo);       // 받을 통화

  // 위쪽(보낼 금액) 입력 문자열
  const [fromInput, setFromInput] = useState<string>("1");
  // 아래쪽(받을 금액) 숫자 값(readOnly)
  const [toAmount, setToAmount] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fromFraction = getMeta(fromCurrency).fraction;
  const parsedFrom = useMemo(
    () => parseFloat(stripCommas(fromInput)) || 0,
    [fromInput]
  );

  // 보낼 통화 바뀔 때 현재 입력을 자리수 규칙으로 정리
  useEffect(() => {
    setFromInput((prev) => sanitizeNumericString(prev, fromFraction));
  }, [fromCurrency]);

  // 요청 순서 가드(경쟁 상태 방지)
  const debounceRef = useRef<number | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const mySeq = ++seqRef.current;
      try {
        setLoading(true);
        setErr(null);

        // ── 로그: 요청 시작 ─────────────────────────────────────────
        console.groupCollapsed(
          "%c[FxConvertCard] /fx/estimate request",
          "color:#888"
        );
        console.log("params", {
          fromCurrency,
          toCurrency,
          amount: parsedFrom,
        });
        console.time("[FxConvertCard] /fx/estimate latency");

        // 서버 응답을 fromAmount/toAmount로 정규화해서 사용
        const { fromAmount, toAmount, raw } = await getFxEstimate({
          fromCurrency,
          toCurrency,
          amount: parsedFrom, // 사용자가 친 값(from 통화 기준)
        });

        // ── 로그: 응답 수신 ─────────────────────────────────────────
        console.timeEnd("[FxConvertCard] /fx/estimate latency");
        console.log("response.normalized", { fromAmount, toAmount });
        console.log("response.raw", raw);
        console.groupEnd();
        // ───────────────────────────────────────────────────────────

        // 입력칸은 사용자가 친 값 유지(반올림 동기화 원하면 아래 주석 해제)
        // setFromInput(sanitizeNumericString(String(fromAmount), fromFraction));

        if (mySeq === seqRef.current) setToAmount(toAmount);
      } catch (e: any) {
        console.groupCollapsed(
          "%c[FxConvertCard] /fx/estimate error",
          "color:#c00"
        );
        console.error(e);
        console.groupEnd();

        setToAmount(0);
        setErr(e?.message ?? "환율 조회 실패");
      } finally {
        if (seqRef.current === mySeq) setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [fromCurrency, toCurrency, parsedFrom, fromFraction]);

  const onChangeFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setFromInput(sanitizeNumericString(raw, fromFraction));
  };

  const onApply = async () => {
    await Swal.fire({
      icon: "success",
      title: "환전 신청",
      text: `${formatByCcy(
        fromCurrency,
        parseFloat(stripCommas(fromInput)) || 0
      )} ${fromCurrency} → 약 ${formatByCcy(toCurrency, toAmount)} ${toCurrency}`,
      confirmButtonText: "확인",
    });
  };

  return (
    <section className={styles.convertCard}>
      {/* 줄 1: (드롭다운만 교체) 받을 통화 드롭다운 + 기존 입력칸(보낼 금액 입력) */}
      <div className={styles.row}>
        <select
          aria-label="보낼 통화"
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
          className={`${styles.ccyPill} ${styles.ccyPillSelect}`}
        >
          {currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* 기존 그대로: 보낼 금액 입력칸 (fromInput) */}
        <div className={styles.inputBox}>
          <input
            type="text"
            inputMode={fromFraction === 0 ? "numeric" : "decimal"}
            value={fromInput}
            onChange={onChangeFromInput}
            className={styles.amountInput}
            aria-label="보낼 금액"
            placeholder={`0${fromFraction > 0 ? ".00" : ""}`}
          />
        </div>
      </div>

      <hr className={styles.hr} />

      {/* 줄 2: (드롭다운만 교체) 보낼 통화 드롭다운 + 기존 결과칸(받을 금액 readOnly) */}
      <div className={styles.row}>
        <select
          aria-label="보낼 통화"
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
          className={`${styles.ccyPill} ${styles.ccyPillSelect}`}
        >
          {currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* 기존 그대로: 받을 금액 결과칸 (toAmount) */}
        <div className={styles.inputBox}>
          <input
            type="text"
            readOnly
            value={formatByCcy(toCurrency, toAmount)}
            className={styles.amountInput}
            aria-label="받을 금액(자동 계산)"
          />
        </div>
      </div>

      <div className={styles.ctaWrap}>
        <button type="button" className={styles.applyBtn} onClick={onApply}>
          환전 신청하기
        </button>
      </div>
    </section>
  );
}
