import { BrowserRouter, Routes, Route } from "react-router-dom";

// 페이지 import
import ChecklistPage from "./pages/Checklist/ChecklistPage";
import ExchangeRatePage from "./pages/ExchangeRate/ExchangeRatePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/checklist" element={<ChecklistPage />} />
        <Route path="/exchange" element={<ExchangeRatePage />} />
      </Routes>
    </BrowserRouter>
  );
}
