import { useEffect, useState } from "react";
import type * as UI from "@components/permission-request";
import type { PermissionDecision, PermissionPreviewItem } from "@components/permission-request";

const Star = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5l1.7 4.8 4.8 1.7-4.8 1.7L8 14.5l-1.7-4.8L1.5 8l4.8-1.7z" fill="#d97757" />
  </svg>
);
const GitHub = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path
      fill="currentColor"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
    />
  </svg>
);
const File = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 1.75h5l3 3v9.5H4z" />
    <path d="M9 1.75v3h3" />
  </svg>
);

const PREVIEW: PermissionPreviewItem[] = [
  { id: "1", label: "src/checkout/payment.ts", meta: "+48 −12", icon: <File /> },
  { id: "2", label: "src/checkout/payment.test.ts", meta: "+96", icon: <File /> },
  { id: "3", label: "src/lib/stripe.ts", meta: "+7 −3", icon: <File /> },
  { id: "4", label: "package.json", meta: "+1 −1", icon: <File /> },
  { id: "5", label: "CHANGELOG.md", meta: "+4", icon: <File /> },
];

/** The demo clock runs 60× real time so a 15-minute grant drains in ~15 seconds */
const SPEED = 60;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PermissionRequest } = ui;
  const [now, setNow] = useState(() => Date.now());
  const [last, setLast] = useState<PermissionDecision | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => setNow((n) => n + 250 * SPEED), 250);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div style={{ width: "100%", maxWidth: 460, display: "grid", gap: 8 }}>
      <PermissionRequest
        agent={{ name: "Coder", model: "Claude Sonnet", avatar: <Star /> }}
        action="push to main"
        target="acme/web"
        toolIcon={<GitHub />}
        risk="risky"
        reason="The checkout fix passed all 214 tests on the branch. Pushing directly avoids waiting for the merge queue before tonight's release."
        preview={PREVIEW}
        previewTitle="5 files will change"
        defaultScope="timed"
        duration={15}
        now={now}
        onDecisionChange={setLast}
      />
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }}>
        {last === null ? "Clock runs 60× – a timed grant drains in seconds." : last.allow ? `Allowed (${last.scope})` : "Denied"}
      </div>
    </div>
  );
}
