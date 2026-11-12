// Which model riffs. The canvas doesn't depend on one: a provider turns the riff prompt into proposals, and everything
// around it – the prompt, the tool's shape, the checks on what comes back – is the same for all of them.
//
//   CANVAS_PROVIDER   anthropic (the default) or openai – any server that speaks OpenAI's Chat Completions API:
//                     OpenAI, Azure OpenAI, Google Gemini's OpenAI endpoint, OpenRouter, a local Ollama or LM Studio
//   CANVAS_MODEL      the model id; for anthropic it defaults to claude-opus-5-5, for openai it must be set
//   CANVAS_BASE_URL   openai only: the API's base URL (default https://api.openai.com/v1; Ollama: http://localhost:11434/v1)
//   CANVAS_API_KEY    openai only: the key, if the server wants one (OPENAI_API_KEY also works). Anthropic reads its
//                     own credentials (ANTHROPIC_API_KEY, or an `ant auth login` profile)
//   CANVAS_MODEL_NAME what the panel calls the model ("Ask …"); defaults to Claude, or the model id
import Anthropic from "@anthropic-ai/sdk";
import type { Proposal } from "../src/riff/types";
import { MODEL, TOOL, failure, parseProposals, riffRequest, runRiff, systemPrompt, userPrompt, type Client, type Piece, type RiffInput } from "./riff";

export type Provider = {
  id: "anthropic" | "openai";
  model: string;
  /** What the panel calls it: "Ask Claude", "Ask gpt-…" */
  label: string;
  propose(piece: Piece, input: RiffInput, defined: ReadonlySet<string>, say: (text: string) => void): Promise<Proposal[]>;
};

export function anthropicProvider(model = MODEL, client: () => Client = () => new Anthropic(), label = "Claude"): Provider {
  return {
    id: "anthropic",
    model,
    label,
    async propose(piece, input, defined, say) {
      try {
        return await runRiff(client(), { ...riffRequest(piece, input, defined), model }, say, label);
      } catch (error) {
        throw new Error(failure(error));
      }
    },
  };
}

type ChatCompletion = {
  choices?: { finish_reason?: string; message?: { content?: string | null; tool_calls?: { function?: { name?: string; arguments?: string } }[] } }[];
};

/** The first JSON object in a reply, for models that answer in text rather than through the tool */
export function jsonIn(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text)?.[1];
  const raw = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(raw);
}

/** Any server that speaks OpenAI's Chat Completions API, with function calling */
export function openAIProvider({
  model,
  baseURL = "https://api.openai.com/v1",
  apiKey,
  label = model,
  fetch = globalThis.fetch,
}: {
  model: string;
  baseURL?: string;
  apiKey?: string;
  label?: string;
  fetch?: typeof globalThis.fetch;
}): Provider {
  return {
    id: "openai",
    model,
    label,
    async propose(piece, input, defined, say) {
      say(`${label} is working on the variants…`);
      let res: Response;
      try {
        res = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}) },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt(defined) },
              { role: "user", content: userPrompt(piece, input) },
            ],
            tools: [{ type: "function", function: { name: TOOL.name, description: TOOL.description, parameters: TOOL.input_schema } }],
            tool_choice: { type: "function", function: { name: TOOL.name } },
          }),
        });
      } catch {
        throw new Error(`Couldn't connect to ${baseURL}. Check CANVAS_BASE_URL and that the server is running.`);
      }
      if (!res.ok) {
        const detail = (await res.text().catch(() => "")).slice(0, 300);
        if (res.status === 401 || res.status === 403)
          throw new Error(`${label} refused the credentials (${res.status}). Check CANVAS_API_KEY and restart the dev server.`);
        if (res.status === 429) throw new Error(`${label} is rate-limiting requests. Try again in a minute.`);
        throw new Error(`${label} returned an error (${res.status})${detail ? `: ${detail}` : ""}`);
      }
      const choice = ((await res.json()) as ChatCompletion).choices?.[0];
      if (choice?.finish_reason === "length") throw new Error(`${label}'s answer was cut off before it finished. Try a narrower change.`);
      if (choice?.finish_reason === "content_filter") throw new Error(`${label} declined this request. Try putting the change another way.`);
      const call = choice?.message?.tool_calls?.find((c) => c.function?.name === TOOL.name);
      let proposal: unknown;
      try {
        // Some servers ignore tool_choice and answer in text: take the JSON from that instead
        proposal = call?.function?.arguments ? JSON.parse(call.function.arguments) : jsonIn(choice?.message?.content ?? "");
      } catch {
        throw new Error(`${label} answered without proposing variants. Try again, or put the change another way.`);
      }
      return parseProposals(proposal);
    },
  };
}

/** The provider the environment asks for, or what's wrong with the setting */
export function providerFromEnv(env: Record<string, string | undefined> = process.env): Provider | { problem: string } {
  const id = (env.CANVAS_PROVIDER ?? "anthropic").toLowerCase();
  if (id === "anthropic") return anthropicProvider(env.CANVAS_MODEL || MODEL, undefined, env.CANVAS_MODEL_NAME || "Claude");
  if (id === "openai") {
    if (!env.CANVAS_MODEL) return { problem: "CANVAS_PROVIDER is openai, but CANVAS_MODEL isn't set: name the model to use, then restart the dev server." };
    return openAIProvider({
      model: env.CANVAS_MODEL,
      baseURL: env.CANVAS_BASE_URL || undefined,
      apiKey: env.CANVAS_API_KEY || env.OPENAI_API_KEY || undefined,
      label: env.CANVAS_MODEL_NAME || env.CANVAS_MODEL,
    });
  }
  return { problem: `CANVAS_PROVIDER is “${env.CANVAS_PROVIDER}”: use anthropic or openai, then restart the dev server.` };
}
