/* trenchcoat/testing against the real elements, and trenchcoat/headless's exports. */
import { html } from "lit";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/case-review";
import "../../src/elements/share-panel";
import "../../src/elements/team-flag-picker";
import { ListMotionController, PopoverController, measureRows, placePopover, playRows, safeUrl } from "../../src/headless";
import { addRecipient, clickButton, decideCase, fixtures, mockEntitlement, pickFlag, selectOption, settled, submitShare, typeInto, waitFor } from "../../src/testing";
import type { TcCaseReview } from "../../src/elements/case-review";
import type { TcSharePanel } from "../../src/elements/share-panel";
import type { TcTeamFlagPicker } from "../../src/elements/team-flag-picker";
import { cleanup, fixture } from "./helpers";

afterEach(cleanup);

describe("trenchcoat/testing", () => {
  test("pickFlag picks and clears, and names what's there when it can't", async () => {
    const el = await fixture<TcTeamFlagPicker>(html`<tc-team-flag-picker .flags=${fixtures.flags}></tc-team-flag-picker>`);
    await pickFlag(el, "Legal hold");
    expect(el.value).toBe("hold");
    await pickFlag(el, null);
    expect(el.value).toBeNull();
    await expect(pickFlag(el, "Nope")).rejects.toThrow(/No flag "Nope".*Needs review/);
  });

  test("addRecipient reports each check, and mockEntitlement answers", async () => {
    const check = mockEntitlement({ ines: { status: "denied" }, stats: new Error("down") });
    const el = await fixture<TcSharePanel>(html`<tc-share-panel .directory=${fixtures.people} .checkEntitlement=${check as never}></tc-share-panel>`);
    expect(await addRecipient(el, "Noor Haddad", { level: "Can edit" })).toBe("allowed");
    expect(await addRecipient(el, "Inês Costa")).toBe("denied");
    expect(await addRecipient(el, "Biostatistics")).toBe("error");
    await submitShare(el);
    expect(el.access).toEqual([{ recipient: fixtures.people[0], level: "edit" }]);
  });

  test("submitShare refuses when Share is disabled", async () => {
    const el = await fixture<TcSharePanel>(html`<tc-share-panel></tc-share-panel>`);
    await expect(submitShare(el)).rejects.toThrow(/Share is disabled/);
  });

  test("decideCase records a decision", async () => {
    const el = await fixture<TcCaseReview>(html`<tc-case-review></tc-case-review>`);
    await decideCase(el, "approve", "Fine.");
    expect(el.decision).toEqual({ option: "approve", note: "Fine." });
    await expect(decideCase(await fixture<TcCaseReview>(html`<tc-case-review></tc-case-review>`), "nope", "x")).rejects.toThrow(/No outcome/);
  });

  test("the generic helpers click, type and choose, with clear errors", async () => {
    let clicks = 0;
    const wrap = await fixture<HTMLElement>(html`<div>
      <button @click=${() => clicks++}>Save</button><button disabled>Off</button>
      <input /><select><option value="a">One</option><option value="b">Two</option></select>
    </div>`);
    await clickButton(wrap, "Save");
    expect(clicks).toBe(1);
    await expect(clickButton(wrap, "Off")).rejects.toThrow(/disabled/);
    await expect(clickButton(wrap, "Gone")).rejects.toThrow(/Save \| Off/);
    const input = wrap.querySelector("input")!;
    await typeInto(input, "hello");
    expect(input.value).toBe("hello");
    const select = wrap.querySelector("select")!;
    await selectOption(select, "Two");
    expect(select.value).toBe("b");
    await expect(selectOption(select, "Three")).rejects.toThrow(/One \| Two/);
    await expect(typeInto(null, "x")).rejects.toThrow(/No field/);
  });

  test("waitFor returns the value, or times out naming what it waited for", async () => {
    let ready = false;
    setTimeout(() => (ready = true), 30);
    expect(await waitFor(() => ready && "done")).toBe("done");
    await expect(waitFor(() => false, { timeout: 40, message: "the thing" })).rejects.toThrow(/the thing/);
    await settled();
  });
});

describe("trenchcoat/headless", () => {
  test("exports working behaviour", async () => {
    expect(typeof PopoverController).toBe("function");
    expect(typeof ListMotionController).toBe("function");
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    const placed = placePopover({ left: 100, top: 100, width: 10, height: 10 }, { width: 50, height: 20 }, { width: 800, height: 600 });
    expect(placed).toBeTruthy();
    const list = await fixture<HTMLElement>(html`<div><p style="height: 20px; margin: 0">A</p><p style="height: 20px; margin: 0">B</p></div>`);
    const before = measureRows(list);
    expect(before.size).toBe(2);
    list.prepend(list.lastElementChild!);
    playRows(list, before, { duration: 100 });
    expect((list.firstElementChild as HTMLElement).getAnimations().length).toBe(1);
  });
});
