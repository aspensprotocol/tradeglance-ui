import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development',
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['google-protobuf', 'grpc-web'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['google-protobuf/google-protobuf.js'],
    },
  },
  define: {
    global: 'globalThis',
  },
  ssr: {
    noExternal: ['google-protobuf', 'grpc-web']
  },
}));
