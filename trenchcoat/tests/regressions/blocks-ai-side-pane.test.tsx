/*
 * blocks/ai-side-pane: the block is the <tc-ai-side-pane> element through trenchcoat/react, so its behaviour – including every
 * regression this file used to cover – is tested in real browsers: tests/elements/ai-side-pane.test.ts. In jsdom the Lit
 * wrappers don't receive their properties or attributes, so this only checks that the block still renders
 * the element.
 */
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import * as block from "@blocks/ai-side-pane";
import { spec } from "../contract/blocks/ai-side-pane.contract";

describe("blocks/ai-side-pane", () => {
  test("renders <tc-ai-side-pane>", () => {
    const Block = (block as unknown as Record<string, ComponentType<Record<string, unknown>>>)[spec.component];
    const { container } = render(<Block {...spec.props} />);
    expect(container.querySelector("tc-ai-side-pane")).not.toBeNull();
  });
});
