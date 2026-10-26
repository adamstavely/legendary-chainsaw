import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEmailDraft, type DraftContact, type DraftRecipientChange, type DraftToneChange, type DraftUndo } from "../email-draft";
import { h } from "./internal";

/**
 * useControlled, except an uncontrolled value is mirrored here: @lit/react sets every prop on every render, so passing
 * the starting value back would undo the element's own change whenever the parent re-renders
 */
function useOwned<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const own = React.useRef(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else own.current = next;
    onChange?.(next);
  };
  return { value: controlled ? value : own.current, handler, controlled };
}

export type { DraftContact, DraftEmail, DraftTone } from "../email-draft";

const RawEmailDraft = createComponent({
  tagName: "tc-email-draft",
  elementClass: TcEmailDraft,
  react: React,
  events: {
    onTcRecipientChange: "tc-recipient-change" as EventName<CustomEvent<DraftRecipientChange>>,
    onTcToneChange: "tc-tone-change" as EventName<CustomEvent<DraftToneChange>>,
    onTcDiscard: "tc-discard" as EventName<CustomEvent<null>>,
    onTcUndo: "tc-undo" as EventName<CustomEvent<DraftUndo>>,
  },
});
type RawEmailDraftProps = React.ComponentProps<typeof RawEmailDraft>;
export type EmailDraftProps = Omit<
  RawEmailDraftProps,
  "recipient" | "tone" | "undoSend" | "undoDiscard" | "onTcRecipientChange" | "onTcToneChange" | "onTcDiscard" | "onTcUndo"
> & {
  /** The email of the contact it goes to – controlled when defined; one not in `contacts` falls back to the first */
  recipient?: string;
  /** The email of the contact picked at first – defaults to the first contact */
  defaultRecipient?: string;
  onRecipientChange?: (email: string, contact: DraftContact) => void;
  /** The id of the tone shown – controlled when defined; one not in `tones` falls back to the first */
  tone?: string;
  defaultTone?: string;
  onToneChange?: (id: string) => void;
  onDiscard?: () => void;
  /**
   * Takes back a send or a discard that already reached you through onSend / onDiscard. Without it the receipt
   * offers no Undo for those – only for what never left the component
   */
  onUndo?: (action: "send" | "discard") => void;
};
export function EmailDraft({ recipient, defaultRecipient, onRecipientChange, tone, defaultTone, onToneChange, onDiscard, onUndo, ...props }: EmailDraftProps) {
  const last = React.useRef<DraftContact | null>(null);
  // Picked by key at mount, as the React component did; unset, the element starts on its own first contact and tone
  const r = useOwned<string | undefined>(recipient, defaultRecipient ?? props.contacts?.[0]?.email, (email) => email && last.current && onRecipientChange?.(email, last.current));
  const t = useOwned<string | undefined>(tone, defaultTone ?? props.tones?.[0]?.id, (id) => id && onToneChange?.(id));
  return h(RawEmailDraft, {
    ...props,
    recipient: r.value,
    tone: t.value,
    // Undo only where it can be honoured: the action never reached you, or onUndo takes it back
    undoSend: !!onUndo || !props.onSend,
    undoDiscard: !!onUndo || !onDiscard,
    onTcRecipientChange: (e: CustomEvent<DraftRecipientChange>) => {
      last.current = e.detail.contact;
      r.handler(e.detail.email, e);
    },
    onTcToneChange: (e: CustomEvent<DraftToneChange>) => t.handler(e.detail.tone, e),
    onTcDiscard: () => onDiscard?.(),
    onTcUndo: (e: CustomEvent<DraftUndo>) => onUndo?.(e.detail.action),
  });
}
