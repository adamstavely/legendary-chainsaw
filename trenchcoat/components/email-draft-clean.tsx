"use client";

/*
 * Email Draft – an agent-written email waiting for review, in a single self-contained file.
 * The record it's about sits on the gray tray (reference, status, amount); the white card holds the email:
 * recipient you can switch, an attachment you can remove, tone variants, inline editing, Discard and Send.
 * Sending or discarding folds the card into a one-line receipt – with Undo when it can be honoured; heights glide throughout.
 * `contacts`, `tones` and `attachment` stay the source of truth: the recipient and tone are picked by email and id, so
 * when the lists change the draft follows them (falling back to the first one). `recipient` and `tone` are controlled
 * when defined, otherwise uncontrolled from `defaultRecipient` / `defaultTone`; changes are always reported.
 * Other DOM props and `ref` go to the root.
 * The styles are injected below, so no extra files are needed.
 * Two looks, picked with the `look` prop (the default comes from the file: email-draft.tsx is Standard,
 * email-draft-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows: the record heads the
 * card, then the email, and the last row holds who wrote it, its state, Discard and Send (the "⌘ Enter" hint moves
 * next to the tones). Only the content above that row glides to its new height.
 */
// Generated from src/components/email-draft.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type Dispatch, type ReactNode, type Ref, type RefObject, type SetStateAction } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-ed";

export type DraftContact = { name: string; email: string };

export type DraftTone = { id: string; label: string; body: (contact: DraftContact) => string };

type EmailDraftOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in email-draft.tsx, Clean in email-draft-clean.tsx */
  look?: Look;
  /** Reference of the record, e.g. a subscription or invoice number */
  reference?: string;
  /** Account or company under the reference */
  account?: string;
  /** Amount shown on the right */
  amount?: string;
  /** Status chip next to the reference */
  status?: string;
  /** Who wrote the draft */
  agent?: string;
  contacts?: DraftContact[];
  /** The email of the contact it goes to – controlled when defined; one not in `contacts` falls back to the first */
  recipient?: string;
  /** The email of the contact picked at first – defaults to the first contact */
  defaultRecipient?: string;
  onRecipientChange?: (email: string, contact: DraftContact) => void;
  /** The file attached – removing it is remembered for that file only, so a new attachment shows again */
  attachment?: string | null;
  /** Text variants to switch between – the first one is shown first */
  tones?: DraftTone[];
  /** The id of the tone shown – controlled when defined; one not in `tones` falls back to the first */
  tone?: string;
  defaultTone?: string;
  onToneChange?: (id: string) => void;
  /** Label and target of the link appended to the email */
  link?: { label: string; href: string };
  /**
   * Sends the email. Return a promise to keep the card in its sending state until it settles – a rejection
   * brings the draft back with an error. Without it sending is simulated (and warns once, unless `demo` is set)
   */
  onSend?: (email: { to: DraftContact; body: string; attachment: string | null }) => void | Promise<unknown>;
  onDiscard?: () => void;
  /**
   * Takes back a send or a discard that already reached you through onSend / onDiscard. Without it the receipt
   * offers no Undo for those – only for what never left the component
   */
  onUndo?: (action: "send" | "discard") => void;
  /** Demo mode: sending without onSend is simulated silently. For galleries and prototypes */
  demo?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type EmailDraftProps = Omit<ComponentPropsWithoutRef<"div">, keyof EmailDraftOwnProps> & EmailDraftOwnProps;

const defaultContacts: DraftContact[] = [
  { name: "Jonas Weber", email: "jonas@northwind.io" },
  { name: "Lena Hart", email: "lena@northwind.io" },
  { name: "Finance team", email: "billing@northwind.io" },
];

const first = (c: DraftContact) => c.name.split(" ")[0];
// Stands in when `contacts` is empty: shown as such, and nothing can be sent to it
const noRecipient: DraftContact = { name: "No recipient", email: "" };
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Warns once per page (not per instance) when sending is simulated because onSend is missing
let warnedSimulatedSend = false;
const warnSimulatedSend = () => {
  if (warnedSimulatedSend) return;
  warnedSimulatedSend = true;
  console.warn(
    "EmailDraft: no onSend handler – simulating sending. Pass `demo` to keep the simulation, or `onSend` to wire it up. The simulation will be off by default in the next major version.",
  );
};

const defaultTones: DraftTone[] = [
  {
    id: "friendly",
    label: "Friendly",
    body: (c) =>
      `Hi ${first(c)}, a heads-up that your Growth plan renews on October 9 for $8,900 a year. If you'd like to add seats or switch to monthly billing, you can review the quote here:`,
  },
  {
    id: "short",
    label: "Short",
    body: (c) => `Hi ${first(c)}, your Growth plan renews on October 9 ($8,900/year). Quote for changes:`,
  },
  {
    id: "formal",
    label: "Formal",
    body: (c) =>
      `Dear ${c.name}, this is a reminder that your Growth subscription is scheduled to renew on October 9 at $8,900 per year. Should you wish to adjust seats or billing, please review the attached quote:`,
  },
];

type Phase = "draft" | "sending" | "sent" | "discarded";

/* ---------- Parts ---------- */

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

type RecipientProps = {
  to: DraftContact;
  contacts: DraftContact[];
  clean: boolean;
  menu: boolean;
  setMenu: Dispatch<SetStateAction<boolean>>;
  onPick: (c: DraftContact) => void;
};

/**
 * "to" and the contact it goes to – a listbox popup switches it (APG select-only combobox pattern without the
 * combobox role: the trigger opens it, focus moves into the list, ↑/↓/Home/End move, Enter/Space picks, Esc and Tab
 * close; Esc and a pick return focus to the trigger)
 */
function Recipient({ to, contacts, clean, menu, setMenu, onPick }: RecipientProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const [active, setActive] = useState(0);
  const optionId = (i: number) => `${id}-o${i}`;
  // Close the recipient menu on outside click
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menu, setMenu]);
  // Opening moves focus into the list, onto the current recipient
  useEffect(() => {
    if (menu) listRef.current?.focus({ preventScroll: true });
  }, [menu]);
  const openMenu = (at?: "first" | "last") => {
    const current = Math.max(0, contacts.findIndex((c) => c.email === to.email));
    setActive(at === "first" ? 0 : at === "last" ? Math.max(0, contacts.length - 1) : current);
    setMenu(true);
  };
  const close = () => {
    setMenu(false);
    triggerRef.current?.focus({ preventScroll: true });
  };
  const pick = (c: DraftContact) => {
    onPick(c);
    triggerRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (menu) document.getElementById(optionId(active))?.scrollIntoView?.({ block: "nearest" });
  });
  return (
    <div className="ui-ed__to" ref={menuRef}>
      <span className="ui-ed__label" id={`${id}-label`}>
        {clean ? "To" : "to"}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="ui-ed__recipient"
        aria-haspopup="listbox"
        aria-expanded={menu}
        id={`${id}-trigger`}
        aria-labelledby={`${id}-label ${id}-trigger`}
        onClick={() => (menu ? setMenu(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openMenu(e.key === "ArrowUp" ? "last" : undefined);
          }
        }}
      >
        {clean ? (
          <>
            <span className="ui-ed__name">{to.name}</span>
            <span className="ui-ed__email">{to.email}</span>
          </>
        ) : (
          <>
            {to.name} {to.email && <span className="ui-ed__email">({to.email})</span>}
          </>
        )}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={clean ? "m8 10 4 4 4-4" : "m7 10 5 5 5-5"} />
        </svg>
      </button>
      {menu && (
        <ul
          ref={listRef}
          className="ui-ed__menu"
          role="listbox"
          aria-label="Recipient"
          tabIndex={-1}
          aria-activedescendant={contacts.length ? optionId(active) : undefined}
          onKeyDown={(e) => {
            const last = contacts.length - 1;
            const move = (i: number) => {
              e.preventDefault();
              setActive(Math.max(0, Math.min(last, i)));
            };
            if (e.key === "ArrowDown") move(active + 1);
            else if (e.key === "ArrowUp") move(active - 1);
            else if (e.key === "Home") move(0);
            else if (e.key === "End") move(last);
            else if ((e.key === "Enter" || e.key === " ") && contacts[active]) {
              e.preventDefault();
              pick(contacts[active]);
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              close();
            } else if (e.key === "Tab") setMenu(false);
          }}
        >
          {contacts.map((c, i) => (
            <li
              key={c.email}
              id={optionId(i)}
              role="option"
              aria-selected={c.email === to.email}
              data-active={i === active || undefined}
              onPointerMove={() => setActive(i)}
              onClick={() => pick(c)}
            >
              <span className="ui-ed__avatar" aria-hidden="true">
                {initials(c.name)}
              </span>
              <span className="ui-ed__menu-text">
                {c.name}
                <small>{c.email}</small>
              </span>
              {c.email === to.email && (
                <svg className="ui-ed__tick" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 12.5 4 4 8-9" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The attached file with its remove button – or, once removed, a button that attaches it again */
function Attachment({ file, attachment, clean, setFile }: { file: string | null; attachment?: string | null; clean: boolean; setFile: (next: string | null) => void }) {
  if (file)
    return (
      <span className="ui-ed__file">
        <Icon>
          <path d="m15.5 7.5-6.4 6.4a1.8 1.8 0 0 0 2.5 2.5l6.7-6.7a3.5 3.5 0 0 0-5-5l-6.9 6.9a5.2 5.2 0 0 0 7.4 7.4l6-6" />
        </Icon>
        {clean ? <span className="ui-ed__file-name">{file}</span> : file}
        <button type="button" aria-label={`Remove ${file}`} onClick={() => setFile(null)}>
          <Icon>
            <path d="M7 7l10 10M17 7 7 17" />
          </Icon>
        </button>
      </span>
    );
  return (
    attachment && (
      <button type="button" className="ui-ed__attach" onClick={() => setFile(attachment)}>
        <Icon>
          <path d="M12 6v12M6 12h12" />
        </Icon>
        {clean ? <span className="ui-ed__file-name">Attach {attachment}</span> : <>Attach {attachment}</>}
      </button>
    )
  );
}

type BodyProps = {
  editing: boolean;
  edited: string | null;
  body: string;
  toneKey: number;
  link: { label: string; href: string };
  textRef: { current: HTMLTextAreaElement | null };
  setEdited: (text: string) => void;
  setEditing: (editing: boolean) => void;
  startEditing: () => void;
  send: () => void;
  /** Manual edits a tone replaced – offered back until the text is edited again */
  replaced: string | null;
  restore: () => void;
};

/** The email text – click it to edit, the field grows with its text */
function DraftBody({ editing, edited, body, toneKey, link, textRef, setEdited, setEditing, startEditing, send, replaced, restore }: BodyProps) {
  // The edit field grows with its text
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, body, textRef]);
  return (
    <div className="ui-ed__body">
      {editing ? (
        <textarea
          ref={textRef}
          className="ui-ed__edit"
          data-focus-key="edit"
          value={edited ?? ""}
          onChange={(e) => setEdited(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
            if (e.key === "Escape") {
              // Focus goes back to the Edit button, not to <body>
              e.preventDefault();
              const field = e.currentTarget;
              rescueFocus(field, [() => field.closest(".ui-ed")?.querySelector(".ui-ed__edit-btn")]);
              setEditing(false);
            }
          }}
          onBlur={() => setEditing(false)}
          aria-label="Email text"
        />
      ) : (
        <p key={toneKey} className="ui-ed__text" onClick={startEditing} title="Click to edit">
          {body}{" "}
          <a href={link.href} onClick={(e) => e.stopPropagation()}>
            {link.label}
          </a>
        </p>
      )}
      {replaced !== null && !editing && (
        <button type="button" className="ui-ed__restore" onClick={restore}>
          Restore my edits
        </button>
      )}
    </div>
  );
}

/** The tone variants and the edit button */
function Tones({ tones, tone, edited, editing, pickTone, startEditing }: { tones: DraftTone[]; tone: string; edited: string | null; editing: boolean; pickTone: (id: string) => void; startEditing: () => void }) {
  return (
    <div className="ui-ed__tones" role="group" aria-label="Tone">
      {tones.map((t) => (
        <button key={t.id} type="button" aria-pressed={tone === t.id && edited === null} onClick={() => pickTone(t.id)}>
          {t.label}
        </button>
      ))}
      <button type="button" className="ui-ed__edit-btn" data-focus-key="edit" aria-pressed={editing} aria-label="Edit text" onClick={startEditing}>
        <Icon>
          <path d="M14.5 5.5 18.5 9.5M5 19l1-4L15.5 5.5l4 4L10 19l-5 0Z" />
        </Icon>
      </button>
    </div>
  );
}

/** The one-line receipt the card folds into – with Undo when it can be honoured */
function Receipt({ phase, to, file, canUndo, undo }: { phase: Phase; to: DraftContact; file: string | null; canUndo: boolean; undo: () => void }) {
  return (
    <div className="ui-ed__receipt" tabIndex={-1}>
      <span className="ui-ed__receipt-icon" data-tone={phase === "sent" ? "ok" : "muted"} aria-hidden="true">
        <Icon>{phase === "sent" ? <path d="m6 12.5 4 4 8-9" /> : <path d="M7 7l10 10M17 7 7 17" />}</Icon>
      </span>
      <span className="ui-ed__receipt-text">
        {phase === "sent" ? (
          <>
            Sent to <b>{to.name}</b>
            {file ? ` with ${file}` : ""}
          </>
        ) : (
          "Draft discarded"
        )}
      </span>
      {canUndo && (
        <button type="button" className="ui-ed__undo" data-focus-key="action" onClick={undo}>
          Undo
        </button>
      )}
    </div>
  );
}

/* ---------- Component ---------- */

export function EmailDraft({
  look,
  reference = "SUB-1182",
  account = "Northwind Logistics",
  amount = "$8,900",
  status = "Renews in 5 days",
  agent = "Renewal agent",
  contacts = defaultContacts,
  recipient,
  defaultRecipient,
  onRecipientChange,
  attachment = "Renewal-quote.pdf",
  tones = defaultTones,
  tone: toneProp,
  defaultTone,
  onToneChange,
  link = { label: "Review quote", href: "#" },
  onSend,
  onDiscard,
  onUndo,
  demo = false,
  className,
  ref,
  ...rest
}: EmailDraftProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  // Picked by key, so the lists stay the source of truth: an email or id that's gone falls back to the first
  const [pickedEmail, setPickedEmail] = useControllable<string>(
    recipient,
    defaultRecipient ?? contacts[0]?.email ?? "",
    onRecipientChange &&
      ((email) => {
        const c = contacts.find((x) => x.email === email);
        if (c) onRecipientChange(email, c);
      }),
    "recipient",
  );
  const to = contacts.find((c) => c.email === pickedEmail) ?? contacts[0] ?? noRecipient;
  const setTo = (c: DraftContact) => setPickedEmail(c.email);
  // Removing the attachment holds for that file; another file passed in later shows again
  const [removed, setRemoved] = useState<string | null>(null);
  const file = attachment && attachment !== removed ? attachment : null;
  const setFile = (next: string | null) => setRemoved(next ? null : attachment);
  const [pickedTone, setTone] = useControllable<string>(toneProp, defaultTone ?? tones[0]?.id ?? "", onToneChange, "tone");
  const tone = tones.some((t) => t.id === pickedTone) ? pickedTone : (tones[0]?.id ?? "");
  // Edited text wins over the generated variant until the tone or recipient changes
  const [edited, setEdited] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [phase, setPhase] = useState<Phase>("draft");
  const [toneKey, setToneKey] = useState(0);
  const [error, setError] = useState("");
  // Manual edits a tone replaced – "Restore my edits" brings them back
  const [replaced, setReplaced] = useState<string | null>(null);
  // The persistent status region's text: final results only (sent, discarded, edits replaced)
  const [announce, setAnnounce] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const setRoot = useRootRef(rootRef, ref);
  // Focus never drops to <body>: Send ↔ Undo share a focus key; without Undo the receipt takes focus
  useFocusRescue(rootRef, {
    fallback: () => {
      const q = (sel: string) => rootRef.current?.querySelector<HTMLElement>(sel);
      return q(".ui-ed__undo") ?? q(".ui-ed__receipt") ?? q(".ui-ed__primary:not(:disabled)") ?? q(".ui-ed__recipient");
    },
  });
  const inner = useRef<HTMLDivElement>(null);
  const outer = useSmoothHeight(inner);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const timers = useRef<number[]>([]);
  // Bumped on unmount, so a send that settles afterwards is ignored
  const run = useRef(0);

  const generated = (to.email && (tones.find((t) => t.id === tone) ?? tones[0])?.body(to)) || "";
  const body = edited ?? generated;

  useEffect(
    () => () => {
      run.current++;
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const startEditing = () => {
    setReplaced(null);
    setEdited(body);
    setEditing(true);
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const pickTone = (id: string) => {
    if (id === tone && edited === null) return;
    // Manual edits aren't lost silently: they can be restored until the text is edited again
    if (edited !== null && edited !== generated) {
      setReplaced(edited);
      setAnnounce(`Your edits were replaced by the ${tones.find((t) => t.id === id)?.label ?? id} text. Restore my edits brings them back.`);
    }
    setTone(id);
    setEdited(null);
    setEditing(false);
    setToneKey((k) => k + 1);
  };

  const pickContact = (c: DraftContact) => {
    setTo(c);
    setMenu(false);
    // Keep manual edits, but follow the new name in the generated text
    // Names are matched literally – "J. (Jo) Smith" is no pattern – and the full name before the first name
    if (edited !== null && to.email)
      setEdited(
        edited.replace(new RegExp(`${escapeRegExp(to.name)}|\\b${escapeRegExp(first(to))}\\b`, "g"), (m) =>
          m === to.name ? c.name : first(c),
        ),
      );
  };

  const restore = () => {
    if (replaced === null) return;
    setEdited(replaced);
    setReplaced(null);
    setAnnounce("Your edits are back.");
  };

  const send = async () => {
    if (phase !== "draft" || !to.email) return;
    setEditing(false);
    setError("");
    setPhase("sending");
    const current = run.current;
    if (!onSend && !demo) warnSimulatedSend();
    try {
      // The spinner shows for at least 900ms, and for as long as onSend's promise is pending
      await Promise.all([
        onSend?.({ to, body: `${body} ${link.label}: ${link.href}`, attachment: file }),
        new Promise((r) => timers.current.push(window.setTimeout(r, 900))),
      ]);
    } catch {
      if (run.current === current) {
        setPhase("draft");
        setError("The email couldn't be sent. Try again.");
      }
      return;
    }
    if (run.current === current) {
      setPhase("sent");
      setReplaced(null);
      setAnnounce(`Email sent to ${to.name}.`);
    }
  };

  const discard = () => {
    setEditing(false);
    setError("");
    setPhase("discarded");
    setAnnounce("Draft discarded.");
    onDiscard?.();
  };

  // Undo only where it can be honoured: the action never reached you, or onUndo takes it back
  const canUndo = !!onUndo || (phase === "sent" ? !onSend : !onDiscard);
  const undo = () => {
    onUndo?.(phase === "sent" ? "send" : "discard");
    setAnnounce(phase === "sent" ? "Sending undone – the draft is back." : "Discard undone – the draft is back.");
    setPhase("draft");
  };

  const open = phase === "draft" || phase === "sending";
  const badge =
    phase === "sent" ? { text: "Sent", tone: "ok" } : phase === "discarded" ? { text: "Discarded", tone: "muted" } : { text: "Ready for review", tone: "ok" };

  // Discard and Send – Standard: in the card, next to the tones; Clean: in the card's last row
  // While sending, the buttons stay focusable (aria-disabled), so focus stays on Send as it turns into "Sending"
  const sending = phase === "sending";
  const buttons = (
    <div className="ui-ed__buttons">
      <button type="button" className="ui-ed__secondary" data-focus-key="discard" onClick={() => !sending && discard()} aria-disabled={sending || undefined}>
        Discard
      </button>
      <button type="button" className="ui-ed__primary" data-focus-key="action" onClick={send} aria-disabled={sending || undefined} disabled={!to.email}>
        {phase === "sending" ? (
          <>
            <span className="ui-ed__spinner" aria-hidden="true" />
            Sending
          </>
        ) : (
          "Send email"
        )}
      </button>
    </div>
  );

  return (
    <div {...rest} ref={setRoot} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} data-phase={phase}>
      <style href="ui-email-draft" precedence="default">
        {css}
      </style>

      {/* The record the email is about */}
      <div className="ui-ed__record">
        <div className="ui-ed__ref">
          <span className="ui-ed__id">{reference}</span>
          <span className="ui-ed__status">{status}</span>
          <span className="ui-ed__amount">{amount}</span>
        </div>
        <span className="ui-ed__account">{account}</span>
      </div>

      {/* Card ↔ receipt, the height glides between them (Clean: email ↔ receipt – the last row below always stays in view) */}
      <div className="ui-ed__outer" ref={outer} data-menu={menu ? "" : undefined}>
        <div ref={inner}>
          {open ? (
            <div className={clean ? "ui-ed__draft" : "ui-ed__card"} data-sending={phase === "sending" ? "" : undefined}>
              <div className="ui-ed__meta">
                <Recipient to={to} contacts={contacts} clean={clean} menu={menu} setMenu={setMenu} onPick={pickContact} />
                <Attachment file={file} attachment={attachment} clean={clean} setFile={setFile} />
              </div>

              <DraftBody
                editing={editing}
                edited={edited}
                body={body}
                toneKey={toneKey}
                link={link}
                textRef={textRef}
                setEdited={setEdited}
                setEditing={setEditing}
                startEditing={startEditing}
                send={send}
                replaced={replaced}
                restore={restore}
              />

              {error && (
                <p className="ui-ed__error" role="alert">
                  {error}
                </p>
              )}
              <div className={clean ? "ui-ed__tune" : "ui-ed__actions"}>
                <Tones tones={tones} tone={tone} edited={edited} editing={editing} pickTone={pickTone} startEditing={startEditing} />
                {clean ? <span className="ui-ed__hint">⌘ Enter to send</span> : buttons}
              </div>
            </div>
          ) : (
            <Receipt phase={phase} to={to} file={file} canUndo={canUndo} undo={undo} />
          )}
        </div>
      </div>

      <div className="ui-ed__foot">
        <span className="ui-ed__agent">{agent}</span>
        <span className="ui-ed__badge" data-tone={badge.tone} key={badge.text}>
          {badge.text}
        </span>
        {open && (clean ? buttons : <span className="ui-ed__hint">⌘ Enter to send</span>)}
      </div>
      <span className="ui-ed__sr" role="status">
        {announce}
      </span>
    </div>
  );
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);

/* ---------- Shared helpers (inlined from src/internal) ---------- */

// Written as the literal `process.env.NODE_ENV` so bundlers replace it and production builds skip the warning;
// without a bundler `process` doesn't exist and the warning stays off
declare const process: { env: { NODE_ENV?: string } };
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: the component keeps its own state, starting at
 * `defaultValue`, and still reports changes. Whether `onChange` is passed never decides which – passing a callback
 * for analytics must not freeze the component.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  if (controlled && !onChange && !warned.current && DEV) {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  // Read through refs so the setter is stable and never acts on a stale value
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
      if (Object.is(resolved, latest.current)) return;
      if (!controlled) setOwn(resolved);
      latest.current = resolved;
      report.current?.(resolved);
    },
    [controlled],
  );
  return [current, set] as const;
}

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
function rescueFocus(
  from: Element | null | undefined,
  targets: Array<Element | string | null | undefined | (() => Element | null | undefined)>,
  within: ParentNode = document,
) {
  const active = document.activeElement;
  if (!from || !active || !from.contains(active)) return false;
  for (const t of targets) {
    const el = typeof t === "function" ? t() : typeof t === "string" ? within.querySelector(t) : t;
    if (el !== active && focusable(el)) {
      (el as HTMLElement).focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

type Options = {
  /** Where focus goes when the control it was on is gone – gets that control's `data-focus-key` (if it had one) */
  fallback?: (key: string | null) => Element | null | undefined;
};

/**
 * Safety net for a component's root: when the focused element inside it is removed, disabled or made inert and
 * focus fell to <body>, focus moves (before paint) to
 *   1. an element with the same `data-focus-key` (the control was re-mounted, e.g. a card moved to another list),
 *   2. `fallback(key)`, e.g. the next row or the trigger,
 *   3. the root itself (made focusable with tabindex=-1 if it isn't).
 * Prefer moving focus explicitly with rescueFocus where the right target is known; this catches the rest.
 */
function useFocusRescue(root: RefObject<HTMLElement | null>, options: Options = {}) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    const el = root.current;
    if (!el || typeof MutationObserver !== "function") return;
    let last: HTMLElement | null = null;
    const onFocusIn = (e: FocusEvent) => {
      last = e.target instanceof HTMLElement ? e.target : null;
    };
    const check = () => {
      const prev = last;
      if (!prev || !el.isConnected) return;
      const gone = !focusable(prev);
      const active = document.activeElement;
      const lost = !active || active === document.body || active === prev;
      if (!lost || !gone) return;
      const key = prev.getAttribute("data-focus-key");
      const same = key ? [...el.querySelectorAll(`[data-focus-key="${CSS.escape(key)}"]`)].find((c) => c !== prev && focusable(c)) : null;
      const target = [same, latest.current.fallback?.(key)].find(focusable) as HTMLElement | undefined;
      last = null;
      if (target) target.focus({ preventScroll: true });
      else {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [root]);
}

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}

/** The outer box follows the inner box's height, with a transition after the first frame */
function useSmoothHeight(inner: RefObject<HTMLElement | null>) {
  const outer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const sync = () => {
      o.style.height = `${i.offsetHeight}px`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(i);
    const frame = requestAnimationFrame(() => o.setAttribute("data-smooth", ""));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [inner]);
  return outer;
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-ed:where([data-look="standard"]),
.ui-ed__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #232326);
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-selected: light-dark(rgba(47, 107, 255, 0.08), rgba(91, 154, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring: light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-menu-item-px: 10px;
  --_tc-menu-item-radius: 8px;
  --_tc-menu-item-selected-fg: light-dark(#2456d6, #8ab4ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-control: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
  --_tc-z-dropdown: 30;
}
.ui-ed:where([data-look="clean"]),
.ui-ed__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #252527);
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-selected: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring: light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-menu-item-px: 8px;
  --_tc-menu-item-radius: 6px;
  --_tc-menu-item-selected-fg: light-dark(#0058cf, #70b8ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-control: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-ed {
  /* The record and footer sit on a tray (tray pattern); the email card sits on it */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 520px;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-ed */
:where([data-look="clean"], [data-look="clean"] *).ui-ed {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-ed *, .ui-ed *::before, .ui-ed *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed button { font: inherit; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-ed button:focus-visible,
.ui-ed a:focus-visible,
.ui-ed__receipt:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed svg { width: 15px; height: 15px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
/* ---------- Record on the tray ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__record { display: grid; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-ed) button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="clean"], [data-look="clean"] *):where(.ui-ed) svg {
  display: block;
  width: 16px;
  height: 16px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* ---------- The record, heading the card ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__record { display: grid; padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-4, var(--_tc-space-4)); border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-ed__ref { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__id { font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); letter-spacing: -0.01em; }
/* Status and badge: the pill pattern */
.ui-ed__status,
.ui-ed__badge {
  display: inline-flex;
  align-items: center;
  flex: none;
  height: var(--tc-pill-h, var(--_tc-pill-h));
  max-width: 100%;
  padding: 0 var(--tc-pill-px, var(--_tc-pill-px));
  overflow: hidden;
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-ed__status { flex: 0 1 auto; min-width: 0; background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__amount { flex: none; margin-left: auto; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__account { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__outer { position: relative; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__id { flex: none; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__amount {
  flex: none;
  margin-left: auto;
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__account { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* ---------- The email: only this part changes height ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__outer { position: relative; overflow: hidden; overflow: clip; }
/* The recipient menu may reach out of the card while it's open – the height doesn't move then */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__outer[data-menu] { overflow: visible; z-index: 2; }
.ui-ed__outer[data-smooth] { transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
/* ---------- Email card ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__card {
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  animation: ui-ed-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
  transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__card[data-sending] { opacity: 0.7; pointer-events: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  margin: 0 var(--tc-space-3-5, var(--_tc-space-3-5));
  padding: var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-3, var(--_tc-space-3));
  border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__to { position: relative; display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__label { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__recipient {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  min-width: 0;
  height: 26px;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) 0 var(--tc-space-2, var(--_tc-space-2));
  border: 0;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  white-space: nowrap;
  overflow: hidden;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__recipient:hover { background: color-mix(in srgb, var(--tc-fill-default, var(--_tc-fill-default)) 80%, var(--tc-text-primary, var(--_tc-text-primary)) 6%); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__email { overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__recipient svg { width: 14px; height: 14px; color: var(--tc-text-muted, var(--_tc-text-muted)); transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__draft { animation: ui-ed-in-clean var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__draft[data-sending] { opacity: 0.6; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-4, var(--_tc-space-4));
  border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__to { position: relative; display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__label { flex: none; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Recipient: the button-switch look – a hairline, the address in gray */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__recipient {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  min-width: 0;
  height: 28px;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) 0 var(--tc-space-2-5, var(--_tc-space-2-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  white-space: nowrap;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__recipient:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__recipient[aria-expanded="true"] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__name { flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__email { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__recipient svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-ed__recipient[aria-expanded="true"] svg { transform: rotate(180deg); }
/* Recipient listbox: the menu pattern */
.ui-ed__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 18px;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  display: grid;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  width: 260px;
  max-width: calc(100cqw - 40px);
  margin: 0;
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  list-style: none;
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  animation: ui-ed-menu var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both;
  transform-origin: top left;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__menu { left: 26px; }
/* Focus is on the list; the active option carries the ring */
.ui-ed__menu[aria-activedescendant]:focus-visible { outline: none; }
.ui-ed__menu:focus-visible [data-active] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) var(--tc-focus-ring, var(--_tc-focus-ring)); }
.ui-ed__menu [role="option"] {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  min-height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 6px var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  cursor: pointer;
}
.ui-ed__menu [data-active] { background: var(--tc-menu-item-hover, var(--_tc-menu-item-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__avatar {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 50%;
  background: var(--tc-fill-default, var(--_tc-fill-default));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default));
  font-size: 10.5px;
  font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* Recipient menu: a white popover */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__avatar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  letter-spacing: 0.5px;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
.ui-ed__menu-text { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__menu-text small { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); overflow: hidden; text-overflow: ellipsis; }
.ui-ed__tick { color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__file {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__file button,
:where([data-look="standard"], [data-look="standard"] *).ui-ed__attach {
  display: grid;
  place-items: center;
  border: 0;
  background: none;
  color: var(--tc-text-muted, var(--_tc-text-muted)) !important;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__file button { width: 20px; height: 20px; padding: 0; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__file button svg { width: 13px; height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__file button:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__attach { display: inline-flex; gap: var(--tc-space-1, var(--_tc-space-1)); padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__attach:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
/* Body */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__body { padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__text {
  margin: -4px -6px;
  padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1-5, var(--_tc-space-1-5));
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  cursor: text;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ed-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__text:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__text a {
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--tc-text-secondary, var(--_tc-text-secondary)) 35%, transparent);
  text-decoration-thickness: var(--tc-hairline, var(--_tc-hairline));
  text-underline-offset: 4px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__menu-text small { overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tick { stroke-width: 1.8; }
/* Attachment */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  min-width: 0;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file > svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file button {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin-left: -2px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file button svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file button:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__attach {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  min-width: 0;
  height: 28px;
  padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ed-fade var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__attach svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__attach:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Body */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__body { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__error { margin: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-4, var(--_tc-space-4)) 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__text {
  margin: -4px -6px;
  padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1-5, var(--_tc-space-1-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  cursor: text;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ed-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__text:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__text a {
  color: var(--tc-text-strong, var(--_tc-text-strong));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  text-decoration: underline;
  text-decoration-color: var(--tc-text-disabled, var(--_tc-text-disabled));
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: text-decoration-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-ed__text a:hover { text-decoration-color: currentColor; }
/* Editing: the text becomes a field – field ring, focus ring + halo while focused */
.ui-ed__edit {
  display: block;
  width: calc(100% + 12px);
  margin: -4px -6px;
  padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1-5, var(--_tc-space-1-5));
  border: 0;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-field-bg, var(--_tc-field-bg));
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  resize: none;
  overflow: hidden;
  font: inherit;
  color: var(--tc-text-strong, var(--_tc-text-strong));
  caret-color: var(--tc-accent, var(--_tc-accent));
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-ed__edit:focus { outline: none; box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__edit { border-radius: var(--tc-radius-md, var(--_tc-radius-md)); font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); }
/* Actions */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__error { margin: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3-5, var(--_tc-space-3-5)) 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  flex-wrap: wrap;
  padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3-5, var(--_tc-space-3-5));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__tones { display: flex; align-items: center; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__tones button {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 var(--tc-space-2, var(--_tc-space-2));
  border: 0;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: none;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  color: var(--tc-text-muted, var(--_tc-text-muted)) !important;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__tones button:hover { color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
/* Pressed tone: fill plus a ≥3:1 ring, not the fill alone */
.ui-ed__tones button[aria-pressed="true"] { background: var(--tc-fill-selected, var(--_tc-fill-selected)); color: var(--tc-text-primary, var(--_tc-text-primary)) !important; box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__tones .ui-ed__edit-btn { width: 28px; padding: 0; justify-content: center; margin-left: var(--tc-space-1, var(--_tc-space-1)); }
.ui-ed__buttons { display: flex; flex: none; gap: var(--tc-space-2, var(--_tc-space-2)); margin-left: auto; }
/* Discard and Send look exactly like Button secondary / primary (control + action pattern tokens) */
.ui-ed__secondary,
.ui-ed__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border: 0;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-ed__secondary { background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)) !important; }
.ui-ed__secondary:hover:not(:disabled):not([aria-disabled="true"]) { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
.ui-ed__primary { background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)) !important; }
.ui-ed__primary:hover:not(:disabled):not([aria-disabled="true"]) { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); }
.ui-ed__primary:active:not(:disabled):not([aria-disabled="true"]) { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
.ui-ed__secondary:active:not(:disabled):not([aria-disabled="true"]),
.ui-ed__primary:active:not(:disabled):not([aria-disabled="true"]) { transform: scale(0.97); }
.ui-ed__secondary:is(:disabled, [aria-disabled="true"]),
.ui-ed__primary:is(:disabled, [aria-disabled="true"]) { cursor: default; }
.ui-ed__primary:disabled { opacity: 0.4; }
.ui-ed__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid color-mix(in srgb, var(--tc-action-primary-fg, var(--_tc-action-primary-fg)) 30%, transparent);
  border-top-color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg));
  border-radius: 50%;
  animation: ui-ed-spin var(--tc-duration-reveal, var(--_tc-duration-reveal)) linear infinite;
}
/* ---------- Receipt after send / discard ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__receipt {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3));
  border: 1px solid var(--tc-border-default, var(--_tc-border-default));
  border-radius: var(--tc-radius-2xl, var(--_tc-radius-2xl));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-control, var(--_tc-shadow-control));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  animation: ui-ed-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__receipt b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__receipt-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 50%;
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__edit { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
/* Tones and the pencil */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tune {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones { display: flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones button {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2-5, var(--_tc-space-2-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones button:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Edit: a ghost icon button */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones .ui-ed__edit-btn {
  justify-content: center;
  width: 28px;
  margin-left: var(--tc-space-1, var(--_tc-space-1));
  padding: 0;
  box-shadow: none;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones .ui-ed__edit-btn:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__hint { flex: none; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); white-space: nowrap; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ---------- Receipt after send / discard ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-4, var(--_tc-space-4));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  animation: ui-ed-in-clean var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt-icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex: none;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
}
.ui-ed__receipt-icon[data-tone="ok"] { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__receipt-icon svg { width: 14px; height: 14px; stroke-width: 2.2; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt-icon svg { width: 14px; height: 14px; stroke-width: 2; }
.ui-ed__receipt-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Undo: a ghost action */
.ui-ed__undo {
  flex: none;
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm));
  border: 0;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  background: none;
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  color: var(--tc-text-primary, var(--_tc-text-primary)) !important;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-ed__undo:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); }
/* ---------- Footer on the tray ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__foot { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__agent { font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-ed__badge { animation: ui-ed-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
/* ---------- The last row ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__foot {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  min-height: 48px;
  padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-4, var(--_tc-space-4));
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__agent { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-ed__badge[data-tone="ok"] { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__hint { margin-left: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
@keyframes ui-ed-in { from { opacity: 0; transform: translateY(4px) scale(0.99); } }
.ui-ed__badge[data-tone="muted"] { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
@keyframes ui-ed-in-clean { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-ed-fade { from { opacity: 0; } }
@keyframes ui-ed-menu { from { opacity: 0; transform: scale(0.96) translateY(-4px); } }
@keyframes ui-ed-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-ed__outer[data-smooth] { transition: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__card,
:where([data-look="standard"], [data-look="standard"] *).ui-ed__receipt,
:where([data-look="standard"], [data-look="standard"] *).ui-ed__text,
:where([data-look="standard"], [data-look="standard"] *).ui-ed__badge,
:where([data-look="standard"], [data-look="standard"] *).ui-ed__menu { animation: none; }
}
/* Narrow containers (phones): the address, hint and author step back */
@container (max-width: 440px) {
.ui-ed__email,
.ui-ed__hint { display: none; }
}
/* Standard below 380 px: the tones and the buttons wrap onto two rows instead of overflowing */
@container (max-width: 380px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ed__meta { margin: 0 var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__body { padding-left: var(--tc-space-3, var(--_tc-space-3)); padding-right: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__actions { padding-left: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__tones button { padding: 0 var(--tc-space-2, var(--_tc-space-2)); }
}
@container (max-width: 380px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ed__record { padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__meta,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tune,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__foot { padding-left: var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__body { padding-left: var(--tc-space-3-5, var(--_tc-space-3-5)); padding-right: var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed[data-phase="draft"] .ui-ed__agent,
:where([data-look="clean"], [data-look="clean"] *).ui-ed[data-phase="sending"] .ui-ed__agent { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones { gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones button { padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones .ui-ed__edit-btn { margin-left: var(--tc-space-0-5, var(--_tc-space-0-5)); }
}
/* Touch screens: taller hit targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ed__recipient,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones button,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__secondary,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__primary,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__undo,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__attach { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones .ui-ed__edit-btn { width: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file button { width: 30px; height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__menu [role="option"] { padding-top: var(--tc-space-2, var(--_tc-space-2)); padding-bottom: var(--tc-space-2, var(--_tc-space-2)); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-ed__outer[data-smooth] { transition: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__draft,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__text,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__badge,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__menu,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__attach { animation: none; }
}
/* "Restore my edits": a quiet text action under the email */
.ui-ed__restore {
  display: inline-flex;
  align-items: center;
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  margin: var(--tc-space-1, var(--_tc-space-1)) -6px 0;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border: 0;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  background: none;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  color: var(--tc-accent-text, var(--_tc-accent-text)) !important;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.ui-ed__restore:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); }
/* Announcements for screen readers only */
.ui-ed__sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;
