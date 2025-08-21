import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { PERFORMANCE_CONFIG } from "./lib/optimization-config";

// Add global error handler for unhandled errors
window.addEventListener("error", (event) => {
  console.error("GLOBAL ERROR:", event.error);
  console.error("Error details:", {
    message: event.error?.message,
    stack: event.error?.stack,
    type: event.error?.constructor?.name,
  });
});

// Add global promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  console.error("UNHANDLED PROMISE REJECTION:", event.reason);
  console.error("Rejection details:", {
    message: event.reason?.message,
    stack: event.reason?.stack,
    type: event.reason?.constructor?.name,
  });
});

// Log application startup
console.log("🚀 Application starting up...");
console.log("📊 Environment:", {
  NODE_ENV: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  VITE_GRPC_WEB_PROXY_URL: import.meta.env.VITE_GRPC_WEB_PROXY_URL || "/api",
});

// Create a client with performance-optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: PERFORMANCE_CONFIG.reactQuery.staleTime,
      gcTime: PERFORMANCE_CONFIG.reactQuery.gcTime,
      retry: PERFORMANCE_CONFIG.reactQuery.retry,
      refetchOnWindowFocus: PERFORMANCE_CONFIG.reactQuery.refetchOnWindowFocus,
      refetchOnReconnect: PERFORMANCE_CONFIG.reactQuery.refetchOnReconnect,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Performance monitoring in development
if (PERFORMANCE_CONFIG.ui.enablePerformanceMonitoring) {
  // Monitor React Query performance
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === "updated" && event.query.state.status === "success") {
      const duration = Date.now() - event.query.state.dataUpdatedAt;
      if (duration > 100) {
        // Only log slow queries
        console.log(
          `⏱️ Slow Query: ${event.query.queryHash} took ${duration}ms`,
        );
      }
    }
  });

  // Start memory monitoring using the centralized memory manager
  import("@/lib/memory-utils").then(({ memoryManager }) => {
    memoryManager.startMonitoring(30000); // Check every 30 seconds
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
