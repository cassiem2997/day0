// src/pages/Savings/SavingsMission.tsx
import { useMemo, useState } from "react";
// import Swal from "sweetalert2";
import styles from "./SavingsPage.module.css";

export type Mission = {
  id: number;
  text: string;
  completed: boolean;
  credited?: boolean;
};

function formatAmount(n: number) {
  return n.toLocaleString("ko-KR");
}

type Props = {
  missions: Mission[];
  rewardPerMission: number; // 부모 시그니처 유지용
  onRequestDeposit: (
    missionIds: number[],
    amount: number
  ) => Promise<boolean> | boolean; // 부모 시그니처 유지용
};

export default function SavingsMission({ missions }: Props) {
  const totalCount = missions.length;
  const completedCount = useMemo(
    () => missions.filter((m) => m.completed).length,
    [missions]
  );

  // 부유 +금액 배지는 현재 트리거가 없으므로 렌더 영향 없음(경고도 없음)
  const [showFloatBadge] = useState(false);
  const [floatAmount] = useState(0);

  return (
    <section className={styles.missionWrap} aria-label="미션 상황">
      <div className={styles.missionHead}>
        <h2 className={styles.missionTitle}>
          Your <br /> Missons
        </h2>
      </div>

      <div className={styles.missionGrid}>
        {/* 좌측: 분수 박스 (대각선 반반) */}
        <div className={styles.fractionBox} aria-label="미션 달성 수치">
          <span className={styles.fracTop}>{completedCount}</span>
          <span className={styles.fracBottom}>{totalCount}</span>
        </div>

        {/* 우측: 미션 리스트 카드 */}
        <div className={styles.missionCard}>
          {/* 부유 +금액 애니메이션 (현재 표시되지 않음) */}
          {showFloatBadge && (
            <div className={styles.floatBadge}>
              + {formatAmount(floatAmount)}
            </div>
          )}

          <ul className={styles.missionList}>
            {missions.map((m) => (
              <li
                key={m.id}
                className={`${styles.missionItem} ${
                  m.completed ? styles.done : ""
                }`}
              >
                <span
                  className={`${styles.checkbox} ${
                    m.completed ? styles.checked : ""
                  }`}
                  aria-hidden="true"
                ></span>
                <span className={styles.missionText}>{m.text}</span>
              </li>
            ))}
          </ul>

          {/* 기존 입금 푸터는 비활성(주석 유지) */}
          {/* <div className={styles.missionFooter}>
            <div className={styles.pendingInfo}>
              대기 중: {pendingCount}건 · {formatAmount(pendingReward)}원
            </div>
            <button
              type="button"
              className={styles.depositBtn}
              onClick={handleDepositClick}
              disabled={pendingCount === 0}
            >
              미션 완료비 입금하기
            </button>
          </div> */}
        </div>
      </div>
    </section>
  );
}
