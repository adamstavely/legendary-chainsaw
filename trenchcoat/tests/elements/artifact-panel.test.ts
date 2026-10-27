/*
 * <tc-artifact-panel> in real browsers: the list (listbox), previews per type, versions (radio group), Compare,
 * Download with its default save, writing artifacts, focus, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/artifact-panel";
import { artifactTableFromCsv, artifactTableToCsv, type Artifact, type ArtifactDownload, type TcArtifactPanel } from "../../src/elements/artifact-panel";
import type { TcCodeBlock } from "../../src/elements/code-block";
import { ArtifactPanel } from "../../src/elements/react/artifact-panel";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const PIXEL = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20'%3E%3Crect width='40' height='20' fill='%232f68ff'/%3E%3C/svg%3E";
const PIXEL2 = PIXEL.replace("2f68ff", "a3a3a3");

const artifacts = (): Artifact[] => [
  {
    id: "report",
    name: "report.md",
    kind: "text",
    size: "2 KB",
    versions: [
      { id: "r1", time: "9 min ago", content: "# Churn\n\nChurn rose in Q3.\n\n- Starter teams churn most" },
      { id: "r2", time: "2 min ago", note: "Tightened", content: "# Churn\n\nChurn rose sharply in Q3.\n\n- Starter teams churn most\n- Annual plans were flat" },
    ],
  },
  { id: "code", name: "plot.py", kind: "code", language: "py", versions: [{ id: "c1", content: "import pandas as pd\nprint(1)\n" }, { id: "c2", content: "import pandas as pd\nprint(2)\n" }] },
  { id: "table", name: "plans.csv", kind: "table", versions: [{ id: "t1", content: "Plan,Teams\nStarter,1840\nTeam,920\n" }, { id: "t2", content: { columns: ["Plan", "Teams"], rows: [["Starter", 1210], ["Team", 920], ["Business", 310]] } }] },
  { id: "chart", name: "chart.png", kind: "image", alt: "Retention chart", versions: [{ id: "i1", content: PIXEL2 }, { id: "i2", content: PIXEL }] },
];

const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const chips = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const compare = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-artp__btn--toggle")!;
const download = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-artp__bar > .ui-artp__btn")!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
const axeRun = (node: Element) => axe.run(node, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });

describe("tc-artifact-panel", () => {
  test("the host is the root and a region named by the heading; a name the page gives stays", async () => {
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel .artifacts=${artifacts()}></tc-artifact-panel>`);
    expect(el.dataset.ui).toBe("artp");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Artifacts");
    el.heading = "Run outputs";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Run outputs");
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Run outputs");
    const named = await fixture<TcArtifactPanel>(html`<tc-artifact-panel aria-label="Files" .artifacts=${artifacts()}></tc-artifact-panel>`);
    expect(named.getAttribute("aria-label")).toBe("Files");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the caption sits on the tray (Standard) or is the card's last row (Clean)`, async () => {
      const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel look=${look} .artifacts=${artifacts()}></tc-artifact-panel>`);
      expect(el.dataset.look).toBe(look);
      const foot = el.querySelector(".ui-artp__foot")!;
      expect(foot.parentElement === el).toBe(look === "standard");
      expect(foot.textContent!.trim()).toBe("4 files · 8 versions");
      expect(el.querySelector(".ui-artp__count")!.textContent).toBe("4");
    });
  }

  test("the list: a listbox, the first artifact picked; names, kinds, sizes and versions", async () => {
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel .artifacts=${artifacts()}></tc-artifact-panel>`);
    const box = el.querySelector('[role="listbox"]')!;
    expect(box.getAttribute("aria-label")).toBe("Files");
    const opts = options(el);
    expect(opts.map((o) => o.getAttribute("aria-selected"))).toEqual(["true", "false", "false", "false"]);
    expect(opts.map((o) => o.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(opts[0].querySelector(".ui-artp__ometa")!.textContent!.trim()).toBe("Document · 2 KB · 2 versions");
    expect(opts[1].querySelector(".ui-artp__ometa")!.textContent!.trim()).toBe("Python · 2 versions");
    expect(el.querySelector(".ui-artp__pname")!.textContent).toBe("report.md");
  });

  test("picking: click and keys (arrows, Home, End, type-ahead) move selection and focus; preventDefault keeps it", async () => {
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel .artifacts=${artifacts()}></tc-artifact-panel>`);
    const picked: string[] = [];
    el.addEventListener("tc-selected-change", (e) => picked.push((e as CustomEvent).detail.id));
    options(el)[2].click();
    await settle();
    expect(el.selected).toBe("table");
    expect(document.activeElement).toBe(options(el)[2]);
    key(options(el)[2], "ArrowDown");
    await settle();
    expect(el.selected).toBe("chart");
    expect(document.activeElement).toBe(options(el)[3]);
    key(document.activeElement!, "Home");
    await settle();
    expect(el.selected).toBe("report");
    key(document.activeElement!, "End");
    await settle();
    expect(el.selected).toBe("chart");
    key(document.activeElement!, "ArrowUp");
    await settle();
    expect(el.selected).toBe("table");
    key(document.activeElement!, "p");
    await settle();
    expect(el.selected).toBe("code");
    expect(picked).toEqual(["table", "chart", "report", "chart", "table", "code"]);
    expect(options(el).map((o) => o.tabIndex)).toEqual([-1, 0, -1, -1]);
    // Controlled
    el.addEventListener("tc-selected-change", (e) => e.preventDefault(), { once: true });
    options(el)[0].click();
    await settle();
    expect(el.selected).toBe("code");
  });

  test("previews: a document, code in a tc-code-block, an image, a table (from CSV text too)", async () => {
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel .artifacts=${artifacts()}></tc-artifact-panel>`);
    const docEl = el.querySelector(".ui-artp__doc")!;
    expect(docEl.getAttribute("role")).toBe("region");
    expect(docEl.getAttribute("aria-label")).toBe("report.md");
    expect(docEl.querySelector('.ui-artp__h[data-level="1"]')!.textContent).toBe("Churn");
    expect([...docEl.querySelectorAll("li")].map((l) => l.textContent)).toEqual(["Starter teams churn most", "Annual plans were flat"]);
    el.selected = "code";
    await settle();
    const block = el.querySelector<TcCodeBlock>("tc-code-block")!;
    expect(block.language).toBe("py");
    expect(block.code).toBe("import pandas as pd\nprint(2)\n");
    expect(block.bare).toBe(true);
    expect(block.querySelector(".ui-cblk__t-k")!.textContent).toBe("import");
    el.selected = "chart";
    await settle();
    const img = el.querySelector("img")!;
    expect(img.getAttribute("alt")).toBe("Retention chart");
    expect(img.getAttribute("src")).toBe(PIXEL);
    el.selected = "table";
    el.version = "t1";
    await settle();
    expect([...el.querySelectorAll("th")].map((t) => t.textContent)).toEqual(["Plan", "Teams"]);
    expect([...el.querySelectorAll("tbody tr")].map((r) => r.textContent!.trim())).toEqual(["Starter1840", "Team920"]);
    el.version = "";
    await settle();
    expect(el.querySelector("tbody td[data-num]")!.textContent).toBe("1210");
  });

  test("versions: a radio group with the latest checked; clicks and arrows pick one; another artifact goes back to its latest", async () => {
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel .artifacts=${artifacts()}></tc-artifact-panel>`);
    const group = el.querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute("aria-label")).toBe("Versions");
    expect(chips(el).map((c) => c.getAttribute("aria-checked"))).toEqual(["false", "true"]);
    expect(chips(el)[1].getAttribute("aria-label")).toBe("v2, 2 min ago, Tightened, latest");
    expect(el.querySelector(".ui-artp__pmeta")!.textContent).toBe("v2 · 2 min ago · Tightened");
    const got: unknown[] = [];
    el.addEventListener("tc-version-change", (e) => got.push((e as CustomEvent).detail));
    chips(el)[0].click();
    await settle();
    expect(el.version).toBe("r1");
    expect(chips(el).map((c) => c.tabIndex)).toEqual([0, -1]);
    expect(el.querySelector(".ui-artp__p")!.textContent).toBe("Churn rose in Q3.");
    chips(el)[0].focus();
    key(chips(el)[0], "ArrowRight");
    await settle();
    expect(el.version).toBe("");
    expect(document.activeElement).toBe(chips(el)[1]);
    key(chips(el)[1], "ArrowRight");
    await settle();
    expect(el.version).toBe("r1");
    expect(got).toEqual([
      { artifact: "report", version: "r1" },
      { artifact: "report", version: "" },
      { artifact: "report", version: "r1" },
    ]);
    options(el)[1].click();
    await settle();
    expect(got.at(-1)).toEqual({ artifact: "code", version: "" });
    expect(el.version).toBe("");
    // An artifact with one version has no chips and no Compare
    el.artifacts = [{ id: "one", name: "one.txt", kind: "text", versions: [{ id: "x", content: "Hello" }] }];
    await settle();
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();
    expect(el.querySelector(".ui-artp__btn--toggle")).toBeNull();
  });

  test("Compare: off on the first version; a word diff for text with Added/Removed in words; cancelable", async () => {
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel .artifacts=${artifacts()} version="r1"></tc-artifact-panel>`);
    expect(compare(el).disabled).toBe(true);
    el.version = "";
    await settle();
    expect(compare(el).disabled).toBe(false);
    expect(compare(el).getAttribute("aria-pressed")).toBe("false");
    const views: string[] = [];
    el.addEventListener("tc-view-change", (e) => views.push((e as CustomEvent).detail.view));
    compare(el).click();
    await settle();
    expect(views).toEqual(["diff"]);
    expect(el.view).toBe("diff");
    expect(compare(el).getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".ui-artp__since")!.textContent).toBe("since v1");
    const docEl = el.querySelector(".ui-artp__doc")!;
    expect(docEl.getAttribute("aria-label")).toBe("Changes to report.md");
    expect(docEl.querySelector("ins")!.textContent).toBe("Added: sharply ");
    expect(docEl.querySelector('[data-kind="added"]')!.textContent).toBe("Added: Annual plans were flat");
    expect(docEl.querySelector('[data-kind="added"]')!.classList.contains("ui-artp__li")).toBe(true);
    el.addEventListener("tc-view-change", (e) => e.preventDefault(), { once: true });
    compare(el).click();
    await settle();
    expect(el.view).toBe("diff");
  });

  test("Compare: code through tc-code-block's line diff, table rows added and removed, images before and after", async () => {
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel view="diff" selected="code" .artifacts=${artifacts()}></tc-artifact-panel>`);
    const block = el.querySelector<TcCodeBlock>("tc-code-block")!;
    expect(block.view).toBe("diff");
    await settle();
    expect([...block.querySelectorAll(".ui-cblk__row[data-kind]")].map((r) => r.getAttribute("data-kind"))).toEqual(["same", "removed", "added"]);
    // The block's own view event never reaches the panel's listeners
    const leaked = vi.fn();
    el.addEventListener("tc-view-change", leaked);
    block.dispatchEvent(new CustomEvent("tc-view-change", { detail: { view: "code" }, bubbles: true, composed: true, cancelable: true }));
    expect(leaked).not.toHaveBeenCalled();
    el.selected = "table";
    await settle();
    const rows = [...el.querySelectorAll<HTMLElement>("tbody tr")];
    expect(rows.map((r) => r.dataset.kind)).toEqual(["removed", "added", "same", "added"]);
    expect(rows[0].textContent).toContain("Removed row: Starter");
    expect(rows[3].textContent).toContain("Added row: Business");
    el.selected = "chart";
    await settle();
    const figs = [...el.querySelectorAll("figure")];
    expect(figs.map((f) => f.querySelector("figcaption")!.textContent)).toEqual(["Before · v1", "After · v2"]);
    expect(figs.map((f) => f.querySelector("img")!.getAttribute("src"))).toEqual([PIXEL2, PIXEL]);
  });

  test("Download fires tc-download and, unless prevented, saves a Blob (text, CSV) or the image's URL", async () => {
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel .artifacts=${artifacts()}></tc-artifact-panel>`);
    const blobs: Blob[] = [];
    vi.spyOn(URL, "createObjectURL").mockImplementation((b) => (blobs.push(b as Blob), "blob:test"));
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clicks: { href: string; download: string }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push({ href: this.getAttribute("href")!, download: this.download });
    });
    const got: ArtifactDownload[] = [];
    el.addEventListener("tc-download", (e) => got.push((e as CustomEvent<ArtifactDownload>).detail));
    expect(download(el).getAttribute("aria-label")).toBe("Download report.md");
    download(el).click();
    expect(got[0].artifact.id).toBe("report");
    expect(got[0].version.id).toBe("r2");
    expect(clicks).toEqual([{ href: "blob:test", download: "report.md" }]);
    expect(blobs[0].type).toBe("text/markdown;charset=utf-8");
    expect(await blobs[0].text()).toContain("Churn rose sharply in Q3.");
    el.selected = "table";
    await settle();
    download(el).click();
    expect(blobs[1].type).toBe("text/csv;charset=utf-8");
    expect(await blobs[1].text()).toBe("Plan,Teams\nStarter,1210\nTeam,920\nBusiness,310\n");
    el.selected = "chart";
    await settle();
    download(el).click();
    expect(clicks.at(-1)).toEqual({ href: PIXEL, download: "chart.png" });
    // Prevented: the app saves it its own way
    el.addEventListener("tc-download", (e) => e.preventDefault(), { once: true });
    download(el).click();
    expect(clicks).toHaveLength(3);
    expect(got).toHaveLength(4);
  });

  test("an artifact being written says so in the list and streams into its preview", async () => {
    const list = artifacts();
    list[1] = { ...list[1], status: "writing", versions: [{ id: "c1", content: "import pan" }] };
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel selected="code" .artifacts=${list}></tc-artifact-panel>`);
    expect(options(el)[1].querySelector(".ui-artp__ometa")!.textContent!.trim()).toBe("Writing");
    expect(el.querySelector(".ui-artp__caption")!.textContent).toBe("Writing plot.py…");
    const block = el.querySelector<TcCodeBlock>("tc-code-block")!;
    expect(block.streaming).toBe(true);
    el.artifacts = list.map((a) => (a.id === "code" ? { ...a, versions: [{ id: "c1", content: "import pandas as pd" }] } : a));
    await settle();
    expect(block.code).toBe("import pandas as pd");
    el.artifacts = el.artifacts.map((a) => (a.id === "code" ? { ...a, status: "ready" as const } : a));
    await settle();
    expect(block.streaming).toBe(false);
  });

  test("focus on a removed artifact moves to the one now picked, not the page", async () => {
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel selected="table" .artifacts=${artifacts()}></tc-artifact-panel>`);
    options(el)[2].focus();
    el.artifacts = artifacts().filter((a) => a.id !== "table");
    await settle();
    await new Promise((r) => setTimeout(r, 0));
    expect(el.contains(document.activeElement)).toBe(true);
    expect(document.activeElement!.getAttribute("role")).toBe("option");
    expect(el.querySelector(".ui-artp__pname")!.textContent).toBe("report.md");
  });

  test("empty: the empty label and a caption, no list", async () => {
    const el = await fixture<TcArtifactPanel>(html`<tc-artifact-panel empty-label="No files yet"></tc-artifact-panel>`);
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    expect(el.querySelector(".ui-artp__empty")!.textContent!.trim()).toBe("No files yet");
    expect(el.querySelector(".ui-artp__caption")!.textContent).toBe("Files, code and documents from this run show up here");
  });

  test("CSV helpers round-trip quotes, commas and newlines", () => {
    const t = { columns: ["Name", "Note"], rows: [["Ada", 'Said "hi", left'], ["Bo", "two\nlines"]] };
    const csv = artifactTableToCsv(t);
    expect(csv).toBe('Name,Note\nAda,"Said ""hi"", left"\nBo,"two\nlines"\n');
    expect(artifactTableFromCsv(csv)).toEqual(t);
  });

  test("React wrapper: an uncontrolled pick survives a parent re-render; onDownload can prevent the save", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const list = artifacts();
    const picked: string[] = [];
    const versions: [string, string][] = [];
    const saved: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ArtifactPanel, {
        title: "Run outputs",
        artifacts: list,
        onSelectedChange: (id) => void picked.push(id),
        onVersionChange: (v, a) => void versions.push([v, a]),
        onDownload: (a, _v, e) => {
          e.preventDefault();
          saved.push(a.name);
        },
        "data-n": n,
      } as React.ComponentProps<typeof ArtifactPanel>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-artifact-panel")!;
    expect(el.getAttribute("aria-label")).toBe("Run outputs");
    options(el)[2].click();
    await settle();
    chips(el)[0].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("table");
    expect(el.version).toBe("t1");
    expect(picked).toEqual(["table"]);
    expect(versions).toEqual([["t1", "table"]]);
    download(el).click();
    expect(saved).toEqual(["plans.csv"]);
    expect(click).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled selection stays until the app changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picked: string[] = [];
    await act(async () => root.render(React.createElement(ArtifactPanel, { artifacts: artifacts(), selected: "code", onSelectedChange: (id: string) => void picked.push(id) })));
    await settle();
    const el = host.querySelector("tc-artifact-panel")!;
    options(el)[3].click();
    await settle();
    expect(picked).toEqual(["chart"]);
    expect(el.selected).toBe("code");
    expect(options(el)[1].getAttribute("aria-selected")).toBe("true");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look – previews and diffs`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 760px; background: var(--tc-surface-base)">
        <tc-artifact-panel .artifacts=${artifacts()}></tc-artifact-panel>
        <tc-artifact-panel look="clean" heading="Clean" view="diff" .artifacts=${artifacts()}></tc-artifact-panel>
        <tc-artifact-panel heading="Code" selected="code" view="diff" .artifacts=${artifacts()}></tc-artifact-panel>
        <tc-artifact-panel look="clean" heading="Table" selected="table" view="diff" .artifacts=${artifacts()}></tc-artifact-panel>
        <tc-artifact-panel heading="Image" selected="chart" view="diff" .artifacts=${artifacts()}></tc-artifact-panel>
        <div style="width: 360px"><tc-artifact-panel look="clean" heading="Narrow" selected="chart" .artifacts=${artifacts()}></tc-artifact-panel></div>
        <tc-artifact-panel heading="Empty"></tc-artifact-panel>
      </div>`);
      const result = await axeRun(wrap);
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
