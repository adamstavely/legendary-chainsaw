"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type Dispatch,
  type ReactNode,
  type Ref,
  type RefObject,
  type SetStateAction,
} from "react";
import { useControllable } from "../internal/use-controllable";
import { useOnScreen } from "../internal/use-on-screen";
import { useRootRef } from "../internal/use-root-ref";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";

/*
 * Agent Graph – agents and the tools they use, drawn as a living network, in a single self-contained file.
 * The lead agent sits in the middle, the agents it hands work to on an inner orbit, and the tools, data sources and you
 * on an outer orbit – each tool turned towards the agents that use it, so the links stay short and rarely cross.
 * Nodes are rounded squares and links straight lines with one right-angled turn, like the branches in Agent Tree: a tool
 * almost in line with its agent moves into line, and links sharing a side of a node run side by side, never on top of
 * each other.
 *   · every call sends a small pulse along its link – a solid dot out to the tool, a hollow one back with the answer;
 *     the node it reaches ripples once
 *   · links that are used a lot grow thicker, links that go quiet fade back
 *   · working agents breathe with a soft ring; an agent that waits for you turns amber, and its link to you with it;
 *     a failed call comes back red and flashes the link and the node
 *   · nodes glide to their new place when the graph changes – a new tool slides out of
 *     the agent that first calls it while its link draws itself, a tool that goes fades away
 *   · hover or focus a node to light up its neighbourhood – the rest dims; click it for a card with what it does,
 *     its latest calls and its cost
 *   · the bar on top counts agents, tools, calls per minute and the total cost
 * The layout is computed from the width (measured with a ResizeObserver): narrow containers get tighter orbits,
 * smaller nodes and short labels. The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (Standard by default). Clean is quiet: one white panel, white rounded squares with 0.5px hairlines,
 * Inter 400/500. Every link is the same light gray line – no thicker busy links – and a call is a short line that
 * fades out behind (blue out, green back with the answer) instead of a dot with a tail; a failed call flashes only the
 * link, and waiting and failed nodes get a light amber or red fill with a shine and a thin stroke running around.
 */

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-agg";

export type GraphNodeKind = "agent" | "tool" | "user";
export type GraphNodeStatus = "idle" | "working" | "waiting" | "error" | "done";

export type GraphNode = {
  id: string;
  name: string;
  /** "agent" sits on the inner orbit (the lead in the middle), "tool" and "user" on the outer one */
  kind: GraphNodeKind;
  /** A shorter name for narrow containers, e.g. "Search" for "Web search" */
  short?: string;
  /** A small mark, e.g. the model maker's or the tool's logo – defaults to the initials */
  icon?: ReactNode;
  /** One line under the name – the model of an agent, what a tool is */
  detail?: string;
  status?: GraphNodeStatus;
  /** What it is doing right now – shown in its card */
  doing?: string;
  /** What it has cost so far – summed up in the bar */
  cost?: number;
  /** The agent in the middle – defaults to the first agent */
  lead?: boolean;
};

export type GraphCall = {
  id: string;
  /** Who calls … */
  from: string;
  /** … and who is called – a tool, another agent, or you */
  to: string;
  /** What was asked, e.g. "search: pricing linear.app" */
  label?: string;
  /** "pending" sends the pulse out; once it turns "ok" or "error" the answer travels back */
  status?: "pending" | "ok" | "error";
  /** When it was made (ms) */
  at: number;
  /** How long it took (ms) */
  ms?: number;
};

type AgentGraphOwnProps = {
  /** Visual style: "standard" (the default) or "clean" */
  look?: Look;
  nodes: GraphNode[];
  /** Recent calls, newest last – every new id sends a pulse. Calls also draw the links they need */
  calls?: GraphCall[];
  /** Links that are always there, even before their first call */
  edges?: [string, string][];
  /** The clock for calls per minute and link heat, in epoch ms – defaults to an internal clock that ticks every second */
  now?: number;
  /** How far back calls make a link thicker (ms) – in the Clean look, where links keep one width, how far back calls count towards a link's activity */
  heatWindow?: number;
  /** A click on a node – it also opens its card; null when the card closes */
  onSelect?: (node: GraphNode | null) => void;
  /** The node whose card is open. Controlled when defined (null = none); otherwise the component keeps it, starting
   *  from `defaultSelected`. Changes are reported to `onSelectedChange` (and `onSelect`, with the node) */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string | null) => void;
  /** Fixed height of the graph in px – defaults to one that fits the width */
  height?: number;
  /** Formats every cost – defaults to dollars, e.g. "$0.42" */
  formatCost?: (amount: number) => string;
  /** Stops the moving parts – pulses, ripples, floating and the breathing rings – as the bar's Pause button does.
   *  Controlled when defined; otherwise the component keeps it, starting from `defaultPaused` */
  paused?: boolean;
  defaultPaused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  title?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AgentGraphProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentGraphOwnProps> & AgentGraphOwnProps;

/* ---------- Helpers ---------- */

const STATUS: Record<GraphNodeStatus, string> = { idle: "Idle", working: "Working", waiting: "Needs you", error: "Error", done: "Done" };
const KIND: Record<GraphNodeKind, string> = { agent: "agent", tool: "tool", user: "you" };
const dollars = (n: number) => `$${n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString("en-US")}`;
const took = (ms: number) => (ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`);
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const TAU = Math.PI * 2;
/** The circular mean of fractions of a turn */
const circMean = (us: number[]) => {
  let s = 0;
  let c = 0;
  for (const u of us) {
    s += Math.sin(u * TAU);
    c += Math.cos(u * TAU);
  }
  return (((Math.atan2(s, c) / TAU) % 1) + 1) % 1;
};

type Pt = { x: number; y: number };
/** 0 = the middle, 1 = the inner orbit, 2 = the outer orbit */
type Ring = 0 | 1 | 2;
type Spot = Pt & { ring: Ring };

/** A point on an ellipse at a share u of its length, starting at the top and going clockwise – so nodes sit evenly apart */
const ellipse = (cx: number, cy: number, rx: number, ry: number) => {
  const N = 240;
  const cum = [0];
  let px = cx;
  let py = cy - ry;
  for (let i = 1; i <= N; i++) {
    const t = -Math.PI / 2 + (i / N) * TAU;
    const x = cx + rx * Math.cos(t);
    const y = cy + ry * Math.sin(t);
    cum.push(cum[i - 1] + Math.hypot(x - px, y - py));
    px = x;
    py = y;
  }
  const total = cum[N] || 1;
  return (u: number): Pt => {
    const goal = (((u % 1) + 1) % 1) * total;
    let i = 1;
    while (i < N && cum[i] < goal) i++;
    const f = (goal - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    const t = -Math.PI / 2 + ((i - 1 + f) / N) * TAU;
    return { x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) };
  };
};

type Layout = {
  w: number;
  h: number;
  narrow: boolean;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** The inner orbit as a share of the outer one, across and down */
  ix: number;
  iy: number;
  lead?: string;
  spots: Map<string, Spot>;
  /** Diameter of every node */
  size: Map<string, number>;
  /** When each node pops in on the first draw – and when its links start drawing */
  pop: Map<string, number>;
  draw: Map<string, number>;
};

const SIZES = {
  wide: { lead: 56, agent: 46, tool: 34, user: 34 },
  narrow: { lead: 42, agent: 34, tool: 28, user: 28 },
};

/** Where every node goes: the lead in the middle, agents evenly on the inner orbit, the rest on the outer one near their agents */
const layOut = (nodes: GraphNode[], pairs: [string, string][], w: number, h: number): Layout => {
  const narrow = w < 520;
  const sz = narrow ? SIZES.narrow : SIZES.wide;
  const labelHalf = narrow ? 28 : 48;
  const toolR = sz.tool / 2;
  const padX = toolR + labelHalf;
  // Outer nodes in the top part carry their label above them (their links come from below), so the top needs label room too
  const padTop = toolR + (narrow ? 40 : 46);
  const padBottom = toolR + (narrow ? 40 : 46);
  const cx = w / 2;
  const rx = Math.max(40, w / 2 - padX);
  const ry = Math.max(40, (h - padTop - padBottom) / 2);
  const cy = padTop + ry;
  // Narrow graphs are taller than wide: the inner orbit gets narrower and taller, to keep clear of the tools at the sides
  const ix = narrow ? 0.5 : 0.5;
  const iy = narrow ? 0.64 : 0.5;
  const outerAt = ellipse(cx, cy, rx, ry);
  const innerAt = ellipse(cx, cy, rx * ix, ry * iy);

  const agents = nodes.filter((n) => n.kind === "agent");
  const lead = (agents.find((a) => a.lead) ?? agents[0])?.id;
  const ring = agents.filter((a) => a.id !== lead);
  const outer = nodes.filter((n) => n.kind !== "agent");
  const spots = new Map<string, Spot>();
  const size = new Map<string, number>();
  const pop = new Map<string, number>();
  const draw = new Map<string, number>();

  if (lead) {
    spots.set(lead, { x: cx, y: cy, ring: 0 });
    pop.set(lead, 0);
    draw.set(lead, -1);
  }
  const uOf = new Map<string, number>();
  ring.forEach((a, i) => {
    const u = ring.length === 1 ? 0.5 : (i + 0.5) / ring.length;
    uOf.set(a.id, u);
    spots.set(a.id, { ...innerAt(u), ring: 1 });
    draw.set(a.id, 140 + i * 90);
    pop.set(a.id, 140 + i * 90 + 260);
  });


  // Each outer node prefers the direction of the agents it talks to; then they share the orbit evenly, in that order
  const neighbours = new Map<string, string[]>();
  for (const [a, b] of pairs) {
    neighbours.set(a, [...(neighbours.get(a) ?? []), b]);
    neighbours.set(b, [...(neighbours.get(b) ?? []), a]);
  }
  const prefs = outer.map((n, i) => {
    const us = (neighbours.get(n.id) ?? []).map((id) => uOf.get(id)).filter((u): u is number => u !== undefined);
    const pref = us.length ? circMean(us) : n.kind === "user" ? 0 : (i + 0.5) / Math.max(1, outer.length);
    return { id: n.id, pref, i };
  });
  prefs.sort((a, b) => a.pref - b.pref || a.i - b.i);
  const m = prefs.length;
  if (m) {
    const offset = circMean(prefs.map((p, i) => p.pref - i / m));
    prefs.forEach((p, i) => {
      const u = offset + i / m;
      spots.set(p.id, { ...outerAt(u), ring: 2 });
    });
    // Popping in on the first draw: around the orbit, starting at the top
    [...prefs]
      .sort((a, b) => ((offset + prefs.indexOf(a) / m) % 1) - ((offset + prefs.indexOf(b) / m) % 1))
      .forEach((p, i) => {
        draw.set(p.id, 620 + i * 70);
        pop.set(p.id, 620 + i * 70 + 260);
      });
  }
  for (const n of nodes) size.set(n.id, n.id === lead ? sz.lead : sz[n.kind]);
  const snap = Math.min(96, w * 0.12);
  const room = narrow ? { x: 64, y: 76 } : { x: 96, y: 84 };
  // First, any outer node sitting on another node takes the nearest free spot – outwards first, then turning either way
  // around it (tight on phones, where the orbits are close)
  const free = (id: string, p: Pt) => [...spots].every(([o, q]) => o === id || Math.abs(q.x - p.x) > room.x * 0.8 || Math.abs(q.y - p.y) > room.y * 0.8);
  for (const n of outer) {
    const at = spots.get(n.id);
    if (!at || free(n.id, at)) continue;
    const out = Math.atan2(at.y - cy, at.x - cx);
    search: for (let r = 8; r <= 120; r += 8)
      for (const turn of [0, 0.5, -0.5, 1, -1, 1.6, -1.6]) {
        const p = { x: at.x + Math.cos(out + turn) * r, y: at.y + Math.sin(out + turn) * r };
        if (p.x < padX || p.x > w - padX || p.y < padTop || p.y > h - padBottom || !free(n.id, p)) continue;
        at.x = p.x;
        at.y = p.y;
        break search;
      }
  }
  // An outer node almost in line with its first agent moves into line, so its link runs straight, without a tiny jog
  for (const n of outer) {
    const at = spots.get(n.id);
    const near = (neighbours.get(n.id) ?? []).map((id) => spots.get(id));
    const ag = near.find((p) => p?.ring === 1) ?? near.find((p) => p?.ring === 0);
    if (!at || !ag) continue;
    // Only where it stays clear of every other node and its label
    const clear = (p: Pt) => [...spots].every(([id, q]) => id === n.id || Math.abs(q.x - p.x) > room.x || Math.abs(q.y - p.y) > room.y);
    // A few pixels off always snap – a tiny jog looks like a mistake
    const dx = Math.abs(at.x - ag.x);
    const dy = Math.abs(at.y - ag.y);
    if (dx < 8 || (dx < snap && clear({ x: ag.x, y: at.y }))) at.x = ag.x;
    else if (dy < 8 || (dy < snap && clear({ x: at.x, y: ag.y }))) at.y = ag.y;
  }
  return { w, h, narrow, cx, cy, rx, ry, ix, iy, lead, spots, size, pop, draw };
};

const f1 = (n: number) => Math.round(n * 10) / 10;
/** A link as drawn: its path, and a point at a share t of its length */
type Route = { d: string; at: (t: number) => Pt };
/** Straight lines with one right-angled turn, like a branch in Agent Tree: "vh" leaves the first point up or down and
 *  turns sideways into the second, "hv" the other way round – the corner rounded a little */
const CORNER = 8;
const squareRoute = (a: Pt, b: Pt, first: "vh" | "hv"): Route => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const r = Math.min(CORNER, Math.abs(dx), Math.abs(dy));
  if (Math.abs(dx) < 1 || Math.abs(dy) < 1 || r < 0.5) {
    const d = `M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}`;
    return { d, at: (t) => ({ x: a.x + dx * t, y: a.y + dy * t }) };
  }
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  const c: Pt = first === "vh" ? { x: a.x, y: b.y } : { x: b.x, y: a.y };
  const p1: Pt = first === "vh" ? { x: c.x, y: c.y - sy * r } : { x: c.x - sx * r, y: c.y };
  const p2: Pt = first === "vh" ? { x: c.x + sx * r, y: c.y } : { x: c.x, y: c.y + sy * r };
  const d = `M${f1(a.x)} ${f1(a.y)}L${f1(p1.x)} ${f1(p1.y)}Q${f1(c.x)} ${f1(c.y)} ${f1(p2.x)} ${f1(p2.y)}L${f1(b.x)} ${f1(b.y)}`;
  // The same path as a dense polyline, measured, so a pulse moves along it at an even speed
  const pts: Pt[] = [a, p1];
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    const u = 1 - t;
    pts.push({ x: u * u * p1.x + 2 * u * t * c.x + t * t * p2.x, y: u * u * p1.y + 2 * u * t * c.y + t * t * p2.y });
  }
  pts.push(b);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  return {
    d,
    at: (t) => {
      const goal = clamp(t, 0, 1) * total;
      let i = 1;
      while (i < pts.length - 1 && cum[i] < goal) i++;
      const f = (goal - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f };
    },
  };
};
type Side = "top" | "bottom" | "left" | "right";
type Turn = "vh" | "hv" | "v" | "h";
/** Every square link at once. Each picks its turn: from the lead up or down a trunk, then sideways into the agent; from an
 *  agent sideways when the tool lies further out, otherwise up or down first – and the other way round if that runs through a
 *  node. Then each side of a node spreads the links it has there side by side, centred on it, ordered so they never cross */
const squareLinks = (keys: string[], at: Map<string, Spot>, size: Map<string, number>, c: Pt, gap: number): Map<string, Route> => {
  type Plan = { key: string; p: Spot; q: Spot; turn: Turn; op: number; oq: number };
  type Port = { plan: Plan; end: "p" | "q"; order: number };
  const plans: Plan[] = [];
  const ports = new Map<string, Port[]>();
  const hits = (pts: Pt[], skip: string[]) => {
    let n = 0;
    for (const [id, s] of at) {
      if (skip.includes(id)) continue;
      const r = (size.get(id) ?? 34) / 2 + 6;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        if (Math.min(a.x, b.x) - r < s.x && s.x < Math.max(a.x, b.x) + r && Math.min(a.y, b.y) - r < s.y && s.y < Math.max(a.y, b.y) + r) n++;
      }
    }
    return n;
  };
  const addPort = (id: string, side: Side, port: Port) => {
    const k = `${id}:${side}`;
    ports.set(k, [...(ports.get(k) ?? []), port]);
  };
  for (const key of keys) {
    const [a, b] = key.split("|");
    const sa = at.get(a);
    const sb = at.get(b);
    if (!sa || !sb) continue;
    const inner = sa.ring < sb.ring || (sa.ring === sb.ring && a < b);
    const [pid, qid] = inner ? [a, b] : [b, a];
    const p = inner ? sa : sb;
    const q = inner ? sb : sa;
    let turn: Turn;
    if (Math.abs(q.x - p.x) < 1) turn = "v";
    else if (Math.abs(q.y - p.y) < 1) turn = "h";
    else {
      const out = Math.sign(q.x - p.x) === Math.sign(p.x - c.x) || Math.abs(p.x - c.x) < 1;
      const pref: Turn = p.ring === 0 ? "vh" : p.ring === q.ring || out ? "hv" : "vh";
      const other: Turn = pref === "vh" ? "hv" : "vh";
      const via = (t: Turn) => [p, t === "vh" ? { x: p.x, y: q.y } : { x: q.x, y: p.y }, q];
      turn = hits(via(pref), [pid, qid]) > hits(via(other), [pid, qid]) ? other : pref;
    }
    const plan: Plan = { key, p, q, turn, op: 0, oq: 0 };
    plans.push(plan);
    // The side each end sits on; along it, a link that turns sooner sits further out – towards where it turns
    const pUp = turn === "v" || turn === "vh";
    const qUp = turn === "v" || turn === "hv";
    const first = pUp ? Math.abs(q.y - p.y) : Math.abs(q.x - p.x);
    const second = pUp ? Math.abs(q.x - p.x) : Math.abs(q.y - p.y);
    const pDir = turn === "v" || turn === "h" ? 0 : pUp ? Math.sign(q.x - p.x) : Math.sign(q.y - p.y);
    const qDir = turn === "v" || turn === "h" ? 0 : qUp ? Math.sign(p.x - q.x) : Math.sign(p.y - q.y);
    addPort(pid, pUp ? (q.y > p.y ? "bottom" : "top") : q.x > p.x ? "right" : "left", { plan, end: "p", order: pDir * (1e5 - first) });
    addPort(qid, qUp ? (p.y > q.y ? "bottom" : "top") : p.x > q.x ? "right" : "left", { plan, end: "q", order: qDir * (1e5 - second) });
  }
  for (const [k, list] of ports) {
    if (list.length < 2) continue;
    const d = size.get(k.slice(0, k.lastIndexOf(":"))) ?? 34;
    const g = Math.min(gap, (d * 0.6) / (list.length - 1));
    list.sort((x, y) => x.order - y.order);
    list.forEach((pt, i) => {
      const o = (i - (list.length - 1) / 2) * g;
      if (pt.end === "p") pt.plan.op = o;
      else pt.plan.oq = o;
    });
  }
  const routes = new Map<string, Route>();
  for (const { key, p, q, turn, op, oq } of plans) {
    if (turn === "v") {
      const x = p.x + (op || oq);
      routes.set(key, squareRoute({ x, y: p.y }, { x, y: q.y }, "vh"));
    } else if (turn === "h") {
      const y = p.y + (op || oq);
      routes.set(key, squareRoute({ x: p.x, y }, { x: q.x, y }, "hv"));
    } else if (turn === "vh") routes.set(key, squareRoute({ x: p.x + op, y: p.y }, { x: q.x, y: q.y + oq }, "vh"));
    else routes.set(key, squareRoute({ x: p.x, y: p.y + op }, { x: q.x + oq, y: q.y }, "hv"));
  }
  return routes;
};
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/* ---------- Icons ---------- */

/* A small network: the title mark */
const GraphMark = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 8.4 3.2 4M8 8.4l5-4.2M8 8.4l4.4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    <circle cx="8" cy="8.4" r="2.4" fill="currentColor" />
    <circle cx="3.2" cy="4" r="1.6" fill="currentColor" />
    <circle cx="13" cy="4.2" r="1.6" fill="currentColor" />
    <circle cx="12.4" cy="12.4" r="1.6" fill="currentColor" />
  </svg>
);
/* user, x, arrow-right, arrow-left, check, and the marks of circle-alert and clock without their circle (the badge draws it): Lucide (ISC, lucide.dev) */
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
const OutIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
const InIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" strokeWidth="3.4" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 6v6l4 2" />
  </svg>
);
/* pause, play: Lucide (ISC, lucide.dev) */
const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="14" y="4" width="4" height="16" rx="1" />
    <rect x="6" y="4" width="4" height="16" rx="1" />
  </svg>
);
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5z" />
  </svg>
);
const Spinner = () => (
  <svg className="ui-agg__spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
    <path d="M12 3.5A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
  </svg>
);

/* ---------- The moving parts, kept outside React: positions, pulses, ripples ---------- */

type Body = { x: number; y: number; vx: number; vy: number };
type Pulse = {
  call: string;
  from: string;
  to: string;
  kind: "req" | "res" | "err" | "ask" | "askres";
  start: number;
  dur: number;
  /** For a request: how its call ended, once known – the answer leaves when the request arrives */
  then?: "ok" | "error";
  el?: SVGGElement;
  live?: boolean;
};
type Ripple = { node: string; kind: Pulse["kind"]; start: number; el?: SVGCircleElement | SVGRectElement };
type Flash = { el: Element; attr: string; until: number };

const SVGNS = "http://www.w3.org/2000/svg";
const EXIT = 420;
const RIPPLE = 720;

/* ---------- Hooks ---------- */

/** The stage's width (followed with a ResizeObserver) and whether motion is reduced */
function useStage(stageRef: RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(0);
  const [reduced, setReduced] = useState(false);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    setW(el.offsetWidth);
    const ro = new ResizeObserver(() => setW(el.offsetWidth));
    ro.observe(el);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener("change", onMq);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, [stageRef]);
  return { w, reduced };
}


/**
 * `now`, or the internal clock: it starts at 0 (the same on the server and the client), is set right after mount and
 * ticks every second while the graph is on screen – off screen or in a hidden tab it waits, and reads again on return
 */
function useClock(nowProp: number | undefined, onScreen: boolean) {
  const [tick, setTick] = useState(0);
  const own = nowProp === undefined;
  useEffect(() => {
    if (!own || !onScreen) return;
    const read = () => setTick(Date.now());
    read();
    const t = window.setInterval(read, 1000);
    return () => window.clearInterval(t);
  }, [own, onScreen]);
  return nowProp ?? tick;
}

/** Nodes on their way out stay a moment, to fade */
function useLeaving(nodes: GraphNode[]) {
  const prevNodes = useRef(new Map<string, GraphNode>());
  const [ghosts, setGhosts] = useState<GraphNode[]>([]);
  const ids = new Set(nodes.map((n) => n.id));
  const leaving = ghosts.filter((g) => !ids.has(g.id));
  useLayoutEffect(() => {
    const prev = prevNodes.current;
    prevNodes.current = new Map(nodes.map((n) => [n.id, n]));
    const gone = [...prev.values()].filter((n) => !prevNodes.current.has(n.id));
    if (!gone.length) return;
    const goneIds = new Set(gone.map((g) => g.id));
    setGhosts((gs) => [...gs.filter((g) => !goneIds.has(g.id)), ...gone]);
    window.setTimeout(() => setGhosts((gs) => gs.filter((g) => !goneIds.has(g.id))), EXIT + 40);
  }, [nodes]);
  return { ids, leaving };
}

type CallIndex = {
  /** Calls per link in the last heatWindow ms, and the latest of them */
  heat: Map<string, { n: number; last: number }>;
  hottest: number;
  perMinute: number;
  /** A node's latest four calls, newest first */
  recentOf: (id: string) => GraphCall[];
  /** A node's calls in the last minute */
  minuteOf: (id: string) => GraphCall[];
};

/** One pass over the history when it (or the clock) changes: link heat, calls per minute and every node's calls */
function indexCalls(calls: GraphCall[], now: number, heatWindow: number): CallIndex {
  const heat = new Map<string, { n: number; last: number }>();
  const byNode = new Map<string, GraphCall[]>();
  const file = (id: string, c: GraphCall) => {
    const list = byNode.get(id);
    if (list) list.push(c);
    else byNode.set(id, [c]);
  };
  let perMinute = 0;
  for (const c of calls) {
    if (c.at > now) continue;
    if (c.at > now - 60000) perMinute++;
    const k = pairKey(c.from, c.to);
    const e = heat.get(k) ?? { n: 0, last: 0 };
    if (c.at > now - heatWindow) e.n++;
    e.last = Math.max(e.last, c.at);
    heat.set(k, e);
    file(c.from, c);
    if (c.to !== c.from) file(c.to, c);
  }
  const hottest = Math.max(1, ...[...heat.values()].map((e) => e.n));
  const minute = new Map<string, GraphCall[]>();
  return {
    heat,
    hottest,
    perMinute,
    recentOf: (id) => (byNode.get(id) ?? []).slice(-4).reverse(),
    minuteOf: (id) => {
      let list = minute.get(id);
      if (!list) minute.set(id, (list = (byNode.get(id) ?? []).filter((c) => c.at > now - 60000)));
      return list;
    },
  };
}

/**
 * The engine: one frame loop for floating, gliding, pulses and ripples – all written straight to the DOM, outside React.
 * New calls send pulses; finished ones send the answer back.
 */
function useGraphEngine({
  layout,
  pairs,
  byId,
  calls,
  now,
  reduced,
  look,
  cardId,
  stageRef,
}: {
  layout: Layout;
  pairs: [string, [string, string]][];
  byId: Map<string, GraphNode>;
  calls: GraphCall[];
  now: number;
  reduced: boolean;
  look: Look;
  cardId: string;
  stageRef: RefObject<HTMLDivElement | null>;
}) {
  const pulseRef = useRef<SVGGElement>(null);
  const nodeEls = useRef(new Map<string, HTMLDivElement>());
  const edgeEls = useRef(new Map<string, SVGPathElement>());
  const eng = useRef({
    bodies: new Map<string, Body>(),
    drawn: new Map<string, Spot>(),
    rings: new Map<string, Ring>(),
    pulses: [] as Pulse[],
    ripples: [] as Ripple[],
    flashes: [] as Flash[],
    arrived: new Set<string>(),
    live: new Map<string, number>(),
    readyAt: 0,
    /** Numbers the Clean streaks' gradients */
    seq: 0,
  });
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const pairsRef = useRef(pairs);
  pairsRef.current = pairs;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const step = (t: number, dt: number) => {
    const E = eng.current;
    const L = layoutRef.current;
    if (!L.w) return;
    if (!E.readyAt) E.readyAt = t;
    const still = reducedRef.current;
    const w0 = 7; // spring: about 0.6s to settle, no overshoot
    for (const [id, el] of nodeEls.current) {
      const target = L.spots.get(id);
      let b = E.bodies.get(id);
      if (!b) {
        // A node that arrives later slides out of the first neighbour that is already there
        let from: Pt | undefined = target;
        if (t - E.readyAt > 200 && !still) {
          for (const [, [p, q]] of pairsRef.current) {
            const other = p === id ? q : q === id ? p : null;
            const at = other ? E.drawn.get(other) : undefined;
            if (at) {
              from = at;
              break;
            }
          }
        }
        if (!from) continue;
        b = { x: from.x, y: from.y, vx: 0, vy: 0 };
        E.bodies.set(id, b);
      }
      if (target) {
        if (still) {
          b.x = target.x;
          b.y = target.y;
          b.vx = b.vy = 0;
        } else if (dt > 0) {
          b.vx += (w0 * w0 * (target.x - b.x) - 2 * w0 * b.vx) * dt;
          b.vy += (w0 * w0 * (target.y - b.y) - 2 * w0 * b.vy) * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
        }
      }
      const x = b.x;
      const y = b.y;
      E.drawn.set(id, { x, y, ring: E.rings.get(id) ?? 2 });
      el.style.transform = `translate3d(${f1(x)}px, ${f1(y)}px, 0)`;
    }
    for (const id of [...E.bodies.keys()]) {
      if (nodeEls.current.has(id)) continue;
      E.bodies.delete(id);
      E.drawn.delete(id);
    }

    const c = { x: L.cx, y: L.cy };
    const routes = squareLinks([...edgeEls.current.keys()], E.drawn, L.size, c, L.narrow ? 6 : 8);
    const curve = (a: string, b: string): Route | null => routes.get(pairKey(a, b)) ?? null;
    for (const [key, el] of edgeEls.current) {
      const [a, b] = key.split("|");
      const bz = curve(a, b);
      if (bz) el.setAttribute("d", bz.d);
    }

    // Pulses: out along the link, then the answer back
    const layer = pulseRef.current;
    const keep: Pulse[] = [];
    for (const p of E.pulses) {
      const pa = E.drawn.get(p.from);
      const pb = E.drawn.get(p.to);
      const k = pairKey(p.from, p.to);
      const edge = edgeEls.current.get(k);
      if (!pa || !pb || !layer || !edge) {
        p.el?.remove();
        if (p.live) unlive(k);
        continue;
      }
      if (!p.dur) p.dur = clamp((Math.hypot(pb.x - pa.x, pb.y - pa.y) * 1.15) / 0.3, 520, 1200);
      const prog = (t - p.start) / p.dur;
      if (prog < 0) {
        keep.push(p);
        continue;
      }
      if (!p.el) {
        p.el = look === "clean" ? streak(cardId, ++E.seq) : dot(p.kind);
        p.el.setAttribute("class", "ui-agg__pulse");
        p.el.setAttribute("data-kind", p.kind);
        layer.appendChild(p.el);
        p.live = true;
        E.live.set(k, (E.live.get(k) ?? 0) + 1);
        edge.setAttribute("data-live", "");
      }
      if (prog >= 1) {
        p.el.remove();
        unlive(k);
        arrive(p, t);
        continue;
      }
      const bz = curve(p.from, p.to)!;
      const fwd = pa.ring < pb.ring || (pa.ring === pb.ring && p.from < p.to);
      movePulse(p.el, bz, fwd, prog, Math.hypot(pb.x - pa.x, pb.y - pa.y));
      keep.push(p);
    }
    E.pulses = keep;

    // Ripples where a pulse lands – they follow the floating node
    const rip: Ripple[] = [];
    for (const r of E.ripples) {
      const at = E.drawn.get(r.node);
      const prog = (t - r.start) / RIPPLE;
      if (!at || prog >= 1 || !layer) {
        r.el?.remove();
        continue;
      }
      if (!r.el) {
        r.el = document.createElementNS(SVGNS, "rect");
        r.el.setAttribute("class", "ui-agg__ripple");
        r.el.setAttribute("data-kind", r.kind);
        layer.appendChild(r.el);
      }
      const R = (L.size.get(r.node) ?? 34) / 2;
      const e = easeOut(prog);
      r.el.setAttribute("cx", String(f1(at.x)));
      r.el.setAttribute("cy", String(f1(at.y)));
      const rr = R + 1 + e * (L.narrow ? 9 : 13);
      r.el.setAttribute("r", String(f1(rr)));
      if (r.el.tagName === "rect") {
        r.el.setAttribute("x", String(f1(at.x - rr)));
        r.el.setAttribute("y", String(f1(at.y - rr)));
        r.el.setAttribute("width", String(f1(rr * 2)));
        r.el.setAttribute("height", String(f1(rr * 2)));
        r.el.setAttribute("rx", String(f1(R * 0.5 + 1 + e * 4)));
      }
      r.el.style.opacity = String(0.55 * (1 - e));
      rip.push(r);
    }
    E.ripples = rip;

    E.flashes = E.flashes.filter((f) => {
      if (t < f.until) return true;
      f.el.removeAttribute(f.attr);
      return false;
    });
  };

  const unlive = (k: string) => {
    const E = eng.current;
    const n = (E.live.get(k) ?? 1) - 1;
    if (n > 0) E.live.set(k, n);
    else {
      E.live.delete(k);
      edgeEls.current.get(k)?.removeAttribute("data-live");
    }
  };
  const flash = (el: Element | undefined, attr: string, until: number) => {
    if (!el) return;
    el.setAttribute(attr, "");
    eng.current.flashes.push({ el, attr, until });
  };
  const arrive = (p: Pulse, t: number) => {
    const E = eng.current;
    E.ripples.push({ node: p.to, kind: p.kind, start: t });
    if (p.kind === "err") {
      flash(edgeEls.current.get(pairKey(p.from, p.to)), "data-error", t + 1500);
      // Standard flashes the node too; Clean only the link
      if (look === "standard") flash(nodeEls.current.get(p.to), "data-flash", t + 1500);
    }
    if (p.kind === "req" || p.kind === "ask") {
      if (p.then) answer(p.call, p.to, p.from, p.then, t + 90);
      else {
        E.arrived.add(p.call);
        if (E.arrived.size > 400) E.arrived.delete(E.arrived.values().next().value as string);
      }
    }
  };
  /** The answer travels back from the called node to the caller */
  const answer = (call: string, from: string, to: string, status: "ok" | "error", start: number) => {
    const user = byIdRef.current.get(from)?.kind === "user";
    eng.current.pulses.push({ call, from, to, kind: status === "error" ? "err" : user ? "askres" : "res", start, dur: 0 });
  };
  const byIdRef = useRef(byId);
  byIdRef.current = byId;

  const stepRef = useRef(step);
  stepRef.current = step;

  // The frame loop runs while the graph is on screen – not at all with reduced motion
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const loop = (t: number) => {
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
      last = t;
      stepRef.current(t, dt);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      wake();
    });
    if (stageRef.current) io.observe(stageRef.current);
    document.addEventListener("visibilitychange", wake);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [reduced, stageRef]);

  // After every render: new nodes and links get their place before they are painted
  useLayoutEffect(() => {
    for (const [id, s] of layoutRef.current.spots) eng.current.rings.set(id, s.ring);
    stepRef.current(performance.now(), 0);
  });

  const seen = useRef<Map<string, string> | null>(null);
  useLayoutEffect(() => {
    const first = seen.current === null;
    if (first) seen.current = new Map();
    const s = seen.current!;
    const t = performance.now();
    const E = eng.current;
    for (const c of calls) {
      const st = c.status ?? "ok";
      const prev = s.get(c.id);
      if (prev === st || (!first && c.at > now + 1)) continue;
      s.set(c.id, st);
      // Only fresh calls travel – old ones that show up again (or the history on the first draw) just count
      if (first || (prev === undefined && c.at < now - 4000)) continue;
      const k = pairKey(c.from, c.to);
      if (reduced) {
        // No travelling dots: the link lights up instead
        const el = edgeEls.current.get(k);
        flash(el, "data-live", t + 900);
        if (st === "error") flash(el, "data-error", t + 1500);
        window.setTimeout(() => stepRef.current(performance.now(), 0), 1600);
        continue;
      }
      if (prev === undefined) {
        const toUser = byId.get(c.to)?.kind === "user";
        E.pulses.push({ call: c.id, from: c.from, to: c.to, kind: toUser ? "ask" : "req", start: t, dur: 0, then: st === "pending" ? undefined : (st as "ok" | "error") });
      } else {
        const out = E.pulses.find((p) => p.call === c.id && (p.kind === "req" || p.kind === "ask"));
        if (out) out.then = st as "ok" | "error";
        else answer(c.id, c.to, c.from, st as "ok" | "error", t);
      }
    }
    if (s.size > calls.length * 2 + 100) {
      const live = new Set(calls.map((c) => c.id));
      for (const k of [...s.keys()]) if (!live.has(k)) s.delete(k);
    }
  }, [calls]); // eslint-disable-line react-hooks/exhaustive-deps

  return { pulseRef, nodeEls, edgeEls };
}

/** Clean: a short line along the link, full color at the front and fading to nothing behind */
const streak = (cardId: string, seq: number) => {
  const g = document.createElementNS(SVGNS, "g");
  const grad = document.createElementNS(SVGNS, "linearGradient");
  grad.id = `${cardId.replace(/:/g, "")}-s${seq}`;
  grad.setAttribute("gradientUnits", "userSpaceOnUse");
  for (const [offset, opacity] of [
    ["0", "0"],
    ["1", "1"],
  ]) {
    const stop = document.createElementNS(SVGNS, "stop");
    stop.setAttribute("offset", offset);
    stop.setAttribute("stop-opacity", opacity);
    stop.setAttribute("class", "ui-agg__stop");
    grad.appendChild(stop);
  }
  // The same line once more underneath, wider and blurred – a light glow in its own color
  const glow = document.createElementNS(SVGNS, "path");
  glow.setAttribute("class", "ui-agg__streak-glow");
  glow.setAttribute("stroke", `url(#${grad.id})`);
  glow.setAttribute("filter", `url(#${cardId}-blur)`);
  const line = document.createElementNS(SVGNS, "path");
  line.setAttribute("class", "ui-agg__streak");
  line.setAttribute("stroke", `url(#${grad.id})`);
  g.append(grad, glow, line);
  return g;
};

/** Standard: a dot with a tail – solid out to the tool, hollow back with the answer */
const dot = (kind: Pulse["kind"]) => {
  const g = document.createElementNS(SVGNS, "g");
  const hollow = kind === "res" || kind === "askres" || kind === "err";
  const glow = document.createElementNS(SVGNS, "circle");
  glow.setAttribute("r", "8");
  glow.setAttribute("class", "ui-agg__glow");
  g.appendChild(glow);
  const tails = hollow ? [1.7, 1.3, 0.9] : [3, 2.4, 1.8, 1.2];
  tails.forEach((r, i) => {
    const d = document.createElementNS(SVGNS, "circle");
    d.setAttribute("r", String(r));
    d.setAttribute("class", "ui-agg__tail");
    d.style.opacity = String((hollow ? [0.45, 0.28, 0.14] : [0.5, 0.34, 0.2, 0.1])[i]);
    g.appendChild(d);
  });
  const head = document.createElementNS(SVGNS, "circle");
  head.setAttribute("r", hollow ? "3.4" : "3.8");
  head.setAttribute("class", "ui-agg__head");
  g.appendChild(head);
  return g;
};

/** Moves a pulse to `prog` of its way along the link – a Clean streak (gradient, glow, line) or a Standard dot with its tail */
const movePulse = (el: SVGGElement, bz: Route, fwd: boolean, prog: number, dist: number) => {
  const e = easeInOut(prog);
  if (el.firstElementChild?.tagName === "linearGradient") {
    // About 36px of the link behind the front, shorter at the very start
    const span = Math.min(0.3, 36 / (dist * 1.15 || 1));
    const head = e * (1 + span);
    const tail = Math.max(0, head - span);
    const front = Math.min(1, head);
    const pts: Pt[] = [];
    for (let i = 0; i <= 16; i++) {
      const q = tail + ((front - tail) * i) / 16;
      pts.push(bz.at(fwd ? q : 1 - q));
    }
    const [grad, glow, line] = el.children as unknown as [SVGLinearGradientElement, SVGPathElement, SVGPathElement];
    const d = "M" + pts.map((pt) => `${f1(pt.x)} ${f1(pt.y)}`).join("L");
    line.setAttribute("d", d);
    glow.setAttribute("d", d);
    grad.setAttribute("x1", String(f1(pts[0].x)));
    grad.setAttribute("y1", String(f1(pts[0].y)));
    grad.setAttribute("x2", String(f1(pts[16].x)));
    grad.setAttribute("y2", String(f1(pts[16].y)));
    el.style.opacity = String(Math.min(1, prog * 7, (1 - prog) * 4));
  } else {
    const kids = el.children;
    const n = kids.length - 1;
    for (let i = 0; i <= n; i++) {
      // The glow (first) and the head (last) ride together; the tail dots trail behind
      const lag = i === n || i === 0 ? 0 : i * 0.03;
      const q = clamp(e - lag, 0, 1);
      const pt = bz.at(fwd ? q : 1 - q);
      kids[i].setAttribute("cx", String(f1(pt.x)));
      kids[i].setAttribute("cy", String(f1(pt.y)));
    }
    el.style.opacity = String(Math.min(1, prog * 7, (1 - prog) * 7));
  }
};

/* ---------- Parts ---------- */

type NodeViewProps = {
  n: GraphNode;
  layout: Layout;
  look: Look;
  gone: boolean;
  dim: boolean;
  isOpen: boolean;
  hovered: boolean;
  /** When it grows in on the first draw (ms) */
  delay: number;
  /** Its calls in the last minute */
  count: number;
  cardId: string;
  nodeEls: Map<string, HTMLDivElement>;
  setHover: Dispatch<SetStateAction<string | null>>;
  onToggle: () => void;
};

/** One node: its rounded square, the breathing ring, a badge and its label – moved by the engine, not by React */
function NodeView({ n, layout, look, gone, dim, isOpen, hovered, delay, count, cardId, nodeEls, setHover, onToggle }: NodeViewProps) {
  const D = layout.size.get(n.id) ?? 34;
  const isLead = n.id === layout.lead;
  const narrow = layout.narrow;
  const label = narrow ? (n.short ?? n.name) : n.name;
  const status = n.status ?? "idle";
  // Narrow graphs keep one line per label – the badge and the chip in the bar still tell waiting and failed apart
  const line = n.kind !== "agent" || narrow ? undefined : status === "waiting" || status === "error" ? STATUS[status] : n.detail;
  const spot = layout.spots.get(n.id);
  // Labels sit where the links aren't: above outer nodes at the top (their links come from below), and – when narrow –
  // above the upper agents too, so they keep clear of the lead
  const above = !!spot && (n.kind !== "agent" ? spot.y < layout.cy - layout.ry * 0.45 : narrow && spot.ring === 1 && spot.y < layout.cy);
  return (
    <div
      className="ui-agg__node"
      data-kind={n.kind}
      data-lead={isLead ? "" : undefined}
      data-status={status}
      data-leaving={gone ? "" : undefined}
      data-dim={dim ? "" : undefined}
      data-open={isOpen ? "" : undefined}
      style={{ ["--d" as string]: `${D}px`, zIndex: isOpen || hovered ? 3 : isLead ? 2 : 1 }}
      ref={(el) => {
        if (el) nodeEls.set(n.id, el);
        else nodeEls.delete(n.id);
      }}
    >
      <div className="ui-agg__body" style={{ animationDelay: `${delay}ms` }}>
        <span className="ui-agg__ring" aria-hidden="true" />
        <button
          type="button"
          className="ui-agg__disc"
          data-agg-node=""
          data-logo={n.icon ? "" : undefined}
          tabIndex={gone ? -1 : undefined}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? cardId : undefined}
          onPointerEnter={(e) => e.pointerType === "mouse" && setHover(n.id)}
          onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
          onFocus={() => setHover(n.id)}
          onBlur={() => setHover((h) => (h === n.id ? null : h))}
          onClick={onToggle}
        >
          {/* The name comes from this text, not an aria-label, so the visible initials never contradict it */}
          <span className="ui-agg__sr">{`${n.name}, ${KIND[n.kind]}${n.status ? `, ${STATUS[status].toLowerCase()}` : ""}${n.doing ? `: ${n.doing}` : ""}. ${count} ${count === 1 ? "call" : "calls"} in the last minute`}</span>
          <span className="ui-agg__face" aria-hidden="true">
            {n.icon ?? (n.kind === "user" ? <UserIcon /> : <span className="ui-agg__initials">{initials(n.name)}</span>)}
          </span>
        </button>
        {look === "clean" && <span className="ui-agg__stroke" aria-hidden="true" />}
        {look === "clean" && (status === "waiting" || status === "error") && <span className="ui-agg__shine" aria-hidden="true" />}
        {(status === "waiting" || status === "error" || status === "done") && n.kind === "agent" && (
          <span className="ui-agg__badge" data-status={status} aria-hidden="true">
            {status === "waiting" ? <ClockIcon /> : status === "error" ? <AlertIcon /> : <CheckIcon />}
          </span>
        )}
        <span className="ui-agg__label" data-above={above ? "" : undefined} aria-hidden="true">
          <span className="ui-agg__name">{label}</span>
          {line && (
            <span className="ui-agg__line" data-status={status === "waiting" || status === "error" ? status : undefined}>
              {line}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

type NodeCardProps = {
  n: GraphNode;
  cardId: string;
  cardRef: RefObject<HTMLDivElement | null>;
  recent: GraphCall[];
  count: number;
  /** Who it works with (agents) or is used by (tools) */
  users: GraphNode[];
  byId: Map<string, GraphNode>;
  formatCost: (amount: number) => string;
  /** Closes the card and puts focus back where it was before it opened */
  onClose: () => void;
};

/** The card of the open node: what it does, its latest calls and its cost */
function NodeCard({ n, cardId, cardRef, recent, count, users, byId, formatCost, onClose }: NodeCardProps) {
  const status = n.status ?? "idle";
  return (
    <div
      ref={cardRef}
      id={cardId}
      className="ui-agg__card"
      role="dialog"
      aria-label={n.name}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="ui-agg__card-head">
        <span className="ui-agg__card-icon" data-kind={n.kind}>
          {n.icon ?? (n.kind === "user" ? <UserIcon /> : initials(n.name))}
        </span>
        <span className="ui-agg__card-who">
          <span className="ui-agg__card-name">{n.name}</span>
          {n.detail && <span className="ui-agg__card-detail">{n.detail}</span>}
        </span>
        {n.status && (
          <span className="ui-agg__pill" data-status={status}>
            {STATUS[status]}
          </span>
        )}
        <button type="button" className="ui-agg__close" aria-label="Close" autoFocus onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {n.doing ? (
        <p className="ui-agg__doing">{n.doing}</p>
      ) : (
        users.length > 0 && (
          <p className="ui-agg__doing">
            {n.kind === "agent" ? "Works with " : "Used by "}
            {users.map((u) => u.name).join(", ")}
          </p>
        )
      )}
      {recent.length > 0 && (
        <ul className="ui-agg__calls" aria-label="Latest calls">
          {recent.map((c) => {
            const out = c.from === n.id;
            const other = byId.get(out ? c.to : c.from);
            const st = c.status ?? "ok";
            return (
              <li key={c.id} className="ui-agg__call" data-status={st}>
                <span className="ui-agg__call-dir">
                  {out ? <OutIcon /> : <InIcon />}
                  <span className="ui-agg__sr">{out ? "To" : "From"}</span>
                </span>
                <span className="ui-agg__call-icon" aria-hidden="true">
                  {other?.icon ?? (other?.kind === "user" ? <UserIcon /> : initials(other?.name ?? "?"))}
                </span>
                <span className="ui-agg__call-text">
                  <span className="ui-agg__call-who">{other?.name ?? (out ? c.to : c.from)}</span>
                  {c.label && <span className="ui-agg__call-label"> · {c.label}</span>}
                </span>
                <span className="ui-agg__call-end">{st === "pending" ? <Spinner /> : st === "error" ? "Failed" : c.ms !== undefined ? took(c.ms) : "OK"}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="ui-agg__card-foot">
        {n.cost !== undefined && <span className="ui-agg__card-cost">{formatCost(n.cost)}</span>}
        <span>
          {count} {count === 1 ? "call" : "calls"} in the last minute
        </span>
      </div>
    </div>
  );
}

/** The chips in the bar: who needs you, who failed – a click opens its card. Announced by the status line in the bar,
 *  which is there from the start, not by these chips coming and going */
function Alerts({ waiting, failed, narrow, onPick }: { waiting: GraphNode[]; failed: GraphNode[]; narrow: boolean; onPick: (id: string) => void }) {
  if (!waiting.length && !failed.length) return null;
  return (
    <div className="ui-agg__alerts">
      {(narrow ? waiting.slice(0, 1) : waiting).map((n) => (
        <button key={n.id} type="button" className="ui-agg__chip" data-kind="waiting" onClick={() => onPick(n.id)}>
          <ClockIcon />
          {narrow ? (waiting.length > 1 ? `${waiting.length} need you` : "Needs you") : `${n.short ?? n.name} needs you`}
        </button>
      ))}
      {(narrow ? failed.slice(0, 1) : failed).map((n) => (
        <button key={n.id} type="button" className="ui-agg__chip" data-kind="error" onClick={() => onPick(n.id)}>
          <AlertIcon />
          {narrow ? "Failed" : `${n.short ?? n.name} failed`}
        </button>
      ))}
    </div>
  );
}

const CLEAN_LEGEND = [
  ["call", "Call"],
  ["answer", "Answer"],
  ["ask", "Needs you"],
  ["error", "Failed"],
] as const;

/** What the marks mean – Clean streaks tell apart by color, Standard by dot, line and ring */
function Legend({ look, cardId }: { look: Look; cardId: string }) {
  return (
    <div className="ui-agg__legend" aria-hidden="true">
      {look === "clean" ? (
        CLEAN_LEGEND.map(([kind, label]) => (
          <span key={kind}>
            <svg width="20" height="8" viewBox="0 0 20 8">
              <defs>
                {/* In user space – a flat line has no height, so a bounding-box gradient would paint nothing */}
                <linearGradient id={`${cardId.replace(/:/g, "")}-lg-${kind}`} gradientUnits="userSpaceOnUse" x1="2" y1="4" x2="18" y2="4">
                  <stop offset="0" stopOpacity="0" className="ui-agg__legend-stop" data-kind={kind} />
                  <stop offset="1" className="ui-agg__legend-stop" data-kind={kind} />
                </linearGradient>
              </defs>
              <path d="M2 4H18" className="ui-agg__legend-streak" stroke={`url(#${cardId.replace(/:/g, "")}-lg-${kind})`} />
            </svg>
            {label}
          </span>
        ))
      ) : (
        <>
          <span>
            <svg width="22" height="8" viewBox="0 0 22 8">
              <circle cx="4" cy="4" r="1.1" className="ui-agg__legend-tail" opacity="0.2" />
              <circle cx="9" cy="4" r="1.8" className="ui-agg__legend-tail" opacity="0.4" />
              <circle cx="16" cy="4" r="3.2" className="ui-agg__legend-call" />
            </svg>
            Call
          </span>
          <span>
            <svg width="12" height="8" viewBox="0 0 12 8">
              <circle cx="6" cy="4" r="3" className="ui-agg__legend-reply" />
            </svg>
            Answer
          </span>
          <span>
            <svg width="22" height="8" viewBox="0 0 22 8">
              <path d="M1 4H21" className="ui-agg__legend-line" strokeWidth="3.5" />
            </svg>
            Busier link
          </span>
          <span>
            <svg width="10" height="8" viewBox="0 0 10 8">
              <circle cx="5" cy="4" r="3.5" className="ui-agg__legend-wait" />
            </svg>
            Needs you
          </span>
        </>
      )}
    </div>
  );
}

/* ---------- The graph ---------- */

export function AgentGraph({
  look,
  nodes,
  calls = [],
  edges = [],
  now: nowProp,
  heatWindow = 20000,
  onSelect,
  selected,
  defaultSelected = null,
  onSelectedChange,
  height,
  formatCost = dollars,
  paused: pausedProp,
  defaultPaused = false,
  onPausedChange,
  title = "Agent graph",
  className,
  ref,
  ...rest
}: AgentGraphProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rootRefs = useRootRef(rootRef, ref);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardId = useId();
  const resolvedLook = look ?? DEFAULT_LOOK;
  const { w, reduced: prefersReduced } = useStage(stageRef);
  const [paused, setPaused] = useControllable(pausedProp, defaultPaused, onPausedChange, "paused");
  // Paused stops the frame loop exactly as reduced motion does: calls light their link instead of sending pulses
  const reduced = prefersReduced || paused;
  const onScreen = useOnScreen(stageRef);
  const now = useClock(nowProp, onScreen);

  const { ids, leaving } = useLeaving(nodes);
  const leavingIds = new Set(leaving.map((g) => g.id));
  const shownNodes = [...nodes, ...leaving];
  const byId = new Map(shownNodes.map((n) => [n.id, n]));

  /* ---------- Links: the fixed ones plus every pair that called each other ---------- */

  const pairMap = new Map<string, [string, string]>();
  const addPair = (a: string, b: string) => {
    if (a === b || !byId.has(a) || !byId.has(b)) return;
    const k = pairKey(a, b);
    if (!pairMap.has(k)) pairMap.set(k, a < b ? [a, b] : [b, a]);
  };
  edges.forEach(([a, b]) => addPair(a, b));
  calls.forEach((c) => addPair(c.from, c.to));
  const pairs = [...pairMap.entries()];

  const h = height ?? (w < 520 ? Math.round(clamp(w * 1.7, 380, 640)) : Math.round(clamp(w * 0.6, 360, 520))) + 32;
  const shapeKey = JSON.stringify([w, h, nodes.map((n) => [n.id, n.kind, n.lead ? 1 : 0]), pairs.filter(([, [a, b]]) => ids.has(a) && ids.has(b)).map(([k]) => k)]);
  const layout = useMemo(
    () =>
      layOut(
        nodes,
        pairs.filter(([, [a, b]]) => ids.has(a) && ids.has(b)).map(([, p]) => p),
        w,
        h,
      ),
    [shapeKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /* ---------- Heat, calls per minute and each node's calls – indexed once per history and clock ---------- */

  const { heat, hottest, perMinute, recentOf, minuteOf } = useMemo(() => indexCalls(calls, now, heatWindow), [calls, now, heatWindow]);

  /* ---------- Hover, focus and the open card ---------- */

  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useControllable<string | null>(
    selected,
    defaultSelected,
    // onSelect hears every change too, so either one makes `selected` changeable
    onSelectedChange ?? (onSelect ? () => {} : undefined),
    "selected",
  );
  const openNode = open ? byId.get(open) : undefined;
  const focusId = hover ?? (openNode ? open : null);
  const near = new Set<string>();
  if (focusId) {
    near.add(focusId);
    for (const [, [a, b]] of pairs) {
      if (a === focusId) near.add(b);
      if (b === focusId) near.add(a);
    }
  }
  // What had focus when the card opened (its node, or a chip in the bar) – focus goes back there when it closes
  const opener = useRef<HTMLElement | null>(null);
  const select = (id: string | null) => {
    if (id && !open) {
      const active = document.activeElement;
      opener.current = active instanceof HTMLElement && rootRef.current?.contains(active) ? active : null;
    }
    setOpen(id);
    onSelect?.(id ? (byId.get(id) ?? null) : null);
  };
  const nodeButton = (id: string | null | undefined) => (id ? nodeEls.current.get(id)?.querySelector<HTMLElement>("button[data-agg-node]") : null);
  /** Close and hand focus back: to what opened the card if it's still there, else the node */
  const closeCard = () => {
    const id = open;
    const back = opener.current?.isConnected && !opener.current.closest("[inert]") ? opener.current : nodeButton(id);
    rescueFocus(cardRef.current, [back]);
    select(null);
  };
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Element;
      if (cardRef.current?.contains(t) || t.closest?.("[data-agg-node]")) return;
      select(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  });
  // A node that goes away closes its own card – the parent hears about it once, when uncontrolled
  useEffect(() => {
    if (selected === undefined && open && !byId.has(open)) setOpen(null);
  });

  const { pulseRef, nodeEls, edgeEls } = useGraphEngine({ layout, pairs, byId, calls, now, reduced, look: resolvedLook, cardId, stageRef });
  // Focus never drops to <body>: a card or node that goes away hands it to the open node, else the first node
  useFocusRescue(rootRef, { fallback: () => nodeButton(open) ?? rootRef.current?.querySelector<HTMLElement>("button[data-agg-node]:not([tabindex='-1'])") });

  // The card sits beside its node, kept inside the graph (narrow graphs dock it at the bottom): placed when it opens or
  // the layout changes, and again when its size changes
  const cardShown = !!openNode;
  useLayoutEffect(() => {
    const el = cardRef.current;
    const at = open ? layout.spots.get(open) : undefined;
    if (!el || !at || layout.narrow) return;
    const R = (layout.size.get(open!) ?? 40) / 2;
    const place = () => {
      const cw = el.offsetWidth;
      const ch = el.offsetHeight;
      const right = at.x < layout.w / 2;
      el.style.left = `${clamp(right ? at.x + R + 18 : at.x - R - 18 - cw, 8, layout.w - cw - 8)}px`;
      el.style.top = `${clamp(at.y - ch / 2, 8, layout.h - ch - 8)}px`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, cardShown, layout]);

  /* ---------- What is shown ---------- */

  const agents = nodes.filter((n) => n.kind === "agent");
  const tools = nodes.filter((n) => n.kind === "tool");
  const total = nodes.reduce((sum, n) => sum + (n.cost ?? 0), 0);
  const waiting = nodes.filter((n) => n.status === "waiting");
  const failed = nodes.filter((n) => n.status === "error");
  // The one line screen readers hear when someone starts or stops needing you
  const alertText = [...waiting.map((n) => `${n.name} needs you`), ...failed.map((n) => `${n.name} failed`)].join(". ");
  // On the first draw everything grows in, middle first; the delay sticks to each node and link, later ones come at once
  // Render only reads the remembered delays; new ones are worked out here and remembered after the commit
  const delays = useRef(new Map<string, number>());
  const drawn = useRef(false);
  const fresh = new Map<string, number>();
  if (w > 0) {
    for (const n of shownNodes) if (!delays.current.has(n.id)) fresh.set(n.id, drawn.current ? 0 : (layout.pop.get(n.id) ?? 0));
    for (const [k, [a, b]] of pairs) if (!delays.current.has(k)) fresh.set(k, drawn.current ? 0 : Math.max(layout.draw.get(a) ?? 0, layout.draw.get(b) ?? 0));
  }
  const delayOf = (k: string) => delays.current.get(k) ?? fresh.get(k) ?? 0;
  useLayoutEffect(() => {
    for (const [k, d] of fresh) delays.current.set(k, d);
    for (const k of [...delays.current.keys()]) if (!byId.has(k) && !pairMap.has(k)) delays.current.delete(k);
    if (w) drawn.current = true;
  });

  const ready = w > 0;
  const outerRx = layout.rx;
  const outerRy = layout.ry;

  return (
    <div
      {...rest}
      ref={rootRefs}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-narrow={layout.narrow ? "" : undefined}
      data-focus={focusId ? "" : undefined}
      data-paused={paused || !onScreen ? "" : undefined}
    >
      <style href="ui-agent-graph" precedence="default">
        {css}
      </style>

      <header className="ui-agg__bar">
        <span className="ui-agg__mark">
          <GraphMark />
        </span>
        <span className="ui-agg__title">{title}</span>
        <Alerts waiting={waiting} failed={failed} narrow={layout.narrow} onPick={select} />
        <span className="ui-agg__sum">
          <span>
            <b>{agents.length}</b> {agents.length === 1 ? "agent" : "agents"}
          </span>
          <span>
            <b>{tools.length}</b> {tools.length === 1 ? "tool" : "tools"}
          </span>
          <span>
            <b>{perMinute}</b> calls/min
          </span>
          <span className="ui-agg__sum-cost">{formatCost(total)}</span>
        </span>
        {/* One button for both states, so focus stays on it (WCAG 2.2.2: the graph keeps moving otherwise) */}
        <button type="button" className="ui-agg__still" aria-pressed={paused} aria-label="Pause motion" title={paused ? "Resume motion" : "Pause motion"} onClick={() => setPaused((p) => !p)}>
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <span className="ui-agg__sr" role="status">
          {alertText}
        </span>
      </header>

      <div className="ui-agg__panel">
        <div ref={stageRef} className="ui-agg__stage" style={{ height: ready ? h : undefined }} role="group" aria-label={`${title}: ${agents.length} agents and ${tools.length} tools`}>
          {ready && (
            <svg className="ui-agg__svg" width={layout.w} height={layout.h} aria-hidden="true">
              <defs>
                <radialGradient id={`${cardId}-glow`}>
                  <stop offset="0" style={{ stopColor: "var(--tc-agent-graph-glow)" }} />
                  <stop offset="1" style={{ stopColor: "var(--tc-agent-graph-glow)", stopOpacity: 0 }} />
                </radialGradient>
                {/* The soft colored glow around a Clean streak */}
                {resolvedLook === "clean" && (
                  <filter id={`${cardId}-blur`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" />
                  </filter>
                )}
              </defs>
              <ellipse className="ui-agg__halo" cx={layout.cx} cy={layout.cy} rx={outerRx * layout.ix * 0.9} ry={outerRy * layout.iy * 0.9} fill={`url(#${cardId}-glow)`} />
              <g>
                {pairs.map(([k, [a, b]]) => {
                  const e = heat.get(k);
                  const width = e && e.n ? 1.25 + 2.75 * Math.sqrt(e.n / hottest) : 1.25;
                  const idle = !e || now - e.last > 6000;
                  const na = byId.get(a);
                  const nb = byId.get(b);
                  const ask = (na?.status === "waiting" && nb?.kind === "user") || (nb?.status === "waiting" && na?.kind === "user");
                  const gone = leavingIds.has(a) || leavingIds.has(b);
                  const delay = delayOf(k);
                  return (
                    <path
                      key={k}
                      ref={(el) => {
                        if (el) edgeEls.current.set(k, el);
                        else edgeEls.current.delete(k);
                      }}
                      className="ui-agg__edge"
                      pathLength={1}
                      data-idle={idle ? "" : undefined}
                      data-ask={ask ? "" : undefined}
                      data-leaving={gone ? "" : undefined}
                      data-near={focusId && near.has(a) && near.has(b) && (a === focusId || b === focusId) ? "" : undefined}
                      // Busier links grow thicker in Standard; Clean keeps one width (set in the CSS)
                      style={{ strokeWidth: resolvedLook === "standard" ? width : undefined, animationDelay: `${delay}ms` }}
                    />
                  );
                })}
              </g>
              <g ref={pulseRef} />
            </svg>
          )}
          {ready && (
            <div className="ui-agg__nodes">
              {shownNodes.map((n) => (
                <NodeView
                  key={n.id}
                  n={n}
                  layout={layout}
                  look={resolvedLook}
                  gone={leavingIds.has(n.id)}
                  dim={!!focusId && !near.has(n.id)}
                  isOpen={open === n.id}
                  hovered={hover === n.id}
                  delay={delayOf(n.id)}
                  count={minuteOf(n.id).length}
                  cardId={cardId}
                  nodeEls={nodeEls.current}
                  setHover={setHover}
                  onToggle={() => select(open === n.id ? null : n.id)}
                />
              ))}
            </div>
          )}
          {openNode && (
            <NodeCard
              n={openNode}
              cardId={cardId}
              cardRef={cardRef}
              recent={recentOf(openNode.id)}
              count={minuteOf(openNode.id).length}
              users={pairs.filter(([, [a, b]]) => a === openNode.id || b === openNode.id).map(([, [a, b]]) => byId.get(a === openNode.id ? b : a)!)}
              byId={byId}
              formatCost={formatCost}
              onClose={closeCard}
            />
          )}
        </div>
        <Legend look={resolvedLook} cardId={cardId} />
      </div>

      {/* For screen readers: every node with what it does and who it calls */}
      <ul className="ui-agg__sr">
        {nodes.map((n) => {
          const out = new Map<string, number>();
          for (const c of minuteOf(n.id)) if (c.from === n.id) out.set(c.to, (out.get(c.to) ?? 0) + 1);
          return (
            <li key={n.id}>
              {n.name} ({KIND[n.kind]}
              {n.status ? `, ${STATUS[n.status].toLowerCase()}` : ""}){n.doing ? `: ${n.doing}` : ""}.
              {out.size > 0 && ` Calls in the last minute: ${[...out].map(([id, k]) => `${byId.get(id)?.name ?? id} ${k}`).join(", ")}.`}
              {n.cost !== undefined && ` Cost ${formatCost(n.cost)}.`}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors and motion as variables – override them on .ui-agg */
:where([data-look="standard"], [data-look="standard"] *).ui-agg {
  /* Links: the soft blue of Agent Tree; pulses a deeper blue */
  --tc-agent-graph-link: light-dark(#82bcff, #4f8fdb);
  --tc-agent-graph-pulse: light-dark(#2f6bff, #6ea8ff);
  --tc-agent-graph-glow: light-dark(rgba(130, 188, 255, 0.2), rgba(79, 143, 219, 0.16));
  --tc-agent-graph-breath: light-dark(rgba(47, 107, 255, 0.17), rgba(110, 168, 255, 0.16));
  --tc-agent-graph-breath-out: light-dark(rgba(47, 107, 255, 0.03), rgba(110, 168, 255, 0.03));
  --tc-agent-graph-user-bg: var(--tc-surface-inverse);
  --tc-agent-graph-user-fg: var(--tc-text-on-inverse);
  /* Three layers: the gray tray, the white panel on it and the nodes and cards on the panel (lighter again in dark) */
  --tc-agent-graph-tray-bg: var(--tc-surface-tray);
  --tc-agent-graph-panel-bg: var(--tc-surface-on-tray);
  --tc-agent-graph-card-bg: var(--tc-surface-overlay);
  /* Loops: the breathing rings, the turning stroke and the shine – each runs a few times, then holds still */
  --tc-agent-graph-breathe: 2600ms;
  --tc-agent-graph-breathe-fast: 1500ms;
  --tc-agent-graph-turn-time: 1200ms;
  --tc-agent-graph-shine-time: 2400ms;
  --tc-agent-graph-halo-time: 1200ms;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-agent-graph-tray-bg);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The state colors fade, so they're registered as colors */
@property --tc-agent-graph-state { syntax: "<color>"; inherits: true; initial-value: transparent; }
@property --tc-agent-graph-state-bg { syntax: "<color>"; inherits: true; initial-value: transparent; }
/* Colors and motion as variables – override them on .ui-agg */
:where([data-look="clean"], [data-look="clean"] *).ui-agg {
  /* Links: a light gray; streaks the clean accent blue */
  --tc-agent-graph-link: light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.08));
  --tc-agent-graph-pulse: light-dark(rgba(0, 96, 226, 0.8), #70b8ff);
  --tc-agent-graph-glow: light-dark(rgba(130, 188, 255, 0.16), rgba(79, 143, 219, 0.14));
  --tc-agent-graph-breath: light-dark(rgba(0, 96, 226, 0.12), rgba(112, 184, 255, 0.16));
  --tc-agent-graph-breath-out: light-dark(rgba(0, 96, 226, 0.02), rgba(112, 184, 255, 0.03));
  --tc-agent-graph-user-bg: var(--tc-surface-inverse);
  --tc-agent-graph-user-fg: var(--tc-text-on-inverse);
  /* The nodes and cards sit a step lighter than the panel in dark */
  --tc-agent-graph-card-bg: var(--tc-surface-overlay);
  --tc-agent-graph-breathe: 2600ms;
  --tc-agent-graph-turn-time: 1200ms;
  --tc-agent-graph-shine-time: 2400ms;
  --tc-agent-graph-halo-time: 1200ms;
  --tc-agent-graph-shine: light-dark(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.16));
  /* Subtle tones after Interfere's tokens (Radix scales): a soft background and its foreground */
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-agg *, .ui-agg *::before, .ui-agg *::after { box-sizing: border-box; }
:where(.ui-agg) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-agg button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-agg p, .ui-agg ul { margin: 0; padding: 0; }
.ui-agg svg { display: block; flex: none; overflow: visible; }
/* ----- The bar: title and the whole run in numbers, on the tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agg__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2) var(--tc-space-3); }
/* ----- The bar: title and the whole run in numbers, above the panel ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; margin-bottom: var(--tc-space-4); }
.ui-agg__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-agent-graph-pulse); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__title { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__sum { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-3-5); margin-left: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__sum b { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__sum-cost { min-width: 42px; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); text-align: right; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__title { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__sum { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-3); margin-left: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__sum b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__sum-cost { min-width: 40px; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); text-align: right; }
/* Narrow: the numbers get a line of their own, so a chip coming and going never moves the graph */
.ui-agg[data-narrow] .ui-agg__bar { row-gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg[data-narrow] .ui-agg__title { line-height: var(--tc-line-height-loose); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg[data-narrow] .ui-agg__sum { flex-basis: 100%; justify-content: space-between; gap: var(--tc-space-0-5) var(--tc-space-2); margin-left: 0; font-size: var(--tc-font-size-sm); }
/* ----- The white panel with the graph ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agg__panel { position: relative; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-agent-graph-panel-bg); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg[data-narrow] .ui-agg__title { line-height: var(--tc-line-height-relaxed); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg[data-narrow] .ui-agg__sum { flex-basis: 100%; justify-content: space-between; gap: var(--tc-space-0-5) var(--tc-space-2); margin-left: 0; }
/* ----- The white panel with the graph ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__panel { position: relative; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-agg__stage { position: relative; width: 100%; min-height: 200px; container-type: inline-size; }
.ui-agg__svg { position: absolute; inset: 0; pointer-events: none; }
.ui-agg__halo { animation: ui-agg-fade-in var(--tc-agent-graph-halo-time) var(--tc-ease-standard) both; }
/* Links: thicker when busy, faded when quiet, lit while a pulse runs along them */
:where([data-look="standard"], [data-look="standard"] *).ui-agg__edge { fill: none; stroke: var(--tc-agent-graph-link); stroke-linecap: round; opacity: 0.75; stroke-dasharray: 1 1; stroke-dashoffset: 0; animation: ui-agg-draw var(--tc-duration-slowest) var(--tc-ease-move) backwards; transition: stroke-width var(--tc-duration-reveal) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard), stroke var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__edge[data-idle] { opacity: 0.38; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__edge[data-live] { opacity: 1; transition-duration: var(--tc-duration-reveal), var(--tc-duration-fast), var(--tc-duration-slow); }
/* Links: one even 1.5px line in a light gray, busy or not – only the moving streaks carry color */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__edge { fill: none; stroke: var(--tc-agent-graph-link); stroke-width: 1.5; stroke-linecap: round; opacity: 1; stroke-dasharray: 1 1; stroke-dashoffset: 0; animation: ui-agg-draw var(--tc-duration-slowest) var(--tc-ease-move) backwards; transition: opacity var(--tc-duration-slow) var(--tc-ease-standard), stroke var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-agg__edge[data-ask] { stroke: var(--tc-status-warning-solid); opacity: 0.9; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__edge[data-error] { stroke: var(--tc-status-danger-solid); opacity: 1; transition-duration: var(--tc-duration-reveal), var(--tc-duration-quick), var(--tc-duration-quick); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__edge[data-leaving] { stroke-dashoffset: 0; animation: ui-agg-retract var(--tc-duration-slower) var(--tc-ease-move) forwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__edge[data-error] { stroke: var(--tc-status-danger-solid); opacity: 1; transition-duration: var(--tc-duration-quick), var(--tc-duration-quick); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__edge[data-leaving] { stroke-dashoffset: 0; animation: ui-agg-retract var(--tc-duration-slower) var(--tc-ease-move) forwards; }
.ui-agg[data-focus] .ui-agg__edge:not([data-near]) { opacity: 0.1; }
.ui-agg[data-focus] .ui-agg__edge[data-near] { opacity: 1; }
/* Pulses: a solid dot with a short tail out, a hollow one back */
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse .ui-agg__head,
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse .ui-agg__tail { fill: var(--tc-agent-graph-pulse); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse[data-kind="res"] .ui-agg__head,
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse[data-kind="askres"] .ui-agg__head,
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse[data-kind="err"] .ui-agg__head { fill: var(--tc-agent-graph-panel-bg); stroke: var(--tc-agent-graph-pulse); stroke-width: 1.75; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse[data-kind="ask"] :is(.ui-agg__head, .ui-agg__tail),
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse[data-kind="askres"] .ui-agg__tail { fill: var(--tc-status-warning-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse[data-kind="askres"] .ui-agg__head { stroke: var(--tc-status-warning-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse[data-kind="err"] .ui-agg__tail { fill: var(--tc-status-danger-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse[data-kind="err"] .ui-agg__head { stroke: var(--tc-status-danger-solid); }
.ui-agg[data-focus] .ui-agg__pulse { opacity: 0.25; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__glow { fill: var(--tc-agent-graph-pulse); opacity: 0.16; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse:is([data-kind="ask"], [data-kind="askres"]) .ui-agg__glow { fill: var(--tc-status-warning-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pulse[data-kind="err"] .ui-agg__glow { fill: var(--tc-status-danger-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__ripple { fill: none; stroke: var(--tc-agent-graph-pulse); stroke-width: 1.25; }
/* Streaks: a short line fading out behind – blue out, green with the answer, amber when it asks you, red when it fails */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__streak { fill: none; stroke-width: 2; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__streak-glow { fill: none; stroke-width: 4; stroke-linecap: round; opacity: 0.2; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__stop { stop-color: var(--tc-agent-graph-pulse); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__pulse[data-kind="res"] .ui-agg__stop { stop-color: var(--tc-status-success-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__pulse:is([data-kind="ask"], [data-kind="askres"]) .ui-agg__stop { stop-color: var(--tc-status-warning-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__pulse[data-kind="err"] .ui-agg__stop { stop-color: var(--tc-status-danger-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__ripple { fill: none; stroke: var(--tc-agent-graph-pulse); stroke-width: 1; }
.ui-agg__ripple:is([data-kind="ask"], [data-kind="askres"]) { stroke: var(--tc-status-warning-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__ripple[data-kind="err"] { stroke: var(--tc-status-danger-solid); stroke-width: 2; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__ripple[data-kind="err"] { stroke: var(--tc-status-danger-solid); stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__ripple[data-kind="res"] { stroke: var(--tc-status-success-solid); }
/* ----- Nodes: placed and floated by the frame loop; a disc with a label under it ----- */
.ui-agg__nodes { position: absolute; inset: 0; pointer-events: none; }
.ui-agg__node { position: absolute; top: 0; left: 0; width: 0; height: 0; transition: opacity var(--tc-duration-slow) var(--tc-ease-standard); will-change: transform; }
.ui-agg[data-focus] .ui-agg__node[data-dim] { opacity: 0.3; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__body { position: absolute; top: 0; left: 0; transform-origin: 0 0; animation: ui-agg-pop var(--tc-duration-slowest) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-leaving] .ui-agg__body { animation: ui-agg-out var(--tc-duration-slower) var(--tc-ease-move) forwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__disc { position: absolute; top: calc(var(--d) / -2); left: calc(var(--d) / -2); display: grid; place-items: center; width: var(--d); height: var(--d); border-radius: 50%; background: var(--tc-agent-graph-card-bg); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-muted); pointer-events: auto; transition: width var(--tc-duration-slow) var(--tc-ease-move), height var(--tc-duration-slow) var(--tc-ease-move), top var(--tc-duration-slow) var(--tc-ease-move), left var(--tc-duration-slow) var(--tc-ease-move), box-shadow var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__body { position: absolute; top: 0; left: 0; transform-origin: 0 0; animation: ui-agg-pop var(--tc-duration-slowest) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-leaving] .ui-agg__body { animation: ui-agg-out var(--tc-duration-slower) var(--tc-ease-move) forwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__disc { position: absolute; top: calc(var(--d) / -2); left: calc(var(--d) / -2); display: grid; place-items: center; width: var(--d); height: var(--d); border-radius: 50%; background: var(--tc-agent-graph-card-bg); box-shadow: inset 0 0 0 999px var(--tc-agent-graph-state-bg), var(--tc-shadow-raised); color: var(--tc-text-secondary); pointer-events: auto; transition: width var(--tc-duration-slow) var(--tc-ease-move), height var(--tc-duration-slow) var(--tc-ease-move), top var(--tc-duration-slow) var(--tc-ease-move), left var(--tc-duration-slow) var(--tc-ease-move), box-shadow var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); }
/* The icon or initials: laid out as if they were the disc's own children */
.ui-agg__face { display: contents; }
/* A bigger touch target than the disc */
.ui-agg__disc::before { content: ""; position: absolute; inset: -6px; border-radius: 50%; }
.ui-agg__disc:hover, .ui-agg__node[data-open] .ui-agg__disc { transform: scale(1.06); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__face > svg { width: 48%; height: 48%; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__initials { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-muted); }
/* Agents: the white disc on a gray tray ring, like every card of the library */
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-kind="agent"] .ui-agg__disc { box-shadow: 0 0 0 4px var(--tc-agent-graph-tray-bg), 0 0 0 5px var(--tc-border-default), var(--tc-shadow-raised-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-kind="agent"] .ui-agg__face > svg { width: 46%; height: 46%; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-kind="user"] .ui-agg__disc { background: var(--tc-agent-graph-user-bg); color: var(--tc-agent-graph-user-fg); box-shadow: var(--tc-shadow-control); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-kind="user"] .ui-agg__face > svg { width: 44%; height: 44%; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-flash] .ui-agg__disc { animation: ui-agg-flash var(--tc-duration-slowest) var(--tc-ease-standard) 3; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__face > svg { width: 46%; height: 46%; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__initials { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
/* Agents: a little more lift than the tools */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-kind="agent"] .ui-agg__disc { box-shadow: inset 0 0 0 999px var(--tc-agent-graph-state-bg), var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-kind="agent"] .ui-agg__face > svg { width: 44%; height: 44%; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-kind="user"] .ui-agg__disc { background: var(--tc-agent-graph-user-bg); color: var(--tc-agent-graph-user-fg); box-shadow: var(--tc-shadow-control); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-kind="user"] .ui-agg__face > svg { width: 42%; height: 42%; }
/* Working agents breathe; waiting ones breathe amber, a little quicker */
.ui-agg__ring { position: absolute; top: calc(var(--d) / -2); left: calc(var(--d) / -2); width: var(--d); height: var(--d); border-radius: 50%; opacity: 0; transition: opacity var(--tc-duration-slower) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-status="working"] .ui-agg__ring { opacity: 1; box-shadow: 0 0 0 var(--tc-agent-graph-b1, 6px) var(--tc-agent-graph-breath); animation: ui-agg-breathe var(--tc-agent-graph-breathe) var(--tc-ease-in-out) 2; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-status="waiting"] .ui-agg__ring { opacity: 1; --tc-agent-graph-breath: rgba(245, 159, 10, 0.22); --tc-agent-graph-breath-out: rgba(245, 159, 10, 0.04); box-shadow: 0 0 0 var(--tc-agent-graph-b1, 6px) var(--tc-agent-graph-breath); animation: ui-agg-breathe var(--tc-agent-graph-breathe-fast) var(--tc-ease-in-out) 3; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-status="error"] .ui-agg__ring { opacity: 1; box-shadow: 0 0 0 8px rgba(229, 72, 77, 0.16); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-status="waiting"] .ui-agg__disc { box-shadow: 0 0 0 4px var(--tc-agent-graph-tray-bg), 0 0 0 5.5px var(--tc-status-warning-solid), var(--tc-shadow-raised-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-status="error"] .ui-agg__disc { box-shadow: 0 0 0 4px var(--tc-agent-graph-tray-bg), 0 0 0 5.5px var(--tc-status-danger-solid), var(--tc-shadow-raised-hover); }
/* A small badge on the disc's edge: needs you, failed, done */
:where([data-look="standard"], [data-look="standard"] *).ui-agg__badge { position: absolute; top: calc(var(--d) * -0.36 - 9px); left: calc(var(--d) * 0.36 - 7px); display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 0 2px var(--tc-agent-graph-panel-bg); color: #fff; pointer-events: none; animation: ui-agg-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__badge > svg { width: 11px; height: 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-status="working"] .ui-agg__ring { opacity: 1; box-shadow: 0 0 0 var(--tc-agent-graph-b1, 5px) var(--tc-agent-graph-breath); animation: ui-agg-breathe-clean var(--tc-agent-graph-breathe) var(--tc-ease-in-out) 2; }
/* Waiting for you and failed look the same, in amber and red: a light fill laid over the disc's own white (an inset shadow
   paints above the background, below the icon) with a soft shine sweeping across, and a thin stroke inside the edge that
   runs around, full color fading to nothing – as on Agent Cursors. Both colors are registered properties, so the fill and
   the stroke fade in and out with the status instead of switching */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node { --tc-agent-graph-state: transparent; --tc-agent-graph-state-bg: transparent; transition: opacity var(--tc-duration-slow) var(--tc-ease-standard), --tc-agent-graph-state var(--tc-duration-slower) var(--tc-ease-standard), --tc-agent-graph-state-bg var(--tc-duration-slower) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-status="waiting"] { --tc-agent-graph-state: var(--tc-status-warning-solid); --tc-agent-graph-state-bg: var(--tc-status-warning-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-status="error"] { --tc-agent-graph-state: var(--tc-status-danger-solid); --tc-agent-graph-state-bg: var(--tc-status-danger-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__stroke { position: absolute; top: calc(var(--d) / -2); left: calc(var(--d) / -2); width: var(--d); height: var(--d); pointer-events: none; transition: width var(--tc-duration-slow) var(--tc-ease-move), height var(--tc-duration-slow) var(--tc-ease-move), top var(--tc-duration-slow) var(--tc-ease-move), left var(--tc-duration-slow) var(--tc-ease-move); }
.ui-agg__shine { position: absolute; top: calc(var(--d) / -2); left: calc(var(--d) / -2); width: var(--d); height: var(--d); overflow: hidden; pointer-events: none; }
.ui-agg__shine::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 250%; background: linear-gradient(110deg, transparent 30%, var(--tc-agent-graph-shine) 50%, transparent 70%); transform: translateX(-78%); animation: ui-agg-shine var(--tc-agent-graph-shine-time) var(--tc-ease-in-out) 2; }
/* A small badge on the disc's edge: needs you, failed, done */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__badge { position: absolute; top: calc(var(--d) * -0.36 - 8px); left: calc(var(--d) * 0.36 - 6px); display: grid; place-items: center; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 0 2px var(--tc-surface-raised); color: #fff; pointer-events: none; animation: ui-agg-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__badge > svg { width: 10px; height: 10px; }
.ui-agg__badge[data-status="waiting"] { background: var(--tc-status-warning-solid); }
.ui-agg__badge[data-status="error"] { background: var(--tc-status-danger-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__badge[data-status="done"] { background: var(--tc-status-success-solid); }
/* Labels under the disc, with a soft halo so links never cut through them */
:where([data-look="standard"], [data-look="standard"] *).ui-agg__label { position: absolute; top: calc(var(--d) / 2 + 5px); left: 0; display: grid; justify-items: center; padding: 1px var(--tc-space-1-5); border-radius: var(--tc-radius-md); background: var(--tc-agent-graph-panel-bg); box-shadow: 0 0 6px 2px var(--tc-agent-graph-panel-bg); transform: translateX(-50%); white-space: nowrap; pointer-events: none; }
/* Done: a solid green check on a light green disc – the green mixed into the panel color, so nothing behind shows through */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__badge[data-status="done"] { background: color-mix(in srgb, var(--tc-status-success-solid) 18%, var(--tc-surface-raised)); color: var(--tc-status-success-solid); }
/* Labels under the disc, on the panel color so links pass behind them */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__label { position: absolute; top: calc(var(--d) / 2 + 5px); left: 0; display: grid; justify-items: center; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); box-shadow: 0 0 6px 2px var(--tc-surface-raised); transform: translateX(-50%); white-space: nowrap; pointer-events: none; }
.ui-agg__label[data-above] { top: auto; bottom: calc(var(--d) / 2 + 5px); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-kind="agent"] .ui-agg__label { top: calc(var(--d) / 2 + 7px); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-kind="agent"] .ui-agg__label[data-above] { top: auto; bottom: calc(var(--d) / 2 + 7px); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__node[data-kind="agent"] .ui-agg__name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-kind="agent"] .ui-agg__label { top: calc(var(--d) / 2 + 6px); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-kind="agent"] .ui-agg__label[data-above] { top: auto; bottom: calc(var(--d) / 2 + 6px); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__name { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__node[data-kind="agent"] .ui-agg__name { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
.ui-agg__line { font-size: var(--tc-font-size-xs); line-height: 14px; color: var(--tc-text-muted); }
.ui-agg__line[data-status="waiting"] { font-weight: var(--tc-font-weight-medium); color: var(--tc-status-warning-fg); }
.ui-agg__line[data-status="error"] { font-weight: var(--tc-font-weight-medium); color: var(--tc-status-danger-fg); }
.ui-agg[data-narrow] .ui-agg__name { font-size: var(--tc-font-size-xs); line-height: 14px; }
.ui-agg[data-narrow] .ui-agg__ring { --tc-agent-graph-b1: 4px; --tc-agent-graph-b2: 9px; }
.ui-agg[data-narrow] .ui-agg__label { padding: 0 var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg[data-narrow] .ui-agg__node[data-kind="agent"] .ui-agg__name { font-size: var(--tc-font-size-xs); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg[data-narrow] .ui-agg__line { font-size: 10.5px; line-height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg[data-narrow] .ui-agg__node[data-kind="agent"] .ui-agg__disc { box-shadow: 0 0 0 3px var(--tc-agent-graph-tray-bg), 0 0 0 4px var(--tc-border-default), var(--tc-shadow-raised-hover); }
/* "needs you" and "failed" – in the bar, a click opens that node's card */
.ui-agg__alerts { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: 24px; margin: -3px 0; padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); white-space: nowrap; animation: ui-agg-rise var(--tc-duration-slow) var(--tc-ease-move) both; transition: filter var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__chip > svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-pill-h-lg); margin: -2px 0; padding: 0 var(--tc-space-2) 0 var(--tc-space-1); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); white-space: nowrap; animation: ui-agg-rise var(--tc-duration-slow) var(--tc-ease-move) both; transition: filter var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__chip > svg { width: 13px; height: 13px; }
.ui-agg__chip[data-kind="waiting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-agg__chip[data-kind="error"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-agg__chip:hover { filter: saturate(1.3) brightness(0.97); }
/* ----- The card of a node ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agg__card { position: absolute; z-index: 5; display: grid; gap: var(--tc-space-2-5); width: 264px; padding: var(--tc-space-3); border-radius: var(--tc-menu-radius); background: var(--tc-agent-graph-card-bg); box-shadow: var(--tc-shadow-overlay); animation: ui-agg-rise var(--tc-duration-base) var(--tc-ease-move) both; }
/* ----- The card of a node ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__card { position: absolute; z-index: 5; display: grid; gap: var(--tc-space-2-5); width: 260px; padding: var(--tc-space-2-5); border-radius: var(--tc-menu-radius); background: var(--tc-agent-graph-card-bg); box-shadow: var(--tc-shadow-overlay); animation: ui-agg-rise var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-agg[data-narrow] .ui-agg__card { right: 8px; bottom: 8px; left: 8px; width: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__card-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__card-icon { display: grid; flex: none; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--tc-agent-graph-card-bg); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__card-icon > svg { width: 15px; height: 15px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__card-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__card-icon { display: grid; flex: none; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--tc-agent-graph-card-bg); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__card-icon > svg { width: 14px; height: 14px; }
.ui-agg__card-icon[data-kind="user"] { background: var(--tc-agent-graph-user-bg); color: var(--tc-agent-graph-user-fg); box-shadow: none; }
.ui-agg__card-who { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__card-name { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__card-detail { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* The status pill */
.ui-agg__pill { flex: none; display: inline-flex; align-items: center; min-height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__pill { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__card-name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__card-detail { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: 14px; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__pill { color: var(--tc-text-secondary); }
.ui-agg__pill[data-status="working"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-agg__pill[data-status="waiting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-agg__pill[data-status="error"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-agg__pill[data-status="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
/* Close and Pause: Button's ghost icon button, square at the small control height */
.ui-agg :is(.ui-agg__close, .ui-agg__still) { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-agg :is(.ui-agg__close, .ui-agg__still):hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-agg__close { margin: -6px -6px -6px -2px; }
.ui-agg__still { margin: -4px -6px -4px 0; }
.ui-agg__still[aria-pressed="true"] { color: var(--tc-text-primary); }
/* Narrow: the numbers wrap to their own line under the title, Pause stays on the first one */
.ui-agg[data-narrow] .ui-agg__still { margin-left: auto; }
.ui-agg[data-narrow] .ui-agg__sum { order: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__doing { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__calls { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-1); border-radius: var(--tc-radius-xl); background: var(--tc-agent-graph-tray-bg); list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__call { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: 26px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); animation: ui-agg-rise var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__call:first-child { background: var(--tc-agent-graph-card-bg); box-shadow: 0 0 0 1px var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__call-dir { display: grid; flex: none; place-items: center; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__call-icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; font-size: 7.5px; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__doing { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__calls { display: grid; border-top: var(--tc-hairline) solid var(--tc-divider); border-bottom: var(--tc-hairline) solid var(--tc-divider); list-style: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__call { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: 28px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); animation: ui-agg-rise var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__call + .ui-agg__call { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__call-dir { display: grid; flex: none; place-items: center; color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__call-icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; font-size: 7.5px; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-agg__call-icon > svg { width: 13px; height: 13px; }
.ui-agg__call-text { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-muted); }
.ui-agg__call-who { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__call-end { flex: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__call-end { flex: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-agg__call[data-status="pending"] .ui-agg__call-end { color: var(--tc-accent-text); }
.ui-agg__call[data-status="error"] .ui-agg__call-end { font-weight: var(--tc-font-weight-medium); color: var(--tc-status-danger-fg); }
.ui-agg__spin { animation: ui-agg-spin var(--tc-duration-reveal-slow) linear infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__card-foot { display: flex; align-items: center; gap: var(--tc-space-2); padding: 0 var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__card-cost { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
/* ----- The legend ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agg__legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--tc-space-1) var(--tc-space-4); padding: 0 var(--tc-space-3) var(--tc-space-3); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__card-foot { display: flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__card-cost { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* ----- The legend ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agg__legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--tc-space-1) var(--tc-space-3-5); padding: 0 var(--tc-space-2-5) var(--tc-space-2-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-agg__legend > span { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__legend-call,
:where([data-look="standard"], [data-look="standard"] *).ui-agg__legend-tail { fill: var(--tc-agent-graph-pulse); }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__legend-reply { fill: var(--tc-agent-graph-panel-bg); stroke: var(--tc-agent-graph-pulse); stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__legend-line { stroke: var(--tc-agent-graph-link); stroke-linecap: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-agg__legend-wait { fill: var(--tc-status-warning-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__legend-streak { fill: none; stroke-width: 2; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__legend-stop { stop-color: var(--tc-agent-graph-pulse); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__legend-stop[data-kind="answer"] { stop-color: var(--tc-status-success-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__legend-stop[data-kind="ask"] { stop-color: var(--tc-status-warning-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-agg__legend-stop[data-kind="error"] { stop-color: var(--tc-status-danger-solid); }
.ui-agg__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
/* ----- Rounded squares, like the cards in Agent Tree ----- */
@property --tc-agent-graph-turn { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
.ui-agg .ui-agg__node { --tc-agent-graph-r: calc(var(--d) * 0.27); }
.ui-agg :is(.ui-agg__disc, .ui-agg__ring, .ui-agg__shine) { border-radius: var(--tc-agent-graph-r); }
/* The touch target around the disc: concentric with it, 6px out */
.ui-agg .ui-agg__disc::before { border-radius: calc(var(--tc-agent-graph-r) + var(--tc-radius-sm)); }
.ui-agg .ui-agg__badge { top: calc(var(--d) / -2 - 6px); left: calc(var(--d) / 2 - 9px); }
.ui-agg .ui-agg__card-icon { border-radius: var(--tc-radius-md); }
.ui-agg .ui-agg__stroke { box-sizing: border-box; padding: 1px; border-radius: var(--tc-agent-graph-r); background: conic-gradient(from var(--tc-agent-graph-turn), transparent 0deg, transparent 40deg, var(--tc-agent-graph-state) 360deg); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); animation: ui-agg-turn var(--tc-agent-graph-turn-time) linear 4; }
/* Paused (the button, or off screen): the loops hold where they are */
.ui-agg[data-paused] :is(.ui-agg__ring, .ui-agg__stroke, .ui-agg__spin),
.ui-agg[data-paused] .ui-agg__shine::after { animation-play-state: paused; }
@keyframes ui-agg-turn { to { --tc-agent-graph-turn: 360deg; } }
@keyframes ui-agg-draw { from { stroke-dashoffset: 1; } }
@keyframes ui-agg-retract { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 1; opacity: 0; } }
@keyframes ui-agg-pop { from { opacity: 0; transform: scale(0.4); } }
@keyframes ui-agg-out { to { opacity: 0; transform: scale(0.5); } }
@keyframes ui-agg-rise { from { opacity: 0; transform: translateY(4px) scale(0.98); } }
@keyframes ui-agg-fade-in { from { opacity: 0; } }
@keyframes ui-agg-breathe { 0%, 100% { box-shadow: 0 0 0 var(--tc-agent-graph-b1, 6px) var(--tc-agent-graph-breath); } 50% { box-shadow: 0 0 0 var(--tc-agent-graph-b2, 13px) var(--tc-agent-graph-breath-out); } }
@keyframes ui-agg-flash { 50% { background: var(--tc-status-danger-bg); } }
@keyframes ui-agg-breathe-clean { 0%, 100% { box-shadow: 0 0 0 var(--tc-agent-graph-b1, 5px) var(--tc-agent-graph-breath); } 50% { box-shadow: 0 0 0 var(--tc-agent-graph-b2, 11px) var(--tc-agent-graph-breath-out); } }
@keyframes ui-agg-shine { 0% { transform: translateX(-78%); } 55%, 100% { transform: translateX(18%); } }
@keyframes ui-agg-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .ui-agg *, .ui-agg *::before, .ui-agg *::after { animation: none !important; transition: none !important; }
  .ui-agg__edge { stroke-dasharray: none; }
}
`;
