/*
 * Every design-system page renders (remediation Part 4.5): the generated API loads, the sections the guidance and
 * the API call for are there, the usage tabs hold code, and nothing logs an error. The live example is stubbed –
 * the demos have their own smoke test.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { DocsPage } from "../app/src/docs/DocsPage";
import { Foundations, FOUNDATIONS } from "../app/src/docs/Foundations";
import { GUIDANCE } from "../app/src/docs/guidance";
import { ENTRIES } from "../app/src/registry";

const documented = ENTRIES.filter((e) => ["components", "illustrations", "motion"].includes(e.library));
let errors: string[] = [];
beforeEach(() => {
  errors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => errors.push(args.map(String).join(" ").slice(0, 300)));
  window.scrollTo = () => {};
});
afterEach(() => vi.restoreAllMocks());

describe("docs pages", () => {
  test.each(documented.map((e) => [e.id, e] as const))("%s", async (_id, entry) => {
    const { container } = render(<DocsPage entry={entry} section="" example={<div data-testid="example" />} />);
    await waitFor(() => expect(container.querySelector("#docs-api")).toBeTruthy(), { timeout: 4000 });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(entry.name);
    expect(container.querySelector("#docs-usage tc-code-block")).toBeTruthy();
    expect(container.querySelectorAll("#docs-api table").length).toBeGreaterThan(0);
    const guide = GUIDANCE[entry.slug];
    if (guide?.sections.Overview) expect(container.querySelector("#docs-overview")).toBeTruthy();
    if (guide?.sections.Keyboard) expect(container.querySelector("#docs-accessibility")!.textContent).toContain("Keyboard");
    // Every "On this page" link points at a section that exists
    for (const a of container.querySelectorAll<HTMLAnchorElement>(".docs-toc a")) {
      const id = a.getAttribute("href")!.split("/").pop();
      expect(container.querySelector(`#docs-${id}`), `section ${id}`).toBeTruthy();
    }
    expect(errors).toEqual([]);
  });

  test.each(FOUNDATIONS.map(([id]) => [id]))("foundations/%s", (id) => {
    const { container } = render(<Foundations page={id} />);
    expect(container.querySelector("h1")).toBeTruthy();
    expect(errors).toEqual([]);
  });
});
