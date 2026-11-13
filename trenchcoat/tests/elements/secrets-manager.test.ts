/*
 * <tc-secrets-manager> in real browsers: missing first, status in words, write-only values that are forgotten, delete
 * with its question, new names, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/secrets-manager";
import { isSecretName, type Secret, type SecretSet, type SecretsChange, type TcSecretsManager } from "../../src/elements/secrets-manager";
import { SecretsManager } from "../../src/elements/react/secrets-manager";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 12, 10);
const DAY = 86_400_000;
const SECRETS: Secret[] = [
  { name: "MODEL_API_KEY", scope: "Workspace", status: "set", updatedAt: NOW - 3 * DAY, updatedBy: "Noor", usedBy: ["Invoice matcher", "Vendor risk"] },
  { name: "LEDGER_API_TOKEN", scope: "Invoice matcher", status: "missing", usedBy: ["Invoice matcher"] },
  { name: "AP_MAILBOX_PASSWORD", scope: "Invoice matcher", status: "expired", expiresAt: NOW - DAY, usedBy: [] },
  { name: "VENDOR_REGISTRY_TOKEN", scope: "Vendor risk", status: "expiring", expiresAt: NOW + 5 * DAY, usedBy: ["Vendor risk"] },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<any>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (secrets = SECRETS, extra = "") =>
  fixture<TcSecretsManager>(html`<tc-secrets-manager .secrets=${secrets} .now=${NOW} locale="en-GB" current-user="You" ?creatable=${extra === "creatable"}></tc-secrets-manager>`);
const row = (el: Element, name: string) => el.querySelector<HTMLElement>(`[data-secret="${name}"]`)!;
const names = (el: Element, group: string) => [...el.querySelectorAll(`[data-group="${group}"] .ui-sec__name`)].map((n) => n.textContent);
const typeValue = async (field: Element, value: string) => {
  const input = field.querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};

describe("tc-secrets-manager", () => {
  test("missing first with who needs them; saved ones expired, expiring, then set", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("sec");
    expect(names(el, "missing")).toEqual(["LEDGER_API_TOKEN"]);
    expect(names(el, "saved")).toEqual(["AP_MAILBOX_PASSWORD", "VENDOR_REGISTRY_TOKEN", "MODEL_API_KEY"]);
    expect(text(el.querySelector('[data-group="missing"] .ui-sec__group-title'))).toBe("Missing 1");
    expect(text(row(el, "LEDGER_API_TOKEN").querySelector(".ui-sec__status"))).toBe("Missing");
    expect(text(row(el, "LEDGER_API_TOKEN").querySelector(".ui-sec__needed"))).toBe("Needed by Invoice matcher");
    expect(text(row(el, "MODEL_API_KEY").querySelector(".ui-sec__facts"))).toBe("Updated 9 Nov 2026 by Noor Used by Invoice matcher and Vendor risk");
    expect(text(row(el, "AP_MAILBOX_PASSWORD").querySelector(".ui-sec__facts"))).toBe("Expired 11 Nov 2026 Not used by any agent");
    expect(text(row(el, "VENDOR_REGISTRY_TOKEN").querySelector(".ui-sec__status"))).toBe("Expiring soon");
    // A missing secret can be set but not deleted
    expect(text(row(el, "LEDGER_API_TOKEN").querySelector(".ui-sec__edit"))).toBe("Set value, LEDGER_API_TOKEN");
    expect(row(el, "LEDGER_API_TOKEN").querySelector(".ui-sec__delete")).toBeNull();
    expect(text(row(el, "MODEL_API_KEY").querySelector(".ui-sec__edit"))).toBe("Replace, MODEL_API_KEY");
    expect(isSecretName("VENDOR_API_KEY")).toBe(true);
    expect(isSecretName("vendor_key")).toBe(false);
    expect(isSecretName("2FA_KEY")).toBe(false);
  });

  test("Set value: the value goes out in tc-secret-set, then the element forgets it", async () => {
    const el = await mount();
    const sets: SecretSet[] = [];
    const changes: SecretsChange[] = [];
    on(el, "tc-secret-set", (e) => sets.push(e.detail));
    on(el, "tc-secrets-change", (e) => changes.push(e.detail));
    row(el, "LEDGER_API_TOKEN").querySelector<HTMLButtonElement>(".ui-sec__edit")!.click();
    await settle();
    const field = row(el, "LEDGER_API_TOKEN").querySelector("tc-secret-field")!;
    await expect.poll(() => document.activeElement === field.querySelector("input")).toBe(true);
    expect(field.querySelector("input")!.type).toBe("password");
    expect(row(el, "LEDGER_API_TOKEN").querySelector<HTMLButtonElement>(".ui-sec__save")!.disabled).toBe(true);
    await typeValue(field, "s3cr3t-value");
    row(el, "LEDGER_API_TOKEN").querySelector<HTMLButtonElement>(".ui-sec__save")!.click();
    await settle();
    expect(sets).toEqual([{ name: "LEDGER_API_TOKEN", scope: "Invoice matcher", value: "s3cr3t-value", isNew: false }]);
    expect(changes[0]!.change).toBe("set");
    const saved = el.secrets.find((s) => s.name === "LEDGER_API_TOKEN")!;
    expect(saved).toMatchObject({ status: "set", updatedAt: NOW, updatedBy: "You" });
    expect(JSON.stringify(el.secrets)).not.toContain("s3cr3t");
    expect(el.innerHTML).not.toContain("s3cr3t");
    expect(row(el, "LEDGER_API_TOKEN").querySelector("tc-secret-field")).toBeNull();
    expect(names(el, "missing")).toEqual([]);
    expect(text(el.querySelector('[role="status"]'))).toBe("Saved LEDGER_API_TOKEN");
    // Opening it again starts empty
    row(el, "LEDGER_API_TOKEN").querySelector<HTMLButtonElement>(".ui-sec__edit")!.click();
    await settle();
    expect(row(el, "LEDGER_API_TOKEN").querySelector("tc-secret-field input")!.getAttribute("value") ?? "").toBe("");
    expect((row(el, "LEDGER_API_TOKEN").querySelector("tc-secret-field input") as HTMLInputElement).value).toBe("");
  });

  test("prevented, the secret stays as it was; Escape closes the field without keeping the value", async () => {
    const el = await mount();
    on(el, "tc-secret-set", (e) => e.preventDefault());
    const r = () => row(el, "MODEL_API_KEY");
    r().querySelector<HTMLButtonElement>(".ui-sec__edit")!.click();
    await settle();
    await typeValue(r().querySelector("tc-secret-field")!, "new-one");
    r().querySelector<HTMLButtonElement>(".ui-sec__save")!.click();
    await settle();
    expect(el.secrets).toBe(SECRETS);
    r().querySelector<HTMLButtonElement>(".ui-sec__edit")!.click();
    await settle();
    const input = r().querySelector<HTMLInputElement>("tc-secret-field input")!;
    expect(input.value).toBe("");
    await typeValue(r().querySelector("tc-secret-field")!, "abc");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(r().querySelector("tc-secret-field")).toBeNull();
    await expect.poll(() => document.activeElement === r().querySelector(".ui-sec__edit")).toBe(true);
  });

  test("Delete asks first, naming the agents that will stop; Keep returns focus; confirm removes it", async () => {
    const el = await mount();
    const deleted: string[] = [];
    on(el, "tc-secret-delete", (e) => deleted.push(e.detail.name));
    row(el, "MODEL_API_KEY").querySelector<HTMLButtonElement>(".ui-sec__delete")!.click();
    await settle();
    expect(text(row(el, "MODEL_API_KEY").querySelector(".ui-sec__confirm span"))).toBe("Delete MODEL_API_KEY? Invoice matcher and Vendor risk will stop working until it's set again.");
    await expect.poll(() => document.activeElement === row(el, "MODEL_API_KEY").querySelector(".ui-sec__keep")).toBe(true);
    row(el, "MODEL_API_KEY").querySelector<HTMLButtonElement>(".ui-sec__keep")!.click();
    await settle();
    expect(row(el, "MODEL_API_KEY").querySelector(".ui-sec__confirm")).toBeNull();
    await expect.poll(() => document.activeElement === row(el, "MODEL_API_KEY").querySelector(".ui-sec__delete")).toBe(true);
    row(el, "AP_MAILBOX_PASSWORD").querySelector<HTMLButtonElement>(".ui-sec__delete")!.click();
    await settle();
    expect(text(row(el, "AP_MAILBOX_PASSWORD").querySelector(".ui-sec__confirm span"))).toBe("Delete AP_MAILBOX_PASSWORD? No agent uses it.");
    row(el, "AP_MAILBOX_PASSWORD").querySelector<HTMLButtonElement>(".ui-sec__confirm-delete")!.click();
    await settle();
    expect(deleted).toEqual(["AP_MAILBOX_PASSWORD"]);
    expect(el.secrets.map((s) => s.name)).not.toContain("AP_MAILBOX_PASSWORD");
    expect(text(el.querySelector('[role="status"]'))).toBe("Deleted AP_MAILBOX_PASSWORD");
    await expect.poll(() => document.activeElement === row(el, "VENDOR_REGISTRY_TOKEN").querySelector(".ui-sec__name")).toBe(true);
  });

  test("Add secret: UPPER_SNAKE names, no duplicates, a scope and a value", async () => {
    const el = await fixture<TcSecretsManager>(html`<tc-secrets-manager creatable .secrets=${SECRETS} .scopes=${["Workspace", "Vendor risk"]}></tc-secrets-manager>`);
    const sets: SecretSet[] = [];
    on(el, "tc-secret-set", (e) => sets.push(e.detail));
    const add = el.querySelector<HTMLButtonElement>(".ui-sec__add")!;
    add.click();
    await settle();
    expect(add.getAttribute("aria-expanded")).toBe("true");
    const name = el.querySelector<HTMLInputElement>(".ui-sec__new-name")!;
    await expect.poll(() => document.activeElement === name).toBe(true);
    const typeName = async (v: string) => {
      name.value = v;
      name.dispatchEvent(new Event("input", { bubbles: true }));
      await settle();
    };
    await typeName("vendor key");
    el.querySelector<HTMLButtonElement>(".ui-sec__new-save")!.click();
    await settle();
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(text(el.querySelector(".ui-sec__error"))).toBe("Use capital letters, digits and underscores, starting with a letter.");
    expect(name.getAttribute("aria-describedby")).toContain("error");
    await typeName("MODEL_API_KEY");
    expect(text(el.querySelector(".ui-sec__error"))).toBe("There's already a secret with this name.");
    await typeName("SANCTIONS_LIST_KEY");
    expect(el.querySelector(".ui-sec__error")).toBeNull();
    const scope = el.querySelector<HTMLSelectElement>(".ui-sec__new-scope")!;
    scope.value = "Vendor risk";
    scope.dispatchEvent(new Event("change", { bubbles: true }));
    // No value yet: nothing happens
    el.querySelector<HTMLButtonElement>(".ui-sec__new-save")!.click();
    await settle();
    expect(sets).toEqual([]);
    await typeValue(el.querySelector(".ui-sec__new-value")!, "k-123");
    el.querySelector<HTMLButtonElement>(".ui-sec__new-save")!.click();
    await settle();
    expect(sets).toEqual([{ name: "SANCTIONS_LIST_KEY", scope: "Vendor risk", value: "k-123", isNew: true }]);
    expect(el.querySelector(".ui-sec__new")).toBeNull();
    expect(text(row(el, "SANCTIONS_LIST_KEY").querySelector(".ui-sec__scope"))).toBe("Vendor risk");
    expect(text(row(el, "SANCTIONS_LIST_KEY").querySelector(".ui-sec__facts"))).toBe("Updated just now Not used by any agent");
    expect(JSON.stringify(el.secrets)).not.toContain("k-123");
    // Adding a name that's missing fills it in
    add.click();
    await settle();
    await typeName("LEDGER_API_TOKEN");
    await typeValue(el.querySelector(".ui-sec__new-value")!, "v");
    el.querySelector<HTMLButtonElement>(".ui-sec__new-save")!.click();
    await settle();
    expect(el.secrets.filter((s) => s.name === "LEDGER_API_TOKEN")).toHaveLength(1);
    expect(el.secrets.find((s) => s.name === "LEDGER_API_TOKEN")!.status).toBe("set");
  });

  test("Escape closes the new-secret form; empty and renamed words", async () => {
    const el = await fixture<TcSecretsManager>(html`<tc-secrets-manager creatable .labels=${{ add: "New key", empty: "Nothing stored." }}></tc-secrets-manager>`);
    expect(text(el.querySelector(".ui-sec__empty"))).toBe("Nothing stored.");
    const add = el.querySelector<HTMLButtonElement>(".ui-sec__add")!;
    expect(text(add)).toBe("New key");
    add.click();
    await settle();
    el.querySelector(".ui-sec__new-name")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-sec__new")).toBeNull();
    await expect.poll(() => document.activeElement === add).toBe(true);
  });
});

describe("React", () => {
  const mountReact = async (node: React.ReactElement) => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    await act(async () => root.render(node));
    await settle();
    return { host, root };
  };

  test("uncontrolled survives a parent re-render; controlled stays until the parent changes it; onSecretSet false refuses", async () => {
    let rerender = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(SecretsManager, { title: "Agent secrets", defaultSecrets: SECRETS, now: NOW });
    }
    const a = await mountReact(React.createElement(App));
    const el = a.host.querySelector<TcSecretsManager>("tc-secrets-manager")!;
    expect(el.heading).toBe("Agent secrets");
    await act(async () => row(el, "AP_MAILBOX_PASSWORD").querySelector<HTMLButtonElement>(".ui-sec__delete")!.click());
    await settle();
    await act(async () => row(el, "AP_MAILBOX_PASSWORD").querySelector<HTMLButtonElement>(".ui-sec__confirm-delete")!.click());
    await settle();
    await act(async () => rerender());
    await settle();
    expect(el.secrets.map((s) => s.name)).not.toContain("AP_MAILBOX_PASSWORD");
    await act(async () => a.root.unmount());

    const seen: Secret[][] = [];
    const b = await mountReact(React.createElement(SecretsManager, { secrets: SECRETS, onSecretsChange: (s: Secret[]) => seen.push(s), onSecretDelete: () => undefined }));
    const ctl = b.host.querySelector<TcSecretsManager>("tc-secrets-manager")!;
    await act(async () => row(ctl, "MODEL_API_KEY").querySelector<HTMLButtonElement>(".ui-sec__delete")!.click());
    await settle();
    await act(async () => row(ctl, "MODEL_API_KEY").querySelector<HTMLButtonElement>(".ui-sec__confirm-delete")!.click());
    await settle();
    expect(seen).toHaveLength(1);
    expect(ctl.secrets).toBe(SECRETS);
    await act(async () => b.root.unmount());

    const c = await mountReact(React.createElement(SecretsManager, { defaultSecrets: SECRETS, onSecretSet: () => false }));
    const ref = c.host.querySelector<TcSecretsManager>("tc-secrets-manager")!;
    await act(async () => row(ref, "LEDGER_API_TOKEN").querySelector<HTMLButtonElement>(".ui-sec__edit")!.click());
    await settle();
    await typeValue(row(ref, "LEDGER_API_TOKEN").querySelector("tc-secret-field")!, "x");
    await act(async () => row(ref, "LEDGER_API_TOKEN").querySelector<HTMLButtonElement>(".ui-sec__save")!.click());
    await settle();
    expect(ref.secrets.find((s) => s.name === "LEDGER_API_TOKEN")!.status).toBe("missing");
    await act(async () => c.root.unmount());
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`no axe violations, ${look} ${theme} – a value field and a question open`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} data-tc-theme=${theme}>
          <tc-secrets-manager creatable .secrets=${SECRETS} .now=${NOW}></tc-secrets-manager>
          <tc-secrets-manager heading="Second" .secrets=${SECRETS} .now=${NOW}></tc-secrets-manager>
          <tc-secrets-manager heading="Third" creatable .secrets=${SECRETS} .now=${NOW}></tc-secrets-manager>
        </div>`);
        const [a, b, c] = wrap.querySelectorAll<TcSecretsManager>("tc-secrets-manager");
        row(a!, "LEDGER_API_TOKEN").querySelector<HTMLButtonElement>(".ui-sec__edit")!.click();
        row(b!, "MODEL_API_KEY").querySelector<HTMLButtonElement>(".ui-sec__delete")!.click();
        c!.querySelector<HTMLButtonElement>(".ui-sec__add")!.click();
        await settle();
        const name = c!.querySelector<HTMLInputElement>(".ui-sec__new-name")!;
        name.value = "bad name";
        name.dispatchEvent(new Event("input", { bubbles: true }));
        c!.querySelector<HTMLButtonElement>(".ui-sec__new-save")!.click();
        await settle();
        await finish(wrap);
        const { violations } = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
});
