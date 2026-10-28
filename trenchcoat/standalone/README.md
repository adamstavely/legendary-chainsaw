# Standalone gallery

`trenchcoat-gallery.html` is the whole gallery – every component, block, demo and docs page – in one HTML file. Open
it straight from disk (double-click it); it needs no server and loads nothing from the network. Pages are addressed by
hash, e.g. `trenchcoat-gallery.html#/stories`.

It's about 18 MB (5 MB gzipped; the overview thumbnails are about 2.2 MB of it) and loads every component up front, so the first open takes a moment. It covers the
main gallery only, not `compare.html`, `measure.html` or `perf.html`.

## Rebuilding it

It's built by hand, not by an npm script: Vite builds the gallery as one script and one stylesheet, and both are
inlined into the page. From `trenchcoat/`:

1. Build into a temporary folder, with every lazy chunk folded into one script:

   ```bash
   cat > vite.single.tmp.config.ts <<'EOF'
   import { mergeConfig } from "vite";
   import base from "./vite.config";
   export default mergeConfig(base, {
     base: "./",
     build: { outDir: "../.single-build" /* relative to app/, the Vite root */, emptyOutDir: true, assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false, modulePreload: false, chunkSizeWarningLimit: 1e9, rollupOptions: { output: { inlineDynamicImports: true } } },
   });
   EOF
   npx vite build -c vite.single.tmp.config.ts && rm vite.single.tmp.config.ts
   ```

2. Inline the script and stylesheet into one page:

   ```bash
   python3 - <<'EOF'
   import re, glob
   d = ".single-build"
   h = open(f"{d}/index.html").read()
   js = open(glob.glob(f"{d}/assets/*.js")[0]).read().replace("</script", "<\\/script")
   css = open(glob.glob(f"{d}/assets/*.css")[0]).read()
   h = re.sub(r'<script type="module" crossorigin src="[^"]+"></script>', "", h)
   h = re.sub(r'<link rel="stylesheet" crossorigin href="[^"]+">', "<style>" + css + "</style>", h)
   h = h.replace("</body>", '<script type="module">' + js + "</script>\n</body>")
   open("standalone/trenchcoat-gallery.html", "w").write(h)
   EOF
   rm -rf .single-build
   ```
