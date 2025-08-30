import { useEffect, useState, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { me } from "../api/user";

type Props = { children: ReactElement };

export default function ProtectedRoute({ children }: Props) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    console.log("[ProtectedRoute] checking session via /auth/me ...");
    me()
      .then((res) => {
        if (!mounted) return;
        console.log("[ProtectedRoute] /auth/me OK:", res);
        setOk(true);
      })
      .catch((err) => {
        if (!mounted) return;
        console.warn("[ProtectedRoute] /auth/me FAIL:", err);
        setOk(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (ok === null) {
    // 로딩 동안은 children을 막고 깜빡임 방지
    return null;
  }
  if (!ok) {
    console.warn("[ProtectedRoute] not authed → /login");
    return <Navigate to="/login" replace />;
  }
  return children;
}
