import type * as UI from "../../../../src/elements/react";

/** A square initials portrait as an inline SVG data URL */
function initials(text: string, from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="160" fill="url(#g)"/><text x="80" y="96" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="56" font-weight="600" fill="#fff">${text}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TeamInvite } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <TeamInvite
        avatars={[
          { src: initials("MK", "#2f6bff", "#8b5cf6"), name: "Maya Kim" },
          { src: initials("JO", "#f59e0b", "#ef4444"), name: "Jonas Ortiz" },
          { src: initials("PS", "#10b981", "#06b6d4"), name: "Priya Shah" },
        ]}
      />
    </div>
  );
}
