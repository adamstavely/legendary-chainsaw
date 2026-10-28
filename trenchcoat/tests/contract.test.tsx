/*
 * The API contract every component keeps (audit/code-quality-fix-plan.md, Phase 3). Each component declares a
 * spec in tests/contract/<slug>.contract.tsx; this runner checks, for both published looks:
 *   · className is merged onto the root, not replacing the component's own class
 *   · other DOM props (data-*, aria-*, id) are passed through to the root
 *   · a ref receives the root element (or the documented handle)
 *   · look renders data-look on the root, defaulting to the file's look
 *   · controlled state follows its value prop after mount, and changes are reported, not applied
 * Single-look libraries (blocks, screens, illustrations, motion) declare specs in tests/contract/<lib>/<slug>.contract.tsx
 * and get the same checks without the look ones.
 */
import { createRef, type ComponentType } from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import cleanTwins from "virtual:tc-clean";

export type ContractSpec = {
  /** Export name of the component in the published file */
  component: string;
  /** A single-look component: the one look it has (no look prop, no other-look check) */
  only?: "standard" | "clean";
  /** Minimal props that render the component */
  props: Record<string, unknown>;
  /** Selector for the root element, when it isn't the first element the component renders */
  root?: string;
  /** What the ref receives: the root element (default) or an imperative handle checked by `handle` */
  ref?: "root" | "none" | { handle: (value: unknown) => boolean };
  /** Controlled value props: re-rendering with another value must show it */
  controlled?: Array<{
    prop: string;
    values: [unknown, unknown];
    /** Reads what the component shows for the value */
    read: (root: HTMLElement) => unknown;
  }>;
};

const specs = import.meta.glob<{ spec: ContractSpec }>("./contract/*.contract.tsx", { eager: true });
const libSpecs = import.meta.glob<{ spec: ContractSpec }>("./contract/{blocks,screens,illustrations,motion}/*.contract.tsx", { eager: true });
const modules = import.meta.glob<Record<string, unknown>>("../{src/components,blocks,screens,illustrations,motion}/*.tsx");

const cases = Object.entries(specs).map(([path, mod]) => ({ slug: path.match(/contract\/(.+)\.contract\.tsx$/)![1], spec: mod.spec }));
const libCases = Object.entries(libSpecs).map(([path, mod]) => ({ slug: path.match(/contract\/(.+)\.contract\.tsx$/)![1], spec: mod.spec }));

describe("contract", () => {
  test("every component built from src/ declares a contract", () => {
    const sources = Object.keys(import.meta.glob("../src/components/*.tsx")).map((p) => p.match(/([^/]+)\.tsx$/)![1]);
    const declared = new Set(cases.map((c) => c.slug));
    expect(sources.filter((s) => !declared.has(s))).toEqual([]);
  });

  test("every block, screen, illustration and motion file declares a contract", () => {
    const files = Object.keys(import.meta.glob("../{blocks,screens,illustrations,motion}/*.tsx")).map((p) => p.match(/\.\.\/(.+)\.tsx$/)![1]);
    const declared = new Set(libCases.map((c) => c.slug));
    expect(files.filter((f) => !declared.has(f))).toEqual([]);
  });

  for (const { slug, spec } of cases) {
    for (const look of ["standard", "clean"] as const) {
      if (spec.only && spec.only !== look) continue;
      // The Clean case loads the in-memory twin (vite.config.ts) – the same source with Clean as its default
      describe(`${slug} (${look})`, () => checks(spec, look === "standard" || spec.only ? `../src/components/${slug}.tsx` : `clean:${slug}`, spec.only ? undefined : look));
    }
  }
  for (const { slug, spec } of libCases) describe(slug, () => checks(spec, `../${slug}.tsx`));
});

/** The checks for one published file – `look` is the file's default look, absent for single-look libraries */
function checks(spec: ContractSpec, file: string, look?: "standard" | "clean") {
  const load = async () => {
    const mod = file.startsWith("clean:") ? await cleanTwins[file.slice(6)]!() : await modules[file]!();
    return mod[spec.component] as ComponentType<Record<string, unknown>>;
  };
  const rootOf = (container: HTMLElement) =>
    (spec.root ? container.ownerDocument.querySelector(spec.root) : container.querySelector(":scope > :not(style)")) as HTMLElement;

  test("className, DOM props and data-look reach the root", async () => {
    const C = await load();
    const { container } = render(<C {...spec.props} className="consumer-class" data-consumer="yes" aria-describedby="consumer" />);
    const root = rootOf(container);
    expect(root, "root element").toBeTruthy();
    expect(root.classList.contains("consumer-class"), "consumer className merged").toBe(true);
    expect([...root.classList].some((c) => c.startsWith("ui-")) || root.hasAttribute("data-ui"), "component keeps its own class (a Lit root carries data-ui)").toBe(true);
    expect(root.getAttribute("data-consumer")).toBe("yes");
    expect(root.getAttribute("aria-describedby")).toBe("consumer");
    if (look) expect(root.getAttribute("data-look"), "default look").toBe(look);
  });

  if (look) test("the look prop overrides the file's default", async () => {
    const C = await load();
    const other = look === "standard" ? "clean" : "standard";
    const { container } = render(<C {...spec.props} look={other} />);
    expect(rootOf(container).getAttribute("data-look")).toBe(other);
  });

  if (spec.ref !== "none") {
    test("ref", async () => {
      const C = await load();
      const ref = createRef<unknown>();
      const { container } = render(<C {...spec.props} ref={ref} />);
      if (spec.ref && typeof spec.ref === "object") expect(spec.ref.handle(ref.current), "imperative handle").toBe(true);
      else expect(ref.current, "ref receives the root").toBe(rootOf(container));
    });
  }

  for (const c of spec.controlled ?? []) {
    test(`controlled ${c.prop} follows its prop`, async () => {
      const C = await load();
      const { container, rerender } = render(<C {...spec.props} {...{ [c.prop]: c.values[0] }} />);
      expect(c.read(rootOf(container))).toEqual(c.values[0]);
      await act(async () => rerender(<C {...spec.props} {...{ [c.prop]: c.values[1] }} />));
      expect(c.read(rootOf(container))).toEqual(c.values[1]);
    });
  }
}
