/// <reference types="vite/client" />

declare module "virtual:tc-examples" {
  /** Each piece's live example, by slug – only pieces whose docs page has an html example */
  const examples: Record<
    string,
    () => Promise<{
      markup: string;
      default: (document: Document, console: Pick<Console, "log" | "info" | "warn" | "error">, fetch: typeof globalThis.fetch) => Promise<void>;
    }>
  >;
  export default examples;
}

declare module "virtual:tc-graph" {
  /** [user, used] pairs of element slugs: the first renders or imports the second */
  const edges: [string, string][];
  export default edges;
}
