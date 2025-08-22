import { BrowserRouter, Routes, Route } from "react-router-dom";

// 페이지 import
import ChecklistPage from "./pages/Checklist/ChecklistPage";
import ExchangeRatePage from "./pages/ExchangeRate/ExchangeRatePage";
import CommunityPage from "./pages/Community/CommunityPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/checklists" element={<ChecklistPage />} />
        <Route path="/fx" element={<ExchangeRatePage />} />
        <Route path="/community" element={<CommunityPage />} />
      </Routes>
    </BrowserRouter>
  );
}
