// The whole gallery as one HTML file, standalone/trenchcoat-gallery.html: Vite builds it as one script and one
// stylesheet with every lazy chunk and asset folded in, and both are inlined into the page. Opens from disk, no server.
//   node scripts/build-standalone.mjs   (npm run build:standalone)
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build, loadConfigFromFile, mergeConfig } from "vite";

const OUT = ".single-build";
const loaded = await loadConfigFromFile({ command: "build", mode: "production" }, "vite.config.ts");
await build(
  mergeConfig(loaded.config, {
    configFile: false,
    base: "./",
    logLevel: "warn",
    build: {
      outDir: `../${OUT}` /* relative to app/, the Vite root */,
      emptyOutDir: true,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      cssCodeSplit: false,
      modulePreload: false,
      chunkSizeWarningLimit: 1e9,
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  }),
);

try {
  const assets = join(OUT, "assets");
  const pick = (ext) => {
    const files = readdirSync(assets).filter((f) => f.endsWith(ext));
    if (files.length !== 1) throw new Error(`expected one ${ext} file in ${assets}, found ${files.length}`);
    return readFileSync(join(assets, files[0]), "utf8");
  };
  const js = pick(".js").replaceAll("</script", "<\\/script");
  const css = pick(".css");
  let html = readFileSync(join(OUT, "index.html"), "utf8");
  html = html.replace(/<script type="module" crossorigin src="[^"]+"><\/script>/, "");
  html = html.replace(/<link rel="stylesheet" crossorigin href="[^"]+">/, () => `<style>${css}</style>`);
  html = html.replace("</body>", () => `<script type="module">${js}</script>\n</body>`);
  writeFileSync("standalone/trenchcoat-gallery.html", html);
  console.log(`standalone/trenchcoat-gallery.html: ${(statSync("standalone/trenchcoat-gallery.html").size / 1e6).toFixed(1)} MB`);
} finally {
  rmSync(OUT, { recursive: true, force: true });
}
