/*
 * <tc-permission-request> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/permission-request";
import type { PermissionDecision, PermissionEmergencyRequest, PermissionPreviewItem, TcPermissionRequest } from "../../src/elements/permission-request";
import { PermissionRequest } from "../../src/elements/react/permission-request";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});
const fake = () => vi.useFakeTimers({ now: 1_000_000, toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"] });

const agent = { name: "Coder" };
const button = (el: Element, name: RegExp) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => name.test(b.textContent!.trim()))!;
const radio = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((b) => b.textContent!.trim() === name)!;
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const make = (look: "standard" | "clean", extra: Partial<TcPermissionRequest> = {}) =>
  fixture<TcPermissionRequest>(html`<tc-permission-request look=${look} .agent=${agent} action="push to main" duration="1" .scope=${extra.scope ?? "once"} .decision=${extra.decision ?? null} .now=${extra.now}></tc-permission-request>`);

describe("tc-permission-request", () => {
  test("the host is the root, with the look, the risk and the state", async () => {
    const el = await make("standard");
    expect(el.dataset.ui).toBe("pr");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.risk).toBe("risky");
    expect(el.dataset.state).toBe("pending");
    const card = el.querySelector(".ui-pr__card")!;
    expect(card.getAttribute("role")).toBe("group");
    expect(document.getElementById(card.getAttribute("aria-labelledby")!)!.textContent).toBe("Coder wants to push to main");
    // A short header above the sentence, the risk pill at its right
    expect(card.querySelector(":scope > .tc-head:first-child h3.tc-head__title")!.textContent).toBe("Permission");
    expect(card.querySelector('.tc-head__aside > .ui-pr__risk[data-risk="risky"]')).toBeTruthy();
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: scope and decision follow their properties`, async () => {
      const el = await make(look);
      const checked = () => el.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.dataset.scope;
      expect(checked()).toBe("once");
      el.scope = "timed";
      await settle();
      expect(checked()).toBe("timed");
      el.decision = { allow: false, scope: "once", at: 0 };
      await settle();
      expect(el.querySelector('.ui-pr__result[data-kind="denied"]')).toBeTruthy();
      expect(el.dataset.state).toBe("denied");
      el.decision = null;
      await settle();
      expect(el.querySelector('.ui-pr__card[role="group"]')).toBeTruthy();
    });

    test(`${look}: tc-expire fires once when a timed grant runs out on the internal clock, then the clock stops`, async () => {
      fake();
      const el = await make(look, { scope: "timed" });
      const expired: PermissionDecision[] = [];
      const decisions: (PermissionDecision | null)[] = [];
      el.addEventListener("tc-expire", (e) => expired.push((e as CustomEvent<{ decision: PermissionDecision }>).detail.decision));
      el.addEventListener("tc-decision-change", (e) => decisions.push((e as CustomEvent<{ decision: PermissionDecision | null }>).detail.decision));
      button(el, /Allow for/).click();
      await settle();
      expect(decisions[0]).toMatchObject({ allow: true, scope: "timed", at: 1_000_000, until: 1_060_000 });
      expect(el.querySelector(".ui-pr__result-note")!.textContent).toContain("1 min left");
      // The live region names the outcome, never the countdown
      expect(status(el)).toBe("Allowed for 1 min: Coder may push to main");
      vi.advanceTimersByTime(59_000);
      await settle();
      expect(expired).toHaveLength(0);
      vi.advanceTimersByTime(2_000);
      await settle();
      expect(expired).toHaveLength(1);
      expect(expired[0]).toMatchObject({ until: 1_060_000 });
      expect(status(el)).toContain("Access expired");
      expect(status(el)).not.toMatch(/min left/);
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(10_000);
      await settle();
      expect(expired).toHaveLength(1);
    });

    test(`${look}: tc-expire follows a passed-in clock`, async () => {
      const decision: PermissionDecision = { allow: true, scope: "timed", at: 0, until: 60_000 };
      const el = await make(look, { decision, now: 30_000 });
      let n = 0;
      el.addEventListener("tc-expire", () => n++);
      await settle();
      expect(n).toBe(0);
      el.now = 60_000;
      await settle();
      el.now = 61_000;
      await settle();
      expect(n).toBe(1);
    });

    test(`${look}: rendering a timed grant doesn't read the clock`, async () => {
      const spy = vi.spyOn(Date, "now");
      const decision: PermissionDecision = { allow: true, scope: "timed", at: 0, until: 60_000 };
      await make(look, { decision });
      // The only read is the countdown's first, after the first render
      expect(spy.mock.calls.length).toBeLessThanOrEqual(1);
      spy.mockRestore();
    });

    test(`${look}: controlled decision – the page decides, the element only reports`, async () => {
      const el = await make(look);
      const seen: (PermissionDecision | null)[] = [];
      el.addEventListener("tc-decision-change", (e) => {
        e.preventDefault();
        seen.push((e as CustomEvent<{ decision: PermissionDecision | null }>).detail.decision);
      });
      button(el, /^Deny/).click();
      await settle();
      expect(seen[0]).toMatchObject({ allow: false });
      expect(el.querySelector('.ui-pr__card[role="group"]')).toBeTruthy();
    });

    test(`${look}: controlled scope – a click is reported, not applied`, async () => {
      const el = await make(look);
      el.addEventListener("tc-scope-change", (e) => e.preventDefault());
      radio(el, "Always").click();
      await settle();
      expect(radio(el, "Just once").getAttribute("aria-checked")).toBe("true");
    });

    test(`${look}: Enter while composing (IME) does nothing`, async () => {
      const el = await make(look);
      const seen: unknown[] = [];
      el.addEventListener("tc-decision-change", (e) => seen.push((e as CustomEvent).detail.decision));
      const card = el.querySelector(".ui-pr__card")!;
      key(card, "Enter", { isComposing: true });
      expect(seen).toHaveLength(0);
      key(card, "Enter");
      expect(seen[0]).toMatchObject({ allow: true });
    });

    test(`${look}: no role=dialog on the inline card; the live region is there from mount and empty while it waits`, async () => {
      const el = await make(look);
      expect(el.querySelector('[role="dialog"]')).toBeNull();
      expect(status(el)).toBe("");
    });

    test(`${look}: Allow moves focus to the decided line's button, Revoke brings it back to Allow`, async () => {
      const el = await make(look, { scope: "timed" });
      const allow = button(el, /Allow for/);
      allow.focus();
      allow.click();
      await settle();
      const revoke = button(el, /^Revoke$/);
      expect(document.activeElement).toBe(revoke);
      revoke.click();
      await settle();
      expect(document.activeElement).toBe(button(el, /Allow for/));
      expect(status(el)).toBe("");
    });

    test(`${look}: Deny (by Esc from a scope) moves focus to Change, and announces the result once`, async () => {
      const el = await make(look);
      const once = radio(el, "Just once");
      once.focus();
      key(once, "Escape");
      await settle();
      expect(document.activeElement).toBe(button(el, /^Change$/));
      expect(status(el)).toBe("Denied: Coder may not push to main");
    });

    test(`${look}: when the right runs out, focus stays on the same button (Revoke → Ask again)`, async () => {
      fake();
      const el = await make(look, { scope: "timed" });
      button(el, /Allow for/).click();
      await settle();
      const b = button(el, /^Revoke$/);
      b.focus();
      vi.advanceTimersByTime(61_000);
      await settle();
      expect(b.textContent).toBe("Ask again");
      expect(document.activeElement).toBe(b);
    });

    test(`${look}: a controlling page that keeps the request – focus returns to Allow, not the card or <body>`, async () => {
      const el = await make(look);
      el.addEventListener("tc-decision-change", (e) => e.preventDefault());
      const allow = button(el, /^Allow once/);
      allow.focus();
      allow.click();
      await settle();
      await new Promise((r) => setTimeout(r, 50));
      expect(document.activeElement).toBe(allow);
    });

    test(`${look}: a page swapping in a decision while focus is inside – focus lands on the result's button`, async () => {
      const el = await make(look);
      radio(el, "Always").focus();
      el.decision = { allow: false, scope: "once", at: 0 };
      await settle();
      expect(document.activeElement).toBe(button(el, /^Change$/));
    });

    test(`${look}: scopes – radiogroup with arrow keys and roving tabindex`, async () => {
      const el = await make(look);
      const once = radio(el, "Just once");
      expect(once.tabIndex).toBe(0);
      once.focus();
      key(once, "ArrowRight");
      await settle();
      const timed = radio(el, "1 min");
      expect(timed.getAttribute("aria-checked")).toBe("true");
      expect(document.activeElement).toBe(timed);
      expect(once.tabIndex).toBe(-1);
      key(timed, "ArrowLeft");
      await settle();
      expect(document.activeElement).toBe(once);
    });
  }

  test("destructive: always isn't offered, the hint says why", async () => {
    const el = await fixture<TcPermissionRequest>(html`<tc-permission-request .agent=${agent} action="drop the table" risk="destructive"></tc-permission-request>`);
    expect(radio(el, "Always")).toBeUndefined();
    expect(el.querySelector(".ui-pr__hint")!.textContent).toMatch(/can't be allowed for always/);
    expect(el.dataset.risk).toBe("destructive");
  });

  test("preview: N more / Show less; icons, avatar and meta elements are cloned", async () => {
    const avatar = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    avatar.setAttribute("data-avatar", "");
    const meta = document.createElement("b");
    meta.textContent = "$240";
    const preview: PermissionPreviewItem[] = ["a", "b", "c", "d", "e"].map((id) => ({ id, label: `${id}.ts`, meta: id === "a" ? meta : "+1" }));
    const el = await fixture<TcPermissionRequest>(html`<tc-permission-request .agent=${{ name: "Coder", avatar }} action="push" .preview=${preview}></tc-permission-request>`);
    expect(el.querySelector(".ui-pr__avatar svg[data-avatar]")).toBeTruthy();
    expect(el.querySelector(".ui-pr__item-meta b")!.textContent).toBe("$240");
    expect(avatar.isConnected).toBe(false);
    expect(el.querySelectorAll(".ui-pr__item")).toHaveLength(3);
    const more = el.querySelector<HTMLButtonElement>(".ui-pr__more")!;
    expect(more.textContent).toBe("2 more");
    more.click();
    await settle();
    expect(el.querySelectorAll(".ui-pr__item")).toHaveLength(5);
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(more.textContent).toBe("Show less");
  });

  test("React wrapper: an uncontrolled decision survives a parent re-render", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(PermissionRequest, { agent: { name: "Coder", avatar: React.createElement("i", null, "C") }, action: "push", onDecisionChange: (d) => void seen.push(d), "data-n": n } as React.ComponentProps<typeof PermissionRequest>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-permission-request")!;
    expect(el.querySelector(".ui-pr__avatar i")!.textContent).toBe("C");
    button(el, /^Deny/).click();
    await settle();
    expect(seen[0]).toMatchObject({ allow: false });
    await act(async () => bump());
    await settle();
    expect(el.dataset.state).toBe("denied");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: emergency – offered only when listed; asks for a justification and an urgency window`, async () => {
      const plain = await make(look);
      expect(radio(plain, "Emergency")).toBeUndefined();
      const el = await fixture<TcPermissionRequest>(html`<tc-permission-request look=${look} .agent=${agent} action="restore the database" risk="destructive" .scopes=${["once", "emergency"]}></tc-permission-request>`);
      expect(el.querySelector(".ui-pr__sos")).toBeNull();
      radio(el, "Emergency").click();
      await settle();
      expect(el.querySelector(".ui-pr__sos")).toBeTruthy();
      const field = el.querySelector<HTMLTextAreaElement>(".ui-pr__why-field")!;
      expect(el.querySelector<HTMLLabelElement>(`label[for="${field.id}"]`)!.textContent).toBe("Why can't this wait?");
      expect(field.getAttribute("aria-required")).toBe("true");
      const group = el.querySelector('.ui-pr__urgencies[role="radiogroup"]')!;
      expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent).toBe("How urgent");
      expect([...group.querySelectorAll('[role="radio"]')].map((r) => r.textContent!.trim())).toEqual(["Standard30 min", "Urgent15 min", "Critical5 min"]);
      expect(group.querySelector('[aria-checked="true"]')!.textContent).toContain("Standard");
      expect(button(el, /Request emergency access/)).toBeTruthy();
    });

    test(`${look}: emergency – no justification, no request: the field says so and takes focus`, async () => {
      const el = await fixture<TcPermissionRequest>(html`<tc-permission-request look=${look} .agent=${agent} action="restore the database" .scopes=${["emergency"]} scope="emergency"></tc-permission-request>`);
      const seen: unknown[] = [];
      el.addEventListener("tc-emergency-request", (e) => seen.push(e));
      el.addEventListener("tc-decision-change", (e) => seen.push(e));
      button(el, /Request emergency access/).click();
      await settle();
      expect(seen).toHaveLength(0);
      const field = el.querySelector<HTMLTextAreaElement>(".ui-pr__why-field")!;
      expect(field.getAttribute("aria-invalid")).toBe("true");
      expect(document.getElementById(field.getAttribute("aria-describedby")!)!.textContent).toMatch(/Say why it can't wait/);
      expect(document.activeElement).toBe(field);
      // Enter in the justification makes a new line, never a request
      key(field, "Enter");
      expect(seen).toHaveLength(0);
    });

    test(`${look}: emergency – a cancelable request carrying the justification; granted, the banner shows the time left as given`, async () => {
      const el = await fixture<TcPermissionRequest>(html`<tc-permission-request look=${look} .agent=${agent} action="restore the database" .scopes=${["once", "emergency"]} scope="emergency" .now=${5_000}></tc-permission-request>`);
      const requests: PermissionEmergencyRequest[] = [];
      let refuse = true;
      el.addEventListener("tc-emergency-request", (e) => {
        requests.push((e as CustomEvent<PermissionEmergencyRequest>).detail);
        if (refuse) e.preventDefault();
      });
      const field = el.querySelector<HTMLTextAreaElement>(".ui-pr__why-field")!;
      field.value = "  Checkout is down  ";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      const urgent = el.querySelector<HTMLElement>('[data-urgency="standard"]')!;
      urgent.focus();
      key(urgent, "ArrowRight");
      await settle();
      expect(document.activeElement).toBe(el.querySelector('[data-urgency="urgent"]'));
      expect(el.querySelector('[data-urgency="urgent"]')!.getAttribute("aria-checked")).toBe("true");
      button(el, /Request emergency access/).click();
      await settle();
      // Refused: nothing is granted
      expect(requests[0]).toMatchObject({ justification: "Checkout is down", urgency: { id: "urgent", window: "15 min" }, decision: { allow: true, scope: "emergency", at: 5_000, urgency: "urgent" } });
      expect(el.decision).toBeNull();
      refuse = false;
      button(el, /Request emergency access/).click();
      await settle();
      expect(el.decision).toMatchObject({ scope: "emergency", justification: "Checkout is down" });
      expect(el.dataset.state).toBe("emergency");
      const banner = el.querySelector<HTMLElement>('.ui-pr__result[data-kind="emergency"]')!;
      expect(banner.querySelector(".ui-pr__result-head")!.textContent).toBe("Emergency access active · restore the database");
      expect(banner.querySelector(".ui-pr__result-note")!.textContent).toBe("Urgent · review due afterwards");
      expect(banner.querySelector(".ui-pr__result-why")!.textContent).toBe("“Checkout is down”");
      expect(status(el)).toBe("Emergency access active: Coder may restore the database");
      el.emergencyRemaining = "3 h 12 min";
      await settle();
      expect(banner.querySelector(".ui-pr__result-note")!.textContent).toBe("3 h 12 min left · Urgent · review due afterwards");
      el.emergencyEnded = true;
      el.reviewDue = "by Fri 31 Oct";
      await settle();
      const ended = el.querySelector('.ui-pr__result[data-kind="emergency-ended"]')!;
      expect(ended.querySelector(".ui-pr__result-head")!.textContent).toBe("Emergency access ended · restore the database");
      expect(ended.querySelector(".ui-pr__result-note")!.textContent).toBe("Review due by Fri 31 Oct");
      expect(el.dataset.state).toBe("emergency-ended");
      expect(status(el)).toBe("Emergency access ended: Coder may not restore the database. Review due by Fri 31 Oct");
      expect(button(el, /^Ask again$/)).toBeTruthy();
    });

    test(`${look}: emergency – rendering the banner never reads the clock; End now takes it back`, async () => {
      const spy = vi.spyOn(Date, "now");
      const decision: PermissionDecision = { allow: true, scope: "emergency", at: 0, justification: "Outage", urgency: "critical" };
      const el = await fixture<TcPermissionRequest>(html`<tc-permission-request look=${look} .agent=${agent} action="restore" .scopes=${["emergency"]} .decision=${decision} emergency-remaining="45 min"></tc-permission-request>`);
      el.emergencyRemaining = "44 min";
      await settle();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(el.querySelector(".ui-pr__result-note")!.textContent).toBe("44 min left · Critical · review due afterwards");
      const seen: unknown[] = [];
      el.addEventListener("tc-decision-change", (e) => seen.push((e as CustomEvent).detail.decision));
      button(el, /^End now$/).click();
      await settle();
      expect(seen).toEqual([null]);
    });
  }

  test("React wrapper: onEmergencyRequest returning false refuses it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    const decided: unknown[] = [];
    let allow = false;
    const App = () =>
      React.createElement(PermissionRequest, {
        agent: { name: "Ops" },
        action: "restore",
        scopes: ["emergency"],
        defaultScope: "emergency",
        emergencyRemaining: "1 h",
        onEmergencyRequest: (r) => {
          asked.push(r.justification);
          return allow;
        },
        onDecisionChange: (d) => void decided.push(d),
      });
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-permission-request")!;
    const field = el.querySelector<HTMLTextAreaElement>(".ui-pr__why-field")!;
    field.value = "Outage";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    button(el, /Request emergency access/).click();
    await settle();
    expect(asked).toEqual(["Outage"]);
    expect(decided).toEqual([]);
    allow = true;
    button(el, /Request emergency access/).click();
    await settle();
    expect(decided[0]).toMatchObject({ scope: "emergency", justification: "Outage" });
    expect(el.querySelector(".ui-pr__result-note")!.textContent).toBe("1 h left · Standard · review due afterwards");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the emergency form and banner`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-permission-request .agent=${agent} action="push to main" reason="The tests passed." .preview=${[{ id: "1", label: "a.ts", meta: "+1" }]}></tc-permission-request>
        <tc-permission-request look="clean" .agent=${agent} action="push to main" .decision=${{ allow: true, scope: "timed", at: 0, until: 60_000 }} .now=${30_000}></tc-permission-request>
        <tc-permission-request .agent=${agent} action="restore" .scopes=${["once", "emergency"]} scope="emergency"></tc-permission-request>
        <tc-permission-request look="clean" .agent=${agent} action="restore" .scopes=${["once", "emergency"]} scope="emergency"></tc-permission-request>
        <tc-permission-request .agent=${agent} action="restore" .decision=${{ allow: true, scope: "emergency", at: 0, justification: "Outage" }} emergency-remaining="45 min"></tc-permission-request>
        <tc-permission-request look="clean" .agent=${agent} action="restore" .decision=${{ allow: true, scope: "emergency", at: 0, justification: "Outage" }} emergency-remaining="45 min"></tc-permission-request>
        <tc-permission-request look="clean" .agent=${agent} action="restore" .decision=${{ allow: true, scope: "emergency", at: 0 }} emergency-ended review-due="by Friday"></tc-permission-request>
      </div>`);
      for (const b of wrap.querySelectorAll<HTMLButtonElement>("tc-permission-request:nth-of-type(3) .ui-pr__btn--primary, tc-permission-request:nth-of-type(4) .ui-pr__btn--primary")) b.click();
      await settle();
      for (const a of wrap.getAnimations?.({ subtree: true }) ?? []) a.finish();
      await settle();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
