// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactElement } from "react";

import ChecklistPage from "./pages/Checklist/ChecklistPage";
import ExchangeRatePage from "./pages/ExchangeRate/ExchangeRatePage";
import LoginPage from "./pages/Login/LoginPage";
import LandingPage from "./pages/Landing/LandingPage";
import CommunityPage from "./pages/Community/CommunityPage";
import CommunityDetail from "./pages/Community/CommunityDetail";
import CommunityWrite from "./pages/Community/CommunityWrite";
function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = localStorage.getItem("accessToken");
  if (!token) return <Navigate to="/login" replace />;
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

        {/* 커뮤니티 */}
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community/:postId"
          element={
            <ProtectedRoute>
              <CommunityDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/community/write"
          element={
            <ProtectedRoute>
              <CommunityWrite />
            </ProtectedRoute>
          }
        />

        {/* 와일드카드 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
