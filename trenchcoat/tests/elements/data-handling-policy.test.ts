/*
 * <tc-data-handling-policy> in real browsers: the rows and both looks, the effective policy beside each choice, locks,
 * every control and its keyboard, controlled use, the form, the deletion dialog (focus in, trapped, restored) and its
 * pending request, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/data-handling-policy";
import {
  DATA_POLICY_RETENTION,
  type DataHandlingPolicyValue,
  type DataPolicyChange,
  type DataPolicyDeletion,
  type DataPolicyDeletionEvent,
  type DataPolicyLock,
  type TcDataHandlingPolicy,
} from "../../src/elements/data-handling-policy";
import { DataHandlingPolicy } from "../../src/elements/react/data-handling-policy";
import { cleanup, fixture, settle } from "./helpers";
import { expectReactFormReset } from "./form-reset";

afterEach(cleanup);

const VALUE: DataHandlingPolicyValue = { retention: "30d", memory: "persistent", logging: "content", redact: ["personal", "credentials"], training: false };
const LOCKS: DataPolicyLock[] = [{ field: "training", by: "Northwind IT", note: "Off under the data agreement." }, { field: "redact", category: "health" }];
const DELETIONS: DataPolicyDeletion[] = [
  { id: "d1", label: "Logs", state: "completed", detail: "Finished 13 Oct" },
  { id: "d2", label: "Memory", state: "in-progress" },
];

const make = (look: "standard" | "clean" = "standard", extra: Partial<TcDataHandlingPolicy> = {}) =>
  fixture<TcDataHandlingPolicy>(html`<tc-data-handling-policy
    look=${look}
    .value=${VALUE}
    .effective=${extra.effective ?? { ...VALUE, retention: "90d" }}
    .locks=${extra.locks ?? LOCKS}
    .deletions=${extra.deletions ?? DELETIONS}
  ></tc-data-handling-policy>`);
const STAGE_OF: Record<string, string> = { retention: "retention", memory: "memory", logging: "logging", redact: "logging", training: "training" };
const tile = (el: Element, stage: string) => el.querySelector<HTMLElement>(`.ui-dhp__stage[data-stage="${stage}"]`)!;
const stageBtn = (el: Element, stage: string) => el.querySelector<HTMLButtonElement>(`button.ui-dhp__stage-btn[data-stage="${stage}"]`)!;
/** The field's controls, opening its stage first (synchronous: the panel renders on the next update) */
const row = (el: Element, field: string) => el.querySelector<HTMLElement>(`.ui-dhp__field[data-field="${field}"]`)!;
const openStage = async (el: Element, field: string) => {
  const stage = STAGE_OF[field];
  if (el.querySelector<HTMLElement>(".ui-dhp__panel")?.dataset.stage !== stage) {
    stageBtn(el, stage).click();
    await settle();
  }
  return row(el, field);
};
const seg = (el: Element, field: string) => row(el, field).querySelector<HTMLElement & { disabled: boolean }>("tc-segmented-control")!;
const segOpt = (scope: Element, label: string) =>
  [...scope.querySelectorAll<HTMLButtonElement>(".ui-seg__opt")].find((b) => {
    const t = b.querySelector(".ui-seg__label")!.textContent!.trim();
    return t === label || t === label + label;
  })!;
const box = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-dhp__check[data-id="${id}"]`)!;
const sw = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-dhp__switch")!;
const effect = (el: Element, field: string) => row(el, field).querySelector<HTMLElement>(".ui-dhp__effect")!;
const dialog = (el: Element) => el.querySelector<HTMLDialogElement>(".ui-dhp__dialog")!;
const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, " ").trim();
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const finish = async (root: Element) => {
  // Finishing can re-render, and a re-render can start new transitions: repeat until nothing is running
  for (let i = 0; i < 5; i++) {
    const running = root.getAnimations?.({ subtree: true }) ?? [];
    if (!running.length) break;
    for (const a of running) a.finish();
    await settle();
  }
};

describe("tc-data-handling-policy", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, a group named by the heading, and the lifecycle led by what's in effect`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("dhp");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("group");
      expect(el.getAttribute("aria-label")).toBe("Data handling");
      expect(el.querySelector(".ui-dhp__flow")!.getAttribute("aria-label")).toBe("Data lifecycle");
      expect([...el.querySelectorAll(".ui-dhp__stage-name")].map((l) => l.textContent)).toEqual(["Conversations", "Logs", "Memory", "Training", "Deleted"]);
      expect([...el.querySelectorAll(".ui-dhp__stage-what")].map((l) => l.textContent)).toEqual(["Kept 90 days", "Full content", "Across conversations", "Not used for training", "After 90 days"]);
      expect(text(tile(el, "retention").querySelector(".ui-dhp__stage-state"))).toBe("Changing to 30 days");
      expect(text(tile(el, "logging").querySelector(".ui-dhp__stage-line"))).toBe("2 kinds redacted");
      expect(text(tile(el, "deleted").querySelector(".ui-dhp__stage-line"))).toBe("1 request open");
      // The last stage isn't a control
      expect(el.querySelector('button.ui-dhp__stage-btn[data-stage="deleted"]')).toBeNull();
      expect(el.querySelector(".ui-dhp__panel")).toBeNull();
      await openStage(el, "memory");
      expect(seg(el, "memory").dataset.look).toBe(look);
      // Each segmented control is named by its row's label
      expect(document.getElementById(seg(el, "memory").querySelector('[role="radiogroup"]')!.getAttribute("aria-labelledby")!)!.textContent).toBe("Remember facts");
      expect(text(row(el, "memory").querySelector(".ui-dhp__hint"))).toBe("Remembered facts are kept until someone deletes them.");
    });
  }

  test("a stage opens its controls in place: aria-expanded, focus moves in; Done and Escape close and restore focus", async () => {
    const el = await make();
    const btn = stageBtn(el, "logging");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    btn.focus();
    btn.click();
    await settle();
    await settle();
    const panel = el.querySelector<HTMLElement>(".ui-dhp__panel")!;
    expect(btn.getAttribute("aria-controls")).toBe(panel.id);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(tile(el, "logging").hasAttribute("data-open")).toBe(true);
    expect(document.getElementById(panel.getAttribute("aria-labelledby")!)!.textContent).toBe("Logs");
    expect(document.activeElement).toBe(panel.querySelector(".ui-dhp__panel-title"));
    expect([...panel.querySelectorAll(".ui-dhp__field")].map((f) => (f as HTMLElement).dataset.field)).toEqual(["logging", "redact"]);
    key(panel.querySelector(".ui-dhp__check")!, "Escape");
    await settle();
    await settle();
    expect(el.querySelector(".ui-dhp__panel")).toBeNull();
    expect(document.activeElement).toBe(btn);
    // Another stage replaces it; pressing the open one closes it; Done closes too
    stageBtn(el, "memory").click();
    await settle();
    stageBtn(el, "training").click();
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-dhp__panel")!.dataset.stage).toBe("training");
    expect(stageBtn(el, "memory").getAttribute("aria-expanded")).toBe("false");
    stageBtn(el, "training").click();
    await settle();
    expect(el.querySelector(".ui-dhp__panel")).toBeNull();
    stageBtn(el, "retention").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-dhp__done")!.click();
    await settle();
    await settle();
    expect(el.querySelector(".ui-dhp__panel")).toBeNull();
    expect(document.activeElement).toBe(stageBtn(el, "retention"));
  });

  test("the effective policy beside each choice: matching, behind, not reported; the pill counts what's pending", async () => {
    const el = await make();
    await openStage(el, "retention");
    expect(text(effect(el, "retention"))).toBe("In effect: 90 days – not yet your choice");
    expect(effect(el, "retention").dataset.state).toBe("behind");
    await openStage(el, "memory");
    expect(text(effect(el, "memory"))).toBe("In effect: Across conversations");
    expect(effect(el, "memory").dataset.state).toBe("match");
    await openStage(el, "redact");
    expect(text(effect(el, "redact"))).toBe("In effect: Personal details, Credentials");
    await openStage(el, "training");
    expect(text(effect(el, "training"))).toBe("In effect: Not allowed");
    expect(el.querySelector(".ui-dhp__pill")!.textContent).toBe("1 change pending");
    el.effective = { ...VALUE, redact: ["credentials", "personal"] };
    await settle();
    expect(el.querySelector(".ui-dhp__pill")!.textContent).toBe("In effect");
    el.effective = { retention: "30d" };
    await settle();
    expect(el.querySelector(".ui-dhp__pill")!.textContent).toBe("Partly reported");
    expect(text(tile(el, "memory").querySelector(".ui-dhp__stage-state"))).toBe("Not reported");
    await openStage(el, "memory");
    expect(text(effect(el, "memory"))).toBe("Not reported");
    el.effective = undefined;
    await settle();
    expect(el.querySelector(".ui-dhp__pill")!.textContent).toBe("Not reported");
  });

  test("locks: the setting can't change and says who set it", async () => {
    const el = await make();
    expect(text(tile(el, "training").querySelector(".ui-dhp__stage-lock"))).toBe(", Set by Northwind IT");
    expect(tile(el, "retention").querySelector(".ui-dhp__stage-lock")).toBeNull();
    await openStage(el, "training");
    expect(sw(el).disabled).toBe(true);
    expect(text(row(el, "training").querySelector(".ui-dhp__lock"))).toBe("Set by Northwind IT");
    expect(sw(el).getAttribute("aria-describedby")).toBe(row(el, "training").querySelector(".ui-dhp__lock")!.id);
    expect(text(row(el, "training").querySelector(":scope > .ui-dhp__hint"))).toBe("Off under the data agreement.");
    // A single redaction category, set by "your organization"
    await openStage(el, "redact");
    expect(box(el, "health").disabled).toBe(true);
    expect(text(box(el, "health").querySelector(".ui-dhp__lock"))).toBe("Set by your organization");
    expect(box(el, "personal").disabled).toBe(false);
    // A whole-field lock disables its segmented control
    el.locks = [...LOCKS, { field: "retention" }];
    el.organization = "Acme";
    await settle();
    await openStage(el, "retention");
    expect(seg(el, "retention").disabled).toBe(true);
    expect(text(row(el, "retention").querySelector(".ui-dhp__lock"))).toBe("Set by Acme");
    expect(row(el, "retention").hasAttribute("data-locked")).toBe(true);
    const seen: unknown[] = [];
    el.addEventListener("tc-value-change", () => seen.push(1));
    segOpt(row(el, "retention"), "7 days").click();
    await openStage(el, "training");
    sw(el).click();
    await settle();
    expect(seen).toEqual([]);
    expect(el.value).toEqual(VALUE);
  });

  test("every control fires tc-value-change with the field; arrows move a segmented choice", async () => {
    const el = await make("standard", { locks: [] });
    const seen: [string | null, DataHandlingPolicyValue][] = [];
    el.addEventListener("tc-value-change", (e) => {
      const d = (e as CustomEvent<DataPolicyChange>).detail;
      seen.push([d.field, d.value]);
    });
    segOpt(await openStage(el, "retention"), "90 days").click();
    await settle();
    expect(el.value.retention).toBe("90d");
    const memory = segOpt(await openStage(el, "memory"), "Across conversations");
    memory.focus();
    key(memory, "ArrowLeft");
    await settle();
    expect(el.value.memory).toBe("conversation");
    segOpt(await openStage(el, "logging"), "Off").click();
    await settle();
    expect(text(row(el, "redact").querySelector(":scope > .ui-dhp__hint"))).toBe("Applies when logging is on.");
    box(el, "health").click();
    await settle();
    expect(box(el, "health").getAttribute("aria-checked")).toBe("true");
    expect(el.value.redact).toEqual(["personal", "credentials", "health"]);
    box(el, "personal").click();
    await openStage(el, "training");
    sw(el).click();
    await settle();
    expect(sw(el).getAttribute("aria-checked")).toBe("true");
    expect(seen.map(([f]) => f)).toEqual(["retention", "memory", "logging", "redact", "redact", "training"]);
    expect(seen.at(-1)![1]).toEqual({ retention: "90d", memory: "conversation", logging: "off", redact: ["credentials", "health"], training: true });
    // The inner segmented control's own event doesn't reach the page
    const outer: Event[] = [];
    document.body.addEventListener("tc-value-change", (e) => outer.push(e));
    segOpt(await openStage(el, "retention"), "7 days").click();
    await settle();
    expect(outer).toHaveLength(1);
    expect(outer[0].target).toBe(el);
  });

  test("controlled: preventDefault() keeps the value", async () => {
    const el = await make("clean", { locks: [] });
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    segOpt(await openStage(el, "retention"), "7 days").click();
    await openStage(el, "redact");
    box(el, "financial").click();
    await settle();
    expect(box(el, "financial").getAttribute("aria-checked")).toBe("false");
    await openStage(el, "training");
    sw(el).click();
    await settle();
    expect(el.value).toEqual(VALUE);
    expect(sw(el).getAttribute("aria-checked")).toBe("false");
  });

  test("unavailable options are disabled with the reason; picking one makes the form invalid", async () => {
    const el = await make();
    el.retentionOptions = DATA_POLICY_RETENTION.map((o) => (o.id === "forever" ? { ...o, unavailable: "Your organization allows 90 days at most." } : o));
    await settle();
    expect(segOpt(await openStage(el, "retention"), "Until deleted").disabled).toBe(true);
    expect(text(row(el, "retention").querySelector(".ui-dhp__hint"))).toBe("Your organization allows 90 days at most.");
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-data-handling-policy name="policy" .value=${{ ...VALUE, retention: "forever" }} .retentionOptions=${el.retentionOptions}></tc-data-handling-policy></fieldset></form>`);
    const inForm = form.querySelector<TcDataHandlingPolicy>("tc-data-handling-policy")!;
    expect(form.checkValidity()).toBe(false);
    expect(text((await openStage(inForm, "retention")).querySelector(".ui-dhp__hint"))).toBe("Until deleted isn't allowed: Your organization allows 90 days at most.");
    inForm.value = VALUE;
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  test("form: JSON value, reset, disabled fieldset", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-data-handling-policy name="policy" .value=${VALUE}></tc-data-handling-policy></fieldset></form>`);
    const el = form.querySelector<TcDataHandlingPolicy>("tc-data-handling-policy")!;
    expect(JSON.parse(new FormData(form).get("policy") as string)).toEqual(VALUE);
    await openStage(el, "training");
    sw(el).click();
    await settle();
    expect(JSON.parse(new FormData(form).get("policy") as string).training).toBe(true);
    form.reset();
    await settle();
    expect(el.value).toEqual(VALUE);
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    await settle();
    expect(new FormData(form).get("policy")).toBeNull();
    await openStage(el, "training");
    expect(sw(el).disabled).toBe(true);
    expect(el.querySelector<HTMLButtonElement>(".ui-dhp__request")!.disabled).toBe(true);
  });

  test("deletion requests: listed with status; Request deletion asks first, traps focus, Escape restores focus", async () => {
    const el = await make();
    expect([...el.querySelectorAll(".ui-dhp__del")].map((d) => [...d.children].map((c) => c.textContent).join("|"))).toEqual(["Logs|Finished 13 Oct|Completed", "Memory||In progress"]);
    expect(text(el.querySelector(".ui-dhp__section"))).toBe("Deletion requests2");
    const request = el.querySelector<HTMLButtonElement>(".ui-dhp__request")!;
    expect(request.getAttribute("aria-haspopup")).toBe("dialog");
    request.focus();
    request.click();
    await settle();
    const d = dialog(el);
    expect(d.open).toBe(true);
    expect(d.getAttribute("role")).toBe("alertdialog");
    expect(document.getElementById(d.getAttribute("aria-labelledby")!)!.textContent).toBe("Request deletion?");
    expect(text(document.getElementById(d.getAttribute("aria-describedby")!))).toBe("Every conversation and its attachments. Deletion can't be undone. It can take a while; the request's status shows here.");
    expect(document.activeElement).toBe(d.querySelector(".ui-dhp__cancel"));
    // Pick a scope: the confirm button names it
    segOpt(d, "Memory").click();
    await settle();
    const confirm = d.querySelector<HTMLButtonElement>(".ui-dhp__confirm")!;
    expect(text(confirm)).toBe("Delete memory");
    expect(text(d.querySelector(".ui-dhp__dlg-lead"))).toBe("Everything remembered across conversations.");
    // Tab wraps from the last button to the scope, Shift+Tab back
    confirm.focus();
    key(confirm, "Tab");
    expect(document.activeElement).toBe(segOpt(d, "Memory"));
    key(document.activeElement!, "Tab", { shiftKey: true });
    expect(document.activeElement).toBe(confirm);
    key(confirm, "Escape");
    await settle();
    expect(d.open).toBe(false);
    expect(document.activeElement).toBe(request);
  });

  test("confirming fires tc-deletion-request and shows the request as pending until the app lists it", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-deletion-request", (e) => seen.push((e as CustomEvent<DataPolicyDeletionEvent>).detail.scope.id));
    el.querySelector<HTMLButtonElement>(".ui-dhp__request")!.click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-dhp__confirm")!.click();
    await settle();
    await settle();
    expect(seen).toEqual(["conversations"]);
    expect(dialog(el).open).toBe(false);
    expect(document.activeElement).toBe(el.querySelector(".ui-dhp__request"));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Deletion of conversations requested.");
    expect(text(el.querySelector('.ui-dhp__del[data-state="pending"]'))).toBe("Conversations Waiting for confirmation Requested");
    // Equal data doesn't end it; a new request in the list does
    el.deletions = [...DELETIONS];
    await settle();
    expect(el.querySelector('.ui-dhp__del[data-state="pending"]')).toBeTruthy();
    el.deletions = [{ id: "d3", label: "Conversations", state: "received" }, ...DELETIONS];
    await settle();
    expect(el.querySelector('.ui-dhp__del[data-state="pending"]')).toBeNull();
    expect(text(el.querySelector(".ui-dhp__del .ui-dhp__state"))).toBe("Received");
    expect(text(tile(el, "deleted").querySelector(".ui-dhp__stage-line"))).toBe("2 requests open");
    // Prevented: nothing pending
    el.addEventListener("tc-deletion-request", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-dhp__request")!.click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-dhp__confirm")!.click();
    await settle();
    expect(el.querySelector('.ui-dhp__del[data-state="pending"]')).toBeNull();
    // No scopes: no Request deletion; no requests: says so
    el.deletionScopes = [];
    el.deletions = [];
    await settle();
    expect(el.querySelector(".ui-dhp__request")).toBeNull();
    expect(el.querySelector(".ui-dhp__none")!.textContent).toBe("No deletion requests.");
  });

  test("an unavailable scope is never picked for you and can't be confirmed", async () => {
    const el = await make();
    el.deletionScopes = [
      { id: "conversations", label: "Conversations", unavailable: "A legal hold applies." },
      { id: "memory", label: "Memory" },
    ];
    const seen: string[] = [];
    el.addEventListener("tc-deletion-request", (e) => seen.push((e as CustomEvent<DataPolicyDeletionEvent>).detail.scope.id));
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-dhp__request")!.click();
    await settle();
    // The first one it can delete is picked
    expect(dialog(el).querySelector<HTMLElement & { value: string }>("tc-segmented-control")!.value).toBe("memory");
    expect(text(dialog(el).querySelector(".ui-dhp__confirm"))).toBe("Delete memory");
    // A scope that becomes unavailable while the dialog is open can't be confirmed, and says why
    el.deletionScopes = [
      { id: "conversations", label: "Conversations", unavailable: "A legal hold applies." },
      { id: "memory", label: "Memory", unavailable: "Memory is off." },
    ];
    await settle();
    const confirm = dialog(el).querySelector<HTMLButtonElement>(".ui-dhp__confirm")!;
    expect(confirm.disabled).toBe(true);
    expect(text(dialog(el).querySelector(".ui-dhp__dlg-desc"))).toContain("Memory can't be deleted: Memory is off.");
    confirm.click();
    await settle();
    expect(seen).toEqual([]);
    expect(el.querySelector('.ui-dhp__del[data-state="pending"]')).toBeNull();
    // With nothing it can delete, opening again picks nothing
    dialog(el).querySelector<HTMLButtonElement>(".ui-dhp__cancel")!.click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-dhp__request")!.click();
    await settle();
    expect(dialog(el).querySelector<HTMLElement & { value: string }>("tc-segmented-control")!.value).toBe("");
    expect(dialog(el).querySelector<HTMLButtonElement>(".ui-dhp__confirm")!.disabled).toBe(true);
    dialog(el).querySelector<HTMLButtonElement>(".ui-dhp__confirm")!.click();
    await settle();
    expect(seen).toEqual([]);
  });

  test("form reset through React: the baseline is the value React passed; reset goes through onChange", async () => {
    await expectReactFormReset(DataHandlingPolicy, "tc-data-handling-policy", VALUE, { ...VALUE, retention: "7d" });
  });

  test("React wrapper: uncontrolled value survives re-renders; onChange gets the field; onDeletionRequest fires", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(DataHandlingPolicy, {
        title: "Workspace data",
        defaultValue: VALUE,
        onChange: (v, field) => void seen.push(["change", field, v.retention]),
        onDeletionRequest: (scope) => void seen.push(["delete", scope.id]),
        "data-n": n,
      } as React.ComponentProps<typeof DataHandlingPolicy>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcDataHandlingPolicy>("tc-data-handling-policy")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Workspace data");
    segOpt(await openStage(el, "retention"), "7 days").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.value.retention).toBe("7d");
    el.querySelector<HTMLButtonElement>(".ui-dhp__request")!.click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-dhp__confirm")!.click();
    await settle();
    expect(seen).toEqual([
      ["change", "retention", "7d"],
      ["delete", "conversations"],
    ]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled value stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: DataHandlingPolicyValue[] = [];
    await act(async () => root.render(React.createElement(DataHandlingPolicy, { value: VALUE, onChange: (v) => void asked.push(v) })));
    await settle();
    const el = host.querySelector<TcDataHandlingPolicy>("tc-data-handling-policy")!;
    await openStage(el, "training");
    sw(el).click();
    await settle();
    expect(asked.map((v) => v.training)).toEqual([true]);
    expect(sw(el).getAttribute("aria-checked")).toBe("false");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the dialog open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-data-handling-policy .value=${VALUE} .effective=${{ ...VALUE, retention: "90d" }} .locks=${LOCKS} .deletions=${DELETIONS}></tc-data-handling-policy>
        <tc-data-handling-policy look="clean" .value=${VALUE} .locks=${[{ field: "retention" }]} .deletions=${[{ id: "x", label: "Logs", state: "failed" }, { id: "y", label: "Memory", state: "received" }]}></tc-data-handling-policy>
      </div>`);
      const [a, b] = wrap.querySelectorAll<TcDataHandlingPolicy>("tc-data-handling-policy");
      await openStage(b, "redact");
      await openStage(a, "retention");
      a.querySelector<HTMLButtonElement>(".ui-dhp__request")!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      dialog(a).close();
    });
  }
});
