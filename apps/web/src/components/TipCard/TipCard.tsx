import styles from "./TipCard.module.css";

export default function TipCard() {
  return (
    <div className={styles.card}>
      <h4>💡 Today's Tip</h4>
      <p>
        여권과 비자 사본을 클라우드에 업로드해두면 분실 시 유용하게 사용할 수 있어요.
      </p>
    </div>
  );
}
