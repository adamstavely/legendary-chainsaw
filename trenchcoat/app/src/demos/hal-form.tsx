import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { HalFormFetcher, HalFormsDocument } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's booking API describes its own form: everything below comes from the HAL-FORMS document, and
   the instruments are fetched from `options.link`. The demo answers those requests itself, so nothing leaves the page. */

const BOOKING: HalFormsDocument = {
  _links: { self: { href: "https://api.example.org/bookings" } },
  _templates: {
    default: {
      title: "Book instrument time",
      method: "POST",
      contentType: "application/json",
      properties: [
        { name: "project", prompt: "Project code", required: true, regex: "[A-Z]{2}-[0-9]{3}", placeholder: "BX-204" },
        {
          name: "instrument",
          prompt: "Instrument",
          required: true,
          options: { link: { href: "https://api.example.org/instruments", type: "application/json" }, promptField: "name", valueField: "id", maxItems: 1 },
        },
        { name: "date", prompt: "Date", type: "date", required: true },
        { name: "hours", prompt: "Hours", type: "number", min: 1, max: 12, step: 1, value: "2" },
        {
          name: "shift",
          prompt: "Shift",
          type: "radio",
          options: { selectedValues: ["day"], inline: [{ prompt: "Day", value: "day" }, { prompt: "Evening", value: "evening" }, { prompt: "Overnight", value: "night" }] },
        },
        {
          name: "support",
          prompt: "Support needed",
          type: "checkbox",
          options: { maxItems: 2, inline: ["Technician", "Training", "Sample preparation"] },
        },
        { name: "notes", prompt: "Notes", type: "textarea", rows: 3, maxLength: 200, placeholder: "Anything the facility should know" },
        { name: "hazard", prompt: "These samples are hazardous", type: "checkbox" },
        { name: "site", type: "hidden", value: "north-campus" },
      ],
    },
  },
};
const INSTRUMENTS = [
  { id: "cryo-em", name: "Cryo-electron microscope" },
  { id: "nmr-800", name: "800 MHz NMR" },
  { id: "ms-orbi", name: "Orbitrap mass spectrometer" },
  { id: "seq-nova", name: "Sequencer" },
];

const fetcher: HalFormFetcher = async (url, init) => {
  if (url.endsWith("/instruments")) return new Response(JSON.stringify(INSTRUMENTS), { status: 200 });
  return new Response(String(init.body), { status: 201 });
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { HalForm } = ui;
  const [sent, setSent] = useState("");
  const [round, setRound] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <HalForm key={round} resource={BOOKING} fetcher={fetcher} description="Drawn from the API's HAL-FORMS document" onTcSubmit={(e) => setSent(`${e.detail.method} ${e.detail.url}\n${e.detail.body}`)} />
      <div style={{ ...caption, textAlign: "center", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {sent || "Submit with nothing filled in to see the rules, then fill it in to see the request."}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setSent("");
            setRound(round + 1);
          }}
        >
          Start again
        </button>
      </div>
    </div>
  );
}
