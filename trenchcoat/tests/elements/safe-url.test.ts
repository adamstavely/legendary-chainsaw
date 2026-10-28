/*
 * Links and media sources from data: safeUrl keeps http(s), mailto, tel and relative links and refuses script schemes
 * and links that browsers read as another site; safeMediaUrl also keeps inline data: images and blob: previews. Then a
 * few elements, proving a javascript: link in their data never reaches the page as a link.
 */
import { html } from "lit";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/status-tracker";
import "../../src/elements/entity-timeline";
import "../../src/elements/citation-badge";
import "../../src/elements/guardrail-notice";
import "../../src/elements/person-links";
import { safeMediaUrl } from "../../src/elements/internal/safe-media";
import { safeUrl } from "../../src/elements/internal/safe-url";
import { cleanup, fixture } from "./helpers";

afterEach(cleanup);

const BAD = ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "java\tscript:alert(1)", "java\nscript:alert(1)", "\u0001javascript:alert(1)", "vbscript:x", "data:text/html,<script>alert(1)</script>", "//evil.example/x", "/\\evil.example/x", "\\\\evil.example", "1x:y", "", "   "];

describe("safeUrl", () => {
  test("keeps http(s), mailto, tel and relative links, trimmed", () => {
    for (const ok of ["https://a.example/x?y#z", "http://a.example", "mailto:a@b.example", "tel:+441234", "/path", "./a", "../a", "a/b", "#top", "?q=1"]) expect(safeUrl(ok)).toBe(ok);
    expect(safeUrl("  https://a.example  ")).toBe("https://a.example");
  });
  test("refuses script schemes, other schemes, protocol-relative and backslash links, and non-strings", () => {
    for (const bad of BAD) expect(safeUrl(bad), JSON.stringify(bad)).toBeUndefined();
    for (const bad of [undefined, null, 1, {}, ["https://a"]]) expect(safeUrl(bad)).toBeUndefined();
  });
});

describe("safeMediaUrl", () => {
  test("also keeps data: images and blob: URLs, but not data: documents or script", () => {
    expect(safeMediaUrl("data:image/png;base64,iVBORw0KGgo=")).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(safeMediaUrl("data:image/svg+xml,%3Csvg%3E")).toBe("data:image/svg+xml,%3Csvg%3E");
    expect(safeMediaUrl("blob:https://a.example/1234")).toBe("blob:https://a.example/1234");
    expect(safeMediaUrl("https://a.example/a.png")).toBe("https://a.example/a.png");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.example/a.png"]) expect(safeMediaUrl(bad)).toBeUndefined();
  });
});

describe("elements never render a javascript: link from their data", () => {
  const js = "javascript:alert(1)";
  const noScriptLinks = (el: Element) => [...el.querySelectorAll("[href], [src]")].filter((n) => /script:/i.test(n.getAttribute("href") ?? n.getAttribute("src") ?? ""));

  test("status-tracker record links", async () => {
    const el = await fixture(html`<tc-status-tracker
      .selected=${"a"}
      .steps=${[{ id: "a", label: "Intake", status: "cleared", detail: { items: [{ label: "Ticket", value: "T-1", href: js }, { label: "Doc", value: "D-1", href: "/docs/1" }] } }]}
    ></tc-status-tracker>`);
    expect(noScriptLinks(el)).toEqual([]);
    expect(el.querySelector('a[href="/docs/1"]')).toBeTruthy();
    expect(el.textContent).toContain("T-1");
  });

  test("entity-timeline links", async () => {
    const el = await fixture(html`<tc-entity-timeline
      .selected=${"e"}
      .events=${[{ id: "e", date: Date.UTC(2026, 0, 1), title: "Filed", links: [{ label: "Bad", href: js }, { label: "Good", href: "https://a.example" }] }]}
    ></tc-entity-timeline>`);
    expect(noScriptLinks(el)).toEqual([]);
    expect(el.textContent).toContain("Bad");
    expect(el.querySelector('a[href="https://a.example"]')).toBeTruthy();
  });

  test("citation-badge, guardrail-notice and person-links", async () => {
    const badge = await fixture(html`<tc-citation-badge label="Smith 2024" href=${js}></tc-citation-badge>`);
    expect(noScriptLinks(badge)).toEqual([]);
    const notice = await fixture(html`<tc-guardrail-notice policy="Data policy" policy-href=${js}></tc-guardrail-notice>`);
    expect(noScriptLinks(notice)).toEqual([]);
    expect(notice.textContent).toContain("Data policy");
    const people = await fixture(html`<tc-person-links .people=${[{ id: "p", name: "Ana Ruiz", picture: js }]}></tc-person-links>`);
    expect(noScriptLinks(people)).toEqual([]);
  });
});
