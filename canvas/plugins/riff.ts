// Riffing, in the dev server only. The browser never sees an API key: it posts to these endpoints, and this file asks
// the configured model (plugins/providers.ts – Claude by default, or any OpenAI-compatible server) and writes files.
//
//   GET    /__canvas/riff              which pieces can be riffed on, and which model riffs
//   POST   /__canvas/riff              { slug, prompt, props } → NDJSON: status lines, then the checked variants
//   GET    /__canvas/variants?slug=…   the variants kept for a piece
//   POST   /__canvas/variants          { slug, prompt, variant } → keeps it in trenchcoat/app/src/variants/<slug>.json;
//                                      a structural one also gets a brief in trenchcoat/audit/variant-requests/
//   DELETE /__canvas/variants          { slug, name } → removes a kept variant
//
// The model proposes variants through one tool, propose_variants. What it writes is untrusted: props go through the
// generative-UI checks (checkProps, the same as any model-written props), and tokens may only set the component's own
// design tokens to other tokens – never a literal – so a kept variant can't break the token rules.
import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessage, BetaMessageStreamParams } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import type { Plugin } from "vite";
import { checkProps, type Schema } from "../../trenchcoat/src/generative/validate";
import type { Provider } from "./providers";
import { componentTokens, definedTokens } from "./tokens";
import { RIFF, VARIANTS, type Issue, type Kept, type Proposal, type RiffEvent, type Variant } from "../src/riff/types";

export const MODEL = "claude-opus-5-5";
export const MAX_VARIANTS = 4;

// Tokens --------------------------------------------------------------------------------------------------------------

/** Keeps the overrides that set one of the component's tokens to another token, as var(--tc-…) */
export { componentTokens, definedTokens };

export function checkTokens(raw: unknown, allowed: ReadonlySet<string>, defined: ReadonlySet<string>): { tokens: Record<string, string>; issues: Issue[] } {
  const tokens: Record<string, string> = {};
  const issues: Issue[] = [];
  if (raw === undefined || raw === null) return { tokens, issues };
  if (typeof raw !== "object" || Array.isArray(raw)) return { tokens, issues: [{ path: "tokens", message: "tokens should be an object – left out" }] };
  for (const [name, value] of Object.entries(raw)) {
    const path = `tokens.${name}`;
    const ref = typeof value === "string" ? /^var\(\s*(--tc-[\w-]+)\s*\)$/.exec(value.trim())?.[1] : undefined;
    if (!allowed.has(name)) issues.push({ path, message: "not one of this component's tokens – left out" });
    else if (!ref) issues.push({ path, message: "must be another token, as var(--tc-…) – left out" });
    else if (!defined.has(ref)) issues.push({ path, message: `${ref} isn't a token – left out` });
    else if (ref === name) issues.push({ path, message: "set to itself – left out" });
    else tokens[name] = `var(${ref})`;
  }
  // An override that points at another overridden token would be a cycle on the same element
  for (const [name, value] of Object.entries(tokens))
    if (Object.hasOwn(tokens, value.slice(4, -1))) {
      delete tokens[name];
      issues.push({ path: `tokens.${name}`, message: "points at another overridden token – left out" });
    }
  return { tokens, issues };
}

// Proposals -----------------------------------------------------------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Reads propose_variants' input; throws when it isn't the shape the tool asks for */
export function parseProposals(input: unknown): Proposal[] {
  if (!isObject(input) || !Array.isArray(input.variants)) throw new Error("no variants in Claude's answer");
  return input.variants.slice(0, MAX_VARIANTS).map((v, i) => {
    if (!isObject(v) || typeof v.name !== "string" || !v.name.trim()) throw new Error(`variant ${i + 1} has no name`);
    return {
      name: v.name.trim().slice(0, 80),
      rationale: typeof v.rationale === "string" ? v.rationale.trim().slice(0, 400) : "",
      props: isObject(v.props) ? v.props : {},
      tokens: isObject(v.tokens) ? (v.tokens as Record<string, string>) : {},
      structural: v.structural === true,
      note: typeof v.note === "string" ? v.note.trim().slice(0, 600) : "",
    };
  });
}

/**
 * Checks a proposal: the props it changes against the component's schema, its tokens against the component's own.
 * Issues are only about what the proposal changed
 */
export function checkProposal(p: Proposal, schema: Schema, allowed: ReadonlySet<string>, defined: ReadonlySet<string>): Variant {
  const checked = checkProps(schema, p.props);
  const changed = Object.keys(p.props);
  const props = Object.fromEntries(changed.filter((k) => Object.hasOwn(checked.props, k)).map((k) => [k, p.props[k]]));
  // checkProps reports paths as props/<name>/…; a missing required prop isn't this variant's doing
  const issues = checked.issues
    .map((i) => ({ ...i, path: i.path.replace(/^props\/?/, "").replaceAll("/", ".") }))
    .filter((i) => changed.some((k) => i.path === k || i.path.startsWith(`${k}.`)));
  const tokens = checkTokens(p.tokens, allowed, defined);
  return { ...p, props, tokens: tokens.tokens, issues: [...issues, ...tokens.issues] };
}

// The request -----------------------------------------------------------------------------------------------------------

export const TOOL = {
  name: "propose_variants",
  description: `Propose variants of the component for the change asked for: between 2 and ${MAX_VARIANTS}, each a different take on it.`,
  eager_input_streaming: true,
  input_schema: {
    type: "object" as const,
    properties: {
      variants: {
        type: "array",
        minItems: 1,
        maxItems: MAX_VARIANTS,
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Two to four words, e.g. “Compact rows”" },
            rationale: { type: "string", description: "One sentence: what changed and why it answers the request" },
            props: { type: "object", description: "Only the props that change, as values the props schema allows" },
            tokens: {
              type: "object",
              additionalProperties: { type: "string" },
              description: 'Optional. The component\'s own tokens, each set to another token: { "--tc-space-3": "var(--tc-space-2)" }',
            },
            structural: { type: "boolean", description: "True when the change really needs new code – a new prop, layout or state" },
            note: { type: "string", description: "For a structural variant: what would have to be built" },
          },
          required: ["name", "rationale", "props", "structural"],
        },
      },
    },
    required: ["variants"],
  },
};

/** The instructions and the token vocabulary: the same for every request, so they're cached */
export function systemPrompt(defined: ReadonlySet<string>): string {
  return `You design variants of Trenchcoat web components. Trenchcoat is a design system: every colour, space, radius, shadow and type size is a design token (a CSS custom property named --tc-…), and each component takes its content and options as props.

You get one component: its props schema, its docs page, the props it has now, and the tokens it uses. Someone describes a change. Call propose_variants once, with ${MAX_VARIANTS - 1} or ${MAX_VARIANTS} variants that each answer the request in a clearly different way – not the same idea three times.

For each variant:
- props: only the props that change, with values the schema allows. Keep content realistic, fictional and neutral – no real people, companies or brands.
- tokens: optional. Override tokens from the component's own list only, and set each to another token as var(--tc-name), from the vocabulary below. Never a literal value (no hex colours, px or rem). Don't override a token with one you're also overriding.
- When the request can't really be met with props and tokens – it needs a new prop, a new layout or a new state – still make the closest variant you can, set structural to true, and say in note what would have to be built.

Every Trenchcoat token:
${[...defined].sort().join(" ")}`;
}

/** The piece as it is now – its props, and the token overrides it has when riffing on a variant – and the change */
export type RiffInput = { slug: string; prompt: string; props: Record<string, unknown>; tokens?: Record<string, string> };
export type Piece = { tag: string; schema: Schema & { description?: string }; docs: string; tokens: string[] };

/** The user message: the component, what it has now, and the change. Every provider sends the same one */
export function userPrompt(piece: Piece, input: RiffInput): string {
  const { $schema: _s, $id: _i, title: _t, ...schema } = piece.schema as Schema & Record<string, unknown>;
  const json = (v: unknown) => `\`\`\`json\n${JSON.stringify(v, null, 2)}\n\`\`\``;
  return `Component: <${piece.tag}> – ${piece.schema.description ?? ""}

## Props schema
${json(schema)}

## Its props now
${json(input.props)}

## Tokens it uses (the only ones a variant may override)
${piece.tokens.join(" ")}
${input.tokens && Object.keys(input.tokens).length ? `\n## Token overrides it has now\n${json(input.tokens)}\n` : ""}
## Docs page
${piece.docs}

## The change
${input.prompt}`;
}

/** Claude's request for one riff: the shared prompt, with adaptive thinking, streaming and the refusal fallback */
export function riffRequest(piece: Piece, input: RiffInput, defined: ReadonlySet<string>): BetaMessageStreamParams {
  return {
    model: MODEL,
    max_tokens: 64000,
    thinking: { type: "adaptive" as const, display: "summarized" as const },
    output_config: { effort: "medium" as const },
    // A declined request is re-run on Anthropic's recommended fallback model rather than coming back refused
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default" as const,
    system: [{ type: "text" as const, text: systemPrompt(defined), cache_control: { type: "ephemeral" as const } }],
    tools: [TOOL],
    tool_choice: { type: "auto" as const },
    messages: [{ role: "user" as const, content: userPrompt(piece, input) }],
  };
}

type Stream = AsyncIterable<{ type: string; content_block?: { type: string } }> & { finalMessage(): Promise<BetaMessage> };
/** The part of the SDK's client a riff uses – tests pass a fake */
export type Client = { beta: { messages: { stream(params: BetaMessageStreamParams): Stream } } };

/** Runs a riff: says what Claude is doing as it goes, and resolves with its proposals */
export async function runRiff(client: Client, params: BetaMessageStreamParams, say: (text: string) => void, label = "Claude"): Promise<Proposal[]> {
  const stream = client.beta.messages.stream(params);
  for await (const event of stream) {
    if (event.type !== "content_block_start") continue;
    if (event.content_block?.type === "thinking") say(`${label} is thinking it through…`);
    if (event.content_block?.type === "tool_use") say(`${label} is writing the variants…`);
  }
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") throw new Error(`${label} declined this request. Try putting the change another way.`);
  if (message.stop_reason === "max_tokens") throw new Error(`${label}'s answer was cut off before it finished. Try a narrower change.`);
  const call = message.content.find((b) => b.type === "tool_use" && b.name === TOOL.name);
  if (!call || call.type !== "tool_use") throw new Error(`${label} answered without proposing variants. Try again, or put the change another way.`);
  // With eager input streaming the API doesn't check the input: parseProposals does
  return parseProposals(call.input);
}

/** What to tell the person when the call fails */
export function failure(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError)
    return "Claude couldn't be reached: no valid Anthropic credentials. Set ANTHROPIC_API_KEY (or run `ant auth login`) and restart the dev server.";
  if (error instanceof Anthropic.RateLimitError) return "The Claude API is rate-limiting requests. Try again in a minute.";
  if (error instanceof Anthropic.APIConnectionError) return "Couldn't connect to the Claude API. Check the network and try again.";
  if (error instanceof Anthropic.APIError) return `The Claude API returned an error (${error.status}): ${error.message}`;
  return error instanceof Error ? error.message : String(error);
}

// Kept variants -----------------------------------------------------------------------------------------------------------

export const kebab = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "variant";

export function brief(slug: string, prompt: string, v: Variant): string {
  return `# ${v.name} – a variant of \`tc-${slug}\` that needs new code

Asked for on the canvas: “${prompt}”

${v.rationale}

## What would have to be built

${v.note || "(No note.)"}

## The closest version with today's props and tokens

\`\`\`json
${JSON.stringify({ props: v.props, tokens: v.tokens }, null, 2)}
\`\`\`

Build it with the new-component skill's conventions, as a normal pull request.
`;
}

// The endpoints -----------------------------------------------------------------------------------------------------------

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function body(req: IncomingMessage, limit = 1_000_000): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new Error("request too large");
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
}

/**
 * Only the canvas itself may call these: another site open in the same browser could otherwise spend API credit or
 * write files. Writes must come as JSON (a cross-site page can't send that without a preflight this server never
 * answers), from this server's own origin
 */
export function sameOrigin(req: Pick<IncomingMessage, "method" | "headers">): boolean {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && origin !== `http://${host}` && origin !== `https://${host}`) return false;
  if (req.method === "GET") return true;
  return !!origin && (req.headers["content-type"] ?? "").startsWith("application/json");
}

/** `provider` says which model riffs – plugins/providers.ts reads it from the environment */
export type Options = { root: string; provider: () => Provider | { problem: string } };

export function riff({ root, provider }: Options): Plugin {
  const schemas = join(root, "src/generative/schemas");
  const variants = join(root, "app/src/variants");
  const briefs = join(root, "audit/variant-requests");
  const defined = () => definedTokens(readFileSync(join(root, "tokens/tokens.css"), "utf8"));
  const exists = (slug: string) => SLUG.test(slug) && existsSync(join(schemas, `tc-${slug}.json`)) && existsSync(join(root, "src/elements", `${slug}.ts`));
  const piece = (slug: string, tokens: ReadonlySet<string>): Piece => {
    const docs = join(root, "app/src/docs", `${slug}.md`);
    return {
      tag: `tc-${slug}`,
      schema: JSON.parse(readFileSync(join(schemas, `tc-${slug}.json`), "utf8")),
      docs: existsSync(docs) ? readFileSync(docs, "utf8") : "",
      tokens: componentTokens(readFileSync(join(root, "src/elements", `${slug}.ts`), "utf8"), slug, tokens),
    };
  };
  const keptFile = (slug: string) => join(variants, `${slug}.json`);
  const readKept = (slug: string): Kept[] => (existsSync(keptFile(slug)) ? (JSON.parse(readFileSync(keptFile(slug), "utf8")).variants ?? []) : []);
  const writeKept = (slug: string, list: Kept[]) => {
    if (!list.length) return rmSync(keptFile(slug), { force: true });
    mkdirSync(variants, { recursive: true });
    writeFileSync(keptFile(slug), `${JSON.stringify({ component: `tc-${slug}`, variants: list }, null, 2)}\n`);
  };

  return {
    name: "canvas-riff",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://canvas");
        if (url.pathname !== RIFF && url.pathname !== VARIANTS) return next();
        if (!sameOrigin(req)) return send(res, 403, { message: "Only the canvas can call this." });
        try {
          if (url.pathname === RIFF && req.method === "GET") {
            const riffable = readdirSync(schemas)
              .map((f) => /^tc-(.+)\.json$/.exec(f)?.[1])
              .filter((s): s is string => !!s && exists(s));
            const p = provider();
            return send(res, 200, "problem" in p ? { riffable, label: "", problem: p.problem } : { riffable, label: p.label, provider: p.id, model: p.model });
          }
          if (url.pathname === RIFF && req.method === "POST") {
            const input = (await body(req)) as RiffInput;
            if (!isObject(input) || typeof input.slug !== "string" || !exists(input.slug))
              return send(res, 400, { message: "Not a piece that can be riffed on." });
            if (typeof input.prompt !== "string" || !input.prompt.trim()) return send(res, 400, { message: "Say what should change." });
            const tokens = defined();
            const p = piece(input.slug, tokens);
            res.statusCode = 200;
            res.setHeader("content-type", "application/x-ndjson");
            const line = (e: RiffEvent) => res.write(`${JSON.stringify(e)}\n`);
            try {
              const model = provider();
              if ("problem" in model) throw new Error(model.problem);
              line({ type: "status", text: `Asking ${model.label}…` });
              const allowed = new Set(p.tokens);
              const current = checkTokens(input.tokens, allowed, tokens).tokens;
              const riffInput: RiffInput = {
                slug: input.slug,
                prompt: input.prompt.trim().slice(0, 2000),
                props: isObject(input.props) ? input.props : {},
                tokens: current,
              };
              const proposals = await model.propose(p, riffInput, tokens, (text) => line({ type: "status", text }));
              line({ type: "variants", variants: proposals.map((v) => checkProposal(v, p.schema, allowed, tokens)) });
            } catch (error) {
              line({ type: "error", message: failure(error) });
            }
            return res.end();
          }
          if (url.pathname === VARIANTS && req.method === "GET") {
            const slug = url.searchParams.get("slug") ?? "";
            return exists(slug) ? send(res, 200, { variants: readKept(slug) }) : send(res, 404, { message: "No such piece." });
          }
          if (url.pathname === VARIANTS && req.method === "POST") {
            const input = (await body(req)) as { slug: string; prompt: string; variant: Proposal };
            if (!isObject(input) || typeof input.slug !== "string" || !exists(input.slug))
              return send(res, 400, { message: "Not a piece that can be riffed on." });
            // Checked again: what comes back from the page is no more trusted than what Claude wrote
            const tokens = defined();
            const p = piece(input.slug, tokens);
            const [proposal] = parseProposals({ variants: [input.variant] });
            const v = checkProposal(proposal, p.schema, new Set(p.tokens), tokens);
            const prompt = typeof input.prompt === "string" ? input.prompt.slice(0, 2000) : "";
            const kept: Kept = { name: v.name, rationale: v.rationale, prompt, props: v.props, tokens: v.tokens };
            writeKept(input.slug, [...readKept(input.slug).filter((k) => k.name !== v.name), kept]);
            let request: string | null = null;
            if (v.structural) {
              mkdirSync(briefs, { recursive: true });
              request = `audit/variant-requests/${input.slug}-${kebab(v.name)}.md`;
              writeFileSync(join(root, request), brief(input.slug, prompt, v));
            }
            return send(res, 200, { kept, file: `app/src/variants/${input.slug}.json`, request });
          }
          if (url.pathname === VARIANTS && req.method === "DELETE") {
            const input = (await body(req)) as { slug: string; name: string };
            if (!isObject(input) || typeof input.slug !== "string" || !exists(input.slug))
              return send(res, 400, { message: "Not a piece that can be riffed on." });
            writeKept(
              input.slug,
              readKept(input.slug).filter((k) => k.name !== input.name),
            );
            return send(res, 200, { variants: readKept(input.slug) });
          }
          return send(res, 405, { message: "Method not allowed." });
        } catch (error) {
          if (!res.headersSent) send(res, 400, { message: error instanceof Error ? error.message : "Bad request." });
          else res.end();
        }
      });
    },
  };
}
