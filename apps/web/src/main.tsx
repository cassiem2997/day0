import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx"; 
import "./global.css"
import { AuthProvider } from "./auth/useAuth";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
