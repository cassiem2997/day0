import { BrowserRouter, Routes, Route } from "react-router-dom";

// 페이지 import
import ChecklistPage from "./pages/Checklist/ChecklistPage";
import ExchangeRatePage from "./pages/ExchangeRate/ExchangeRatePage";
import LoginPage from "./pages/Login/LoginPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/checklist" element={<ChecklistPage />} />
        <Route path="/exchange" element={<ExchangeRatePage />} />
        <Route path="/main" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
