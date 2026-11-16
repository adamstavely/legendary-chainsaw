/*
 * blocks/mission-timeline: the block is the <tc-mission-timeline> element through trenchcoat/react, so its behaviour is tested in real
 * browsers: tests/elements/mission-timeline.test.ts. In jsdom the Lit wrappers don't receive their properties or attributes, so
 * this only checks that the block still renders the element.
 */
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import * as block from "@blocks/mission-timeline";
import { spec } from "../contract/blocks/mission-timeline.contract";

describe("blocks/mission-timeline", () => {
  test("renders <tc-mission-timeline>", () => {
    const Block = (block as unknown as Record<string, ComponentType<Record<string, unknown>>>)[spec.component];
    const { container } = render(<Block {...spec.props} />);
    expect(container.querySelector("tc-mission-timeline")).not.toBeNull();
  });
});
