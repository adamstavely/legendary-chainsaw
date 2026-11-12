// What riffing sends and gets back – shared by the dev-server endpoint (plugins/riff.ts) and the app

/** A variant as Claude proposes it: a change to the component's props and to its own design tokens */
export type Proposal = {
  name: string;
  /** One line: what changed and why */
  rationale: string;
  /** Props that differ from the piece's current ones */
  props: Record<string, unknown>;
  /** Design tokens set on the element, each to another token: { "--tc-space-3": "var(--tc-space-2)" } */
  tokens: Record<string, string>;
  /** Needs new code (a new prop, layout or state) – props and tokens can only approximate it */
  structural: boolean;
  /** For a structural variant: what would have to be built */
  note: string;
};

/** Something left out of a variant, and why */
export type Issue = { path: string; message: string };

/** A proposal after the checks: only what's safe to set, and what was left out */
export type Variant = Proposal & { issues: Issue[] };

/** A variant someone kept: saved to trenchcoat/app/src/variants/<slug>.json */
export type Kept = { name: string; rationale: string; prompt: string; props: Record<string, unknown>; tokens: Record<string, string> };

/** One line of the riff endpoint's NDJSON reply */
export type RiffEvent = { type: "status"; text: string } | { type: "variants"; variants: Variant[] } | { type: "error"; message: string };

export const RIFF = "/__canvas/riff";
export const VARIANTS = "/__canvas/variants";
