import { useState } from "react";
import styles from "./LoginPage.module.css";
import Character from "../../assets/character.svg"; // PNG로 바꿔도 동일하게 사용 가능
import Swal from "sweetalert2";

export default function LoginPage() {
  // false: 로그인 화면, true: 회원가입 화면
  const [rightPanel, setRightPanel] = useState(false);

  // 로그인 제출
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 로그인 API 연동
    console.log("로그인 요청");

    Swal.fire({
      title: "로그인 성공!",
      text: "환영합니다!",
      icon: "success",
      confirmButtonText: "확인",
      confirmButtonColor: "#a8d5ff",
    });
  };

  // 회원가입 제출 -> 성공 가정 후 로그인 화면으로 슬라이드 복귀
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 회원가입 API 연동
    console.log("회원가입 요청");

    // 성공 모달
    Swal.fire({
      title: "회원가입 성공!",
      html: "로그인 후 <b style='color:green;'>서비스</b>를 이용해주세요.",
      icon: "success",
      confirmButtonText: "확인",
      confirmButtonColor: "#a8d5ff",
      background: "#f9f9f9",
    });

    // 성공 시 슬라이드 복귀
    setRightPanel(false);
  };

  return (
    <main className={styles.page}>
      <div
        id="container"
        className={`${styles.container} ${
          rightPanel ? styles["right-panel-active"] : ""
        }`}
      >
        {/* ============ Sign Up (우측 파란 패널) ============ */}
        <div
          className={`${styles["form-container"]} ${styles["sign-up-container"]} ${styles.bluePanel}`}
        >
          <form onSubmit={handleSignUpSubmit}>
            <h2 className={styles.panelTitle}>회원가입</h2>
            <div className={styles.form}>
              <input className={styles.input} type="text" placeholder="이름" />
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
              <input
                className={styles.input}
                type="password"
                placeholder="비밀번호 확인"
              />
              <button type="submit" className={styles.cta}>
                가입하기
              </button>
            </div>
          </form>
        </div>

        {/* ============ Sign In (좌측 파란 패널) ============ */}
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

        {/* ============ Overlay (흰 배경 카피) ============ */}
        <div className={styles["overlay-container"]}>
          <div className={styles.overlay}>
            {/* 회원가입 상태에서 보이는 좌측 (캐릭터 포함) */}
            <div
              className={`${styles["overlay-panel"]} ${styles["overlay-left"]}`}
            >
              <h3 className={styles.headline}>Let’s Day O</h3>
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
                sign in
              </button>
            </div>

            {/* 로그인 상태에서 보이는 우측 (가입 유도) */}
            <div
              className={`${styles["overlay-panel"]} ${styles["overlay-right"]}`}
            >
              <h3 className={styles.headline}>Let’s Day O</h3>
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
                sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
