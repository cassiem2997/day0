// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactElement /* or ReactNode */ } from "react";

// 페이지 import
import LandingHero from "./pages/Landing/LandingHero";
import ChecklistPage from "./pages/Checklist/ChecklistPage";
import ExchangeRatePage from "./pages/ExchangeRate/ExchangeRatePage";
import LoginPage from "./pages/Login/LoginPage";

// 간단 보호 라우트 (토큰 유무로 판별 예시)
// children 타입을 ReactElement로!
function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = localStorage.getItem("accessToken"); // 프로젝트 규칙에 맞게 변경
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/" element={<LandingHero />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 보호 라우트 */}
        <Route
          path="/checklist"
          element={
            <ProtectedRoute>
              <ChecklistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exchange"
          element={
            <ProtectedRoute>
              <ExchangeRatePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
