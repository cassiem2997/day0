import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
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
  defaultTo?: string;
  rate?: number;
  onLoadingChange?: (loading: boolean) => void;
  onExchangeInfoChange?: (info: {
    toCurrency: string;
    toAmount: number;
    fromAmount: number;
    fromCurrency: string;
    isValid: boolean;
  }) => void;
};

export interface FxConvertCardRef {
  getExchangeInfo: () => {
    toCurrency: string;
    toAmount: number;
    fromAmount: number;
    fromCurrency: string;
    isValid: boolean;
  };
  isLoading: () => boolean;
}

const FxConvertCard = forwardRef<FxConvertCardRef, Props>(({
  currencies = ["USD", "JPY", "EUR"],
  defaultTo = "USD",
  rate = 1398,
  onLoadingChange,
  onExchangeInfoChange,
}, ref) => {
  const [fromCurrency] = useState("KRW");
  const [toCurrency, setToCurrency] = useState(defaultTo);

  // 위쪽 입력: 받고 싶은 외화 금액 (기본값: 100)
  const [toInput, setToInput] = useState<string>("100");
  // 아래쪽 결과: 필요한 KRW 금액
  const [fromAmount, setFromAmount] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toFraction = getMeta(toCurrency).fraction;
  const parsedTo = useMemo(
    () => parseFloat(toInput) || 0,
    [toInput]
  );

  // 받고 싶은 통화 바뀔 때 입력 정리
  useEffect(() => {
    setToInput((prev) => sanitizeNumericString(prev, toFraction));
  }, [toCurrency]);

  // 요청 순서 가드
  const debounceRef = useRef<number | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const mySeq = ++seqRef.current;
      try {
        setLoading(true);
        setErr(null);

        console.groupCollapsed("[FxConvertCard] /fx/estimate request");
        console.log("params", {
          fromCurrency,
          toCurrency,
          amount: parsedTo,
        });
        console.time("[FxConvertCard] latency");

        const raw = await getFxEstimate({
          fromCurrency, // "KRW"
          toCurrency, // "USD" 등
          amount: parsedTo, // 받고 싶은 외화 금액
        });

        console.timeEnd("[FxConvertCard] latency");
        console.log("response.amount (필요한 KRW)", raw.amount);
        console.log("response", raw);
        console.groupEnd();

        if (mySeq === seqRef.current) setFromAmount(raw.amount);
      } catch (e: any) {
        console.error(e);
        setFromAmount(0);
        setErr(e?.message ?? "환율 조회 실패");
      } finally {
        if (seqRef.current === mySeq) setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [fromCurrency, toCurrency, parsedTo, toFraction]);

  // 로딩 상태와 환전 정보를 부모에게 전달
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  useEffect(() => {
    if (onExchangeInfoChange) {
      const info = {
        toCurrency,
        toAmount: parseFloat(toInput) || 0,
        fromAmount,
        fromCurrency,
        isValid: validateAmount(parseFloat(toInput) || 0) && fromAmount > 0,
      };
      onExchangeInfoChange(info);
    }
  }, [toCurrency, toInput, fromAmount, fromCurrency, onExchangeInfoChange]);

  const onChangeToInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const sanitizedValue = sanitizeNumericString(inputValue, toFraction);
    
    // 10단위로 제한하고 최소값 100 적용
    const numericValue = parseFloat(sanitizedValue) || 0;
    const adjustedValue = Math.round(numericValue / 10) * 10;
    
    // 입력값이 10의 배수가 아니면 자동으로 조정
    if (numericValue !== adjustedValue && numericValue > 0) {
      setToInput(adjustedValue.toString());
    } else {
      setToInput(sanitizedValue);
    }
  };

  // 10단위 검증 함수 (최소값 100)
  const validateAmount = (amount: number): boolean => {
    return amount >= 100;
  };

  // 환전 정보를 부모 컴포넌트에 전달하는 함수
  const getExchangeInfo = () => {
    const toAmount = parseFloat(toInput) || 0;
    const result = {
      toCurrency,
      toAmount,
      fromAmount,
      fromCurrency,
      isValid: validateAmount(toAmount) && fromAmount > 0,
    };
    console.log('FxConvertCard getExchangeInfo:', result);
    return result;
  };

  // 부모 컴포넌트에서 호출할 수 있도록 ref로 노출
  useImperativeHandle(ref, () => ({
    getExchangeInfo,
    isLoading: () => loading,
  }));

  return (
    <section className={styles.convertCard}>
      {/* 줄 1: 환전하고 싶은 통화 + 받고 싶은 금액 입력 */}
      <div className={styles.row}>
        <select
          aria-label="환전하고 싶은 통화"
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
          className={`${styles.ccyPill} ${styles.ccyPillSelect}`}
        >
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className={styles.inputBox}>
          <input
            type="text"
            inputMode={toFraction === 0 ? "numeric" : "decimal"}
            value={toInput}
            onChange={onChangeToInput}
            className={styles.amountInput}
            aria-label="받고 싶은 금액"
            placeholder={`100${toFraction > 0 ? ".00" : ""}`}
          />
        </div>
      </div>

      <hr className={styles.hr} />

      {/* 줄 2: 고정 KRW + 필요한 금액 표시 */}
      <div className={styles.row}>
        <div className={styles.ccyPill}>KRW</div>
        <div className={styles.inputBox}>
          <input
            type="text"
            readOnly
            value={formatByCcy("KRW", fromAmount)}
            className={styles.amountInput}
            aria-label="필요한 KRW 금액"
          />
        </div>
      </div>

      {/* 10단위 안내 메시지 */}
      <div className={styles.infoMessage}>
        <p>환전은 100 단위부터 가능하며, 10 단위로만 가능합니다.</p>
      </div>
      <span hidden aria-hidden="true">
        {loading ? "…" : ""}
        {err ?? ""}
      </span>
    </section>
  );
});

export default FxConvertCard;
