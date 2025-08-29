// src/components/Header/Header.tsx
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import styles from "./Header.module.css";
import { logout, me, getUserProfile, type UserProfile } from "../../api/user";
type User = { name: string; avatarUrl?: string };

const NAV = [
  { label: "체크리스트", href: "/checklist" },
  { label: "환전하기", href: "/exchange" },
  { label: "적금", href: "/savings" },
  { label: "커뮤니티", href: "/community" },
  { label: "마이페이지", href: "/mypage" },
];

// // 더미 유저 (API 연동 전)
// const DUMMY_USER: User = {
//   name: "사용자",
//   // avatarUrl: "https://i.pravatar.cc/120?img=5",
// };

function getInitial(name?: string) {
  if (!name) return "?";
  return name.trim().slice(0, 1);
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null); 
  const navigate = useNavigate();

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

  // 로그인 상태/프로필 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const meRes = await me();
        if (!meRes?.userId) {
          // 비로그인 상태
          if (mounted) setUser(null);
          return;
        }
        const prof = await getUserProfile(meRes.userId);
        const u: UserProfile = prof.data;
        if (mounted) {
          setUser({
            name: u.nickname || "사용자",
            avatarUrl: u.profileImage ?? undefined,
          });
        }
      } catch (err: any) {
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await logout(); // 서버에 로그아웃 요청 (쿠키 삭제)
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }

    setOpen(false);

    // 알림 후 로그인 페이지로 이동
    await Swal.fire({
      icon: "success",
      title: "로그아웃 되었습니다.",
      confirmButtonText: "확인",
      confirmButtonColor: "#a8d5ff",
    });

    setUser(null); // 추가
    navigate("/login", { replace: true });
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
        {/* 오른쪽 영역: 로그인 전/후 UI 분기 */}
        {loading ? (
          // 로딩 상태: 간단한 스켈레톤/플레이스홀더
          <div className={styles.profileBtn} aria-busy="true">
            <div className={styles.avatarFallback}>·</div>
            <span className={styles.username}>불러오는 중...</span>
          </div>
        ) : user ? (
          // 로그인 상태
          <>
            <button
              type="button"
              className={styles.profileBtn}
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="프로필"
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {getInitial(user.name)}
                </div>
              )}
              <span className={styles.username}>{user.name}님</span>
              <span className={styles.caret} />
            </button>

            {open ? (
              <div className={styles.dropdown} role="menu">
                <NavLink
                  to="/mypage"
                  className={styles.dropdownItem}
                  onClick={() => setOpen(false)}
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
          </>
        ) : (
          // 비로그인 상태
          <div className={styles.authButtons}>
            <NavLink to="/login" className={styles.loginLink}>
              로그인
            </NavLink>
            <NavLink to="/signup" className={styles.signupLink}>
              회원가입
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}