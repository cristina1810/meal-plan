// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./routes.jsx";
import { AuthProvider } from "./context/AuthContext";
import { StoreProvider } from "./context/useGlobalReducer";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </AuthProvider>
  </React.StrictMode>
);
