import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { createHtmlPlugin } from 'vite-plugin-html';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    createHtmlPlugin({
        inject: {
            data: {
                injectMapScript: `<script src="/offlineMap/map_loader.js"></script>`,
            },
        },
        minify: true,
    }),
  ],
  server: {
    open: true,
    host: "0.0.0.0",
    port: 5002,
  },
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
