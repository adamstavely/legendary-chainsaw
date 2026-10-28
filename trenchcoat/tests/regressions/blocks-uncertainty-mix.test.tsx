/*
 * blocks/uncertainty-mix: the block is the <tc-uncertainty-mix> element through trenchcoat/react, so its behaviour – including every
 * regression this file used to cover – is tested in real browsers: tests/elements/uncertainty-mix.test.ts. In jsdom the Lit
 * wrappers don't receive their properties or attributes, so this only checks that the block still renders
 * the element.
 */
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import * as block from "@blocks/uncertainty-mix";
import { spec } from "../contract/blocks/uncertainty-mix.contract";

describe("blocks/uncertainty-mix", () => {
  test("renders <tc-uncertainty-mix>", () => {
    const Block = (block as unknown as Record<string, ComponentType<Record<string, unknown>>>)[spec.component];
    const { container } = render(<Block {...spec.props} />);
    expect(container.querySelector("tc-uncertainty-mix")).not.toBeNull();
  });
});
