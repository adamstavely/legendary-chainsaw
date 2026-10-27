import type * as UI from "@blocks/evidence-gallery";

// Stand-in images, drawn here so the demo needs no files: 4:3 SVG scenes
const svg = (body: string, bg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${bg}"/>${body}</svg>`)}`;

const dock = svg(
  `<rect x="40" y="70" width="320" height="200" fill="#3f4a56"/><rect x="70" y="100" width="120" height="170" fill="#8796a5"/><rect x="210" y="100" width="120" height="170" fill="#6b7a89"/>${Array.from({ length: 8 }, (_, i) => `<rect x="70" y="${108 + i * 20}" width="120" height="3" fill="#5d6b78"/>`).join("")}<rect x="230" y="210" width="60" height="45" fill="#c9a66b"/><rect x="0" y="270" width="400" height="30" fill="#24292e"/><text x="12" y="22" font-family="monospace" font-size="13" fill="#e5e7eb">CAM-02  06:12:44</text>`,
  "#1c2329",
);
const note = svg(
  `<rect x="70" y="24" width="260" height="262" fill="#fbfaf7" transform="rotate(-2 200 150)"/><g transform="rotate(-2 200 150)" fill="#9aa1a9">${Array.from({ length: 9 }, (_, i) => `<rect x="95" y="${70 + i * 18}" width="${i % 3 === 2 ? 120 : 200}" height="5"/>`).join("")}<rect x="95" y="44" width="110" height="9" fill="#4b5563"/></g><path d="M120 250c20-22 34 8 50-8s30 6 46-4" stroke="#1d4ed8" stroke-width="3" fill="none"/><circle cx="285" cy="235" r="26" fill="none" stroke="#b91c1c" stroke-width="3" opacity=".7"/>`,
  "#d7d2c8",
);
const damage = svg(
  `<rect x="60" y="60" width="280" height="190" fill="#c9a66b"/><rect x="60" y="60" width="280" height="30" fill="#b48f55"/><path d="M180 90l20 60-25 30 30 70" stroke="#5b4320" stroke-width="5" fill="none"/><path d="M230 140l35 15" stroke="#5b4320" stroke-width="4"/><rect x="250" y="190" width="70" height="40" fill="#f4f1ea"/><rect x="258" y="200" width="50" height="4" fill="#6b7280"/><rect x="258" y="210" width="36" height="4" fill="#6b7280"/>`,
  "#6d7b86",
);
const route = svg(
  `<path d="M0 210c80-30 140 20 220-10s120-60 180-40v140H0z" fill="#cfe3d4"/><path d="M0 90c60 20 120-20 200 0s140 30 200 10" stroke="#bccbd6" stroke-width="18" fill="none"/><path d="M60 240C120 200 150 150 210 140s110-50 140-90" stroke="#e2531f" stroke-width="4" fill="none" stroke-dasharray="10 6"/><circle cx="60" cy="240" r="9" fill="#1d4ed8"/><circle cx="350" cy="50" r="9" fill="#1d4ed8"/><rect x="225" y="122" width="74" height="20" rx="4" fill="#fff"/><text x="232" y="136" font-family="monospace" font-size="11" fill="#374151">gap 41 min</text>`,
  "#e7eef3",
);
const temps = svg(
  `<g stroke="#d1d5db">${Array.from({ length: 5 }, (_, i) => `<line x1="40" x2="380" y1="${60 + i * 50}" y2="${60 + i * 50}"/>`).join("")}</g><polyline points="40,200 80,195 120,198 160,190 200,192 240,140 280,120 320,170 360,185 380,188" fill="none" stroke="#0d9488" stroke-width="4"/><rect x="230" y="60" width="70" height="200" fill="#f59e0b" opacity=".15"/><text x="40" y="36" font-family="monospace" font-size="13" fill="#374151">Sensor 14 · °C</text>`,
  "#ffffff",
);
const door = svg(
  `<rect x="90" y="50" width="220" height="230" fill="#55606b"/>${Array.from({ length: 10 }, (_, i) => `<rect x="90" y="${58 + i * 22}" width="220" height="4" fill="#47515b"/>`).join("")}<rect x="0" y="280" width="400" height="20" fill="#2b3137"/><rect x="0" y="0" width="400" height="300" fill="#000" opacity=".25"/>`,
  "#20262c",
);

const ITEMS: UI.EvidenceItem[] = [
  { id: "dock", title: "Loading bay, camera 2", kind: "Photo", src: dock, alt: "Loading bay at dawn, both doors open, one pallet on the floor", attestation: "attested", claims: 3, source: "Site camera 2" },
  { id: "note", title: "Delivery note, signed", kind: "Scan", src: note, alt: "Signed delivery note with a red stamp in the corner", attestation: "attested", claims: 2, source: "Driver app" },
  { id: "damage", title: "Pallet damage, close-up", kind: "Photo", src: damage, alt: "Cardboard box with a long split down one side and a shipping label", attestation: "unverified", claims: 1, source: "Customer email" },
  { id: "route", title: "Route between depots", kind: "Map", src: route, alt: "Map of the route between two depots with a 41-minute gap marked", attestation: "attested", claims: 2, source: "Fleet tracker" },
  { id: "temps", title: "Temperature, 06:00–09:00", kind: "Chart", src: temps, alt: "Temperature line that rises sharply around 07:30, then falls back", attestation: "attested", claims: 1, source: "Cold-chain sensor 14" },
  { id: "door", title: "Dock door, before shift", kind: "Photo", src: door, alt: "", attestation: "failed", claims: 0, source: "Unknown upload" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EvidenceGallery } = ui;
  return <EvidenceGallery items={ITEMS} title="Evidence" subtitle="Claim 2291 · damaged cold-chain delivery" />;
}
