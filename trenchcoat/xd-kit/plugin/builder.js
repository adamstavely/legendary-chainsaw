// Builds the Trenchcoat kit in an XD document from the layers xd-kit/extract.mjs read out of the browser. XD's modules
// come in as `xd` ({ scenegraph, commands, selection, assets }), so the same code runs against a stand-in in the tests.
//
// What XD's plugin API allows shapes the approach:
//   · groups can't be constructed – children are added to the artboard, selected, and grouped with commands.group(),
//     innermost first; clipping is commands.createMaskGroup() with the mask shape on top
//   · plugins can't create components – every component arrives as a named group, ready for Object › Make Component
//   · point text sits on its baseline at local y = 0; wrapped text is placed the same way, then given its width, so
//     XD keeps the first line where the browser drew it

/** Font families: the kit's "sans" and "mono", and the style names XD knows them by */
const DEFAULT_FONTS = { sans: "Inter", mono: "Menlo" };
const STYLE_NAMES = {
  sans: { 100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black" },
  // Menlo has two weights
  mono: { 100: "Regular", 200: "Regular", 300: "Regular", 400: "Regular", 500: "Regular", 600: "Bold", 700: "Bold", 800: "Bold", 900: "Bold" },
};
function fontFor(font, fonts = DEFAULT_FONTS) {
  const family = font.family === "mono" ? "mono" : "sans";
  let style = STYLE_NAMES[family][font.weight] ?? "Regular";
  if (font.italic) style = style === "Regular" ? "Italic" : `${style} Italic`;
  return { fontFamily: fonts[family], fontStyle: style };
}

const VARIANT_LABEL = { "standard-light": "Standard · Light", "standard-dark": "Standard · Dark", "clean-light": "Clean · Light", "clean-dark": "Clean · Dark" };
const BACKDROP = { light: { r: 250, g: 250, b: 249, a: 1 }, dark: { r: 14, g: 14, b: 16, a: 1 } };
const INK = { light: { r: 82, g: 82, b: 91, a: 1 }, dark: { r: 161, g: 161, b: 170, a: 1 } };

/* ---------- Layout: where every artboard and component goes, worked out before anything is built ---------- */

const GAP = 80;
const PAD = 80;
const LABEL = 36;
const TITLE = 96;
const ROW_MAX = 1680;
const BOARD_GAP = 240;

/**
 * Lays out one artboard per category per variant – categories down, variants across – with each category's components
 * flowing left to right under their names.
 *   components: [{ slug, name, category, tree }]   (tree = one variant's { x, y, w, h, layers })
 */
function layoutBoard(components) {
  const items = [];
  let x = PAD;
  let y = PAD + TITLE;
  let rowH = 0;
  let width = 0;
  for (const c of components) {
    const w = Math.max(c.tree.w, 160);
    const h = c.tree.h + LABEL;
    if (x > PAD && x + w > PAD + ROW_MAX) {
      x = PAD;
      y += rowH + GAP;
      rowH = 0;
    }
    items.push({ ...c, x, y });
    x += w + GAP;
    rowH = Math.max(rowH, h);
    width = Math.max(width, x - GAP + PAD);
  }
  return { items, w: Math.max(width, 960), h: y + rowH + PAD };
}

function layoutKit(categories, variants, byCategory) {
  const boards = [];
  const colW = variants.map(() => 0);
  const rows = categories.map((cat) =>
    variants.map((v, i) => {
      const comps = byCategory(cat, v);
      if (!comps.length) return null;
      const b = { category: cat, variant: v, ...layoutBoard(comps) };
      colW[i] = Math.max(colW[i], b.w);
      return b;
    }),
  );
  let y = 0;
  for (const row of rows) {
    let x = 0;
    let rowH = 0;
    row.forEach((b, i) => {
      if (b) {
        b.x = x;
        b.y = y;
        boards.push(b);
        rowH = Math.max(rowH, b.h);
      }
      x += colW[i] + BOARD_GAP;
    });
    if (rowH) y += rowH + BOARD_GAP;
  }
  return boards;
}

/* ---------- Building ---------- */

function makeBuilder(xd, options = {}) {
  const { scenegraph: sg, commands, selection } = xd;
  const { Rectangle, Text, Path, Color, Shadow, LinearGradientFill, ImageFill, GraphicNode } = sg;
  const fonts = { ...DEFAULT_FONTS, ...(options.fonts ?? {}) };
  const stats = { nodes: 0, groups: 0, masks: 0, skipped: 0 };

  const color = (c) => new Color({ r: c.r, g: c.g, b: c.b, a: Math.round(c.a * 255) });
  const place = (node, x, y) => node.moveInParentCoordinates(x, y);

  function rect(l, parent, ox, oy) {
    const r = new Rectangle();
    r.name = l.name;
    r.width = Math.max(0.5, l.w);
    r.height = Math.max(0.5, l.h);
    if (l.radii) r.cornerRadii = { topLeft: l.radii[0], topRight: l.radii[1], bottomRight: l.radii[2], bottomLeft: l.radii[3] };
    if (l.gradient) {
      const g = new LinearGradientFill();
      g.colorStops = l.gradient.stops.map((s) => ({ stop: s.at, color: color(s.color) }));
      g.setEndPoints(l.gradient.start[0], l.gradient.start[1], l.gradient.end[0], l.gradient.end[1]);
      r.fill = g;
      r.fillEnabled = true;
    } else if (l.fill) {
      r.fill = color(l.fill);
      r.fillEnabled = true;
    } else {
      r.fillEnabled = false;
    }
    if (l.stroke) {
      r.stroke = color(l.stroke.color);
      r.strokeWidth = l.stroke.width;
      r.strokePosition = l.stroke.outside ? GraphicNode.OUTER_STROKE : GraphicNode.INNER_STROKE;
      if (l.stroke.dash) r.strokeDashArray = l.stroke.dash;
      r.strokeEnabled = true;
    } else {
      r.strokeEnabled = false;
    }
    if (l.shadow) r.shadow = new Shadow(l.shadow.x, l.shadow.y, l.shadow.blur, color(l.shadow.color), true);
    if (l.opacity !== undefined) r.opacity = l.opacity;
    parent.addChild(r);
    place(r, ox + l.x, oy + l.y);
    return r;
  }

  function image(l, parent, ox, oy) {
    const r = new Rectangle();
    r.name = l.name;
    r.width = Math.max(0.5, l.w);
    r.height = Math.max(0.5, l.h);
    if (l.radii) r.cornerRadii = { topLeft: l.radii[0], topRight: l.radii[1], bottomRight: l.radii[2], bottomLeft: l.radii[3] };
    try {
      r.fill = new ImageFill(l.src);
    } catch {
      // An encoding XD won't take (it reads PNG, JPEG and GIF): a neutral placeholder instead
      r.fill = new Color("#c8cdd4");
    }
    r.strokeEnabled = false;
    parent.addChild(r);
    place(r, ox + l.x, oy + l.y);
    return r;
  }

  function text(l, parent, ox, oy) {
    const t = new Text();
    t.name = l.text.length > 40 ? `${l.text.slice(0, 40)}…` : l.text;
    t.text = l.text;
    const f = fontFor(l.font, fonts);
    t.styleRanges = [
      {
        length: l.text.length,
        fontFamily: f.fontFamily,
        fontStyle: f.fontStyle,
        fontSize: l.font.size,
        fill: color(l.color),
        charSpacing: l.font.tracking ?? 0,
        underline: !!l.font.underline,
        strikethrough: !!l.font.strike,
        textTransform: l.font.transform ?? "none",
      },
    ];
    parent.addChild(t);
    if (!l.area) {
      // Point text: its anchor (left, centre or right, by alignment) on the baseline
      t.textAlign = l.align === "center" ? Text.ALIGN_CENTER : l.align === "right" ? Text.ALIGN_RIGHT : Text.ALIGN_LEFT;
      place(t, ox + l.x, oy + l.y);
      return t;
    }
    // Wrapped text: placed as one line with its first baseline where the browser drew it, then given the width to wrap
    // in – XD keeps the text's origin, so the first line stays put
    t.textAlign = Text.ALIGN_LEFT;
    if (l.lineHeight) t.lineSpacing = l.lineHeight;
    place(t, ox + l.x, oy + l.y + l.baseline);
    if (Text.AUTO_HEIGHT !== undefined) t.layoutBox = { type: Text.AUTO_HEIGHT, width: l.w };
    else t.areaBox = { width: l.w, height: l.h };
    if (l.align !== "left") t.textAlign = l.align === "center" ? Text.ALIGN_CENTER : Text.ALIGN_RIGHT;
    return t;
  }

  function path(l, parent, ox, oy) {
    const p = new Path();
    p.name = l.name;
    p.pathData = l.d;
    if (l.fill) {
      p.fill = color(l.fill);
      p.fillEnabled = true;
    } else {
      p.fillEnabled = false;
    }
    if (l.stroke) {
      p.stroke = color(l.stroke.color);
      p.strokeWidth = l.stroke.width;
      p.strokePosition = GraphicNode.CENTER_STROKE;
      p.strokeEndCaps = l.stroke.cap === "round" ? GraphicNode.STROKE_CAP_ROUND : l.stroke.cap === "square" ? GraphicNode.STROKE_CAP_SQUARE : GraphicNode.STROKE_CAP_NONE;
      p.strokeJoins = l.stroke.join === "round" ? GraphicNode.STROKE_JOIN_ROUND : l.stroke.join === "bevel" ? GraphicNode.STROKE_JOIN_BEVEL : GraphicNode.STROKE_JOIN_MITER;
      if (l.stroke.dash) p.strokeDashArray = l.stroke.dash;
      p.strokeEnabled = true;
    } else {
      p.strokeEnabled = false;
    }
    if (l.opacity !== undefined) p.opacity = l.opacity;
    parent.addChild(p);
    // Path data is in the component's coordinates: the path moves with the component
    place(p, ox, oy);
    return p;
  }

  /** Builds a layer into `parent` (the artboard), returning the one node that now stands for it, or null */
  function layer(l, parent, ox, oy) {
    if (l.t === "group") return group(l, parent, ox, oy);
    let n = null;
    if (l.t === "rect") n = rect(l, parent, ox, oy);
    else if (l.t === "text") n = text(l, parent, ox, oy);
    else if (l.t === "path") n = path(l, parent, ox, oy);
    else if (l.t === "image") n = image(l, parent, ox, oy);
    else stats.skipped++;
    if (n) stats.nodes++;
    return n;
  }

  function group(l, parent, ox, oy) {
    const kids = l.layers.map((c) => layer(c, parent, ox, oy)).filter(Boolean);
    if (!kids.length) return null;
    let g;
    if (l.clip) {
      const mask = new Rectangle();
      mask.width = Math.max(0.5, l.clip.w);
      mask.height = Math.max(0.5, l.clip.h);
      if (l.clip.radii) mask.cornerRadii = { topLeft: l.clip.radii[0], topRight: l.clip.radii[1], bottomRight: l.clip.radii[2], bottomLeft: l.clip.radii[3] };
      mask.fill = new Color("#000000");
      parent.addChild(mask);
      place(mask, ox + l.clip.x, oy + l.clip.y);
      // The mask must be the topmost of the selection
      selection.items = [...kids, mask];
      commands.createMaskGroup();
      g = selection.items[0];
      stats.masks++;
    } else if (kids.length === 1 && l.opacity === undefined) {
      // A group of one adds a level and nothing else: the child takes the name
      g = kids[0];
      if (!g.name || g.name === "text") g.name = l.name;
      return g;
    } else {
      selection.items = kids;
      commands.group();
      g = selection.items[0];
    }
    stats.groups++;
    g.name = l.name;
    if (l.opacity !== undefined) g.opacity = l.opacity;
    return g;
  }

  /** One component: its name above it, its layers grouped and named "<Name> / <Look> · <Theme>" */
  function component(item, board, variant, theme) {
    const tree = item.tree;
    // The tree's origin can sit left of or above zero (shadows, popovers): shift so its box starts at the item's corner
    const ox = item.x - tree.x;
    const oy = item.y + LABEL - tree.y;
    const label = new Text();
    label.text = item.name;
    label.styleRanges = [{ length: item.name.length, fontFamily: fonts.sans, fontStyle: "Medium", fontSize: 14, fill: color(INK[theme]), charSpacing: 0, underline: false }];
    label.name = "Label";
    board.addChild(label);
    place(label, item.x, item.y + 16);
    const top = group({ t: "group", name: `${item.name} / ${VARIANT_LABEL[variant]}`, layers: tree.layers }, board, ox, oy);
    if (top && top.name !== `${item.name} / ${VARIANT_LABEL[variant]}`) top.name = `${item.name} / ${VARIANT_LABEL[variant]}`;
    return top;
  }

  function artboard(b, root) {
    const theme = b.variant.endsWith("dark") ? "dark" : "light";
    const ab = new sg.Artboard();
    ab.name = `${b.category} — ${VARIANT_LABEL[b.variant]}`;
    ab.width = b.w;
    ab.height = b.h;
    ab.fill = color(BACKDROP[theme]);
    const boards = root.children.filter ? root.children.filter((n) => n instanceof sg.Artboard).length : 0;
    root.addChild(ab, boards);
    place(ab, b.x, b.y);
    const title = new Text();
    const words = `${b.category}`;
    title.text = words;
    title.styleRanges = [{ length: words.length, fontFamily: fonts.sans, fontStyle: "SemiBold", fontSize: 32, fill: color(theme === "dark" ? { r: 244, g: 244, b: 245, a: 1 } : { r: 24, g: 24, b: 27, a: 1 }), charSpacing: -10, underline: false }];
    title.name = "Title";
    ab.addChild(title);
    place(title, PAD, PAD + 32);
    const sub = new Text();
    const subText = `${VARIANT_LABEL[b.variant]} · ${b.items.length} components · Trenchcoat`;
    sub.text = subText;
    sub.styleRanges = [{ length: subText.length, fontFamily: fonts.sans, fontStyle: "Regular", fontSize: 14, fill: color(INK[theme]), charSpacing: 0, underline: false }];
    sub.name = "Subtitle";
    ab.addChild(sub);
    place(sub, PAD, PAD + 58);
    return ab;
  }

  return { rect, text, path, image, layer, group, component, artboard, stats };
}

/** Colours (both themes) and the type scale into the document's Assets panel */
function addAssets(xd, tokens, options = {}) {
  const { scenegraph: sg, assets } = xd;
  const fonts = { ...DEFAULT_FONTS, ...(options.fonts ?? {}) };
  const color = (c) => new sg.Color({ r: c.r, g: c.g, b: c.b, a: Math.round(c.a * 255) });
  const have = new Set(assets.colors.get().map((c) => c.name).filter(Boolean));
  const colours = [];
  for (const theme of ["light", "dark"]) {
    for (const [name, c] of Object.entries(tokens.colours[theme] ?? {})) {
      const n = `${theme === "light" ? "Light" : "Dark"} / ${name}`;
      if (!have.has(n)) colours.push({ name: n, color: color(c) });
    }
  }
  const styles = assets.characterStyles.get().map((s) => s.name);
  const ink = tokens.colours.light["text-primary"] ?? { r: 24, g: 24, b: 27, a: 1 };
  const type = tokens.type
    .filter((t) => !styles.includes(t.name))
    .map((t) => ({
      name: t.name,
      style: { ...fontFor({ family: "sans", weight: t.weight }, fonts), fontSize: t.size, fill: color(ink), charSpacing: 0, lineSpacing: t.lineHeight, underline: false },
    }));
  return { colours: colours.length ? assets.colors.add(colours) : 0, styles: type.length ? assets.characterStyles.add(type) : 0 };
}

module.exports = { DEFAULT_FONTS, VARIANT_LABEL, fontFor, layoutBoard, layoutKit, makeBuilder, addAssets };
