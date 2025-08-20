import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

// 아이콘 (apps/web/src/assets/…)
import openIcon from "../../assets/openSidebar.svg";
import closeIcon from "../../assets/closeSidebar.svg";

const LS_KEY = "sidebar:isOpen";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved !== null) setIsOpen(saved === "true");
  }, []);

  const toggle = () => {
    setIsOpen((p) => {
      const v = !p;
      localStorage.setItem(LS_KEY, String(v));
      return v;
    });
  };

  return (
    <>
      {/* 모바일 오버레이 */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayShow : ""}`}
        onClick={toggle}
        aria-hidden={!isOpen}
      />
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
        aria-expanded={isOpen}
      >
        <button
          className={styles.toggleBtn}
          onClick={toggle}
          aria-label="사이드바 토글"
        >
          <img src={isOpen ? closeIcon : openIcon} alt="" />
        </button>

        <nav className={styles.nav}>
          <ul>
            <li>
              <NavLink
                to="/checklist"
                className={({ isActive }) =>
                  isActive ? styles.active : undefined
                }
              >
                <span className={styles.itemText}>체크리스트</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/exchange"
                className={({ isActive }) =>
                  isActive ? styles.active : undefined
                }
              >
                <span className={styles.itemText}>환전하기</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/savings"
                className={({ isActive }) =>
                  isActive ? styles.active : undefined
                }
              >
                <span className={styles.itemText}>적금가입</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/community"
                className={({ isActive }) =>
                  isActive ? styles.active : undefined
                }
              >
                <span className={styles.itemText}>커뮤니티</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/mypage"
                className={({ isActive }) =>
                  isActive ? styles.active : undefined
                }
              >
                <span className={styles.itemText}>마이페이지</span>
              </NavLink>
            </li>
            <li>
              <button className={styles.logout}>로그아웃</button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
