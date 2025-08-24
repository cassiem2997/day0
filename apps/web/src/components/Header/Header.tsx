import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import styles from "./Header.module.css";

type User = { name: string; avatarUrl?: string };

const NAV = [
  { label: "체크리스트", href: "/checklist" },
  { label: "환전하기", href: "/exchange" },
  { label: "적금", href: "/savings" },
  { label: "커뮤니티", href: "/community" },
  { label: "마이페이지", href: "/profile" },
];

// 더미 유저 (API 연동 전)
const DUMMY_USER: User = {
  name: "홍길동",
  // avatarUrl: "https://i.pravatar.cc/120?img=5", // 이미지 테스트 시 주석 해제
};

function getInitial(name?: string) {
  if (!name) {
    return "?";
  }
  return name.trim().slice(0, 1);
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(function () {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return function () {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleLogout() {
    alert("로그아웃(더미): 실제 연동 시 토큰 제거 + 리다이렉트 처리하세요.");
    setOpen(false);
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <NavLink to="/" className={styles.logoLink}>
          <img src="/logo.svg" alt="logo" className={styles.logo}></img>
        </NavLink>
      </div>

      <nav className={styles.nav} aria-label="주요 페이지">
        <ul className={styles.menu}>
          {NAV.map(function (item) {
            return (
              <li key={item.href} className={styles.item}>
                <NavLink
                  to={item.href}
                  className={function ({ isActive }) {
                    const cls = [styles.link];
                    if (isActive) {
                      cls.push(styles.active);
                    }
                    return cls.join(" ");
                  }}
                >
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.right} ref={menuRef}>
        <button
          type="button"
          className={styles.profileBtn}
          onClick={function () {
            setOpen(!open);
          }}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {DUMMY_USER.avatarUrl ? (
            <img
              src={DUMMY_USER.avatarUrl}
              alt="프로필"
              className={styles.avatarImg}
            ></img>
          ) : (
            <div className={styles.avatarFallback}>
              {getInitial(DUMMY_USER.name)}
            </div>
          )}
          <span className={styles.username}>{DUMMY_USER.name}님</span>
          <span className={styles.caret}></span>
        </button>

        {open ? (
          <div className={styles.dropdown} role="menu">
            <NavLink
              to="/profile"
              className={styles.dropdownItem}
              onClick={function () {
                setOpen(false);
              }}
            >
              마이페이지
            </NavLink>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
