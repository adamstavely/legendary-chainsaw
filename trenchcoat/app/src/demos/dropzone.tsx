import { useState } from "react";
import type * as UI from "@components/dropzone";
import type { UploadItem } from "@components/dropzone";
import { textButton } from "../demo-kit";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Dropzone } = ui;
  const [items, setItems] = useState<UploadItem[]>([]);
  const [run, setRun] = useState(0);

  const done = items.filter((i) => i.status === "done").length;
  const uploading = items.filter((i) => i.status === "uploading").length;
  const failed = items.filter((i) => i.status === "error").length;

  return (
    <div style={{ width: "100%", maxWidth: 460, display: "grid", gap: 10 }}>
      <Dropzone
        key={run}
        accept={[".pdf", ".png", ".jpg", ".docx", ".xlsx", ".csv", ".mp4"]}
        maxSize={25 * 1024 * 1024}
        onChange={setItems}
        autoplay
        demo
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
        <span>
          {items.length === 0
            ? "Drop files from your desktop, or watch the sample drop"
            : `${done} uploaded · ${uploading} in progress${failed ? ` · ${failed} failed` : ""}`}
        </span>
        <button
          type="button"
          onClick={() => {
            setItems([]);
            setRun((n) => n + 1);
          }}
          style={textButton}
        >
          Replay
        </button>
      </div>
    </div>
  );
}
