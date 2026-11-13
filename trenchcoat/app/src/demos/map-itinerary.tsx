import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ItineraryDay } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's three-day field visit to Lisbon: a conference on public-sector audit, two site
   visits and some of the city's public sights between sessions. */

const day = (d: number) => new Date(2027, 2, d).getTime();

const DAYS: ItineraryDay[] = [
  {
    id: "d1",
    label: "Day 1",
    date: day(9),
    stops: [
      { id: "s1", name: "Lisbon Airport", lat: 38.7742, lng: -9.1342, time: "09:40", kind: "transport", note: "Arrivals from Edinburgh" },
      { id: "s2", name: "Hotel Avenida", lat: 38.7189, lng: -9.1437, time: "11:00", kind: "stay", travel: "25 min by metro", note: "Booked under the institute's name" },
      { id: "s3", name: "Time Out Market", lat: 38.7069, lng: -9.1459, time: "13:00", kind: "food", travel: "15 min walk", duration: "1 h" },
      { id: "s4", name: "Praça do Comércio", lat: 38.7075, lng: -9.1364, time: "15:00", kind: "sight", travel: "10 min walk", duration: "45 min" },
    ],
  },
  {
    id: "d2",
    label: "Day 2",
    date: day(10),
    stops: [
      { id: "s5", name: "Congress Centre", lat: 38.6967, lng: -9.1874, time: "09:00", kind: "venue", travel: "20 min by tram", duration: "All morning", note: "Audit in the public sector, sessions 1–3" },
      { id: "s6", name: "Belém Tower", lat: 38.6916, lng: -9.216, time: "14:00", kind: "sight", travel: "12 min walk", duration: "1 h" },
      { id: "s7", name: "Jerónimos Monastery", lat: 38.6979, lng: -9.2068, time: "15:30", kind: "sight", travel: "10 min walk", duration: "1 h 30 min" },
    ],
  },
  {
    id: "d3",
    label: "Day 3",
    date: day(11),
    stops: [
      { id: "s8", name: "National Audit Office", lat: 38.7253, lng: -9.1501, time: "10:00", kind: "venue", duration: "2 h", note: "Site visit – records archive" },
      { id: "s9", name: "Gulbenkian Garden", lat: 38.7372, lng: -9.1543, time: "12:30", kind: "sight", travel: "15 min walk", duration: "45 min" },
      { id: "s10", name: "Oriente Station", lat: 38.7678, lng: -9.0993, time: "16:00", kind: "transport", travel: "25 min by metro", note: "Train to Porto" },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MapItinerary } = ui;
  const [dayId, setDayId] = useState<string | null>("d2");
  const [stop, setStop] = useState<string | null>("s6");
  const current = DAYS.find((d) => d.id === dayId) ?? DAYS[0];
  const next = DAYS[(DAYS.indexOf(current) + 1) % DAYS.length];
  return (
    <div style={{ width: "100%", maxWidth: 880, display: "grid", gap: 8 }}>
      <MapItinerary title="Lisbon field visit" description="Public-sector audit conference · 9–11 March" days={DAYS} day={dayId} onDayChange={setDayId} stop={stop} onStopSelect={setStop} />
      <div style={{ ...caption, textAlign: "center" }}>
        Pick a stop in the list or on the map.{" "}
        <button type="button" style={textButton} onClick={() => setDayId(next.id)}>
          Show {next.label}
        </button>
      </div>
    </div>
  );
}
