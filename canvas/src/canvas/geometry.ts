// The canvas's maths, kept free of Vue and the DOM so it is easy to test: the viewport (pan and zoom), the layouts,
// and moving between cards with the arrow keys.

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
/** The world is drawn at screen = world × zoom + pan */
export type Viewport = { x: number; y: number; zoom: number };

/** Every card is the size of a thumbnail (320 × 200, 16:10) plus its title bar */
export const CARD = { width: 320, stage: 200, header: 40, height: 240 } as const;
export const GAP = 32;
export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 4;
/** From this zoom on, cards in view swap their thumbnail for the live piece */
export const LIVE_ZOOM = 1.25;
/** At most this many live pieces at once – each is a full component */
export const MAX_LIVE = 12;

export const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

/** Zooms to `zoom`, keeping the world point under `anchor` (a screen point) where it is */
export function zoomAt(view: Viewport, zoom: number, anchor: Point): Viewport {
  const next = clampZoom(zoom);
  const wx = (anchor.x - view.x) / view.zoom;
  const wy = (anchor.y - view.y) / view.zoom;
  return { x: anchor.x - wx * next, y: anchor.y - wy * next, zoom: next };
}

/** The world rectangle the screen shows */
export function visibleWorld(view: Viewport, screen: { width: number; height: number }): Rect {
  return { x: -view.x / view.zoom, y: -view.y / view.zoom, width: screen.width / view.zoom, height: screen.height / view.zoom };
}

export const intersects = (a: Rect, b: Rect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** Fits `rect` inside the screen, less `inset` on each side, centred; never zooms past `maxZoom` */
export function fit(rect: Rect, screen: { width: number; height: number }, inset: Insets = NO_INSETS, maxZoom = MAX_ZOOM): Viewport {
  const width = Math.max(1, screen.width - inset.left - inset.right);
  const height = Math.max(1, screen.height - inset.top - inset.bottom);
  const zoom = clampZoom(Math.min(width / rect.width, height / rect.height, maxZoom));
  return {
    x: inset.left + (width - rect.width * zoom) / 2 - rect.x * zoom,
    y: inset.top + (height - rect.height * zoom) / 2 - rect.y * zoom,
    zoom,
  };
}

export type Insets = { top: number; right: number; bottom: number; left: number };
export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Pans the least it takes to show all of `rect` clear of the insets (WCAG 2.4.11: focus not hidden under the bars) */
export function reveal(view: Viewport, rect: Rect, screen: { width: number; height: number }, inset: Insets): Viewport {
  const s = { x: rect.x * view.zoom + view.x, y: rect.y * view.zoom + view.y, w: rect.width * view.zoom, h: rect.height * view.zoom };
  const room = { left: inset.left, top: inset.top, right: screen.width - inset.right, bottom: screen.height - inset.bottom };
  // Too big to show whole: fit it instead
  if (s.w > room.right - room.left || s.h > room.bottom - room.top) return fit(rect, screen, inset, view.zoom);
  const dx = s.x < room.left ? room.left - s.x : s.x + s.w > room.right ? room.right - (s.x + s.w) : 0;
  const dy = s.y < room.top ? room.top - s.y : s.y + s.h > room.bottom ? room.bottom - (s.y + s.h) : 0;
  return dx || dy ? { ...view, x: view.x + dx, y: view.y + dy } : view;
}

export const bounds = (rects: readonly Rect[]): Rect => {
  if (!rects.length) return { x: 0, y: 0, width: CARD.width, height: CARD.height };
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return { x, y, width: Math.max(...rects.map((r) => r.x + r.width)) - x, height: Math.max(...rects.map((r) => r.y + r.height)) - y };
};

/** A labelled block of cards; `ids` are its cards in reading order */
export type Section = { label: string; rect: Rect; ids: readonly string[] };
export type Layout = { cards: Map<string, Rect>; sections: Section[] };

/**
 * Grid: one section per category, in the given order, each a block of cards a few columns wide. Sections are packed
 * into rows ("shelves") no wider than `maxWidth`, so the whole map is roughly landscape
 */
export function gridLayout(groups: readonly { label: string; ids: readonly string[] }[], maxWidth = 9000): Layout {
  const cards = new Map<string, Rect>();
  const sections: Section[] = [];
  const TITLE = 56;
  let x = 0;
  let y = 0;
  let shelf = 0;
  for (const { label, ids } of groups) {
    if (!ids.length) continue;
    const columns = Math.min(ids.length, Math.max(2, Math.ceil(Math.sqrt(ids.length * 1.2))));
    const rows = Math.ceil(ids.length / columns);
    const width = columns * CARD.width + (columns - 1) * GAP;
    const height = TITLE + rows * CARD.height + (rows - 1) * GAP;
    if (x > 0 && x + width > maxWidth) {
      x = 0;
      y += shelf + GAP * 4;
      shelf = 0;
    }
    sections.push({ label, rect: { x, y, width, height }, ids });
    ids.forEach((id, i) => {
      cards.set(id, {
        x: x + (i % columns) * (CARD.width + GAP),
        y: y + TITLE + Math.floor(i / columns) * (CARD.height + GAP),
        width: CARD.width,
        height: CARD.height,
      });
    });
    x += width + GAP * 4;
    shelf = Math.max(shelf, height);
  }
  return { cards, sections };
}

/** Free: the grid, with the cards the viewer has moved where they put them; no sections */
export function freeLayout(base: Layout, moved: Readonly<Record<string, Point>>): Layout {
  const cards = new Map<string, Rect>();
  for (const [id, rect] of base.cards) cards.set(id, moved[id] ? { ...rect, ...moved[id] } : rect);
  return { cards, sections: [] };
}

export type Direction = "left" | "right" | "up" | "down";

/**
 * The card an arrow key moves to: the nearest one whose centre lies in that direction, within a 45° cone either side,
 * weighting sideways distance so a card straight ahead wins over a closer one off to the side
 */
export function nearestIn(from: Rect, direction: Direction, cards: ReadonlyMap<string, Rect>, skip?: string): string | null {
  const c = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  let best: string | null = null;
  let bestScore = Infinity;
  for (const [id, r] of cards) {
    if (id === skip) continue;
    const dx = r.x + r.width / 2 - c.x;
    const dy = r.y + r.height / 2 - c.y;
    const [ahead, side] = direction === "left" ? [-dx, dy] : direction === "right" ? [dx, dy] : direction === "up" ? [-dy, dx] : [dy, dx];
    if (ahead <= 0 || Math.abs(side) > ahead) continue;
    const score = ahead + Math.abs(side) * 2;
    if (score < bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}
