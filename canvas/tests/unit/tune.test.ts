import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { scaleOf, scales, tunableTokens } from "../../plugins/tokens";
import { applyTuned, dialFor, dialsFor, tunedVariant } from "../../src/riff/tune";

const tc = (p: string) => readFileSync(fileURLToPath(new URL(`../../../trenchcoat/${p}`, import.meta.url)), "utf8");
const css = tc("tokens/tokens.css");

describe("token scales", () => {
  it("puts tokens on their scale, in tokens.css order", () => {
    expect(scaleOf("--tc-space-2-5")).toBe("space");
    expect(scaleOf("--tc-text-primary")).toBeNull();
    const all = scales(css);
    expect(all.space.indexOf("--tc-space-1")).toBeLessThan(all.space.indexOf("--tc-space-3"));
  });

  it("offers a component's scale tokens, each with its scale", () => {
    const tokens = tunableTokens(tc("src/elements/tool-call-card.ts"), "tool-call-card", css);
    const space = tokens.find((t) => t.token === "--tc-space-2")!;
    expect(space.options).toContain("--tc-space-4");
    expect(tokens.every((t) => scaleOf(t.token))).toBe(true);
  });
});

describe("dialFor", () => {
  it("picks a dial from the schema and the value", () => {
    expect(dialFor("status", { type: "string", enum: ["a", "b"] }, "b")).toEqual({ type: "select", options: ["a", "b"], default: "b" });
    expect(dialFor("open", { type: "boolean" }, true)).toBe(true);
    expect(dialFor("count", { type: "integer", minimum: 1, maximum: 9 }, 3)).toEqual([3, 1, 9, 1]);
    expect(dialFor("ratio", { type: "number" }, 0.5)).toEqual([0.5, 0, 1, 0.01]);
    expect(dialFor("duration", { type: "number" }, 2400)).toEqual([2400, 0, 7200, 1]);
    expect(dialFor("title", { type: "string" }, "Hi")).toEqual({ type: "text", default: "Hi" });
    expect(dialFor("accentColor", { type: "string" }, "#336699")).toEqual({ type: "color", default: "#336699" });
  });

  it("has no dial for links, timestamps, long text, lists or mixed types", () => {
    expect(dialFor("href", { type: "string" }, "/a")).toBeNull();
    expect(dialFor("startedAt", { type: "number" }, Date.now())).toBeNull();
    expect(dialFor("body", { type: "string" }, "x".repeat(500))).toBeNull();
    expect(dialFor("items", { type: "array" }, [])).toBeNull();
    expect(dialFor("value", { type: ["string", "number"] }, 1)).toBeNull();
  });
});

describe("a tuned version", () => {
  const dials = dialsFor(
    { properties: { status: { type: "string", enum: ["ok", "error"] }, open: { type: "boolean" }, items: { type: "array" } } },
    { status: "ok", items: [] },
    [
      { token: "--tc-space-2", options: ["--tc-space-1", "--tc-space-2", "--tc-space-3"] },
      { token: "--tc-space-3", options: ["--tc-space-1", "--tc-space-2", "--tc-space-3"] },
    ],
  );

  it("has a dial for each simple prop and a folder of tokens", () => {
    expect(Object.keys(dials.config)).toEqual(["status", "open", "tokens"]);
    expect(dials.props).toEqual({ status: "ok", open: false });
    expect(dials.tokens).toEqual({ "space-2": "--tc-space-2", "space-3": "--tc-space-3" });
  });

  it("is what the dials moved, without token cycles", () => {
    expect(tunedVariant(dials, { status: "ok", open: false, tokens: { "space-2": "--tc-space-2", "space-3": "--tc-space-3" } })).toEqual({
      props: {},
      tokens: {},
    });
    expect(tunedVariant(dials, { status: "error", open: false, tokens: { "space-2": "--tc-space-1", "space-3": "--tc-space-3" } })).toEqual({
      props: { status: "error" },
      tokens: { "--tc-space-2": "var(--tc-space-1)" },
    });
    // space-2 → space-3 while space-3 → space-1 would chain: the first is left out
    expect(tunedVariant(dials, { status: "ok", open: false, tokens: { "space-2": "--tc-space-3", "space-3": "--tc-space-1" } }).tokens).toEqual({
      "--tc-space-3": "var(--tc-space-1)",
    });
  });

  it("sets props and tokens on the piece, and clears what moved back", () => {
    const style = new Map<string, string>();
    const el = { style: { setProperty: (k: string, v: string) => style.set(k, v), removeProperty: (k: string) => style.delete(k) } } as unknown as HTMLElement;
    applyTuned(el, dials, { props: { status: "error" }, tokens: { "--tc-space-2": "var(--tc-space-1)" } });
    expect((el as unknown as { status: string }).status).toBe("error");
    expect(style.get("--tc-space-2")).toBe("var(--tc-space-1)");
    applyTuned(el, dials, { props: {}, tokens: {} });
    expect((el as unknown as { status: string }).status).toBe("ok");
    expect(style.size).toBe(0);
  });
});
