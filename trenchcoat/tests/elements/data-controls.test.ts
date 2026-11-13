/*
 * <tc-data-controls> in real browsers: the switches with what they mean and when they changed, the history note,
 * cancelable tc-value-change, Export my data and its status, Delete all chats behind a modal confirmation, Delete
 * account, renamed labels, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/data-controls";
import type { DataControlsDeleteChats, DataControlsValue, DataControlsValueChange, TcDataControls } from "../../src/elements/data-controls";
import { DataControls } from "../../src/elements/react/data-controls";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const VALUE: DataControlsValue = { training: false, history: true, memory: true };
const SEPT = new Date(2026, 8, 3).getTime();
const sw = (el: Element, field: string) => el.querySelector<HTMLButtonElement>(`[data-field="${field}"] .ui-dcl__switch`)!;
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcDataControls>(
    html`<tc-data-controls look=${look} heading="Your data" chat-count="342" memory-href="/settings/memory" .value=${VALUE} .changed=${{ training: SEPT }} locale="en-GB"></tc-data-controls>`,
  );

describe("tc-data-controls", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: three switches named by their setting, described by what they mean, with when they changed`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("dcl");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Your data");
      const switches = [...el.querySelectorAll<HTMLButtonElement>(".ui-dcl__switch")];
      expect(switches).toHaveLength(3);
      for (const s of switches) expect(s.getAttribute("role")).toBe("switch");
      const t = sw(el, "training");
      expect(t.getAttribute("aria-checked")).toBe("false");
      expect(document.getElementById(t.getAttribute("aria-labelledby")!)!.textContent).toBe("Improve the model with my chats");
      expect(document.getElementById(t.getAttribute("aria-describedby")!)!.textContent).toBe("Your chats aren't used to train models.");
      // ICU versions differ on "Sep" and "Sept"
      expect(el.querySelector('[data-field="training"] .ui-dcl__when')!.textContent).toMatch(/^Changed 3 Sept? 2026$/);
      expect(el.querySelector('[data-field="training"] time')!.getAttribute("datetime")).toBe(new Date(SEPT).toISOString());
      expect(el.querySelector('[data-field="history"] .ui-dcl__when')!.textContent).toBe("Never changed");
      expect(el.querySelector<HTMLAnchorElement>('[data-field="memory"] .ui-dcl__link')!.getAttribute("href")).toBe("/settings/memory");
      expect(el.querySelector(".ui-dcl__note")).toBeNull();
    });
  }

  test("flipping a switch fires a cancelable tc-value-change with the whole value and the field; history off says chats are deleted after 30 days", async () => {
    const el = await make();
    const seen: DataControlsValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<DataControlsValueChange>).detail));
    sw(el, "history").click();
    await settle();
    expect(seen.at(-1)).toEqual({ value: { training: false, history: false, memory: true }, field: "history" });
    expect(el.value.history).toBe(false);
    expect(sw(el, "history").getAttribute("aria-checked")).toBe("false");
    expect(el.querySelector(".ui-dcl__note")!.textContent).toContain("deleted after 30 days");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Save chat history off");
    el.addEventListener("tc-value-change", (e) => e.preventDefault(), { once: true });
    sw(el, "training").click();
    await settle();
    expect(el.value.training).toBe(false);
    expect(sw(el, "training").getAttribute("aria-checked")).toBe("false");
    expect(seen.at(-1)!.field).toBe("training");
  });

  test("Export my data: cancelable tc-export, then the requested status; ready shows a download link; failed says so", async () => {
    const el = await make();
    const exportBtn = el.querySelector<HTMLButtonElement>(".ui-dcl__export")!;
    el.addEventListener("tc-export", (e) => e.preventDefault(), { once: true });
    exportBtn.click();
    await settle();
    expect(el.exportStatus).toBe("idle");
    let fired = 0;
    el.addEventListener("tc-export", () => fired++);
    exportBtn.click();
    await settle();
    expect(el.exportStatus).toBe("requested");
    expect(el.querySelector(".ui-dcl__status")!.textContent).toContain("We'll email a link when it's ready.");
    expect(exportBtn.getAttribute("aria-disabled")).toBe("true");
    exportBtn.click();
    expect(fired).toBe(1);
    el.exportStatus = "ready";
    el.exportHref = "/exports/priya.zip";
    await settle();
    expect(el.querySelector<HTMLAnchorElement>(".ui-dcl__status a")!.getAttribute("href")).toBe("/exports/priya.zip");
    el.exportStatus = "failed";
    el.exportHref = "javascript:alert(1)";
    await settle();
    expect(el.querySelector(".ui-dcl__status")!.textContent).toContain("didn't work");
    el.exportStatus = "ready";
    await settle();
    expect(el.querySelector(".ui-dcl__status a")).toBeNull();
  });

  test("Delete all chats: a modal confirmation naming the count; Cancel and Escape keep the chats; a prevented delete stays open; confirm deletes", async () => {
    const el = await make();
    const deleteBtn = el.querySelector<HTMLButtonElement>(".ui-dcl__delete")!;
    deleteBtn.click();
    await settle();
    const dialog = () => el.querySelector<HTMLDialogElement>(".ui-dcl__dialog");
    await expect.poll(() => dialog()?.open).toBe(true);
    expect(dialog()!.querySelector(".ui-dcl__dialog-title")!.textContent).toBe("Delete all 342 chats?");
    expect(dialog()!.textContent).toContain("can't be undone");
    await expect.poll(() => document.activeElement?.classList.contains("ui-dcl__cancel")).toBe(true);
    dialog()!.querySelector<HTMLButtonElement>(".ui-dcl__cancel")!.click();
    await expect.poll(() => dialog()?.open ?? false).toBe(false);
    await expect.poll(() => document.activeElement).toBe(deleteBtn);
    // Escape cancels too
    deleteBtn.click();
    await expect.poll(() => dialog()?.open).toBe(true);
    dialog()!.dispatchEvent(new Event("cancel", { cancelable: true }));
    await expect.poll(() => dialog()?.open ?? false).toBe(false);
    expect(el.chatCount).toBe(342);
    // A prevented delete keeps the dialog open
    const counts: number[] = [];
    el.addEventListener("tc-delete-chats", (e) => counts.push((e as CustomEvent<DataControlsDeleteChats>).detail.count));
    el.addEventListener("tc-delete-chats", (e) => e.preventDefault(), { once: true });
    deleteBtn.click();
    await expect.poll(() => dialog()?.open).toBe(true);
    dialog()!.querySelector<HTMLButtonElement>(".ui-dcl__confirm")!.click();
    await settle();
    expect(dialog()?.open).toBe(true);
    dialog()!.querySelector<HTMLButtonElement>(".ui-dcl__confirm")!.click();
    await expect.poll(() => dialog()?.open ?? false).toBe(false);
    expect(counts).toEqual([342, 342]);
    expect(el.chatCount).toBe(0);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("All chats deleted.");
    expect(deleteBtn.disabled).toBe(true);
  });

  test("Delete account: a link with a safe href, else a button firing tc-delete-account; renamed labels; hide-delete-account", async () => {
    const el = await make();
    let asked = 0;
    el.addEventListener("tc-delete-account", () => asked++);
    el.querySelector<HTMLButtonElement>("button.ui-dcl__danger-link")!.click();
    expect(asked).toBe(1);
    el.deleteAccountHref = "/account/delete";
    el.labels = { deleteAccount: "Close my account", training: "Help train models" };
    await settle();
    expect(el.querySelector<HTMLAnchorElement>("a.ui-dcl__danger-link")!.textContent).toBe("Close my account");
    expect(el.querySelector('[data-field="training"] .ui-dcl__label')!.textContent).toBe("Help train models");
    el.hideDeleteAccount = true;
    await settle();
    expect(el.querySelector(".ui-dcl__danger-link")).toBeNull();
  });

  test("React wrapper: uncontrolled value survives re-renders; controlled stays until the parent changes it; return false keeps the export idle", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(DataControls, {
        title: "Mine",
        onValueChange: (v, field) => void seen.push(`${field} ${v[field]}`),
        onExport: () => false,
        "data-n": n,
      } as React.ComponentProps<typeof DataControls>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-data-controls")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Mine");
    sw(el, "training").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.value.training).toBe(true);
    el.querySelector<HTMLButtonElement>(".ui-dcl__export")!.click();
    await settle();
    expect(el.exportStatus).toBe("idle");
    expect(seen).toEqual(["training true"]);
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(DataControls, { value: VALUE, onValueChange: (v) => void seen.push(v.memory) })));
    await settle();
    const el2 = host2.querySelector("tc-data-controls")!;
    sw(el2, "memory").click();
    await settle();
    expect(el2.value.memory).toBe(true);
    expect(seen.at(-1)).toBe(false);
    await act(async () => root2.unmount());
  });

  test("narrow: the card stays inside its width", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 300px"><tc-data-controls chat-count="3" .value=${VALUE}></tc-data-controls></div>`);
    const el = wrap.querySelector("tc-data-controls")!;
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the confirmation open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-data-controls heading="Your data" chat-count="342" memory-href="/m" export-status="requested" .value=${{ ...VALUE, history: false }} .changed=${{ training: SEPT }}></tc-data-controls>
        <tc-data-controls look="clean" heading="Your data" chat-count="12" export-status="ready" export-href="/x.zip" .value=${VALUE}></tc-data-controls>
      </div>`);
      await finish(wrap);
      let result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      const el = wrap.querySelector("tc-data-controls")!;
      el.querySelector<HTMLButtonElement>(".ui-dcl__delete")!.click();
      await expect.poll(() => el.querySelector<HTMLDialogElement>(".ui-dcl__dialog")?.open).toBe(true);
      await finish(wrap);
      result = await axe.run(el.querySelector(".ui-dcl__dialog")!, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
