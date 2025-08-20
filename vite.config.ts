import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execSync } from "child_process";

// Get git commit hash
const getGitCommitHash = (): string => {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch (error) {
    console.warn("Could not get git commit hash:", error);
    return "unknown";
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["google-protobuf", "grpc-web"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    rollupOptions: {
      external: ["google-protobuf/google-protobuf.js"],
    },
  },
  define: {
    global: "globalThis",
    // Inject git commit hash as environment variable
    "import.meta.env.VITE_GIT_COMMIT_HASH": JSON.stringify(getGitCommitHash()),
  },
  ssr: {
    noExternal: ["google-protobuf", "grpc-web"],
  },
}));
