import styles from "./NoChecklist.module.css";
import bg from "../../assets/noChecklist.svg";

type NoChecklistProps = {
  /** 생성 버튼 클릭 시 동작 (없으면 기본 경로로 이동) */
  onCreate?: () => void;
  /** 필요 시 외부에서 여백/정렬 커스터마이즈 */
  className?: string;
};


export default function NoChecklist({ onCreate, className }: NoChecklistProps) {
  const handleCreate = () => {
    if (onCreate) {
      onCreate();
      return;
    }
    // window.location.href = "/checklist/create";
  };

  return (
    <section className={`${styles.wrap} ${className || ""}`}>
      {/* 배경 일러스트 */}
      <img
        className={styles.bg}
        src={bg}
        alt="체크리스트가 없을 때 표시되는 배경"
        draggable={false}
      />

      {/* 오버레이: 안내 문구 + 버튼 */}
      <div className={styles.overlay}>
        <h3 className={styles.title}>체크리스트가 없습니다</h3>
        <button className={styles.cta} type="button" onClick={handleCreate}>
          생성하기
        </button>
      </div>
    </section>
  );
}
