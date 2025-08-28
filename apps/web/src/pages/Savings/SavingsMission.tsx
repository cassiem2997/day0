import { useMemo, useState } from "react";
import Swal from "sweetalert2";
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
  rewardPerMission: number;
  onRequestDeposit: (
    missionIds: number[],
    amount: number
  ) => Promise<boolean> | boolean;
};

export default function SavingsMission({
  missions,
  rewardPerMission,
  onRequestDeposit,
}: Props) {
  const totalCount = missions.length;
  const completedCount = useMemo(
    () => missions.filter((m) => m.completed).length,
    [missions]
  );

  const pendingMissions = useMemo(
    () => missions.filter((m) => m.completed && !m.credited),
    [missions]
  );
  const pendingCount = pendingMissions.length;
  const pendingReward = pendingCount * rewardPerMission;

  // +금액 부유 배지 (로컬)
  const [showFloatBadge, setShowFloatBadge] = useState(false);
  const [floatAmount, setFloatAmount] = useState(0);

  async function handleDepositClick() {
    if (pendingCount === 0) {
      await Swal.fire({
        icon: "info",
        title: "입금할 미션이 없어요",
        confirmButtonColor: "#4758fc",
      });
      return;
    }

    const res = await Swal.fire({
      icon: "question",
      title: `미션 완료비 ${formatAmount(
        pendingReward
      )}원을\n적금 계좌에 입금할까요?`,
      showCancelButton: true,
      confirmButtonText: "입금하기",
      cancelButtonText: "취소",
      confirmButtonColor: "#4758fc",
    });
    if (!res.isConfirmed) return;

    // 부모에 입금 요청 (API/상태갱신은 부모가 수행)
    const ok = await onRequestDeposit(
      pendingMissions.map((m) => m.id),
      pendingReward
    );
    if (!ok) return;

    setFloatAmount(pendingReward);
    setShowFloatBadge(true);
    setTimeout(() => setShowFloatBadge(false), 1200);

    await Swal.fire({
      icon: "success",
      title: "입금 완료!",
      text: "미션 완료 비가 적금으로 입금되었습니다.",
      confirmButtonColor: "#4758fc",
    });
  }

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
          {/* 부유 +금액 애니메이션 */}
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
