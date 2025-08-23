// pages/Landing/LandingHero.tsx
import styles from "./LandingHero.module.css";

import bg from "../../assets/landing1.svg";      // 새로 뽑은 배경 1장
import clouds from "../../assets/clouds.svg";    // 구름
import walkingLeft from "../../assets/walkingLeft.svg";
import walkingRight from "../../assets/walkingRight.svg";

export default function LandingHero() {
  return (
    <section className={styles.stage}>
      <img className={styles.bg} src={bg} alt="background" />

      {/* 구름 2장 (부유 애니메이션) */}
      <img className={`${styles.cloud} ${styles.cloudA}`} src={clouds} alt="" />
      <img className={`${styles.cloud} ${styles.cloudB}`} src={clouds} alt="" />

      {/* 캐릭터: 제자리 앞걸음 */}
      <img className={`${styles.walker} ${styles.walkLeft}`} src={walkingLeft} alt="" />
      <img className={`${styles.walker} ${styles.walkRight}`} src={walkingRight} alt="" />

      <div className={styles.ctaWrap}>
        <a className={styles.cta} href="/signup">시작하기</a>
      </div>
    </section>
  );
}
