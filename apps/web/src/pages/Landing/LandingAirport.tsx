import styles from "./LandingAirport.module.css";

import bg from "../../assets/landing2.svg";
import clouds from "../../assets/clouds.svg";
import walkingLeft from "../../assets/walkingLeft.svg";
import walkingRight from "../../assets/walkingRight.svg";
import airplane from "../../assets/landingAirplane.svg";

type Props = { isActive?: boolean };

export default function LandingAirport({ isActive = false }: Props) {
  return (
    <section className={`${styles.stage} ${isActive ? styles.play : ""}`}>
      {/* 배경 */}
      <img className={styles.bg} src={bg} alt="" />

      {/* 구름 */}
      <img className={`${styles.cloud} ${styles.cloudA}`} src={clouds} alt="" />
      <img className={`${styles.cloud} ${styles.cloudB}`} src={clouds} alt="" />

      {/* 캐릭터: 제자리 앞걸음 */}
      <div className={styles.walkerWrap}>
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

      {/* 비행기: isActive가 바뀔 때 리마운트 → 항상 처음부터 재생 */}
      <img
        key={isActive ? "plane-on" : "plane-off"}
        className={styles.plane}
        src={airplane}
        alt=""
      />

      <div className={styles.ctaWrap}>
        <a className={styles.cta} href="/login">
          시작하기
        </a>
      </div>
    </section>
  );
}
