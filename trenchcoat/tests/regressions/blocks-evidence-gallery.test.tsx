/* blocks/evidence-gallery: the filter narrows the grid and the table together; the summary says what shows. */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EvidenceGallery, type EvidenceItem } from "@blocks/evidence-gallery";

const item = (id: string, attestation: EvidenceItem["attestation"], claims: number): EvidenceItem => ({ id, title: id, kind: "Photo", src: "data:image/png;base64,", alt: id, attestation, claims });
const items = [item("a", "attested", 3), item("b", "attested", 1), item("c", "failed", 0)];
const summary = (c: HTMLElement) => c.querySelector(".ui-evg__summary")?.textContent;

describe("blocks/evidence-gallery", () => {
  test("all items", () => {
    const { container } = render(<EvidenceGallery items={items} />);
    expect(summary(container)).toBe("3 items · 2 attested · 4 linked claims");
  });

  test("a controlled filter", () => {
    const { container, rerender } = render(<EvidenceGallery items={items} filter="failed" onFilterChange={() => {}} />);
    expect(summary(container)).toBe("1 item · 0 attested · 0 linked claims");
    rerender(<EvidenceGallery items={items} filter="attested" onFilterChange={() => {}} />);
    expect(summary(container)).toBe("2 items · 2 attested · 4 linked claims");
  });
});
