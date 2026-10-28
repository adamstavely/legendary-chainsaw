import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CalendarEvent, CalendarSource } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* An audit team's week across five people's accounts: Maya's Google work and personal calendars, Theo's Outlook,
   Priya's Exchange client calendar beside her Google one (where a dentist appointment clashes with a client review),
   Sam's read-only conference feed, and the firm's read-only holiday calendar. Edits are kept in the demo's state;
   "Save slowly" holds each change as saving for a moment, as a real account would. */

const NOW = new Date(2026, 9, 28, 10, 20).getTime();
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();

const maya = { id: "maya", name: "Maya Chen" };
const theo = { id: "theo", name: "Theo Okafor" };
const priya = { id: "priya", name: "Priya Raman" };
const sam = { id: "sam", name: "Sam Ortiz" };
const firm = { id: "firm", name: "Northwind Audit" };

const CALENDARS: CalendarSource[] = [
  { id: "maya-work", name: "Work", owner: maya, provider: "Google", color: 1 },
  { id: "maya-home", name: "Personal", owner: maya, provider: "Google", color: 5 },
  { id: "theo-work", name: "Work", owner: theo, provider: "Outlook", color: 2 },
  { id: "priya-client", name: "Client meetings", owner: priya, provider: "Exchange", color: 3 },
  { id: "priya-home", name: "Personal", owner: priya, provider: "Google", color: 6 },
  { id: "sam-conf", name: "Audit Summit", owner: sam, provider: "iCal feed", color: 4, readOnly: true },
  { id: "firm-holidays", name: "Holidays", owner: firm, provider: "Google", color: 6, readOnly: true, visible: false },
];

const EVENTS: CalendarEvent[] = [
  { id: "e1", calendarId: "maya-work", title: "Team stand-up", start: at(26, 9, 30), end: at(26, 9, 45), recurring: "Every weekday" },
  { id: "e2", calendarId: "maya-work", title: "Team stand-up", start: at(27, 9, 30), end: at(27, 9, 45), recurring: "Every weekday" },
  { id: "e3", calendarId: "maya-work", title: "Team stand-up", start: at(28, 9, 30), end: at(28, 9, 45), recurring: "Every weekday" },
  { id: "e4", calendarId: "maya-work", title: "Team stand-up", start: at(29, 9, 30), end: at(29, 9, 45), recurring: "Every weekday" },
  { id: "e5", calendarId: "maya-work", title: "Team stand-up", start: at(30, 9, 30), end: at(30, 9, 45), recurring: "Every weekday" },
  { id: "e6", calendarId: "maya-work", title: "Sampling plan review", start: at(28, 11), end: at(28, 12, 30), location: "Room 4B", attendees: ["Theo Okafor", "Priya Raman"] },
  { id: "e7", calendarId: "theo-work", title: "Sampling plan review", start: at(28, 11), end: at(28, 12, 30), location: "Room 4B" },
  { id: "e8", calendarId: "theo-work", title: "Vendor ledger walkthrough", start: at(27, 13), end: at(27, 15), attendees: ["Accounts payable"] },
  { id: "e9", calendarId: "theo-work", title: "1:1 with Maya", start: at(29, 15), end: at(29, 15, 30), status: "tentative" },
  { id: "e10", calendarId: "priya-client", title: "Client review – Halden Foods", start: at(28, 14), end: at(28, 15, 30), location: "Video call" },
  { id: "e11", calendarId: "priya-home", title: "Dentist", start: at(28, 15), end: at(28, 16), location: "Elm Street Dental" },
  { id: "e12", calendarId: "priya-client", title: "Fieldwork – inventory count", start: at(29, 8), end: at(29, 12, 30), location: "Halden warehouse" },
  { id: "e13", calendarId: "sam-conf", title: "Audit Summit", start: at(29, 0), end: at(31, 0), allDay: true, location: "Lisbon" },
  { id: "e14", calendarId: "sam-conf", title: "Keynote: continuous assurance", start: at(29, 9), end: at(29, 10) },
  { id: "e15", calendarId: "maya-home", title: "School pick-up", start: at(27, 15, 15), end: at(27, 15, 45) },
  { id: "e16", calendarId: "maya-home", title: "Gym", start: at(30, 7), end: at(30, 8) },
  { id: "e17", calendarId: "theo-work", title: "Quarter-close sync", start: at(30, 10), end: at(30, 11), status: "cancelled" },
  { id: "e18", calendarId: "priya-client", title: "Engagement letter sign-off", start: at(26, 16), end: at(26, 16, 30) },
  { id: "e19", calendarId: "firm-holidays", title: "Founders' day", start: at(30, 0), end: at(31, 0), allDay: true },
  { id: "e20", calendarId: "maya-work", title: "Write-up: revenue testing", start: at(28, 13), end: at(28, 14, 30) },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MultiCalendar } = ui;
  const [events, setEvents] = useState(EVENTS);
  const [pending, setPending] = useState<string[]>([]);
  const [slow, setSlow] = useState(false);
  const [last, setLast] = useState("");
  const settle = (id: string) => {
    if (!slow) return;
    setPending((p) => [...p, id]);
    window.setTimeout(() => setPending((p) => p.filter((x) => x !== id)), 1500);
  };
  return (
    <div style={{ width: "100%", maxWidth: 1080, display: "grid", gap: 8 }}>
      <MultiCalendar
        title="Team calendars"
        description="Five people's Google, Outlook, Exchange and iCal calendars in one place."
        calendars={CALENDARS}
        events={events}
        pending={pending}
        defaultDate={NOW}
        now={NOW}
        onEventCreate={({ event, calendar }) => {
          setEvents((list) => [...list, event]);
          setLast(`Created “${event.title}” on ${calendar.owner.name}'s ${calendar.provider} calendar.`);
          settle(event.id);
        }}
        onEventUpdate={({ event, calendar }) => {
          setEvents((list) => list.map((e) => (e.id === event.id ? event : e)));
          setLast(`Saved “${event.title}” to ${calendar.owner.name}'s ${calendar.provider} calendar.`);
          settle(event.id);
        }}
        onEventDelete={({ event, calendar }) => {
          setEvents((list) => list.filter((e) => e.id !== event.id));
          setLast(`Deleted “${event.title}” from ${calendar.owner.name}'s ${calendar.provider} calendar.`);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {last || "Drag on an empty slot to create, drag an event to move it, or open People to see who is free on Wednesday. "}{" "}
        <button type="button" style={textButton} onClick={() => setSlow(!slow)}>
          {slow ? "Save at once" : "Save slowly"}
        </button>
      </div>
    </div>
  );
}
