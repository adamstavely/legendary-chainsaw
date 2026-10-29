/*
 * <tc-identifier-details> in real browsers: findIdentifiers (DOIs, IPv4 and IPv6, hashes, CVE ids, tracking numbers,
 * and the lookalikes that stay plain), ipRange, the marks, the card by hover, focus and right-click, each kind's facts
 * and links, what the app knows (severity chip, status, owner, network), lookups through the resolver and the event,
 * loading / error / nothing known, Copy, tc-open, `kinds`, leaving and coming back, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/identifier-details";
import {
  findIdentifiers,
  ipRange,
  type IdentifierCopyDetail,
  type IdentifierInfo,
  type IdentifierKind,
  type IdentifierLookupDetail,
  type IdentifierMatch,
  type IdentifierOpenDetail,
  type IdentifierResolver,
  type TcIdentifierDetails,
} from "../../src/elements/identifier-details";
import { IdentifierDetails } from "../../src/elements/react/identifier-details";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const found = (t: string, kinds?: IdentifierKind[]) => findIdentifiers(t, kinds).map((m) => `${m.kind}:${m.text}`);

const MD5 = "9e107d9d372bb6826bd81d3542a419d6";
const SHA1 = "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12";
const SHA256 = "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592";

describe("findIdentifiers", () => {
  test("DOIs: the suffix runs to whitespace, without a sentence's closing punctuation", () => {
    const m = findIdentifiers("Method from doi:10.5555/example.2026.0142, see also (https://doi.org/10.1000/xyz_(1)).");
    expect(m.map((x) => x.text)).toEqual(["10.5555/example.2026.0142", "10.1000/xyz_(1)"]);
    expect(found("v10.5555/abc and 210.5555/abc")).toEqual([]);
  });

  test("CVE ids in either case, normalised to upper case; years before 1999 stay plain", () => {
    const m = findIdentifiers("Patched CVE-2026-0001 and cve-2025-123456; not CVE-1990-1234.");
    expect(m.map((x) => x.value)).toEqual(["CVE-2026-0001", "CVE-2025-123456"]);
  });

  test("IPv4 with an optional prefix; octets past 255, leading zeros and versions stay plain", () => {
    expect(found("Blocked 192.0.2.44 and 198.51.100.0/24; ignore 256.1.1.1, 10.01.1.1, v1.2.3.4, 1.2.3.4.5 and 10.0.0.1/33.")).toEqual(["ip:192.0.2.44", "ip:198.51.100.0/24"]);
  });

  test("IPv6: full and compressed, normalised to the shortest form; times and code stay plain", () => {
    const m = findIdentifiers("From 2001:0DB8:0000:0000:0000:0000:0000:0001, then 2001:db8::7/64 and ::1: loopback. Not 10:30:00 or std::vector or a::b.");
    expect(m.map((x) => [x.text, x.value])).toEqual([
      ["2001:0DB8:0000:0000:0000:0000:0000:0001", "2001:db8::1"],
      ["2001:db8::7/64", "2001:db8::7/64"],
      ["::1", "::1"],
    ]);
  });

  test("hashes by length, hex in one case with a digit and a letter; other lengths, all digits and Mixed case stay plain", () => {
    expect(found(`md5 ${MD5}, sha1 ${SHA1.toUpperCase()}, sha256 ${SHA256}`).map((s) => s.split(":")[0])).toEqual(["hash", "hash", "hash"]);
    expect(findIdentifiers(`x ${SHA1.toUpperCase()}`)[0].value).toBe(SHA1);
    expect(found(`ids 12345678901234567890123456789012, short abcdef0123, mixed 9E107d9d372bb6826bd81d3542a419d6, long ${SHA256}0`)).toEqual([]);
  });

  test("tracking numbers: UPS 1Z on its own, others only after a carrier's name", () => {
    expect(found("UPS 1Z999AA10123456784; FedEx tracking # 449044304137821; DHL: 1234567890; Royal Mail no. AB123456789GB")).toEqual([
      "tracking:1Z999AA10123456784",
      "tracking:449044304137821",
      "tracking:1234567890",
      "tracking:AB123456789GB",
    ]);
    const m = findIdentifiers("FedEx tracking # 449044304137821 and 1Z999AA10123456784");
    expect(m.map((x) => x.carrier)).toEqual(["FedEx", "UPS"]);
    expect(found("Order 449044304137821; the DHL depot closes; ups and downs")).toEqual([]);
  });

  test("kinds limits what's found", () => {
    const t = `CVE-2026-0001 on 192.0.2.10, hash ${MD5}`;
    expect(found(t, ["ip"])).toEqual(["ip:192.0.2.10"]);
    expect(found(t, ["cve", "hash"])).toEqual(["cve:CVE-2026-0001", `hash:${MD5}`]);
  });
});

describe("ipRange", () => {
  test("names the range an address falls in", () => {
    const scope = (v: string) => ipRange(v)?.scope;
    expect(["10.4.0.1", "172.20.1.1", "192.168.1.1", "127.0.0.1", "169.254.1.1", "100.64.0.1", "192.0.2.1", "224.0.0.1", "240.0.0.1", "255.255.255.255", "8.8.8.8"].map(scope)).toEqual([
      "private", "private", "private", "loopback", "link-local", "shared", "documentation", "multicast", "reserved", "broadcast", "public",
    ]);
    expect(["::", "::1", "fe80::1", "fd12::1", "2001:db8::1", "ff02::1", "::ffff:c000:201", "2606:4700::1"].map(scope)).toEqual([
      "unspecified", "loopback", "link-local", "private", "documentation", "multicast", "mapped", "public",
    ]);
    expect(ipRange("192.168.1.1")!.block).toBe("192.168.0.0/16");
    expect(ipRange("not an address")).toBeNull();
  });
});

/* ---------- The element ---------- */

const TEXT = `Indicators: CVE-2026-0001 exploited from 192.0.2.44 and 2001:db8::7.\nDropper ${SHA256}; write-up doi:10.5555/example.2026.0142. Replacement disk: UPS 1Z999AA10123456784.`;
const INFO: Record<string, IdentifierInfo> = {
  "cve:CVE-2026-0001": { title: "Example heap overflow in the badge reader firmware", severity: "critical", score: 9.8, summary: "Made-up advisory for this example.", links: [{ label: "Vendor advisory", url: "https://vendor.example.org/adv/1" }, { label: "Bad", url: "javascript:alert(1)" }] },
  "ip:192.0.2.44": { owner: "Example Hosting Ltd", asn: "AS64500", fields: [{ label: "First seen", value: "28 Oct 2026" }] },
  "tracking:1Z999AA10123456784": { status: "Out for delivery" },
};
type Calls = { kind: IdentifierKind; value: string; signal: AbortSignal }[];
const resolver = (calls: Calls, ms = 0): IdentifierResolver =>
  (kind, value, signal) => {
    calls.push({ kind, value, signal });
    return new Promise((res) => setTimeout(() => res(INFO[`${kind}:${value}`] ?? null), ms));
  };

const make = (o: { look?: string; resolve?: IdentifierResolver; text?: string; trigger?: string } = {}) =>
  fixture<TcIdentifierDetails>(html`<tc-identifier-details style="width: 560px" look=${o.look ?? "standard"} hover-delay="60" trigger=${o.trigger ?? "both"} .text=${o.text ?? TEXT} .resolve=${o.resolve}></tc-identifier-details>`);
const marksOf = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-idd__mark")];
const card = (el: Element) => el.querySelector<HTMLElement>(".ui-idd__pop");
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const facts = (c: Element) => [...c.querySelectorAll(".ui-idd__fact")].map((f) => plain(f.textContent));
const links = (c: Element) => [...c.querySelectorAll<HTMLAnchorElement>(".ui-idd__link")].map((a) => a.getAttribute("href"));
const named = (c: Element) => (c.getAttribute("aria-labelledby") ?? "").split(" ").map((id) => plain(document.getElementById(id)?.textContent)).join(" ");
const opened = async (el: TcIdentifierDetails, check: (c: HTMLElement) => boolean = () => true) => {
  await expect
    .poll(() => {
      const c = card(el);
      return !!c && c.dataset.status !== "loading" && check(c);
    }, { timeout: 3000 })
    .toBe(true);
  await settle(el.parentElement!);
};

describe("tc-identifier-details", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: each identifier becomes a mark; the text is unchanged`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("idd");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-idd__text")!.textContent).toBe(TEXT);
      expect(marksOf(el).map((m) => m.dataset.kind)).toEqual(["cve", "ip", "ip", "hash", "doi", "tracking"]);
      const m = marksOf(el)[0];
      expect(m.getAttribute("aria-haspopup")).toBe("dialog");
      expect(plain(document.getElementById(m.getAttribute("aria-describedby")!)!.textContent)).toBe("CVE details. Tab moves into them");
      expect(card(el)).toBeNull();
    });
  }

  test("hover opens a CVE's card: year, number, severity chip with its word and score, title, NVD and the app's safe links", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls) });
    marksOf(el)[0].dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await wait(20);
    await el.updateComplete;
    expect(card(el)).toBeNull();
    await opened(el);
    const c = card(el)!;
    expect(c.getAttribute("role")).toBe("dialog");
    expect(named(c)).toBe("CVE CVE-2026-0001");
    expect(facts(c)).toEqual(["Year 2026", "Number 0001"]);
    const chip = c.querySelector<HTMLElement>(".ui-idd__chip")!;
    expect(chip.dataset.tone).toBe("danger");
    expect(plain(chip.textContent)).toBe("Critical 9.8 severity");
    expect(plain(c.querySelector(".ui-idd__title")!.textContent)).toBe("Example heap overflow in the badge reader firmware");
    expect(links(c)).toEqual(["https://nvd.nist.gov/vuln/detail/CVE-2026-0001", "https://www.cve.org/CVERecord?id=CVE-2026-0001", "https://vendor.example.org/adv/1"]);
    expect(calls.map((x) => `${x.kind}:${x.value}`)).toEqual(["cve:CVE-2026-0001"]);
    expect(status(el)).toBe("Example heap overflow in the badge reader firmware, Critical severity");
  });

  test("each kind's facts: an address's range, owner and network; IPv6 normalised; a hash's algorithm; a DOI's link; a parcel's carrier and status", async () => {
    const el = await make({ resolve: resolver([]) });
    const [, v4, v6, hash, doi, parcel] = marksOf(el);
    v4.focus();
    await opened(el);
    expect(facts(card(el)!)).toEqual(["Version IPv4", "Range Reserved for documentation (192.0.2.0/24)"]);
    expect([...card(el)!.querySelectorAll(".ui-idd__field")].map((f) => plain(f.textContent))).toEqual(["Owner Example Hosting Ltd", "Network AS64500", "First seen 28 Oct 2026"]);
    v6.focus();
    await opened(el, (c) => named(c) === "IP address 2001:db8::7");
    expect(facts(card(el)!)).toEqual(["Version IPv6", "Range Reserved for documentation (2001:db8::/32)"]);
    expect(plain(card(el)!.querySelector(".ui-idd__msg")!.textContent)).toBe("Nothing more known.");
    hash.focus();
    await opened(el, (c) => c.dataset.kind === "hash");
    expect(facts(card(el)!)).toEqual(["Algorithm SHA-256 (by length)", "Length 64 hex characters, 256 bits"]);
    expect(card(el)!.querySelector(".ui-idd__links")).toBeNull();
    doi.focus();
    await opened(el, (c) => c.dataset.kind === "doi");
    expect(facts(card(el)!)).toEqual(["Prefix 10.5555", "Suffix example.2026.0142"]);
    expect(links(card(el)!)).toEqual(["https://doi.org/10.5555/example.2026.0142"]);
    const a = card(el)!.querySelector<HTMLAnchorElement>(".ui-idd__link")!;
    expect(a.target).toBe("_blank");
    expect(a.rel).toBe("noopener noreferrer");
    parcel.focus();
    await opened(el, (c) => c.dataset.kind === "tracking");
    expect(facts(card(el)!)).toEqual(["Carrier UPS"]);
    expect(plain(card(el)!.querySelector(".ui-idd__chip")!.textContent)).toBe("Out for delivery");
  });

  test("a prefix says how many addresses it covers", async () => {
    const el = await make({ text: "Nets 198.51.100.0/24 and 2001:db8::/32" });
    marksOf(el)[0].focus();
    await opened(el);
    expect(facts(card(el)!)).toContain("Prefix /24 – 256 addresses");
    marksOf(el)[1].focus();
    await opened(el, (c) => named(c).includes("2001"));
    expect(facts(card(el)!)).toContain("Prefix /32 – 2^96 addresses");
  });

  test("right-click opens a card pinned and stops the browser menu, on marks only; Esc closes it and focus returns", async () => {
    const el = await make({ resolve: resolver([]), trigger: "contextmenu" });
    const menu = (t: Element) => {
      const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 });
      t.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(menu(marksOf(el)[5])).toBe(true);
    await opened(el, (c) => c.dataset.kind === "tracking");
    expect(menu(el.querySelector(".ui-idd__text")!)).toBe(false);
    el.closeCard();
    await el.updateComplete;
    marksOf(el)[0].focus();
    await userEvent.keyboard("{Enter}");
    await opened(el, (c) => c.contains(document.activeElement));
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(marksOf(el)[0]);
  });

  test("loading, then an error with Retry, then the details", async () => {
    let fail = true;
    const el = await make({ resolve: (kind, value) => new Promise<IdentifierInfo | null>((res, rej) => setTimeout(() => (fail ? rej(new Error("offline")) : res(INFO[`${kind}:${value}`] ?? null)), 80)) });
    marksOf(el)[0].focus();
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("loading");
    expect(card(el)!.getAttribute("aria-busy")).toBe("true");
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("error");
    expect(status(el)).toBe("Couldn't load the details.");
    fail = false;
    card(el)!.querySelector<HTMLButtonElement>(".ui-idd__retry")!.click();
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("done");
  });

  test("tc-identifier-lookup carries the kind, value and carrier; respondWith() answers before the resolver", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls) });
    const seen: IdentifierLookupDetail[] = [];
    el.addEventListener("tc-identifier-lookup", (e) => {
      const d = (e as CustomEvent<IdentifierLookupDetail>).detail;
      seen.push(d);
      if (d.kind === "tracking") d.respondWith({ status: "Delivered" });
      else e.preventDefault();
    });
    marksOf(el)[5].focus();
    await opened(el, (c) => plain(c.querySelector(".ui-idd__chip")?.textContent) === "Delivered");
    marksOf(el)[1].focus();
    await opened(el, (c) => c.dataset.status === "empty");
    expect(calls).toHaveLength(0);
    expect(seen.map((d) => [d.kind, d.value, d.carrier])).toEqual([
      ["tracking", "1Z999AA10123456784", "UPS"],
      ["ip", "192.0.2.44", undefined],
    ]);
  });

  test("Copy copies the normalised value through a cancelable tc-copy; links fire a cancelable tc-open", async () => {
    const el = await make({ text: "From 2001:0DB8:0:0:0:0:0:0007 per 10.5555/abc" });
    const copies: IdentifierCopyDetail[] = [];
    const opens: IdentifierOpenDetail[] = [];
    el.addEventListener("tc-copy", (e) => {
      copies.push((e as CustomEvent<IdentifierCopyDetail>).detail);
      e.preventDefault();
    });
    el.addEventListener("tc-open", (e) => {
      opens.push((e as CustomEvent<IdentifierOpenDetail>).detail);
      e.preventDefault();
    });
    marksOf(el)[0].focus();
    await opened(el);
    const copy = card(el)!.querySelector<HTMLButtonElement>(".ui-idd__copy")!;
    expect(plain(copy.textContent)).toBe("Copy");
    copy.click();
    expect(copies).toEqual([{ text: "2001:db8::7", kind: "ip" }]);
    marksOf(el)[1].focus();
    await opened(el, (c) => c.dataset.kind === "doi");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    card(el)!.querySelector(".ui-idd__link")!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(opens).toEqual([{ kind: "doi", value: "10.5555/abc", url: "https://doi.org/10.5555/abc" }]);
  });

  test("kinds limits the marks; a change that removes the open card's identifier closes it with tc-open-change(null)", async () => {
    const el = await make({ resolve: resolver([]) });
    const changes: (string | null)[] = [];
    el.addEventListener("tc-open-change", (e) => changes.push((e as CustomEvent).detail.open?.kind ?? null));
    marksOf(el)[0].focus();
    await opened(el);
    el.kinds = ["ip"];
    await el.updateComplete;
    expect(marksOf(el).map((m) => m.dataset.kind)).toEqual(["ip", "ip"]);
    expect(card(el)).toBeNull();
    expect(changes).toEqual(["cve", null]);
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
    await opened(el, (c) => c.dataset.status === "done");
    expect(calls).toHaveLength(2);
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
      return React.createElement(IdentifierDetails, {
        text: TEXT,
        className: `n${n}`,
        resolve,
        hoverDelay: 60,
        onCopy: (text: string) => (copies.push(text), false),
        onOpenChange: (m: IdentifierMatch | null) => opens.push(m?.value ?? null),
      });
    }
    await act(async () => rootEl.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcIdentifierDetails>("tc-identifier-details")!;
    marksOf(el)[0].focus();
    await act(async () => opened(el));
    card(el)!.querySelector<HTMLButtonElement>(".ui-idd__copy")!.click();
    expect(copies).toEqual(["CVE-2026-0001"]);
    expect(opens).toEqual(["CVE-2026-0001"]);
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
        <tc-identifier-details hover-delay="0" .text=${TEXT} .resolve=${resolver([])}></tc-identifier-details>
        <tc-identifier-details hover-delay="0" look="clean" .text=${TEXT} .resolve=${() => Promise.reject(new Error("down"))}></tc-identifier-details>
        <tc-identifier-details hover-delay="0" look="clean" .text=${TEXT}></tc-identifier-details>
      </div>`);
      const els = [...wrap.querySelectorAll<TcIdentifierDetails>("tc-identifier-details")];
      els.forEach((el, i) => marksOf(el)[i === 0 ? 0 : 3].dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })));
      await expect.poll(() => els.map((el) => card(el)?.dataset.status), { timeout: 3000 }).toEqual(["done", "error", "empty"]);
      await settle(wrap);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
