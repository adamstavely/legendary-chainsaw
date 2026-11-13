import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { formatDate, isoDate } from "./internal/util";
import "./code-block";

/*
 * <tc-skill-detail> – one skill, everything about it in one card:
 *   · who made it and its version, with Update when a newer one is `available`
 *   · when it's used: the phrases in its description that make a model pick it
 *   · the tools it may use, each with what it's allowed to do in words – read-only, writes files, runs commands, uses
 *     the network
 *   · its files (SKILL.md, scripts/, references/) as a list; picking one shows it below in a code block
 *   · recent runs: when, which agent, and how it went
 *   · Enable / Disable, Export and Remove. Turning on a skill that can write files, run commands or reach the network
 *     asks first and says which; Remove asks too, naming the agents that stop being able to use it
 *   · keyboard: the files are one tab stop (↑/↓, Home, End pick a file); the confirmations take focus, and Escape
 *     cancels them and returns focus to the switch or Remove
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-skill-detail heading="Contract reviewer" .tools=${tools} .files=${files} .runs=${runs}></tc-skill-detail>
 *
 * `enabled` and `file` are the element's own unless a tc-enabled-change or tc-file-change listener calls
 * preventDefault(). Relative times need `now`; without it the date shows.
 */

/** What a tool lets the skill do */
export type SkillPermission = "read" | "write" | "run" | "network";
/** A tool the skill may call */
export type SkillDetailTool = { name: string; permission: SkillPermission; description?: string };
/** A file in the skill's folder; `path` from the skill's root, e.g. "scripts/check.py" */
export type SkillDetailFile = { path: string; content?: string; language?: string };
export type SkillRunOutcome = "succeeded" | "failed" | "cancelled";
/** One time the skill ran */
export type SkillDetailRun = { id: string; at: number; agent: string; outcome: SkillRunOutcome; note?: string };
export type SkillDetailEnabledChange = { enabled: boolean };
export type SkillDetailFileChange = { file: string };
export type SkillDetailUpdate = { version: string };
export type SkillDetailRemove = { name: string; usedBy: string[] };

export type SkillDetailLabels = {
  permissions: Record<SkillPermission, string>;
  outcomes: Record<SkillRunOutcome, string>;
  enabled: string;
  author: string;
  version: string;
  updateAvailable: string;
  update: string;
  triggers: string;
  noTriggers: string;
  tools: string;
  noTools: string;
  files: string;
  noFiles: string;
  noPreview: string;
  runs: string;
  noRuns: string;
  export: string;
  remove: string;
  cancel: string;
  riskTitle: string;
  riskLead: string;
  risks: Record<Exclude<SkillPermission, "read">, string>;
  turnOn: string;
  removeTitle: string;
  removeUsed: string;
  removeUnused: string;
  announceOn: string;
  announceOff: string;
  announceRemoved: string;
};
export const defaultSkillDetailLabels: SkillDetailLabels = {
  permissions: { read: "Read-only", write: "Writes files", run: "Runs commands", network: "Uses the network" },
  outcomes: { succeeded: "Succeeded", failed: "Failed", cancelled: "Cancelled" },
  enabled: "Enabled",
  author: "Made by",
  version: "Version",
  updateAvailable: "{version} available",
  update: "Update to {version}",
  triggers: "When it's used",
  noTriggers: "Only when someone asks for it by name.",
  tools: "Tools it can use",
  noTools: "No tools – it only writes text.",
  files: "Files",
  noFiles: "No files.",
  noPreview: "No preview for this file.",
  runs: "Recent runs",
  noRuns: "Not used yet.",
  export: "Export",
  remove: "Remove",
  cancel: "Cancel",
  riskTitle: "Turn on {name}?",
  riskLead: "Once it's on, agents that pick it can:",
  risks: { write: "write and change files", run: "run commands on the machine they work on", network: "send and fetch data over the network" },
  turnOn: "Turn on",
  removeTitle: "Remove {name}?",
  removeUsed: "{agents} will stop being able to use it. You can add it again later.",
  removeUnused: "No agent uses it now. You can add it again later.",
  announceOn: "{name} is on.",
  announceOff: "{name} is off.",
  announceRemoved: "{name} removed.",
};
const RISKY: Exclude<SkillPermission, "read">[] = ["write", "run", "network"];
const PERMISSIONS: SkillPermission[] = ["read", "write", "run", "network"];
const OUTCOMES: SkillRunOutcome[] = ["succeeded", "failed", "cancelled"];
const EXT: Record<string, string> = { ts: "ts", tsx: "tsx", js: "js", mjs: "js", jsx: "jsx", py: "py", json: "json", html: "html", xml: "xml", css: "css", sh: "sh", bash: "sh" };
const fill = (t: string, vars: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
const and = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);
const pickOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

function ago(at: number, now: number | undefined, locale: string | undefined) {
  if (now === undefined) return formatDate(at, locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const s = Math.max(0, Math.round((now - at) / 1000));
  let rtf: Intl.RelativeTimeFormat;
  try {
    rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  } catch {
    rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "short" });
  }
  if (s < 60) return rtf.format(0, "minute");
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  if (s < 86400 * 30) return rtf.format(-Math.round(s / 86400), "day");
  return formatDate(at, locale, { month: "short", day: "numeric" });
}

/** The risky permissions among a skill's tools, in a fixed order */
export function skillRisks(tools: readonly SkillDetailTool[]): Exclude<SkillPermission, "read">[] {
  return RISKY.filter((p) => tools.some((t) => t.permission === p));
}

/* book-open-check, file, folder, download, trash-2, arrow-up-circle, triangle-alert: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="M12 21V7"></path><path d="m16 12 2 2 4-4"></path><path d="M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3"></path>`;
const glyph = (body: ReturnType<typeof svg>, cls = "ui-skd__glyph") =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const fileIcon = () => glyph(svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>`);
const folderIcon = () => glyph(svg`<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>`);
const exportIcon = () => glyph(svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line>`);
const trashIcon = () => glyph(svg`<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>`);
const updateIcon = () => glyph(svg`<circle cx="12" cy="12" r="10"></circle><path d="m16 12-4-4-4 4"></path><path d="M12 16V8"></path>`);
const alertIcon = () => glyph(svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`);

let instances = 0;

/**
 * One skill: who made it and its version, when a model picks it, the tools it may use and what they can do, its files,
 * recent runs, and Enable, Update, Export and Remove – asking first before turning on anything risky or removing it.
 * @tag tc-skill-detail
 * @fires tc-enabled-change - The skill was turned on or off ({ enabled }: SkillDetailEnabledChange); cancelable – prevented, `enabled` stays as it was. Turning on a risky skill fires it only after Turn on is pressed
 * @fires tc-file-change - Another file was picked ({ file }: SkillDetailFileChange); cancelable – prevented, `file` stays as it was
 * @fires tc-update - Update was pressed ({ version }: SkillDetailUpdate)
 * @fires tc-export - Export was pressed (detail: {})
 * @fires tc-remove - Remove was confirmed ({ name, usedBy }: SkillDetailRemove); cancelable – prevented, nothing is announced
 */
export class TcSkillDetail extends TcElement {
  static override ui = "skd";

  /** The skill's name, shown as the heading */
  @property() accessor heading = "";
  /** What it does, under the name */
  @property() accessor description = "";
  /** Who made it: "Built-in", "Your team", a plugin's name, "Community" */
  @property() accessor author = "";
  /** Its version, e.g. "1.4.0" */
  @property() accessor version = "";
  /** A newer version that's available, e.g. "1.5.0"; shows Update */
  @property() accessor available = "";
  /** It's on. Changed by the switch unless a tc-enabled-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor enabled = false;
  /** When a model picks it: the phrases from its description */
  @property({ attribute: false }) accessor triggers: string[] = [];
  /** The tools it may use, with what each is allowed to do */
  @property({ attribute: false }) accessor tools: SkillDetailTool[] = [];
  /** Its files, paths from the skill's root */
  @property({ attribute: false }) accessor files: SkillDetailFile[] = [];
  /** The file shown; null shows the first. Changed by picking unless a tc-file-change listener calls preventDefault() */
  @property() accessor file: string | null = null;
  /** Recent runs, newest first */
  @property({ attribute: false }) accessor runs: SkillDetailRun[] = [];
  /** The agents that use it – named when removing */
  @property({ attribute: false }) accessor usedBy: string[] = [];
  /** Hide Remove */
  @property({ type: Boolean, attribute: "no-remove" }) accessor noRemove = false;
  /** The time now, epoch ms, for "3 h ago"; without it, runs show their date */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** For dates and relative times */
  @property() accessor locale: string | undefined = undefined;
  /** Words to rename, merged over defaultSkillDetailLabels; {name}, {version} and {agents} are filled in */
  @property({ attribute: false }) accessor labels: Partial<SkillDetailLabels> = {};

  @state() private accessor confirming: "" | "risk" | "remove" = "";
  @state() private accessor announce = "";

  private readonly uid = `tc-skd${++instances}`;

  constructor() {
    super();
    new FocusRescueController(this, (key) => (key === "remove-confirm" ? this.querySelector<HTMLElement>(".ui-skd__remove") : this.querySelector<HTMLElement>(".ui-skd__switch")));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const name = this.heading || "Skill";
    if (this.getAttribute("aria-label") !== name) this.setAttribute("aria-label", name);
  }

  private get words(): SkillDetailLabels {
    const l = this.labels;
    const d = defaultSkillDetailLabels;
    return { ...d, ...l, permissions: { ...d.permissions, ...l.permissions }, outcomes: { ...d.outcomes, ...l.outcomes }, risks: { ...d.risks, ...l.risks } };
  }
  private get shownFile(): SkillDetailFile | undefined {
    return this.files.find((f) => f.path === this.file) ?? this.files[0];
  }
  private focusLater(selector: string) {
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(selector)?.focus());
  }

  /* ---------- Enabling ---------- */

  private setEnabled(enabled: boolean) {
    if (!this.emit<SkillDetailEnabledChange>("tc-enabled-change", { enabled }, { cancelable: true })) return false;
    this.enabled = enabled;
    this.announce = fill(enabled ? this.words.announceOn : this.words.announceOff, { name: this.heading });
    return true;
  }
  private flip() {
    if (this.confirming === "risk") return this.cancelConfirm();
    if (!this.enabled && skillRisks(this.tools).length) {
      this.confirming = "risk";
      this.focusLater(".ui-skd__confirm-ok");
      return;
    }
    this.setEnabled(!this.enabled);
  }
  private confirmOn() {
    this.confirming = "";
    this.setEnabled(true);
    this.focusLater(".ui-skd__switch");
  }
  private cancelConfirm() {
    const was = this.confirming;
    this.confirming = "";
    this.focusLater(was === "remove" ? ".ui-skd__remove" : ".ui-skd__switch");
  }

  /* ---------- Removing ---------- */

  private askRemove() {
    this.confirming = "remove";
    this.focusLater(".ui-skd__confirm-cancel");
  }
  private confirmRemove() {
    this.confirming = "";
    if (this.emit<SkillDetailRemove>("tc-remove", { name: this.heading, usedBy: this.usedBy }, { cancelable: true })) this.announce = fill(this.words.announceRemoved, { name: this.heading });
    this.focusLater(".ui-skd__remove");
  }

  /* ---------- Files ---------- */

  private pickFile(path: string) {
    if (path === this.shownFile?.path) return;
    if (this.emit<SkillDetailFileChange>("tc-file-change", { file: path }, { cancelable: true })) this.file = path;
  }
  private fileKey(e: KeyboardEvent) {
    const paths = this.files.map((f) => f.path);
    const at = paths.indexOf(this.shownFile?.path ?? "");
    const next: Record<string, number> = { ArrowDown: Math.min(paths.length - 1, at + 1), ArrowUp: Math.max(0, at - 1), Home: 0, End: paths.length - 1 };
    if (!(e.key in next)) return;
    e.preventDefault();
    this.pickFile(paths[next[e.key]]);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>('.ui-skd__file[tabindex="0"]')?.focus());
  }

  /* ---------- Rendering ---------- */

  private renderConfirm() {
    const w = this.words;
    if (!this.confirming) return nothing;
    const id = `${this.uid}-confirm`;
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.cancelConfirm();
      }
    };
    if (this.confirming === "risk") {
      const risks = skillRisks(this.tools);
      return html`<div class="ui-skd__confirm" data-kind="risk" role="group" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-desc`} @keydown=${keys}>
        <span class="ui-skd__confirm-icon">${alertIcon()}</span>
        <div class="ui-skd__confirm-body">
          <p class="ui-skd__confirm-title" id=${`${id}-title`}>${fill(w.riskTitle, { name: this.heading })}</p>
          <div id=${`${id}-desc`}>
            <p>${w.riskLead}</p>
            <ul class="ui-skd__risks">${risks.map((r) => html`<li data-permission=${r}>${w.risks[r]}</li>`)}</ul>
          </div>
          <div class="ui-skd__confirm-actions">
            <button type="button" class="tc-btn-sm ui-skd__confirm-cancel" @click=${() => this.cancelConfirm()}>${w.cancel}</button>
            <button type="button" class="tc-btn-sm ui-skd__confirm-ok" data-tone="primary" @click=${() => this.confirmOn()}>${w.turnOn}</button>
          </div>
        </div>
      </div>`;
    }
    const agents = and(this.usedBy);
    return html`<div class="ui-skd__confirm" data-kind="remove" role="group" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-desc`} @keydown=${keys}>
      <span class="ui-skd__confirm-icon">${trashIcon()}</span>
      <div class="ui-skd__confirm-body">
        <p class="ui-skd__confirm-title" id=${`${id}-title`}>${fill(w.removeTitle, { name: this.heading })}</p>
        <p id=${`${id}-desc`}>${this.usedBy.length ? fill(w.removeUsed, { agents }) : w.removeUnused}</p>
        <div class="ui-skd__confirm-actions">
          <button type="button" class="tc-btn-sm ui-skd__confirm-cancel" @click=${() => this.cancelConfirm()}>${w.cancel}</button>
          <button type="button" class="tc-btn-sm ui-skd__confirm-ok" data-tone="danger" data-focus-key="remove-confirm" @click=${() => this.confirmRemove()}>${w.remove}</button>
        </div>
      </div>
    </div>`;
  }

  private renderFiles() {
    const w = this.words;
    if (!this.files.length) return html`<p class="ui-skd__none">${w.noFiles}</p>`;
    const shown = this.shownFile!;
    const top = this.files.filter((f) => !f.path.includes("/"));
    const folders = new Map<string, SkillDetailFile[]>();
    for (const f of this.files) {
      const i = f.path.lastIndexOf("/");
      if (i < 0) continue;
      const dir = f.path.slice(0, i + 1);
      folders.set(dir, [...(folders.get(dir) ?? []), f]);
    }
    const option = (f: SkillDetailFile, name: string) => {
      const sel = f.path === shown.path;
      return html`<li
        role="option"
        class="ui-skd__file"
        aria-selected=${sel ? "true" : "false"}
        tabindex=${sel ? "0" : "-1"}
        data-path=${f.path}
        @click=${() => this.pickFile(f.path)}
      >${fileIcon()}<span class="ui-skd__file-name">${name}</span></li>`;
    };
    const ext = shown.path.split(".").pop()?.toLowerCase() ?? "";
    return html`<div class="ui-skd__files">
      <ul class="ui-skd__file-list" role="listbox" aria-label=${w.files} @keydown=${(e: KeyboardEvent) => this.fileKey(e)}>
        ${top.map((f) => option(f, f.path))}
        ${[...folders].map(
          ([dir, files]) => html`<li role="presentation" class="ui-skd__folder">
            <span class="ui-skd__folder-name" aria-hidden="true">${folderIcon()}${dir}</span>
            <ul role="group" aria-label=${dir}>${files.map((f) => option(f, f.path.slice(dir.length)))}</ul>
          </li>`,
        )}
      </ul>
      <div class="ui-skd__viewer">
        ${shown.content !== undefined
          ? html`<tc-code-block bare look=${this.resolvedLook} .code=${shown.content} filename=${shown.path} language=${shown.language ?? EXT[ext] ?? ""} wrap max-height="320"></tc-code-block>`
          : html`<p class="ui-skd__none">${w.noPreview}</p>`}
      </div>
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const id = this.uid;
    const risks = new Set<SkillPermission>(skillRisks(this.tools));
    return html`${cardHead({
        icon: ICON,
        title: this.heading,
        subtitle: this.description || undefined,
        id: `${id}-title`,
        aside: html`<span class="ui-skd__toggle">
          <span class="ui-skd__toggle-label" id=${`${id}-switch`}>${w.enabled}</span>
          <button
            type="button"
            role="switch"
            class="ui-skd__switch"
            aria-checked=${this.enabled ? "true" : "false"}
            aria-labelledby=${`${id}-switch`}
            aria-expanded=${ifDefined(this.confirming === "risk" ? "true" : undefined)}
            @click=${() => this.flip()}
          ><span></span></button>
        </span>`,
      })}
      <div class="ui-skd__card">
        ${this.confirming === "risk" ? this.renderConfirm() : nothing}
        <dl class="ui-skd__facts">
          ${this.author ? html`<div><dt>${w.author}</dt><dd>${this.author}</dd></div>` : nothing}
          ${this.version
            ? html`<div><dt>${w.version}</dt><dd><span class="ui-skd__mono">${this.version}</span>${this.available ? html` <span class="ui-skd__badge">${fill(w.updateAvailable, { version: this.available })}</span>` : nothing}</dd></div>`
            : nothing}
        </dl>
        <section class="ui-skd__section" aria-labelledby=${`${id}-triggers`}>
          <h4 class="ui-skd__label" id=${`${id}-triggers`}>${w.triggers}</h4>
          ${this.triggers.length ? html`<ul class="ui-skd__triggers">${this.triggers.map((t) => html`<li>${t}</li>`)}</ul>` : html`<p class="ui-skd__none">${w.noTriggers}</p>`}
        </section>
        <section class="ui-skd__section" aria-labelledby=${`${id}-tools`}>
          <h4 class="ui-skd__label" id=${`${id}-tools`}>${w.tools}</h4>
          ${this.tools.length
            ? html`<ul class="ui-skd__tools">
                ${this.tools.map((t) => {
                  const p = pickOf(PERMISSIONS, t.permission, "read");
                  return html`<li class="ui-skd__tool" data-permission=${p} ?data-risky=${risks.has(p)} title=${ifDefined(t.description)}>
                    <span class="ui-skd__tool-name">${t.name}</span><span class="tc-sr-only">: </span><span class="ui-skd__perm"><span class="ui-skd__perm-mark" aria-hidden="true"></span>${w.permissions[p]}</span>
                  </li>`;
                })}
              </ul>`
            : html`<p class="ui-skd__none">${w.noTools}</p>`}
        </section>
        <section class="ui-skd__section" aria-labelledby=${`${id}-files`}>
          <h4 class="ui-skd__label" id=${`${id}-files`}>${w.files}</h4>
          ${this.renderFiles()}
        </section>
        <section class="ui-skd__section" aria-labelledby=${`${id}-runs`}>
          <h4 class="ui-skd__label" id=${`${id}-runs`}>${w.runs}</h4>
          ${this.runs.length
            ? html`<ul class="ui-skd__runs">
                ${this.runs.map((r) => {
                  const o = pickOf(OUTCOMES, r.outcome, "succeeded");
                  return html`<li class="ui-skd__run" data-outcome=${o}>
                    <span class="ui-skd__run-mark" aria-hidden="true"></span>
                    <span class="ui-skd__run-outcome">${w.outcomes[o]}</span>
                    <span class="ui-skd__run-agent">${r.agent}</span>
                    ${r.note ? html`<span class="ui-skd__run-note">${r.note}</span>` : nothing}
                    <time class="ui-skd__run-at" datetime=${ifDefined(isoDate(r.at))}>${ago(r.at, this.now, this.locale)}</time>
                  </li>`;
                })}
              </ul>`
            : html`<p class="ui-skd__none">${w.noRuns}</p>`}
        </section>
        ${this.confirming === "remove" ? this.renderConfirm() : nothing}
        <div class="ui-skd__actions">
          ${this.available
            ? html`<button type="button" class="tc-btn-sm ui-skd__update" @click=${() => this.emit<SkillDetailUpdate>("tc-update", { version: this.available })}>${updateIcon()}${fill(w.update, { version: this.available })}</button>`
            : nothing}
          <button type="button" class="tc-btn-sm ui-skd__export" @click=${() => this.emit("tc-export", {})}>${exportIcon()}${w.export}</button>
          <span class="ui-skd__spacer"></span>
          ${this.noRemove
            ? nothing
            : html`<button type="button" class="tc-btn-sm ui-skd__remove" aria-expanded=${this.confirming === "remove" ? "true" : "false"} @click=${() => (this.confirming === "remove" ? this.cancelConfirm() : this.askRemove())}>
                ${trashIcon()}${w.remove}
              </button>`}
        </div>
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
[data-ui="skd"] {
  position: relative; display: block; box-sizing: border-box; width: 100%; min-width: 0;
  container-type: inline-size; color: var(--tc-text-primary); font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); text-align: left; -webkit-font-smoothing: antialiased;
  --tc-skd-files-w: 200px;
  --tc-skd-mark: 8px;
}
[data-ui="skd"] *, [data-ui="skd"] *::before, [data-ui="skd"] *::after { box-sizing: border-box; }
:where([data-ui="skd"]) :is(p, ul, h4, dl, dd) { margin: 0; padding: 0; }
:where([data-ui="skd"]) ul { list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="skd"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *) .ui-skd__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="skd"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-skd__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="skd"] svg[stroke-width] { stroke-width: 1.5; }
.ui-skd__glyph { flex: none; width: var(--tc-space-4); height: var(--tc-space-4); }
.ui-skd__mono { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }

/* The switch in the header, with its visible name */
.ui-skd__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
.ui-skd__toggle-label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-skd__switch { position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); margin: 0; padding: 0; border: 0; border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); cursor: pointer; transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-skd__switch[aria-checked="true"] { background: var(--tc-switch-on); }
.ui-skd__switch span { position: absolute; top: var(--tc-space-0-5); left: var(--tc-space-0-5); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: calc(var(--tc-switch-radius) - var(--tc-space-0-5)); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-skd__switch[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-skd__switch:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-skd__switch::after { content: ""; position: absolute; inset: calc(-1 * var(--tc-space-2)) calc(-1 * var(--tc-space-1-5)); }

/* Facts and sections */
.ui-skd__facts { display: flex; flex-wrap: wrap; gap: var(--tc-space-2) var(--tc-space-6); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-skd__facts > div { display: grid; gap: var(--tc-space-0-5); }
.ui-skd__facts dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-skd__facts dd { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-primary); }
.ui-skd__badge { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *) .ui-skd__badge { background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-skd__section { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-skd__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-skd__none { color: var(--tc-text-muted); }
.ui-skd__triggers { display: grid; gap: var(--tc-space-1); }
.ui-skd__triggers > li { position: relative; padding-left: var(--tc-space-3); color: var(--tc-text-secondary); line-height: var(--tc-line-height-snug); }
.ui-skd__triggers > li::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: var(--tc-space-0-5); border-radius: var(--tc-radius-full); background: var(--tc-border-default); }

/* Tools: a chip each, the permission as a mark and a word */
.ui-skd__tools { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-skd__tool { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-pill-h); padding: var(--tc-space-0-5) var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *) .ui-skd__tool { background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-skd__tool-name { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); }
.ui-skd__perm { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-skd__perm-mark { width: var(--tc-skd-mark); height: var(--tc-skd-mark); border-radius: 50%; background: var(--tc-status-success-solid); }
.ui-skd__tool[data-risky] .ui-skd__perm { color: var(--tc-status-warning-fg); }
.ui-skd__tool[data-risky] .ui-skd__perm-mark { border-radius: 0; background: var(--tc-status-warning-solid); clip-path: polygon(50% 0, 100% 100%, 0 100%); }

/* Files: the list beside the viewer */
.ui-skd__files { display: grid; grid-template-columns: var(--tc-skd-files-w) minmax(0, 1fr); gap: var(--tc-space-3); align-items: start; }
.ui-skd__file-list { display: grid; gap: var(--tc-space-0-5); }
.ui-skd__folder > ul { display: grid; gap: var(--tc-space-0-5); padding-left: var(--tc-space-4); }
.ui-skd__folder-name { display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-skd__file { display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); cursor: pointer; }
.ui-skd__file:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-skd__file[aria-selected="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-skd__file:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-skd__file-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-skd__viewer { min-width: 0; overflow: hidden; border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-skd__viewer > .ui-skd__none { padding: var(--tc-space-3); }

/* Runs */
.ui-skd__runs { display: grid; }
.ui-skd__run { display: grid; grid-template-columns: auto auto minmax(0, 1fr) auto; align-items: baseline; gap: var(--tc-space-2); padding: var(--tc-space-1-5) 0; }
.ui-skd__run + .ui-skd__run { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-skd__run-mark { width: var(--tc-skd-mark); height: var(--tc-skd-mark); border-radius: 50%; background: var(--tc-status-success-solid); }
.ui-skd__run[data-outcome="failed"] .ui-skd__run-mark { border-radius: 0; background: var(--tc-status-danger-solid); }
.ui-skd__run[data-outcome="cancelled"] .ui-skd__run-mark { background: var(--tc-icon-muted); clip-path: polygon(0 35%, 100% 35%, 100% 65%, 0 65%); border-radius: 0; }
.ui-skd__run-outcome { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-skd__run[data-outcome="failed"] .ui-skd__run-outcome { color: var(--tc-status-danger-fg); }
.ui-skd__run-agent { min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-skd__run-note { grid-column: 3; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-skd__run-at { grid-column: 4; grid-row: 1; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); white-space: nowrap; font-variant-numeric: tabular-nums; }

/* Confirmations */
.ui-skd__confirm { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--tc-space-3); margin: var(--tc-space-3) var(--tc-space-4) 0; padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-status-warning-bg); color: var(--tc-text-primary); }
.ui-skd__confirm[data-kind="remove"] { margin-bottom: 0; background: var(--tc-status-danger-bg); }
.ui-skd__confirm-icon { display: grid; place-items: center; color: var(--tc-status-warning-fg); }
.ui-skd__confirm[data-kind="remove"] .ui-skd__confirm-icon { color: var(--tc-status-danger-fg); }
.ui-skd__confirm-body { display: grid; gap: var(--tc-space-2); min-width: 0; }
.ui-skd__confirm-title { font-weight: var(--tc-font-weight-medium); }
.ui-skd__risks { display: grid; gap: var(--tc-space-0-5); margin-top: var(--tc-space-1) !important; padding-left: var(--tc-space-4) !important; list-style: disc !important; }
.ui-skd__confirm-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); }
.ui-skd__confirm-ok[data-tone="primary"] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-skd__confirm-ok[data-tone="danger"] { background: var(--tc-action-danger-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-danger-fg); }

/* Actions */
.ui-skd__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-skd__spacer { flex: 1; }
.ui-skd__remove { color: var(--tc-status-danger-fg); }

/* Narrow: the file list goes above the viewer */
@container (max-width: 520px) {
  .ui-skd__files { grid-template-columns: minmax(0, 1fr); }
  .ui-skd__section, .ui-skd__facts, .ui-skd__actions { padding-inline: var(--tc-space-3); }
  .ui-skd__confirm { margin-inline: var(--tc-space-3); }
}
@media (forced-colors: active) {
  .ui-skd__switch { border: 1px solid ButtonText; }
  .ui-skd__switch[aria-checked="true"] { background: Highlight; }
  .ui-skd__switch span, .ui-skd__perm-mark, .ui-skd__run-mark { background: CanvasText; }
  .ui-skd__file[aria-selected="true"] { outline: 1px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="skd"] *, [data-ui="skd"] *::before, [data-ui="skd"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-skill-detail")) customElements.define("tc-skill-detail", TcSkillDetail);

declare global {
  interface HTMLElementTagNameMap {
    "tc-skill-detail": TcSkillDetail;
  }
}
