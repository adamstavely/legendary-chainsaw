import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { LinkedPerson } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The people linked to a small business account in a know-your-customer review: its directors, the owner behind a
   holding company, a co-signer and the outside accountant. Four show at first; "Show all" reveals the rest. */

const PEOPLE: LinkedPerson[] = [
  { id: "p1", name: "Dana Whitfield", role: "Director", detail: "CUS-40218", strength: "strong", tag: { label: "Key link", tone: "danger" } },
  { id: "p2", name: "Omar Haddad", role: "Beneficial owner", detail: "via Larkspur Holdings · 62%", strength: "strong" },
  { id: "p3", name: "Priya Natarajan", role: "Co-signer", detail: "CUS-40377", strength: "medium" },
  { id: "p4", name: "Tomás Ibáñez", role: "Accountant", detail: "Ibáñez & Co.", strength: "medium" },
  { id: "p5", name: "Hannah Becker", role: "Former director", detail: "Resigned 2023", strength: "weak" },
  { id: "p6", name: "Kwame Mensah", role: "Shared address", detail: "Unverified", strength: "unknown", tag: { label: "Check", tone: "warning" } },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PersonLinks } = ui;
  const [selected, setSelected] = useState<string | null>(null);
  const [network, setNetwork] = useState(false);
  const person = PEOPLE.find((p) => p.id === selected);
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <PersonLinks
        title="Linked people"
        description="Larkspur Trading Ltd · KYC review"
        people={PEOPLE}
        max={4}
        networkLabel="View network"
        selected={selected}
        onSelectedChange={setSelected}
        onNetwork={() => setNetwork(true)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {network ? "The page would open the network view. " : person ? `${person.name} is selected – the page would open their profile. ` : "Click a person, or move with the arrow keys and press Enter. "}
        {(network || person) && (
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setNetwork(false);
              setSelected(null);
            }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
