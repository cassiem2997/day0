import styles from "./LandingHero.module.css";

// svg import
import clouds from "../../assets/clouds.svg";
import header from "../../assets/ChecklistHeader.svg";
import school from "../../assets/school.svg";
import leftTree from "../../assets/leftTree.svg";
import rightTree from "../../assets/rightTree.svg";
import road from "../../assets/road.svg";
import walkingLeft from "../../assets/walkingLeft.svg";
import walkingRight from "../../assets/walkingRight.svg";

export default function LandingHero() {
  return (
    <section className={styles.stage}>
      {/* 하늘 배경 */}
      <div className={styles.sky}></div>

      {/* 구름 */}
      <img
        className={`${styles.cloud} ${styles.cloudA}`}
        src={clouds}
        alt="clouds"
      />
      <img
        className={`${styles.cloud} ${styles.cloudB}`}
        src={clouds}
        alt="clouds"
      />

      {/* 타이틀 */}
      <img className={styles.header} src={header} alt="CHECKLISTS" />

      {/* 학교 / 나무 */}
      <img className={styles.school} src={school} alt="school" />
      <img
        className={`${styles.tree} ${styles.leftTree}`}
        src={leftTree}
        alt="left tree"
      />
      <img
        className={`${styles.tree} ${styles.rightTree}`}
        src={rightTree}
        alt="right tree"
      />

      {/* 도로 */}
      <img className={styles.road} src={road} alt="road" />

      {/* 캐릭터 */}
      <img
        className={`${styles.walker} ${styles.walkLeft}`}
        src={walkingLeft}
        alt="walker left"
      />
      <img
        className={`${styles.walker} ${styles.walkRight}`}
        src={walkingRight}
        alt="walker right"
      />

      {/* 바닥 */}
      <div className={styles.ground}></div>

      {/* CTA */}
      <div className={styles.ctaWrap}>
        <a href="/signup" className={styles.cta}>
          시작하기
        </a>
      </div>
    </section>
  );
}
