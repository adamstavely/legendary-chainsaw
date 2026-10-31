/*
 * <tc-share-panel> in real browsers: finding and adding people and groups, levels, entitlement checks that pass, fail,
 * partly pass, throw or go stale, what Share sends and leaves out, existing access, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/share-panel";
import type { ShareDenied, ShareEntitlement, ShareEntitlementCheck, ShareGrant, ShareRecipient, ShareSubmit, TcSharePanel } from "../../src/elements/share-panel";
import { SharePanel } from "../../src/elements/react/share-panel";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOOR: ShareRecipient = { id: "noor", kind: "person", name: "Noor Haddad", detail: "noor@example.org" };
const INES: ShareRecipient = { id: "ines", kind: "person", name: "Inês Costa" };
const KOFI: ShareRecipient = { id: "kofi", kind: "person", name: "Kofi Mensah" };
const STATS: ShareRecipient = { id: "stats", kind: "group", name: "Biostatistics", detail: "12 members" };
const BROKEN: ShareRecipient = { id: "broken", kind: "person", name: "Sam Okafor" };
const DIRECTORY = [NOOR, INES, KOFI, STATS, BROKEN];

const check: ShareEntitlementCheck = async (r, level) => {
  if (r.id === "broken") throw new Error("down");
  if (r.id === "ines") return { status: "denied", reason: "Needs the data agreement." };
  if (r.id === "stats") return { status: "partial", allowed: 9, total: 12, reason: "3 haven't trained." };
  if (r.id === "kofi" && level === "edit") return { status: "denied", reason: "View only." };
  return { status: "allowed" };
};
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const panel = (access: ShareGrant[] = [], fn: ShareEntitlementCheck | undefined = check) =>
  fixture<TcSharePanel>(html`<tc-share-panel resource-name="Trial 12" .directory=${DIRECTORY} .access=${access} .checkEntitlement=${fn}></tc-share-panel>`);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-recipient="${id}"]`)!;
const status = (el: Element, id: string) => row(el, id)?.dataset.status;
const type = async (el: Element, value: string) => {
  const input = el.querySelector<HTMLInputElement>(".ui-shr__search")!;
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const add = async (el: TcSharePanel, name: string, id: string) => {
  await type(el, name);
  await expect.poll(() => el.querySelector(".ui-shr__result")).toBeTruthy();
  el.querySelector<HTMLElement>(".ui-shr__result")!.click();
  await settle();
  await expect.poll(() => status(el, id)).not.toBe("checking");
  await settle();
};
const shareButton = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-shr__share")!;
const setLevel = async (el: Element, id: string, level: string) => {
  const select = row(el, id).querySelector<HTMLSelectElement>(".ui-shr__level")!;
  select.value = level;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  await settle();
};
const captured = (el: Element) => {
  const seen: ShareSubmit[] = [];
  el.addEventListener("tc-share", (e) => seen.push((e as CustomEvent<ShareSubmit>).detail));
  return seen;
};

describe("tc-share-panel", () => {
  test("has its heading, search and an empty state", async () => {
    const el = await panel();
    expect(el.dataset.ui).toBe("shr");
    expect(text(el)).toContain("Share Trial 12");
    expect(el.querySelector('[role="combobox"]')).toBeTruthy();
    expect(text(el.querySelector(".ui-shr__empty"))).toContain("Not shared");
    expect(shareButton(el).disabled).toBe(true);
  });

  test("finds by name or detail, and tells people from groups", async () => {
    const el = await panel();
    await type(el, "noor@");
    expect(text(el.querySelector(".ui-shr__result"))).toContain("Noor Haddad");
    await type(el, "bio");
    const result = el.querySelector(".ui-shr__result")!;
    expect(text(result)).toContain("Group");
    expect(result.querySelector('[data-kind="group"]')).toBeTruthy();
    await type(el, "zzz");
    expect(text(el.querySelector(".ui-shr__results"))).toContain("No people or groups");
  });

  test("the keyboard moves through results and adds one", async () => {
    const el = await panel();
    await type(el, "o");
    const input = el.querySelector<HTMLInputElement>(".ui-shr__search")!;
    expect(input.getAttribute("aria-expanded")).toBe("true");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    await settle();
    const second = el.querySelectorAll(".ui-shr__result")[1]!;
    expect(second.getAttribute("aria-selected")).toBe("true");
    expect(input.getAttribute("aria-activedescendant")).toBe(second.id);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await settle();
    expect(el.querySelectorAll(".ui-shr__row")).toHaveLength(1);
    expect(input.value).toBe("");
    expect(el.querySelector(".ui-shr__results")).toBeNull();
  });

  test("search can be on the server, and a stale answer is dropped", async () => {
    const queries: string[] = [];
    const el = await panel();
    el.search = async (q, signal) => {
      queries.push(q);
      return signal.aborted ? [] : [{ ...NOOR, name: `Found ${q}` }];
    };
    await type(el, "a");
    await type(el, "ab");
    await expect.poll(() => text(el.querySelector(".ui-shr__result"))).toContain("Found ab");
    expect(queries).toEqual(["ab"]);
  });

  test("someone allowed is included, at the default level", async () => {
    const el = await panel();
    const seen = captured(el);
    await add(el, "Noor", "noor");
    expect(status(el, "noor")).toBe("allowed");
    expect(text(shareButton(el))).toBe("Share with 1");
    shareButton(el).click();
    await settle();
    expect(seen[0]!.add).toEqual([{ recipient: NOOR, level: "view" }]);
    expect(seen[0]!.access).toEqual([{ recipient: NOOR, level: "view" }]);
    expect(el.access).toEqual(seen[0]!.access);
  });

  test("someone not authorized is flagged, the sharer is told, and they're left out", async () => {
    const el = await panel();
    const denied: ShareDenied[] = [];
    el.addEventListener("tc-share-denied", (e) => denied.push((e as CustomEvent<ShareDenied>).detail));
    const seen = captured(el);
    await add(el, "Inês", "ines");
    expect(text(row(el, "ines"))).toContain("Not authorized.");
    expect(text(row(el, "ines"))).toContain("Needs the data agreement.");
    expect(text(el.querySelector('.ui-shr__notice[data-tone="danger"]'))).toContain("isn't authorized");
    expect(denied[0]!.recipient).toEqual(INES);
    expect(shareButton(el).disabled).toBe(true);
    await add(el, "Noor", "noor");
    shareButton(el).click();
    await settle();
    expect(seen[0]!.add.map((g) => g.recipient.id)).toEqual(["noor"]);
    expect(seen[0]!.excluded).toEqual([{ recipient: INES, level: "view", status: "denied", reason: "Needs the data agreement." }]);
    expect(el.access.map((g) => g.recipient.id)).toEqual(["noor"]);
    // Still on screen, so they can see who didn't get it
    expect(row(el, "ines")).toBeTruthy();
    expect(text(el.querySelector('[role="status"]'))).toContain("1 not included");
  });

  test("a group partly entitled is included, and says how many can see it", async () => {
    const el = await panel();
    const seen = captured(el);
    await add(el, "Bio", "stats");
    expect(text(row(el, "stats"))).toContain("9 of 12 members can see this");
    expect(text(el.querySelector('.ui-shr__notice[data-tone="warning"]'))).toContain("Those members won't see this");
    shareButton(el).click();
    await settle();
    expect(seen[0]!.add[0]!.recipient).toEqual(STATS);
    expect(seen[0]!.partial).toEqual([{ recipient: STATS, level: "view", allowed: 9, total: 12, reason: "3 haven't trained." }]);
  });

  test("a group with nobody entitled counts as denied, and everybody as allowed", async () => {
    let answer: ShareEntitlement = { status: "partial", allowed: 0, total: 5 };
    const el = await panel([], async () => answer);
    await add(el, "Bio", "stats");
    expect(status(el, "stats")).toBe("denied");
    answer = { status: "partial", allowed: 5, total: 5 };
    await setLevel(el, "stats", "edit");
    await expect.poll(() => status(el, "stats")).toBe("allowed");
  });

  test("a check that throws fails closed, and Try again can clear it", async () => {
    let up = false;
    const el = await panel([], async () => {
      if (!up) throw new Error("down");
      return { status: "allowed" };
    });
    await add(el, "Sam", "broken");
    expect(status(el, "broken")).toBe("error");
    expect(text(row(el, "broken"))).toContain("Couldn't check access");
    expect(shareButton(el).disabled).toBe(true);
    up = true;
    row(el, "broken").querySelector<HTMLElement>(".ui-shr__retry")!.click();
    await expect.poll(() => status(el, "broken")).toBe("allowed");
    await settle();
    expect(shareButton(el).disabled).toBe(false);
  });

  test("an answer it doesn't recognise fails closed", async () => {
    for (const bad of [undefined, { ok: true }, { status: "yes" }, { status: "partial", allowed: 1 }]) {
      const el = await panel([], (async () => bad) as unknown as ShareEntitlementCheck);
      await add(el, "Noor", "noor");
      expect(status(el, "noor")).toBe("error");
    }
  });

  test("with no check at all, nobody can be added", async () => {
    const el = await fixture<TcSharePanel>(html`<tc-share-panel .directory=${DIRECTORY}></tc-share-panel>`);
    await add(el, "Noor", "noor");
    expect(status(el, "noor")).toBe("error");
    expect(shareButton(el).disabled).toBe(true);
  });

  test("Share waits while a check is running", async () => {
    let finish_!: (e: ShareEntitlement) => void;
    const el = await panel([], (r) => (r.id === "kofi" ? new Promise((res) => (finish_ = res)) : { status: "allowed" }));
    await add(el, "Noor", "noor");
    expect(shareButton(el).disabled).toBe(false);
    await type(el, "Kofi");
    el.querySelector<HTMLElement>(".ui-shr__result")!.click();
    await settle();
    await expect.poll(() => status(el, "kofi")).toBe("checking");
    await settle();
    expect(shareButton(el).disabled).toBe(true);
    expect(text(el.querySelector(".ui-shr__waiting"))).toContain("Waiting");
    finish_({ status: "allowed" });
    await expect.poll(() => shareButton(el).disabled).toBe(false);
  });

  test("changing the level checks again, and an older answer can't win", async () => {
    const resolvers = new Map<string, (e: ShareEntitlement) => void>();
    const signals: AbortSignal[] = [];
    const el = await panel([], (_r, level, signal) => {
      signals.push(signal);
      return new Promise((res) => resolvers.set(level, res));
    });
    await type(el, "Kofi");
    el.querySelector<HTMLElement>(".ui-shr__result")!.click();
    await settle();
    await expect.poll(() => resolvers.has("view")).toBe(true);
    await setLevel(el, "kofi", "edit");
    await expect.poll(() => resolvers.has("edit")).toBe(true);
    expect(signals[0]!.aborted).toBe(true);
    resolvers.get("edit")!({ status: "denied", reason: "View only." });
    await expect.poll(() => status(el, "kofi")).toBe("denied");
    // The check for the old level says yes, too late
    resolvers.get("view")!({ status: "allowed" });
    await settle();
    await settle();
    expect(status(el, "kofi")).toBe("denied");
  });

  test("a level that's refused for someone new leaves them out", async () => {
    const el = await panel();
    const seen = captured(el);
    await add(el, "Kofi", "kofi");
    expect(status(el, "kofi")).toBe("allowed");
    await setLevel(el, "kofi", "edit");
    await expect.poll(() => status(el, "kofi")).toBe("denied");
    expect(text(row(el, "kofi"))).toContain("View only.");
    await setLevel(el, "kofi", "comment");
    await expect.poll(() => status(el, "kofi")).toBe("allowed");
    await settle();
    shareButton(el).click();
    await settle();
    expect(seen[0]!.add).toEqual([{ recipient: KOFI, level: "comment" }]);
  });

  test("removing someone new stops their check and leaves no trace", async () => {
    const signals: AbortSignal[] = [];
    const el = await panel([], (_r, _l, signal) => {
      signals.push(signal);
      return new Promise(() => {});
    });
    await type(el, "Noor");
    el.querySelector<HTMLElement>(".ui-shr__result")!.click();
    await settle();
    await expect.poll(() => signals.length).toBe(1);
    row(el, "noor").querySelector<HTMLElement>(".ui-shr__remove")!.click();
    await settle();
    expect(row(el, "noor")).toBeNull();
    expect(signals[0]!.aborted).toBe(true);
  });

  test("adding someone twice keeps one row", async () => {
    const el = await panel();
    await add(el, "Noor", "noor");
    await add(el, "Noor", "noor");
    expect(el.querySelectorAll(".ui-shr__row")).toHaveLength(1);
  });

  test("existing access is checked, and someone no longer entitled is flagged but kept", async () => {
    const el = await panel([{ recipient: NOOR, level: "edit" }, { recipient: INES, level: "view" }]);
    const seen = captured(el);
    await expect.poll(() => status(el, "ines")).toBe("denied");
    await settle();
    expect(text(row(el, "ines"))).toContain("No longer authorized");
    expect(text(el.querySelector('.ui-shr__notice[data-tone="warning"]'))).toContain("no longer authorized");
    expect(shareButton(el).disabled).toBe(true);
    row(el, "ines").querySelector<HTMLElement>(".ui-shr__remove")!.click();
    await settle();
    expect(text(row(el, "ines"))).toContain("Access will be removed");
    expect(text(shareButton(el))).toBe("Save changes");
    shareButton(el).click();
    await settle();
    expect(seen[0]!.remove).toEqual([INES]);
    expect(el.access.map((g) => g.recipient.id)).toEqual(["noor"]);
    expect(row(el, "ines")).toBeNull();
  });

  test("existing access whose check fails isn't called unauthorized", async () => {
    const el = await panel([{ recipient: BROKEN, level: "view" }]);
    await expect.poll(() => status(el, "broken")).toBe("error");
    await settle();
    const notice = text(el.querySelector(".ui-shr__notice"));
    expect(notice).toContain("couldn't be checked");
    expect(notice).not.toContain("no longer authorized");
  });

  test("Undo brings back someone marked for removal", async () => {
    const el = await panel([{ recipient: NOOR, level: "edit" }]);
    await expect.poll(() => status(el, "noor")).toBe("allowed");
    await settle();
    const remove = row(el, "noor").querySelector<HTMLElement>(".ui-shr__remove")!;
    remove.click();
    await settle();
    expect(text(remove)).toContain("Undo");
    remove.click();
    await settle();
    expect(shareButton(el).disabled).toBe(true);
  });

  test("a refused raise goes back to the level they have after Share", async () => {
    const el = await panel([{ recipient: KOFI, level: "view" }, { recipient: NOOR, level: "view" }]);
    const seen = captured(el);
    await expect.poll(() => status(el, "kofi")).toBe("allowed");
    await setLevel(el, "kofi", "edit");
    await expect.poll(() => status(el, "kofi")).toBe("denied");
    expect(text(row(el, "kofi"))).toContain("Not authorized");
    await setLevel(el, "noor", "comment");
    await expect.poll(() => status(el, "noor")).toBe("allowed");
    await settle();
    shareButton(el).click();
    await settle();
    expect(seen[0]!.change).toEqual([{ recipient: NOOR, level: "comment" }]);
    expect(seen[0]!.excluded.map((e) => e.recipient.id)).toEqual(["kofi"]);
    expect(el.access.find((g) => g.recipient.id === "kofi")!.level).toBe("view");
    await expect.poll(() => row(el, "kofi").querySelector<HTMLSelectElement>(".ui-shr__level")!.value).toBe("view");
    await expect.poll(() => status(el, "kofi")).toBe("allowed");
  });

  test("preventDefault keeps access, and the rows stay pending", async () => {
    const el = await panel();
    el.addEventListener("tc-share", (e) => e.preventDefault());
    await add(el, "Noor", "noor");
    shareButton(el).click();
    await settle();
    expect(el.access).toEqual([]);
    expect(text(shareButton(el))).toBe("Share with 1");
  });

  test("while sending, the controls are locked", async () => {
    const el = await panel();
    await add(el, "Noor", "noor");
    el.sending = true;
    await settle();
    expect(shareButton(el).disabled).toBe(true);
    expect(el.querySelector<HTMLInputElement>(".ui-shr__search")!.disabled).toBe(true);
    expect(row(el, "noor").querySelector<HTMLSelectElement>(".ui-shr__level")!.disabled).toBe(true);
  });

  test("leaving the page stops running checks", async () => {
    const signals: AbortSignal[] = [];
    const el = await panel([{ recipient: NOOR, level: "view" }], (_r, _l, signal) => {
      signals.push(signal);
      return new Promise(() => {});
    });
    await expect.poll(() => signals.length).toBe(1);
    el.remove();
    expect(signals[0]!.aborted).toBe(true);
  });

  test("a new check function asks again", async () => {
    const el = await panel([{ recipient: NOOR, level: "view" }]);
    await expect.poll(() => status(el, "noor")).toBe("allowed");
    el.checkEntitlement = async () => ({ status: "denied" });
    await expect.poll(() => status(el, "noor")).toBe("denied");
  });

  test("labels can be renamed", async () => {
    const el = await panel();
    el.labels = { search: "Find someone" };
    await settle();
    expect(text(el.querySelector(".ui-shr__label"))).toBe("Find someone");
  });
});

describe("React", () => {
  const mount = async (node: React.ReactElement) => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(node));
    await settle();
    return { host, root };
  };

  test("uncontrolled access survives the parent re-rendering", async () => {
    const node = () => React.createElement(SharePanel, { directory: DIRECTORY, checkEntitlement: check, defaultAccess: [] });
    const { host, root } = await mount(node());
    const el = host.querySelector<TcSharePanel>("tc-share-panel")!;
    await act(async () => add(el, "Noor", "noor"));
    await act(async () => shareButton(el).click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.access.map((g) => g.recipient.id)).toEqual(["noor"]);
    await act(async () => root.unmount());
    host.remove();
  });

  test("controlled access stays until the parent changes it", async () => {
    const seen: ShareSubmit[] = [];
    const { host, root } = await mount(React.createElement(SharePanel, { directory: DIRECTORY, checkEntitlement: check, access: [], onShare: (d: ShareSubmit) => seen.push(d) }));
    const el = host.querySelector<TcSharePanel>("tc-share-panel")!;
    await act(async () => add(el, "Noor", "noor"));
    await act(async () => shareButton(el).click());
    expect(seen[0]!.add).toHaveLength(1);
    expect(el.access).toEqual([]);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}`}>
          <tc-share-panel .directory=${DIRECTORY} .checkEntitlement=${check} .access=${[{ recipient: NOOR, level: "view" }, { recipient: INES, level: "view" }, { recipient: STATS, level: "view" }, { recipient: BROKEN, level: "view" }]}></tc-share-panel>
        </div>`);
        const el = wrap.querySelector<TcSharePanel>("tc-share-panel")!;
        await expect.poll(() => status(el, "broken")).toBe("error");
        await type(el, "Kofi");
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
