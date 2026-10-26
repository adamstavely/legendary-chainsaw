// Dev-only page for scripts/measure-lit.mjs: the same large-data measurements on the React component and its Lit
// port, in one page, so both run on the same machine and browser session. Results go to window.__results.
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import "../../tokens/tokens.css";
import { Button as ReactButton } from "../../src/components/button";
import { Combobox as ReactCombobox } from "../../src/components/combobox";
import { DataTable as ReactDataTable } from "../../src/components/data-table";
import "../../src/elements/button";
import "../../src/elements/combobox";
import "../../src/elements/data-table";
import type { TcCombobox } from "../../src/elements/combobox";
import type { TcDataTable } from "../../src/elements/data-table";

const host = document.getElementById("host")!;
const frame = () => new Promise<number>((r) => requestAnimationFrame(() => r(performance.now())));
const settle = async () => {
  await frame();
  await frame();
};
const columns = [
  { key: "name", label: "Company", type: "title" as const },
  { key: "stage", label: "Stage", type: "tag" as const },
  { key: "arr", label: "ARR", type: "number" as const },
];
const rows = Array.from({ length: 10000 }, (_, i) => ({ id: `r${i}`, name: `Company ${i}`, stage: i % 2 ? "Won" : "Lead", arr: i }));
const options = Array.from({ length: 5000 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }));

/** Scroll the page 10 × 1,500 px; the slowest frame */
async function scrollFrames() {
  let worst = 0;
  for (let i = 0; i < 10; i++) {
    const t = performance.now();
    window.scrollBy(0, 1500);
    worst = Math.max(worst, (await frame()) - t);
    await frame();
  }
  window.scrollTo(0, 0);
  return worst;
}
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

async function run() {
  const out: Record<string, number> = {};
  const reset = async () => {
    host.replaceChildren();
    await settle();
  };

  // data-table, 10,000 rows: mount to first frame, then scrolling
  {
    const div = document.createElement("div");
    host.append(div);
    const root = createRoot(div);
    const t = performance.now();
    flushSync(() => root.render(<ReactDataTable title="Many" columns={columns} defaultRows={rows} />));
    out["react data-table 10k mount"] = (await frame()) - t;
    out["react data-table 10k scroll worst frame"] = await scrollFrames();
    root.unmount();
    await reset();
  }
  {
    const el = document.createElement("tc-data-table") as TcDataTable;
    el.heading = "Many";
    el.columns = columns;
    el.rows = rows;
    const t = performance.now();
    host.append(el);
    await el.updateComplete;
    out["lit data-table 10k mount"] = (await frame()) - t;
    out["lit data-table 10k scroll worst frame"] = await scrollFrames();
    await reset();
  }

  // combobox, 5,000 options: opening the list
  {
    const div = document.createElement("div");
    host.append(div);
    const root = createRoot(div);
    flushSync(() => root.render(<ReactCombobox label="Many" options={options} />));
    await settle();
    const input = div.querySelector("input[role=combobox]")!;
    const t = performance.now();
    flushSync(() => key(input, "ArrowDown"));
    out["react combobox 5k open"] = (await frame()) - t;
    root.unmount();
    await reset();
  }
  {
    const el = document.createElement("tc-combobox") as TcCombobox;
    el.label = "Many";
    el.options = options;
    host.append(el);
    await settle();
    const input = el.querySelector("input[role=combobox]")!;
    const t = performance.now();
    key(input, "ArrowDown");
    await el.updateComplete;
    out["lit combobox 5k open"] = (await frame()) - t;
    await reset();
  }

  // button: 100 instances, per instance
  {
    const div = document.createElement("div");
    host.append(div);
    const root = createRoot(div);
    const t = performance.now();
    flushSync(() => root.render(<>{Array.from({ length: 100 }, (_, i) => <ReactButton key={i}>{`Button ${i}`}</ReactButton>)}</>));
    out["react button ×100 per instance"] = ((await frame()) - t) / 100;
    root.unmount();
    await reset();
  }
  {
    const wrap = document.createElement("div");
    for (let i = 0; i < 100; i++) {
      const b = document.createElement("tc-button");
      b.setAttribute("label", `Button ${i}`);
      wrap.append(b);
    }
    const t = performance.now();
    host.append(wrap);
    await Promise.all([...wrap.children].map((b) => (b as unknown as { updateComplete: Promise<unknown> }).updateComplete));
    out["lit button ×100 per instance"] = ((await frame()) - t) / 100;
    await reset();
  }
  return out;
}

(window as unknown as { __run: () => Promise<Record<string, number>> }).__run = run;
