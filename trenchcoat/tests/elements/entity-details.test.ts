/*
 * <tc-entity-details> in real browsers: findEntities (emails, phones, links, handles, and the lookalikes that stay
 * plain), the marks, the card by hover, focus, right-click and the Menu key, each kind's facts and action, lookups
 * through the resolver and the event, the cache, loading / error / nothing known, Copy, tc-open, `kinds`, leaving and
 * coming back, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/entity-details";
import { findEntities, phoneCountry, type EntityCopyDetail, type EntityInfo, type EntityKind, type EntityLookupDetail, type EntityMatch, type EntityOpenDetail, type EntityResolver, type TcEntityDetails } from "../../src/elements/entity-details";
import { EntityDetails } from "../../src/elements/react/entity-details";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const found = (t: string, kinds?: EntityKind[]) => findEntities(t, kinds).map((m) => `${m.kind}:${m.text}`);

describe("findEntities", () => {
  test("emails, with the domain in lower case; the @ inside them isn't a handle", () => {
    const m = findEntities("Write to priya.natarajan@Research.Example.org or help+it@example.org.");
    expect(m.map((x) => `${x.kind}:${x.text}`)).toEqual(["email:priya.natarajan@Research.Example.org", "email:help+it@example.org"]);
    expect(m[0].value).toBe("priya.natarajan@research.example.org");
    expect(found("not an address: a..b@example.org, .a@example.org")).toEqual([]);
  });

  test("links: http(s) and bare www., trailing punctuation and unopened brackets left out", () => {
    const t = "See https://intranet.example.org/soc/runbook?id=7. Or (www.example.org/status), or http://legacy.example.org!";
    const m = findEntities(t);
    expect(m.map((x) => x.text)).toEqual(["https://intranet.example.org/soc/runbook?id=7", "www.example.org/status", "http://legacy.example.org"]);
    expect(m[1].value).toBe("https://www.example.org/status");
    expect(m[2].value).toBe("http://legacy.example.org");
    expect(found("https://example.org/wiki/A_(b) and www.nope")).toEqual(["url:https://example.org/wiki/A_(b)"]);
    // An address inside a link is part of the link
    expect(found("https://example.org/u/a@example.org")).toEqual(["url:https://example.org/u/a@example.org"]);
  });

  test("handles: @name and @name@server; not inside words or addresses, and a name needs a letter", () => {
    expect(found("Ping @ops_lead and @analyst@social.example.org; email a@example.org; @3 people; me@")).toEqual(["handle:@ops_lead", "handle:@analyst@social.example.org", "email:a@example.org"]);
  });

  test("phones: international and national formats", () => {
    const m = findEntities("Desk +44 20 7946 0958, night line (555) 010-4477, also 1-555-010-0199 and +14155550142 or +33 1 23 45 67 89.");
    expect(m.map((x) => x.text)).toEqual(["+44 20 7946 0958", "(555) 010-4477", "1-555-010-0199", "+14155550142", "+33 1 23 45 67 89"]);
    expect(m.map((x) => x.value)).toEqual(["+442079460958", "5550104477", "15550100199", "+14155550142", "+33123456789"]);
  });

  test("lookalikes stay plain: dates, versions, IP addresses, card numbers, ids, times, ISBNs", () => {
    expect(
      found("On 2026-10-28 and 28/10/2026 we shipped v1.2.3.4 to 192.0.2.10; card 4111 1111 1111 1111, ticket 40817726512, at 10:30, ISBN 978-0-13-468599-1, ranges 2019-2024."),
    ).toEqual([]);
  });

  test("a run too long for one number keeps the number at its start", () => {
    expect(found("Call (555) 010-4477 12 times")).toEqual(["phone:(555) 010-4477"]);
  });

  test("kinds limits what's found; overlaps are settled first", () => {
    const t = "Mail ops@example.org, call +1 555 010 4477, see https://example.org/a@example.org";
    expect(found(t, ["email"])).toEqual(["email:ops@example.org"]);
    expect(found(t, ["phone", "url"])).toEqual(["phone:+1 555 010 4477", "url:https://example.org/a@example.org"]);
  });

  test("phoneCountry: by the longest calling code", () => {
    expect(phoneCountry("+442079460958")).toBe("United Kingdom");
    expect(phoneCountry("+35312345678")).toBe("Ireland");
    expect(phoneCountry("+15550100199")).toBe("United States or Canada");
    expect(phoneCountry("5550100199")).toBeUndefined();
  });
});

/* ---------- The element ---------- */

const TEXT = "Incident lead: priya.natarajan@example.org (+44 20 7946 0958).\nRunbook at http://legacy.example.org/soc and www.example.org/status – ping @ops_lead.";
const INFO: Record<string, EntityInfo> = {
  "email:priya.natarajan@example.org": {
    name: "Priya Natarajan",
    summary: "Security operations lead, Harbour Research Institute",
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 2'%3E%3Crect width='2' height='2' fill='%23345'/%3E%3C/svg%3E",
    fields: [{ label: "Team", value: "SOC" }],
    links: [{ label: "Directory", url: "https://directory.example.org/pn" }, { label: "Bad", url: "javascript:alert(1)" }],
  },
  "handle:@ops_lead": { name: "Ops lead rota" },
};
type Calls = { kind: EntityKind; value: string; signal: AbortSignal }[];
const resolver = (calls: Calls, ms = 0): EntityResolver =>
  (kind, value, signal) => {
    calls.push({ kind, value, signal });
    return new Promise((res) => setTimeout(() => res(INFO[`${kind}:${value}`] ?? null), ms));
  };

const make = (o: { look?: string; resolve?: EntityResolver; text?: string; trigger?: string } = {}) =>
  fixture<TcEntityDetails>(html`<tc-entity-details style="width: 520px" look=${o.look ?? "standard"} hover-delay="60" trigger=${o.trigger ?? "both"} .text=${o.text ?? TEXT} .resolve=${o.resolve}></tc-entity-details>`);
const marksOf = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-ent__mark")];
const card = (el: Element) => el.querySelector<HTMLElement>(".ui-ent__pop");
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const facts = (c: Element) => [...c.querySelectorAll(".ui-ent__fact")].map((f) => plain(f.textContent));
const named = (c: Element) => (c.getAttribute("aria-labelledby") ?? "").split(" ").map((id) => plain(document.getElementById(id)?.textContent)).join(" ");
const opened = async (el: TcEntityDetails, check: (c: HTMLElement) => boolean = () => true) => {
  await expect
    .poll(() => {
      const c = card(el);
      return !!c && c.dataset.status !== "loading" && check(c);
    }, { timeout: 3000 })
    .toBe(true);
  await settle(el.parentElement!);
};

describe("tc-entity-details", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: each kind becomes a mark; the text is unchanged`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("ent");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-ent__text")!.textContent).toBe(TEXT);
      expect(marksOf(el).map((m) => `${m.dataset.kind}:${m.textContent}`)).toEqual([
        "email:priya.natarajan@example.org",
        "phone:+44 20 7946 0958",
        "url:http://legacy.example.org/soc",
        "url:www.example.org/status",
        "handle:@ops_lead",
      ]);
      const m = marksOf(el)[0];
      expect(m.getAttribute("aria-haspopup")).toBe("dialog");
      expect(m.getAttribute("aria-expanded")).toBe("false");
      expect(plain(document.getElementById(m.getAttribute("aria-describedby")!)!.textContent)).toBe("Email address details. Tab moves into them");
      expect(plain(document.getElementById(marksOf(el)[1].getAttribute("aria-describedby")!)!.textContent)).toBe("Phone number details. Tab moves into them");
      expect(card(el)).toBeNull();
    });
  }

  test("hover opens an email's card after the delay: facts, what the app knows, Copy and Write email", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls) });
    const opens: (EntityMatch | null)[] = [];
    el.addEventListener("tc-open-change", (e) => opens.push((e as CustomEvent).detail.open));
    marksOf(el)[0].dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await wait(20);
    await el.updateComplete;
    expect(card(el)).toBeNull();
    await opened(el);
    const c = card(el)!;
    expect(c.getAttribute("role")).toBe("dialog");
    expect(named(c)).toBe("Email address priya.natarajan@example.org");
    expect(facts(c)).toEqual(["Mailbox priya.natarajan", "Domain example.org"]);
    expect(plain(c.querySelector(".ui-ent__name")!.textContent)).toBe("Priya Natarajan");
    expect(plain(c.querySelector(".ui-ent__summary")!.textContent)).toBe("Security operations lead, Harbour Research Institute");
    expect(plain(c.querySelector(".ui-ent__field")!.textContent)).toBe("Team SOC");
    expect(c.querySelector<HTMLImageElement>(".ui-ent__img")!.src).toContain("data:image/svg+xml");
    // Only the safe link is drawn
    expect([...c.querySelectorAll<HTMLAnchorElement>(".ui-ent__link")].map((a) => a.getAttribute("href"))).toEqual(["https://directory.example.org/pn"]);
    const action = c.querySelector<HTMLAnchorElement>(".ui-ent__action")!;
    expect(plain(action.textContent)).toBe("Write email");
    expect(action.getAttribute("href")).toBe("mailto:priya.natarajan@example.org");
    expect(plain(c.querySelector(".ui-ent__copy")!.textContent)).toBe("Copy");
    expect(calls.map((x) => `${x.kind}:${x.value}`)).toEqual(["email:priya.natarajan@example.org"]);
    expect(opens.map((o) => o?.kind)).toEqual(["email"]);
    expect(status(el)).toBe("Priya Natarajan");
  });

  test("each kind's facts and action: phone with its country and Call; http links warned; www. opens with https; handle's server", async () => {
    const el = await make({ text: "Call +44 20 7946 0958 or (555) 010-4477. http://legacy.example.org/soc www.example.org @analyst@social.example.org" });
    const [intl, natl, http, www, handle] = marksOf(el);
    intl.focus();
    await opened(el);
    expect(facts(card(el)!)).toEqual(["Number +442079460958", "Country United Kingdom", "Type International"]);
    expect(card(el)!.querySelector(".ui-ent__action")!.getAttribute("href")).toBe("tel:+442079460958");
    natl.focus();
    await opened(el, (c) => c.dataset.kind === "phone" && named(c).includes("(555)"));
    expect(facts(card(el)!)).toEqual(["Number (555) 010-4477", "Type National – no country code"]);
    expect(card(el)!.querySelector(".ui-ent__action")!.getAttribute("href")).toBe("tel:5550104477");
    http.focus();
    await opened(el, (c) => c.dataset.kind === "url");
    expect(facts(card(el)!)).toEqual(["Site legacy.example.org", "Path /soc", "Security Not encrypted (http)"]);
    expect(card(el)!.querySelector(".ui-ent__fact[data-warn]")).not.toBeNull();
    const open = card(el)!.querySelector<HTMLAnchorElement>(".ui-ent__action")!;
    expect(open.getAttribute("href")).toBe("http://legacy.example.org/soc");
    expect(open.target).toBe("_blank");
    expect(open.rel).toBe("noopener noreferrer");
    www.focus();
    await opened(el, (c) => named(c).includes("www."));
    expect(facts(card(el)!)).toEqual(["Site example.org", "Security Opens with https (no scheme written)"]);
    expect(card(el)!.querySelector(".ui-ent__action")!.getAttribute("href")).toBe("https://www.example.org");
    handle.focus();
    await opened(el, (c) => c.dataset.kind === "handle");
    expect(facts(card(el)!)).toEqual(["Name @analyst", "Server social.example.org"]);
    expect(card(el)!.querySelector(".ui-ent__action")).toBeNull();
    expect(plain(card(el)!.querySelector(".ui-ent__msg")!.textContent)).toBe("Nothing more known.");
  });

  test("right-click opens a card pinned and stops the browser menu, on marks only; the Menu key opens it and moves in", async () => {
    const el = await make({ resolve: resolver([]), trigger: "contextmenu" });
    const m = marksOf(el)[4];
    expect(plain(document.getElementById(m.getAttribute("aria-describedby")!)!.textContent)).toBe("Handle details. Enter or the Menu key opens them");
    const menu = (t: Element) => {
      const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 });
      t.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(menu(m)).toBe(true);
    await opened(el, (c) => plain(c.querySelector(".ui-ent__name")?.textContent) === "Ops lead rota");
    expect(menu(el.querySelector(".ui-ent__text")!)).toBe(false);
    el.closeCard();
    await el.updateComplete;
    expect(card(el)).toBeNull();
    // Contextmenu-only: focus doesn't open it
    marksOf(el)[0].focus();
    await wait(120);
    await el.updateComplete;
    expect(card(el)).toBeNull();
    await userEvent.keyboard("{ContextMenu}");
    await opened(el, (c) => c.contains(document.activeElement));
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(marksOf(el)[0]);
  });

  test("keyboard: Tab goes into the card, Shift+Tab back, Esc closes and returns focus", async () => {
    const el = await make({ resolve: resolver([]) });
    const [a] = marksOf(el);
    a.focus();
    await opened(el);
    await userEvent.keyboard("{Tab}");
    expect(card(el)!.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(a);
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(a);
  });

  test("cached by kind and value: the same address twice is looked up once; clearCache forgets it", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls), text: "priya.natarajan@example.org and PRIYA.NATARAJAN@EXAMPLE.ORG" });
    const [a, b] = marksOf(el);
    a.focus();
    await opened(el);
    b.focus();
    await opened(el);
    expect(calls).toHaveLength(1);
    el.clearCache({ kind: "email", value: "priya.natarajan@example.org" });
    a.focus();
    await expect.poll(() => calls.length, { timeout: 3000 }).toBe(2);
  });

  test("loading, then an error with Retry, then the details; announced", async () => {
    let fail = true;
    const el = await make({ resolve: (kind, value) => new Promise<EntityInfo | null>((res, rej) => setTimeout(() => (fail ? rej(new Error("offline")) : res(INFO[`${kind}:${value}`] ?? null)), 80)) });
    marksOf(el)[0].focus();
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("loading");
    expect(card(el)!.getAttribute("aria-busy")).toBe("true");
    expect(plain(card(el)!.textContent)).toContain("Looking up details…");
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("error");
    expect(status(el)).toBe("Couldn't load the details.");
    fail = false;
    card(el)!.querySelector<HTMLButtonElement>(".ui-ent__retry")!.click();
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("done");
    expect(status(el)).toBe("Priya Natarajan");
  });

  test("tc-entity-lookup: respondWith() answers before the resolver; preventing without an answer means nothing known", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls) });
    const seen: EntityLookupDetail[] = [];
    el.addEventListener("tc-entity-lookup", (e) => {
      const d = (e as CustomEvent<EntityLookupDetail>).detail;
      seen.push(d);
      if (d.kind === "email") d.respondWith(Promise.resolve({ name: "From the event" }));
      else e.preventDefault();
    });
    marksOf(el)[0].focus();
    await opened(el, (c) => plain(c.querySelector(".ui-ent__name")?.textContent) === "From the event");
    marksOf(el)[1].focus();
    await opened(el, (c) => c.dataset.status === "empty");
    expect(calls).toHaveLength(0);
    expect(seen.map((d) => [d.kind, d.value, d.text])).toEqual([
      ["email", "priya.natarajan@example.org", "priya.natarajan@example.org"],
      ["phone", "+442079460958", "+44 20 7946 0958"],
    ]);
  });

  test("Copy fires a cancelable tc-copy; the action and links fire a cancelable tc-open", async () => {
    const el = await make({ resolve: resolver([]) });
    const copies: EntityCopyDetail[] = [];
    const opens: EntityOpenDetail[] = [];
    el.addEventListener("tc-copy", (e) => {
      copies.push((e as CustomEvent<EntityCopyDetail>).detail);
      e.preventDefault();
    });
    el.addEventListener("tc-open", (e) => {
      opens.push((e as CustomEvent<EntityOpenDetail>).detail);
      e.preventDefault();
    });
    marksOf(el)[1].focus();
    await opened(el);
    card(el)!.querySelector<HTMLButtonElement>(".ui-ent__copy")!.click();
    expect(copies).toEqual([{ text: "+44 20 7946 0958", kind: "phone" }]);
    await el.updateComplete;
    expect(card(el)!.querySelector(".ui-ent__copy[data-done]")).toBeNull();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    card(el)!.querySelector(".ui-ent__action")!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(opens).toEqual([{ kind: "phone", value: "+442079460958", url: "tel:+442079460958" }]);
  });

  test("kinds limits the marks; a change that removes the open card's entity closes it with tc-open-change(null)", async () => {
    const el = await make({ resolve: resolver([]) });
    const changes: (string | null)[] = [];
    el.addEventListener("tc-open-change", (e) => changes.push((e as CustomEvent).detail.open?.kind ?? null));
    marksOf(el)[0].focus();
    await opened(el);
    el.kinds = ["phone", "handle"];
    await el.updateComplete;
    expect(marksOf(el).map((m) => m.dataset.kind)).toEqual(["phone", "handle"]);
    expect(card(el)).toBeNull();
    expect(changes).toEqual(["email", null]);
  });

  test("leaving the page aborts a lookup in flight; back with the card open, it asks again", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls, 200) });
    marksOf(el)[0].focus();
    await wait(30);
    const host = el.parentElement!;
    el.remove();
    expect(calls[0].signal.aborted).toBe(true);
    host.append(el);
    await opened(el, (c) => plain(c.querySelector(".ui-ent__name")?.textContent) === "Priya Natarajan");
    expect(calls).toHaveLength(2);
    expect(calls[1].signal.aborted).toBe(false);
  });

  test("the wrapper: resolve, onCopy (false stops the clipboard write) and onOpenChange; a parent re-render keeps the cache", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const rootEl = createRoot(host);
    const calls: Calls = [];
    const copies: string[] = [];
    const opens: (string | null)[] = [];
    const resolve = resolver(calls);
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(EntityDetails, {
        text: TEXT,
        className: `n${n}`,
        resolve,
        hoverDelay: 60,
        onCopy: (text: string) => (copies.push(text), false),
        onOpenChange: (m: EntityMatch | null) => opens.push(m?.value ?? null),
      });
    }
    await act(async () => rootEl.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcEntityDetails>("tc-entity-details")!;
    marksOf(el)[0].focus();
    await act(async () => opened(el));
    card(el)!.querySelector<HTMLButtonElement>(".ui-ent__copy")!.click();
    expect(copies).toEqual(["priya.natarajan@example.org"]);
    expect(opens).toEqual(["priya.natarajan@example.org"]);
    await act(async () => rerender(1));
    await settle();
    marksOf(el)[0].blur();
    marksOf(el)[0].focus();
    await act(async () => opened(el));
    expect(calls).toHaveLength(1);
    await act(async () => rootEl.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, with details, an error and nothing known open (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-entity-details hover-delay="0" .text=${TEXT} .resolve=${resolver([])}></tc-entity-details>
        <tc-entity-details hover-delay="0" look="clean" .text=${TEXT} .resolve=${() => Promise.reject(new Error("down"))}></tc-entity-details>
        <tc-entity-details hover-delay="0" look="clean" .text=${TEXT}></tc-entity-details>
      </div>`);
      const els = [...wrap.querySelectorAll<TcEntityDetails>("tc-entity-details")];
      els.forEach((el, i) => marksOf(el)[i === 0 ? 0 : 2].dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })));
      await expect.poll(() => els.map((el) => card(el)?.dataset.status), { timeout: 3000 }).toEqual(["done", "error", "empty"]);
      await settle(wrap);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
