import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./code-block";
import "./color-picker";
import type { ColorPickerValueChange } from "./color-picker";
import "./embed-widget";
import { EMBED_LIGHT_TEXT, embedAccentText, embedContrast, parseEmbedHex, type EmbedMessage, type EmbedPosition, type EmbedSend, type EmbedStarter, type EmbedTheme } from "./embed-widget";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";
import "./tag-input";
import type { TagInputValueChange } from "./tag-input";

/*
 * <tc-embed-configurator> – style the site widget beside a live preview. On the left, the settings: the title, the
 * greeting, up to four starter prompts (added, removed and moved up or down), the accent colour with what its
 * contrast means in words, the corner (left or right), the corner radius, the launcher's words, and the domains the
 * widget may load on (checked as host names). On the right, a tc-embed-widget, open, showing every change as it's
 * made – try a message there and it answers that it's a preview. Under both, the install snippet: a script tag whose
 * data attributes carry the settings, in a code block with Copy.
 *
 *   <tc-embed-configurator .value=${config} .widgetId=${"inst-help"} .scriptSrc=${"https://cdn.example.org/assist/embed.js"}></tc-embed-configurator>
 *
 * Every change fires a cancelable tc-value-change ({ value, field }) – call preventDefault() to control `value`.
 * The settings are a plain form: native fields, a segmented control for the side, a range for the radius, and a tag
 * field for the domains; the colour picker opens under its swatch. Narrow, the preview goes under the settings.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 */

/** Everything the widget's snippet carries */
export type EmbedConfig = {
  /** The agent's name in the widget's header */
  title: string;
  /** The first message */
  greeting: string;
  /** Starter prompts, in order – four at most */
  starters: string[];
  /** The accent, a hex colour */
  accent: string;
  position: EmbedPosition;
  /** Corner radius in px, 0–24 */
  radius: number;
  /** The launcher's words */
  launcherLabel: string;
  /** Host names the widget may load on, e.g. "help.example.org" */
  domains: string[];
};
export type EmbedConfigField = keyof EmbedConfig;
/** tc-value-change: the whole next value, and which setting changed */
export type EmbedConfigChange = { value: EmbedConfig; field: EmbedConfigField };

export const defaultEmbedConfig: EmbedConfig = {
  title: "Assistant",
  greeting: "Hi! How can I help?",
  starters: [],
  accent: "#2563eb",
  position: "right",
  radius: 16,
  launcherLabel: "Chat with us",
  domains: [],
};

export const MAX_EMBED_STARTERS = 4;

/** Why a domain can't be used, or nothing when it can: a host name such as help.example.org, *.example.org or localhost */
export function checkEmbedDomain(text: string): string | undefined {
  const t = text.trim().toLowerCase();
  if (/^[a-z]+:\/\//.test(t) || t.includes("/")) return "Enter the domain only, without https:// or a path.";
  if (t === "localhost") return undefined;
  if (/^(?=.{1,253}$)(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(t)) return undefined;
  return "Enter a domain such as help.example.org.";
}

const attr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The install snippet for a configuration */
export function embedSnippet(value: EmbedConfig, { scriptSrc, widgetId }: { scriptSrc: string; widgetId: string }) {
  const lines = [
    `<script async src="${attr(scriptSrc)}"`,
    `  data-widget="${attr(widgetId)}"`,
    `  data-title="${attr(value.title)}"`,
    `  data-greeting="${attr(value.greeting)}"`,
    `  data-accent="${attr(value.accent)}"`,
    `  data-position="${value.position}"`,
    `  data-radius="${value.radius}"`,
    `  data-launcher="${attr(value.launcherLabel)}"`,
  ];
  if (value.starters.length) lines.push(`  data-starters="${attr(JSON.stringify(value.starters))}"`);
  if (value.domains.length) lines.push(`  data-domains="${attr(value.domains.join(","))}"`);
  lines[lines.length - 1] += "></script>";
  return lines.join("\n");
}

/** The configurator's words, every one renameable through `labels` */
export type EmbedConfiguratorLabels = {
  settings: string;
  title: string;
  greeting: string;
  starters: string;
  /** "Prompt {n}" */
  starter: string;
  addStarter: string;
  /** "Up to {n} prompts" */
  startersLimit: string;
  moveUp: string;
  moveDown: string;
  remove: string;
  /** "Moved to {n} of {total}" */
  moved: string;
  accent: string;
  changeAccent: string;
  doneAccent: string;
  position: string;
  right: string;
  left: string;
  radius: string;
  launcher: string;
  domains: string;
  domainsHint: string;
  preview: string;
  previewHint: string;
  /** The preview's reply to a message */
  previewReply: string;
  snippet: string;
};

export const defaultEmbedConfiguratorLabels: EmbedConfiguratorLabels = {
  settings: "Settings",
  title: "Title",
  greeting: "Greeting",
  starters: "Starter prompts",
  starter: "Prompt {n}",
  addStarter: "Add a prompt",
  startersLimit: "Up to {n} prompts",
  moveUp: "Move up",
  moveDown: "Move down",
  remove: "Remove",
  moved: "Moved to {n} of {total}",
  accent: "Accent colour",
  changeAccent: "Change",
  doneAccent: "Done",
  position: "Corner",
  right: "Right",
  left: "Left",
  radius: "Corner radius",
  launcher: "Launcher label",
  domains: "Allowed domains",
  domainsHint: "The widget only loads on these sites. Leave empty while you try it.",
  preview: "Preview",
  previewHint: "How it looks on your site",
  previewReply: "This is a preview – on your site, the assistant answers here.",
  snippet: "Install snippet",
};

/** What the accent's contrast means, in words – for the text on it and the launcher on a white page */
export function describeEmbedAccent(accent: string) {
  const text = embedAccentText(accent);
  const page = embedContrast(accent, EMBED_LIGHT_TEXT);
  if (!text || page === null) return null;
  const r = (n: number) => `${(Math.floor(n * 10) / 10).toFixed(1)}:1`;
  return {
    textOk: text.ratio >= 4.5,
    pageOk: page >= 3,
    text: text.ratio >= 4.5 ? `${text.text === "dark" ? "Dark" : "White"} text on it: ${r(text.ratio)} – passes for text` : `Text on it: ${r(text.ratio)} at best – too low; pick a darker or lighter colour`,
    page: page >= 3 ? `On a white page: ${r(page)} – the launcher stands out` : `On a white page: ${r(page)} – the launcher is hard to see`,
  };
}

/* ---------- Icons (after Lucide, ISC, lucide.dev): panels-top-left, arrow-up, arrow-down, x, plus, circle-check, triangle-alert ---------- */

const HEAD_ICON = svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path>`;
const ICON_UP = svg`<path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path>`;
const ICON_DOWN = svg`<path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path>`;
const ICON_X = svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`;
const ICON_PLUS = svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`;
const ICON_OK = svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`;
const ICON_WARN = svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`;
const icon = (body: TemplateResult) => html`<svg class="ui-emc__icon" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

let instances = 0;

/**
 * Style a site's chat widget beside a live preview, and copy its install snippet.
 * @tag tc-embed-configurator
 * @fires tc-value-change - A setting changed ({ value, field }: EmbedConfigChange); cancelable – prevented, `value` stays as it was
 * @fires tc-copy - The snippet was copied ({ text }), from its code block
 */
export class TcEmbedConfigurator extends TcElement {
  static override ui = "emc";

  /** The heading */
  @property() accessor heading = "Site widget";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The settings */
  @property({ attribute: false }) accessor value: EmbedConfig = defaultEmbedConfig;
  /** The widget's script, for the snippet */
  @property({ attribute: "script-src" }) accessor scriptSrc = "https://cdn.example.org/assistant/embed.js";
  /** The widget's id, for the snippet */
  @property({ attribute: "widget-id" }) accessor widgetId = "my-widget";
  /** Colours offered under the colour picker */
  @property({ attribute: false }) accessor swatches: string[] = ["#2563eb", "#0f766e", "#7c3aed", "#c2410c", "#be123c", "#18181b"];
  /** The configurator's words, merged over defaultEmbedConfiguratorLabels */
  @property({ attribute: false }) accessor labels: Partial<EmbedConfiguratorLabels> = {};

  /** @internal The colour picker is open */
  @state() accessor picking = false;
  /** @internal What was said in the preview */
  @state() accessor previewMessages: EmbedMessage[] = [];
  /** @internal The last announcement */
  @state() accessor said = "";

  private readonly uid = `tc-emc${++instances}`;
  private nextMessage = 0;

  private get l(): EmbedConfiguratorLabels {
    return { ...defaultEmbedConfiguratorLabels, ...this.labels };
  }
  private get v(): EmbedConfig {
    return { ...defaultEmbedConfig, ...this.value };
  }

  /* ---------- Changes ---------- */

  private set<K extends EmbedConfigField>(field: K, next: EmbedConfig[K]) {
    const value = { ...this.v, [field]: next };
    if (!this.emit<EmbedConfigChange>("tc-value-change", { value, field }, { cancelable: true })) {
      this.requestUpdate();
      return false;
    }
    this.value = value;
    return true;
  }

  private setStarter(i: number, text: string) {
    const starters = [...this.v.starters];
    starters[i] = text;
    this.set("starters", starters);
  }

  private addStarter() {
    const starters = this.v.starters;
    if (starters.length >= MAX_EMBED_STARTERS) return;
    if (this.set("starters", [...starters, ""])) {
      const i = starters.length;
      void this.updateComplete.then(() => this.querySelector<HTMLInputElement>(`#${this.uid}-s${i}`)?.focus());
    }
  }

  private removeStarter(i: number) {
    const starters = this.v.starters.filter((_, j) => j !== i);
    if (!this.set("starters", starters)) return;
    void this.updateComplete.then(() => {
      const next = this.querySelector<HTMLInputElement>(`#${this.uid}-s${Math.min(i, starters.length - 1)}`);
      (next ?? this.querySelector<HTMLElement>(".ui-emc__add"))?.focus();
    });
  }

  private moveStarter(i: number, by: -1 | 1) {
    const starters = [...this.v.starters];
    const j = i + by;
    if (j < 0 || j >= starters.length) return;
    [starters[i], starters[j]] = [starters[j], starters[i]];
    if (!this.set("starters", starters)) return;
    this.said = this.l.moved.replace("{n}", String(j + 1)).replace("{total}", String(starters.length));
    // Keep focus on the same move button of the moved prompt; at an end, on the other one
    const which = (by === -1 && j === 0) || (by === 1 && j === starters.length - 1) ? (by === -1 ? "down" : "up") : by === -1 ? "up" : "down";
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-s${j}-${which}`)?.focus());
  }

  private onAccent(e: CustomEvent<ColorPickerValueChange>) {
    e.stopPropagation();
    if (!this.set("accent", e.detail.value)) e.preventDefault();
  }

  private onPosition(e: CustomEvent<SegmentValueChange>) {
    e.stopPropagation();
    if (!this.set("position", e.detail.value === "left" ? "left" : "right")) e.preventDefault();
  }

  private onDomains(e: CustomEvent<TagInputValueChange>) {
    e.stopPropagation();
    if (!this.set("domains", e.detail.value.map((d) => d.trim().toLowerCase()))) e.preventDefault();
  }

  /* ---------- The preview ---------- */

  private onPreviewSend(e: CustomEvent<EmbedSend>) {
    e.stopPropagation();
    const n = this.nextMessage++;
    this.previewMessages = [
      ...this.previewMessages,
      { id: `v${n}`, from: "visitor", text: e.detail.text },
      { id: `a${n}`, from: "assistant", text: this.l.previewReply },
    ];
  }

  /* ---------- Render ---------- */

  private field(id: string, label: string, control: TemplateResult, hint?: TemplateResult | string) {
    return html`<div class="ui-emc__row">
      <label class="ui-emc__label" for=${id}>${label}</label>
      <div class="ui-emc__control">${control}${hint ? html`<p class="ui-emc__hint" id=${`${id}-hint`}>${hint}</p>` : nothing}</div>
    </div>`;
  }

  private startersBlock() {
    const l = this.l;
    const starters = this.v.starters;
    const groupId = `${this.uid}-starters`;
    return html`<div class="ui-emc__row" role="group" aria-labelledby=${groupId}>
      <span class="ui-emc__label" id=${groupId}>${l.starters}</span>
      <div class="ui-emc__control">
        ${starters.length
          ? html`<ol class="ui-emc__starters">
              ${starters.map((text, i) => {
                const id = `${this.uid}-s${i}`;
                const name = l.starter.replace("{n}", String(i + 1));
                return html`<li class="ui-emc__starter">
                  <label class="ui-emc__sr" for=${id}>${name}</label>
                  <input class="ui-emc__input" id=${id} .value=${live(text)} @input=${(e: Event) => this.setStarter(i, (e.target as HTMLInputElement).value)} />
                  <button type="button" class="ui-emc__tool" id=${`${id}-up`} ?disabled=${i === 0} @click=${() => this.moveStarter(i, -1)}>${icon(ICON_UP)}<span class="ui-emc__sr">${l.moveUp}, ${name}</span></button>
                  <button type="button" class="ui-emc__tool" id=${`${id}-down`} ?disabled=${i === starters.length - 1} @click=${() => this.moveStarter(i, 1)}>${icon(ICON_DOWN)}<span class="ui-emc__sr">${l.moveDown}, ${name}</span></button>
                  <button type="button" class="ui-emc__tool" @click=${() => this.removeStarter(i)}>${icon(ICON_X)}<span class="ui-emc__sr">${l.remove}, ${name}</span></button>
                </li>`;
              })}
            </ol>`
          : nothing}
        ${starters.length < MAX_EMBED_STARTERS
          ? html`<button type="button" class="ui-emc__add" @click=${() => this.addStarter()}>${icon(ICON_PLUS)}${l.addStarter}</button>`
          : html`<p class="ui-emc__hint">${l.startersLimit.replace("{n}", String(MAX_EMBED_STARTERS))}</p>`}
      </div>
    </div>`;
  }

  private accentBlock() {
    const l = this.l;
    const v = this.v;
    const id = `${this.uid}-accent`;
    const said = describeEmbedAccent(v.accent);
    const valid = !!parseEmbedHex(v.accent);
    return html`<div class="ui-emc__row" role="group" aria-labelledby=${`${id}-label`}>
      <span class="ui-emc__label" id=${`${id}-label`}>${l.accent}</span>
      <div class="ui-emc__control">
        <div class="ui-emc__accent">
          <span class="ui-emc__swatch" aria-hidden="true" style=${valid ? `--tc-emc-swatch: ${v.accent}` : ""}></span>
          <span class="ui-emc__hex">${v.accent}</span>
          <button type="button" class="ui-emc__button" aria-expanded=${this.picking ? "true" : "false"} aria-controls=${`${id}-picker`} @click=${() => (this.picking = !this.picking)}>
            ${this.picking ? l.doneAccent : l.changeAccent}<span class="ui-emc__sr"> ${l.accent}</span>
          </button>
        </div>
        ${said
          ? html`<ul class="ui-emc__checks">
              <li data-ok=${said.textOk ? "true" : "false"}>${icon(said.textOk ? ICON_OK : ICON_WARN)}<span>${said.text}</span></li>
              <li data-ok=${said.pageOk ? "true" : "false"}>${icon(said.pageOk ? ICON_OK : ICON_WARN)}<span>${said.page}</span></li>
            </ul>`
          : nothing}
        <div id=${`${id}-picker`} class="ui-emc__picker" ?hidden=${!this.picking}>
          ${this.picking
            ? html`<tc-color-picker
                .value=${valid ? v.accent : "#000000"}
                .swatches=${this.swatches}
                .eyedropper=${false}
                heading=${l.accent}
                @tc-value-change=${this.onAccent}
                @tc-format-change=${(e: Event) => e.stopPropagation()}
                @tc-copy=${(e: Event) => e.stopPropagation()}
              ></tc-color-picker>`
            : nothing}
        </div>
      </div>
    </div>`;
  }

  protected override render() {
    const l = this.l;
    const v = this.v;
    const look = this.resolvedLook;
    const headId = `${this.uid}-h`;
    const posOptions: SegmentOption[] = [
      { value: "right", label: l.right },
      { value: "left", label: l.left },
    ];
    const theme: EmbedTheme = { accent: v.accent, radius: v.radius, position: v.position, greeting: v.greeting, title: v.title, launcherLabel: v.launcherLabel };
    const starters: EmbedStarter[] = v.starters.filter((s) => s.trim()).map((text, i) => ({ id: `s${i}`, text }));
    const domainsId = `${this.uid}-domains`;

    const settings = html`<section class="ui-emc__settings" aria-labelledby=${`${this.uid}-set`}>
      <h4 class="ui-emc__section" id=${`${this.uid}-set`}>${l.settings}</h4>
      ${this.field(`${this.uid}-title`, l.title, html`<input class="ui-emc__input" id=${`${this.uid}-title`} .value=${live(v.title)} @input=${(e: Event) => this.set("title", (e.target as HTMLInputElement).value)} />`)}
      ${this.field(
        `${this.uid}-greeting`,
        l.greeting,
        html`<textarea class="ui-emc__input ui-emc__area" id=${`${this.uid}-greeting`} rows="2" .value=${live(v.greeting)} @input=${(e: Event) => this.set("greeting", (e.target as HTMLTextAreaElement).value)}></textarea>`,
      )}
      ${this.startersBlock()} ${this.accentBlock()}
      <div class="ui-emc__row" role="group" aria-labelledby=${`${this.uid}-pos`}>
        <span class="ui-emc__label" id=${`${this.uid}-pos`}>${l.position}</span>
        <div class="ui-emc__control">
          <tc-segmented-control size="sm" .options=${posOptions} .value=${v.position} aria-labelledby=${`${this.uid}-pos`} @tc-value-change=${this.onPosition}></tc-segmented-control>
        </div>
      </div>
      ${this.field(
        `${this.uid}-radius`,
        l.radius,
        html`<div class="ui-emc__range">
          <input
            type="range"
            id=${`${this.uid}-radius`}
            min="0"
            max="24"
            step="1"
            .value=${live(String(v.radius))}
            aria-valuetext=${`${v.radius} px`}
            @input=${(e: Event) => this.set("radius", (e.target as HTMLInputElement).valueAsNumber)}
          /><output for=${`${this.uid}-radius`} aria-hidden="true">${v.radius} px</output>
        </div>`,
      )}
      ${this.field(
        `${this.uid}-launcher`,
        l.launcher,
        html`<input class="ui-emc__input" id=${`${this.uid}-launcher`} .value=${live(v.launcherLabel)} @input=${(e: Event) => this.set("launcherLabel", (e.target as HTMLInputElement).value)} />`,
      )}
      ${this.field(
        domainsId,
        l.domains,
        html`<tc-tag-input
          id=${domainsId}
          placeholder="help.example.org"
          .value=${v.domains}
          .validate=${(text: string) => checkEmbedDomain(text)}
          @tc-value-change=${this.onDomains}
          @tc-invalid-tag=${(e: Event) => e.stopPropagation()}
        ></tc-tag-input>`,
        l.domainsHint,
      )}
    </section>`;

    const preview = html`<section class="ui-emc__preview" aria-labelledby=${`${this.uid}-pre`}>
      <h4 class="ui-emc__section" id=${`${this.uid}-pre`}>${l.preview}<span class="ui-emc__note">${l.previewHint}</span></h4>
      <div class="ui-emc__stage">
        <tc-embed-widget
          open
          .theme=${theme}
          .starters=${starters}
          .messages=${this.previewMessages}
          privacy=""
          @tc-send=${this.onPreviewSend}
          @tc-open-change=${(e: Event) => e.stopPropagation()}
        ></tc-embed-widget>
      </div>
    </section>`;

    const snippet = html`<section class="ui-emc__snippet" aria-labelledby=${`${this.uid}-snip`}>
      <h4 class="ui-emc__section" id=${`${this.uid}-snip`}>${l.snippet}</h4>
      <tc-code-block bare language="html" filename="index.html" .code=${embedSnippet(v, { scriptSrc: this.scriptSrc, widgetId: this.widgetId })} .lineNumbers=${false} wrap></tc-code-block>
    </section>`;

    const head = cardHead({ icon: HEAD_ICON, title: this.heading, subtitle: this.description, id: headId });
    const body = html`<div class="ui-emc__grid">${settings}${preview}</div>
      ${snippet}
      <span class="ui-emc__sr" role="status">${this.said}</span>`;
    if (look === "clean") return html`<div class="ui-emc__card">${head}${body}</div>`;
    return html`${head}<div class="ui-emc__card">${body}</div>`;
  }

  static override css = /* css */ `
[data-ui="emc"] {
  --tc-emc-label-w: 132px;
  --tc-emc-swatch: var(--tc-accent);
  box-sizing: border-box;
  display: block;
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="emc"] *, [data-ui="emc"] *::before, [data-ui="emc"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="emc"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-ui="emc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="emc"] :is(button, input[type="range"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="emc"] :is(p, h4, ol, ul) { margin: 0; padding: 0; }
.ui-emc__icon { display: block; flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-emc__icon { stroke-width: 1.75; }
.ui-emc__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-emc__card { min-width: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-emc__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-emc__card { border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* Settings beside the preview */
.ui-emc__grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 400px); }
.ui-emc__settings { display: grid; align-content: start; gap: var(--tc-space-4); padding: var(--tc-space-5); }
.ui-emc__preview { display: grid; grid-template-rows: auto 1fr; gap: var(--tc-space-3); padding: var(--tc-space-5); border-inline-start: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-surface-sunken, var(--tc-fill-default)); }
:where([data-look="clean"], [data-look="clean"] *) .ui-emc__grid { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-emc__section { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-emc__note { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); letter-spacing: normal; text-transform: none; color: var(--tc-text-muted); }
.ui-emc__stage { display: flex; justify-content: center; align-items: flex-end; min-height: 0; }
.ui-emc__stage > tc-embed-widget { --tc-emw-w: 100%; --tc-emw-h: 440px; width: 100%; }
/* Labelled rows */
.ui-emc__row { display: grid; grid-template-columns: var(--tc-emc-label-w) minmax(0, 1fr); align-items: start; gap: var(--tc-space-3); }
.ui-emc__label { display: flex; align-items: center; min-height: var(--tc-field-h); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-emc__control { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-emc__hint { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-emc__input { width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-emc__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-emc__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-emc__area { height: auto; min-height: calc(2 * 1lh + 2 * var(--tc-space-2)); padding: var(--tc-space-2) var(--tc-field-px); resize: vertical; field-sizing: content; }
/* Starter prompts */
.ui-emc__starters { display: grid; gap: var(--tc-space-1-5); list-style: none; }
.ui-emc__starter { display: flex; align-items: center; gap: var(--tc-space-1); }
.ui-emc__tool { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-emc__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-emc__tool:disabled { color: var(--tc-text-disabled); cursor: default; }
.ui-emc__add, .ui-emc__button { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-emc__add:hover, .ui-emc__button:hover { background: var(--tc-action-ghost-bg-hover); }
/* Accent */
.ui-emc__accent { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-field-h); }
.ui-emc__swatch { flex: none; width: var(--tc-space-6); height: var(--tc-space-6); border-radius: var(--tc-radius-sm); background: var(--tc-emc-swatch); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-emc__hex { flex: 1; min-width: 0; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); }
.ui-emc__checks { display: grid; gap: var(--tc-space-1); list-style: none; font-size: var(--tc-font-size-sm); }
.ui-emc__checks > li { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); }
.ui-emc__checks > li > svg { margin-top: var(--tc-space-0-5); }
.ui-emc__checks > li[data-ok="true"] > svg { color: var(--tc-status-success-fg); }
.ui-emc__checks > li[data-ok="false"] { color: var(--tc-status-warning-fg); }
.ui-emc__picker[hidden] { display: none; }
/* Radius */
.ui-emc__range { display: flex; align-items: center; gap: var(--tc-space-3); min-height: var(--tc-field-h); }
.ui-emc__range > input { flex: 1; min-width: 0; margin: 0; accent-color: var(--tc-accent); }
.ui-emc__range > output { min-width: 5ch; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-secondary); text-align: end; }
/* The snippet */
.ui-emc__snippet { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4) var(--tc-space-5) var(--tc-space-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
@container (max-width: 760px) {
  .ui-emc__grid { grid-template-columns: minmax(0, 1fr); }
  .ui-emc__preview { border-inline-start: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
}
@container (max-width: 480px) {
  .ui-emc__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1-5); }
  .ui-emc__label { min-height: 0; }
  .ui-emc__settings, .ui-emc__preview { padding: var(--tc-space-4); }
  .ui-emc__snippet { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
}
@media (forced-colors: active) {
  .ui-emc__swatch { forced-color-adjust: none; border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="emc"] *, [data-ui="emc"] *::before, [data-ui="emc"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-embed-configurator")) customElements.define("tc-embed-configurator", TcEmbedConfigurator);

declare global {
  interface HTMLElementTagNameMap {
    "tc-embed-configurator": TcEmbedConfigurator;
  }
}
