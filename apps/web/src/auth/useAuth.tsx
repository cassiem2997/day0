import { createContext, useContext, useEffect, useState } from "react";
import { me, type MeResponse } from "../api/user";

type AuthState = { loading: boolean; user: MeResponse | null };

const AuthCtx = createContext<AuthState>({ loading: true, user: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ loading: true, user: null });

  useEffect(() => {
    let mounted = true;
    me()
      .then((u) => {
        if (mounted) setState({ loading: false, user: u });
      })
      .catch(() => {
        if (mounted) setState({ loading: false, user: null });
      });
    return () => {
      mounted = false;
    };
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
