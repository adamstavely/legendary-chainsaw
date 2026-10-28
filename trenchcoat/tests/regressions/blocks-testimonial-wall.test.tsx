/*
 * blocks/testimonial-wall: the block is the <tc-testimonial-wall> element through trenchcoat/react, so its behaviour – including every
 * regression this file used to cover – is tested in real browsers: tests/elements/testimonial-wall.test.ts. In jsdom the Lit
 * wrappers don't receive their properties or attributes, so this only checks that the block still renders
 * the element.
 */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { TestimonialWall } from "@blocks/testimonial-wall";

describe("blocks/testimonial-wall", () => {
  test("renders <tc-testimonial-wall>", () => {
    const { container } = render(<TestimonialWall items={[{ quote: "Fast.", name: "Leo Brandt" }]} />);
    const el = container.querySelector("tc-testimonial-wall");
    expect(el).not.toBeNull();
  });
});
