/*
 * <tc-file-summary> in real browsers: the file's header, idle → summarising (shimmer, then streamed text) → done,
 * error with Retry, key points with citation chips and links, mentions, Short / Detailed, Copy, Regenerate and Open
 * file, polite announcements, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/file-summary";
import { fileSummaryKind, type FileSummaryCiteOpen, type FileSummaryEntity, type FileSummaryPoint, type TcFileSummary } from "../../src/elements/file-summary";
import { FileSummary } from "../../src/elements/react/file-summary";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const FILE = { name: "Q3 report.pdf", size: 2_516_582, pages: 48 };
const POINTS: FileSummaryPoint[] = [
  { id: "rev", text: "Revenue up 18%.", refs: [{ page: 4 }, { page: 12 }] },
  { id: "call", text: "Said on the call.", refs: [{ time: 272_000 }] },
];
const ENTITIES: FileSummaryEntity[] = [
  { id: "nw", label: "Northwind Ltd", kind: "organization", count: 63 },
  { id: "ad", label: "Amara Diallo", kind: "person", count: 1 },
  { id: "rev", label: "$42.6M", kind: "amount" },
];
const SUMMARY = "Revenue grew 18%.\n\nCosts rose faster than planned.";

const make = (look: "standard" | "clean" = "standard", status = "done", extra = {}) =>
  fixture<TcFileSummary>(html`<tc-file-summary
    look=${look}
    status=${status}
    model="Claude Sonnet"
    coverage="Covers 46 of 48 pages"
    .file=${FILE}
    .summary=${status === "done" ? SUMMARY : ""}
    .points=${status === "done" ? POINTS : []}
    .entities=${status === "done" ? ENTITIES : []}
    .summarisedAt=${new Date(2026, 9, 27, 15, 4).getTime()}
  ></tc-file-summary>`).then(async (el) => {
    Object.assign(el, extra);
    await settle();
    return el;
  });
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const button = (el: Element, name: string) => [...el.querySelectorAll<HTMLElement>("button, a")].find((b) => b.textContent!.trim() === name)!;

describe("tc-file-summary", () => {
  test("the file's kind comes from its extension unless given", () => {
    expect(fileSummaryKind({ name: "a.PDF" })).toBe("pdf");
    expect(fileSummaryKind({ name: "deck.pptx" })).toBe("slides");
    expect(fileSummaryKind({ name: "call.m4a" })).toBe("audio");
    expect(fileSummaryKind({ name: "notes" })).toBe("other");
    expect(fileSummaryKind({ name: "x.pdf", kind: "doc" })).toBe("doc");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the header names the file with its type, size and pages; the summary, points, mentions and coverage show when done`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("fsum");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.kind).toBe("pdf");
      expect(el.querySelector(".tc-head__title")!.textContent!.trim()).toBe("Q3 report.pdf");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("PDF · 2.4 MB · 48 pages");
      expect([...el.querySelectorAll(".ui-fsum__p")].map((p) => p.textContent)).toEqual(["Revenue grew 18%.", "Costs rose faster than planned."]);
      expect(el.querySelector(".ui-fsum__summary")!.getAttribute("aria-busy")).toBe("false");
      expect(el.querySelector(".ui-fsum__caret")).toBeNull();
      expect(el.querySelectorAll(".ui-fsum__point")).toHaveLength(2);
      expect([...el.querySelectorAll(".ui-fsum__cite")].map((c) => [c.querySelector('[aria-hidden="true"]')!.textContent, c.querySelector(".tc-sr-only")!.textContent])).toEqual([
        ["p. 4", "Open page 4"],
        ["p. 12", "Open page 12"],
        ["4:32", "Open at 4 minutes 32 seconds"],
      ]);
      expect([...el.querySelectorAll(".ui-fsum__caption")].map((c) => c.textContent)).toEqual(["Key points", "People & organisations", "Dates & amounts"]);
      // Read as "Northwind Ltd, mentioned 63 times"; the count is shown as a number
      expect([...el.querySelectorAll(".ui-fsum__chip")].map((c) => c.querySelector(".ui-fsum__chip-label")!.textContent! + (c.querySelector(".tc-sr-only")?.textContent ?? ""))).toEqual(["Northwind Ltd, mentioned 63 times", "Amara Diallo, mentioned 1 time", "$42.6M"]);
      expect(el.querySelector(".ui-fsum__coverage")!.textContent).toBe("Covers 46 of 48 pages");
      const by = el.querySelector(".ui-fsum__by")!.textContent!;
      expect(by).toContain(new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(2026, 9, 27, 15, 4)));
      expect(by).toContain("with Claude Sonnet");
      // Open file only with href or openable
      expect(el.querySelector(".ui-fsum__open")).toBeNull();
    });
  }

  test("idle offers Summarise; summarising shows a shimmer, then streamed text with a caret; done and error are announced", async () => {
    const el = await make("standard", "idle");
    const asked = vi.fn();
    el.addEventListener("tc-summarise", asked);
    expect(el.querySelector(".ui-fsum__foot")).toBeNull();
    button(el, "Summarise").click();
    expect(asked).toHaveBeenCalledTimes(1);
    expect(status(el)).toBe("");
    el.status = "summarising";
    await expect.poll(() => el.querySelector(".ui-fsum__skeleton")).toBeTruthy();
    expect(status(el)).toBe("Summarising Q3 report.pdf");
    expect(el.querySelector(".ui-fsum__by")!.textContent).toContain("Summarising…");
    expect((el.querySelector(".ui-fsum__copy") as HTMLButtonElement).disabled).toBe(true);
    expect((el.querySelector(".ui-fsum__regen") as HTMLButtonElement).disabled).toBe(true);
    el.summary = "Revenue grew";
    await expect.poll(() => el.querySelector(".ui-fsum__p")?.textContent).toBe("Revenue grew");
    expect(el.querySelector(".ui-fsum__skeleton")).toBeNull();
    expect(el.querySelector(".ui-fsum__caret")).toBeTruthy();
    expect(el.querySelector(".ui-fsum__summary")!.getAttribute("aria-busy")).toBe("true");
    el.summary = "Revenue grew 18%.";
    el.points = [POINTS[0]];
    await expect.poll(() => el.querySelectorAll(".ui-fsum__point").length).toBe(1);
    el.status = "done";
    await expect.poll(() => status(el)).toBe("Summary of Q3 report.pdf ready");
    expect(el.querySelector(".ui-fsum__caret")).toBeNull();
    expect((el.querySelector(".ui-fsum__copy") as HTMLButtonElement).disabled).toBe(false);
    el.error = "The model timed out.";
    el.status = "error";
    await expect.poll(() => status(el)).toBe("Couldn't summarise Q3 report.pdf: The model timed out.");
    expect(el.querySelector('[role="alert"]')!.textContent).toContain("The model timed out.");
    const retried: string[] = [];
    el.addEventListener("tc-retry", (e) => retried.push((e as CustomEvent<{ reason: string }>).detail.reason));
    button(el, "Retry").click();
    expect(retried).toEqual(["error"]);
  });

  test("citation chips fire a cancelable tc-cite-open; with href they link to the page or time", async () => {
    const el = await make();
    const seen: FileSummaryCiteOpen[] = [];
    el.addEventListener("tc-cite-open", (e) => seen.push((e as CustomEvent<FileSummaryCiteOpen>).detail));
    (el.querySelectorAll(".ui-fsum__cite")[1] as HTMLElement).click();
    (el.querySelectorAll(".ui-fsum__cite")[2] as HTMLElement).click();
    expect(seen).toEqual([
      { pointId: "rev", page: 12, time: undefined },
      { pointId: "call", page: undefined, time: 272_000 },
    ]);
    el.href = "/files/q3.pdf#view=fit";
    await settle();
    const links = [...el.querySelectorAll<HTMLAnchorElement>("a.ui-fsum__cite")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/files/q3.pdf#page=4", "/files/q3.pdf#page=12", "/files/q3.pdf#t=272"]);
    // Prevented, the link doesn't open
    el.addEventListener("tc-cite-open", (e) => e.preventDefault());
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    links[0].dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  test("mentions fire tc-entity-select; Short / Detailed is a radio group with a cancelable tc-length-change", async () => {
    const el = await make();
    const picked: string[] = [];
    el.addEventListener("tc-entity-select", (e) => picked.push((e as CustomEvent<{ entity: FileSummaryEntity }>).detail.entity.id));
    (el.querySelectorAll(".ui-fsum__chip")[1] as HTMLElement).click();
    expect(picked).toEqual(["ad"]);
    const group = el.querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute("aria-label")).toBe("Summary length");
    const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(radios.map((r) => [r.textContent, r.getAttribute("aria-checked"), r.tabIndex])).toEqual([
      ["Short", "true", 0],
      ["Detailed", "false", -1],
    ]);
    const lengths: string[] = [];
    el.addEventListener("tc-length-change", (e) => lengths.push((e as CustomEvent<{ length: string }>).detail.length));
    radios[0].focus();
    radios[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await expect.poll(() => el.length).toBe("detailed");
    await expect.poll(() => document.activeElement?.getAttribute("data-len")).toBe("detailed");
    expect(el.getAttribute("length")).toBe("detailed");
    el.addEventListener("tc-length-change", (e) => e.preventDefault(), { once: true });
    radios[0].click();
    await settle();
    expect(el.length).toBe("detailed");
    expect(lengths).toEqual(["detailed", "short"]);
  });

  test("Copy puts the summary and key points on the clipboard and shows Copied; Regenerate and Open file fire their events", async () => {
    const writes: string[] = [];
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(async (t: string) => void writes.push(t));
    const el = await make("standard", "done", { openable: true });
    const copied: string[] = [];
    el.addEventListener("tc-copy", (e) => copied.push((e as CustomEvent<{ text: string }>).detail.text));
    button(el, "Copy").click();
    await expect.poll(() => el.querySelector(".ui-fsum__copy")!.textContent!.trim()).toBe("Copied");
    expect(writes[0]).toBe("Q3 report.pdf\n\nRevenue grew 18%.\n\nCosts rose faster than planned.\n\nKey points\n• Revenue up 18%. (p. 4, p. 12)\n• Said on the call. (4:32)");
    expect(copied).toEqual([writes[0]]);
    expect(status(el)).toBe("Summary copied");
    const retried: string[] = [];
    el.addEventListener("tc-retry", (e) => retried.push((e as CustomEvent<{ reason: string }>).detail.reason));
    button(el, "Regenerate").click();
    expect(retried).toEqual(["regenerate"]);
    const opened = vi.fn();
    el.addEventListener("tc-open", opened);
    button(el, "Open file").click();
    expect(opened).toHaveBeenCalledTimes(1);
    // With href, Open file is a link that a prevented tc-open keeps from opening
    el.href = "/files/q3.pdf";
    await settle();
    const link = el.querySelector<HTMLAnchorElement>("a.ui-fsum__open")!;
    expect(link.getAttribute("href")).toBe("/files/q3.pdf");
    el.addEventListener("tc-open", (e) => e.preventDefault());
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  test("audio shows its duration and offers times; focus left on a vanishing button moves to Short / Detailed", async () => {
    const el = await make("standard", "idle", { file: { name: "Board call.m4a", duration: 3_872_000 } });
    expect(el.dataset.kind).toBe("audio");
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Audio · 1:04:32");
    expect(el.querySelector(".ui-fsum__idle-text")!.textContent).toContain("times");
    button(el, "Summarise").focus();
    el.status = "summarising";
    await expect.poll(() => document.activeElement?.closest(".ui-fsum__len")).toBeTruthy();
  });

  test("React wrapper: length is controlled, events reach the callbacks, and returning false prevents a citation link", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const lengths: string[] = [];
    const cites: FileSummaryCiteOpen[] = [];
    const ents: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(FileSummary, {
          file: FILE,
          href: "/q3.pdf",
          status: "done",
          summary: SUMMARY,
          points: POINTS,
          entities: ENTITIES,
          length: "short",
          onLengthChange: (l) => void lengths.push(l),
          onCiteOpen: (c) => {
            cites.push(c);
            return false;
          },
          onEntitySelect: (e) => void ents.push(e.id),
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-file-summary")!;
    (el.querySelectorAll<HTMLElement>('[role="radio"]')[1]).click();
    await settle();
    expect(lengths).toEqual(["detailed"]);
    expect(el.length).toBe("short");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    el.querySelector("a.ui-fsum__cite")!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(cites).toEqual([{ pointId: "rev", page: 4, time: undefined }]);
    (el.querySelector(".ui-fsum__chip") as HTMLElement).click();
    expect(ents).toEqual(["nw"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: uncontrolled length starts at defaultLength and survives parent re-renders", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(FileSummary, { file: FILE, status: "done", summary: SUMMARY, defaultLength: "detailed", "data-n": n } as React.ComponentProps<typeof FileSummary>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-file-summary")!;
    expect(el.length).toBe("detailed");
    (el.querySelectorAll<HTMLElement>('[role="radio"]')[0]).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.length).toBe("short");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, done, summarising and error`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-file-summary status="done" href="/q3.pdf" model="Claude Sonnet" coverage="Covers 46 of 48 pages" .file=${FILE} .summary=${SUMMARY} .points=${POINTS} .entities=${ENTITIES}></tc-file-summary>
        <tc-file-summary look="clean" status="done" openable .file=${FILE} .summary=${SUMMARY} .points=${POINTS} .entities=${ENTITIES}></tc-file-summary>
        <tc-file-summary status="summarising" .file=${FILE}></tc-file-summary>
        <tc-file-summary look="clean" status="error" error="The model timed out." .file=${FILE}></tc-file-summary>
        <tc-file-summary status="idle" .file=${FILE}></tc-file-summary>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
