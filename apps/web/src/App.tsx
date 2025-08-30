import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import ProtectedRoute from "./routes/protectedRoute";
import ChecklistPage from "./pages/Checklist/ChecklistPage";
import ChecklistMakingPage from "./pages/Checklist/ChecklistMakingPage";
import ChecklistEditPage from "./pages/Checklist/ChecklistEditPage";
import ChecklistResultPage from "./pages/Checklist/ChecklistResultPage";
import ChecklistCurrentPage from "./pages/ChecklistCurrent/ChecklistCurrentPage";
import CalendarPage from "./pages/Calendar/CalendarPage";
import ExchangeRatePage from "./pages/ExchangeRate/ExchangeRatePage";
import LoginPage from "./pages/Login/LoginPage";
import LandingPage from "./pages/Landing/LandingPage";
import SavingsPage from "./pages/Savings/SavingsPage";
import SavingsPlanPage from "./pages/Savings/SavingsPlanPage";
import SavingPlan from "./pages/Savings/SavingPlan";

import CommunityPage from "./pages/Community/CommunityPage";
import CommunityDetail from "./pages/Community/CommunityDetail";
import CommunityWrite from "./pages/Community/CommunityWrite";
import MyPage from "./pages/MyPage/MyPage";

import FxAlertToaster from "./components/FxAlertToaster/FxAlertToaster";
import { me, type MeResponse } from "./api/user";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";

export default function App() {
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    me()
      .then((res: MeResponse) => {
        if (res?.userId) setUserId(res.userId);
      })
      .catch(() => {
        setUserId(null);
      });
  }, []);

  return (
    <BrowserRouter>
      {userId && <FxAlertToaster userId={String(userId)} autoCloseMs={0} />}

      <Routes>
        {/* 공개 라우트 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />

        {/* 체크리스트 */}
        <Route
          path="/checklist"
          element={<Navigate to="/checklist/current" replace />}
        />
        <Route
          path="/checklist/current"
          element={
            <ProtectedRoute>
              <ChecklistCurrentPage />
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
          path="/checklist/edit/:userChecklistId"
          element={
            <ProtectedRoute>
              <ChecklistEditPage />
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

        {/* 달력 */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
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
          path="/savings/create"
          element={<Navigate to="/savings/plan" replace />}
        />
        <Route
          path="/savings/:planId"
          element={
            <ProtectedRoute>
              <SavingsPage />
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
        <Route
          path="/savings/plan"
          element={
            <ProtectedRoute>
              <SavingsPlanPage />
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
