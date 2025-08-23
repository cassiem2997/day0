// pages/Landing/LandingPage.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LandingPage.module.css";

import LandingHero from "./LandingHero";
import LandingAirport from "./LandingAirport";
import LandingSchool from "./LandingSchool"; 

const TRANSITION_MS = 700; // 섹션 전환 속도
const WHEEL_THRESHOLD = 8; // 트랙패드 미세 입력 무시
const SWIPE_THRESHOLD = 40; // 터치 스와이프 최소 거리(px)

export default function LandingPage() {
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  // 섹션 정의
  const sections = [
    { id: "hero", node: <LandingHero /> },
    { id: "airport", node: <LandingAirport isActive={index === 1} /> }, // 활성화 시 비행기 재생
    { id: "school", node: <LandingSchool isActive={index === 2} /> }, // 활성화 시(깃발/시계 등) 재생
  ];
  const max = sections.length - 1;

  const go = useCallback(
    (dir: "next" | "prev") => {
      setIndex((prev) => {
        const next =
          dir === "next" ? Math.min(prev + 1, max) : Math.max(prev - 1, 0);
        return next;
      });
    },
    [max]
  );

  // Wheel
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (locked) return;
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      setLocked(true);
      go(e.deltaY > 0 ? "next" : "prev");
      setTimeout(() => setLocked(false), TRANSITION_MS + 80);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [go, locked]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        setLocked(true);
        go("next");
        setTimeout(() => setLocked(false), TRANSITION_MS + 80);
      }
      if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        setLocked(true);
        go("prev");
        setTimeout(() => setLocked(false), TRANSITION_MS + 80);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, locked]);

  // Touch
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      if (locked) return;
      const start = touchStartY.current;
      if (start == null) return;
      const endY = e.changedTouches[0].clientY;
      const dy = endY - start;
      if (Math.abs(dy) < SWIPE_THRESHOLD) return;
      setLocked(true);
      go(dy < 0 ? "next" : "prev");
      setTimeout(() => setLocked(false), TRANSITION_MS + 80);
      touchStartY.current = null;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [go, locked]);

  return (
    <div className={styles.viewport} ref={viewportRef}>
      <div
        className={styles.track}
        style={{
          transform: `translate3d(0, ${-index * 100}vh, 0)`,
          height: `${sections.length * 100}vh`,
          transition: `transform ${TRANSITION_MS}ms ease`,
        }}
      >
        {sections.map((s) => (
          <section key={s.id} className={styles.page}>
            {s.node}
          </section>
        ))}
      </div>

      {/* 페이지 도트 네비 */}
      <div className={styles.dots}>
        {sections.map((s, i) => (
          <button
            key={s.id}
            className={`${styles.dot} ${i === index ? styles.active : ""}`}
            aria-label={`Go to ${s.id}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
