import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";
import Character from "../../assets/character.svg";
import Swal from "sweetalert2";

import {
  signUp,
  login,
  type Gender,
  type SignUpPayload,
  type LoginPayload,
} from "../../api/user";
import { getHomeUniversities, type UniversityHome } from "../../api/university";

type LocalGender = "" | "MALE" | "FEMALE";

export default function LoginPage() {
  const navigate = useNavigate();

  const [rightPanel, setRightPanel] = useState(false);

  const [universities, setUniversities] = useState<UniversityHome[]>([]);
  const [uniLoading, setUniLoading] = useState(false);
  const [uniError, setUniError] = useState<string | null>(null);

  const [signUpForm, setSignUpForm] = useState({
    name: "",
    nickname: "",
    gender: "" as LocalGender,
    birth: "",
    email: "",
    password: "",
    password2: "",
    homeUniversityId: "" as "" | number,
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setUniLoading(true);
        setUniError(null);
        const list = await getHomeUniversities();
        if (!mounted) return;
        setUniversities(list);
      } catch (e: any) {
        if (!mounted) return;
        setUniError(
          e?.response?.data?.message ||
            e?.message ||
            "대학 목록을 불러오지 못했습니다."
        );
      } finally {
        if (mounted) setUniLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (rightPanel) {
      if (name === "homeUniversityId") {
        const parsed =
          value === "" ? "" : Number.isNaN(Number(value)) ? "" : Number(value);
        setSignUpForm((s) => ({ ...s, homeUniversityId: parsed as any }));
      } else {
        setSignUpForm((s) => ({ ...s, [name]: value }));
      }
    } else {
      setLoginForm((s) => ({ ...s, [name]: value }));
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!loginForm.email || !loginForm.password) {
      return Swal.fire({
        icon: "warning",
        title: "이메일과 비밀번호를 입력해주세요.",
        confirmButtonColor: "#a8d5ff",
      });
    }

    try {
      setSubmitting(true);

      const payload: LoginPayload = {
        email: loginForm.email.trim(),
        password: loginForm.password,
      };

      const res = await login(payload);

      await Swal.fire({
        title: "로그인 성공!",
        text: res?.message || "환영합니다.",
        icon: "success",
        confirmButtonText: "확인",
        confirmButtonColor: "#a8d5ff",
      });

      navigate("/checklist", { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "로그인 중 오류가 발생했습니다.";
      Swal.fire({
        icon: "error",
        title: "로그인 실패",
        text: message,
        confirmButtonColor: "#a8d5ff",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (
      !signUpForm.name ||
      !signUpForm.nickname ||
      !signUpForm.email ||
      !signUpForm.password ||
      !signUpForm.password2
    ) {
      return Swal.fire({
        icon: "warning",
        title: "필수 항목을 모두 입력해주세요.",
        confirmButtonColor: "#a8d5ff",
      });
    }
    if (signUpForm.password !== signUpForm.password2) {
      return Swal.fire({
        icon: "error",
        title: "비밀번호가 일치하지 않습니다.",
        confirmButtonColor: "#a8d5ff",
      });
    }
    if (
      signUpForm.homeUniversityId === "" ||
      signUpForm.homeUniversityId == null
    ) {
      return Swal.fire({
        icon: "warning",
        title: "재학중인 대학교를 선택해주세요.",
        confirmButtonColor: "#a8d5ff",
      });
    }

    const payload: SignUpPayload = {
      name: signUpForm.name.trim(),
      nickname: signUpForm.nickname.trim(),
      email: signUpForm.email.trim(),
      password: signUpForm.password,
      gender: (signUpForm.gender || "MALE") as Gender,
      birth: signUpForm.birth,
      homeUniversityId: Number(signUpForm.homeUniversityId),
    };

    try {
      setSubmitting(true);
      await signUp(payload);
      await Swal.fire({
        title: "회원가입 완료!",
        html: "Day0과 함께 떠나영~",
        icon: "success",
        confirmButtonText: "확인",
        confirmButtonColor: "#a8d5ff",
        background: "#f9f9f9",
      });
      setRightPanel(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "회원가입 중 오류가 발생했습니다.";
      Swal.fire({
        icon: "error",
        title: "회원가입 실패",
        text: message,
        confirmButtonColor: "#a8d5ff",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div
        className={`${styles.container} ${
          rightPanel ? styles["right-panel-active"] : ""
        }`}
      >
        <div
          className={`${styles["form-container"]} ${styles["sign-up-container"]} ${styles.bluePanel}`}
        >
          <form onSubmit={handleSignUpSubmit}>
            <h2 className={styles.panelTitle}>회원가입</h2>

            <div className={styles.form}>
              <input
                className={styles.input}
                name="name"
                value={signUpForm.name}
                onChange={handleChange}
                placeholder="이름"
              />

              <input
                className={styles.input}
                name="nickname"
                value={signUpForm.nickname}
                onChange={handleChange}
                placeholder="닉네임"
              />

              <div className={styles.inline2}>
                <select
                  className={styles.input}
                  name="gender"
                  value={signUpForm.gender}
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
                  value={signUpForm.birth}
                  onChange={handleChange}
                  placeholder="생년월일"
                />
              </div>

              <select
                className={styles.input}
                name="homeUniversityId"
                value={String(signUpForm.homeUniversityId)}
                onChange={handleChange}
                disabled={uniLoading || !!uniError}
              >
                <option value="">
                  {uniLoading
                    ? "대학 목록 불러오는 중..."
                    : uniError
                    ? "목록을 불러오지 못했습니다"
                    : "대학교 선택"}
                </option>
                {universities.map((u) => (
                  <option key={u.universityId} value={u.universityId}>
                    {u.name}
                  </option>
                ))}
              </select>

              <input
                className={styles.input}
                type="email"
                name="email"
                value={signUpForm.email}
                onChange={handleChange}
                placeholder="이메일"
              />

              <input
                className={styles.input}
                type="password"
                name="password"
                value={signUpForm.password}
                onChange={handleChange}
                placeholder="비밀번호"
              />

              <input
                className={styles.input}
                type="password"
                name="password2"
                value={signUpForm.password2}
                onChange={handleChange}
                placeholder="비밀번호 확인"
              />

              <button
                type="submit"
                className={styles.cta}
                disabled={submitting || uniLoading}
                aria-busy={submitting || uniLoading}
              >
                {submitting ? "가입 중..." : "가입하기"}
              </button>
            </div>
          </form>
        </div>

        <div
          className={`${styles["form-container"]} ${styles["sign-in-container"]} ${styles.bluePanel}`}
        >
          <form onSubmit={handleSignInSubmit}>
            <h2 className={styles.panelTitle}>로그인</h2>

            <div className={styles.form}>
              <input
                className={styles.input}
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleChange}
                placeholder="이메일"
              />
              <input
                className={styles.input}
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleChange}
                placeholder="비밀번호"
              />
              <button
                type="submit"
                className={styles.cta}
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? "로그인 중..." : "로그인"}
              </button>
            </div>
          </form>
        </div>

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
