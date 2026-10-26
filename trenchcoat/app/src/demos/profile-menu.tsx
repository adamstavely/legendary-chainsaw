import { useState } from "react";
import type * as UI from "@components/profile-menu";
import { textButton } from "../demo-kit";

const STEPS = ["Add a profile photo", "Verify your email", "Connect your calendar", "Invite a teammate", "Set your working hours"];

const Avatar = () => (
  <span
    style={{
      display: "grid",
      placeItems: "center",
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #db2777, #7c3aed)",
      color: "#fff",
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: 0.3,
    }}
  >
    MR
  </span>
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ProfileMenu, SettingsIcon, LanguageIcon, DocsIcon, AppsIcon, LogoutIcon } = ui;
  const [done, setDone] = useState(2);
  const [last, setLast] = useState("Pick an action, or continue the setup");

  const pick = (label: string) => () => setLast(`Selected “${label}”`);
  const items: UI.ProfileMenuItem[] = [
    { id: "settings", label: "Settings", icon: <SettingsIcon />, onSelect: pick("Settings") },
    { id: "language", label: "Language", icon: <LanguageIcon />, onSelect: pick("Language") },
    { id: "docs", label: "Docs", icon: <DocsIcon />, onSelect: pick("Docs") },
    { id: "apps", label: "Apps", icon: <AppsIcon />, badge: "New", onSelect: pick("Apps") },
    { id: "logout", label: "Log out", icon: <LogoutIcon />, onSelect: pick("Log out") },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 320, display: "grid", gap: 12, justifyItems: "center" }}>
      <div style={{ width: "100%" }}>
        <ProfileMenu
          name="Maya Rodriguez"
          email="maya@northwind.studio"
          avatar={<Avatar />}
          items={items}
          setup={{
            done,
            total: STEPS.length,
            next: STEPS[done],
            onContinue: () => {
              setLast(`Finished “${STEPS[done]}”`);
              setDone((d) => (d + 1 > STEPS.length ? 0 : d + 1));
            },
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }} aria-live="polite">
        {last}
        {done >= STEPS.length && (
          <>
            {" · "}
            <button
              type="button"
              onClick={() => setDone(0)}
              style={textButton}
            >
              Reset setup
            </button>
          </>
        )}
      </div>
    </div>
  );
}
