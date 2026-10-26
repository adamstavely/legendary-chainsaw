import type * as UI from "@illustrations/agent-team";

/** A square initials portrait as an inline SVG data URL */
function initials(text: string, from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="160" fill="url(#g)"/><text x="80" y="96" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="56" font-weight="600" fill="#fff">${text}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentTeam } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <AgentTeam
        prompt="Build a team to work my inbound pipeline"
        members={[
          { role: "Researcher", avatar: initials("RS", "#6366f1", "#a855f7"), tools: ["linkedin"] },
          { role: "SDR", avatar: initials("SD", "#f97316", "#ec4899"), tools: ["gmail", "hubspot"] },
          { role: "Ops", avatar: initials("OP", "#10b981", "#0ea5e9"), tools: ["slack", "salesforce"] },
        ]}
      />
    </div>
  );
}
