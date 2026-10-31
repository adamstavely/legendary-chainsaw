// Measures 20 animated faces in headless Chromium: real frame rate, and script time per frame. Run with `npm run perf`.
import { chromium } from "playwright";
import { createServer } from "vite";

const server = await createServer({ configFile: false, root: "playground", logLevel: "silent", server: { port: 5213, strictPort: true, hmr: false, ws: false } });
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto("http://localhost:5213/stress.html");
  await page.waitForFunction(() => customElements.get("agent-face") && document.querySelectorAll("agent-face").length === 20);
  const result = await page.evaluate(async () => {
    const faces = [...document.querySelectorAll("agent-face")];
    const gaps = [];
    let last = performance.now();
    await new Promise((done) => {
      const stop = last + 4000;
      const frame = (t) => {
        gaps.push(t - last);
        last = t;
        if (t < stop) requestAnimationFrame(frame);
        else done();
      };
      requestAnimationFrame(frame);
    });
    const before = performance.now();
    const rounds = 200;
    for (let i = 0; i < rounds; i++) for (const face of faces) face.tick(16);
    const script = (performance.now() - before) / rounds;
    gaps.shift();
    gaps.sort((a, b) => a - b);
    return { faces: faces.length, fps: 1000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length), p95: gaps[Math.floor(gaps.length * 0.95)], script };
  });
  console.log(`${result.faces} faces: ${result.fps.toFixed(1)} fps, 95th percentile frame ${result.p95.toFixed(1)} ms, script ${result.script.toFixed(2)} ms per frame`);
} finally {
  await browser.close();
  await server.close();
}
