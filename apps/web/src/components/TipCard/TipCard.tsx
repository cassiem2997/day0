import styles from "./TipCard.module.css";

type TipCardProps = {
  message: string;
};

export default function TipCard({ message }: TipCardProps) {
  return (
    <section className={styles.card} aria-label="오늘의 팁">
      <p className={styles.message}>{message}</p>
    </section>
  );
}
