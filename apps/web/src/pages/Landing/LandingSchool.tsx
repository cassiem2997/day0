import styles from "./LandingSchool.module.css";

import bg from "../../assets/landing3.svg";
import clouds from "../../assets/clouds.svg";
import walkingLeft from "../../assets/walkingLeft.svg";
import walkingRight from "../../assets/walkingRight.svg";

type Props = { isActive?: boolean };

export default function LandingSchool({ isActive = false }: Props) {
  return (
    <section className={`${styles.stage} ${isActive ? styles.play : ""}`}>
      {/* 배경 */}
      <img className={styles.bg} src={bg} alt="" />

      {/* 구름 */}
      <img className={`${styles.cloud} ${styles.cloudA}`} src={clouds} alt="" />
      <img className={`${styles.cloud} ${styles.cloudB}`} src={clouds} alt="" />

      {/* 캐릭터: 역동 페이스(미니 좌우 이동 + 바운스) */}
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
      <div className={styles.ctaWrap}>
        <a className={styles.cta} href="/login">
          시작하기
        </a>
      </div>
    </section>
  );
}
