import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves the project at https://<owner>.github.io/Rule-or-Drool/
export default defineConfig({
  base: "/Rule-or-Drool/",
  plugins: [react()],
  build: { target: "es2022", sourcemap: true },
});
