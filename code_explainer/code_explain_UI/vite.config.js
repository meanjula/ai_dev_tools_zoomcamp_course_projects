import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

//NOTE:
//Without "@vitejs/plugin-react", Vite would not know how to:Compile JSX into JavaScript.

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    server: {
      proxy: {
        "/api": "http://localhost:3001",//fix cors issue by proxying api requests to backend server
      },
    },
  },
});
