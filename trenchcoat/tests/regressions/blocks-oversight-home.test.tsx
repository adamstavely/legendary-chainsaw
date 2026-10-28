/*
 * blocks/oversight-home: the block is the <tc-oversight-home> element through trenchcoat/react, so its behaviour – including every
 * regression this file used to cover – is tested in real browsers: tests/elements/oversight-home.test.ts. In jsdom the Lit
 * wrappers don't receive their properties or attributes, so this only checks that the block still renders
 * the element.
 */
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import * as block from "@blocks/oversight-home";
import { spec } from "../contract/blocks/oversight-home.contract";

describe("blocks/oversight-home", () => {
  test("renders <tc-oversight-home>", () => {
    const Block = (block as unknown as Record<string, ComponentType<Record<string, unknown>>>)[spec.component];
    const { container } = render(<Block {...spec.props} />);
    expect(container.querySelector("tc-oversight-home")).not.toBeNull();
  });
});
