import { useEffect, useRef, useState } from "react";
import type * as UI from "@components/toaster";
import { button, buttonSm } from "../demo-kit";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Toaster, toast } = ui;
  const [position, setPosition] = useState<UI.ToastPosition>("bottom-right");
  const [expand, setExpand] = useState(false);
  const deploys = useRef(0);

  // Two toasts on load, so the stack shows without clicking (ids keep a re-run or a remount from doubling them)
  useEffect(() => {
    toast.success("Invoice sent", { id: "demo-invoice", description: "INV-2041 · $1,280.00 to Northwind Ltd.", duration: Infinity });
    toast("Conversation archived", { id: "demo-archive", action: { label: "Undo", onClick: () => toast.success("Conversation restored") } });
  }, [toast]);

  const fire: [string, () => void][] = [
    ["Default", () => toast("Draft saved", { description: "Last edited just now" })],
    ["Success", () => toast.success("Invoice sent", { description: "INV-2041 · $1,280.00 to Northwind Ltd." })],
    ["Error", () => toast.error("Couldn't upload file", { description: "report-q3.pdf is larger than 25 MB." })],
    ["Info", () => toast.info("New version available", { description: "Reload to get the latest features." })],
    [
      "With action",
      () =>
        toast("Conversation archived", {
          action: { label: "Undo", onClick: () => toast.success("Conversation restored") },
        }),
    ],
    [
      "Promise",
      () => {
        // Every third deploy fails, so both endings show up
        const fail = ++deploys.current % 3 === 0;
        toast.promise(
          () => new Promise<string>((resolve, reject) => setTimeout(() => (fail ? reject(new Error("Build failed")) : resolve("v2.14.0")), 2200)),
          {
            loading: { title: "Deploying to production…", description: "Building and uploading assets" },
            success: (version) => ({ title: `Deployed ${version}`, description: "Live on acme.app in 2.2s" }),
            error: (e) => ({ title: "Deploy failed", description: e instanceof Error ? e.message : "Something went wrong" }),
          },
        ).catch(() => {});
      },
    ],
  ];

  const positions: UI.ToastPosition[] = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 440, minHeight: 360, display: "grid", alignContent: "start", gap: 16, justifyItems: "center", padding: "24px 0 200px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {fire.map(([label, run]) => (
          <button key={label} type="button" style={button} onClick={run}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          Position
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as UI.ToastPosition)}
            style={{ font: "inherit", fontSize: 12, padding: "4px 6px", borderRadius: "var(--tc-radius-md, 8px)", border: "1px solid var(--tc-border-control, light-dark(#858585, #7c7c82))", background: "var(--tc-surface-control, light-dark(#ffffff, #232326))", color: "var(--tc-text-primary, light-dark(#171717, #ededed))" }}
          >
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={expand} onChange={(e) => setExpand(e.target.checked)} />
          Always expanded
        </label>
        <button type="button" onClick={() => toast.dismiss()} style={buttonSm}>
          Dismiss all
        </button>
      </div>
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>Hover the stack to fan it out · F8 to reach it · swipe or Esc to dismiss</div>
      <Toaster inline position={position} expand={expand} />
    </div>
  );
}
