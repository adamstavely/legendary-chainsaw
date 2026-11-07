/*
 * <tc-header-brand> in real browsers: name and logo, a cancelable tc-navigate, plain text without a link, unsafe links
 * dropped, a large name never clipped, inverse, and axe. Kept light – one fixture per test.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/header-brand";
import type { TcHeaderBrand } from "../../src/elements/header-brand";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const logo = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("data-logo", "");
  svg.innerHTML = '<rect width="24" height="24"></rect>';
  return svg;
};
const click = (el: Element, init: MouseEventInit = {}) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init }));

describe("tc-header-brand", () => {
  for (const look of ["standard", "clean"] as const)
    test(`${look}: renders the name and a cloned logo inside a link`, async () => {
      const icon = logo();
      const el = await fixture<TcHeaderBrand>(html`<tc-header-brand look=${look} name="Intellect" href="/home" .icon=${icon}></tc-header-brand>`);
      expect(el.dataset.ui).toBe("hb");
      expect(el.dataset.look).toBe(look);
      const link = el.querySelector("a.ui-hb__brand")!;
      expect(link.getAttribute("href")).toBe("/home");
      expect(link.textContent!.trim()).toBe("Intellect");
      expect(link.querySelector(".ui-hb__logo[aria-hidden='true'] svg[data-logo]")).toBeTruthy();
      expect(icon.isConnected).toBe(false);
    });

  test("a click fires a cancelable tc-navigate; prevented, the link isn't followed", async () => {
    const hrefs: string[] = [];
    const el = await fixture<TcHeaderBrand>(html`<tc-header-brand name="Intellect" href="#home" @tc-navigate=${(e: CustomEvent<{ href: string }>) => (hrefs.push(e.detail.href), e.preventDefault())}></tc-header-brand>`);
    const link = el.querySelector("a")!;
    const followed = click(link);
    expect(hrefs).toEqual(["#home"]);
    expect(followed).toBe(false);
    // A modifier click is left to the browser
    click(link, { metaKey: true });
    expect(hrefs).toHaveLength(1);
  });

  test("without href, or with an unsafe one, it's plain text", async () => {
    const el = await fixture<TcHeaderBrand>(html`<tc-header-brand name="Intellect"></tc-header-brand>`);
    expect(el.querySelector("a")).toBeNull();
    expect(el.querySelector("span.ui-hb__brand")!.textContent!.trim()).toBe("Intellect");
    el.href = "javascript:alert(1)";
    await settle();
    expect(el.querySelector("a")).toBeNull();
    el.href = "//evil.example";
    await settle();
    expect(el.querySelector("a")).toBeNull();
    el.href = "https://example.com/";
    await settle();
    expect(el.querySelector("a")!.getAttribute("href")).toBe("https://example.com/");
  });

  test("the page sizes it; a large name isn't clipped or cut short", async () => {
    const el = await fixture<TcHeaderBrand>(html`<tc-header-brand name="A rather long product name" href="/" .icon=${logo()}
      style="line-height: 16px; width: 120px; --tc-hb-name-size: 48px; --tc-hb-logo-size: 32px"></tc-header-brand>`);
    const name = el.querySelector<HTMLElement>(".ui-hb__name")!;
    expect(parseFloat(getComputedStyle(name).fontSize)).toBeCloseTo(48, 0);
    expect(parseFloat(getComputedStyle(name).lineHeight)).toBeCloseTo(48 * 1.1, 0);
    expect(name.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    expect(getComputedStyle(name).overflow).toBe("visible");
    expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth + 1);
    expect(el.querySelector(".ui-hb__logo")!.getBoundingClientRect().width).toBeCloseTo(32, 0);
  });

  test("inverse takes the dark theme's colours", async () => {
    const el = await fixture<TcHeaderBrand>(html`<tc-header-brand name="Intellect" inverse></tc-header-brand>`);
    expect(el.hasAttribute("inverse")).toBe(true);
    expect(getComputedStyle(el).colorScheme).toBe("dark");
  });

  test("axe: no violations, linked and plain, both looks", async () => {
    const wrap = await fixture(html`<div>
      <tc-header-brand name="Intellect" href="/" .icon=${logo()}></tc-header-brand>
      <tc-header-brand look="clean" name="Intellect" .icon=${logo()}></tc-header-brand>
      <div style="background: #16161a; padding: 8px"><tc-header-brand name="Intellect" href="/" inverse></tc-header-brand></div>
    </div>`);
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
