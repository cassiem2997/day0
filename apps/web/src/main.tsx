import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx"; // 네가 방금 만든 App 컴포넌트

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
