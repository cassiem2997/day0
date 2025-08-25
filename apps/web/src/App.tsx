// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactElement } from "react";

// 페이지 import
import ChecklistPage from "./pages/Checklist/ChecklistPage";
import ExchangeRatePage from "./pages/ExchangeRate/ExchangeRatePage";
import LoginPage from "./pages/Login/LoginPage";
import LandingPage from "./pages/Landing/LandingPage";
import SavingsPage from "./pages/Savings/SavingsPage";
import CommunityPage from "./pages/Community/CommunityPage";

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
        <Route path="/" element={<LandingPage />} />
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
        <Route
          path="/savings"
          element={
            <ProtectedRoute>
              <SavingsPage />
            </ProtectedRoute>
          }
        />

        {/* 추가된 헤더 메뉴 라우트 */}
     
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          }
        />
       

        {/* 와일드카드 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
