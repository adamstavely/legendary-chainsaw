import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, nextTick, type App as VueApp } from "vue";
import App from "../../src/App.vue";
import "../../src/elements";
import { resetRiffs } from "../../src/riff/session";
import type { Kept, RiffEvent, Variant } from "../../src/riff/types";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
let app: VueApp | undefined;
let host: HTMLElement;

const settle = (ms = 400) => new Promise((r) => setTimeout(r, ms));
async function violations() {
  const { violations } = await axe.run(host, { runOnly: { type: "tag", values: TAGS } });
  return violations.map(
    (v) =>
      `${v.id}: ${v.nodes
        .map((n) => n.target.join(" "))
        .slice(0, 3)
        .join(" | ")}`,
  );
}
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const segment = (label: string, value: string) =>
  [...host.querySelectorAll(`[aria-label="${label}"] [role="radio"]`)].find((r) => r.textContent?.includes(value)) as HTMLElement;
/** A native button by its accessible name (tc-buttons render one inside) */
const button = (name: string, within: ParentNode = host) =>
  [...within.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent)?.trim() === name)!;
const currentTitle = () => host.querySelector<HTMLButtonElement>('.card__title[tabindex="0"]')!;

beforeEach(async () => {
  localStorage.clear();
  host = document.createElement("div");
  host.style.cssText = "position: fixed; inset: 0;";
  document.body.append(host);
  app = createApp(App);
  app.mount(host);
  await settle(800);
});
afterEach(() => {
  vi.restoreAllMocks();
  resetRiffs();
  app?.unmount();
  host.remove();
  delete document.documentElement.dataset.tcTheme;
});

describe("the canvas", () => {
  it("has one h1, the cards, and a count", () => {
    expect(host.querySelectorAll("h1")).toHaveLength(1);
    expect(host.querySelectorAll("[data-piece]").length).toBeGreaterThan(50);
    expect(host.querySelector(".foot__count")!.textContent).toMatch(/^\d+ of \d+ pieces · 3 libraries$/);
  });

  for (const theme of ["Light", "Dark"])
    for (const look of ["Standard", "Clean"])
      it(`passes axe in ${theme}, ${look}`, async () => {
        segment("Theme", theme).click();
        segment("Look", look).click();
        await settle();
        expect(await violations()).toEqual([]);
      });

  it("moves between cards with the arrow keys, one card in the Tab order", async () => {
    const first = currentTitle();
    first.focus();
    key(first, "ArrowRight");
    await settle();
    const next = currentTitle();
    expect(next).not.toBe(first);
    expect(document.activeElement).toBe(next);
    expect(host.querySelectorAll('.card__title[tabindex="0"]')).toHaveLength(1);
  });

  it("opens a piece live with Enter and goes back with Escape", async () => {
    const live = [...host.querySelectorAll<HTMLButtonElement>(".card__title")].find((b) => b.getAttribute("aria-expanded") === "false")!;
    live.focus();
    live.click();
    await settle(900);
    const card = live.closest("[data-piece]")!;
    expect(live.getAttribute("aria-expanded")).toBe("true");
    expect(card.querySelector<HTMLElement>(".live")!.inert).toBe(false);
    expect(await violations()).toEqual([]);
    key(card.querySelector(".live__piece")!, "Escape");
    await settle();
    expect(live.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(live);
  });

  it("keeps closed live pieces out of the Tab order", async () => {
    key(currentTitle(), "0");
    await settle(900);
    for (const live of host.querySelectorAll<HTMLElement>(".live")) expect(live.inert).toBe(true);
  });

  it("zooms with the buttons and announces where it settles", async () => {
    const before = host.querySelector(".foot__zoom")!.textContent;
    button("Zoom in").click();
    await settle(900);
    expect(host.querySelector(".foot__zoom")!.textContent).not.toBe(before);
    expect(host.querySelector("[data-announcer]")!.textContent).toMatch(/^Zoom \d+%$/);
  });

  it("moves a card in the Free layout with buttons and Alt+arrows", async () => {
    segment("Layout", "Free").click();
    await settle();
    const card = currentTitle().closest<HTMLElement>("[data-piece]")!;
    const x = () => new DOMMatrix(getComputedStyle(card).transform).m41;
    const start = x();
    button("Move right", card).click();
    await nextTick();
    expect(x()).toBe(start + 16);
    key(currentTitle(), "ArrowLeft", { altKey: true });
    await nextTick();
    expect(x()).toBe(start);
    expect(await violations()).toEqual([]);
  });
});

describe("the Similar layout", () => {
  for (const theme of ["Light", "Dark"])
    it(`groups pieces by look and passes axe in ${theme}`, async () => {
      segment("Theme", theme).click();
      segment("Layout", "Similar").click();
      await settle();
      key(currentTitle(), "1");
      await settle(900);
      const titles = [...host.querySelectorAll(".group__title")].map((h) => h.textContent!.trim());
      expect(titles.length).toBeGreaterThan(5);
      expect(titles.every((t) => t.startsWith("Like ") || t === "Not compared yet")).toBe(true);
      expect(await violations()).toEqual([]);
    });

  it("marks look-alikes, and says which pieces they look like", async () => {
    segment("Layout", "Similar").click();
    await settle();
    key(currentTitle(), "1");
    await settle(900);
    const badge = host.querySelector(".card__badge")!;
    expect(badge.textContent).toBe("Look-alike");
    const title = badge.closest("[data-piece]")!.querySelector(".card__title")!;
    const about = document.getElementById(title.getAttribute("aria-describedby")!)!.textContent!;
    expect(about).toMatch(/Looks almost the same as .+ \(\d+% alike\)\./);
    expect(about).toMatch(/Most like .+, .+, .+\./);
  });

  it("shows the current piece among its look-alikes with More like this", async () => {
    const title = currentTitle();
    const id = title.closest<HTMLElement>("[data-piece]")!.dataset.piece!;
    title.focus();
    button("More like this", title.closest("[data-piece]")!).click();
    await settle(900);
    expect(segment("Layout", "Similar").getAttribute("aria-checked")).toBe("true");
    expect(currentTitle().closest<HTMLElement>("[data-piece]")!.dataset.piece).toBe(id);
    expect(document.activeElement).toBe(currentTitle());
    expect(host.querySelector("[data-announcer]")!.textContent).toMatch(/^Similar layout\./);
  });

  it("groups the list by look too", async () => {
    segment("Layout", "Similar").click();
    segment("View", "List").click();
    await settle();
    const headings = [...host.querySelectorAll(".list__heading")].map((h) => h.textContent!.trim());
    expect(headings[0]).toMatch(/^Like /);
    expect(await violations()).toEqual([]);
  });
});

describe("the Graph layout", () => {
  for (const theme of ["Light", "Dark"])
    it(`draws rows of builders over their parts, with links, and passes axe in ${theme}`, async () => {
      segment("Theme", theme).click();
      segment("Layout", "Graph").click();
      await settle();
      key(currentTitle(), "1");
      await settle(900);
      const titles = [...host.querySelectorAll(".group__title")].map((h) => h.textContent!.trim());
      expect(titles.at(-1)).toBe("Stands alone");
      expect(titles).toContain("Parts – used inside other pieces");
      expect(host.querySelectorAll(".link").length).toBeGreaterThan(50);
      expect(host.querySelector("svg.links")!.getAttribute("aria-hidden")).toBe("true");
      expect(await violations()).toEqual([]);
    });

  it("says in words what the links show, and highlights the current card's", async () => {
    segment("Layout", "Graph").click();
    await settle();
    key(currentTitle(), "1");
    await settle(900);
    const title = host.querySelector<HTMLButtonElement>('[data-piece="blocks/ai-side-pane"] .card__title')!;
    title.focus();
    await settle();
    const about = document.getElementById(title.getAttribute("aria-describedby")!)!.textContent!;
    expect(about).toMatch(/Built with .*Chat Composer/);
    expect(host.querySelectorAll(".link--active").length).toBeGreaterThan(2);
  });

  it("groups the list the same way, with each piece's parts", async () => {
    segment("Layout", "Graph").click();
    segment("View", "List").click();
    await settle();
    const headings = [...host.querySelectorAll(".list__heading")].map((h) => h.textContent!.trim());
    expect(headings.at(-1)).toBe("Stands alone");
    expect(host.querySelector(".list")!.textContent).toMatch(/Used in .*\./);
    expect(await violations()).toEqual([]);
  });
});

// The dev server's riff endpoints, stubbed: no request reaches Claude, and nothing is written to Trenchcoat
describe("riffing", () => {
  const variants: Variant[] = [
    {
      name: "Failed call",
      rationale: "Shows the error state.",
      props: { status: "error", error: "Timed out" },
      tokens: {},
      structural: false,
      note: "",
      issues: [],
    },
    {
      name: "Inline diff",
      rationale: "Shows the arguments as a diff.",
      props: { open: true },
      tokens: { "--tc-space-2": "var(--tc-space-1)" },
      structural: true,
      note: "A diff view for arguments",
      issues: [{ path: "duration", message: "should be number, not string – left out" }],
    },
  ];
  let reply: RiffEvent[];
  let kept: Kept[];
  let posted: { url: string; body: unknown }[];

  beforeEach(() => {
    reply = [
      { type: "status", text: "Claude is thinking it through…" },
      { type: "variants", variants },
    ];
    kept = [];
    posted = [];
    const real = window.fetch.bind(window);
    vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (!url.includes("/__canvas/variants") && !(url.includes("/__canvas/riff") && init?.method === "POST")) return real(input, init);
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      if (init?.method) posted.push({ url, body });
      if (url.includes("/__canvas/riff"))
        return new Response(reply.map((e) => JSON.stringify(e)).join("\n") + "\n", { headers: { "content-type": "application/x-ndjson" } });
      if (init?.method === "POST") {
        const k = { name: body.variant.name, rationale: body.variant.rationale, prompt: body.prompt, props: body.variant.props, tokens: body.variant.tokens };
        kept = [...kept, k];
        return Response.json({ kept: k, file: "app/src/variants/tool-call-card.json", request: null });
      }
      if (init?.method === "DELETE") return Response.json({ variants: (kept = kept.filter((k) => k.name !== body.name)) });
      return Response.json({ variants: kept });
    });
  });

  async function openToolCallCard() {
    key(currentTitle(), "1");
    await settle(900);
    const title = host.querySelector<HTMLButtonElement>('[data-piece="tool-call-card"] .card__title')!;
    title.focus();
    title.click();
    await settle(1200);
    return host.querySelector<HTMLElement>("aside.riff")!;
  }
  async function riff(panel: HTMLElement, prompt: string) {
    const field = panel.querySelector<HTMLTextAreaElement>(".riff__prompt")!;
    field.value = prompt;
    field.dispatchEvent(new Event("input"));
    await nextTick();
    button("Ask Claude", panel).click();
    await settle(1500);
  }

  for (const theme of ["Light", "Dark"])
    it(`opens a panel beside a component, which passes axe in ${theme}`, async () => {
      segment("Theme", theme).click();
      const panel = await openToolCallCard();
      expect(panel.querySelector("h2")!.textContent!.trim()).toBe("Tool Call Card");
      await expect.poll(() => panel.querySelectorAll(".tune [role=slider]").length).toBeGreaterThan(0);
      expect(panel.querySelector("tc-prompt-starters")).not.toBeNull();
      expect(await violations()).toEqual([]);
    });

  it("asks for variants with the piece's props, and draws them live around it", async () => {
    const panel = await openToolCallCard();
    await riff(panel, "Show it failing");
    const request = posted.find((p) => p.url.includes("/__canvas/riff"))!.body as { slug: string; prompt: string; props: Record<string, unknown> };
    expect(request).toMatchObject({ slug: "tool-call-card", prompt: "Show it failing" });
    expect(request.props.name).toBeTypeOf("string");
    const cards = host.querySelectorAll<HTMLElement>("article.variant");
    expect(cards).toHaveLength(2);
    await expect.poll(() => cards[0].querySelector<HTMLElement & { status: string }>("tc-tool-call-card")?.status).toBe("error");
    await expect.poll(() => cards[1].querySelector<HTMLElement>("tc-tool-call-card")?.style.getPropertyValue("--tc-space-2")).toBe("var(--tc-space-1)");
    expect(cards[1].textContent).toContain("Needs new code");
    expect(panel.querySelector("[role=status]")!.textContent).toMatch(/^2 variants of Tool Call Card/);
    expect(panel.querySelector("details summary")!.textContent).toBe("1 change left out");
    expect(await violations()).toEqual([]);
  });

  it("keeps a variant, discards another, and removes a kept one", async () => {
    const panel = await openToolCallCard();
    await riff(panel, "Show it failing");
    button("Keep", panel).click();
    await settle();
    expect(posted.at(-1)!.body).toMatchObject({ slug: "tool-call-card", prompt: "Show it failing", variant: { name: "Failed call" } });
    expect(panel.querySelector("[role=status]")!.textContent).toContain("Kept Failed call in trenchcoat/app/src/variants/tool-call-card.json");
    expect([...host.querySelectorAll("article.variant")].map((c) => c.textContent)).toEqual([
      expect.stringContaining("Kept"),
      expect.stringContaining("Inline diff"),
    ]);
    button("Discard", panel).click();
    await settle();
    expect(host.querySelectorAll("article.variant")).toHaveLength(1);
    button("Remove", panel).click();
    await settle();
    expect(host.querySelectorAll("article.variant")).toHaveLength(0);
  });

  it("says what went wrong", async () => {
    reply = [{ type: "error", message: "Claude couldn't be reached: no valid Anthropic credentials." }];
    const panel = await openToolCallCard();
    await riff(panel, "Denser");
    expect(panel.querySelector("[role=alert]")!.textContent).toContain("no valid Anthropic credentials");
  });

  it("tunes the piece on DialKit's dials, and keeps the tuned version", async () => {
    const panel = await openToolCallCard();
    const tune = panel.querySelector<HTMLButtonElement>("[role=tab][aria-controls$=panel-tune]")!;
    key(panel.querySelector("[role=tab][aria-selected=true]")!, "ArrowRight");
    await settle();
    expect(tune.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tune);
    await expect.poll(() => panel.querySelector(".tune [role=radiogroup][aria-labelledby]")).not.toBeNull();
    const piece = () => host.querySelector<HTMLElement & { open: boolean }>('[data-piece="tool-call-card"] .live__piece tc-tool-call-card')!;
    const open = [...panel.querySelectorAll<HTMLElement>(".tune [role=radiogroup]")].find(
      (g) => document.getElementById(g.getAttribute("aria-labelledby")!)!.textContent!.trim() === "Open",
    )!;
    const on = [...open.querySelectorAll<HTMLElement>("[role=radio]")].find((r) => r.textContent!.trim() === "On")!;
    expect(piece().open).toBe(false);
    on.click();
    await settle();
    expect(piece().open).toBe(true);
    expect(panel.querySelector(".tune [aria-live]")!.textContent).toBe("1 change from the original.");
    button("Keep tuned version", panel).click();
    await settle();
    expect(posted.at(-1)!.body).toMatchObject({
      slug: "tool-call-card",
      prompt: "Tuned by hand",
      variant: { name: "Tuned Tool Call Card", props: { open: true }, tokens: {} },
    });
    button("Reset", panel).click();
    await settle();
    expect(piece().open).toBe(false);
    expect(await violations()).toEqual([]);
  });

  it("goes back to the canvas with Escape, focus on the piece", async () => {
    const panel = await openToolCallCard();
    key(panel.querySelector(".riff__prompt")!, "Escape");
    await settle();
    expect(host.querySelector("aside.riff")).toBeNull();
    expect(document.activeElement).toBe(host.querySelector('[data-piece="tool-call-card"] .card__title'));
  });
});

// The dev server's create endpoints, stubbed: no agent runs and no worktree is made. The app is mounted again after
// stubbing, so it asks the stub which agent builds
describe("creating a component", () => {
  let posted: { url: string; method: string; body: unknown }[];
  let polls: number;

  beforeEach(async () => {
    posted = [];
    polls = 0;
    const real = window.fetch.bind(window);
    vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (!url.includes("/__canvas/create")) return real(input, init);
      const method = init?.method ?? "GET";
      if (method !== "GET") posted.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (url.endsWith("/__canvas/create") && method === "GET") return Response.json({ agent: "Claude Code", problem: "" });
      if (url.endsWith("/__canvas/create")) return Response.json({ id: "j1" });
      if (url.includes("/file?")) return Response.json({ path: "trenchcoat/src/elements/fancy-thing.ts", code: "export class FancyThing {}\n" });
      if (url.endsWith("/pull-request")) return Response.json({ url: "https://github.com/example/repo/pull/1" });
      const done = ++polls > 1;
      return Response.json({
        id: "j1",
        brief: { name: "Fancy Thing", slug: "fancy-thing", description: "Shows things", category: "Agents" },
        agent: "Claude Code",
        branch: "canvas/new-fancy-thing-j1",
        dir: "/tmp/w",
        state: done ? "done" : "running",
        log: done ? ["→ Write src/elements/fancy-thing.ts", "Done: 1 files changed."] : ["Claude Code is building Fancy Thing."],
        next: done ? 3 : 1,
        files: done ? ["trenchcoat/src/elements/fancy-thing.ts"] : [],
        preview: null,
        pullRequest: null,
        error: "",
      });
    });
    app?.unmount();
    app = createApp(App);
    app.mount(host);
    await settle(800);
  });

  async function openPanel() {
    button("New component").click();
    await settle(600);
    return host.querySelector<HTMLElement>("#create-panel")!;
  }

  it("opens a labelled form beside the pieces, which passes axe", async () => {
    const panel = await openPanel();
    expect(button("New component").getAttribute("aria-expanded")).toBe("true");
    expect(panel.querySelector("h2")!.textContent!.trim()).toBe("New component");
    for (const field of panel.querySelectorAll("input, select, textarea")) expect(panel.querySelector(`label[for="${field.id}"]`)).not.toBeNull();
    expect(panel.textContent).toContain("edits files and runs commands on this computer");
    expect(await violations()).toEqual([]);
  });

  it("builds it, shows the progress, the code, and opens a pull request", async () => {
    const panel = await openPanel();
    const fill = (selector: string, value: string) => {
      const el = panel.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
      el.value = value;
      el.dispatchEvent(new Event("input"));
    };
    fill("input[type=text]", "Fancy Thing");
    fill("textarea", "Shows things");
    await nextTick();
    button("Build it", panel).click();
    await settle(2500);
    expect(posted[0].body).toMatchObject({ name: "Fancy Thing", description: "Shows things", reference: null });
    expect([...panel.querySelectorAll("[role=log] li")].map((li) => li.textContent)).toEqual([
      "Claude Code is building Fancy Thing.",
      "→ Write src/elements/fancy-thing.ts",
      "Done: 1 files changed.",
    ]);
    expect(panel.querySelector("[role=status]")!.textContent).toMatch(/^Fancy Thing is built: 1 files changed/);
    button("src/elements/fancy-thing.ts", panel).click();
    await settle();
    expect(panel.querySelector<HTMLElement & { code: string }>("tc-code-block")!.code).toBe("export class FancyThing {}\n");
    expect(await violations()).toEqual([]);
    button("Open a pull request", panel).click();
    await settle();
    expect(posted.at(-1)!.url).toMatch(/\/pull-request$/);
    expect(panel.querySelector<HTMLAnchorElement>('a[href="https://github.com/example/repo/pull/1"]')).not.toBeNull();
  });

  it("closes with Escape, focus back on the button", async () => {
    const panel = await openPanel();
    key(panel.querySelector("textarea")!, "Escape");
    await settle();
    expect(host.querySelector("#create-panel")).toBeNull();
    expect(document.activeElement).toBe(button("New component"));
  });
});

describe("the toolbar", () => {
  it("opens the filters as a disclosure; Escape closes them and returns focus", async () => {
    const button = host.querySelector<HTMLButtonElement>(".filter tc-button button")!;
    button.focus();
    button.click();
    await settle();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(await violations()).toEqual([]);
    key(host.querySelector(".filter__panel tc-filter-menu")!, "Escape");
    await settle();
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });

  it("filters the pieces by library", async () => {
    host.querySelector<HTMLButtonElement>(".filter tc-button button")!.click();
    await settle();
    const motion = [...host.querySelectorAll<HTMLElement>(".filter__panel [role='checkbox'], .filter__panel input[type='checkbox']")].find((el) =>
      (el.closest("label") ?? el.parentElement)?.textContent?.includes("Motion"),
    )!;
    motion.click();
    await settle();
    expect(host.querySelector(".foot__count")!.textContent).toMatch(/· 1 library$/);
  });

  it("shows the list view, which passes axe", async () => {
    segment("View", "List").click();
    await settle();
    expect(host.querySelectorAll(".item").length).toBeGreaterThan(50);
    expect(await violations()).toEqual([]);
  });
});
