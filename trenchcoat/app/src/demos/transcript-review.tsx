import { useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TranscriptSegment, TranscriptSpeaker } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

/*
 * A support call recorded in Spanish with a machine translation. The recording is generated here – a soft tone that
 * rises and falls where each person speaks – so the demo needs no media file; the waveform's peaks come from the
 * same envelope.
 */

const SPEAKERS: TranscriptSpeaker[] = [
  { id: "marta", name: "Marta (support)", short: "M" },
  { id: "luis", name: "Luis Ortega", short: "LO" },
  { id: "andres", name: "Andrés (supervisor)", short: "A" },
];

const words = (text: string, low: string[]) => text.split(" ").map((w) => ({ text: w, confidence: low.includes(w) ? 0.41 : 0.9 }));

const CALL: TranscriptSegment[] = [
  { id: "c1", start: 0.4, end: 4.2, speaker: "marta", text: "Buenos días, le habla Marta del servicio de atención. ¿En qué puedo ayudarle?", translation: "Good morning, this is Marta from customer support. How can I help?", confidence: 0.96, translationConfidence: 0.94 },
  { id: "c2", start: 4.8, end: 9.6, speaker: "luis", text: "Hola, hice un pedido hace dos semanas y todavía no ha llegado.", translation: "Hi, I placed an order two weeks ago and it still hasn't arrived.", confidence: 0.91, translationConfidence: 0.9 },
  { id: "c3", start: 10, end: 13.2, speaker: "marta", text: "Lo siento mucho. ¿Me puede dar el número de pedido?", translation: "I'm very sorry. Can you give me the order number?", confidence: 0.95, translationConfidence: 0.93 },
  {
    id: "c4",
    start: 13.8,
    end: 18.4,
    speaker: "luis",
    text: "Sí, es el cuatro siete uno nueve… creo que termina en ochenta y dos.",
    translation: "Yes, it's four seven one nine… I think it ends in eighty-two.",
    confidence: 0.58,
    translationConfidence: 0.62,
    words: words("Sí, es el cuatro siete uno nueve… creo que termina en ochenta y dos.", ["nueve…", "ochenta", "dos."]),
  },
  { id: "c5", start: 19, end: 24.6, speaker: "marta", text: "Gracias. Veo que el paquete salió del almacén del norte el día doce, pero se quedó retenido en aduanas.", translation: "Thank you. The parcel left the northern warehouse on the 12th, but it was held at customs.", confidence: 0.88, translationConfidence: 0.81 },
  { id: "c6", start: 25, end: 28.2, speaker: "luis", text: "¿En aduanas? Nadie me avisó de eso.", translation: "At customs? Nobody told me about that.", confidence: 0.93, translationConfidence: 0.92 },
  { id: "c7", start: 28.8, end: 33, speaker: "andres", text: "Disculpe, soy Andrés, el supervisor. Le podemos enviar uno nuevo mañana sin coste.", translation: "Excuse me, I'm Andrés, the supervisor. We can send you a new one tomorrow at no cost.", confidence: 0.64, translationConfidence: 0.55 },
  { id: "c8", start: 33.4, end: 37, speaker: "luis", text: "Perfecto, pero quiero el reembolso del envío urgente.", translation: "Fine, but I want the express shipping refunded.", confidence: 0.69, translationConfidence: 0.74 },
  { id: "c9", start: 37.4, end: 41.6, speaker: "andres", text: "De acuerdo, se lo devolvemos en tres a cinco días hábiles.", translation: "Agreed, we'll refund it within three to five working days.", confidence: 0.9, translationConfidence: 0.86 },
];
const LENGTH = 42;
const PITCH: Record<string, number> = { marta: 220, luis: 150, andres: 180 };

/** How loud the call is at `t` seconds: syllable-like pulses inside each segment, silence between */
function loudness(t: number) {
  const s = CALL.find((x) => t >= x.start && t < x.end);
  if (!s) return 0;
  const edge = Math.min(1, (t - s.start) / 0.15, (s.end - t) / 0.15);
  const syllable = Math.abs(Math.sin(t * Math.PI * 2.3 + s.start * 3)) ** 1.5;
  const phrase = 0.55 + 0.45 * Math.sin(t * 1.3 + s.start);
  return Math.max(0, edge * (0.12 + 0.88 * syllable * phrase));
}

/** A small 8 kHz, 8-bit mono WAV of the call, as a data URI */
function callWav() {
  const rate = 8000;
  const n = LENGTH * rate;
  const bytes = new Uint8Array(44 + n);
  const view = new DataView(bytes.buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + n, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, n, true);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const s = CALL.find((x) => t >= x.start && t < x.end);
    const f = s ? PITCH[s.speaker] : 0;
    const v = f ? loudness(t) * 0.12 * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) : 0;
    bytes[44 + i] = 128 + Math.round(v * 127);
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const PEAKS = Array.from({ length: 400 }, (_, i) => {
  const t = (i / 400) * LENGTH;
  return loudness(t) * (0.75 + 0.25 * Math.sin(i * 1.7) ** 2);
});

const LINES = [
  ["Can you confirm the delivery address?", "¿Me confirma la dirección de entrega?"],
  ["The parcel is at the northern warehouse.", "El paquete está en el almacén del norte."],
  ["I'll check with the carrier now.", "Lo consulto ahora con el transportista."],
  ["Is the reference the same as before?", "¿La referencia es la misma que antes?"],
  ["We can refund the express shipping.", "Podemos reembolsar el envío urgente."],
  ["Thanks, that helps a lot.", "Gracias, eso me ayuda mucho."],
];
/** A long session: 5,000 segments, about four seconds each – no recording, so it plays from wherever you click */
function longSession(): TranscriptSegment[] {
  const ids = ["marta", "luis", "andres"];
  return Array.from({ length: 5000 }, (_, i) => {
    const [en, es] = LINES[(i * 7) % LINES.length];
    const conf = 0.5 + (((i * 37) % 50) / 100);
    return { id: `l${i}`, start: i * 4, end: i * 4 + 3.6, speaker: ids[(i * 5) % 3 === 2 && i % 4 ? 1 : i % 3], text: es, translation: en, confidence: conf, translationConfidence: Math.min(0.99, conf + 0.05) };
  });
}
const LONG_PEAKS = Array.from({ length: 2000 }, (_, i) => 0.25 + 0.6 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11)));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TranscriptReview } = ui;
  const [long, setLong] = useState(false);
  const [note, setNote] = useState("");
  const src = useMemo(() => (typeof btoa === "function" ? callWav() : ""), []);
  const segments = useMemo(() => (long ? longSession() : CALL), [long]);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <TranscriptReview
        key={long ? "long" : "call"}
        title={long ? "Support line – October" : "Customer call – delayed delivery"}
        description={long ? "5,000 segments · 5 h 33 min" : undefined}
        src={long ? undefined : src}
        duration={long ? 20_000 : LENGTH}
        peaks={long ? LONG_PEAKS : PEAKS}
        segments={segments}
        speakers={SPEAKERS}
        originalLabel="Spanish"
        translationLabel="English (machine)"
        defaultTranslationMode="both"
        defaultSent={long ? [] : ["c4"]}
        maxHeight={long ? 360 : 300}
        onVerify={(s) => setNote(`Sent ${s.id === "c4" ? "the order number" : `the segment at ${Math.floor(s.start / 60)}:${String(Math.floor(s.start % 60)).padStart(2, "0")}`} to verification.`)}
        onCopySegment={(_, text) => setNote(`Copied “${text.slice(0, 56)}${text.length > 56 ? "…" : ""}”`)}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ ...caption, minHeight: 16, flex: "1 1 200px" }}>{note || "Play the call, or click a segment. Try J, K and L, and search for “aduanas”."}</span>
        <button type="button" style={buttonSm} onClick={() => (setLong((b) => !b), setNote(""))}>
          {long ? "Back to the call" : "Load 5,000 segments"}
        </button>
      </div>
    </div>
  );
}
