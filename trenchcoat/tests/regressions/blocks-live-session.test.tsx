/*
 * blocks/live-session: the block is the <tc-live-session> element through trenchcoat/react, so its behaviour is tested in real
 * browsers: tests/elements/live-session.test.ts. In jsdom the Lit wrappers don't receive their properties or attributes, so
 * this only checks that the block still renders the element.
 */
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import * as block from "@blocks/live-session";
import { spec } from "../contract/blocks/live-session.contract";

describe("blocks/live-session", () => {
  test("renders <tc-live-session>", () => {
    const Block = (block as unknown as Record<string, ComponentType<Record<string, unknown>>>)[spec.component];
    const { container } = render(<Block {...spec.props} />);
    expect(container.querySelector("tc-live-session")).not.toBeNull();
  });
});
