import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import openIcon from "../../assets/openSidebar.svg";
import closeIcon from "../../assets/closeSidebar.svg";

type SidebarProps = {
  isOpen: boolean;
  toggle: () => void;
};

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  return (
    <>
      {/* 모바일 오버레이 */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayShow : ""}`}
        onClick={toggle}
      />
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
      >
        <button className={styles.toggleBtn} onClick={toggle}>
          <img src={isOpen ? closeIcon : openIcon} alt="사이드바 토글" />
        </button>

        <nav className={styles.nav}>
          <ul>
            <li>
              <NavLink
                to="/checklist"
                className={({ isActive }) => (isActive ? styles.active : "")}
              >
                <span className={styles.itemText}>체크리스트</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/exchange"
                className={({ isActive }) => (isActive ? styles.active : "")}
              >
                <span className={styles.itemText}>환전하기</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/savings"
                className={({ isActive }) => (isActive ? styles.active : "")}
              >
                <span className={styles.itemText}>적금가입</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/community"
                className={({ isActive }) => (isActive ? styles.active : "")}
              >
                <span className={styles.itemText}>커뮤니티</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/mypage"
                className={({ isActive }) => (isActive ? styles.active : "")}
              >
                <span className={styles.itemText}>마이페이지</span>
              </NavLink>
            </li>
            <li>
              <button className={styles.logout}>
                <span className={styles.itemText}>로그아웃</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
