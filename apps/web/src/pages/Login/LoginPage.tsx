// src/pages/Login/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import styles from "./LoginPage.module.css";
import Character from "../../assets/character.svg";
import Swal from "sweetalert2";

type Gender = "" | "MALE" | "FEMALE";

export default function LoginPage() {
  // 라우팅 훅
  const navigate = useNavigate();

  // 슬라이드 상태: false = 로그인, true = 회원가입
  const [rightPanel, setRightPanel] = useState(false);

  // 회원가입 폼 상태
  const [signUp, setSignUp] = useState({
    name: "",
    nickname: "",
    gender: "" as Gender,
    birth: "", // yyyy-mm-dd
    email: "",
    password: "",
    password2: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSignUp((s) => ({ ...s, [name]: value }));
  };

  // 로그인 제출
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: 로그인 API 연동 전 임시 처리
    localStorage.setItem("accessToken", "demo-token"); // ★ 추가

    await Swal.fire({
      title: "로그인 성공!",
      text: "환영합니다.",
      icon: "success",
      confirmButtonText: "확인",
      confirmButtonColor: "#a8d5ff",
    });

    // 체크리스트로 이동 (뒤로가기 시 로그인으로 안돌아오게 replace)
    navigate("/checklist", { replace: true }); // ★ 추가
  };

  // 회원가입 제출
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 기본 검증
    if (
      !signUp.name ||
      !signUp.nickname ||
      !signUp.email ||
      !signUp.password ||
      !signUp.password2
    ) {
      return Swal.fire({
        icon: "warning",
        title: "필수 항목을 모두 입력해주세요.",
        confirmButtonColor: "#a8d5ff",
      });
    }
    if (signUp.password !== signUp.password2) {
      return Swal.fire({
        icon: "error",
        title: "비밀번호가 일치하지 않습니다.",
        confirmButtonColor: "#a8d5ff",
      });
    }

    await Swal.fire({
      title: "회원가입 완료!",
      html: "Day0과 함께 떠나영~",
      icon: "success",
      confirmButtonText: "확인",
      confirmButtonColor: "#a8d5ff",
      background: "#f9f9f9",
    });

    // 로그인 화면으로 슬라이드 복귀
    setRightPanel(false);
  };

  return (
    <main className={styles.page}>
      <div
        className={`${styles.container} ${
          rightPanel ? styles["right-panel-active"] : ""
        }`}
      >
        {/* ========= Sign Up ========= */}
        <div
          className={`${styles["form-container"]} ${styles["sign-up-container"]} ${styles.bluePanel}`}
        >
          <form onSubmit={handleSignUpSubmit}>
            <h2 className={styles.panelTitle}>회원가입</h2>

            <div className={styles.form}>
              <input
                className={styles.input}
                name="name"
                value={signUp.name}
                onChange={handleChange}
                placeholder="이름"
              />

              <input
                className={styles.input}
                name="nickname"
                value={signUp.nickname}
                onChange={handleChange}
                placeholder="닉네임"
              />

              <div className={styles.inline2}>
                <select
                  className={styles.input}
                  name="gender"
                  value={signUp.gender}
                  onChange={handleChange}
                >
                  <option value="">성별(선택)</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>

                <input
                  className={styles.input}
                  type="date"
                  name="birth"
                  value={signUp.birth}
                  onChange={handleChange}
                  placeholder="생년월일"
                />
              </div>

              <input
                className={styles.input}
                type="email"
                name="email"
                value={signUp.email}
                onChange={handleChange}
                placeholder="이메일"
              />

              <input
                className={styles.input}
                type="password"
                name="password"
                value={signUp.password}
                onChange={handleChange}
                placeholder="비밀번호"
              />

              <input
                className={styles.input}
                type="password"
                name="password2"
                value={signUp.password2}
                onChange={handleChange}
                placeholder="비밀번호 확인"
              />

              <button type="submit" className={styles.cta}>
                가입하기
              </button>
            </div>
          </form>
        </div>

        {/* ========= Sign In ========= */}
        <div
          className={`${styles["form-container"]} ${styles["sign-in-container"]} ${styles.bluePanel}`}
        >
          <form onSubmit={handleSignInSubmit}>
            <h2 className={styles.panelTitle}>로그인</h2>

            <div className={styles.form}>
              <input
                className={styles.input}
                type="email"
                placeholder="이메일"
              />
              <input
                className={styles.input}
                type="password"
                placeholder="비밀번호"
              />
              <button type="submit" className={styles.cta}>
                로그인
              </button>
            </div>
          </form>
        </div>

        {/* ========= Overlay ========= */}
        <div className={styles["overlay-container"]}>
          <div className={styles.overlay}>
            <div
              className={`${styles["overlay-panel"]} ${styles["overlay-left"]}`}
            >
              <h3 className={`${styles.headline} ${styles.mtTight}`}>
                Let’s Day <span className={styles.zero}>0</span>
              </h3>
              <p className={styles.subcopy}>
                데이영에서
                <br />
                완벽한 출국 준비를 시작하세요!
              </p>

              <div className={styles.mascotBox}>
                <img
                  src={Character}
                  alt="캐릭터"
                  className={styles.mascotImg}
                />
              </div>

              <button
                type="button"
                className={styles.ghost}
                onClick={() => setRightPanel(false)}
                aria-label="로그인 화면으로"
              >
                SIGN IN
              </button>
            </div>

            <div
              className={`${styles["overlay-panel"]} ${styles["overlay-right"]}`}
            >
              <h3 className={`${styles.headline} ${styles.mtTight}`}>
                Let’s Day <span className={styles.zero}>0</span>
              </h3>
              <p className={styles.subcopy}>
                데이영에서
                <br />
                완벽한 출국 준비를 시작하세요!
              </p>

              <button
                type="button"
                className={styles.ghost}
                onClick={() => setRightPanel(true)}
                aria-label="회원가입 화면으로"
              >
                SIGN UP
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
