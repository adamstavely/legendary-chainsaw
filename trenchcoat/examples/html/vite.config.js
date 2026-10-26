import { defineConfig } from "vite";

// Two pages: the shared contract (index.html) and every element at once (all.html)
export default defineConfig({
  build: { rollupOptions: { input: { index: "index.html", all: "all.html" } } },
});
