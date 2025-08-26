import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// Type declaration for Materialize global
declare global {
  interface Window {
    M?: {
      AutoInit: () => void;
    };
  }
}

// Materialize CSS initialization
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Materialize components
  if (typeof window !== "undefined" && window.M?.AutoInit) {
    window.M.AutoInit();
  }
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
