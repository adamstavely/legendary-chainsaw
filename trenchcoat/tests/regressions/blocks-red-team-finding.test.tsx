/*
 * blocks/red-team-finding: the block is the <tc-red-team-finding> element through trenchcoat/react, so its behaviour – including every
 * regression this file used to cover – is tested in real browsers: tests/elements/red-team-finding.test.ts. In jsdom the Lit
 * wrappers don't receive their properties or attributes, so this only checks that the block still renders
 * the element.
 */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { RedTeamFinding } from "@blocks/red-team-finding";

describe("blocks/red-team-finding", () => {
  test("renders <tc-red-team-finding>", () => {
    const { container } = render(<RedTeamFinding findings={[]} />);
    const el = container.querySelector("tc-red-team-finding");
    expect(el).not.toBeNull();
  });
});
