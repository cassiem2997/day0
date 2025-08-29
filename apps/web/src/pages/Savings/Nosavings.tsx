// src/pages/Savings/Nosavings.tsx
import styles from "./Nosavings.module.css";
import bg from "../../assets/noChecklist.svg"; // 필요시 전용 이미지로 교체 가능

type Props = {
  onCreate?: () => void;
  className?: string;
};

export default function NoSavings({ onCreate, className }: Props) {
  const handleCreate = () => {
    if (onCreate) onCreate();
  };

  return (
    <section className={`${styles.wrap} ${className || ""}`}>
      <img
        className={styles.bg}
        src={bg}
        alt="적금 플랜이 없을 때 표시되는 배경"
        draggable={false}
      />
      <div className={styles.overlay}>
        <h3 className={styles.title}>적금 플랜이 없습니다</h3>
        <button className={styles.cta} type="button" onClick={handleCreate}>
          플랜 만들기
        </button>
      </div>
    </section>
  );
}
