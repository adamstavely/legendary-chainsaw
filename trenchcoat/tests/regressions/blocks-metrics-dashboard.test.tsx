/*
 * blocks/metrics-dashboard: the block is the <tc-metrics-dashboard> element through trenchcoat/react, so its behaviour – including every
 * regression this file used to cover – is tested in real browsers: tests/elements/metrics-dashboard.test.ts. In jsdom the Lit
 * wrappers don't receive their properties or attributes, so this only checks that the block still renders
 * the element.
 */
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import * as block from "@blocks/metrics-dashboard";
import { spec } from "../contract/blocks/metrics-dashboard.contract";

describe("blocks/metrics-dashboard", () => {
  test("renders <tc-metrics-dashboard>", () => {
    const Block = (block as unknown as Record<string, ComponentType<Record<string, unknown>>>)[spec.component];
    const { container } = render(<Block {...spec.props} />);
    expect(container.querySelector("tc-metrics-dashboard")).not.toBeNull();
  });
});
