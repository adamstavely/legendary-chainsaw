import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, OffScreenController, ToolbarController } from "./internal/controllers";
import type { Look } from "./internal/look";
import { copyText } from "./internal/util";

/*
 * <tc-structured-output> – JSON a model writes, shown as a typed tree while it streams in. The text may grow every
 * frame and stop mid-value: it is parsed tolerantly (an open string, a half-written number, a key still waiting for
 * its value all show as they are), and checked against an optional JSON Schema as it arrives. A field that breaks the
 * schema is flagged on its row with the reason; a required field that never came shows as a ghost row once its object
 * closes. Copy as JSON or as a TypeScript literal.
 *
 *   <tc-structured-output heading="Ticket triage" .text=${chunkSoFar} .schema=${schema} streaming></tc-structured-output>
 *
 * The tree is the WAI-ARIA tree view: one tab stop, ↑ ↓ move, → ← open and close, Home / End, * opens the siblings.
 * Colours come from the --tc-syntax-* tokens, like code-block. A schema here is the common subset of JSON Schema:
 * type (one or a list, "integer" included), properties, required, additionalProperties: false, items, enum,
 * minimum / maximum (and the exclusive ones), minLength / maxLength, pattern, minItems / maxItems – no $ref, no
 * combinators. Standard sits on the gray tray with the head on the tray and the tree on a white card; Clean is one
 * white card with a hairline under the head.
 */

/* ---------- Types ---------- */

/** A JSON Schema type name */
export type StructuredOutputType = "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";

/** The JSON Schema keywords the element checks; others are ignored */
export type StructuredOutputSchema = {
  type?: StructuredOutputType | StructuredOutputType[];
  /** Shown as the field's tooltip */
  title?: string;
  /** Shown as the field's tooltip (after the title) */
  description?: string;
  properties?: Record<string, StructuredOutputSchema>;
  required?: string[];
  /** false flags fields the schema doesn't name */
  additionalProperties?: boolean;
  /** One schema for every item of a list */
  items?: StructuredOutputSchema;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
};

/** What's wrong with a field */
export type StructuredOutputIssueKind = "missing" | "type" | "enum" | "range" | "length" | "pattern" | "extra" | "count";

/** One problem, at a JSON Pointer path ("/assignee/email"; "" is the whole value) */
export type StructuredOutputIssue = { path: string; kind: StructuredOutputIssueKind; message: string };

/** Where the text stopped being JSON */
export type StructuredOutputSyntaxError = { message: string; line: number; column: number };

/** tc-copy */
export type StructuredOutputCopy = { format: "json" | "ts"; text: string };
/** tc-collapsed-change */
export type StructuredOutputCollapsedChange = { collapsed: string[] };
/** tc-validate */
export type StructuredOutputValidate = { valid: boolean; value: unknown; issues: StructuredOutputIssue[]; error: StructuredOutputSyntaxError | null; complete: boolean };

/* ---------- Tolerant parser ---------- */

type Kind = "object" | "array" | "string" | "number" | "boolean" | "null" | "pending";
type Node = {
  kind: Kind;
  path: string;
  /** Field name, or list index; null for the root */
  key: string | number | null;
  /** A leaf as written: the string's text (unescaped), the number or literal as typed */
  text: string;
  children: Node[];
  /** Ended – a closing quote, bracket or brace, or a delimiter after a number or literal */
  closed: boolean;
};

const ptr = (parent: string, key: string | number) => `${parent}/${String(key).replace(/~/g, "~0").replace(/\//g, "~1")}`;
const NUMBER = /-?\d*(?:\.\d*)?(?:[eE][+-]?\d*)?/y;
const NUMBER_OK = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const WORD = /[A-Za-z]+/y;
const LITERALS = ["true", "false", "null"];
const ESC: Record<string, string> = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };

class Parser {
  i = 0;
  error: { at: number; message: string } | null = null;
  constructor(
    private s: string,
    private final: boolean,
  ) {}

  private ws() {
    const s = this.s;
    while (this.i < s.length && (s[this.i] === " " || s[this.i] === "\n" || s[this.i] === "\r" || s[this.i] === "\t")) this.i++;
  }
  private fail(message: string) {
    this.error ??= { at: this.i, message };
  }
  private get eof() {
    return this.i >= this.s.length;
  }

  root(): Node | null {
    const node = this.value("", null);
    if (node && !this.error && node.closed) {
      this.ws();
      if (!this.eof) this.fail("Unexpected text after the end");
    }
    return node;
  }

  private value(path: string, key: string | number | null): Node | null {
    this.ws();
    if (this.eof) return null;
    const c = this.s[this.i];
    if (c === "{") return this.object(path, key);
    if (c === "[") return this.array(path, key);
    if (c === '"') {
      const { text, closed } = this.string();
      return { kind: "string", path, key, text, children: [], closed };
    }
    if (c === "-" || (c >= "0" && c <= "9")) return this.number(path, key);
    if (/[a-z]/i.test(c)) return this.literal(path, key);
    this.fail("Expected a value");
    return null;
  }

  private string() {
    const s = this.s;
    let text = "";
    this.i++;
    while (this.i < s.length) {
      const c = s[this.i];
      if (c === '"') {
        this.i++;
        return { text, closed: true };
      }
      if (c === "\\") {
        const e = s[this.i + 1];
        if (e === undefined) break;
        if (e === "u") {
          const hex = s.slice(this.i + 2, this.i + 6);
          if (hex.length < 4) break;
          if (!/^[\da-f]{4}$/i.test(hex)) {
            this.fail("A broken \\u escape");
            break;
          }
          text += String.fromCharCode(parseInt(hex, 16));
          this.i += 6;
          continue;
        }
        if (!(e in ESC)) {
          this.fail(`An unknown escape \\${e}`);
          break;
        }
        text += ESC[e];
        this.i += 2;
        continue;
      }
      text += c;
      this.i++;
    }
    this.i = s.length;
    return { text, closed: false };
  }

  private number(path: string, key: string | number | null): Node {
    NUMBER.lastIndex = this.i;
    const raw = NUMBER.exec(this.s)![0];
    this.i += raw.length;
    const closed = !this.eof || this.final;
    if (closed && !NUMBER_OK.test(raw)) this.fail(`“${raw}” isn't a number`);
    return { kind: "number", path, key, text: raw, children: [], closed };
  }

  private literal(path: string, key: string | number | null): Node | null {
    WORD.lastIndex = this.i;
    const word = WORD.exec(this.s)![0];
    const start = this.i;
    this.i += word.length;
    const atEnd = this.eof && !this.final;
    const kind = (w: string): Kind => (w === "null" ? "null" : "boolean");
    if (LITERALS.includes(word) && !atEnd) return { kind: kind(word), path, key, text: word, children: [], closed: true };
    const partial = LITERALS.find((l) => l.startsWith(word));
    if (atEnd && partial) return { kind: kind(partial), path, key, text: word, children: [], closed: false };
    this.i = start;
    this.fail(`Unexpected “${word}”`);
    return null;
  }

  private object(path: string, key: string | number | null): Node {
    const node: Node = { kind: "object", path, key, text: "", children: [], closed: false };
    this.i++;
    let first = true;
    for (;;) {
      this.ws();
      if (this.eof || this.error) return node;
      if (this.s[this.i] === "}" && first) {
        this.i++;
        node.closed = true;
        return node;
      }
      if (!first) {
        if (this.s[this.i] === "}") {
          this.i++;
          node.closed = true;
          return node;
        }
        if (this.s[this.i] !== ",") {
          this.fail("Expected a comma or a closing }");
          return node;
        }
        this.i++;
        this.ws();
        if (this.eof) return node;
      }
      first = false;
      if (this.s[this.i] !== '"') {
        this.fail("Expected a field name in double quotes");
        return node;
      }
      const name = this.string();
      if (!name.closed || this.error) return node;
      const at = ptr(path, name.text);
      this.ws();
      if (this.eof) {
        node.children.push({ kind: "pending", path: at, key: name.text, text: "", children: [], closed: false });
        return node;
      }
      if (this.s[this.i] !== ":") {
        this.fail("Expected a colon after the field name");
        return node;
      }
      this.i++;
      const v = this.value(at, name.text);
      if (!v) {
        if (!this.error) node.children.push({ kind: "pending", path: at, key: name.text, text: "", children: [], closed: false });
        return node;
      }
      node.children.push(v);
      if (!v.closed) return node;
    }
  }

  private array(path: string, key: string | number | null): Node {
    const node: Node = { kind: "array", path, key, text: "", children: [], closed: false };
    this.i++;
    for (;;) {
      this.ws();
      if (this.eof || this.error) return node;
      if (this.s[this.i] === "]") {
        this.i++;
        node.closed = true;
        return node;
      }
      if (node.children.length) {
        if (this.s[this.i] !== ",") {
          this.fail("Expected a comma or a closing ]");
          return node;
        }
        this.i++;
      }
      const index = node.children.length;
      const v = this.value(ptr(path, index), index);
      if (!v) return node;
      node.children.push(v);
      if (!v.closed) return node;
    }
  }
}

/** A Markdown code fence around the JSON (```json … ```), which models often add */
const FENCE_OPEN = /^\s*```[\w-]*[ \t]*\n?/;
const FENCE_CLOSE = /\n?```\s*$/;

function parse(source: string, final: boolean) {
  const open = source.match(FENCE_OPEN);
  const skip = open ? open[0].length : 0;
  let body = source.slice(skip);
  if (open) body = body.replace(FENCE_CLOSE, "");
  const p = new Parser(body, final);
  const root = body.trim() ? p.root() : null;
  let error: StructuredOutputSyntaxError | null = null;
  if (p.error) {
    const before = source.slice(0, skip + p.error.at);
    const lines = before.split("\n");
    error = { message: p.error.message, line: lines.length, column: lines[lines.length - 1].length + 1 };
  }
  return { root, error };
}

/** Parsed JSON that may still be arriving, as tc-structured-output reads it */
export type StructuredOutputParse = {
  /** The value so far – fields still arriving left out; undefined before anything has arrived */
  value: unknown;
  /** The outermost bracket has closed */
  complete: boolean;
  /** Where the text stopped being JSON, if it did */
  error: StructuredOutputSyntaxError | null;
  /** JSON Pointer paths of the values that have ended ("" is the whole value, "/blocks/0" the first block) */
  closed: Set<string>;
};

/** Parses JSON that may still be arriving, tolerantly, as tc-structured-output does – for elements that render
 *  structured answers as they stream (tc-generated-ui). `final` says no more text is coming */
export function structuredOutputParse(text: string, final = true): StructuredOutputParse {
  const { root, error } = parse(text, final);
  const closed = new Set<string>();
  const walk = (n: Node) => {
    if (n.closed) closed.add(n.path);
    n.children.forEach(walk);
  };
  if (root) walk(root);
  return { value: root ? valueOf(root) : undefined, complete: !!root?.closed, error, closed };
}

/** The value parsed so far: pending fields and half-typed literals left out */
function valueOf(n: Node): unknown {
  switch (n.kind) {
    case "object": {
      const o: Record<string, unknown> = {};
      for (const c of n.children) {
        const v = valueOf(c);
        if (v !== undefined) o[c.key as string] = v;
      }
      return o;
    }
    case "array":
      return n.children.map(valueOf).filter((v) => v !== undefined);
    case "string":
      return n.text;
    case "number": {
      const v = parseFloat(n.text);
      return Number.isFinite(v) ? v : undefined;
    }
    case "boolean":
      return n.closed ? n.text === "true" : undefined;
    case "null":
      return n.closed ? null : undefined;
    default:
      return undefined;
  }
}

/* ---------- Schema check ---------- */

const KIND_NAME: Record<StructuredOutputType, string> = {
  object: "an object",
  array: "a list",
  string: "a string",
  number: "a number",
  integer: "a whole number",
  boolean: "true or false",
  null: "null",
};

const typesOf = (s: StructuredOutputSchema): StructuredOutputType[] | null => (s.type === undefined ? null : Array.isArray(s.type) ? s.type : [s.type]);

function fits(t: StructuredOutputType, n: Node) {
  if (t === "integer") return n.kind === "number" && (!n.closed || Number.isInteger(parseFloat(n.text)));
  return t === n.kind;
}

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const listOf = (values: unknown[]) => (values.length > 5 ? `${values.slice(0, 5).map((v) => JSON.stringify(v)).join(", ")}, …` : values.map((v) => JSON.stringify(v)).join(", "));

type Check = {
  issues: Map<string, StructuredOutputIssue[]>;
  /** Required fields that never came, by their object's path */
  missing: Map<string, { key: string; path: string; schema: StructuredOutputSchema | undefined }[]>;
  /** Fields' schemas by path, for titles and the integer type */
  schemas: Map<string, StructuredOutputSchema>;
};

function check(n: Node, schema: StructuredOutputSchema | undefined, final: boolean, out: Check) {
  if (!schema || typeof schema !== "object") return;
  out.schemas.set(n.path, schema);
  if (n.kind === "pending") return;
  const add = (kind: StructuredOutputIssueKind, message: string, path = n.path) => {
    const list = out.issues.get(path) ?? [];
    list.push({ path, kind, message });
    out.issues.set(path, list);
  };
  const types = typesOf(schema);
  if (types && !types.some((t) => fits(t, n))) {
    const got: StructuredOutputType = n.kind === "number" && types.includes("integer") ? "number" : (n.kind as StructuredOutputType);
    add("type", `Expected ${types.map((t) => KIND_NAME[t]).join(" or ")}, got ${KIND_NAME[got]}`);
    return;
  }
  const done = n.closed;
  if (done && schema.enum && n.kind !== "object" && n.kind !== "array" && !schema.enum.some((v) => sameJson(v, valueOf(n)))) add("enum", `Expected one of ${listOf(schema.enum)}`);
  if (n.kind === "string") {
    const len = [...n.text].length;
    if (schema.maxLength !== undefined && len > schema.maxLength) add("length", `Must be ${schema.maxLength} characters or fewer (it has ${len})`);
    if (done && schema.minLength !== undefined && len < schema.minLength) add("length", `Must be at least ${schema.minLength} characters`);
    if (done && schema.pattern) {
      let re: RegExp | null = null;
      try {
        re = new RegExp(schema.pattern, "u");
      } catch {
        re = null;
      }
      if (re && !re.test(n.text)) add("pattern", `Doesn't match the pattern ${schema.pattern}`);
    }
  } else if (n.kind === "number" && done) {
    const v = parseFloat(n.text);
    if (schema.minimum !== undefined && v < schema.minimum) add("range", `Must be ${schema.minimum} or more`);
    if (schema.maximum !== undefined && v > schema.maximum) add("range", `Must be ${schema.maximum} or less`);
    if (schema.exclusiveMinimum !== undefined && v <= schema.exclusiveMinimum) add("range", `Must be more than ${schema.exclusiveMinimum}`);
    if (schema.exclusiveMaximum !== undefined && v >= schema.exclusiveMaximum) add("range", `Must be less than ${schema.exclusiveMaximum}`);
  } else if (n.kind === "object") {
    const props = schema.properties ?? {};
    const keys = new Set<string>();
    for (const c of n.children) {
      const k = c.key as string;
      keys.add(k);
      if (Object.prototype.hasOwnProperty.call(props, k)) check(c, props[k], final, out);
      else if (schema.additionalProperties === false) add("extra", "Not in the schema", c.path);
    }
    if (n.closed || final) {
      const gone = (schema.required ?? []).filter((k) => !keys.has(k)).map((k) => ({ key: k, path: ptr(n.path, k), schema: props[k] }));
      if (gone.length) {
        out.missing.set(n.path, gone);
        for (const g of gone) add("missing", "Missing – required", g.path);
      }
    }
  } else if (n.kind === "array") {
    for (const c of n.children) check(c, schema.items, final, out);
    const count = n.children.filter((c) => c.kind !== "pending").length;
    if (schema.maxItems !== undefined && count > schema.maxItems) add("count", `Allows ${schema.maxItems} items at most (it has ${count})`);
    if (done && schema.minItems !== undefined && count < schema.minItems) add("count", `Needs at least ${schema.minItems} ${schema.minItems === 1 ? "item" : "items"}`);
  }
}

/* ---------- TypeScript literal ---------- */

const IDENT = /^[A-Za-z_$][\w$]*$/;
function tsLiteral(v: unknown, indent = ""): string {
  const inner = `${indent}  `;
  if (Array.isArray(v)) return v.length ? `[\n${v.map((x) => `${inner}${tsLiteral(x, inner)},`).join("\n")}\n${indent}]` : "[]";
  if (v && typeof v === "object") {
    const entries = Object.entries(v);
    if (!entries.length) return "{}";
    return `{\n${entries.map(([k, x]) => `${inner}${IDENT.test(k) ? k : JSON.stringify(k)}: ${tsLiteral(x, inner)},`).join("\n")}\n${indent}}`;
  }
  return JSON.stringify(v);
}

/* ---------- Icons ---------- */

const glyph = (cls: string, body: TemplateResult) => html`<svg class=${cls} viewBox="0 0 16 16" aria-hidden="true">${body}</svg>`;
/* chevron-right, circle-alert and circle-dashed after Lucide (ISC, lucide.dev) */
const chevronIcon = glyph("ui-so__chev-icon", svg`<path d="m6 4 4 4-4 4"></path>`);
const alertIcon = glyph("ui-so__mark", svg`<circle cx="8" cy="8" r="6"></circle><path d="M8 5v3.25"></path><path d="M8 10.75h.01"></path>`);
const missingIcon = glyph(
  "ui-so__mark",
  svg`<path d="M6.9 2.1a6 6 0 0 1 2.2 0M11.4 3.1a6 6 0 0 1 1.5 1.5M13.9 6.9a6 6 0 0 1 0 2.2M12.9 11.4a6 6 0 0 1-1.5 1.5M9.1 13.9a6 6 0 0 1-2.2 0M4.6 12.9a6 6 0 0 1-1.5-1.5M2.1 9.1a6 6 0 0 1 0-2.2M3.1 4.6a6 6 0 0 1 1.5-1.5"></path>`,
);
const copyIcon = (look: Look) =>
  glyph(
    "ui-so__copy-icon",
    look === "clean"
      ? svg`<rect x="5.5" y="5.5" width="8.5" height="8.5" rx="2"></rect><path d="M10.5 3.75v-.25A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h.25"></path>`
      : svg`<rect x="5.25" y="5.25" width="8" height="8" rx="2"></rect><path d="M10.75 5.25v-1a1.5 1.5 0 0 0-1.5-1.5h-4.5a2 2 0 0 0-2 2v4.5a1.5 1.5 0 0 0 1.5 1.5h1"></path>`,
  );
const checkIcon = glyph("ui-so__copy-done", svg`<path d="M3.5 8.4 6.6 11.3 12.5 4.9"></path>`);
const treeIcon = (look: Look) =>
  html`<svg class="ui-so__head-icon" viewBox="0 0 16 16" aria-hidden="true" stroke-width=${look === "clean" ? 1.1 : 1.4}>${svg`<path d="M5.5 2.5C4 2.5 4 3.5 4 5s-.5 3-1.75 3C3.5 8 4 9.5 4 11s0 2.5 1.5 2.5M10.5 2.5C12 2.5 12 3.5 12 5s.5 3 1.75 3C12.5 8 12 9.5 12 11s0 2.5-1.5 2.5"></path>`}</svg>`;

/* ---------- Rows ---------- */

type Row = {
  id: string;
  node: Node | null;
  /** A required field that never came */
  missing?: { key: string; schema: StructuredOutputSchema | undefined };
  depth: number;
  parent: string | null;
  pos: number;
  size: number;
  issues: StructuredOutputIssue[];
  /** Issues hidden inside a folded branch */
  inside: number;
};

const COPIED_MS = 1600;
let instances = 0;

/**
 * Streaming JSON as a collapsible, typed tree, checked against a JSON Schema as it arrives.
 * @tag tc-structured-output
 * @fires tc-collapsed-change - A branch was folded or opened ({ collapsed: string[] } – JSON Pointer paths); cancelable
 * @fires tc-copy - The value was copied ({ format: "json" | "ts", text: string })
 * @fires tc-validate - The text settled (not streaming) and its result changed ({ valid, value, issues, error, complete })
 */
export class TcStructuredOutput extends TcElement {
  static override ui = "so";

  /** The JSON as it arrives – it may grow every frame and stop mid-value. A ```json fence around it is ignored */
  @property() accessor text = "";
  /** A JSON Schema to check the value against as it arrives (the common keywords – see the docs); unset checks syntax only */
  @property({ attribute: false }) accessor schema: StructuredOutputSchema | undefined = undefined;
  /** The text is still coming in: a caret blinks at the end, and what hasn't arrived isn't flagged yet */
  @property({ type: Boolean, reflect: true }) accessor streaming = false;
  /** The heading, and the tree's accessible name */
  @property() accessor heading = "Output";
  /** JSON Pointer paths of folded branches ("/items/0"). Changed by the user unless tc-collapsed-change is prevented */
  @property({ attribute: false }) accessor collapsed: string[] = [];
  /** The variable name in "Copy as TypeScript": `const output = { … };` */
  @property({ attribute: "variable-name" }) accessor variableName = "output";
  /** Cap the tree's height in px (0: grow with the value); a capped tree scrolls and follows the end while streaming */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 0;

  /** @internal */ @state() accessor active = "";
  /** @internal */ @state() accessor copied: "json" | "ts" | null = null;
  /** @internal */ @state() accessor message = "";

  private readonly uid = `tc-so${++instances}`;
  private parsed: { root: Node | null; error: StructuredOutputSyntaxError | null } = { root: null, error: null };
  private result: Check = { issues: new Map(), missing: new Map(), schemas: new Map() };
  private rows: Row[] = [];
  private tail = "";
  private copyTimer = 0;
  private following = true;
  private lastReport = "";
  private tools = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-so__tool")] });

  constructor() {
    super();
    new OffScreenController(this, () => this.streaming);
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-so__row[tabindex="0"]'));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.copyTimer);
    this.copyTimer = 0;
  }

  /** The value parsed so far (fields still arriving are left out); undefined before anything has arrived */
  get value(): unknown {
    return this.parsed.root ? valueOf(this.parsed.root) : undefined;
  }
  /** Everything the schema check found so far, in document order */
  get issues(): StructuredOutputIssue[] {
    return [...this.result.issues.values()].flat();
  }
  /** Where the text stopped being JSON, if it did */
  get syntaxError(): StructuredOutputSyntaxError | null {
    return this.parsed.error;
  }
  /** The value has arrived in full: its outermost bracket closed */
  get complete(): boolean {
    return !!this.parsed.root?.closed;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("text") || changed.has("streaming") || changed.has("schema")) {
      const final = !this.streaming;
      this.parsed = parse(this.text, final);
      this.result = { issues: new Map(), missing: new Map(), schemas: new Map() };
      if (this.parsed.root) check(this.parsed.root, this.schema, final, this.result);
      this.tail = this.streaming && this.parsed.root && !this.parsed.error ? this.tailOf(this.parsed.root) : "";
    }
    this.rows = this.buildRows();
    if (!this.rows.some((r) => r.id === this.active)) this.active = this.nearest(this.active);
  }

  protected override updated(changed: PropertyValues) {
    const body = this.querySelector<HTMLElement>(".ui-so__scroll");
    if (body && this.maxHeight > 0 && this.streaming && this.following && changed.has("text")) body.scrollTop = body.scrollHeight;
    if ((changed.has("text") || changed.has("streaming") || changed.has("schema")) && !this.streaming) this.report();
  }

  /** tc-validate once the text settles, and a polite summary when streaming ends */
  private report() {
    const issues = this.issues;
    const error = this.parsed.error;
    const complete = this.complete;
    const valid = !!this.parsed.root && !error && complete && issues.length === 0;
    const key = JSON.stringify([this.text, issues, error]);
    if (key === this.lastReport) return;
    const wasStreaming = this.lastReport === "streaming";
    this.lastReport = key;
    if (!this.parsed.root && !error) return;
    this.emit<StructuredOutputValidate>("tc-validate", { valid, value: this.value, issues, error, complete });
    if (wasStreaming) this.message = this.summary().said;
  }

  override shouldUpdate(changed: PropertyValues) {
    if (changed.has("streaming") && this.streaming) this.lastReport = "streaming";
    return super.shouldUpdate(changed);
  }

  /** The row the caret sits on: the deepest value still being written */
  private tailOf(n: Node): string {
    let cur = n;
    for (;;) {
      if (cur.kind !== "object" && cur.kind !== "array") return cur.path;
      const last = cur.children[cur.children.length - 1];
      if (!last) return cur.path;
      if (last.closed && last.kind !== "pending") return last.path;
      cur = last;
    }
  }

  private buildRows(): Row[] {
    const rows: Row[] = [];
    const root = this.parsed.root;
    if (!root) return rows;
    const folded = new Set(this.collapsed);
    const { issues, missing, schemas } = this.result;
    const countInside = (n: Node): number =>
      n.children.reduce((sum, c) => sum + (issues.get(c.path)?.length ?? 0) + countInside(c), 0) + (missing.get(n.path)?.length ?? 0);
    const walk = (n: Node, depth: number, parent: string | null) => {
      const gone = missing.get(n.path) ?? [];
      const size = n.children.length + gone.length;
      n.children.forEach((c, i) => {
        const open = !folded.has(c.path);
        const kids = c.children.length > 0 || (missing.get(c.path)?.length ?? 0) > 0;
        rows.push({ id: c.path, node: c, depth, parent, pos: i + 1, size, issues: issues.get(c.path) ?? [], inside: kids && !open ? countInside(c) : 0 });
        if (kids && open) walk(c, depth + 1, c.path);
      });
      gone.forEach((g, i) =>
        rows.push({ id: g.path, node: null, missing: { key: g.key, schema: schemas.get(g.path) ?? g.schema }, depth, parent, pos: n.children.length + i + 1, size, issues: issues.get(g.path) ?? [], inside: 0 }),
      );
    };
    if (root.kind === "object" || root.kind === "array") walk(root, 0, null);
    else rows.push({ id: root.path, node: root, depth: 0, parent: null, pos: 1, size: 1, issues: issues.get("") ?? [], inside: 0 });
    return rows;
  }

  /** The row to keep focus on when `id` is gone: its nearest shown ancestor, else the first row */
  private nearest(id: string) {
    let at = id;
    while (at) {
      at = at.slice(0, at.lastIndexOf("/"));
      if (this.rows.some((r) => r.id === at)) return at;
    }
    return this.rows[0]?.id ?? "";
  }

  /* ---------- Actions ---------- */

  private setCollapsed(next: string[]) {
    if (this.emit<StructuredOutputCollapsedChange>("tc-collapsed-change", { collapsed: next }, { cancelable: true })) this.collapsed = next;
  }

  private toggle(id: string, open?: boolean) {
    const folded = this.collapsed.includes(id);
    const want = open ?? folded;
    if (want === !folded) return;
    this.setCollapsed(want ? this.collapsed.filter((p) => p !== id) : [...this.collapsed, id]);
  }

  private async copy(format: "json" | "ts") {
    const v = this.value;
    if (v === undefined) return;
    const text = format === "json" ? JSON.stringify(v, null, 2) : `const ${IDENT.test(this.variableName) ? this.variableName : "output"} = ${tsLiteral(v)};\n`;
    const ok = await copyText(text);
    if (!ok) {
      this.message = "Couldn't copy";
      return;
    }
    this.emit<StructuredOutputCopy>("tc-copy", { format, text });
    this.copied = format;
    this.message = format === "json" ? "Copied as JSON" : "Copied as TypeScript";
    window.clearTimeout(this.copyTimer);
    this.copyTimer = window.setTimeout(() => {
      this.copied = null;
      this.message = "";
    }, COPIED_MS);
  }

  /* ---------- Keyboard (WAI-ARIA tree view) ---------- */

  private focusRow(id: string | undefined) {
    if (id === undefined) return;
    this.active = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-so__row[data-id="${CSS.escape(id)}"]`)?.focus());
  }

  private onKey(e: KeyboardEvent, r: Row) {
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return;
    const rows = this.rows;
    const i = rows.indexOf(r);
    const parent = this.isParent(r);
    const folded = this.collapsed.includes(r.id);
    const keys: Record<string, () => void> = {
      ArrowDown: () => this.focusRow(rows[i + 1]?.id),
      ArrowUp: () => this.focusRow(rows[i - 1]?.id),
      Home: () => this.focusRow(rows[0]?.id),
      End: () => this.focusRow(rows[rows.length - 1]?.id),
      ArrowRight: () => (parent && folded ? this.toggle(r.id, true) : parent ? this.focusRow(rows[i + 1]?.id) : undefined),
      ArrowLeft: () => (parent && !folded ? this.toggle(r.id, false) : r.parent !== null ? this.focusRow(r.parent) : undefined),
      Enter: () => parent && this.toggle(r.id),
      " ": () => parent && this.toggle(r.id),
      "*": () => {
        const siblings = rows.filter((x) => x.parent === r.parent && this.isParent(x)).map((x) => x.id);
        const next = this.collapsed.filter((p) => !siblings.includes(p));
        if (next.length !== this.collapsed.length) this.setCollapsed(next);
      },
    };
    if (!keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
  }

  private isParent(r: Row) {
    return !!r.node && (r.node.children.length > 0 || (this.result.missing.get(r.id)?.length ?? 0) > 0);
  }

  private onScroll = (e: Event) => {
    const b = e.currentTarget as HTMLElement;
    this.following = b.scrollTop + b.clientHeight >= b.scrollHeight - 8;
  };

  /* ---------- Render ---------- */

  /** The status in the head, and what's said when streaming ends */
  private summary(): { tone: "info" | "success" | "danger" | "warning" | "neutral"; text: string; said: string; lead?: string } {
    const n = this.issues.length;
    const issues = `${n} ${n === 1 ? "issue" : "issues"}`;
    if (this.parsed.error) return { tone: "danger", text: "Not valid JSON", said: `Not valid JSON: ${this.parsed.error.message}` };
    // While streaming with issues, "Writing · " gives way first when the head is narrow (the dot stays)
    if (this.streaming) return n ? { tone: "info", lead: "Writing · ", text: issues, said: "" } : { tone: "info", text: "Writing", said: "" };
    if (!this.parsed.root) return { tone: "neutral", text: "Empty", said: "" };
    if (!this.complete) return { tone: "warning", text: "Incomplete", said: n ? `Incomplete, ${issues}` : "Incomplete – the output stopped early" };
    if (n) return { tone: "danger", text: issues, said: `Done – ${issues}` };
    return this.schema ? { tone: "success", text: "Matches schema", said: "Done – matches the schema" } : { tone: "success", text: "Valid JSON", said: "Done – valid JSON" };
  }

  private typeLabel(n: Node) {
    const s = this.result.schemas.get(n.path);
    if (n.kind === "number" && s && typesOf(s)?.includes("integer") && !typesOf(s)?.includes("number")) return "integer";
    if (n.kind === "pending") return "";
    return n.kind;
  }

  private leaf(n: Node) {
    const caret = n.path === this.tail && this.streaming ? html`<span class="ui-so__caret" aria-hidden="true"></span>` : nothing;
    switch (n.kind) {
      case "string":
        return html`<span class="ui-so__v" data-kind="string"><span class="ui-so__q">“</span>${n.text}${n.closed ? html`<span class="ui-so__q">”</span>` : nothing}${caret}</span>`;
      case "number":
        return html`<span class="ui-so__v" data-kind="number">${n.text}${caret}</span>`;
      case "boolean":
      case "null":
        return html`<span class="ui-so__v" data-kind="literal">${n.text}${caret}</span>`;
      case "pending":
        return html`<span class="ui-so__v" data-kind="pending">…${caret}</span>`;
      default: {
        // The size in place of the brackets, open or folded: "{ 4 fields }", "[ 2 items ]"
        const count = n.children.length;
        const preview = count === 0 ? (n.kind === "object" ? "{ }" : "[ ]") : n.kind === "object" ? `{ ${count} ${count === 1 ? "field" : "fields"} }` : `[ ${count} ${count === 1 ? "item" : "items"} ]`;
        return html`<span class="ui-so__v" data-kind="brace">${preview}${caret}</span>`;
      }
    }
  }

  private row(r: Row) {
    const n = r.node;
    const parent = this.isParent(r);
    const folded = parent && this.collapsed.includes(r.id);
    const key = n ? n.key : r.missing!.key;
    const schema = this.result.schemas.get(r.id) ?? r.missing?.schema;
    const tip = schema ? [schema.title, schema.description].filter(Boolean).join(" – ") : "";
    const state = r.missing ? "missing" : r.issues.length ? "invalid" : undefined;
    const type = n ? this.typeLabel(n) : (schema && typesOf(schema)?.join(" | ")) || "";
    return html`<div
      class="ui-so__row"
      role="treeitem"
      data-id=${r.id}
      data-focus-key=${`row:${r.id}`}
      data-state=${ifDefined(state)}
      aria-level=${r.depth + 1}
      aria-posinset=${r.pos}
      aria-setsize=${r.size}
      aria-expanded=${ifDefined(parent ? (folded ? "false" : "true") : undefined)}
      tabindex=${r.id === this.active ? "0" : "-1"}
      style=${styleMap({ "--d": String(r.depth) })}
      @click=${() => {
        this.active = r.id;
        if (parent) this.toggle(r.id);
      }}
      @focus=${(e: FocusEvent) => {
        if (e.target === e.currentTarget) this.active = r.id;
      }}
      @keydown=${(e: KeyboardEvent) => this.onKey(e, r)}
    >
      <span class="ui-so__line">
        ${r.depth > 0 ? html`<span class="ui-so__guides" aria-hidden="true"></span>` : nothing}
        <span class="ui-so__chev" data-open=${ifDefined(parent && !folded ? "" : undefined)} aria-hidden="true">${parent ? chevronIcon : nothing}</span>
        ${key === null ? nothing : html`<span class=${typeof key === "number" ? "ui-so__key ui-so__key--index" : "ui-so__key"} title=${ifDefined(tip || undefined)}>${key}</span><span class="ui-so__colon">${typeof key === "number" ? nothing : ":"}</span>`}
        ${n ? this.leaf(n) : html`<span class="ui-so__v" data-kind="missing">${missingIcon}Missing – required</span>`}
        ${r.inside ? html`<span class="ui-so__inside">${alertIcon}${r.inside} ${r.inside === 1 ? "issue" : "issues"} inside</span>` : nothing}
        ${type ? html`<span class="ui-so__type">${type}</span>` : nothing}
      </span>
      ${r.issues
        .filter((i) => i.kind !== "missing")
        .map((i) => html`<span class="ui-so__issue">${alertIcon}<span>${i.message}</span></span>`)}
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const sum = this.summary();
    const has = this.value !== undefined;
    const err = this.parsed.error;
    const root = this.parsed.root;
    const rootIssues = root && root.kind !== "object" && root.kind !== "array" ? [] : (this.result.issues.get("") ?? []);
    const tool = (format: "json" | "ts", label: string) => html`<button
      type="button"
      class="ui-so__tool"
      data-format=${format}
      ?disabled=${!has}
      ?data-copied=${this.copied === format}
      title=${`Copy as ${label}`}
    ><span class="ui-so__tool-icons">${copyIcon(look)}${checkIcon}</span><span class="ui-so__sr">Copy as ${label}</span><span aria-hidden="true">${format === "json" ? "JSON" : "TS"}</span></button>`;
    const head = html`<div class="ui-so__head">
      <span class="ui-so__title">${treeIcon(look)}<span class="ui-so__heading" id=${`${this.uid}-h`}>${this.heading}</span></span>
      <span class="ui-so__status" data-tone=${sum.tone}>${this.streaming ? html`<span class="ui-so__dot" aria-hidden="true"></span>` : nothing}${sum.lead ? html`<span class="ui-so__lead">${sum.lead}</span>` : nothing}${sum.text}</span>
      <div class="ui-so__tools" role="toolbar" aria-label="Copy" @keydown=${this.tools.onKeyDown} @focusin=${this.tools.onFocusIn} @click=${(e: Event) => {
        const b = (e.target as Element).closest<HTMLButtonElement>(".ui-so__tool");
        if (b) void this.copy(b.dataset.format === "ts" ? "ts" : "json");
      }}>${tool("json", "JSON")}${tool("ts", "TypeScript")}</div>
    </div>`;
    const empty = !root
      ? html`<p class="ui-so__empty">${err ? "Nothing to show." : this.streaming ? "Waiting for output…" : "No output yet."}</p>`
      : nothing;
    const tree = root
      ? html`<div
          class="ui-so__scroll"
          style=${styleMap({ maxHeight: this.maxHeight > 0 ? `${this.maxHeight}px` : undefined })}
          @scroll=${this.onScroll}
        ><div class="ui-so__tree" role="tree" aria-labelledby=${`${this.uid}-h`} aria-busy=${ifDefined(this.streaming ? "true" : undefined)}>${repeat(this.rows, (r) => r.id, (r) => this.row(r))}</div></div>`
      : nothing;
    const notes = [
      ...rootIssues.filter((i) => i.kind !== "missing").map((i) => html`<p class="ui-so__note" data-tone="danger">${alertIcon}<span>${i.message}</span></p>`),
      err ? html`<p class="ui-so__note" data-tone="danger">${alertIcon}<span>Stopped reading at line ${err.line}, column ${err.column} – ${err.message.charAt(0).toLowerCase() + err.message.slice(1)}.</span></p>` : nothing,
      !err && root && !root.closed && !this.streaming ? html`<p class="ui-so__note" data-tone="warning">${alertIcon}<span>The output ended before the JSON was complete.</span></p>` : nothing,
    ];
    const status = html`<span class="ui-so__sr" role="status">${this.message}</span>`;
    const card = html`<div class="ui-so__card">${look === "clean" ? head : nothing}${empty}${tree}${notes}</div>`;
    return look === "clean" ? html`${card}${status}` : html`${head}${card}${status}`;
  }

  static override css = /* css */ `
/* Syntax colours from the shared tokens – override them on [data-ui="so"] */
[data-ui="so"] {
  --tc-structured-output-key: var(--tc-syntax-property);
  --tc-structured-output-string: var(--tc-syntax-string);
  --tc-structured-output-number: var(--tc-syntax-number);
  --tc-structured-output-literal: var(--tc-syntax-keyword);
  --tc-structured-output-punctuation: var(--tc-syntax-punctuation);
  --tc-structured-output-text: var(--tc-syntax-text);
  --tc-structured-output-indent: var(--tc-space-4);
  --tc-structured-output-guide: var(--tc-border-default);
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="so"] *, [data-ui="so"] *::before, [data-ui="so"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="so"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-secondary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="so"] {
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
}
.ui-so__card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-so__card { border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* Head: the heading, the status, the copy toolbar */
.ui-so__head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-so__head { min-height: 40px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1-5) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-so__head { min-height: 44px; padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-3-5); border-bottom: 0.5px solid var(--tc-border-default); }
.ui-so__title { display: flex; flex: 1; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-so__head-icon { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-so__head-icon { width: 16px; height: 16px; }
.ui-so__heading { min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
.ui-so__status {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  white-space: nowrap;
}
.ui-so__status[data-tone="info"] { background: var(--tc-fill-subtle); color: var(--tc-text-muted); }
.ui-so__status[data-tone="neutral"] { background: var(--tc-fill-subtle); color: var(--tc-text-muted); }
.ui-so__status[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-so__status[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-so__status[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-so__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--tc-accent); animation: ui-so-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
/* Toolbar: copy as JSON, copy as TypeScript */
.ui-so__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-1); }
.ui-so__tool {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0 var(--tc-control-px-sm) 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: transparent;
  color: var(--tc-action-ghost-fg);
  font: inherit;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
  -webkit-tap-highlight-color: transparent;
}
.ui-so__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-so__tool:active:not(:disabled) { transform: scale(0.97); }
.ui-so__tool:disabled { cursor: default; opacity: 0.4; }
.ui-so__tool:focus-visible, .ui-so__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-so__row:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-so__tool-icons { position: relative; display: inline-grid; place-items: center; width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-so__tool-icons { width: 16px; height: 16px; }
.ui-so__tool-icons svg { position: absolute; inset: 0; width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-so__tool-icons svg { stroke-width: 1.1; }
:where([data-look="clean"], [data-look="clean"] *).ui-so__tool .ui-so__copy-icon { color: var(--tc-icon-muted); }
.ui-so__copy-done { opacity: 0; transform: scale(0.6); }
.ui-so__tool[data-copied] { color: var(--tc-status-success-fg); }
.ui-so__tool[data-copied] .ui-so__copy-icon { opacity: 0; transform: scale(0.6); }
.ui-so__tool[data-copied] .ui-so__copy-done { opacity: 1; transform: none; }
/* The tree: mono, one row per field, indented by depth with guide lines */
.ui-so__scroll { overflow: auto; overscroll-behavior: contain; }
.ui-so__tree {
  padding: var(--tc-space-2) 0;
  color: var(--tc-structured-output-text);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
}
.ui-so__row { display: flex; flex-direction: column; padding: 0 var(--tc-space-3); cursor: default; }
.ui-so__row[aria-expanded] { cursor: pointer; }
.ui-so__row:hover { background: var(--tc-fill-subtle); }
.ui-so__line { display: flex; align-items: flex-start; gap: var(--tc-space-1); min-height: 26px; padding: var(--tc-space-0-5) 0; }
.ui-so__guides {
  flex: none;
  align-self: stretch;
  width: calc(var(--d) * var(--tc-structured-output-indent));
  margin: calc(var(--tc-space-0-5) * -1) 0;
  background: repeating-linear-gradient(90deg, transparent 0 7.5px, var(--tc-structured-output-guide) 7.5px 8.5px, transparent 8.5px var(--tc-structured-output-indent));
}
:where([data-look="clean"], [data-look="clean"] *).ui-so__guides { background: repeating-linear-gradient(90deg, transparent 0 7.75px, var(--tc-structured-output-guide) 7.75px 8.25px, transparent 8.25px var(--tc-structured-output-indent)); }
.ui-so__chev { display: inline-grid; flex: none; place-items: center; width: var(--tc-structured-output-indent); height: calc(var(--tc-font-size-sm) * 1.5); color: var(--tc-icon-muted); }
.ui-so__chev-icon { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-so__chev-icon { stroke-width: 1.2; }
.ui-so__chev[data-open] .ui-so__chev-icon { transform: rotate(90deg); }
.ui-so__key { flex: none; max-width: 40%; overflow: hidden; color: var(--tc-structured-output-key); white-space: nowrap; text-overflow: ellipsis; }
.ui-so__key--index { color: var(--tc-structured-output-punctuation); }
.ui-so__colon { flex: none; margin-right: var(--tc-space-1); color: var(--tc-structured-output-punctuation); }
.ui-so__v { flex: 1; min-width: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-so__v[data-kind="string"] { color: var(--tc-structured-output-string); }
.ui-so__v[data-kind="number"] { color: var(--tc-structured-output-number); }
.ui-so__v[data-kind="literal"] { color: var(--tc-structured-output-literal); }
.ui-so__v[data-kind="brace"], .ui-so__q, .ui-so__v[data-kind="pending"] { color: var(--tc-structured-output-punctuation); }
.ui-so__v[data-kind="missing"] { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-status-danger-fg); font-family: var(--tc-font-sans); }
.ui-so__row[data-state="missing"] .ui-so__key { color: var(--tc-text-muted); font-style: italic; }
.ui-so__type { flex: none; margin-left: auto; padding-left: var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-so__inside { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); color: var(--tc-status-danger-fg); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-so__mark { flex: none; width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-so__mark { stroke-width: 1.3; }
/* A flagged field: a tinted row and the reason under it – never colour alone */
.ui-so__row[data-state="invalid"], .ui-so__row[data-state="missing"] { background: color-mix(in srgb, var(--tc-status-danger-bg) 60%, transparent); box-shadow: inset 2px 0 0 var(--tc-status-danger-solid); }
.ui-so__issue {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1);
  padding: 0 0 var(--tc-space-1) calc((var(--d) + 1) * var(--tc-structured-output-indent) + var(--tc-space-1));
  color: var(--tc-status-danger-fg);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
}
/* The caret at the end of what's being written */
.ui-so__caret {
  display: inline-block;
  width: 7px;
  height: 14px;
  margin-left: var(--tc-space-0-5);
  vertical-align: -2px;
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-accent);
  animation: ui-so-blink var(--tc-duration-shimmer) steps(2, jump-none) infinite;
}
[data-ui="so"][data-offscreen] .ui-so__caret, [data-ui="so"][data-offscreen] .ui-so__dot { animation-play-state: paused; }
.ui-so__empty { margin: 0; padding: var(--tc-space-5) var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
.ui-so__note {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-1-5);
  margin: 0;
  padding: var(--tc-space-2-5) var(--tc-space-3-5);
  border-top: var(--tc-hairline) solid var(--tc-divider);
  font-size: var(--tc-font-size-sm);
}
.ui-so__note .ui-so__mark { margin-top: var(--tc-space-0-5); }
.ui-so__note[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-so__note[data-tone="warning"] { color: var(--tc-status-warning-fg); }
.ui-so__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-so-blink { from { opacity: 1; } to { opacity: 0; } }
@keyframes ui-so-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
/* Narrow: the type column and the toolbar labels give way to the values */
@container (max-width: 420px) {
  .ui-so__type { display: none; }
  .ui-so__key { max-width: 50%; }
}
@container (max-width: 380px) {
  .ui-so__tool { padding: 0 var(--tc-space-1-5); }
  .ui-so__head-icon, .ui-so__lead, .ui-so__tool:not([data-copied]) .ui-so__tool-icons { display: none; }
}
@media (hover: none) and (pointer: coarse) {
  .ui-so__tool { height: 34px; }
  .ui-so__line { min-height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="so"] *, [data-ui="so"] *::before, [data-ui="so"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-structured-output")) customElements.define("tc-structured-output", TcStructuredOutput);

declare global {
  interface HTMLElementTagNameMap {
    "tc-structured-output": TcStructuredOutput;
  }
}
