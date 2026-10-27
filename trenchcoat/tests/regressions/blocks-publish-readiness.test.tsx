/* blocks/publish-readiness: blockers hold the release back; only sign-offs count as ticks given by hand. */
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { PublishReadiness, type ReadinessCheck } from "@blocks/publish-readiness";

const checks: ReadinessCheck[] = [
  { id: "spec", label: "Spec is valid", state: "passed" },
  { id: "test", label: "Test run passed", state: "failed", blockers: [{ id: "b1", label: "Step 6 timed out" }] },
  { id: "owner", label: "Owner signs off", state: "manual" },
];

describe("blocks/publish-readiness", () => {
  test("the summary counts passes, blockers and sign-offs", () => {
    const { container } = render(<PublishReadiness subject="Digest" checks={checks} />);
    expect(container.querySelector(".ui-prd__count")?.textContent).toBe("1 of 3 checks passed");
    expect(container.querySelector(".ui-prd__status")?.textContent).toBe("1 blocker · 1 sign-off to give");
  });

  test("a blocker is a link the app opens", async () => {
    const onOpenBlocker = vi.fn();
    const { container } = render(<PublishReadiness subject="Digest" checks={checks} onOpenBlocker={onOpenBlocker} />);
    // The dialog's body renders once the element has updated
    const link = await waitFor(() => {
      const found = [...container.querySelectorAll<HTMLButtonElement>(".ui-prd__link")].find((b) => b.textContent?.includes("Step 6"));
      if (!found) throw new Error("no blocker link yet");
      return found;
    });
    fireEvent.click(link);
    expect(onOpenBlocker).toHaveBeenCalledWith(checks[1].blockers![0], checks[1]);
  });

  test("ready once nothing blocks and every sign-off is given", () => {
    const passing = checks.map((c) => (c.state === "failed" ? { ...c, state: "passed" as const } : c));
    const { container } = render(<PublishReadiness subject="Digest" checks={passing} defaultConfirmed={["owner"]} />);
    expect(container.querySelector(".ui-prd__status")?.textContent).toBe("Ready to publish");
    expect(container.querySelector(".ui-prd__count")?.textContent).toBe("3 of 3 checks passed");
  });

  test("the publish action sits in the dialog's footer, not the body", async () => {
    const { container } = render(<PublishReadiness subject="Digest" checks={checks} defaultOpen onPublish={() => {}} />);
    await waitFor(() => {
      const found = container.querySelector(".tc-dialog-actions tc-button");
      if (!found) throw new Error("no action yet");
      return found;
    });
    expect(container.querySelector(".tc-dialog-body tc-button")).toBe(null);
  });
});
