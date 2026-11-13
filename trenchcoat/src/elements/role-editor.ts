import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { isMac } from "./internal/util";

/*
 * <tc-role-editor> – what each role in a workspace can do: permissions as rows, grouped (Agents, Data, Billing, Admin),
 * against roles as columns (Owner, Admin, Builder, Member, Viewer and any custom roles), each cell allowed or not.
 *   · the matrix is a WAI-ARIA grid with one tab stop: arrows move, Home / End go to the row's ends, ⌘/Ctrl+Home / End to
 *     the first and last cell, Space or Enter turns the permission on or off
 *   · a permission can need others (Deploy needs Edit, Edit needs View): turning it on turns those on, turning one off
 *     turns off what needs it, and a note says what else changed
 *   · a locked role (Owner) can't be changed; custom roles can be renamed and deleted, and New role adds one
 *   · each column says how many members have the role; a summary lists what changed since the last save, with Discard
 *     and Save
 * Standard: a white card on a gray tray, Discard and Save on the tray. Clean: one white card, the buttons in its last row.
 *
 *   <tc-role-editor .roles=${roles}></tc-role-editor>
 */

export type RolePermission = {
  id: string;
  /** The row's words, e.g. "Deploy agents" */
  label: string;
  /** One quiet line under it */
  description?: string;
  /** Permissions it needs – turned on with it, and it's turned off with them */
  requires?: string[];
};
export type RolePermissionGroup = { id: string; label: string; permissions: RolePermission[] };
export type Role = {
  id: string;
  name: string;
  /** How many members have it */
  members?: number;
  /** Can't be changed, renamed or deleted (Owner) */
  locked?: boolean;
  /** Made in this workspace: can be renamed and deleted */
  custom?: boolean;
  /** The permission ids it has */
  permissions: string[];
};
export type RoleEditCause =
  | { type: "permission"; role: string; permission: string; on: boolean; also: string[] }
  | { type: "add"; role: string }
  | { type: "rename"; role: string; name: string }
  | { type: "remove"; role: string }
  | { type: "discard" };
/** tc-roles-change: the next roles and what changed */
export type RolesChange = { roles: Role[]; change: RoleEditCause };
/** One line of the summary: what differs from what was saved */
export type RoleDiff = { role: string; name: string; kind: "added" | "removed" | "renamed" | "granted" | "revoked"; permission?: string; from?: string };
/** tc-roles-save: the roles to store and what changed */
export type RolesSave = { roles: Role[]; changes: RoleDiff[] };

/** The permissions used when the page gives none */
export const defaultRolePermissionGroups: RolePermissionGroup[] = [
  {
    id: "agents",
    label: "Agents",
    permissions: [
      { id: "agents.view", label: "View agents" },
      { id: "agents.edit", label: "Edit agents", description: "Instructions, tools and triggers", requires: ["agents.view"] },
      { id: "agents.deploy", label: "Deploy agents", description: "Put a draft live", requires: ["agents.edit"] },
    ],
  },
  {
    id: "data",
    label: "Data",
    permissions: [
      { id: "data.view", label: "View data", description: "Conversations, runs and sources" },
      { id: "data.export", label: "Export data", requires: ["data.view"] },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    permissions: [
      { id: "billing.view", label: "View billing" },
      { id: "billing.manage", label: "Manage billing", description: "Plan, payment and limits", requires: ["billing.view"] },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    permissions: [
      { id: "admin.members", label: "Manage members" },
      { id: "admin.roles", label: "Manage roles" },
      { id: "admin.audit", label: "View the audit log" },
    ],
  },
];

const clone = (roles: Role[]): Role[] => roles.map((r) => ({ ...r, permissions: [...r.permissions] }));
const listWords = (names: string[]) => (names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);
let uidCount = 0;

/* After Lucide (ISC, lucide.dev): shield – the header's icon; lock, pencil, trash-2, plus, check */
const headIcon = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="M9 12h6"></path><path d="M12 9v6"></path>`;
const icon = (body: ReturnType<typeof svg>, size = 14) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const lockIcon = () => icon(svg`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`, 12);
const pencilIcon = () => icon(svg`<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"></path>`, 12);
const trashIcon = () => icon(svg`<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>`, 12);
const plusIcon = () => icon(svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const checkIcon = () => icon(svg`<path d="M20 6 9 17l-5-5"></path>`, 12);

/**
 * What each role can do – a grid of permissions against roles, with dependent permissions kept in step, a locked
 * Owner, custom roles to add, rename and delete, member counts and a summary of unsaved changes.
 * @tag tc-role-editor
 * @fires tc-roles-change - A cell, New role, a rename, a delete or Discard changed the roles ({ roles, change }: RolesChange); cancelable – prevented, `roles` stays as it was
 * @fires tc-roles-save - Save was pressed ({ roles, changes }: RolesSave); cancelable – unless prevented, `saved` becomes the roles
 */
export class TcRoleEditor extends TcElement {
  static override ui = "rle";

  /** The heading, and the grid's name */
  @property() accessor heading = "Roles";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The rows: permissions, grouped */
  @property({ attribute: false }) accessor groups: RolePermissionGroup[] = defaultRolePermissionGroups;
  /** The columns. Changed by the user unless a tc-roles-change listener calls preventDefault() */
  @property({ attribute: false }) accessor roles: Role[] = [];
  /** What was last saved – the summary lists the differences. Unset: the roles the element first showed */
  @property({ attribute: false }) accessor saved: Role[] | undefined = undefined;
  /** The name a new role starts with */
  @property({ attribute: "new-role-name" }) accessor newRoleName = "New role";
  /** Changes listed before "N more" */
  @property({ type: Number, attribute: "changes-limit" }) accessor changesLimit = 5;

  /** @internal The cell that holds the tab stop */
  @state() accessor active = { r: 0, c: 0 };
  /** @internal The role being renamed */
  @state() accessor renaming: string | null = null;
  /** @internal The rename field's text */
  @state() accessor draftName = "";
  /** @internal What's wrong with the new name */
  @state() accessor nameError = "";
  /** @internal The role waiting for a delete confirmation */
  @state() accessor deleting: string | null = null;
  /** @internal What else a change turned on or off */
  @state() accessor note = "";
  /** @internal The summary shows every change */
  @state() accessor allChanges = false;
  /** @internal The polite announcement */
  @state() accessor announce = "";

  private uid = `tc-rle-${++uidCount}`;
  private firstRoles: Role[] | undefined = undefined;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]'));
  }

  /* ---------- The model ---------- */

  private get rows(): RolePermission[] {
    return this.groups.flatMap((g) => g.permissions);
  }
  private get baseline(): Role[] {
    return this.saved ?? this.firstRoles ?? [];
  }
  private label(id: string) {
    return this.rows.find((p) => p.id === id)?.label ?? id;
  }
  /** Everything `id` needs, all the way down */
  private needs(id: string, seen = new Set<string>()): string[] {
    for (const r of this.rows.find((p) => p.id === id)?.requires ?? []) {
      if (seen.has(r)) continue;
      seen.add(r);
      this.needs(r, seen);
    }
    return [...seen];
  }
  /** Everything that needs `id`, all the way up */
  private neededBy(id: string): string[] {
    return this.rows.filter((p) => p.id !== id && this.needs(p.id).includes(id)).map((p) => p.id);
  }

  /** Every difference from the baseline, roles in column order */
  changesOf(roles: Role[] = this.roles): RoleDiff[] {
    const base = this.baseline;
    const out: RoleDiff[] = [];
    for (const r of roles) {
      const was = base.find((b) => b.id === r.id);
      if (!was) {
        out.push({ role: r.id, name: r.name, kind: "added" });
        continue;
      }
      if (was.name !== r.name) out.push({ role: r.id, name: r.name, kind: "renamed", from: was.name });
      for (const p of this.rows) {
        const now = r.permissions.includes(p.id);
        if (now !== was.permissions.includes(p.id)) out.push({ role: r.id, name: r.name, kind: now ? "granted" : "revoked", permission: p.id });
      }
    }
    for (const b of base) if (!roles.some((r) => r.id === b.id)) out.push({ role: b.id, name: b.name, kind: "removed" });
    return out;
  }

  private commit(roles: Role[], change: RoleEditCause, say: string) {
    if (!this.emit<RolesChange>("tc-roles-change", { roles, change }, { cancelable: true })) return false;
    this.roles = roles;
    this.announce = say;
    return true;
  }

  private toggle(r: number, c: number) {
    const perm = this.rows[r];
    const role = this.roles[c];
    if (!perm || !role) return;
    if (role.locked) {
      this.announce = `${role.name} can't be changed`;
      return;
    }
    const on = !role.permissions.includes(perm.id);
    const has = new Set(role.permissions);
    const also = (on ? this.needs(perm.id) : this.neededBy(perm.id)).filter((id) => has.has(id) !== on);
    for (const id of [perm.id, ...also]) {
      if (on) has.add(id);
      else has.delete(id);
    }
    const next = this.roles.map((x) => (x.id === role.id ? { ...x, permissions: this.rows.map((p) => p.id).filter((id) => has.has(id)) } : x));
    const alsoWords = also.length ? listWords(also.map((id) => this.label(id))) : "";
    const note = also.length ? (on ? `${perm.label} needs ${alsoWords}, so ${also.length === 1 ? "it was" : "they were"} turned on too.` : `${alsoWords} ${also.length === 1 ? "needs" : "need"} ${perm.label}, so ${also.length === 1 ? "it was" : "they were"} turned off too.`) : "";
    if (this.commit(next, { type: "permission", role: role.id, permission: perm.id, on, also }, `${role.name}: ${perm.label} ${on ? "on" : "off"}${note ? `. ${note}` : ""}`)) this.note = note;
  }

  private addRole() {
    const names = new Set(this.roles.map((r) => r.name.toLowerCase()));
    let name = this.newRoleName;
    for (let i = 2; names.has(name.toLowerCase()); i++) name = `${this.newRoleName} ${i}`;
    let n = this.roles.length + 1;
    while (this.roles.some((r) => r.id === `custom-${n}`)) n++;
    const role: Role = { id: `custom-${n}`, name, members: 0, custom: true, permissions: [] };
    if (!this.commit([...this.roles, role], { type: "add", role: role.id }, `${name} added`)) return;
    this.startRename(role);
  }

  private startRename(role: Role) {
    this.renaming = role.id;
    this.draftName = role.name;
    this.nameError = "";
    void this.updateComplete.then(() => {
      const field = this.querySelector<HTMLInputElement>(".ui-rle__rename");
      field?.focus();
      field?.select();
    });
  }

  private finishRename(save: boolean) {
    const id = this.renaming;
    const role = this.roles.find((r) => r.id === id);
    if (!id || !role) return;
    const name = this.draftName.trim();
    if (save && name !== role.name) {
      if (!name) {
        this.nameError = "Give the role a name";
        return;
      }
      if (this.roles.some((r) => r.id !== id && r.name.toLowerCase() === name.toLowerCase())) {
        this.nameError = `There's already a role called ${name}`;
        return;
      }
      this.commit(
        this.roles.map((r) => (r.id === id ? { ...r, name } : r)),
        { type: "rename", role: id, name },
        `Renamed to ${name}`,
      );
    }
    this.renaming = null;
    this.nameError = "";
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-rename="${id}"]`)?.focus());
  }

  private askDelete(role: Role) {
    this.deleting = role.id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-rle__confirm-cancel")?.focus());
  }

  private confirmDelete(yes: boolean) {
    const id = this.deleting;
    const role = this.roles.find((r) => r.id === id);
    this.deleting = null;
    if (!role) return;
    if (yes && this.commit(this.roles.filter((r) => r.id !== id), { type: "remove", role: role.id }, `${role.name} deleted`)) {
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-rle__add")?.focus());
      return;
    }
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-delete="${role.id}"]`)?.focus());
  }

  private discard() {
    if (!this.changesOf().length) return;
    if (this.commit(clone(this.baseline), { type: "discard" }, "Changes discarded")) this.note = "";
  }

  private save() {
    const changes = this.changesOf();
    if (!changes.length) return;
    if (!this.emit<RolesSave>("tc-roles-save", { roles: this.roles, changes }, { cancelable: true })) return;
    this.saved = clone(this.roles);
    this.note = "";
    this.announce = `Saved ${changes.length} ${changes.length === 1 ? "change" : "changes"}`;
  }

  /* ---------- Keyboard: the grid ---------- */

  private focusCell(r: number, c: number) {
    const rows = this.rows.length;
    const cols = this.roles.length;
    if (!rows || !cols) return;
    this.active = { r: Math.max(0, Math.min(rows - 1, r)), c: Math.max(0, Math.min(cols - 1, c)) };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-cell="${this.active.r}:${this.active.c}"]`)?.focus());
  }

  private onGridKey = (e: KeyboardEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!cell || e.isComposing || e.altKey) return;
    const [r, c] = cell.dataset.cell!.split(":").map(Number);
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    const last = { r: this.rows.length - 1, c: this.roles.length - 1 };
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      Home: mod ? [0, 0] : [r, 0],
      End: mod ? [last.r, last.c] : [r, last.c],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.focusCell(move[0], move[1]);
    } else if (!mod && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      this.toggle(r, c);
    }
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.firstRoles === undefined && this.roles.length) this.firstRoles = clone(this.roles);
    const rows = this.rows.length;
    const cols = this.roles.length;
    const { r, c } = this.active;
    if ((r >= rows || c >= cols) && rows && cols) this.active = { r: Math.min(r, rows - 1), c: Math.min(c, cols - 1) };
    if (this.renaming && !this.roles.some((x) => x.id === this.renaming)) this.renaming = null;
    if (this.deleting && !this.roles.some((x) => x.id === this.deleting)) this.deleting = null;
  }

  /* ---------- Rendering ---------- */

  private renderRoleHead(role: Role) {
    const members = role.members ?? 0;
    const editing = this.renaming === role.id;
    return html`<th role="columnheader" class="ui-rle__role" scope="col" data-role=${role.id}>
      <span class="ui-rle__role-inner">
        ${editing
          ? html`<input
              class="ui-rle__rename"
              aria-label=${`Rename ${role.name}`}
              aria-invalid=${this.nameError ? "true" : "false"}
              aria-describedby=${`${this.uid}-name-error`}
              .value=${this.draftName}
              @input=${(e: Event) => {
                this.draftName = (e.target as HTMLInputElement).value;
                this.nameError = "";
              }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  this.finishRename(true);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  this.finishRename(false);
                }
              }}
              @blur=${() => this.renaming === role.id && !this.nameError && this.finishRename(true)}
            />`
          : html`<span class="ui-rle__role-name">${role.locked ? html`<span class="ui-rle__lock">${lockIcon()}<span class="ui-rle__sr">Locked: </span></span>` : nothing}${role.name}</span>`}
        <span class="ui-rle__members">${members} ${members === 1 ? "member" : "members"}</span>
        ${role.custom && !editing
          ? html`<span class="ui-rle__role-actions">
              <button type="button" class="ui-rle__icon-btn" data-rename=${role.id} title="Rename" @click=${() => this.startRename(role)}>${pencilIcon()}<span class="ui-rle__sr">Rename ${role.name}</span></button>
              <button type="button" class="ui-rle__icon-btn" data-delete=${role.id} title="Delete" @click=${() => this.askDelete(role)}>${trashIcon()}<span class="ui-rle__sr">Delete ${role.name}</span></button>
            </span>`
          : nothing}
      </span>
    </th>`;
  }

  private renderCell(perm: RolePermission, r: number, role: Role, c: number) {
    const on = role.permissions.includes(perm.id);
    const was = this.baseline.find((b) => b.id === role.id);
    const changed = !!was && was.permissions.includes(perm.id) !== on;
    const isActive = this.active.r === r && this.active.c === c;
    return html`<td
      role="gridcell"
      class="ui-rle__cell"
      data-cell=${`${r}:${c}`}
      ?data-on=${on}
      ?data-changed=${changed}
      ?data-locked=${!!role.locked}
      aria-readonly=${role.locked ? "true" : "false"}
      tabindex=${isActive ? 0 : -1}
      aria-describedby=${`${this.uid}-keys`}
      @focus=${() => {
        if (!isActive) this.active = { r, c };
      }}
      @click=${() => {
        this.active = { r, c };
        this.toggle(r, c);
      }}
    >
      <span class="ui-rle__box" aria-hidden="true">${on ? checkIcon() : nothing}</span>
      <span class="ui-rle__sr">${on ? "Allowed" : "Not allowed"}${changed ? ", changed" : ""}</span>
    </td>`;
  }

  private renderGrid() {
    const roles = this.roles;
    let r = -1;
    const total = this.rows.length + this.groups.length + 1;
    return html`<div class="ui-rle__scroll">
      <table class="ui-rle__grid" role="grid" aria-labelledby=${`${this.uid}-title`} aria-rowcount=${total} aria-colcount=${roles.length + 1} @keydown=${this.onGridKey}>
        <thead>
          <tr role="row" aria-rowindex="1">
            <th role="columnheader" class="ui-rle__corner" scope="col"><span class="ui-rle__corner-label">Permission</span></th>
            ${repeat(roles, (x) => x.id, (x) => this.renderRoleHead(x))}
          </tr>
        </thead>
        <tbody>
          ${this.groups.map((g) => {
            const groupIndex = r + 1 + this.groups.indexOf(g) + 2;
            return html`<tr role="row" class="ui-rle__group" aria-rowindex=${groupIndex}>
                <th role="rowheader" colspan=${roles.length + 1} aria-colspan=${roles.length + 1}>${g.label}</th>
              </tr>
              ${g.permissions.map((perm, i) => {
                r++;
                const ri = r;
                return html`<tr role="row" class="ui-rle__row" aria-rowindex=${groupIndex + i + 1}>
                  <th role="rowheader" class="ui-rle__perm" scope="row">
                    <span class="ui-rle__perm-label"><span class="ui-rle__sr">${g.label} · </span>${perm.label}</span>
                    ${perm.description ? html`<span class="ui-rle__perm-desc">${perm.description}</span>` : nothing}
                  </th>
                  ${roles.map((role, c) => this.renderCell(perm, ri, role, c))}
                </tr>`;
              })}`;
          })}
        </tbody>
      </table>
    </div>`;
  }

  private diffWords(d: RoleDiff) {
    switch (d.kind) {
      case "added":
        return html`<b>${d.name}</b> · new role`;
      case "removed":
        return html`<b>${d.name}</b> · deleted`;
      case "renamed":
        return html`<b>${d.name}</b> · renamed from ${d.from}`;
      default:
        return html`<b>${d.name}</b> · ${this.label(d.permission!)}`;
    }
  }

  private renderSummary(changes: RoleDiff[]) {
    const shown = this.allChanges ? changes : changes.slice(0, this.changesLimit);
    const hidden = changes.length - shown.length;
    return html`<section class="ui-rle__summary" aria-labelledby=${`${this.uid}-changes`}>
      <h4 class="ui-rle__label" id=${`${this.uid}-changes`}>${changes.length ? "Unsaved changes" : "No unsaved changes"}${changes.length ? html`<span class="ui-rle__count">${changes.length}</span>` : nothing}</h4>
      ${changes.length
        ? html`<ul class="ui-rle__changes">
              ${shown.map(
                (d) => html`<li class="ui-rle__change" data-kind=${d.kind}>
                  <span class="ui-rle__change-what">${this.diffWords(d)}</span>
                  ${d.kind === "granted" || d.kind === "revoked" ? html`<span class="ui-rle__pill" data-kind=${d.kind}>${d.kind === "granted" ? "Allowed" : "Removed"}</span>` : nothing}
                </li>`,
              )}
            </ul>
            ${hidden > 0 || this.allChanges
              ? changes.length > this.changesLimit
                ? html`<button type="button" class="ui-rle__more" aria-expanded=${this.allChanges ? "true" : "false"} @click=${() => (this.allChanges = !this.allChanges)}>${this.allChanges ? "Show less" : `${hidden} more`}</button>`
                : nothing
              : nothing}`
        : nothing}
    </section>`;
  }

  private renderConfirm() {
    const role = this.roles.find((r) => r.id === this.deleting);
    if (!role) return nothing;
    const n = role.members ?? 0;
    return html`<div class="ui-rle__confirm" role="group" aria-labelledby=${`${this.uid}-confirm`} @keydown=${(e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.confirmDelete(false);
      }
    }}>
      <p class="ui-rle__confirm-text" id=${`${this.uid}-confirm`}>
        Delete ${role.name}?
        ${n ? `${n} ${n === 1 ? "member has" : "members have"} this role and will lose its permissions.` : "Nobody has this role yet."}
      </p>
      <span class="ui-rle__confirm-actions">
        <button type="button" class="ui-rle__btn ui-rle__confirm-cancel" @click=${() => this.confirmDelete(false)}>Cancel</button>
        <button type="button" class="ui-rle__btn ui-rle__btn--danger" @click=${() => this.confirmDelete(true)}>Delete role</button>
      </span>
    </div>`;
  }

  protected override render() {
    const changes = this.changesOf();
    const dirty = changes.length > 0;
    const empty = !this.roles.length || !this.rows.length;
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      icon: headIcon,
      title: this.heading,
      subtitle: this.description || undefined,
      id: `${this.uid}-title`,
      aside: html`<button type="button" class="ui-rle__add" @click=${() => this.addRole()}>${plusIcon()}New role</button>`,
    });
    return html`
      <span class="ui-rle__sr" role="status">${this.announce}</span>
      <span class="ui-rle__sr" id=${`${this.uid}-keys`}>Space turns it on or off</span>
      ${clean ? nothing : head}
      <div class="ui-rle__card">
        ${clean ? head : nothing}
        ${empty ? html`<p class="ui-rle__empty">No roles yet.</p>` : this.renderGrid()}
        <p class="ui-rle__error" id=${`${this.uid}-name-error`} ?hidden=${!this.nameError}>${this.nameError}</p>
        ${this.note ? html`<p class="ui-rle__note">${this.note}</p>` : nothing}
        ${this.renderConfirm()}
        ${empty ? nothing : this.renderSummary(changes)}
      </div>
      ${empty
        ? nothing
        : html`<div class="ui-rle__answer">
            <button type="button" class="ui-rle__btn" aria-disabled=${dirty ? "false" : "true"} @click=${() => this.discard()}>Discard</button>
            <button type="button" class="ui-rle__btn ui-rle__btn--primary" aria-disabled=${dirty ? "false" : "true"} @click=${() => this.save()}>Save${dirty ? html`<span class="ui-rle__btn-count">${changes.length}</span>` : nothing}</button>
          </div>`}
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rle"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rle"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rle"] *, [data-ui="rle"] *::before, [data-ui="rle"] *::after { box-sizing: border-box; }
:where([data-ui="rle"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="rle"] button:focus-visible, [data-ui="rle"] input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rle"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="rle"] h4, [data-ui="rle"] p, [data-ui="rle"] section { margin: 0; }
[data-ui="rle"] svg { display: block; flex: none; }
[data-ui="rle"] [hidden] { display: none !important; }
.ui-rle__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rle__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* New role, at the header's right */
.ui-rle__add { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; }
.ui-rle__add:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
/* ----- The matrix ----- */
.ui-rle__scroll { margin-top: var(--tc-space-2); overflow-x: auto; border-top: var(--tc-hairline) solid var(--tc-divider); scrollbar-width: thin; }
.ui-rle__grid { width: 100%; border-collapse: collapse; border-spacing: 0; }
.ui-rle__grid th, .ui-rle__grid td { padding: 0; font-weight: inherit; text-align: left; vertical-align: middle; }
.ui-rle__grid th:first-child { position: sticky; left: 0; z-index: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-rle__grid th:first-child { background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-rle__grid th:first-child { background: var(--tc-surface-raised); }
.ui-rle__corner { min-width: 156px; padding: var(--tc-space-2) var(--tc-space-4) !important; vertical-align: bottom !important; }
.ui-rle__corner-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-rle__role { min-width: 92px; padding: var(--tc-space-3) var(--tc-space-1) var(--tc-space-2) !important; vertical-align: bottom !important; }
.ui-rle__role-inner { display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-0-5); text-align: center; }
.ui-rle__role-name { display: inline-flex; align-items: center; gap: var(--tc-space-1); max-width: 120px; overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-primary); }
.ui-rle__lock { display: inline-flex; color: var(--tc-icon-muted); }
.ui-rle__members { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rle__role-actions { display: inline-flex; gap: var(--tc-space-0-5); }
.ui-rle__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-rle__icon-btn:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-rle__rename { width: 112px; height: var(--tc-field-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); text-align: center; }
.ui-rle__rename:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-rle__rename[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
/* A group: its name across the row */
.ui-rle__group > th { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1) !important; border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight) !important; line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-rle__perm { padding: var(--tc-space-1-5) var(--tc-space-3) var(--tc-space-1-5) var(--tc-space-4) !important; }
.ui-rle__perm-label { display: block; line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-rle__perm-desc { display: block; margin-top: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* A cell: a check box, filled when allowed */
.ui-rle__cell { position: relative; padding: var(--tc-space-1-5) var(--tc-space-1) !important; text-align: center !important; cursor: pointer; outline: none; }
.ui-rle__cell[data-locked] { cursor: not-allowed; }
.ui-rle__box { position: relative; display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs); box-shadow: inset 0 0 0 1.5px var(--tc-border-control); color: var(--tc-text-on-accent); vertical-align: middle; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rle__cell[data-on] .ui-rle__box { background: var(--tc-accent); box-shadow: none; }
.ui-rle__cell[data-locked] .ui-rle__box { background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-secondary); }
.ui-rle__cell[data-locked]:not([data-on]) .ui-rle__box { background: var(--tc-fill-subtle); }
.ui-rle__cell:hover:not([data-locked]) .ui-rle__box { box-shadow: inset 0 0 0 1.5px var(--tc-border-control-hover); }
.ui-rle__cell[data-on]:hover:not([data-locked]) .ui-rle__box { box-shadow: none; background: var(--tc-accent-hover); }
.ui-rle__cell:focus-visible .ui-rle__box { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rle__cell[data-changed] .ui-rle__box::after { content: ""; position: absolute; top: -3px; right: -3px; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-status-warning-solid); box-shadow: 0 0 0 1.5px var(--tc-surface-raised); }
.ui-rle__row:hover > th, .ui-rle__row:hover > td { background-color: var(--tc-fill-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-rle__row:hover > th:first-child { background: linear-gradient(var(--tc-fill-subtle), var(--tc-fill-subtle)), var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-rle__row:hover > th:first-child { background: linear-gradient(var(--tc-fill-subtle), var(--tc-fill-subtle)), var(--tc-surface-raised); }
.ui-rle__empty { padding: var(--tc-space-6) var(--tc-space-4); text-align: center; color: var(--tc-text-muted); }
.ui-rle__error { padding: var(--tc-space-2) var(--tc-space-4) 0; font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
.ui-rle__note { margin: var(--tc-space-2) var(--tc-space-4) 0 !important; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-info-bg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-info-fg); }
/* Delete: the confirmation strip */
.ui-rle__confirm { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); margin: var(--tc-space-2) var(--tc-space-4) 0; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-danger-bg); }
.ui-rle__confirm-text { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-danger-fg); }
.ui-rle__confirm-actions { display: inline-flex; gap: var(--tc-space-2); }
/* ----- What changed ----- */
.ui-rle__summary { margin-top: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rle__label { display: flex; align-items: center; gap: var(--tc-space-1-5); margin: 0 var(--tc-space-1-5) var(--tc-space-1) !important; color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-rle__count { display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rle__change { display: flex; align-items: center; gap: var(--tc-space-3); min-height: 28px; padding: 0 var(--tc-space-1-5); }
.ui-rle__change-what { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
.ui-rle__change-what b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rle__pill { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
.ui-rle__pill[data-kind="granted"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rle__pill[data-kind="revoked"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rle__more { margin: 0 var(--tc-space-1-5) !important; padding: var(--tc-space-0-5) 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-rle__more:hover { color: var(--tc-text-primary); }
/* ----- Discard and Save ----- */
.ui-rle__answer { display: flex; justify-content: flex-end; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-rle__answer { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-rle__answer { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rle__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-2); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; }
.ui-rle__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-rle__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-rle__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
/* Delete role: the secondary button in the danger colour, readable on the danger strip */
.ui-rle__btn--danger { color: var(--tc-status-danger-fg); }
.ui-rle__btn[aria-disabled="true"] { opacity: 0.45; cursor: default; }
.ui-rle__btn-count { display: grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-on-inverse-bg); font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; }
@container (max-width: 480px) {
  .ui-rle__corner { min-width: 128px; }
  .ui-rle__perm-desc { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rle"] *, [data-ui="rle"] *::before, [data-ui="rle"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) { .ui-rle__box { border: 1px solid CanvasText; } .ui-rle__cell[data-on] .ui-rle__box { background: Highlight; } }
`;
}

if (!customElements.get("tc-role-editor")) customElements.define("tc-role-editor", TcRoleEditor);

declare global {
  interface HTMLElementTagNameMap {
    "tc-role-editor": TcRoleEditor;
  }
}
