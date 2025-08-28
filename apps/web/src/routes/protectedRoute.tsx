// src/routes/ProtectedRoute.tsx
import { useEffect, useState, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { me } from "../api/user";

type Props = { children: ReactElement };

export default function ProtectedRoute({ children }: Props) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    me()
      .then(() => {
        if (mounted) setOk(true);
      })
      .catch(() => {
        if (mounted) setOk(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (ok === null) return null; // 필요하면 스피너 표시
  if (!ok) return <Navigate to="/login" replace />;
  return children;
}
