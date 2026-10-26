/*
 * axe-core on every component's contract render (tests/contract/**), both looks for components. jsdom has no layout,
 * so this covers structure – roles, names, ARIA validity, nesting, labels – not contrast or target size; the
 * real-browser scan (scripts/a11y.mjs) covers those. Known failures are listed in tests/a11y-known.ts and must
 * shrink, never grow.
 */
import type { ComponentType } from "react";
import { render } from "@testing-library/react";
import axe from "axe-core";
import { writeFileSync } from "node:fs";
import { afterAll, describe, expect, test } from "vitest";
import type { ContractSpec } from "./contract.test";
import { KNOWN } from "./a11y-known";

const specs = import.meta.glob<{ spec: ContractSpec }>("./contract/**/*.contract.tsx", { eager: true });
const modules = import.meta.glob<Record<string, unknown>>("../{components,blocks,screens,illustrations,motion}/*.tsx");

// Rules jsdom can't evaluate (layout, colour) or that only make sense for a whole page
const OFF = ["color-contrast", "css-orientation-lock", "target-size", "region", "landmark-one-main", "page-has-heading-one", "bypass", "document-title", "html-has-lang", "scrollable-region-focusable"];

const files = Object.entries(specs).flatMap(([path, { spec }]) => {
  const slug = path.match(/contract\/(.+)\.contract\.tsx$/)![1];
  return slug.includes("/") ? [{ name: slug, file: `../${slug}.tsx`, spec }] : [{ name: slug, file: `../components/${slug}.tsx`, spec }, { name: `${slug}-clean`, file: `../components/${slug}-clean.tsx`, spec }];
});

// A11Y_DUMP=<file> records what fails now instead of checking – to (re)write tests/a11y-known.ts
const dump = process.env.A11Y_DUMP;
const failing: Record<string, string[]> = {};
afterAll(() => {
  if (dump) writeFileSync(dump, JSON.stringify(failing, null, 2));
});

describe("a11y (axe, structure rules)", () => {
  for (const { name, file, spec } of files) {
    test(name, async () => {
      const mod = await modules[file]!();
      const C = mod[spec.component] as ComponentType<Record<string, unknown>>;
      const before = new Set(document.head.children);
      const { container } = render(<C {...spec.props} />);
      // jsdom's getComputedStyle walks every stylesheet – keep only this file's while axe runs, or each test gets
      // slower than the last as earlier components' <style> tags pile up in <head>
      const others = [...document.head.children].filter((el) => before.has(el) && el.tagName === "STYLE");
      others.forEach((el) => el.remove());
      const { violations } = await axe.run(container, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
        rules: Object.fromEntries(OFF.map((r) => [r, { enabled: false }])),
        resultTypes: ["violations"],
      });
      document.head.append(...others);
      const found = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      const known = KNOWN[name] ?? [];
      const rules = violations.map((v) => v.id).sort();
      if (dump) {
        if (rules.length) failing[name] = rules;
        return;
      }
      expect(rules.filter((r) => !known.includes(r)), found.join("\n")).toEqual([]);
      // A fixed rule comes off the known list, so it can't come back unnoticed
      expect(known.filter((r) => !rules.includes(r)), "fixed – remove from tests/a11y-known.ts").toEqual([]);
    });
  }

  test("the known list only names files that exist", () => {
    expect(Object.keys(KNOWN).filter((k) => !files.some((f) => f.name === k))).toEqual([]);
  });
});
