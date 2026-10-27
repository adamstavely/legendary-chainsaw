import { useState } from "react";
import type * as UI from "@blocks/publish-readiness";

const CHECKS: UI.ReadinessCheck[] = [
  { id: "spec", label: "Spec is valid", detail: "every step checked against its schema", state: "passed" },
  { id: "policy", label: "Data rules met", detail: "exports blocked, review step present", state: "passed" },
  {
    id: "test",
    label: "Test run passed",
    state: "failed",
    blockers: [
      { id: "b1", label: "Step 6 timed out on 3 of 14 items", where: "Run 7f2c" },
      { id: "b2", label: "Summary is missing a source link", where: "Step 8" },
    ],
  },
  { id: "owner", label: "Owner signs off", state: "manual" },
  { id: "adversarial", label: "Adversarial checks", detail: "run during approval", state: "pending" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PublishReadiness } = ui;
  // Following a blocker's link "fixes" it here, so the release can be walked to ready in a few clicks
  const [fixed, setFixed] = useState<string[]>([]);
  const checks = CHECKS.map((c) => {
    const left = c.blockers?.filter((b) => !fixed.includes(b.id));
    return c.state === "failed" && left && left.length === 0 ? { ...c, state: "passed" as const, blockers: [] } : { ...c, blockers: left };
  });
  return (
    <PublishReadiness
      subject="Weekly digest"
      version="v1.3"
      description="A workflow that summarises the week's tickets for the team"
      checks={checks}
      onOpenBlocker={(b) => setFixed((f) => [...f, b.id])}
      onPublish={() => {}}
      note={
        <>
          <b>Who approves:</b> the workflow's owner. On approval v1.3 goes live and v1.2 retires; every run records which version produced it.
        </>
      }
    />
  );
}
