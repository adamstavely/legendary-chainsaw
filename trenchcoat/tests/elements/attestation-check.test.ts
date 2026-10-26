/*
 * <tc-attestation-check> in real browsers: the host and both looks, a hash checked (validation, events, the result
 * card), a file picked or dropped (handed to verify as a File, nothing else), a verify that throws, controlled use,
 * focus, Check another, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/attestation-check";
import type { AttestationResult, TcAttestationCheck } from "../../src/elements/attestation-check";
import { AttestationCheck } from "../../src/elements/react/attestation-check";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const HASH = "sha256:9f2c41ab07e3d5c88e1f6a2b4c7d90e3f1a2b3c4d5e6f708192a3b4c5d1c51d08aa";
const VALID: AttestationResult = {
  valid: true,
  name: "risk.evidence",
  hash: HASH,
  signer: "Release key",
  signedAt: "24 Oct 2026",
  signature: { ok: true, detail: "Ed25519 matches" },
  chain: { ok: true, detail: "42 of 42 links intact" },
  coverage: { ok: true, items: ["Manifest", "14 chunks"] },
};
const INVALID: AttestationResult = {
  valid: false,
  signature: { ok: true },
  chain: { ok: false, detail: "Link 17 doesn't match" },
  reasons: ["A record changed after signing."],
};
const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const make = (verify?: (input: string | File) => AttestationResult | Promise<AttestationResult>, look = "standard") =>
  fixture<TcAttestationCheck>(html`<tc-attestation-check look=${look} .verify=${verify}></tc-attestation-check>`);
const typeHash = async (el: Element, value: string) => {
  const input = el.querySelector<HTMLInputElement>(".ui-atc__field input")!;
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await settle();
  el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
  await settle();
};
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);

describe("tc-attestation-check", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading; the idle form`, async () => {
      const el = await make(() => VALID, look);
      expect(el.dataset.ui).toBe("atc");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Verify an evidence package");
      const area = el.querySelector<HTMLButtonElement>(".ui-atc__area")!;
      expect(document.getElementById(area.getAttribute("aria-describedby")!)!.textContent).toBe("Checked in this browser – the file isn't uploaded");
      const field = el.querySelector<HTMLInputElement>(".ui-atc__field input")!;
      expect((field.labels?.[0]?.textContent ?? "").trim()).toBe("Package hash");
    });
  }

  test("without verify the form is disabled", async () => {
    const el = await make();
    expect(el.querySelector<HTMLButtonElement>(".ui-atc__area")!.disabled).toBe(true);
    expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
  });

  test("a hash is validated before it's checked", async () => {
    const calls: unknown[] = [];
    const el = await make((i) => (calls.push(i), VALID));
    await typeHash(el, "");
    expect(el.querySelector(".ui-atc__error")!.textContent).toBe("Paste a package hash");
    await typeHash(el, "not a hash");
    const input = el.querySelector<HTMLInputElement>(".ui-atc__field input")!;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(input.getAttribute("aria-describedby")!)!.textContent).toContain("doesn't look like a hash");
    expect(calls).toEqual([]);
    el.hashPattern = /^x+$/;
    await typeHash(el, "xxx");
    expect(calls).toEqual(["xxx"]);
  });

  test("a valid hash: tc-verify, a checking state, then a cancelable tc-result-change and the result card", async () => {
    let release: (r: AttestationResult) => void = () => {};
    const el = await make(() => new Promise<AttestationResult>((r) => (release = r)));
    const log: string[] = [];
    el.addEventListener("tc-verify", (e) => log.push(`verify:${(e as CustomEvent).detail.input.kind}:${(e as CustomEvent).detail.input.hash}`));
    el.addEventListener("tc-result-change", (e) => log.push(`result:${(e as CustomEvent).detail.result?.valid}:${(e as CustomEvent).detail.input.kind}`));
    el.querySelector<HTMLInputElement>(".ui-atc__field input")!.focus();
    await typeHash(el, HASH);
    expect(el.querySelector(".ui-atc__checking")!.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector(".ui-atc__checking-what")!.textContent).toBe("sha256:9f2c41ab…c51d08aa");
    release(VALID);
    await settle();
    await settle();
    expect(log).toEqual([`verify:hash:${HASH}`, "result:true:hash"]);
    expect(el.result).toBe(VALID);
    const card = el.querySelector(".ui-atc__result")!;
    expect(card.getAttribute("data-valid")).toBe("true");
    expect(plain(card.querySelector(".ui-atc__verdict")!.textContent)).toBe("Valid – the package is intact and signed risk.evidence");
    expect([...card.querySelectorAll(".ui-atc__fact dt")].map((d) => d.textContent)).toEqual(["Hash", "Signed by", "Signed"]);
    expect(card.querySelector(".ui-atc__hash-value")!.textContent).toBe("sha256:9f2c41ab…c51d08aa");
    expect([...card.querySelectorAll(".ui-atc__check")].map((c) => c.getAttribute("data-status"))).toEqual(["pass", "pass", "pass"]);
    expect([...card.querySelectorAll(".ui-atc__item")].map((c) => c.textContent)).toEqual(["Manifest", "14 chunks"]);
    // Focus moves to the verdict; screen readers hear it
    expect(document.activeElement).toBe(card.querySelector(".ui-atc__verdict"));
    expect(status(el)).toBe("Valid: the package is intact and signed.");
  });

  test("an invalid result: failed checks, a check not run, and the reasons", async () => {
    const el = await make(() => INVALID);
    await typeHash(el, HASH);
    await settle();
    const checks = [...el.querySelectorAll(".ui-atc__check")];
    expect(checks.map((c) => c.getAttribute("data-status"))).toEqual(["pass", "fail", "skip"]);
    expect(plain(checks[1].textContent)).toBe("Chain integrity: failed Link 17 doesn't match");
    expect(plain(checks[2].textContent)).toBe("Coverage: not checked Not checked");
    expect(plain(el.querySelector(".ui-atc__verdict")!.textContent)).toBe("Invalid – don't rely on this package");
    expect([...el.querySelectorAll(".ui-atc__reasons li")].map((l) => l.textContent)).toEqual(["A record changed after signing."]);
    expect(status(el)).toBe("Invalid: chain integrity failed.");
  });

  test("a picked or dropped file goes to verify as a File, and only there", async () => {
    const seen: unknown[] = [];
    const el = await make((input) => (seen.push(input), VALID));
    const file = new File(["{}"], "pack.evidence", { type: "application/json" });
    const picker = el.querySelector<HTMLInputElement>(".ui-atc__file")!;
    const dt = new DataTransfer();
    dt.items.add(file);
    picker.files = dt.files;
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    await settle();
    expect(seen[0]).toBeInstanceOf(File);
    expect((seen[0] as File).name).toBe("pack.evidence");
    el.querySelector<HTMLButtonElement>(".ui-atc__again")!.click();
    await settle();
    const area = el.querySelector<HTMLButtonElement>(".ui-atc__area")!;
    expect(document.activeElement).toBe(area);
    area.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: dt }));
    await settle();
    expect(area.hasAttribute("data-dragging")).toBe(true);
    expect(area.textContent).toContain("Release to check the package");
    const dropped = new DataTransfer();
    dropped.items.add(file);
    area.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dropped }));
    await settle();
    await settle();
    expect(seen.length).toBe(2);
    expect((seen[1] as File).name).toBe("pack.evidence");
  });

  test("a verify that throws: Couldn't check, Try again runs it again", async () => {
    let fail = true;
    const el = await make(() => {
      if (fail) throw new Error("The key server is offline");
      return VALID;
    });
    await typeHash(el, HASH);
    await settle();
    const alert = el.querySelector('[role="alert"]')!;
    expect(plain(alert.querySelector(".ui-atc__problem-text")!.textContent)).toBe("Couldn't check this package. The key server is offline");
    fail = false;
    alert.querySelector<HTMLButtonElement>(".ui-atc__btn")!.click();
    await settle();
    await settle();
    expect(el.result).toBe(VALID);
  });

  test("controlled: preventDefault() keeps the result as it is; result can be set from outside", async () => {
    const el = await make(() => VALID);
    el.addEventListener("tc-result-change", (e) => e.preventDefault());
    await typeHash(el, HASH);
    await settle();
    expect(el.result).toBeNull();
    expect(el.querySelector(".ui-atc__result")).toBeNull();
    el.result = INVALID;
    await settle();
    expect(el.querySelector(".ui-atc__result")!.getAttribute("data-valid")).toBe("false");
  });

  test("Check another clears the result and the field; copy says it copied", async () => {
    const el = await make(() => VALID);
    await typeHash(el, HASH);
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-atc__again")!.click();
    await settle();
    expect(el.result).toBeNull();
    expect(el.querySelector<HTMLInputElement>(".ui-atc__field input")!.value).toBe("");
    expect(el.querySelector(".ui-atc__copy")).toBeNull();
  });

  test("hint, placeholder and accept are properties", async () => {
    const el = await make(() => VALID);
    el.hint = "Stays on this device";
    el.placeholder = "Hash";
    el.accept = [".json"];
    await settle();
    expect(el.querySelector(".ui-atc__hint")!.textContent).toBe("Stays on this device");
    expect(el.querySelector<HTMLInputElement>(".ui-atc__field input")!.placeholder).toBe("Hash");
    expect(el.querySelector<HTMLInputElement>(".ui-atc__file")!.accept).toBe(".json");
  });

  test("the wrapper: uncontrolled result survives a parent re-render; callbacks fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(AttestationCheck, {
        title: `Check ${n}`,
        verify: () => VALID,
        onVerifyStart: (i) => calls.push(`start:${i.kind}`),
        onResultChange: (r, i) => calls.push(`result:${r?.valid}:${i?.kind}`),
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-attestation-check")!;
    await act(async () => typeHash(el, HASH));
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector(".ui-atc__title")!.textContent).toBe("Check 1");
    expect(el.result).toEqual(VALID);
    expect(calls).toEqual(["start:hash", "result:true:hash"]);
    await act(async () => root.unmount());
  });

  test("the wrapper: controlled result", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    await act(async () => root.render(React.createElement(AttestationCheck, { verify: () => VALID, result: null, onResultChange: (r) => calls.push(String(r?.valid)) })));
    await settle();
    const el = host.querySelector("tc-attestation-check")!;
    await act(async () => typeHash(el, HASH));
    await act(async () => settle());
    expect(calls).toEqual(["true"]);
    expect(el.result).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-attestation-check heading="Idle" .verify=${() => VALID}></tc-attestation-check>
        <tc-attestation-check look="clean" heading="Clean idle" .verify=${() => VALID}></tc-attestation-check>
        <tc-attestation-check heading="Valid" .verify=${() => VALID} .result=${VALID}></tc-attestation-check>
        <tc-attestation-check look="clean" heading="Invalid" .verify=${() => VALID} .result=${INVALID}></tc-attestation-check>
      </div>`);
      await typeHash(wrap.querySelector("tc-attestation-check")!, "nope");
      await wait(600);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
