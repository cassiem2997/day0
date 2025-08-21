import { NavLink } from "react-router-dom";
import styles from "./Header.module.css";

type HeaderProps = {
  /** 웹에선 헤더만 쓰므로 사실상 미사용. 전달돼도 무시됨 */
  isSidebarOpen?: boolean;
};

const NAV = [
  { label: "체크리스트", href: "/checklist" },
  { label: "환전하기", href: "/exchange" },
  { label: "적금", href: "/savings" },
  { label: "커뮤니티", href: "/community" },
  { label: "프로필", href: "/profile" },
];

export default function Header(_props: HeaderProps) {
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
                    const classes = [styles.link];
                    if (isActive) {
                      classes.push(styles.active);
                    }
                    return classes.filter(Boolean).join(" ");
                  }}
                >
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
