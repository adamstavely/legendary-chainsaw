import { describe, expect, it } from "vitest";
import { anthropicProvider, jsonIn, openAIProvider, providerFromEnv, type Provider } from "../../plugins/providers";
import { MODEL, TOOL, type Client, type Piece } from "../../plugins/riff";

const piece: Piece = { tag: "tc-tool-call-card", schema: { description: "A tool call", properties: {} }, docs: "# Docs", tokens: ["--tc-space-2"] };
const input = { slug: "tool-call-card", prompt: "Denser", props: { name: "search_web" } };
const defined = new Set(["--tc-space-1", "--tc-space-2"]);
const variants = { variants: [{ name: "Compact", rationale: "Less padding", props: {}, structural: false }] };

/** A fetch that answers once with `body`, and remembers what it was asked */
function fakeFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as unknown as typeof globalThis.fetch;
  return { fetch, calls };
}
const run = (p: Provider) => p.propose(piece, input, defined, () => {});

describe("openAIProvider", () => {
  it("asks Chat Completions with the shared prompt and the tool, and reads the tool call", async () => {
    const { fetch, calls } = fakeFetch(200, {
      choices: [{ finish_reason: "tool_calls", message: { tool_calls: [{ function: { name: TOOL.name, arguments: JSON.stringify(variants) } }] } }],
    });
    const proposals = await run(openAIProvider({ model: "some-model", baseURL: "http://localhost:11434/v1/", apiKey: "k", fetch }));
    expect(proposals.map((p) => p.name)).toEqual(["Compact"]);
    expect(calls[0].url).toBe("http://localhost:11434/v1/chat/completions");
    expect((calls[0].init.headers as Record<string, string>).authorization).toBe("Bearer k");
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.model).toBe("some-model");
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual(["system", "user"]);
    expect(body.messages[1].content).toContain("<tc-tool-call-card>");
    expect(body.tools[0].function).toMatchObject({ name: TOOL.name, parameters: TOOL.input_schema });
    expect(body.tool_choice).toEqual({ type: "function", function: { name: TOOL.name } });
  });

  it("sends no key when there isn't one, and reads JSON from a text answer", async () => {
    const { fetch, calls } = fakeFetch(200, { choices: [{ message: { content: "Here:\n```json\n" + JSON.stringify(variants) + "\n```" } }] });
    expect((await run(openAIProvider({ model: "m", fetch }))).map((p) => p.name)).toEqual(["Compact"]);
    expect((calls[0].init.headers as Record<string, string>).authorization).toBeUndefined();
  });

  it("explains what went wrong", async () => {
    await expect(run(openAIProvider({ model: "m", fetch: fakeFetch(401, "no").fetch }))).rejects.toThrow(/credentials \(401\)/);
    await expect(run(openAIProvider({ model: "m", fetch: fakeFetch(429, "slow down").fetch }))).rejects.toThrow(/rate-limiting/);
    await expect(run(openAIProvider({ model: "m", fetch: fakeFetch(500, "boom").fetch }))).rejects.toThrow(/error \(500\): boom/);
    await expect(run(openAIProvider({ model: "m", fetch: fakeFetch(200, { choices: [{ finish_reason: "length", message: {} }] }).fetch }))).rejects.toThrow(
      /cut off/,
    );
    await expect(run(openAIProvider({ model: "m", fetch: fakeFetch(200, { choices: [{ message: { content: "No idea" } }] }).fetch }))).rejects.toThrow(
      /without proposing/,
    );
    const offline = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof globalThis.fetch;
    await expect(run(openAIProvider({ model: "m", baseURL: "http://localhost:1234/v1", fetch: offline }))).rejects.toThrow(
      /Couldn't connect to http:\/\/localhost:1234\/v1/,
    );
  });
});

describe("anthropicProvider", () => {
  it("streams Claude's request with the chosen model, and names it", async () => {
    let model = "";
    const client: Client = {
      beta: {
        messages: {
          stream: (params) => {
            model = params.model;
            return {
              async *[Symbol.asyncIterator]() {},
              finalMessage: async () => ({ stop_reason: "tool_use", content: [{ type: "tool_use", name: TOOL.name, input: variants }] }) as never,
            };
          },
        },
      },
    };
    const p = anthropicProvider("claude-sonnet-5-5", () => client);
    expect((await run(p)).map((v) => v.name)).toEqual(["Compact"]);
    expect(model).toBe("claude-sonnet-5-5");
    expect(p.label).toBe("Claude");
  });
});

describe("providerFromEnv", () => {
  it("defaults to Claude Opus 5.5", () => {
    expect(providerFromEnv({})).toMatchObject({ id: "anthropic", model: MODEL, label: "Claude" });
  });

  it("takes any OpenAI-compatible server, named by its model unless told otherwise", () => {
    expect(providerFromEnv({ CANVAS_PROVIDER: "openai", CANVAS_MODEL: "llama3.3", CANVAS_BASE_URL: "http://localhost:11434/v1" })).toMatchObject({
      id: "openai",
      model: "llama3.3",
      label: "llama3.3",
    });
    expect(providerFromEnv({ CANVAS_PROVIDER: "OpenAI", CANVAS_MODEL: "m", CANVAS_MODEL_NAME: "Our model" })).toMatchObject({ label: "Our model" });
  });

  it("says what's wrong with a setting", () => {
    expect(providerFromEnv({ CANVAS_PROVIDER: "openai" })).toEqual({ problem: expect.stringMatching(/CANVAS_MODEL isn't set/) });
    expect(providerFromEnv({ CANVAS_PROVIDER: "gemini" })).toEqual({ problem: expect.stringMatching(/use anthropic or openai/) });
  });
});

it("finds the JSON in a text answer", () => {
  expect(jsonIn('Sure! {"variants": []} Hope that helps')).toEqual({ variants: [] });
});
