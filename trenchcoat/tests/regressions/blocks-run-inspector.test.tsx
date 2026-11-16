/*
 * blocks/run-inspector: the block is the <tc-run-inspector> element through trenchcoat/react, so its behaviour is tested in real
 * browsers: tests/elements/run-inspector.test.ts. In jsdom the Lit wrappers don't receive their properties or attributes, so
 * this only checks that the block still renders the element.
 */
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import * as block from "@blocks/run-inspector";
import { spec } from "../contract/blocks/run-inspector.contract";

describe("blocks/run-inspector", () => {
  test("renders <tc-run-inspector>", () => {
    const Block = (block as unknown as Record<string, ComponentType<Record<string, unknown>>>)[spec.component];
    const { container } = render(<Block {...spec.props} />);
    expect(container.querySelector("tc-run-inspector")).not.toBeNull();
  });
});
