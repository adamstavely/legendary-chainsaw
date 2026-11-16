/*
 * blocks/mission-control: the block is the <tc-mission-control> element through trenchcoat/react, so its behaviour is tested in real
 * browsers: tests/elements/mission-control.test.ts. In jsdom the Lit wrappers don't receive their properties or attributes, so
 * this only checks that the block still renders the element.
 */
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import * as block from "@blocks/mission-control";
import { spec } from "../contract/blocks/mission-control.contract";

describe("blocks/mission-control", () => {
  test("renders <tc-mission-control>", () => {
    const Block = (block as unknown as Record<string, ComponentType<Record<string, unknown>>>)[spec.component];
    const { container } = render(<Block {...spec.props} />);
    expect(container.querySelector("tc-mission-control")).not.toBeNull();
  });
});
