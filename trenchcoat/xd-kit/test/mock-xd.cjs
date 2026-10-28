// A stand-in for XD's scenegraph, commands and assets modules, following the documented rules the builder relies on:
// containers can't be constructed (commands.group() and createMaskGroup() make them from the selection, the mask the
// topmost item), the selection must share one parent, nodes start at (0, 0) and move with moveInParentCoordinates(),
// point text sits on its baseline at y = 0, and turning point text into area text keeps it where it was.
class Color {
  constructor(v, opacity) {
    if (typeof v === "string") {
      const m = v.match(/^#([0-9a-f]{6})$/i);
      if (!m) throw new Error(`Color: unsupported ${v}`);
      const n = parseInt(m[1], 16);
      Object.assign(this, { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: Math.round((opacity ?? 1) * 255) });
    } else Object.assign(this, { a: 255, ...v });
    for (const k of ["r", "g", "b", "a"]) if (!Number.isInteger(this[k]) || this[k] < 0 || this[k] > 255) throw new Error(`Color: ${k} = ${this[k]}`);
  }
}
class Shadow {
  constructor(x, y, blur, color, visible = true) {
    Object.assign(this, { x, y, blur, color, visible });
  }
}
class LinearGradientFill {
  constructor() {
    this.colorStops = [];
  }
  setEndPoints(sx, sy, ex, ey) {
    Object.assign(this, { startX: sx, startY: sy, endX: ex, endY: ey });
  }
}
class ImageFill {
  constructor(src) {
    if (typeof src !== "string" || !/^data:image\/(png|jpeg|gif);base64,/.test(src)) throw new Error("ImageFill: PNG, JPEG or GIF data URI only");
    this.src = src;
  }
}

class NodeList {
  constructor(arr) {
    this.arr = arr;
  }
  get length() {
    return this.arr.length;
  }
  forEach(f) {
    this.arr.forEach(f);
  }
  filter(f) {
    return this.arr.filter(f);
  }
  map(f) {
    return this.arr.map(f);
  }
  some(f) {
    return this.arr.some(f);
  }
  at(i) {
    return this.arr[i];
  }
}

class SceneNode {
  constructor() {
    this.parent = null;
    this._children = [];
    this.name = "";
    this.opacity = 1;
    this.translation = { x: 0, y: 0 };
  }
  get children() {
    return new NodeList(this._children);
  }
  moveInParentCoordinates(dx, dy) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error(`move: ${dx}, ${dy}`);
    this.translation = { x: this.translation.x + dx, y: this.translation.y + dy };
  }
  /** Position in the document: the sum of translations up the parent chain */
  get global() {
    let x = 0;
    let y = 0;
    for (let n = this; n; n = n.parent) {
      x += n.translation.x;
      y += n.translation.y;
    }
    return { x, y };
  }
  get boundsInParent() {
    return { x: this.translation.x, y: this.translation.y, width: this.width ?? 0, height: this.height ?? 0 };
  }
}
class Container extends SceneNode {
  addChild(node, index) {
    if (!(node instanceof SceneNode)) throw new Error("addChild: not a node");
    if (node.parent) throw new Error("addChild: node already has a parent");
    if (node instanceof Artboard && !(this instanceof RootNode)) throw new Error("Artboards belong to the root");
    node.parent = this;
    if (index === undefined) this._children.push(node);
    else this._children.splice(index, 0, node);
  }
}
class RootNode extends Container {}
class Artboard extends Container {}
class Group extends Container {}
class GraphicNode extends SceneNode {
  constructor() {
    super();
    this.fillEnabled = true;
    this.strokeEnabled = false;
  }
}
Object.assign(GraphicNode, {
  INNER_STROKE: "inside",
  OUTER_STROKE: "outside",
  CENTER_STROKE: "center",
  STROKE_CAP_NONE: "butt",
  STROKE_CAP_SQUARE: "square",
  STROKE_CAP_ROUND: "round",
  STROKE_JOIN_BEVEL: "bevel",
  STROKE_JOIN_ROUND: "round",
  STROKE_JOIN_MITER: "miter",
});
class Rectangle extends GraphicNode {
  constructor() {
    super();
    this.width = 100;
    this.height = 100;
    this.cornerRadii = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 };
  }
}
class Path extends GraphicNode {
  set pathData(d) {
    if (!/^M/.test(d) || /[^MLCZ0-9.\s-]/.test(d)) throw new Error(`pathData: ${d.slice(0, 40)}`);
    this._d = d;
  }
  get pathData() {
    return this._d;
  }
}
class Text extends GraphicNode {
  constructor() {
    super();
    this.text = " ";
    this.styleRanges = [];
    this.textAlign = "left";
    this.lineSpacing = 0;
    this._layout = { type: "point" };
  }
  set layoutBox(v) {
    if (v.type !== Text.POINT && !(v.width > 0)) throw new Error("layoutBox: width needed");
    // XD keeps the text where it was when it changes type: the stand-in keeps its first baseline
    this._layout = v;
  }
  get layoutBox() {
    return this._layout;
  }
}
Object.assign(Text, { ALIGN_LEFT: "left", ALIGN_CENTER: "center", ALIGN_RIGHT: "right", POINT: "point", FIXED_HEIGHT: "fixed", AUTO_HEIGHT: "auto" });

function create() {
  const root = new RootNode();
  let items = [];
  const selection = {
    get items() {
      return items;
    },
    set items(list) {
      const parents = new Set(list.map((n) => n.parent));
      if (parents.size > 1) throw new Error("selection: items must share a parent");
      const p = [...parents][0];
      if (p && p instanceof Group && p.mask) throw new Error("selection: inside a masked group is out of scope");
      items = [...list];
    },
  };
  function wrap(mask) {
    if (!items.length) throw new Error("nothing selected");
    const parent = items[0].parent;
    const order = items.map((n) => parent._children.indexOf(n));
    const top = Math.max(...order);
    const sorted = [...items].sort((a, b) => parent._children.indexOf(a) - parent._children.indexOf(b));
    const g = new Group();
    if (mask) g.mask = sorted[sorted.length - 1];
    const at = top - (sorted.length - 1);
    for (const n of sorted) parent._children.splice(parent._children.indexOf(n), 1);
    parent._children.splice(at, 0, g);
    g.parent = parent;
    for (const n of sorted) {
      n.parent = g;
      g._children.push(n);
    }
    items = [g];
  }
  const commands = {
    group: () => wrap(false),
    createMaskGroup: () => {
      if (items.length < 2) throw new Error("mask: needs a shape and content");
      wrap(true);
    },
  };
  const store = { colors: [], styles: [] };
  const assets = {
    colors: { get: () => store.colors, add: (list) => (store.colors.push(...list), list.length) },
    characterStyles: { get: () => store.styles, add: (list) => (store.styles.push(...list), list.length) },
  };
  const scenegraph = { Color, Shadow, LinearGradientFill, ImageFill, Rectangle, Path, Text, Artboard, Group, GraphicNode, RootNode, root, selection };
  return { scenegraph, commands, selection, assets, root, store };
}

module.exports = { create };
