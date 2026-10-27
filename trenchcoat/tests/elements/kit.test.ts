import { LitElement } from "lit";
import { html } from "lit";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/index";
import { RequestController, type RequestState } from "../../src/elements/internal/controllers";
import { cleanup, fixture } from "./helpers";

afterEach(cleanup);

class RequestHost extends LitElement {
  readonly sender = new RequestController(this);
}
customElements.define("kit-request-host", RequestHost);

const deferred = () => {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<void>((y, n) => ((resolve = y), (reject = n)));
  return { promise, resolve, reject };
};

describe("shared helpers", () => {
  test("RequestController: pending then requested; pending then failed; requested at once without a sender", async () => {
    const host = document.body.appendChild(new RequestHost());
    const seen: RequestState[] = [];
    const ok = deferred();
    const run = host.sender.run(() => ok.promise, (s) => seen.push(s));
    expect(seen).toEqual(["pending"]);
    ok.resolve();
    await run;
    expect(seen).toEqual(["pending", "requested"]);

    const bad = deferred();
    const failed = host.sender.run(() => bad.promise, (s) => seen.push(s));
    bad.reject();
    await failed;
    expect(seen.slice(2)).toEqual(["pending", "failed"]);

    await host.sender.run(undefined, (s) => seen.push(s));
    expect(seen.at(-1)).toBe("requested");
  });

  test("RequestController: leaving the page aborts the signal and reports nothing more; a keyed rerun aborts the one before", async () => {
    const host = document.body.appendChild(new RequestHost());
    const seen: RequestState[] = [];
    let signal!: AbortSignal;
    const slow = deferred();
    const run = host.sender.run((s) => ((signal = s), slow.promise), (s) => seen.push(s));
    host.remove();
    expect(signal.aborted).toBe(true);
    slow.resolve();
    await run;
    expect(seen).toEqual(["pending"]);

    document.body.append(host);
    const first = deferred();
    const signals: AbortSignal[] = [];
    const a = host.sender.run((s) => (signals.push(s), first.promise), (s) => seen.push(`a:${s}` as RequestState), "k");
    const b = host.sender.run((s) => (signals.push(s), Promise.resolve()), (s) => seen.push(`b:${s}` as RequestState), "k");
    expect(signals[0].aborted).toBe(true);
    first.resolve();
    await Promise.all([a, b]);
    expect(seen.slice(1)).toEqual(["a:pending", "b:pending", "b:requested"]);
  });

  test("tc-sr-only hides visually but stays in the page; tc-btn-sm is the small control height", async () => {
    const wrap = await fixture(html`<div>
      <tc-evidence-coverage .sources=${[{ id: "a", label: "Filings", status: "none" }]}></tc-evidence-coverage>
    </div>`);
    const sr = wrap.querySelector<HTMLElement>(".tc-sr-only")!;
    expect(sr.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(getComputedStyle(sr).position).toBe("absolute");
    const btn = wrap.querySelector<HTMLElement>(".tc-btn-sm")!;
    const h = getComputedStyle(document.documentElement).getPropertyValue("--tc-control-h-sm").trim();
    expect(`${btn.getBoundingClientRect().height}px`).toBe(h);
  });
});
