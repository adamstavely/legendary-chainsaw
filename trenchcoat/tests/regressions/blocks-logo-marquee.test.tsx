/*
 * blocks/logo-marquee: the block is the <tc-logo-marquee> element through trenchcoat/react, so its behaviour – including every
 * regression this file used to cover – is tested in real browsers: tests/elements/logo-marquee.test.ts. In jsdom the Lit
 * wrappers don't receive their properties or attributes, so this only checks that the block still renders
 * the element.
 */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { LogoMarquee } from "@blocks/logo-marquee";

describe("blocks/logo-marquee", () => {
  test("renders <tc-logo-marquee>", () => {
    const { container } = render(<LogoMarquee logos={[{ name: "Orbitly" }]} />);
    const el = container.querySelector("tc-logo-marquee");
    expect(el).not.toBeNull();
  });
});
