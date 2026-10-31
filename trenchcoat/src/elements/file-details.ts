import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { formatDate } from "./internal/util";
import { safeUrl } from "./internal/safe-url";
import "./file-summary";
import { defaultShareLevels } from "./share-panel";
import "./team-flag-picker";
import "./version-history";
import type { FileSummaryEntity, FileSummaryFile, FileSummaryPoint, FileSummaryStatus } from "./file-summary";
import type { ShareEntitlementCheck, ShareGrant, ShareLevel, ShareRecipient, ShareSearch, ShareSubmit } from "./share-panel";
import type { TeamFlag, TeamFlagValueChange } from "./team-flag-picker";
import type { VersionEntry } from "./version-history";

/*
 * <tc-file-details> – one file in one place: what it is, the team's flag on it, what's in it, its versions, and who it's
 * shared with after their entitlements are checked. The block composes tc-team-flag-picker, tc-file-summary,
 * tc-version-history and tc-share-panel, whose own events bubble from here. Sharing sits beside the rest on a wide page
 * and below it on a narrow one. A section with nothing to show (no summary, no versions) is left out.
 *
 *   <tc-file-details .file=${{ name: "Q3 audit.pdf", size: 2400000 }} .flags=${flags} flag="review"
 *     .access=${access} .directory=${people} .checkEntitlement=${check}></tc-file-details>
 */

export type FileDetailsFile = FileSummaryFile & {
  /** Who owns it */
  owner?: string;
  /** When it last changed, epoch ms */
  modified?: number;
  /** A preview image */
  preview?: string;
};
/** `flag` is the new id, `value` the flag itself */
export type FileDetailsFlagChange = { flag: string | null; value: TeamFlag | null };

const FILE_ICON = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"></path>`;

function formatSize(bytes: number, locale?: string) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)));
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: i ? 1 : 0 }).format(bytes / 1024 ** i)} ${units[i]}`;
}

/**
 * One file in one place: its details, the team's flag, a summary, its versions and who it's shared with.
 * @tag tc-file-details
 * @fires tc-flag-change - The file's flag was picked or cleared ({ flag, value }: FileDetailsFlagChange); cancelable – prevented, `flag` stays as it was
 * @fires tc-open - Open was pressed, when there's no `href` (detail: null)
 */
export class TcFileDetails extends TcElement {
  static override ui = "fld";

  /** The file */
  @property({ attribute: false }) accessor file: FileDetailsFile = { name: "Untitled" };
  /** Where the file opens; without it, Open only fires tc-open */
  @property() accessor href: string | undefined = undefined;
  /** The team's flags */
  @property({ attribute: false }) accessor flags: TeamFlag[] = [];
  /** The id of the file's flag, or null for none. Changed by the user unless a tc-flag-change listener calls preventDefault() */
  @property() accessor flag: string | null = null;
  /** Offer a link to the team's flags in the picker, for people who may edit them */
  @property({ type: Boolean, attribute: "manage-flags" }) accessor manageFlags = false;
  /** Where the summary is: "idle", "summarising", "done" or "error". Without a summary and when "idle", the section is left out */
  @property({ attribute: "summary-status" }) accessor summaryStatus: FileSummaryStatus = "idle";
  /** The summary; may grow while "summarising" */
  @property() accessor summary = "";
  /** The summary's key points */
  @property({ attribute: false }) accessor points: FileSummaryPoint[] = [];
  /** The people, organisations, dates and amounts in the file */
  @property({ attribute: false }) accessor entities: FileSummaryEntity[] = [];
  /** The file's versions, newest first */
  @property({ attribute: false }) accessor versions: VersionEntry[] = [];
  /** Who has access now. Updated on Share unless a tc-share listener calls preventDefault() */
  @property({ attribute: false }) accessor access: ShareGrant[] = [];
  /** The people and groups to share with */
  @property({ attribute: false }) accessor directory: ShareRecipient[] = [];
  /** Looks people and groups up on the server, instead of `directory` */
  @property({ attribute: false }) accessor search: ShareSearch | undefined = undefined;
  /** The levels of access, least first */
  @property({ attribute: false }) accessor levels: ShareLevel[] | undefined = undefined;
  /** Asks whether a recipient may see this file at a level. Without it nobody can be added */
  @property({ attribute: false }) accessor checkEntitlement: ShareEntitlementCheck | undefined = undefined;
  /** The locale for sizes and dates */
  @property() accessor locale: string | undefined = undefined;

  private onFlag(e: CustomEvent<TeamFlagValueChange>) {
    // The inner control's event stops here: the page hears tc-flag-change
    e.stopPropagation();
    if (!this.emit("tc-flag-change", { flag: e.detail.value, value: e.detail.flag }, { cancelable: true })) {
      e.preventDefault();
      return;
    }
    this.flag = e.detail.value;
  }

  /** The page hears tc-share first, on the way up; once it's had its say, follow what it decided */
  private onShare(e: CustomEvent<ShareSubmit>) {
    queueMicrotask(() => {
      if (!e.defaultPrevented) this.access = e.detail.access;
    });
  }

  private onOpen(e: Event) {
    if (!this.href) {
      e.preventDefault();
      this.emit("tc-open", null);
    }
  }

  private meta() {
    const { size, owner, modified } = this.file;
    return [size !== undefined ? formatSize(size, this.locale) : "", owner ?? "", modified !== undefined ? formatDate(modified, this.locale) : ""].filter(Boolean);
  }

  protected override render() {
    const { file } = this;
    const preview = file.preview ? safeUrl(file.preview) : undefined;
    const href = this.href ? safeUrl(this.href) : undefined;
    const showSummary = this.summaryStatus !== "idle" || !!this.summary;
    return html`<div class="ui-fld__grid"><div class="ui-fld__main">
        <header class="ui-fld__head">
          <div class="ui-fld__preview">${preview ? html`<img class="ui-fld__image" src=${preview} alt="" />` : html`<svg class="ui-fld__icon" viewBox="0 0 24 24" aria-hidden="true">${FILE_ICON}</svg>`}</div>
          <div class="ui-fld__about">
            <h2 class="ui-fld__name">${file.name}</h2>
            <p class="ui-fld__meta">${this.meta().join(" · ")}</p>
            <div class="ui-fld__actions">
              <tc-team-flag-picker .flags=${this.flags} .value=${this.flag} file-name=${file.name} ?manageable=${this.manageFlags} @tc-value-change=${this.onFlag}></tc-team-flag-picker>
              <a class="tc-btn-sm ui-fld__open" href=${href ?? "#"} @click=${this.onOpen}>Open<span class="tc-sr-only"> ${file.name}</span></a>
            </div>
          </div>
        </header>
        ${showSummary ? html`<tc-file-summary .file=${file} .status=${this.summaryStatus} .summary=${this.summary} .points=${this.points} .entities=${this.entities} .locale=${this.locale}></tc-file-summary>` : nothing}
        ${this.versions.length ? html`<tc-version-history .versions=${this.versions} description="What changed in each version of this file"></tc-version-history>` : nothing}
      </div>
      <div class="ui-fld__side">
        <tc-share-panel
          resource-name=${file.name}
          .access=${this.access}
          .directory=${this.directory}
          .search=${this.search}
          .levels=${this.levels ?? defaultShareLevels}
          .checkEntitlement=${this.checkEntitlement}
          @tc-share=${this.onShare}
        ></tc-share-panel>
      </div></div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fld"],
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fld"] {
  display: block;
  box-sizing: border-box;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The preview's width – override it on the element */
[data-ui="fld"] { --tc-fld-preview: 88px; }
[data-ui="fld"] *, [data-ui="fld"] *::before, [data-ui="fld"] *::after { box-sizing: border-box; }
.ui-fld__grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: var(--tc-space-4); align-items: start; }
.ui-fld__main, .ui-fld__side { display: grid; gap: var(--tc-space-4); min-width: 0; }
.ui-fld__head { display: flex; gap: var(--tc-space-4); padding: var(--tc-space-4); border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-fld__preview { display: flex; flex: none; align-items: center; justify-content: center; width: var(--tc-fld-preview); aspect-ratio: 4 / 5; overflow: hidden; border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); color: var(--tc-text-secondary); }
.ui-fld__image { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-fld__icon { width: var(--tc-space-6); height: var(--tc-space-6); fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-fld__about { display: grid; flex: 1; align-content: start; gap: var(--tc-space-1); min-width: 0; }
.ui-fld__name { margin: 0; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); overflow-wrap: anywhere; }
.ui-fld__meta { margin: 0; color: var(--tc-text-secondary); }
.ui-fld__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); margin-top: var(--tc-space-2); }
.ui-fld__open { text-decoration: none; }
@container (max-width: 720px) {
  .ui-fld__grid { grid-template-columns: minmax(0, 1fr); }
}
`;
}

if (!customElements.get("tc-file-details")) customElements.define("tc-file-details", TcFileDetails);

declare global {
  interface HTMLElementTagNameMap {
    "tc-file-details": TcFileDetails;
  }
}
