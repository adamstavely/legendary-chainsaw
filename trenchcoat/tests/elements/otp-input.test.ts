/*
 * <tc-otp-input> in real browsers – the React component's contract and regression checks, ported, plus the form
 * control checks (form value, required, reset, disabled fieldset, <label for>).
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/otp-input";
import { TcOtpInput, type OtpValueChange } from "../../src/elements/otp-input";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const inputOf = (el: Element) => el.querySelector<HTMLInputElement>(".ui-otp__input")!;
/** Types into the real input the way the browser does: the value changes, then an input event */
const type = (el: Element, value: string) => {
  const input = inputOf(el);
  input.value = value;
  input.setSelectionRange(value.length, value.length);
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
};

describe("tc-otp-input", () => {
  test.each(["resolve", "reject"] as const)("form reset invalidates a pending check that later %ss", async (outcome) => {
    let resolve!: () => void;
    let reject!: () => void;
    let signal!: AbortSignal;
    const onComplete = (_code: string, options: { signal: AbortSignal }) => {
      signal = options.signal;
      return new Promise<void>((ok, fail) => {
        resolve = ok;
        reject = () => fail(new Error("Old check"));
      });
    };
    const form = await fixture<HTMLFormElement>(html`<form><tc-otp-input length="4" .onComplete=${onComplete}></tc-otp-input></form>`);
    const el = form.querySelector<TcOtpInput>("tc-otp-input")!;
    type(el, "1234");
    await settle();
    expect(el.dataset.status).toBe("verifying");
    form.reset();
    await settle();
    expect(signal.aborted).toBe(true);
    expect(el.value).toBe("");
    type(el, "5");
    await settle();
    if (outcome === "resolve") resolve();
    else reject();
    await settle();
    expect(el.dataset.status).toBe("idle");
    expect(el.value).toBe("5");
    expect(inputOf(el).readOnly).toBe(false);
  });

  test("the host is the root; one box per character; the separator", async () => {
    const el = await fixture<TcOtpInput>(html`<tc-otp-input separator></tc-otp-input>`);
    expect(el.dataset.ui).toBe("otp");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.status).toBe("idle");
    expect(el.querySelectorAll(".ui-otp__box")).toHaveLength(6);
    expect([...el.querySelector(".ui-otp__slots")!.children].findIndex((c) => c.classList.contains("ui-otp__sep"))).toBe(3);
    const input = inputOf(el);
    expect(input.getAttribute("aria-label")).toBe("Verification code, 6 digits");
    expect(input.getAttribute("autocomplete")).toBe("one-time-code");
    expect(input.inputMode).toBe("numeric");
  });

  test("value is controllable (contract): set it, and preventDefault keeps it", async () => {
    const el = await fixture<TcOtpInput>(html`<tc-otp-input></tc-otp-input>`);
    el.value = "12";
    await settle();
    expect(inputOf(el).value).toBe("12");
    el.value = "123456";
    await settle();
    expect(inputOf(el).value).toBe("123456");
    const seen: string[] = [];
    el.addEventListener("tc-value-change", (e) => {
      seen.push((e as unknown as CustomEvent<OtpValueChange>).detail.value);
      e.preventDefault();
    });
    type(el, "12");
    await settle();
    expect(seen).toEqual(["12"]);
    expect(el.value).toBe("123456");
    expect(inputOf(el).value).toBe("123456");
  });

  test("status is controllable (contract)", async () => {
    const el = await fixture<TcOtpInput>(html`<tc-otp-input status="idle"></tc-otp-input>`);
    el.status = "verifying";
    await settle();
    expect(el.dataset.status).toBe("verifying");
    expect(inputOf(el).readOnly).toBe(true);
  });

  test("only allowed characters are kept; letters in capitals when not numeric", async () => {
    const el = await fixture<TcOtpInput>(html`<tc-otp-input></tc-otp-input>`);
    type(el, "48 2-9");
    await settle();
    expect(el.value).toBe("4829");
    const letters = await fixture<TcOtpInput>(html`<tc-otp-input numeric="false" length="4"></tc-otp-input>`);
    type(letters, "ab-1c9");
    await settle();
    expect(letters.value).toBe("AB1C");
    expect(inputOf(letters).getAttribute("aria-label")).toBe("Verification code, 4 characters");
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("an error still clears the code a moment later", async () => {
        const onChange = vi.fn();
        const el = await fixture<TcOtpInput>(html`<tc-otp-input look=${look} value="123456" @tc-value-change=${(e: CustomEvent<OtpValueChange>) => onChange(e.detail.value)}></tc-otp-input>`);
        el.status = "error";
        await settle();
        expect(el.hasAttribute("data-error")).toBe(true);
        expect(inputOf(el).getAttribute("aria-invalid")).toBe("true");
        expect(document.getElementById(inputOf(el).getAttribute("aria-describedby")!)!.textContent).toContain("That code didn't work. Try again.");
        await expect.poll(() => inputOf(el).value, { timeout: 3000 }).toBe("");
        expect(onChange).toHaveBeenLastCalledWith("");
      });

      test("error → verifying within a second keeps the code", async () => {
        const onChange = vi.fn();
        const el = await fixture<TcOtpInput>(html`<tc-otp-input look=${look} value="123456" @tc-value-change=${onChange}></tc-otp-input>`);
        el.status = "error";
        await wait(300);
        el.status = "verifying";
        await wait(1200);
        await settle();
        expect(inputOf(el).value).toBe("123456");
        expect(onChange).not.toHaveBeenCalled();
      });

      test("an IME composing doesn't overwrite the code; its full-width digits count once it's done", async () => {
        const onChange = vi.fn();
        const el = await fixture<TcOtpInput>(html`<tc-otp-input look=${look} @tc-value-change=${(e: CustomEvent<OtpValueChange>) => onChange(e.detail.value)}></tc-otp-input>`);
        const input = inputOf(el);
        input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
        type(el, "１２");
        await settle();
        expect(input.value).toBe("１２");
        expect(onChange).not.toHaveBeenCalled();
        type(el, "１２３");
        input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
        await settle();
        expect(onChange).toHaveBeenLastCalledWith("123");
        expect(input.value).toBe("123");
      });

      test("without a status, the promise from onComplete drives verifying → error → idle; removal aborts a check", async () => {
        let reject!: () => void;
        let signal!: AbortSignal;
        const onComplete = vi.fn((_code: string, o: { signal: AbortSignal }) => ((signal = o.signal), new Promise((_, r) => (reject = () => r(new Error("no"))))));
        const el = await fixture<TcOtpInput>(html`<tc-otp-input look=${look} length="4" .onComplete=${onComplete}></tc-otp-input>`);
        type(el, "1234");
        await settle();
        expect(onComplete).toHaveBeenCalledWith("1234", expect.anything());
        expect(el.dataset.status).toBe("verifying");
        expect(el.querySelector("[aria-live]")!.textContent).toBe("Verifying code");
        reject();
        await wait(0);
        await settle();
        expect(el.dataset.status).toBe("error");
        await expect.poll(() => inputOf(el).value, { timeout: 3000 }).toBe("");
        await settle();
        type(el, "5");
        await settle();
        expect(el.dataset.status).toBe("idle");
        type(el, "5678");
        await settle();
        expect(signal.aborted).toBe(false);
        el.remove();
        expect(signal.aborted).toBe(true);
      });

      test("a resolved check folds into the success pill", async () => {
        const el = await fixture<TcOtpInput>(html`<tc-otp-input look=${look} length="4" success-label="Phone verified" .onComplete=${() => Promise.resolve()}></tc-otp-input>`);
        type(el, "1234");
        await wait(0);
        await settle();
        expect(el.dataset.status).toBe("success");
        expect(el.querySelector(".ui-otp__pill-inner")!.textContent).toContain("Phone verified");
        expect(el.querySelector("[aria-live]")!.textContent).toBe("Phone verified");
      });

      test("counts down without re-rendering, then offers Resend code and starts over", async () => {
        const el = await fixture<TcOtpInput>(html`<tc-otp-input look=${look} resendable resend-in="3"></tc-otp-input>`);
        const resent = vi.fn();
        el.addEventListener("tc-resend", resent);
        const time = () => el.querySelector(".ui-otp__time")?.textContent;
        expect(time()).toBe("0:03");
        let updates = 0;
        const update = el["update"].bind(el);
        (el as unknown as { update: (c: unknown) => void }).update = (c) => {
          updates++;
          update(c as never);
        };
        await expect.poll(time, { timeout: 3000 }).toBe("0:02");
        expect(updates).toBe(0);
        await expect.poll(() => el.querySelector("[aria-live]")!.textContent, { timeout: 5000 }).toBe("You can resend the code now");
        await settle();
        const button = [...el.querySelectorAll("button")].find((b) => b.textContent === "Resend code")!;
        button.click();
        await settle();
        expect(resent).toHaveBeenCalledTimes(1);
        expect(time()).toBe("0:03");
        expect(el.querySelector("[aria-live]")!.textContent).toBe("A new code is on its way");
        await expect.poll(time, { timeout: 3000 }).toBe("0:02");
      });

      test("labelledBy names the field by a visible label, plus the digit count (2.5.3, 3.3.2)", async () => {
        const wrap = await fixture(html`<div><h2 id="otp-title">Check your phone</h2><tc-otp-input look=${look} labelled-by="otp-title"></tc-otp-input></div>`);
        const input = inputOf(wrap);
        expect(input.hasAttribute("aria-label")).toBe(false);
        const ids = input.getAttribute("aria-labelledby")!.split(" ");
        expect(ids[0]).toBe("otp-title");
        expect(document.getElementById(ids[1])!.textContent).toBe("6 digits");
      });

      test("a second identical error is announced again (4.1.3)", async () => {
        const el = await fixture<TcOtpInput>(html`<tc-otp-input look=${look} value="123456" clear-on-error="false"></tc-otp-input>`);
        const live = el.querySelector("[aria-live]")!;
        el.status = "error";
        await settle();
        const first = live.textContent!;
        // Retyped and checked again without a "Verifying" step in between: the same text would be no change
        el.status = "idle";
        await settle();
        el.status = "error";
        await settle();
        expect(live.textContent!.trim()).toBe(first.trim());
        expect(live.textContent).not.toBe(first);
        expect(inputOf(el).value).toBe("123456");
      });

      test("arrow keys, Home and End move the active box; it never goes past the first empty one", async () => {
        const el = await fixture<TcOtpInput>(html`<tc-otp-input look=${look} value="123"></tc-otp-input>`);
        const input = inputOf(el);
        input.focus();
        await settle();
        const key = async (k: string) => {
          input.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
          await settle();
          return [input.selectionStart, input.selectionEnd];
        };
        expect(await key("Home")).toEqual([0, 1]);
        expect(await key("ArrowRight")).toEqual([1, 2]);
        expect(await key("End")).toEqual([3, 3]);
        expect(await key("ArrowRight")).toEqual([3, 3]);
        expect(await key("ArrowLeft")).toEqual([2, 3]);
      });

      test("a pasted code fills the boxes (spaces and dashes fall away)", async ({ skip }) => {
        // Firefox ignores clipboardData on synthetic paste events
        if (navigator.userAgent.includes("Firefox")) skip();
        const el = await fixture<TcOtpInput>(html`<tc-otp-input look=${look}></tc-otp-input>`);
        const data = new DataTransfer();
        data.setData("text", "482 913");
        inputOf(el).dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
        await settle();
        expect(el.value).toBe("482913");
        expect(el.querySelectorAll(".ui-otp__box[data-filled]")).toHaveLength(6);
      });
    });
  }

  test("focus stays visible while verifying, boxes have a ≥3:1 field edge, one breakpoint for both looks (2.4.7, 1.4.11)", () => {
    const css = TcOtpInput.css;
    expect(css).toMatch(/\[data-status="verifying"\][^{]*\.ui-otp__slots:has\(\.ui-otp__input:focus-visible\)\s*\{\s*outline:/);
    expect(css).toMatch(/\.ui-otp__box \{[^}]*box-shadow: var\(--tc-field-shadow/);
    expect(css).not.toContain("max-width: 340px");
    // The caret stops blinking after a few cycles (2.2.2)
    expect(css).not.toMatch(/ui-otp-blink[^;]*infinite/);
  });

  test("forms: submits the code under its name, required blocks an empty submit, reset restores", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><tc-otp-input name="code" required value="4821" length="4"></tc-otp-input></form>`);
    const el = form.querySelector<TcOtpInput>("tc-otp-input")!;
    expect(new FormData(form).get("code")).toBe("4821");
    expect([...new FormData(form).keys()]).toEqual(["code"]);
    expect(inputOf(el).required).toBe(true);
    expect(form.checkValidity()).toBe(true);
    type(el, "");
    await settle();
    expect(new FormData(form).get("code")).toBe("");
    expect(form.checkValidity()).toBe(false);
    expect(el.matches(":invalid")).toBe(true);
    form.reset();
    await settle();
    expect(el.value).toBe("4821");
    expect(inputOf(el).value).toBe("4821");
    expect(new FormData(form).get("code")).toBe("4821");
  });

  test("forms: a disabled fieldset disables it and leaves it out of the form data", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset disabled><tc-otp-input name="code" value="12"></tc-otp-input></fieldset></form>`);
    const el = form.querySelector<TcOtpInput>("tc-otp-input")!;
    await settle();
    expect(inputOf(el).disabled).toBe(true);
    expect(el.hasAttribute("data-disabled")).toBe(true);
    expect(new FormData(form).has("code")).toBe(false);
    form.querySelector("fieldset")!.disabled = false;
    await settle();
    expect(inputOf(el).disabled).toBe(false);
    expect(new FormData(form).get("code")).toBe("12");
  });

  test("a page <label for> names the input, and clicking it focuses the input", async () => {
    const wrap = await fixture(html`<div><label for="otp">Check your phone</label><tc-otp-input id="otp"></tc-otp-input></div>`);
    const el = wrap.querySelector<TcOtpInput>("tc-otp-input")!;
    await settle();
    const input = inputOf(el);
    const ids = input.getAttribute("aria-labelledby")!.split(" ");
    expect(document.getElementById(ids[0])!.textContent).toBe("Check your phone");
    expect(document.getElementById(ids[1])!.textContent).toBe("6 digits");
    expect(input.hasAttribute("aria-label")).toBe(false);
    wrap.querySelector("label")!.click();
    expect(document.activeElement).toBe(input);
    const result = await axe.run(wrap, { runOnly: ["label", "aria-input-field-name"] });
    expect(result.violations).toEqual([]);
  });

  test("aria attributes on the host move to the input", async () => {
    const el = await fixture<TcOtpInput>(html`<tc-otp-input aria-describedby="hint"></tc-otp-input>`);
    expect(el.hasAttribute("aria-describedby")).toBe(false);
    expect(inputOf(el).getAttribute("aria-describedby")).toBe("hint");
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-otp-input separator resendable value="12"></tc-otp-input>
      <tc-otp-input look="clean" align="center" resendable label="Clean code"></tc-otp-input>
    </div>`);
    document.getAnimations().forEach((a) => a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
