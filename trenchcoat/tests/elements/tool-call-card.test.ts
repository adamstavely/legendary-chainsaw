/*
 * <tc-tool-call-card> and <tc-tool-call-group> in real browsers – the React component's contract and regression
 * checks, ported.
 */
import { html, render, type TemplateResult } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/tool-call-card";
import type { TcToolCallCard, TcToolCallGroup } from "../../src/elements/tool-call-card";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const head = (el: Element) => el.querySelector<HTMLButtonElement>(":scope > .ui-tc__head, :scope > .ui-tc-group__head")!;
const time = (el: Element) => el.querySelector(".ui-tc__time")!.textContent;
const statuses = (root: Element) => [...root.querySelectorAll('[role="status"]')].map((r) => r.textContent).filter(Boolean);
const group = (cards: TemplateResult, attrs: Partial<TcToolCallGroup> = {}) =>
  fixture<TcToolCallGroup>(html`<tc-tool-call-group .open=${attrs.open ?? false}><div slot="list" class="ui-tc__body"><div class="ui-tc__clip"><div class="ui-tc-group__list">${cards}</div></div></div></tc-tool-call-group>`);
/** Waits for the element's updates without an animation frame (for the fake-timer test) */
const mount = async (template: TemplateResult) => {
  const host = document.createElement("div");
  document.body.append(host);
  render(template, host);
  const el = host.firstElementChild as TcToolCallCard;
  for (let i = 0; i < 3; i++) await el.updateComplete;
  return el;
};

describe("tc-tool-call-card", () => {
  test("the host is the root, with the look, status and open state", async () => {
    const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card name="search_web" status="success" duration="400"></tc-tool-call-card>`);
    expect(el.dataset.ui).toBe("tc");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.status).toBe("success");
    expect(el.hasAttribute("data-open")).toBe(false);
    expect(time(el)).toBe("400ms");
    el.look = "clean";
    el.open = true;
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.hasAttribute("data-open")).toBe(true);
    expect(head(el).getAttribute("aria-expanded")).toBe("true");
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("the live timer ticks in the DOM without rendering, and shows the duration once done", async () => {
        vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"], now: 0 });
        const el = await mount(html`<tc-tool-call-card look=${look} name="search" status="running" .startedAt=${0}></tc-tool-call-card>`);
        expect(time(el)).toBe("0.0s");
        let renders = 0;
        const target = el as unknown as { render: () => unknown };
        const original = target.render.bind(el);
        target.render = () => {
          renders++;
          return original();
        };
        vi.advanceTimersByTime(1250);
        expect(time(el)).toBe("1.2s");
        expect(renders).toBe(0);
        el.status = "success";
        el.duration = 2400;
        await el.updateComplete;
        expect(time(el)).toBe("2.4s");
        vi.advanceTimersByTime(500);
        expect(time(el)).toBe("2.4s");
        el.remove();
        expect(vi.getTimerCount()).toBe(0);
      });

      test("open-on-error opens the card and reports it; the next run closes it again", async () => {
        const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card look=${look} name="search" status="running"></tc-tool-call-card>`);
        const seen: unknown[] = [];
        on(el, "tc-open-change", (e) => seen.push(e.detail.open));
        el.status = "error";
        el.error = "Timeout";
        await settle();
        expect(head(el).getAttribute("aria-expanded")).toBe("true");
        expect(seen).toEqual([true]);
        el.status = "running";
        await settle();
        expect(head(el).getAttribute("aria-expanded")).toBe("false");
        expect(seen).toEqual([true, false]);
      });

      test("without open-on-error (a controlled card) it isn't opened on error", async () => {
        const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card look=${look} name="search" status="running" .openOnError=${false}></tc-tool-call-card>`);
        const seen: unknown[] = [];
        on(el, "tc-open-change", (e) => seen.push(e.detail.open));
        el.status = "error";
        await settle();
        expect(head(el).getAttribute("aria-expanded")).toBe("false");
        expect(seen).toEqual([]);
      });

      test("open is controlled through preventDefault", async () => {
        const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card look=${look} name="search" status="success" duration="400"></tc-tool-call-card>`);
        on(el, "tc-open-change", (e) => e.preventDefault());
        head(el).click();
        await settle();
        expect(head(el).getAttribute("aria-expanded")).toBe("false");
        expect(el.querySelector<HTMLElement & { inert: boolean }>(".ui-tc__body")!.inert).toBe(true);
        el.open = true;
        await settle();
        expect(head(el).getAttribute("aria-expanded")).toBe("true");
        expect(el.querySelector<HTMLElement & { inert: boolean }>(".ui-tc__body")!.inert).toBe(false);
      });

      test("Retry waits for a promise and shows a rejection, then can be tried again", async () => {
        let fail!: (e: Error) => void;
        const onRetry = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
        const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card look=${look} name="search" status="error" error="Timeout" open .onRetry=${onRetry}></tc-tool-call-card>`);
        const button = el.querySelector<HTMLButtonElement>(".ui-tc__retry")!;
        button.click();
        await settle();
        expect(button.disabled).toBe(true);
        button.click();
        expect(onRetry).toHaveBeenCalledTimes(1);
        fail(new Error("Rate limited"));
        await settle();
        expect(button.disabled).toBe(false);
        expect(el.querySelector('[role="alert"]')!.textContent).toBe("Retry failed: Rate limited");
        onRetry.mockImplementation(() => Promise.resolve());
        button.click();
        await settle();
        expect(onRetry).toHaveBeenCalledTimes(2);
        expect(el.querySelector('[role="alert"]')).toBeNull();
      });

      test("arguments and result as highlighted JSON; long blocks are capped with Show all", async () => {
        const long = Array.from({ length: 40 }, (_, i) => ({ i }));
        const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card look=${look} name="q" status="success" open .args=${{ q: "x", n: 1, ok: true }} .result=${long}></tc-tool-call-card>`);
        await settle();
        const [args, result] = [...el.querySelectorAll<HTMLPreElement>(".ui-tc__code")];
        expect(args.querySelector(".ui-tc__t-key")!.textContent).toBe('"q"');
        expect(args.querySelector(".ui-tc__t-str")!.textContent).toBe('"x"');
        expect(args.querySelector(".ui-tc__t-num")!.textContent).toBe("1");
        expect(args.querySelector(".ui-tc__t-lit")!.textContent).toBe("true");
        expect(args.hasAttribute("data-capped")).toBe(false);
        expect(result.hasAttribute("data-capped")).toBe(true);
        const more = el.querySelector<HTMLButtonElement>(".ui-tc__more")!;
        expect(more.getAttribute("aria-expanded")).toBe("false");
        more.click();
        await settle();
        expect(result.hasAttribute("data-capped")).toBe(false);
        expect(more.textContent).toBe("Show less");
      });

      /* WCAG fix pass: "Copied" was only a rename of the focused button, group and cards announced the same thing
         twice, the header's name held a timer changing 10× a second, and focus fell to <body> when Retry went away */
      test("a card announces only its outcome, through a region present from the start", async () => {
        const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card look=${look} name="search" status="running" .startedAt=${0}></tc-tool-call-card>`);
        const region = el.querySelector('[role="status"]')!;
        expect(region.textContent).toBe("");
        el.status = "error";
        el.error = "Timed out";
        await settle();
        expect(el.querySelector('[role="status"]')).toBe(region);
        expect(region.textContent).toBe("search failed: Timed out");
      });

      test("the running timer stays out of the header button's name", async () => {
        const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card look=${look} name="search" status="running" .startedAt=${0}></tc-tool-call-card>`);
        expect(head(el).querySelector(".ui-tc__time")!.getAttribute("aria-hidden")).toBe("true");
        expect(head(el).textContent).toContain("running");
      });

      test("Copy keeps its name and announces Copied in a status region", async () => {
        vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
        const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card look=${look} name="search" status="success" open .args=${{ q: 1 }}></tc-tool-call-card>`);
        const copy = el.querySelector<HTMLButtonElement>('[aria-label="Copy arguments"]')!;
        copy.click();
        await settle();
        await settle();
        expect(copy.getAttribute("aria-label")).toBe("Copy arguments");
        expect(statuses(el)).toContain("Copied");
      });

      test("when Retry goes away (the call runs again) focus moves to the header, not <body>", async () => {
        const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card look=${look} name="search" status="error" error="x" open .onRetry=${() => {}}></tc-tool-call-card>`);
        el.querySelector<HTMLButtonElement>(".ui-tc__retry")!.focus();
        el.status = "running";
        el.startedAt = 0;
        await settle();
        await settle();
        expect(document.activeElement).toBe(head(el));
      });

      describe("group", () => {
        test("summarises its cards, and only the group speaks, once everything is done", async () => {
          const g = await group(html`<tc-tool-call-card look=${look} name="a" status="running" duration="10"></tc-tool-call-card><tc-tool-call-card look=${look} name="b" status="success" duration="10"></tc-tool-call-card>`);
          expect(g.dataset.ui).toBe("tc-group");
          expect(g.hasAttribute("data-running")).toBe(true);
          expect(g.querySelector(".ui-tc-group__label")!.textContent).toBe("Using tools…");
          expect(g.querySelectorAll(".ui-tc-group__stack .ui-tc__icon")).toHaveLength(2);
          expect(statuses(g)).toEqual([]);
          g.querySelector<TcToolCallCard>("tc-tool-call-card")!.status = "success";
          await settle();
          expect(statuses(g)).toEqual(["Used 2 tools"]);
          expect(g.querySelector(".ui-tc-group__label")!.textContent).toBe("Used 2 tools");
          expect(g.querySelector(".ui-tc-group__time")!.textContent).toBe("· 20ms");
        });

        test("the header comes first and controls the body, which is inert while closed", async () => {
          const g = await group(html`<tc-tool-call-card name="a" status="success" duration="10"></tc-tool-call-card>`);
          const h = head(g);
          const body = g.querySelector<HTMLElement & { inert: boolean }>(':scope > [slot="list"]')!;
          expect(g.firstElementChild!.matches('[role="status"]')).toBe(true);
          expect(h.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
          expect(h.getAttribute("aria-controls")).toBe(body.id);
          expect(body.inert).toBe(true);
          h.click();
          await settle();
          expect(h.getAttribute("aria-expanded")).toBe("true");
          expect(body.inert).toBe(false);
        });

        test("open is controlled through preventDefault", async () => {
          const g = await group(html`<tc-tool-call-card name="a" status="success" duration="10"></tc-tool-call-card>`);
          const seen: unknown[] = [];
          on(g, "tc-open-change", (e) => {
            e.preventDefault();
            seen.push(e.detail.open);
          });
          head(g).click();
          await settle();
          expect(seen).toEqual([true]);
          expect(head(g).getAttribute("aria-expanded")).toBe("false");
          g.open = true;
          await settle();
          expect(head(g).getAttribute("aria-expanded")).toBe("true");
        });

        test("cards added later are counted", async () => {
          const g = await group(html`<tc-tool-call-card name="a" status="success" duration="10"></tc-tool-call-card>`);
          const card = document.createElement("tc-tool-call-card");
          card.name = "b";
          card.status = "error";
          g.querySelector(".ui-tc-group__list")!.append(card);
          await settle();
          await settle();
          expect(g.querySelector(".ui-tc-group__label")!.textContent).toBe("Used 2 tools");
          expect(g.querySelector(".ui-tc-group__failed")!.textContent).toBe("· 1 failed");
        });
      });
    });
  }

  test("custom icon and summary elements are cloned", async () => {
    const mark = () => {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("data-mine", "");
      return s;
    };
    const icon = mark();
    const summary = document.createElement("b");
    summary.textContent = "Bold";
    const el = await fixture<TcToolCallCard>(html`<tc-tool-call-card name="a" status="success" .icon=${icon} .summary=${summary}></tc-tool-call-card>`);
    expect(el.querySelector(".ui-tc__icon svg[data-mine]")).toBeTruthy();
    expect(el.querySelector(".ui-tc__summary b")!.textContent).toBe("Bold");
    expect(icon.isConnected || summary.isConnected).toBe(false);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-tool-call-card name="search_web" summary="Searched" status="success" duration="400" open .args=${{ q: 1 }} .result=${{ ok: true }}></tc-tool-call-card>
      <tc-tool-call-card look="clean" name="fetch" status="error" error="Timeout" open .onRetry=${() => {}}></tc-tool-call-card>
      <tc-tool-call-group look="clean" open><div slot="list" class="ui-tc__body"><div class="ui-tc__clip"><div class="ui-tc-group__list">
        <tc-tool-call-card look="clean" name="a" status="running" .startedAt=${0}></tc-tool-call-card>
      </div></div></div></tc-tool-call-group>
    </div>`);
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        a.cancel();
      }
    }
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
