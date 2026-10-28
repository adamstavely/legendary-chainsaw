/*
 * trenchcoat/generative – what an app needs to let a model place Trenchcoat components in its answers.
 *
 * Two ways in, the same components and checks:
 *   · JSON in the answer: the model writes tc-generated-ui's spec, and a { type: "component", tag, props } block places
 *     any generatable component (it streams like the other blocks). Put catalogPrompt() in the system prompt.
 *   · Tool use: toolDefinitions() gives one tool per component (or a chosen few) for the model to call; the app renders
 *     each call with mountComponent() or as a component block.
 * Either way the props are checked against the component's schema before anything is set (checkComponent): bad props
 * are dropped and reported, links must be http(s), mailto, tel or relative, images can be held to allowedOrigins, and
 * sizes are capped. Check on the server too (checkComponent) before props reach a client. Events come back as DOM
 * events; nothing a component does reaches the app's own state unless the app listens and decides.
 *
 * The catalogue is a line per component (tag, what it's for, its events) – about 5,600 tokens for all of them, so
 * pick a subset for a narrow assistant. A component's schema is loaded only when asked for.
 */
import catalogData from "./catalog.json";
import { registry } from "./registry";
import { checkProps, type CheckOptions, type GenerativeIssue, type Schema } from "./validate";

export { checkProps, isLinkField, isResourceField, isSafeColour, MAX_BYTES, MAX_DEPTH, MAX_ITEMS, MAX_STRING, type CheckOptions, type GenerativeIssue, type Schema } from "./validate";

export type CatalogEntry = { tag: string; name: string; description: string; events: string[] };
/** Every generatable component, a line each */
export const catalog: readonly CatalogEntry[] = catalogData;

/** Whether a model may place this tag */
export const isGeneratable = (tag: string) => Object.hasOwn(registry, tag);

/** A component's JSON Schema for its props; null for a tag that isn't generatable */
export async function loadSchema(tag: string): Promise<(Schema & { title: string; description: string }) | null> {
  if (!isGeneratable(tag)) return null;
  return (await registry[tag].schema()).default as Schema & { title: string; description: string };
}

/** Checks a model's props for a component: what's safe to set, and what was left out and why */
export async function checkComponent(tag: string, props: unknown, options?: CheckOptions): Promise<{ props: Record<string, unknown>; issues: GenerativeIssue[] } | null> {
  const schema = await loadSchema(tag);
  return schema ? checkProps(schema, props, options) : null;
}

/** The catalogue as prompt text: the component block's format, then a line per component */
export function catalogPrompt(tags?: readonly string[]): string {
  const entries = tags ? catalog.filter((e) => tags.includes(e.tag)) : catalog;
  return `You can show Trenchcoat components in your answer. Write a block { "type": "component", "tag": "<tag>", "props": { … } } in the answer's JSON spec – props are the component's properties, as JSON. Only these tags work:
${entries.map((e) => `- ${e.tag}: ${e.description}`).join("\n")}`;
}

/** A tool name for a tag: tc-status-tracker → show_status_tracker */
export const toolName = (tag: string) => `show_${tag.replace(/^tc-/, "").replace(/-/g, "_")}`.slice(0, 64);
/** The tag a tool name stands for, or null */
export const tagOfTool = (name: string) => catalog.find((e) => toolName(e.tag) === name)?.tag ?? null;

/** One tool per component, for the model to call – the Messages API's tools array (name, description, input_schema) */
export async function toolDefinitions(tags: readonly string[] = catalog.map((e) => e.tag)) {
  const tools = [];
  for (const tag of tags) {
    const schema = await loadSchema(tag);
    if (!schema) continue;
    const { title: _title, description, ...rest } = schema;
    const { $schema: _s, $id: _i, ...input_schema } = rest as Schema & { $schema?: string; $id?: string };
    tools.push({ name: toolName(tag), description: `Show <${tag}>: ${description.split("\n")[0]}`, input_schema: { ...input_schema, type: "object" as const } });
  }
  return tools;
}

/**
 * Renders a component a model asked for into `parent`: loads its module, checks the props and sets what's safe.
 * Returns the element and the issues, or null for a tag that isn't generatable; rejects when the module can't load.
 */
export async function mountComponent(parent: Element, tag: string, props: unknown, options?: CheckOptions): Promise<{ element: HTMLElement; issues: GenerativeIssue[] } | null> {
  if (!isGeneratable(tag)) return null;
  const [checked] = await Promise.all([checkComponent(tag, props, options), registry[tag].load()]);
  const element = document.createElement(tag);
  Object.assign(element, checked!.props);
  parent.append(element);
  return { element, issues: checked!.issues };
}
