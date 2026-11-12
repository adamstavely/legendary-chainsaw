<script setup lang="ts">
import { Maximize, ZoomIn, ZoomOut } from "@lucide/vue";
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, useTemplateRef, watch } from "vue";
import type { LayoutName } from "../App.vue";
import {
  CARD,
  GAP,
  LIVE_ZOOM,
  MAX_LIVE,
  bounds,
  fit,
  freeLayout,
  gridLayout,
  intersects,
  nearestIn,
  reveal,
  ring,
  visibleWorld,
  zoomAt,
  type Direction,
  type Insets,
  type Point,
  type Rect,
  type Viewport,
} from "../canvas/geometry";
import { graphLayout, linkPath } from "../canvas/graph";
import { similarLayout } from "../canvas/similarity";
import { useReducedMotion } from "../composables/media";
import { LINKS, compositionText } from "../data/composition";
import { SIMILARITY, compared, lookAlikesOf, neighboursOf } from "../data/lookalikes";
import { CATEGORIES, PIECES, type Look, type Piece, type Theme } from "../data/pieces";
import { keepVariant, keptVariants, removeVariant, requestVariants } from "../riff/api";
import { propsOf } from "../riff/apply";
import { addRound, discard, riffsOf, shownVariants, type Round } from "../riff/session";
import type { Kept, Variant } from "../riff/types";
import PieceCard from "./PieceCard.vue";
import VariantCard from "./VariantCard.vue";

const props = defineProps<{
  pieces: readonly Piece[];
  layout: LayoutName;
  theme: Theme;
  look: Look;
  summary: string;
  /** Slugs of the components Claude can riff on (dev server only) */
  riffable: ReadonlySet<string>;
}>();
const moved = defineModel<Record<string, Point>>("moved", { required: true });
const emit = defineEmits<{ announce: [text: string]; similar: [id: string] }>();

// The panel beside an open piece loads with the first one opened
const RiffPanel = defineAsyncComponent(() => import("./RiffPanel.vue"));

const INSETS: Insets = { top: 24, right: 24, bottom: 24, left: 24 };
const STEP = 1.25;

const stage = useTemplateRef<HTMLElement>("stage");
const worldEl = useTemplateRef<HTMLElement>("world");
const onLanded = (e: TransitionEvent) => e.target === worldEl.value && landed();
const screen = ref({ width: 0, height: 0 });
const view = ref<Viewport>({ x: 0, y: 0, zoom: 1 });
/** Moves the code makes (fit, jump, open) glide; drags and wheel zooms follow the hand directly */
const gliding = ref(false);
const reducedMotion = useReducedMotion();
const current = ref<string | null>(null);
const opened = ref<string | null>(null);

// Layout ----------------------------------------------------------------------------------------------------------

const groups = computed(() => CATEGORIES.map((label) => ({ label, ids: props.pieces.filter((p) => p.category === label).map((p) => p.id) })));
const grid = computed(() => gridLayout(groups.value));
const similar = computed(() =>
  similarLayout(
    SIMILARITY,
    props.pieces.map((p) => p.id),
  ),
);
const graph = computed(() =>
  graphLayout(
    props.pieces.map((p) => p.id),
    LINKS,
  ),
);
const layout = computed(() =>
  props.layout === "free"
    ? freeLayout(grid.value, moved.value)
    : props.layout === "similar"
      ? similar.value
      : props.layout === "graph"
        ? graph.value
        : grid.value,
);
// Graph: a line from each piece down to each part it's built with. The current card's links stand out, drawn last so
// they're on top
const linkMarker = `${useId()}-arrow`;
const links = computed(() => {
  if (props.layout !== "graph") return [];
  const cards = graph.value.cards;
  return graph.value.links
    .map(([a, b]) => ({ key: `${a}>${b}`, d: linkPath(cards.get(a)!, cards.get(b)!), active: a === current.value || b === current.value }))
    .sort((x, y) => Number(x.active) - Number(y.active));
});
const byId = computed(() => new Map(props.pieces.map((p) => [p.id, p])));
const names = new Map(PIECES.map((p) => [p.id, p.name]));
const alike = (list: readonly { id: string; similarity: number }[]) => list.map((a) => ({ name: names.get(a.id) ?? a.id, similarity: a.similarity }));
const world = computed(() => bounds([...layout.value.cards.values()]));

// What to render: cards in or near view (a quarter of a screen around it), plus the current and open cards. In
// layout order, so the reading and Tab order follow the canvas
const visible = computed(() => visibleWorld(view.value, screen.value));
/** While the view glides, where it set out from: cards there stay rendered until it arrives */
const departure = ref<Rect | null>(null);
const near = computed<Rect>(() => {
  const v = visible.value;
  const around = { x: v.x - v.width / 4, y: v.y - v.height / 4, width: v.width * 1.5, height: v.height * 1.5 };
  return departure.value ? bounds([around, departure.value]) : around;
});
const rendered = computed(() => {
  const out: { label: string | null; rect: Rect | null; pieces: Piece[] }[] = [];
  const keep = (p: Piece) => {
    const r = layout.value.cards.get(p.id);
    return !!r && (p.id === current.value || p.id === opened.value || intersects(r, near.value));
  };
  if (props.layout === "free") return [{ label: null, rect: null, pieces: props.pieces.filter(keep) }];
  for (const section of layout.value.sections) {
    const pieces = section.ids.map((id) => byId.value.get(id)!).filter(keep);
    if (pieces.length || intersects(section.rect, near.value)) out.push({ label: section.label, rect: section.rect, pieces });
  }
  return out;
});

// Live pieces: zoomed in far enough, the cards nearest the middle of the screen (at most MAX_LIVE), plus the open one
const live = computed(() => {
  const ids = new Set<string>(opened.value ? [opened.value] : []);
  if (view.value.zoom < LIVE_ZOOM) return ids;
  const v = visible.value;
  const centre = { x: v.x + v.width / 2, y: v.y + v.height / 2 };
  const candidates = props.pieces
    .filter((p) => p.live && intersects(layout.value.cards.get(p.id)!, v))
    .map((p) => {
      const r = layout.value.cards.get(p.id)!;
      return { id: p.id, d: Math.hypot(r.x + r.width / 2 - centre.x, r.y + r.height / 2 - centre.y) };
    })
    .sort((a, b) => a.d - b.d);
  for (const c of candidates.slice(0, MAX_LIVE)) ids.add(c.id);
  return ids;
});

// Viewport --------------------------------------------------------------------------------------------------------

function glide(next: Viewport) {
  gliding.value = !reducedMotion.value;
  departure.value = gliding.value ? visible.value : null;
  view.value = next;
  // A glide to where the view already is never fires transitionend
  clearTimeout(landing);
  if (gliding.value) landing = setTimeout(landed, 1000);
}
let landing: ReturnType<typeof setTimeout> | undefined;
function landed() {
  gliding.value = false;
  departure.value = null;
}
const centre = (): Point => ({ x: screen.value.width / 2, y: screen.value.height / 2 });
const zoomBy = (factor: number, anchor = centre()) => glide(zoomAt(view.value, view.value.zoom * factor, anchor));
const percent = computed(() => `${Math.round(view.value.zoom * 100)}%`);

function fitAll() {
  glide(fit(world.value, screen.value, INSETS, 1));
  say(`Showing all ${props.pieces.length} pieces.`);
}
function resetZoom() {
  glide(zoomAt(view.value, 1, centre()));
}
// Said once the zoom settles, not at every wheel step – and not when the zoom came with something just said (a jump
// or an open names the piece; the zoom would talk over it)
let zoomTimer: ReturnType<typeof setTimeout> | undefined;
let lastSaid = 0;
function say(text: string) {
  lastSaid = Date.now();
  emit("announce", text);
}
watch(percent, (p) => {
  clearTimeout(zoomTimer);
  zoomTimer = setTimeout(() => Date.now() - lastSaid < 1000 || emit("announce", `Zoom ${p}`), 600);
});

// A new layout or filter can leave the view empty: fit everything again
watch([() => props.layout, () => props.pieces], () => {
  if (opened.value && !byId.value.has(opened.value)) opened.value = null;
  if (current.value && !byId.value.has(current.value)) current.value = props.pieces[0]?.id ?? null;
  if (!intersects(world.value, visible.value)) fitAll();
});

// Cards -----------------------------------------------------------------------------------------------------------

function titleOf(id: string): HTMLElement | null {
  return stage.value?.querySelector<HTMLElement>(`[data-piece="${CSS.escape(id)}"] .card__title`) ?? null;
}
async function focusCard(id: string) {
  current.value = id;
  const rect = layout.value.cards.get(id);
  if (rect) glide(reveal(view.value, rect, screen.value, INSETS));
  await nextTick();
  titleOf(id)?.focus({ preventScroll: true });
}

/** Zooms to the card and runs it live; focus moves into it */
async function open(id: string) {
  const piece = byId.value.get(id);
  const rect = layout.value.cards.get(id);
  if (!piece || !rect) return;
  current.value = id;
  if (!piece.live) {
    glide(fit(rect, screen.value, INSETS, 2.5));
    say(`${piece.name} has no live example; showing its preview.`);
    return;
  }
  opened.value = id;
  const riffing = canRiff(piece);
  if (riffing) void loadKept(piece.slug);
  const tuning = canTune(piece);
  glide(fit(variantBounds.value ?? rect, screen.value, INSETS, 3));
  say(
    `${piece.name} is open. Tab into it to use it${tuning ? `, or ${riffing ? "tune it and riff on it with Claude" : "tune it"} in the panel beside the canvas` : ""}; press Escape to go back to the canvas.`,
  );
}
async function close() {
  const id = opened.value;
  if (!id) return;
  stopRiff();
  opened.value = null;
  say(`Back on the canvas at ${byId.value.get(id)?.name}.`);
  await focusCard(id);
}

/** Free layout: moves a card a step (Shift: a bigger one) */
function move(id: string, direction: Direction, big = false) {
  const rect = layout.value.cards.get(id);
  if (!rect) return;
  const step = big ? CARD.width + GAP : 16;
  const dx = direction === "left" ? -step : direction === "right" ? step : 0;
  const dy = direction === "up" ? -step : direction === "down" ? step : 0;
  moved.value = { ...moved.value, [id]: { x: rect.x + dx, y: rect.y + dy } };
  glide(reveal(view.value, { ...rect, x: rect.x + dx, y: rect.y + dy }, screen.value, INSETS));
}

/** For the toolbar's "Jump to a piece" */
async function jump(id: string) {
  const rect = layout.value.cards.get(id);
  if (!rect) return;
  opened.value = null;
  glide(fit(rect, screen.value, INSETS, 1.5));
  await focusCard(id);
  say(`${byId.value.get(id)?.name ?? "Piece"}.`);
}
defineExpose({ jump });

// Tuning and riffing ------------------------------------------------------------------------------------------------
// An open component gets a panel: dials to tune it by hand, and – in the dev server – Claude proposing variants, drawn
// around it on the canvas and listed in the panel

const canTune = (piece: Piece | undefined) => !!piece && piece.library === "components" && piece.live;
const canRiff = (piece: Piece | undefined) => canTune(piece) && props.riffable.has(piece!.slug);
const openPiece = computed(() => (opened.value ? byId.value.get(opened.value) : undefined));
const panelPiece = computed(() => (canTune(openPiece.value) ? openPiece.value! : null));
const riffPiece = computed(() => (canRiff(openPiece.value) ? openPiece.value! : null));
const variants = computed(() => {
  const piece = riffPiece.value;
  const rect = piece && layout.value.cards.get(piece.id);
  if (!piece || !rect) return [];
  const shown = shownVariants(piece.slug);
  const rects = ring(rect, shown.length);
  return shown.map((variant, i) => ({ variant, rect: rects[i] }));
});
const variantBounds = computed(() => {
  const rect = riffPiece.value && layout.value.cards.get(riffPiece.value.id);
  return rect && variants.value.length ? bounds([rect, ...variants.value.map((v) => v.rect)]) : null;
});
const shownVariant = ref<string | null>(null);
const riffing = ref(false);
const riffStatus = ref("");
const riffError = ref("");
let riffAbort: AbortController | null = null;

async function loadKept(slug: string) {
  const riffs = riffsOf(slug);
  if (riffs.keptLoaded) return;
  try {
    riffs.kept = await keptVariants(slug);
    riffs.keptLoaded = true;
  } catch {
    // Kept variants are a nicety: the piece still opens and riffs without them
  }
}

/** The open piece's live element, whose props a riff starts from */
function liveElement(piece: Piece): HTMLElement | null {
  return stage.value?.querySelector<HTMLElement>(`[data-piece="${CSS.escape(piece.id)}"] .live__piece tc-${piece.slug}`) ?? null;
}

async function riff(prompt: string, from: Round["from"]) {
  const piece = riffPiece.value;
  if (!piece || riffing.value) return;
  const el = liveElement(piece);
  const base = el ? propsOf(el) : {};
  riffing.value = true;
  riffError.value = "";
  riffStatus.value = "Asking Claude…";
  riffAbort = new AbortController();
  try {
    const result = await requestVariants(
      { slug: piece.slug, prompt, props: { ...base, ...from?.props }, tokens: from?.tokens ?? {} },
      (text) => (riffStatus.value = text),
      riffAbort.signal,
    );
    addRound(piece.slug, prompt, from, result);
    shownVariant.value = null;
    riffStatus.value = `${result.length} ${result.length === 1 ? "variant" : "variants"} of ${piece.name}, around it on the canvas.`;
    if (variantBounds.value) glide(fit(variantBounds.value, screen.value, INSETS, 3));
  } catch (error) {
    riffStatus.value = "";
    if ((error as Error).name !== "AbortError") riffError.value = (error as Error).message;
  } finally {
    riffing.value = false;
    riffAbort = null;
  }
}

function stopRiff() {
  riffAbort?.abort();
  if (riffing.value) riffStatus.value = "Stopped.";
}

function showVariant(id: string, round?: string) {
  const piece = riffPiece.value;
  if (!piece) return;
  if (round) riffsOf(piece.slug).shown = round;
  void nextTick(() => {
    const target = variants.value.find((v) => v.variant.id === id);
    if (!target) return;
    shownVariant.value = id;
    glide(fit(target.rect, screen.value, INSETS, 2.5));
    riffStatus.value = `Showing ${target.variant.name}.`;
  });
}

async function keep(variant: Variant & { id: string }, prompt: string) {
  const piece = riffPiece.value;
  if (!piece) return;
  riffError.value = "";
  try {
    const saved = await keepVariant(piece.slug, prompt, variant);
    const riffs = riffsOf(piece.slug);
    riffs.kept = [...riffs.kept.filter((k) => k.name !== saved.kept.name), saved.kept];
    discard(piece.slug, variant.id);
    riffStatus.value = `Kept ${saved.kept.name} in trenchcoat/${saved.file}${saved.request ? `, with a brief for the new code in trenchcoat/${saved.request}` : ""}.`;
  } catch (error) {
    riffError.value = (error as Error).message;
  }
}

/** A version tuned on the dials, kept like a riffed variant */
function keepTuned(v: { name: string; props: Record<string, unknown>; tokens: Record<string, string> }) {
  void keep({ ...v, id: "tuned", rationale: "Tuned by hand on the canvas.", structural: false, note: "", issues: [] }, "Tuned by hand");
}

function discardVariant(id: string) {
  const piece = riffPiece.value;
  if (!piece) return;
  const name = variants.value.find((v) => v.variant.id === id)?.variant.name;
  discard(piece.slug, id);
  riffStatus.value = `Discarded ${name ?? "the variant"}.`;
}

async function remove(kept: Kept) {
  const piece = riffPiece.value;
  if (!piece) return;
  riffError.value = "";
  try {
    riffsOf(piece.slug).kept = await removeVariant(piece.slug, kept.name);
    riffStatus.value = `Removed ${kept.name} from the kept variants.`;
  } catch (error) {
    riffError.value = (error as Error).message;
  }
}

// Keyboard: shortcuts work while focus is on the canvas, never inside an open piece or a text field (WCAG 2.1.4)

const ARROWS: Record<string, Direction> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
function onKeydown(e: KeyboardEvent) {
  if (e.defaultPrevented) return;
  const target = e.target as HTMLElement;
  const inOpen = !!opened.value && !!target.closest(`[data-piece="${CSS.escape(opened.value)}"] .card__stage`);
  if (e.key === "Escape") {
    if (opened.value) {
      e.preventDefault();
      void close();
    }
    return;
  }
  if (inOpen || target.closest("input, textarea, select, [contenteditable]")) return;
  if (e.metaKey || e.ctrlKey) return;

  const direction = ARROWS[e.key];
  if (direction) {
    e.preventDefault();
    const from = current.value ?? props.pieces[0]?.id;
    if (!from) return;
    if (e.altKey && props.layout === "free") return move(from, direction, e.shiftKey);
    const next = nearestIn(layout.value.cards.get(from)!, direction, layout.value.cards, from);
    if (next) void focusCard(next);
    return;
  }
  const keys: Record<string, () => void> = {
    "+": () => zoomBy(STEP),
    "=": () => zoomBy(STEP),
    "-": () => zoomBy(1 / STEP),
    "0": resetZoom,
    "1": fitAll,
    "2": () => current.value && glide(fit(layout.value.cards.get(current.value)!, screen.value, INSETS, 2.5)),
  };
  if (keys[e.key] && !e.altKey) {
    e.preventDefault();
    keys[e.key]();
  }
}

// Pointer: drag the background or a card's picture to pan; drag a card's title bar to move it (Free); two fingers
// pinch to zoom. A press that barely moves is a click and selects the card under it

type Drag = { kind: "pan" | "card"; id?: string; start: Point; origin: Point; moved: boolean };
const pointers = new Map<number, Point>();
const drag = shallowRef<Drag | null>(null);
let pinch: { distance: number; zoom: number } | null = null;

function local(e: PointerEvent | WheelEvent): Point {
  const box = stage.value!.getBoundingClientRect();
  return { x: e.clientX - box.left, y: e.clientY - box.top };
}

function onPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement;
  // Controls and open pieces keep their own pointer handling
  if (e.button !== 0 || target.closest("button, a, input, tc-button, .card--open .card__stage")) return;
  pointers.set(e.pointerId, local(e));
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: view.value.zoom };
    drag.value = null;
    return;
  }
  const handle = target.closest<HTMLElement>("[data-drag-handle]")?.dataset.dragHandle;
  const rect = handle ? layout.value.cards.get(handle) : undefined;
  landed();
  drag.value =
    handle && rect
      ? { kind: "card", id: handle, start: local(e), origin: { x: rect.x, y: rect.y }, moved: false }
      : { kind: "pan", start: local(e), origin: { x: view.value.x, y: view.value.y }, moved: false };
  stage.value!.setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, local(e));
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    view.value = zoomAt(view.value, (pinch.zoom * distance) / pinch.distance, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    return;
  }
  const d = drag.value;
  if (!d) return;
  const p = local(e);
  const dx = p.x - d.start.x;
  const dy = p.y - d.start.y;
  if (!d.moved && Math.hypot(dx, dy) < 4) return;
  d.moved = true;
  if (d.kind === "pan") view.value = { ...view.value, x: d.origin.x + dx, y: d.origin.y + dy };
  else if (d.id) moved.value = { ...moved.value, [d.id]: { x: d.origin.x + dx / view.value.zoom, y: d.origin.y + dy / view.value.zoom } };
}

function onPointerUp(e: PointerEvent) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  const d = drag.value;
  drag.value = null;
  if (!d || d.moved) return;
  const id = (e.target as HTMLElement).closest<HTMLElement>("[data-piece]")?.dataset.piece;
  if (id) void focusCard(id);
}

// Wheel: scrolling pans; with Ctrl or ⌘ (and trackpad pinches, which arrive that way) it zooms at the pointer
function onWheel(e: WheelEvent) {
  if (opened.value && (e.target as HTMLElement).closest(".card--open .card__stage")) return;
  e.preventDefault();
  landed();
  if (e.ctrlKey || e.metaKey) view.value = zoomAt(view.value, view.value.zoom * Math.exp(-e.deltaY * 0.01), local(e));
  else view.value = { ...view.value, x: view.value.x - e.deltaX, y: view.value.y - e.deltaY };
}

let observer: ResizeObserver | undefined;
onMounted(() => {
  const el = stage.value!;
  el.addEventListener("wheel", onWheel, { passive: false });
  worldEl.value?.addEventListener("transitionend", onLanded);
  observer = new ResizeObserver(([entry]) => {
    const first = screen.value.width === 0;
    screen.value = { width: entry.contentRect.width, height: entry.contentRect.height };
    if (first) {
      view.value = fit(world.value, screen.value, INSETS, 1);
      current.value = props.pieces[0]?.id ?? null;
    } else if (opened.value) {
      // The riff panel opening (or the window resizing) changes the room: keep the open piece and its variants in view
      const rect = variantBounds.value ?? layout.value.cards.get(opened.value);
      if (rect) glide(fit(rect, screen.value, INSETS, 3));
    }
  });
  observer.observe(el);
});
onBeforeUnmount(() => {
  clearTimeout(zoomTimer);
  clearTimeout(landing);
  stage.value?.removeEventListener("wheel", onWheel);
  worldEl.value?.removeEventListener("transitionend", onLanded);
  observer?.disconnect();
});

const worldStyle = computed(() => ({ transform: `translate(${view.value.x}px, ${view.value.y}px) scale(${view.value.zoom})` }));
</script>

<template>
  <div class="canvas">
    <div class="canvas__body">
      <!-- The stage only pans and zooms under the pointer; keyboard and single-pointer users get the same from the cards'
         own buttons (arrows, Enter) and the zoom buttons below, and keydown here is delegated from those buttons -->
      <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
      <section
        ref="stage"
        class="stage"
        :class="{ 'stage--panning': drag?.kind === 'pan' && drag.moved }"
        aria-roledescription="canvas"
        aria-label="Pieces"
        aria-describedby="canvas-keys"
        @keydown="onKeydown"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div ref="world" class="world" :class="{ 'world--glide': gliding }" :style="worldStyle">
          <!-- The links are a picture of what each card's description says ("Built with … Used in …") -->
          <svg v-if="links.length" class="links" :width="world.x + world.width" :height="world.y + world.height" aria-hidden="true">
            <defs>
              <marker :id="linkMarker" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" class="links__head" />
              </marker>
            </defs>
            <path v-for="link in links" :key="link.key" :d="link.d" class="link" :class="{ 'link--active': link.active }" :marker-end="`url(#${linkMarker})`" />
          </svg>
          <section v-for="group in rendered" :key="group.label ?? 'free'" class="group" :aria-label="group.label ?? undefined">
            <h3 v-if="group.label && group.rect" class="group__title" :style="{ transform: `translate(${group.rect.x}px, ${group.rect.y}px)` }">
              {{ group.label }}
            </h3>
            <PieceCard
              v-for="piece in group.pieces"
              :key="piece.id"
              :piece="piece"
              :rect="layout.cards.get(piece.id)!"
              :live="live.has(piece.id)"
              :open="opened === piece.id"
              :current="current === piece.id"
              :movable="props.layout === 'free'"
              :look-alikes="alike(lookAlikesOf(piece.id))"
              :most-like="props.layout === 'similar' ? alike(neighboursOf(piece.id).slice(0, 3)) : []"
              :can-find-similar="props.layout !== 'similar' && compared(piece.id)"
              :composition="props.layout === 'graph' ? compositionText(piece.id) : ''"
              :theme="theme"
              :look="look"
              @select="current = piece.id"
              @open="opened === piece.id ? close() : open(piece.id)"
              @move="(d) => move(piece.id, d)"
              @similar="emit('similar', piece.id)"
            />
          </section>
          <section v-if="riffPiece && variants.length" class="variants" :aria-label="`Variants of ${riffPiece.name}`">
            <VariantCard
              v-for="v in variants"
              :key="v.variant.id"
              :variant="v.variant"
              :slug="riffPiece.slug"
              :rect="v.rect"
              :current="shownVariant === v.variant.id"
            />
          </section>
        </div>
        <p v-if="!pieces.length" class="empty">No pieces match the filters.</p>
      </section>
      <RiffPanel
        v-if="panelPiece"
        :piece="panelPiece"
        :riffs="riffsOf(panelPiece.slug)"
        :theme="theme"
        :can-riff="!!riffPiece"
        :find-element="() => liveElement(panelPiece!)"
        :busy="riffing"
        :status="riffStatus"
        :error="riffError"
        @riff="riff"
        @cancel="stopRiff"
        @keep="keep"
        @discard="discardVariant"
        @remove="remove"
        @show="showVariant"
        @close="close"
        @keep-tuned="keepTuned"
      />
    </div>

    <footer class="foot">
      <p class="foot__count">{{ summary }}</p>
      <p id="canvas-keys" class="foot__keys">
        <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> back · <kbd>+</kbd><kbd>−</kbd> zoom · <kbd>1</kbd> fit
        all<template v-if="props.layout === 'free'"> · <kbd>Alt</kbd> + arrows move a card</template>
      </p>
      <div class="foot__zoom" role="group" aria-label="Zoom">
        <tc-button variant="ghost" size="sm" hide-label label="Zoom out" @click="zoomBy(1 / STEP)">
          <ZoomOut slot="icon" :size="16" aria-hidden="true" />
        </tc-button>
        <tc-button variant="ghost" size="sm" :label="percent" :aria-label="`Zoom ${percent}, reset to 100%`" @click="resetZoom"></tc-button>
        <tc-button variant="ghost" size="sm" hide-label label="Zoom in" @click="zoomBy(STEP)">
          <ZoomIn slot="icon" :size="16" aria-hidden="true" />
        </tc-button>
        <tc-button variant="ghost" size="sm" hide-label label="Fit all" @click="fitAll">
          <Maximize slot="icon" :size="16" aria-hidden="true" />
        </tc-button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.canvas {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

/* The stage, and the riff panel beside it when one is open */
.canvas__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.stage {
  position: relative;
  flex: 1;
  overflow: hidden;
  background-color: var(--tc-surface-sunken);
  background-image: radial-gradient(var(--tc-border-default) 1px, transparent 1px);
  background-size: 24px 24px;
  cursor: grab;
  touch-action: none;
}

.stage--panning {
  cursor: grabbing;
}

.world {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.world--glide {
  transition: transform var(--tc-duration-moderate) var(--tc-ease-standard);
}

.links {
  position: absolute;
  top: 0;
  left: 0;
  overflow: visible;
  pointer-events: none;
}

.link {
  fill: none;
  stroke: var(--tc-border-strong);
  stroke-width: 1.5;
}

.link--active {
  stroke: var(--tc-border-selected);
  stroke-width: 3;
}

.links__head {
  fill: var(--tc-border-strong);
}

.group__title {
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-xl);
  font-weight: var(--tc-font-weight-semibold);
  white-space: nowrap;
}

.empty {
  position: absolute;
  inset: 0;
  display: grid;
  margin: 0;
  place-items: center;
  color: var(--tc-text-secondary);
}

.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-2) var(--tc-space-4);
  padding: var(--tc-space-1) var(--tc-space-4);
  border-top: var(--tc-hairline) solid var(--tc-divider);
  background: var(--tc-surface-raised);
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
}

.foot p {
  margin: 0;
}

.foot__keys {
  flex: 1;
}

.foot__keys kbd {
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-kbd-radius);
  background: var(--tc-surface-sunken);
  box-shadow: var(--tc-kbd-shadow);
  font-family: inherit;
  font-size: var(--tc-kbd-font-size);
}

.foot__keys kbd + kbd {
  margin-left: 2px;
}

.foot__zoom {
  display: flex;
  align-items: center;
}

/* Touch-sized screens rarely have a keyboard: the hints step aside, and still describe the canvas to screen readers */
@media (max-width: 48rem) {
  .canvas__body {
    flex-direction: column;
  }

  .foot__keys {
    display: none;
  }

  .foot__zoom {
    margin-left: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .world--glide {
    transition: none;
  }
}
</style>
