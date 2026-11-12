// The browser side of riffing: calls the dev server's endpoints (plugins/riff.ts), which hold the API key
import { RIFF, VARIANTS, type Kept, type Proposal, type RiffEvent, type Variant } from "./types";

const json = { "content-type": "application/json" };

async function ok<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message ?? `The dev server said ${res.status}.`);
  return data as T;
}

/** Which pieces can be riffed on; empty in a built canvas, which has no dev server */
export async function riffable(): Promise<Set<string>> {
  if (!import.meta.env.DEV) return new Set();
  try {
    return new Set((await ok<{ riffable: string[] }>(await fetch(RIFF))).riffable);
  } catch {
    return new Set();
  }
}

export type RiffRequest = { slug: string; prompt: string; props: Record<string, unknown>; tokens: Record<string, string> };

/** Asks for variants; `progress` hears what Claude is doing. Rejects with a message to show */
export async function requestVariants(request: RiffRequest, progress: (text: string) => void, signal?: AbortSignal): Promise<Variant[]> {
  const res = await fetch(RIFF, { method: "POST", headers: json, body: JSON.stringify(request), signal });
  if (!res.ok || !res.body) await ok(res);
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    buffer += value ?? "";
    const lines = buffer.split("\n");
    buffer = done ? "" : lines.pop()!;
    for (const line of lines.filter(Boolean)) {
      const event = JSON.parse(line) as RiffEvent;
      if (event.type === "status") progress(event.text);
      else if (event.type === "variants") return event.variants;
      else throw new Error(event.message);
    }
    if (done) throw new Error("The dev server stopped before Claude answered.");
  }
}

export const keptVariants = async (slug: string) => (await ok<{ variants: Kept[] }>(await fetch(`${VARIANTS}?slug=${encodeURIComponent(slug)}`))).variants;

export const keepVariant = async (slug: string, prompt: string, variant: Proposal) =>
  ok<{ kept: Kept; file: string; request: string | null }>(
    await fetch(VARIANTS, { method: "POST", headers: json, body: JSON.stringify({ slug, prompt, variant }) }),
  );

export const removeVariant = async (slug: string, name: string) =>
  (await ok<{ variants: Kept[] }>(await fetch(VARIANTS, { method: "DELETE", headers: json, body: JSON.stringify({ slug, name }) }))).variants;
