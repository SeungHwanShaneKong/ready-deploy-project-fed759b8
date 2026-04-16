import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // [CL-BASE-FIX-20260416-134500] Lovable 프리뷰는 "/" 필수. GitHub Pages 배포 시 deploy.yml에서 base 오버라이드.
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  define: {
    ...(process.env.VITE_SUPABASE_URL ? {} : {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://tnboeqtdimyxpjzsraro.supabase.co"),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuYm9lcXRkaW15eHBqenNyYXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzE4MDcsImV4cCI6MjA4NDgwNzgwN30.vW3bVRKZ91key-JpysigzC96qa96DqqFE47CLs6Nhj0"),
      'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify("tnboeqtdimyxpjzsraro"),
    }),
  },
  build: {
    target: "esnext",
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
});
