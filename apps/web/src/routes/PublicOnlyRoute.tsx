// src/routes/PublicOnlyRoute.tsx
import { useEffect, useState, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { me } from "../api/user";

type Props = { children: ReactElement };

export default function PublicOnlyRoute({ children }: Props) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    me()
      .then(() => {
        if (mounted) setOk(true);  // 로그인 O
      })
      .catch(() => {
        if (mounted) setOk(false); // 로그인 X
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (ok === null) return null; // 스피너 표시 가능

  if (ok) return <Navigate to="/checklist" replace />; 
  return children; // 로그인 안 한 경우만 children(로그인 페이지) 렌더링
}
