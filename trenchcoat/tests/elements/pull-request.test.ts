/*
 * <tc-pull-request> in real browsers: the summary in words, the button each state calls for, why Merge waits, the
 * switch and method with their cancelable events, the empty state, the React wrapper and axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/pull-request";
import type { TcPullRequest } from "../../src/elements/pull-request";
import { PullRequest } from "../../src/elements/react/pull-request";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 2, 15, 0);
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcPullRequest>(html`<tc-pull-request
    look=${look}
    number="128"
    pr-title="Add the booking calendar"
    state="open"
    head="feature/booking-calendar"
    base="main"
    author="r.okafor"
    mergeable="clean"
    additions="412"
    deletions="57"
    files="9"
    review="approved"
    .reviewers=${[{ name: "m.lindqvist", state: "approved" }]}
    .checks=${{ passing: 5, failing: 0, pending: 1, skipped: 1 }}
    .updatedAt=${NOW - 42 * 60_000}
    .now=${NOW}
  ></tc-pull-request>`);
const text = (el: Element, sel: string) => el.querySelector(sel)?.textContent?.replace(/\s+/g, " ").trim();

describe("tc-pull-request", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the summary in words`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("prq");
      expect(el.dataset.look).toBe(look);
      expect(text(el, ".ui-prq__state")).toBe("Open");
      expect(text(el, ".ui-prq__title")).toBe("Add the booking calendar #128");
      expect(text(el, ".ui-prq__branches")).toBe("feature/booking-calendar→ into main");
      expect(text(el, ".ui-prq__lines")).toContain("412 lines added");
      expect(text(el, ".ui-prq__by")).toBe("r.okafor · 42 min. ago");
      expect(text(el, ".ui-prq__review")).toBe("Approved by m.lindqvist");
      expect(text(el, ".ui-prq__checks .ui-prq__value")).toBe("5 of 6 passed, 1 pending");
      expect(el.querySelectorAll(".ui-prq__seg")).toHaveLength(3);
      expect(text(el, ".ui-prq__mergeable")).toBe("No conflicts with the base branch");
      const merge = el.querySelector<HTMLButtonElement>(".ui-prq__primary")!;
      expect(merge.textContent).toBe("Merge");
      expect(merge.disabled).toBe(false);
    });
  }

  test("Merge waits, with a reason, on conflicts, rules, unknown and failing checks", async () => {
    const el = await make();
    const merge = () => el.querySelector<HTMLButtonElement>(".ui-prq__primary")!;
    for (const [mergeable, reason] of [
      ["conflicts", "Conflicts with the base branch"],
      ["blocked", "Blocked by the branch's rules"],
      ["unknown", "Checking whether it can merge"],
    ] as const) {
      el.mergeable = mergeable;
      await settle();
      expect(merge().disabled).toBe(true);
      expect(text(el, ".ui-prq__reason")).toBe(reason);
      expect(document.getElementById(merge().getAttribute("aria-describedby")!)!.textContent).toBe(reason);
    }
    el.mergeable = "clean";
    el.checks = { passing: 4, failing: 1, pending: 0, skipped: 0 };
    await settle();
    expect(merge().disabled).toBe(true);
    expect(text(el, ".ui-prq__reason")).toBe("Fix the failing checks to merge");
    el.checks = undefined;
    await settle();
    expect(merge().disabled).toBe(false);
    expect(el.querySelector(".ui-prq__checks")).toBeNull();
  });

  test("each state draws its own button; behind and conflicts offer their fix", async () => {
    const el = await make();
    const seen: string[] = [];
    for (const name of ["tc-merge", "tc-ready", "tc-update-branch", "tc-resolve", "tc-checks"]) el.addEventListener(name, (e) => seen.push(`${name} ${JSON.stringify((e as CustomEvent).detail)}`));
    el.querySelector<HTMLElement>(".ui-prq__primary")!.click();
    el.querySelector<HTMLElement>(".ui-prq__checks")!.click();
    el.mergeable = "behind";
    await settle();
    el.querySelector<HTMLElement>(".ui-prq__update")!.click();
    el.mergeable = "conflicts";
    await settle();
    el.querySelector<HTMLElement>(".ui-prq__resolve")!.click();
    el.state = "draft";
    await settle();
    expect(el.querySelector(".ui-prq__primary")!.textContent).toBe("Mark ready");
    expect(el.querySelector("tc-switch")).toBeNull();
    el.querySelector<HTMLElement>(".ui-prq__primary")!.click();
    expect(seen).toEqual([
      'tc-merge {"number":128,"method":"merge"}',
      'tc-checks {"number":128}',
      'tc-update-branch {"number":128}',
      'tc-resolve {"number":128}',
      'tc-ready {"number":128}',
    ]);
    await expect.poll(() => el.querySelector('[role="status"]')!.textContent).toBe("Marking ready for review");
    for (const state of ["merged", "closed"] as const) {
      el.state = state;
      await settle();
      expect(el.querySelector(".ui-prq__foot")).toBeNull();
      expect(el.querySelector(".ui-prq__mergeable")).toBeNull();
    }
  });

  test("auto-merge and the method change unless prevented", async () => {
    const el = await make();
    const input = () => el.querySelector<HTMLInputElement>("tc-switch input")!;
    let block = true;
    const seen: unknown[] = [];
    el.addEventListener("tc-auto-merge-change", (e) => {
      seen.push((e as CustomEvent).detail);
      if (block) e.preventDefault();
    });
    input().click();
    await settle();
    expect(el.autoMerge).toBe(false);
    block = false;
    input().click();
    await settle();
    expect(el.autoMerge).toBe(true);
    expect(seen).toEqual([
      { autoMerge: true, method: "merge" },
      { autoMerge: true, method: "merge" },
    ]);

    const select = el.querySelector<HTMLSelectElement>(".ui-prq__method")!;
    el.addEventListener("tc-merge-method-change", (e) => {
      if ((e as CustomEvent).detail.mergeMethod === "rebase") e.preventDefault();
    });
    select.value = "rebase";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.mergeMethod).toBe("merge");
    expect(select.value).toBe("merge");
    select.value = "squash";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.mergeMethod).toBe("squash");
    el.mergeMethods = ["squash"];
    await settle();
    expect(el.querySelector(".ui-prq__method")).toBeNull();
  });

  test("the title is a link unless tc-open is prevented; busy holds the buttons", async () => {
    const el = await make();
    el.url = "https://example.org/pr/128";
    await settle();
    const a = el.querySelector<HTMLAnchorElement>("a.ui-prq__title")!;
    expect(a.href).toBe("https://example.org/pr/128");
    el.addEventListener("tc-open", (e) => e.preventDefault());
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    a.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    el.busy = true;
    await settle();
    expect(el.querySelector<HTMLButtonElement>(".ui-prq__primary")!.disabled).toBe(true);
    expect(el.querySelector(".ui-prq__card")!.getAttribute("aria-busy")).toBe("true");
  });

  test("with no pull request it offers to create one; words can be renamed", async () => {
    const el = await fixture<TcPullRequest>(html`<tc-pull-request .labels=${{ empty: "Nothing yet" }}></tc-pull-request>`);
    expect(text(el, ".ui-prq__empty-text")).toBe("Nothing yet");
    let created = 0;
    el.addEventListener("tc-create", () => created++);
    el.querySelector<HTMLElement>(".ui-prq__create")!.click();
    expect(created).toBe(1);
  });

  test("reviews read with who, and requested names who was asked", async () => {
    const el = await make();
    el.review = "requested";
    el.reviewers = [
      { name: "a.berg", state: "requested" },
      { name: "s.haddad", state: "requested" },
    ];
    await settle();
    expect(text(el, ".ui-prq__review")).toBe("Review requested from a.berg and s.haddad");
    el.review = "none";
    await settle();
    expect(text(el, ".ui-prq__review")).toBe("No reviews");
  });

  test("React: the title is the heading; auto-merge is controlled when given", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const seen: boolean[] = [];
    const props = { prTitle: "Add the calendar", number: 7, state: "open" as const, mergeable: "clean" as const, now: NOW };
    await act(async () => root.render(React.createElement(PullRequest, { ...props, title: "This branch", autoMerge: false, onAutoMergeChange: (v) => void seen.push(v) })));
    const el = wrap.querySelector<TcPullRequest>("tc-pull-request")!;
    await settle();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("This branch");
    el.querySelector<HTMLInputElement>("tc-switch input")!.click();
    await settle();
    expect(seen).toEqual([true]);
    expect(el.autoMerge).toBe(false);
    await act(async () => root.unmount());
    // Uncontrolled, it keeps its own value across re-renders
    const root2 = createRoot(wrap);
    await act(async () => root2.render(React.createElement(PullRequest, { ...props, defaultMergeMethod: "squash" })));
    await act(async () => root2.render(React.createElement(PullRequest, { ...props, defaultMergeMethod: "squash", additions: 3 })));
    const el2 = wrap.querySelector<TcPullRequest>("tc-pull-request")!;
    await settle();
    const select = el2.querySelector<HTMLSelectElement>(".ui-prq__method")!;
    expect(select.value).toBe("squash");
    select.value = "rebase";
    await act(async () => void select.dispatchEvent(new Event("change", { bubbles: true })));
    await act(async () => root2.render(React.createElement(PullRequest, { ...props, defaultMergeMethod: "squash", additions: 4 })));
    expect(el2.mergeMethod).toBe("rebase");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}; width: 380px`;
      wrap.innerHTML = `<tc-pull-request look="standard"></tc-pull-request><tc-pull-request look="clean"></tc-pull-request><tc-pull-request look="clean" state="draft"></tc-pull-request><tc-pull-request look="standard" heading="Empty"></tc-pull-request>`;
      const els = [...wrap.querySelectorAll<TcPullRequest>("tc-pull-request")];
      els.slice(0, 3).forEach((el, i) => {
        Object.assign(el, { number: 128 + i, prTitle: "Add the booking calendar", head: "feature/booking-calendar", base: "main", url: "https://example.org/pr", author: "r.okafor", updatedAt: NOW, now: NOW, additions: 4, deletions: 2, files: 1, review: "changes", reviewers: [{ name: "m.lindqvist", state: "changes" }] });
        el.checks = { passing: 2, failing: i, pending: 1, skipped: 0 };
        el.mergeable = i === 1 ? "behind" : "conflicts";
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

describe("tc-pull-request – unsafe links, words and dates", () => {
  test("a javascript: url is never put in the href, and tc-open doesn't pass it on", async () => {
    const el = await fixture<TcPullRequest>(html`<tc-pull-request number="1" pr-title="T" state="open" .url=${"javascript:opener&&(opener.__prq=1)"}></tc-pull-request>`);
    expect(el.querySelector("a.ui-prq__title")).toBeNull();
    const seen: unknown[] = [];
    el.addEventListener("tc-open", (e) => seen.push((e as CustomEvent).detail));
    el.querySelector<HTMLElement>(".ui-prq__title")!.click();
    expect(seen).toEqual([{ number: 1, url: undefined }]);
    el.url = "https://code.example/pr/1";
    await settle();
    expect(el.querySelector("a.ui-prq__title")!.getAttribute("href")).toBe("https://code.example/pr/1");
  });

  test("the words come from labels and the locale; a date from another year says the year", async () => {
    const el = await fixture<TcPullRequest>(
      html`<tc-pull-request
        locale="de"
        number="1"
        pr-title="T"
        state="open"
        .updatedAt=${NOW - 1000}
        .now=${NOW}
        .files=${2}
        .checks=${{ passing: 1, failing: 1, pending: 0, skipped: 0 }}
        .labels=${{ checksPassed: "{passed} von {total} bestanden", checksFailed: "{count} fehlgeschlagen", files: "{count} Dateien" }}
      ></tc-pull-request>`,
    );
    const all = el.textContent!.replace(/\s+/g, " ");
    expect(all).not.toContain("just now");
    expect(all).toContain(new Intl.RelativeTimeFormat("de", { numeric: "auto", style: "short" }).format(0, "second"));
    expect(all).toContain("1 von 2 bestanden, 1 fehlgeschlagen");
    expect(all).toContain("2 Dateien");
    el.updatedAt = NOW - 400 * 24 * 60 * 60_000;
    await settle();
    expect(el.textContent).toContain(String(new Date(NOW - 400 * 24 * 60 * 60_000).getFullYear()));
  });
});
