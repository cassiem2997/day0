// src/pages/Landing/Landing4.tsx
import styles from "./Landing4.module.css";

import bg from "../../assets/landing4.svg";
import walkingLeft from "../../assets/walkingLeft.svg";
import walkingRight from "../../assets/walkingRight.svg";

export default function Landing4() {
  return (
    <section className={styles.stage}>
      {/* 배경 */}
      <img className={styles.bg} src={bg} alt="background" />


      {/* 캐릭터 (제자리 걷기) */}
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
