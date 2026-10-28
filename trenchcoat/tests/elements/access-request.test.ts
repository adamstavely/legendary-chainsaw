/*
 * <tc-access-request> in real browsers: the resource and its classification, the level and duration radio groups,
 * validation in words, sending, each status, cancelling and asking again, controlled use, the React wrapper and axe
 * in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/access-request";
import type { AccessRequestDetail, AccessResource, AccessStatusChange, TcAccessRequest } from "../../src/elements/access-request";
import { AccessRequest } from "../../src/elements/react/access-request";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 28, 10, 0).getTime();
const RESOURCE: AccessResource = {
  name: "Field station sensor readings 2024",
  type: "dataset",
  description: "Hourly readings from the masts.",
  owner: "Field Data team",
  steward: "Dr Ines Okafor",
  classification: "internal",
  current: "No access",
};
const WHY = "Comparing soil moisture with the 2023 drought survey.";

const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcAccessRequest>(html`<tc-access-request look=${look} .resource=${RESOURCE} .approvers=${["Dr Ines Okafor", "Tom Reyes"]} .now=${NOW}></tc-access-request>`);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const type = (field: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  field.value = text;
  field.dispatchEvent(new Event("input", { bubbles: true }));
};
const why = (el: Element) => el.querySelector<HTMLTextAreaElement>('[data-field="why"]')!;
const send = async (el: Element) => {
  el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
  await settle();
};
const checked = (el: Element, group: string) => [...el.querySelectorAll<HTMLElement>(`[data-${group}]`)].find((b) => b.getAttribute("aria-checked") === "true")?.dataset[group];

describe("tc-access-request", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the resource, the level and duration groups, and the form`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("dar");
      expect(el.dataset.look).toBe(look);
      const group = el.querySelector('.ui-dar__card[role="group"]')!;
      expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent).toBe("Request access");
      expect(el.querySelector(".ui-dar__name")!.textContent).toBe("Field station sensor readings 2024");
      expect(el.querySelector(".ui-dar__type")!.textContent).toBe("Dataset");
      expect(el.querySelector(".ui-dar__class")!.textContent).toBe("Classification: Internal");
      expect(el.querySelector(".ui-dar__class")!.getAttribute("data-tone")).toBe("info");
      expect(el.querySelector(".ui-dar__who")!.textContent).toBe("Owner: Field Data team · Steward: Dr Ines Okafor");
      expect(el.querySelector(".ui-dar__current")!.textContent).toBe("You have: No access");
      const levels = el.querySelectorAll('.ui-dar__levels [role="radio"]');
      expect([...levels].map((l) => l.querySelector(".ui-dar__level-label")!.textContent)).toEqual(["View", "Download", "Edit"]);
      expect(checked(el, "level")).toBe("view");
      expect(el.querySelectorAll('.ui-dar__levels [tabindex="0"]')).toHaveLength(1);
      expect([...el.querySelectorAll(".ui-dar__chip")].map((c) => c.textContent)).toEqual(["7 days", "30 days", "90 days", "End date"]);
      expect(checked(el, "duration")).toBe("30d");
      expect(why(el).required).toBe(true);
      expect(el.querySelector(".ui-dar__count")!.textContent).toBe("0 of at least 20 characters");
      expect(el.querySelector(".ui-dar__fields")).toBeNull();
      expect(el.querySelector('label[for$="-ref"]')!.textContent).toBe("Ticket or reference (optional)");
      el.allowPermanent = true;
      el.referenceLabel = "";
      await settle();
      expect(el.querySelector('[data-duration="permanent"]')!.textContent).toBe("Permanent");
      expect(el.querySelector('label[for$="-ref"]')).toBeNull();
    });
  }

  test("validation: errors in words, tied to their fields; focus goes to the first; nothing is sent", async () => {
    const el = await fixture<TcAccessRequest>(html`<tc-access-request .resource=${RESOURCE} .fields=${["timestamp", "air_temp_c"]} .now=${NOW}></tc-access-request>`);
    let sent = 0;
    el.addEventListener("tc-request", () => sent++);
    await send(el);
    expect(sent).toBe(0);
    const field = why(el);
    expect(field.getAttribute("aria-invalid")).toBe("true");
    const msg = document.getElementById(field.getAttribute("aria-describedby")!.split(" ")[1])!;
    expect(msg.textContent).toBe("Say why you need this access.");
    await expect.poll(() => document.activeElement).toBe(field);
    type(field, "Too short");
    await settle();
    expect(document.getElementById(why(el).getAttribute("aria-describedby")!.split(" ")[1])!.textContent).toBe("Say a little more – at least 20 characters (11 more).");
    expect(el.querySelector(".ui-dar__count")!.textContent).toBe("9 of at least 20 characters");
    type(why(el), WHY);
    await send(el);
    const fields = el.querySelector<HTMLElement>(".ui-dar__fields")!;
    expect(document.getElementById(fields.getAttribute("aria-describedby")!)!.textContent).toBe("Pick at least one field.");
    await expect.poll(() => document.activeElement).toBe(fields);
    expect(sent).toBe(0);
    // An end date: needed, and in the future
    el.querySelector<HTMLElement>('[data-duration="custom"]')!.click();
    el.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await send(el);
    const date = el.querySelector<HTMLInputElement>('[data-field="until"]')!;
    expect(date.min).toBe("2026-10-29");
    expect(document.getElementById(date.getAttribute("aria-describedby")!)!.textContent).toBe("Pick the date access should end.");
    type(date, "2026-10-01");
    await send(el);
    expect(el.querySelector(".ui-dar__msg")!.textContent).toBe("The end date has to be in the future.");
    expect(sent).toBe(0);
  });

  test("sending: tc-request carries the choices; the status moves to pending with who decides", async () => {
    const el = await fixture<TcAccessRequest>(html`<tc-access-request .resource=${RESOURCE} .fields=${["timestamp", "air_temp_c", "battery_v"]} .approvers=${["Dr Ines Okafor", "Tom Reyes"]} .now=${NOW}></tc-access-request>`);
    const seen: AccessRequestDetail[] = [];
    const statuses: string[] = [];
    el.addEventListener("tc-request", (e) => seen.push((e as CustomEvent<AccessRequestDetail>).detail));
    el.addEventListener("tc-status-change", (e) => statuses.push((e as CustomEvent<AccessStatusChange>).detail.status));
    // Level by arrow key, duration by click
    el.querySelector<HTMLElement>('[data-level="view"]')!.focus();
    key(document.activeElement!, "ArrowRight");
    await expect.poll(() => document.activeElement?.getAttribute("data-level")).toBe("download");
    expect(checked(el, "level")).toBe("download");
    el.querySelector<HTMLElement>('[data-duration="7d"]')!.click();
    const boxes = el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    boxes[2].click();
    boxes[0].click();
    type(why(el), `  ${WHY}  `);
    type(el.querySelector<HTMLInputElement>('input[id$="-ref"]')!, " RQ-4471 ");
    await send(el);
    expect(seen).toEqual([{ level: "download", duration: "7d", until: NOW + 7 * DAY, justification: WHY, reference: "RQ-4471", fields: ["timestamp", "battery_v"] }]);
    expect(statuses).toEqual(["pending"]);
    expect(el.status).toBe("pending");
    expect(el.getAttribute("status")).toBe("pending");
    expect(el.submittedAt).toBe(NOW);
    expect(el.querySelector(".ui-dar__status-word")!.textContent).toBe("Waiting for approval");
    expect(el.querySelector(".ui-dar__status-detail")!.textContent!.replace(/\s+/g, " ").trim()).toMatch(/^Download access requested · sent .+ Waiting for Dr Ines Okafor and Tom Reyes$/);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Request sent");
    expect(el.querySelector("form")).toBeNull();
  });

  test("an end date or permanent sets until; a prevented tc-request or tc-status-change keeps the form", async () => {
    const el = await make();
    el.allowPermanent = true;
    await settle();
    const seen: (number | null)[] = [];
    el.addEventListener("tc-request", (e) => seen.push((e as CustomEvent<AccessRequestDetail>).detail.until));
    el.addEventListener("tc-request", (e) => e.preventDefault(), { once: true });
    type(why(el), WHY);
    el.querySelector<HTMLElement>('[data-duration="permanent"]')!.click();
    await send(el);
    expect(el.status).toBe("draft");
    el.addEventListener("tc-status-change", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLElement>('[data-duration="custom"]')!.click();
    await settle();
    type(el.querySelector<HTMLInputElement>('[data-field="until"]')!, "2026-12-31");
    await send(el);
    expect(el.status).toBe("draft");
    expect(el.submittedAt).toBeUndefined();
    expect(seen).toEqual([null, new Date("2026-12-31T23:59:59").getTime()]);
  });

  test("pending: Cancel request fires tc-cancel and returns to the form; prevented, it stays pending", async () => {
    const el = await fixture<TcAccessRequest>(html`<tc-access-request status="pending" .resource=${RESOURCE} .now=${NOW} .submittedAt=${NOW - DAY}></tc-access-request>`);
    let cancels = 0;
    el.addEventListener("tc-cancel", () => cancels++);
    el.addEventListener("tc-cancel", (e) => e.preventDefault(), { once: true });
    const cancel = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-dar__btn")].find((b) => b.textContent === "Cancel request")!;
    cancel().click();
    await settle();
    expect(el.status).toBe("pending");
    cancel().click();
    await settle();
    expect(el.status).toBe("draft");
    expect(el.submittedAt).toBeUndefined();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Request cancelled");
    expect(cancels).toBe(2);
  });

  test("approved, denied and expired: in words with an icon; time left; Request again returns to the form", async () => {
    const el = await fixture<TcAccessRequest>(html`<tc-access-request status="approved" level="edit" .resource=${RESOURCE} .now=${NOW} .expiresAt=${NOW + 12 * DAY + 5000}></tc-access-request>`);
    const text = () => el.querySelector(".ui-dar__status")!.textContent!.replace(/\s+/g, " ").trim();
    expect(el.querySelector(".ui-dar__status-word")!.textContent).toBe("Access granted");
    expect(el.querySelector(".ui-dar__status-icon svg")).not.toBeNull();
    expect(el.querySelector(".ui-dar__left")!.textContent).toBe("12 days left");
    expect(text()).toMatch(/^Access granted Edit access until .+ · 12 days left$/);
    el.expiresAt = NOW + 3 * 3_600_000;
    await settle();
    expect(el.querySelector(".ui-dar__left")!.textContent).toBe("3 hours left");
    el.expiresAt = undefined;
    await settle();
    expect(text()).toBe("Access granted Edit access with no end date");
    el.status = "denied";
    el.reason = "Use the monthly summary instead.";
    await settle();
    expect(text()).toBe("Request denied “Use the monthly summary instead.” Request again");
    el.status = "expired";
    el.expiresAt = NOW - DAY;
    await settle();
    expect(text()).toMatch(/^Access expired Ended .+ Request again$/);
    const statuses: string[] = [];
    el.addEventListener("tc-status-change", (e) => statuses.push((e as CustomEvent<AccessStatusChange>).detail.status));
    el.querySelector<HTMLButtonElement>(".ui-dar__status .ui-dar__btn")!.click();
    await settle();
    expect(el.status).toBe("draft");
    expect(statuses).toEqual(["draft"]);
    expect(el.querySelector("form")).not.toBeNull();
    expect(checked(el, "level")).toBe("edit");
  });

  test("custom levels, durations and classifications; a resource without extras; narrow width keeps everything", async () => {
    const el = await fixture<TcAccessRequest>(html`<div style="width: 300px">
      <tc-access-request
        .resource=${{ name: "Grant ledger", type: "spreadsheet", classification: "secret" }}
        .levels=${[{ id: "read", label: "Read" }]}
        .durations=${[{ id: "1d", label: "1 day", days: 1 }]}
        .classifications=${{ secret: { label: "Secret", tone: "danger" } }}
      ></tc-access-request>
    </div>`).then((w) => w.querySelector<TcAccessRequest>("tc-access-request")!);
    expect(el.querySelector(".ui-dar__type")!.textContent).toBe("spreadsheet");
    expect(el.querySelector(".ui-dar__class")!.textContent).toBe("Classification: Secret");
    expect(el.querySelector(".ui-dar__class")!.getAttribute("data-tone")).toBe("danger");
    expect(el.querySelector(".ui-dar__who")).toBeNull();
    expect(checked(el, "level")).toBe("read");
    expect(checked(el, "duration")).toBe("1d");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React wrapper: uncontrolled status survives re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(AccessRequest, { title: "Ask for data", resource: RESOURCE, now: NOW, onStatusChange: (s) => void seen.push(s), onRequest: (r) => void seen.push(r.level), "data-n": n } as React.ComponentProps<typeof AccessRequest>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-access-request")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Ask for data");
    type(why(el), WHY);
    await send(el);
    await act(async () => bump());
    await settle();
    expect(el.status).toBe("pending");
    expect(seen).toEqual(["view", "pending"]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    const seen2: unknown[] = [];
    await act(async () =>
      root2.render(
        React.createElement(AccessRequest, {
          resource: RESOURCE,
          status: "draft",
          now: NOW,
          onStatusChange: (s) => void seen2.push(s),
          onRequest: (r) => {
            seen2.push(r.duration);
          },
        }),
      ),
    );
    await settle();
    const el2 = host2.querySelector("tc-access-request")!;
    type(why(el2), WHY);
    await send(el2);
    expect(el2.status).toBe("draft");
    expect(seen2).toEqual(["30d", "pending"]);
    // A request the page refuses: onRequest returning false keeps the form, with no status change
    await act(async () => root2.render(React.createElement(AccessRequest, { resource: RESOURCE, status: "draft", now: NOW, onStatusChange: (s) => void seen2.push(s), onRequest: () => false })));
    await settle();
    await send(el2);
    expect(seen2).toEqual(["30d", "pending"]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, in the form and each status`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 16px">
        <tc-access-request description="Ardach Institute data catalogue" .resource=${RESOURCE} .fields=${["timestamp", "air_temp_c"]} allow-permanent .now=${NOW}></tc-access-request>
        <tc-access-request look="clean" .resource=${{ ...RESOURCE, classification: "restricted" }} .now=${NOW}></tc-access-request>
        <tc-access-request status="pending" .resource=${RESOURCE} .approvers=${["Dr Ines Okafor"]} .submittedAt=${NOW} .now=${NOW}></tc-access-request>
        <tc-access-request look="clean" status="approved" .resource=${RESOURCE} .expiresAt=${NOW + 5 * DAY} .now=${NOW}></tc-access-request>
        <tc-access-request status="denied" reason="Use the summary." .resource=${RESOURCE} .now=${NOW}></tc-access-request>
        <tc-access-request look="clean" status="expired" .resource=${RESOURCE} .expiresAt=${NOW - DAY} .now=${NOW}></tc-access-request>
      </div>`);
      // A failed send shows the errors, which axe checks too
      wrap.querySelector<HTMLButtonElement>('tc-access-request button[type="submit"]')!.click();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
