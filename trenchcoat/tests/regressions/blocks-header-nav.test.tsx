/*
 * blocks/header-nav: the block is the <tc-header-nav> element through trenchcoat/react, so its behaviour – including every
 * regression this file used to cover – is tested in real browsers: tests/elements/header-nav.test.ts. In jsdom the Lit
 * wrappers don't receive their properties or attributes, so this only checks that the block still renders
 * the element.
 */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { HeaderNav } from "@blocks/header-nav";

describe("blocks/header-nav", () => {
  test("renders <tc-header-nav>", () => {
    const { container } = render(<HeaderNav user={{ name: "Ada Lovelace", email: "ada@example.com" }} />);
    const el = container.querySelector("tc-header-nav");
    expect(el).not.toBeNull();
  });
});
