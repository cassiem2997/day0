// src/components/FxAlertToaster/FxAlertToaster.tsx
import { useEffect, useRef, useState } from "react";
import { useFxAlerts } from "../../api/fx";



import type { AlertMsg } from "../../api/fx";
import styles from "./FxAlertToaster.module.css";

type Props = {
  userId: string | number;
  autoCloseMs?: number; // 0이면 자동 닫힘 없음
  maxStack?: number;
};

type ToastItem = { id: number; message: AlertMsg };

function keyOf(m: AlertMsg) {
  const pair =
    m.currency ?? (m.baseCcy && m.quoteCcy ? `${m.baseCcy}/${m.quoteCcy}` : "");
  const ts = (m.ts as any) ?? (m.timestamp as any) ?? "";
  const rate = m.rate ?? "";
  return `${m.type}-${pair}-${rate}-${ts}`;
}

function pairOf(m: AlertMsg) {
  if (m.currency) return m.currency;
  if (m.baseCcy && m.quoteCcy) return `${m.baseCcy}/${m.quoteCcy}`;
  return "FX";
}

function timeOf(m: AlertMsg) {
  const raw = (m.ts as any) ?? (m.timestamp as any);
  if (!raw) return "";
  const d = typeof raw === "number" ? new Date(raw) : new Date(String(raw));
  return isNaN(d.getTime()) ? String(raw) : d.toLocaleString();
}

export default function FxAlertToaster({
  userId,
  autoCloseMs = 5000,
  maxStack = 4,
}: Props) {
  // ✅ useFxAlerts는 반드시 절대경로+withCredentials로 구현되어 있어야 함(api/fx 참고)
  const { messages } = useFxAlerts(String(userId));
  const latest = messages[0];

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);
  const lastKeyRef = useRef<string | null>(null);

  // 새 메시지를 중복 없이 스택에 푸시
  useEffect(() => {
    if (!latest) return;
    const key = keyOf(latest);
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    setToasts((prev) => [{ id: idRef.current++, message: latest }, ...prev].slice(0, maxStack));
  }, [latest, maxStack]);

  // 자동 닫힘
  useEffect(() => {
    if (autoCloseMs <= 0 || toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, autoCloseMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, autoCloseMs]);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div key={t.id} className={styles.toast} role="status">
          <div className={styles.header}>
            <span className={styles.title}>📢 목표 환율에 도달했어요 지금 환전하세요!</span>
            <button className={styles.closeBtn} onClick={() => remove(t.id)} aria-label="알림 닫기">
              ×
            </button>
          </div>
          <div className={styles.body}>
            <b>{pairOf(t.message)}</b>
            {typeof t.message.rate !== "undefined" ? <> {t.message.rate}</> : null}
            <div className={styles.time}>{timeOf(t.message)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
