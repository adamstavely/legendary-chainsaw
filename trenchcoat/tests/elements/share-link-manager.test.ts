/*
 * <tc-share-link-manager> in real browsers: status in words, no passwords, unsafe addresses, Copy, Change expiry, Revoke
 * with its question, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/share-link-manager";
import { shareLinkStatus, type ShareLink, type ShareLinkCopy, type ShareLinksChange, type TcShareLinkManager } from "../../src/elements/share-link-manager";
import { ShareLinkManager } from "../../src/elements/react/share-link-manager";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 9, 31);
const DAY = 86_400_000;
const base = { createdBy: "Noor", createdAt: NOW - DAY, access: "Can view" };
const LINKS: ShareLink[] = [
  { ...base, id: "a", label: "Board", url: "https://example.org/a", expiresAt: NOW + 40 * DAY, password: true, opens: 12 },
  { ...base, id: "b", url: "https://example.org/b", expiresAt: NOW + 2 * DAY, opens: 1 },
  { ...base, id: "c", url: "https://example.org/c", expiresAt: NOW - DAY },
  { ...base, id: "d", url: "https://example.org/d", status: "revoked" },
  { ...base, id: "e", url: "javascript:alert(1)" },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const mount = async (node: React.ReactElement) => {
  const host = document.body.appendChild(document.createElement("div"));
  const root = createRoot(host);
  await act(async () => root.render(node));
  await settle();
  return { host, root };
};
const manager = (links = LINKS) => fixture<TcShareLinkManager>(html`<tc-share-link-manager .links=${links} .now=${NOW}></tc-share-link-manager>`);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-link="${id}"]`)!;
const status = (el: Element, id: string) => text(row(el, id).querySelector(".ui-slm__status"));

describe("tc-share-link-manager", () => {
  test("status is worked out, in words", async () => {
    const el = await manager();
    expect(el.dataset.ui).toBe("slm");
    expect(["a", "b", "c", "d"].map((id) => status(el, id))).toEqual(["Active", "Expiring soon", "Expired", "Revoked"]);
    expect(shareLinkStatus({ expiresAt: NOW - DAY }, undefined)).toBe("active");
    expect(shareLinkStatus({ expiresAt: NOW + 10 * DAY }, NOW, 30)).toBe("expiring");
  });

  test("says there's a password, and never shows one", async () => {
    const el = await manager([{ ...LINKS[0]!, password: "hunter2" as unknown as boolean }]);
    expect(text(row(el, "a").querySelector(".ui-slm__password"))).toBe("Password protected");
    expect(el.textContent).not.toContain("hunter2");
  });

  test("an unsafe address can't be opened or copied, and says so", async () => {
    const el = await manager();
    const r = row(el, "e");
    expect(r.querySelector("a")).toBeNull();
    expect(r.querySelector<HTMLButtonElement>(".ui-slm__copy")!.disabled).toBe(true);
    expect(text(r.querySelector(".ui-slm__unsafe"))).toContain("isn't safe");
    expect(row(el, "a").querySelector("a")!.getAttribute("rel")).toContain("noopener");
  });

  test("revoked links have no actions, and expired ones can't be copied", async () => {
    const el = await manager();
    expect(row(el, "d").querySelector(".ui-slm__actions")).toBeNull();
    expect(row(el, "c").querySelector(".ui-slm__copy")).toBeNull();
    expect(row(el, "c").querySelector("a")).toBeNull();
    expect(row(el, "c").querySelector(".ui-slm__change")).toBeTruthy();
  });

  test("Copy fires, and preventDefault takes over", async () => {
    const el = await manager();
    const seen: ShareLinkCopy[] = [];
    el.addEventListener("tc-copy", (e) => {
      e.preventDefault();
      seen.push((e as CustomEvent<ShareLinkCopy>).detail);
    });
    row(el, "a").querySelector<HTMLElement>(".ui-slm__copy")!.click();
    expect(seen[0]!.link.id).toBe("a");
  });

  test("Revoke asks first, with how many opens, and Keep backs out", async () => {
    const el = await manager();
    const seen: ShareLinksChange[] = [];
    el.addEventListener("tc-links-change", (e) => seen.push((e as CustomEvent<ShareLinksChange>).detail));
    const r = row(el, "a");
    r.querySelector<HTMLElement>(".ui-slm__revoke")!.click();
    await settle();
    expect(text(r.querySelector(".ui-slm__confirm"))).toContain("opened 12 times");
    await expect.poll(() => document.activeElement).toBe(r.querySelector(".ui-slm__keep"));
    r.querySelector<HTMLElement>(".ui-slm__keep")!.click();
    await settle();
    expect(seen).toHaveLength(0);
    r.querySelector<HTMLElement>(".ui-slm__revoke")!.click();
    await settle();
    r.querySelector<HTMLElement>(".ui-slm__confirm-revoke")!.click();
    await settle();
    expect(seen[0]!.change).toBe("revoke");
    expect(status(el, "a")).toBe("Revoked");
    await expect.poll(() => document.activeElement).toBe(r.querySelector(".ui-slm__name"));
  });

  test("the question fits how many opens there were", async () => {
    const el = await manager();
    row(el, "b").querySelector<HTMLElement>(".ui-slm__revoke")!.click();
    await settle();
    expect(text(row(el, "b").querySelector(".ui-slm__confirm"))).toContain("opened once");
  });

  test("Change expiry saves a date, and needs one", async () => {
    const el = await manager();
    const seen: ShareLinksChange[] = [];
    el.addEventListener("tc-links-change", (e) => seen.push((e as CustomEvent<ShareLinksChange>).detail));
    const r = row(el, "c");
    r.querySelector<HTMLElement>(".ui-slm__change")!.click();
    await settle();
    await expect.poll(() => document.activeElement).toBe(r.querySelector(".ui-slm__date"));
    expect(r.querySelector<HTMLButtonElement>(".ui-slm__save")!.disabled).toBe(true);
    const input = r.querySelector<HTMLInputElement>(".ui-slm__date")!;
    input.value = "2027-01-15";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    r.querySelector<HTMLElement>(".ui-slm__save")!.click();
    await settle();
    expect(seen[0]!.change).toBe("expiry");
    expect(status(el, "c")).toBe("Active");
  });

  test("preventDefault keeps the links", async () => {
    const el = await manager();
    el.addEventListener("tc-links-change", (e) => e.preventDefault());
    row(el, "a").querySelector<HTMLElement>(".ui-slm__revoke")!.click();
    await settle();
    row(el, "a").querySelector<HTMLElement>(".ui-slm__confirm-revoke")!.click();
    await settle();
    expect(el.links).toBe(LINKS);
    expect(status(el, "a")).toBe("Active");
  });

  test("Create fires with creatable, and says so when empty", async () => {
    const el = await fixture<TcShareLinkManager>(html`<tc-share-link-manager creatable></tc-share-link-manager>`);
    let made = 0;
    el.addEventListener("tc-create", () => made++);
    expect(text(el.querySelector(".ui-slm__empty"))).toContain("No share links");
    el.querySelector<HTMLElement>(".ui-slm__create")!.click();
    expect(made).toBe(1);
  });
});

describe("React", () => {
  test("controlled links stay until the parent changes them", async () => {
    const seen: ShareLink[][] = [];
    const { host, root } = await mount(React.createElement(ShareLinkManager, { links: LINKS, now: NOW, onLinksChange: (l: ShareLink[]) => seen.push(l) }));
    const el = host.querySelector<TcShareLinkManager>("tc-share-link-manager")!;
    await act(async () => row(el, "a").querySelector<HTMLElement>(".ui-slm__revoke")!.click());
    await settle();
    await act(async () => row(el, "a").querySelector<HTMLElement>(".ui-slm__confirm-revoke")!.click());
    expect(seen).toHaveLength(1);
    expect(el.links).toBe(LINKS);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}><tc-share-link-manager .links=${LINKS} .now=${NOW} creatable></tc-share-link-manager></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
