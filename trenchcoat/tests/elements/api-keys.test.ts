/*
 * <tc-api-keys> in real browsers: masked keys, status in words, last use, the folded inactive keys, Create key's form
 * and its checks, the secret shown once, Revoke with its question, cancelable events, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/api-keys";
import { apiKeyStatus, type ApiKey, type ApiKeyCreate, type ApiKeyRevoke, type TcApiKeys } from "../../src/elements/api-keys";
import { ApiKeys } from "../../src/elements/react/api-keys";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 20, 15);
const DAY = 86_400_000;
const SCOPES = [
  { id: "cases:read", label: "cases:read", description: "Read cases" },
  { id: "cases:write", label: "cases:write" },
];
const KEYS: ApiKey[] = [
  { id: "a", name: "Reporting export", prefix: "tc_live_", last4: "a91f", createdAt: NOW - 120 * DAY, createdBy: "Noor", lastUsedAt: NOW - 2 * 3_600_000, expiresAt: NOW + 245 * DAY, scopes: ["cases:read"] },
  { id: "b", name: "Case intake bot", prefix: "tc_live_", last4: "07c2", createdAt: NOW - 85 * DAY, lastUsedAt: NOW - 3 * DAY, expiresAt: NOW + 5 * DAY + 3_600_000, scopes: ["cases:read", "cases:write"] },
  { id: "c", name: "Staging sync", prefix: "tc_test_", createdAt: NOW - 10 * DAY },
  { id: "d", name: "Old dashboard", prefix: "tc_live_", last4: "e410", createdAt: NOW - 400 * DAY, expiresAt: NOW - 35 * DAY },
  { id: "e", name: "Contractor laptop", prefix: "tc_live_", last4: "9d01", createdAt: NOW - 200 * DAY, revokedAt: NOW - 59 * DAY },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const keys = (list = KEYS) => fixture<TcApiKeys>(html`<tc-api-keys .keys=${list} .scopes=${SCOPES} .now=${NOW} locale="en-GB"></tc-api-keys>`);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-key="${id}"]`)!;
const status = (el: Element, id: string) => text(row(el, id).querySelector(".ui-akm__status"));
const button = (root: Element, cls: string) => root.querySelector<HTMLButtonElement>(cls)!;

describe("tc-api-keys", () => {
  for (const look of ["standard", "clean"]) {
    test(`renders in ${look}: the heading, Create key and a list of the active keys`, async () => {
      const wrap = await fixture<HTMLElement>(html`<div><tc-api-keys look=${look} .keys=${KEYS} .now=${NOW}></tc-api-keys></div>`);
      const el = wrap.querySelector<TcApiKeys>("tc-api-keys")!;
      expect(el.dataset.ui).toBe("akm");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__title"))).toBe("API keys");
      expect(text(button(el, ".ui-akm__create"))).toBe("Create key");
      const list = el.querySelector(".ui-akm__list")!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)).toBe(el.querySelector(".tc-head__title"));
      expect(list.querySelectorAll(":scope > .ui-akm__row")).toHaveLength(3);
    });
  }

  test("each key: masked value, permissions, who made it, last use and status in words", async () => {
    const el = await keys();
    expect(text(row(el, "a").querySelector(".ui-akm__masked"))).toBe("Key starting tc_live_…a91f");
    expect([...row(el, "b").querySelectorAll(".ui-akm__chip")].map(text)).toEqual(["cases:read", "cases:write"]);
    expect(text(row(el, "c").querySelector(".ui-akm__chip"))).toBe("No permissions");
    expect(text(row(el, "a").querySelector(".ui-akm__facts"))).toMatch(/^Made by Noor, .+ Last used 2 hours ago Expires .+$/);
    expect(text(row(el, "c").querySelector(".ui-akm__facts"))).toContain("Never used");
    expect(text(row(el, "c").querySelector(".ui-akm__facts"))).toContain("Doesn't expire");
    expect(status(el, "a")).toBe("Active");
    expect(status(el, "b")).toBe("Expires in 5 days");
    expect(row(el, "b").dataset.status).toBe("expiring");
    expect(apiKeyStatus({ expiresAt: NOW + 3_600_000 }, NOW).status).toBe("expiring");
    expect(apiKeyStatus({ expiresAt: NOW + 20 * DAY }, NOW, 30)).toEqual({ status: "expiring", days: 20 });
    expect(apiKeyStatus({ expiresAt: NOW - 1 }, NOW).status).toBe("expired");
    expect(apiKeyStatus({ revokedAt: NOW - 1, expiresAt: NOW + DAY }, NOW).status).toBe("revoked");
  });

  test("revoked and expired keys fold away under Inactive keys", async () => {
    const el = await keys();
    const toggle = button(el, ".ui-akm__inactive-toggle");
    expect(text(toggle)).toBe("Inactive keys (2)");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    const list = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(list.hidden).toBe(true);
    toggle.click();
    await settle();
    expect(list.hidden).toBe(false);
    expect(status(el, "d")).toBe("Expired");
    expect(status(el, "e")).toBe("Revoked");
    expect(row(el, "d").querySelector(".ui-akm__revoke")).toBeNull();
  });

  test("Create key: a name is required; the form sends the name, permissions and expiry", async () => {
    const el = await keys();
    const made: ApiKeyCreate[] = [];
    el.addEventListener("tc-key-create", (e) => made.push((e as CustomEvent<ApiKeyCreate>).detail));
    button(el, ".ui-akm__create").click();
    await settle();
    const form = el.querySelector<HTMLFormElement>(".ui-akm__form")!;
    expect(button(el, ".ui-akm__create").getAttribute("aria-expanded")).toBe("true");
    const name = form.querySelector<HTMLInputElement>(".ui-akm__name-input")!;
    expect(document.activeElement).toBe(name);
    // 90 days is picked to start with
    const radios = [...form.querySelectorAll<HTMLInputElement>("input[type=radio]")];
    expect(radios.map((r) => r.checked)).toEqual([false, true, false, false]);
    button(form, ".ui-akm__submit").click();
    await settle();
    expect(made).toEqual([]);
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(text(document.getElementById(name.getAttribute("aria-describedby")!))).toBe("Give the key a name.");
    name.value = "  Nightly export ";
    name.dispatchEvent(new Event("input"));
    form.querySelectorAll<HTMLInputElement>("input[type=checkbox]")[1]!.click();
    radios[3]!.click();
    await settle();
    expect(name.getAttribute("aria-invalid")).toBe("false");
    button(form, ".ui-akm__submit").click();
    await settle();
    expect(made).toEqual([{ name: "Nightly export", scopes: ["cases:write"], expiresIn: null }]);
    expect(el.querySelector(".ui-akm__form")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(button(el, ".ui-akm__create"));
  });

  test("a prevented create keeps the form open; Escape and Cancel close it", async () => {
    const el = await keys();
    el.addEventListener("tc-key-create", (e) => e.preventDefault());
    button(el, ".ui-akm__create").click();
    await settle();
    const name = el.querySelector<HTMLInputElement>(".ui-akm__name-input")!;
    name.value = "Kept";
    name.dispatchEvent(new Event("input"));
    await settle();
    button(el, ".ui-akm__submit").click();
    await settle();
    expect(el.querySelector(".ui-akm__form")).not.toBeNull();
    el.querySelector(".ui-akm__form")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-akm__form")).toBeNull();
  });

  test("the new key's secret shows once, with Copy and Done", async () => {
    const el = await keys();
    el.revealed = { id: "a", secret: "tc_test_0123456789abcdef" };
    await settle();
    const panel = el.querySelector(".ui-akm__reveal")!;
    expect(text(panel.querySelector(".ui-akm__reveal-title"))).toBe("Your new key · Reporting export");
    expect(text(panel.querySelector(".ui-akm__secret"))).toBe("tc_test_0123456789abcdef");
    expect(text(panel.querySelector(".ui-akm__reveal-note"))).toMatch(/won't be able to see this key again/);
    const copies: string[] = [];
    el.addEventListener("tc-copy", (e) => {
      copies.push((e as CustomEvent<{ id: string }>).detail.id);
      e.preventDefault();
    });
    button(panel, ".ui-akm__copy").click();
    await settle();
    expect(copies).toEqual(["a"]);
    const kept = (e: Event) => e.preventDefault();
    el.addEventListener("tc-reveal-dismiss", kept);
    button(panel, ".ui-akm__done").click();
    await settle();
    expect(el.querySelector(".ui-akm__reveal")).not.toBeNull();
    el.removeEventListener("tc-reveal-dismiss", kept);
    const dismissed: string[] = [];
    el.addEventListener("tc-reveal-dismiss", (e) => dismissed.push((e as CustomEvent<{ id: string }>).detail.id));
    button(el, ".ui-akm__done").click();
    await settle();
    expect(dismissed).toEqual(["a"]);
    expect(el.revealed).toBeNull();
    expect(el.querySelector(".ui-akm__reveal")).toBeNull();
    expect(el.textContent).not.toContain("0123456789abcdef");
  });

  test("Revoke asks in place; Keep goes back; Revoke fires with the keys as they'd be", async () => {
    const el = await keys();
    button(row(el, "b"), ".ui-akm__revoke").click();
    await settle();
    const group = row(el, "b").querySelector(".ui-akm__confirm")!;
    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-label")).toBe("Revoke, Case intake bot");
    expect(text(group)).toContain("Apps using it stop working at once.");
    await expect.poll(() => document.activeElement).toBe(button(row(el, "b"), ".ui-akm__keep"));
    button(row(el, "b"), ".ui-akm__keep").click();
    await settle();
    await expect.poll(() => document.activeElement).toBe(button(row(el, "b"), ".ui-akm__revoke"));
    const revoked: ApiKeyRevoke[] = [];
    el.addEventListener("tc-key-revoke", (e) => revoked.push((e as CustomEvent<ApiKeyRevoke>).detail));
    button(row(el, "b"), ".ui-akm__revoke").click();
    await settle();
    button(row(el, "b"), ".ui-akm__confirm-revoke").click();
    await settle();
    expect(revoked[0]!.id).toBe("b");
    expect(revoked[0]!.keys.find((k) => k.id === "b")!.revokedAt).toBe(NOW);
    expect(el.keys.find((k) => k.id === "b")!.revokedAt).toBe(NOW);
    expect(text(button(el, ".ui-akm__inactive-toggle"))).toBe("Inactive keys (3)");
    expect(text(el.querySelector('[role="status"]'))).toBe("Revoked Case intake bot");
  });

  test("a prevented revoke keeps the key; read-only hides Create and Revoke; no keys says so", async () => {
    const el = await keys();
    el.addEventListener("tc-key-revoke", (e) => e.preventDefault());
    button(row(el, "a"), ".ui-akm__revoke").click();
    await settle();
    button(row(el, "a"), ".ui-akm__confirm-revoke").click();
    await settle();
    expect(el.keys).toBe(KEYS);
    expect(status(el, "a")).toBe("Active");
    const ro = await fixture<TcApiKeys>(html`<tc-api-keys read-only .keys=${KEYS} .now=${NOW}></tc-api-keys>`);
    expect(ro.querySelector(".ui-akm__create")).toBeNull();
    expect(ro.querySelector(".ui-akm__revoke")).toBeNull();
    expect(text(ro.querySelector(".ui-akm__count"))).toBe("3 active");
    const none = await fixture<TcApiKeys>(html`<tc-api-keys .now=${NOW}></tc-api-keys>`);
    expect(text(none.querySelector(".ui-akm__empty"))).toBe("No API keys yet. Create one to connect another app.");
  });

  test("renamed words show", async () => {
    const el = await fixture<TcApiKeys>(html`<tc-api-keys .keys=${KEYS} .now=${NOW} .labels=${{ create: "New key", active: "Live", expiresIn: "{n} days left" }}></tc-api-keys>`);
    expect(text(button(el, ".ui-akm__create"))).toBe("New key");
    expect(status(el, "a")).toBe("Live");
    expect(status(el, "b")).toBe("5 days left");
  });
});

describe("React", () => {
  test("uncontrolled keys change on revoke; controlled keys and revealed wait for the parent", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(ApiKeys, { defaultKeys: KEYS, now: NOW })));
    await settle();
    let el = host.querySelector<TcApiKeys>("tc-api-keys")!;
    await act(async () => button(row(el, "a"), ".ui-akm__revoke").click());
    await act(async () => button(row(el, "a"), ".ui-akm__confirm-revoke").click());
    await act(async () => root.render(React.createElement(ApiKeys, { defaultKeys: KEYS, now: NOW, title: "Keys" })));
    await settle();
    expect(el.keys.find((k) => k.id === "a")!.revokedAt).toBe(NOW);
    expect(text(el.querySelector(".tc-head__title"))).toBe("Keys");
    await act(async () => root.unmount());

    const root2 = createRoot(host);
    let changed: ApiKey[] | undefined;
    let dismissed: string | undefined;
    const node = (k: ApiKey[], revealed: { id: string; secret: string } | null) =>
      React.createElement(ApiKeys, { keys: k, now: NOW, revealed, onKeysChange: (next: ApiKey[]) => (changed = next), onRevealDismiss: (id: string) => (dismissed = id) });
    await act(async () => root2.render(node(KEYS, { id: "a", secret: "tc_test_feed" })));
    await settle();
    el = host.querySelector<TcApiKeys>("tc-api-keys")!;
    await act(async () => button(row(el, "a"), ".ui-akm__revoke").click());
    await act(async () => button(row(el, "a"), ".ui-akm__confirm-revoke").click());
    await settle();
    expect(changed!.find((k) => k.id === "a")!.revokedAt).toBe(NOW);
    expect(el.keys).toBe(KEYS);
    await act(async () => button(el, ".ui-akm__done").click());
    await settle();
    expect(dismissed).toBe("a");
    expect(el.querySelector(".ui-akm__reveal")).not.toBeNull();
    await act(async () => root2.render(node(changed!, null)));
    await settle();
    expect(el.querySelector(".ui-akm__reveal")).toBeNull();
    expect(row(el, "a")?.dataset.status ?? "revoked").toBe("revoked");
    await act(async () => root2.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}, with the secret, the form and inactive keys open`, async () => {
        const wrap = await fixture<HTMLElement>(
          html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}>
            <tc-api-keys look=${look} .keys=${KEYS} .scopes=${SCOPES} .now=${NOW} .revealed=${{ id: "a", secret: "tc_test_0123456789abcdef" }}></tc-api-keys>
          </div>`,
        );
        const el = wrap.querySelector<TcApiKeys>("tc-api-keys")!;
        button(el, ".ui-akm__create").click();
        button(el, ".ui-akm__inactive-toggle").click();
        await settle();
        button(el, ".ui-akm__submit").click();
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
