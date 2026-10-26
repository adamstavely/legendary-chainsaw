import type * as UI from "../../../../src/elements/react";

/** An album-style cover as an inline SVG data URL: gradient, a shape and the title */
function cover(title: string, a: string, b: string, shape: "circle" | "ring" | "bars" | "wave") {
  const art = {
    circle: `<circle cx="200" cy="230" r="120" fill="#fff" fill-opacity="0.22"/>`,
    ring: `<circle cx="200" cy="230" r="110" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="28"/>`,
    bars: [0, 1, 2, 3, 4].map((i) => `<rect x="${70 + i * 56}" y="${150 + (i % 2) * 50}" width="36" height="${200 - (i % 2) * 50}" rx="18" fill="#fff" fill-opacity="0.25"/>`).join(""),
    wave: `<path d="M0 260 C 80 180 140 340 200 260 S 320 180 400 260 V 600 H 0 Z" fill="#fff" fill-opacity="0.18"/>`,
  }[shape];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="600" fill="url(#g)"/>${art}<text x="32" y="540" font-family="Inter,system-ui,sans-serif" font-size="40" font-weight="700" fill="#fff">${title}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const ITEMS: UI.CoverFlowItem[] = [
  { id: 1, title: "Northern Lights", subtitle: "Aurora Bay", image: cover("Northern", "#0f766e", "#22d3ee", "wave") },
  { id: 2, title: "Late Bloom", subtitle: "The Gardeners", image: cover("Bloom", "#be185d", "#fb7185", "circle") },
  { id: 3, title: "Static Hearts", subtitle: "Night Signal", image: cover("Static", "#1e1b4b", "#6366f1", "bars") },
  { id: 4, title: "Golden Hour", subtitle: "Sol Rivera", image: cover("Golden", "#b45309", "#fbbf24", "ring") },
  { id: 5, title: "Deep Field", subtitle: "Orbit Club", image: cover("Deep Field", "#111827", "#7c3aed", "circle") },
  { id: 6, title: "Paper Planes", subtitle: "Kites & Co.", image: cover("Planes", "#0369a1", "#a5f3fc", "wave") },
  { id: 7, title: "Ember", subtitle: "Firewatch", image: cover("Ember", "#7f1d1d", "#f97316", "bars") },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CoverFlow } = ui;
  return (
    <div style={{ width: "100%" }}>
      <CoverFlow items={ITEMS} itemWidth={180} itemHeight={270} controls ticks aria-label="Albums" />
    </div>
  );
}
