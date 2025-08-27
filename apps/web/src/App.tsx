// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./routes/protectedRoute";

import ChecklistPage from "./pages/Checklist/ChecklistPage";
import ChecklistMakingPage from "./pages/Checklist/ChecklistMakingPage";
import ChecklistResultPage from "./pages/Checklist/ChecklistResultPage";
import ExchangeRatePage from "./pages/ExchangeRate/ExchangeRatePage";
import LoginPage from "./pages/Login/LoginPage";
import LandingPage from "./pages/Landing/LandingPage";
import SavingsPage from "./pages/Savings/SavingsPage";
import CommunityPage from "./pages/Community/CommunityPage";
import CommunityDetail from "./pages/Community/CommunityDetail";
import CommunityWrite from "./pages/Community/CommunityWrite";
import MyPage from "./pages/MyPage/MyPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 체크리스트 */}
        <Route
          path="/checklist"
          element={
            <ProtectedRoute>
              <ChecklistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checklist/new"
          element={
            <ProtectedRoute>
              <ChecklistMakingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checklist/result/:checklistId"
          element={
            <ProtectedRoute>
              <ChecklistResultPage />
            </ProtectedRoute>
          }
        />

        {/* 환율 */}
        <Route
          path="/exchange"
          element={
            <ProtectedRoute>
              <ExchangeRatePage />
            </ProtectedRoute>
          }
        />

        {/* 적금 */}
        <Route
          path="/savings"
          element={
            <ProtectedRoute>
              <SavingsPage />
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

        {/* 마이페이지 */}
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />

        {/* 와일드카드 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
