import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    cors: true,
    hmr: {
      overlay: true,
    },
    // Enhanced logging for all server events
    middlewareMode: false,
    fs: {
      strict: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, ""),
        configure: (proxy) => {
          // Enhanced error logging
          proxy.on("error", (err, req, res) => {
            console.error("🔴 PROXY ERROR:", err);
            console.error("🔴 Request details:", {
              method: req.method,
              url: req.url,
              headers: req.headers,
            });

            // Send a more helpful error response
            if (!res.headersSent) {
              res.writeHead(500, {
                "Content-Type": "application/json",
              });
              res.end(
                JSON.stringify({
                  error: "Proxy Error",
                  message: err.message,
                  name: err.name,
                }),
              );
            }
          });

          // Detailed request logging
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("🔵 PROXY REQUEST:", req.method, req.url);
            console.log("🔵 Headers:", JSON.stringify(req.headers, null, 2));
          });

          // Detailed response logging
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("🟢 PROXY RESPONSE:", proxyRes.statusCode, req.url);
            console.log(
              "🟢 Response headers:",
              JSON.stringify(proxyRes.headers, null, 2),
            );
          });
        },
        // Important settings for gRPC-Web streaming
        ws: true,
        timeout: 0,
      },
    },
  },
  build: {
    target: "esnext",
    rollupOptions: {
      external: ["google-protobuf/google-protobuf.js"],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          web3: ["wagmi", "viem"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-toast",
          ],
          utils: ["clsx", "class-variance-authority", "tailwind-merge"],
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  ssr: {
    noExternal: ["google-protobuf", "grpc-web"],
  },
  // Performance optimizations
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
