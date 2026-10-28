/*
 * blocks/publish-readiness: the block is the <tc-publish-readiness> element through trenchcoat/react, so its behaviour – including every
 * regression this file used to cover – is tested in real browsers: tests/elements/publish-readiness.test.ts. In jsdom the Lit
 * wrappers don't receive their properties or attributes, so this only checks that the block still renders
 * the element.
 */
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import * as block from "@blocks/publish-readiness";
import { spec } from "../contract/blocks/publish-readiness.contract";

describe("blocks/publish-readiness", () => {
  test("renders <tc-publish-readiness>", () => {
    const Block = (block as unknown as Record<string, ComponentType<Record<string, unknown>>>)[spec.component];
    const { container } = render(<Block {...spec.props} />);
    expect(container.querySelector("tc-publish-readiness")).not.toBeNull();
  });
});
