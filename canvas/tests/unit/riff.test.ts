import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MODEL,
  TOOL,
  checkProposal,
  checkTokens,
  componentTokens,
  definedTokens,
  kebab,
  parseProposals,
  riffRequest,
  runRiff,
  sameOrigin,
  type Client,
  type Piece,
} from "../../plugins/riff";
import { CARD, GAP, intersects, ring } from "../../src/canvas/geometry";

const tc = (p: string) => readFileSync(fileURLToPath(new URL(`../../../trenchcoat/${p}`, import.meta.url)), "utf8");
const defined = definedTokens(tc("tokens/tokens.css"));
const schema = JSON.parse(tc("src/generative/schemas/tc-tool-call-card.json"));
const allowed = new Set(componentTokens(tc("src/elements/tool-call-card.ts"), "tool-call-card", defined));

describe("tokens", () => {
  it("lists the shared tokens a component uses, and its own component tokens", () => {
    expect(allowed.has("--tc-space-2")).toBe(true);
    expect(allowed.has("--tc-tool-call-card-code-bg")).toBe(true);
    expect([...allowed].every((t) => defined.has(t) || t.startsWith("--tc-tool-call-card-"))).toBe(true);
  });

  it("keeps only the component's tokens set to other tokens", () => {
    const { tokens, issues } = checkTokens(
      {
        "--tc-space-2": "var(--tc-space-3)",
        "--tc-radius-lg": "12px",
        "--tc-not-mine": "var(--tc-space-1)",
        "--tc-radius-md": "var(--tc-made-up)",
        "--tc-space-3": "url(https://example.com/x)",
      },
      allowed,
      defined,
    );
    expect(tokens).toEqual({ "--tc-space-2": "var(--tc-space-3)" });
    expect(issues.map((i) => i.path)).toEqual(["tokens.--tc-radius-lg", "tokens.--tc-not-mine", "tokens.--tc-radius-md", "tokens.--tc-space-3"]);
  });

  it("drops an override that points at another override", () => {
    const { tokens, issues } = checkTokens({ "--tc-space-2": "var(--tc-space-3)", "--tc-space-3": "var(--tc-space-1)" }, allowed, defined);
    expect(tokens).toEqual({ "--tc-space-3": "var(--tc-space-1)" });
    expect(issues).toHaveLength(1);
  });
});

describe("proposals", () => {
  it("reads propose_variants' input, at most four", () => {
    const variants = Array.from({ length: 6 }, (_, i) => ({ name: ` V${i} `, rationale: "Why", props: { status: "error" }, structural: false }));
    const parsed = parseProposals({ variants });
    expect(parsed).toHaveLength(4);
    expect(parsed[0]).toEqual({ name: "V0", rationale: "Why", props: { status: "error" }, tokens: {}, structural: false, note: "" });
    expect(() => parseProposals({ nope: [] })).toThrow();
    expect(() => parseProposals({ variants: [{ rationale: "no name" }] })).toThrow(/no name/);
  });

  it("keeps the props the schema allows, and says what it left out", () => {
    const [p] = parseProposals({
      variants: [
        {
          name: "Failed",
          rationale: "",
          props: { status: "error", error: "Timed out", duration: "slow", made: 1 },
          tokens: { "--tc-space-2": "var(--tc-space-1)" },
          structural: false,
        },
      ],
    });
    const v = checkProposal(p, schema, allowed, defined);
    expect(v.props).toEqual({ status: "error", error: "Timed out" });
    expect(v.tokens).toEqual({ "--tc-space-2": "var(--tc-space-1)" });
    expect(v.issues.map((i) => i.path).sort()).toEqual(["duration", "made"]);
  });
});

describe("the request", () => {
  const piece: Piece = { tag: "tc-tool-call-card", schema, docs: "# Tool Call Card", tokens: [...allowed] };
  const request = riffRequest(
    piece,
    { slug: "tool-call-card", prompt: "Denser", props: { name: "search_web" }, tokens: { "--tc-space-2": "var(--tc-space-1)" } },
    defined,
  );

  it("asks Claude Opus 5.5 with adaptive thinking, the fallback, and one streamed tool", () => {
    expect(request.model).toBe(MODEL);
    expect(request.model).toBe("claude-opus-5-5");
    expect(request.thinking).toEqual({ type: "adaptive", display: "summarized" });
    expect(request.fallbacks).toBe("default");
    expect(request.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(request.tools).toEqual([TOOL]);
    expect(TOOL.eager_input_streaming).toBe(true);
  });

  it("caches the instructions and token vocabulary, and puts the piece and the change in the message", () => {
    const system = request.system as { text: string; cache_control?: unknown }[];
    expect(system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(system[0].text).toContain("--tc-space-2");
    const content = request.messages[0].content as string;
    expect(content).toContain("<tc-tool-call-card>");
    expect(content).toContain('"name": "search_web"');
    expect(content).toContain("## Token overrides it has now");
    expect(content).toMatch(/## The change\nDenser$/);
    expect(content).not.toContain('"$schema"');
  });
});

describe("runRiff", () => {
  const fake = (message: object, events: object[] = []): Client => ({
    beta: {
      messages: {
        stream: () => ({
          async *[Symbol.asyncIterator]() {
            yield* events as { type: string }[];
          },
          finalMessage: async () => message as never,
        }),
      },
    },
  });
  const request = {} as Parameters<typeof runRiff>[1];

  it("says what Claude is doing, and returns the proposals", async () => {
    const said: string[] = [];
    const proposals = await runRiff(
      fake(
        {
          stop_reason: "tool_use",
          content: [{ type: "tool_use", name: "propose_variants", input: { variants: [{ name: "A", rationale: "", props: {}, structural: false }] } }],
        },
        [
          { type: "content_block_start", content_block: { type: "thinking" } },
          { type: "content_block_start", content_block: { type: "tool_use" } },
        ],
      ),
      request,
      (t) => said.push(t),
    );
    expect(proposals.map((p) => p.name)).toEqual(["A"]);
    expect(said).toEqual(["Claude is thinking it through…", "Claude is writing the variants…"]);
  });

  it("explains a refusal, a cut-off answer and an answer without the tool", async () => {
    await expect(runRiff(fake({ stop_reason: "refusal", content: [] }), request, () => {})).rejects.toThrow(/declined/);
    await expect(runRiff(fake({ stop_reason: "max_tokens", content: [] }), request, () => {})).rejects.toThrow(/cut off/);
    await expect(runRiff(fake({ stop_reason: "end_turn", content: [{ type: "text", text: "Hi" }] }), request, () => {})).rejects.toThrow(/without proposing/);
  });
});

describe("sameOrigin", () => {
  const req = (method: string, headers: Record<string, string>) => ({ method, headers: { host: "localhost:5210", ...headers } });
  it("lets the canvas in and keeps other sites out", () => {
    expect(sameOrigin(req("GET", {}))).toBe(true);
    expect(sameOrigin(req("POST", { origin: "http://localhost:5210", "content-type": "application/json" }))).toBe(true);
    expect(sameOrigin(req("POST", { origin: "https://example.com", "content-type": "application/json" }))).toBe(false);
    expect(sameOrigin(req("POST", { origin: "http://localhost:5210", "content-type": "text/plain" }))).toBe(false);
    expect(sameOrigin(req("POST", { "content-type": "application/json" }))).toBe(false);
    expect(sameOrigin(req("GET", { origin: "https://example.com" }))).toBe(false);
  });
});

describe("ring", () => {
  it("places variants right, left, below and above first, then the corners, never on the piece", () => {
    const centre = { x: 1000, y: 1000, width: CARD.width, height: CARD.height };
    const rects = ring(centre, 9);
    const step = { x: CARD.width + GAP, y: CARD.height + GAP };
    expect(rects.slice(0, 4).map((r) => [(r.x - 1000) / step.x, (r.y - 1000) / step.y])).toEqual([
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]);
    expect((rects[8].x - 1000) / step.x).toBe(2);
    for (const r of rects) expect(intersects(r, centre)).toBe(false);
  });
});

it("names brief files safely", () => {
  expect(kebab("Compact rows / ¡Urgent!")).toBe("compact-rows-urgent");
  expect(kebab("../../etc")).toBe("etc");
  expect(kebab("")).toBe("variant");
});
