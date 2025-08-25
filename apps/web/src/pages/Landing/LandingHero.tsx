// pages/Landing/LandingHero.tsx
import styles from "./LandingHero.module.css";

import bg from "../../assets/landing1.svg"; // 배경 1장
import clouds from "../../assets/clouds.svg"; // 구름
import walkingLeft from "../../assets/walkingLeft.svg";
import walkingRight from "../../assets/walkingRight.svg";

export default function LandingHero() {
  return (
    <section className={styles.stage}>
      {/* 배경 */}
      <img className={styles.bg} src={bg} alt="background" />

      {/* 구름 */}
      <img className={`${styles.cloud} ${styles.cloudA}`} src={clouds} alt="" />
      <img className={`${styles.cloud} ${styles.cloudB}`} src={clouds} alt="" />

      {/* 캐릭터: 역동적인 미니 페이스 */}
      <div className={styles.walkerStage}>
        <div className={styles.walkerRig}>
          <img
            className={`${styles.walker} ${styles.walkLeft}`}
            src={walkingLeft}
            alt=""
          />
          <img
            className={`${styles.walker} ${styles.walkRight}`}
            src={walkingRight}
            alt=""
          />
        </div>
      </div>

      {/* CTA */}
      <div className={styles.ctaWrap}>
        <a className={styles.cta} href="/login">
          시작하기
        </a>
      </div>
    </section>
  );
}
