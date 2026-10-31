import "../src/element";
import { FACE_STATES, type FaceGesture, type FaceState } from "../src/engine";
import type { AgentFace } from "../src/element";

const $ = <T extends HTMLElement>(selector: string) => document.querySelector(selector) as T;
const hero = $<AgentFace>("#hero");
const followers = [...document.querySelectorAll<AgentFace>("[data-follow]")];
const sized: AgentFace[] = [];
const GESTURES: FaceGesture[] = ["wave", "nod", "hop", "spin"];

function setState(state: FaceState): void {
  for (const face of [hero, ...followers, ...sized]) face.state = state;
  for (const button of document.querySelectorAll<HTMLButtonElement>("#states button")) button.setAttribute("aria-pressed", String(button.textContent === state));
}

function gesture(name: FaceGesture): void {
  for (const face of [hero, ...followers, ...sized]) face.playGesture(name);
}

for (const state of FACE_STATES) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = state;
  button.addEventListener("click", () => {
    stopSession();
    setState(state);
  });
  $("#states").append(button);
}
for (const name of GESTURES) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = name;
  button.addEventListener("click", () => gesture(name));
  $("#gestures").append(button);
}
for (const size of [16, 26, 64, 120, 160]) {
  const face = document.createElement("agent-face");
  face.setAttribute("size", String(size));
  sized.push(face);
  $("#sizes").append(face);
}
for (const state of FACE_STATES) {
  $("#all").insertAdjacentHTML("beforeend", `<figure><agent-face state="${state}" size="80" rest-after="4000"></agent-face><figcaption>${state}</figcaption></figure>`);
}
const everyFace = () => [...document.querySelectorAll("agent-face")];

const theme = $<HTMLSelectElement>("#theme");
theme.value = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const applyTheme = () => {
  document.documentElement.dataset.theme = theme.value;
};
theme.addEventListener("change", applyTheme);
applyTheme();

$<HTMLSelectElement>("#motion").addEventListener("change", (event) => {
  const value = (event.target as HTMLSelectElement).value;
  for (const face of everyFace()) face.setAttribute("motion", value);
});

const real = $<HTMLInputElement>("#real");
const amp = $<HTMLInputElement>("#amp");
const applyAmp = () => {
  amp.disabled = !real.checked;
  hero.amplitude = real.checked ? Number(amp.value) : null;
};
real.addEventListener("change", applyAmp);
amp.addEventListener("input", applyAmp);

const label = () => {
  $("#label").textContent = hero.shadowRoot!.querySelector("canvas")!.getAttribute("aria-label");
};
new MutationObserver(label).observe(hero.shadowRoot!.querySelector("canvas")!, { attributes: true, attributeFilter: ["aria-label"] });
label();

interface Beat {
  at: number;
  state?: FaceState;
  gesture?: FaceGesture;
  caption: string;
}
const SESSION: Beat[] = [
  { at: 0, state: "listening", caption: "You ask: what changed overnight?" },
  { at: 2500, state: "thinking", caption: "Donovan reads the monitoring alerts." },
  { at: 5000, state: "confused", caption: "Two sources disagree about the drift number." },
  { at: 6800, state: "thinking", caption: "Donovan checks the raw data." },
  { at: 9000, state: "speaking", caption: "Donovan explains what it found." },
  { at: 13000, state: "error", caption: "Posting the note fails: no write access." },
  { at: 15500, state: "listening", caption: "You grant access." },
  { at: 17500, state: "happy", gesture: "nod", caption: "The note is posted." },
  { at: 20000, state: "idle", caption: "Done." },
];
let timers: number[] = [];

function stopSession(): void {
  timers.forEach(clearTimeout);
  timers = [];
  $("#play").textContent = "Play";
}

$("#play").addEventListener("click", () => {
  if (timers.length) {
    stopSession();
    return;
  }
  $("#play").textContent = "Stop";
  timers = SESSION.map((beat, i) =>
    window.setTimeout(() => {
      if (beat.state) setState(beat.state);
      if (beat.gesture) gesture(beat.gesture);
      $("#caption").textContent = beat.caption;
      if (i === SESSION.length - 1) stopSession();
    }, beat.at),
  );
});

setState("idle");
