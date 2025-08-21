import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { PERFORMANCE_CONFIG } from "./lib/optimization-config";

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
    if (event.type === 'updated' && event.query.state.status === 'success') {
      const duration = Date.now() - event.query.state.dataUpdatedAt;
      if (duration > 100) { // Only log slow queries
        console.log(`⏱️ Slow Query: ${event.query.queryHash} took ${duration}ms`);
      }
    }
  });

  // Monitor memory usage
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      if (memory.usedJSHeapSize > PERFORMANCE_CONFIG.bundle.chunkSizeWarningLimit * 1024 * 1024) {
        console.warn(`⚠️ High memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      }
    }, 30000); // Check every 30 seconds
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
