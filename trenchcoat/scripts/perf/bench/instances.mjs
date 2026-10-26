import { open } from "./pw.mjs";
const CASES = {
  button: { exp: "Button", href: "ui-button", props: `(i) => ({ children: "Save " + i })` },
  "segmented-control": { exp: "SegmentedControl", href: "ui-segmented-control", props: `(i) => ({ "aria-label": "v" + i, defaultValue: "a", options: [{ value: "a", label: "Day" }, { value: "b", label: "Week" }, { value: "c", label: "Month" }] })` },
  "data-table": { exp: "DataTable", href: "ui-data-table", props: `(i) => ({ title: "T" + i, columns: [{ key: "name", label: "Name", type: "title" }, { key: "stage", label: "Stage", type: "tag" }, { key: "arr", label: "ARR", type: "number" }], defaultRows: Array.from({ length: 8 }, (_, j) => ({ id: "r" + j, name: "Row " + j, stage: "Lead", arr: j * 1000 })) })` },
  toaster: { exp: "Toaster", href: "ui-toaster", props: `(i) => ({ inline: true, id: "t" + i, hotkey: false })` },
};
for (const [id, c] of Object.entries(CASES)) {
  for (const n of [1, 10, 100, 1]) {
    const { browser, page, errors } = await open();
    // warm JIT for the component code with another mount? no – fresh page per n, so n=1 includes first style insert
    const r = await page.evaluate(([id, n, p, exp, href]) => window.bench.instances(id, n, eval(p), exp, href), [id, n, c.props, c.exp, c.href]);
    const r2 = await page.evaluate(([id, n, p, exp, href]) => window.bench.instances(id, n, eval(p), exp, href), [id, n, c.props, c.exp, c.href]);
    const lst = await page.evaluate(() => ({ ...window.bench.snapshot() }));
    console.log(id.padEnd(18), "n", String(n).padStart(3), "cold render", r.render.toFixed(1), "layout", r.layout.toFixed(1), "| warm render", r2.render.toFixed(1), "layout", r2.layout.toFixed(1), "| <style> for it:", r2.styleTagsForThis, "all style els", r2.allStyleEls, "| winListeners", lst.winListeners, "docListeners", lst.docListeners, JSON.stringify(lst.docByType), JSON.stringify(lst.winByType), "RO", lst.ro, "IO", lst.io, errors.length ? errors[0] : "");
    await browser.close();
    if (n === 1 && r) {}
  }
}
// CSS parse/apply cost by itself
const { browser, page } = await open();
for (const id of ["button", "segmented-control", "data-table", "toaster", "review-center", "chat-composer"]) {
  const res = await page.evaluate(async (id) => {
    const ui = window.bench.entry(id);
    await window.bench.mountDemo(id);
    const st = [...document.querySelectorAll("style[data-href]")].find((s) => s.getAttribute("data-href").startsWith("ui-" ) && document.querySelector("#host").innerHTML.includes(s.getAttribute("data-href").replace(/^ui-/, "")) ) ;
    const all = [...document.querySelectorAll("style[data-href]")];
    const css = all.at(-1).textContent;
    const times = [];
    for (let i = 0; i < 5; i++) {
      const s = document.createElement("style"); s.textContent = css + `\n/*${i}*/`;
      const t0 = performance.now(); document.head.append(s); document.body.offsetHeight; getComputedStyle(document.querySelector("#host *")).color; const t1 = performance.now();
      times.push(t1 - t0); s.remove(); document.body.offsetHeight;
    }
    window.bench.unmount();
    return { id, cssKB: css.length / 1024, href: all.at(-1).getAttribute("data-href"), ms: times.map((t) => +t.toFixed(2)) };
  }, id);
  console.log("css insert+recalc (with demo mounted)", JSON.stringify(res));
}
await browser.close();
