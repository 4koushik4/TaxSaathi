import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

export default defineConfig((configEnv) => {
  // Read environment variables with safe runtime guards
  const supabaseUrl = (typeof process !== "undefined" && process.env && process.env.VITE_REACT_SUPABASE_URL) || "";
  const supabaseKey = (typeof process !== "undefined" && process.env && process.env.VITE_REACT_SUPABASE_ANON_KEY) || "";

  return {
    define: {
      __SUPABASE_URL__: JSON.stringify(supabaseUrl),
      __SUPABASE_KEY__: JSON.stringify(supabaseKey),
    },
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      outDir: "dist/spa",
    },
    plugins: [react(), expressPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

function expressPlugin() {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}