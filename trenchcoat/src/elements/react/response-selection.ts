import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcResponseSelection,
  type ResponseAskDetail,
  type ResponseEdit,
  type ResponseEditReject,
  type ResponseEditRequest,
  type ResponseQuote,
  type ResponseQuoteDetail,
  type ResponseQuotesChange,
  type ResponseReplyDetail,
  type ResponseTextChange,
} from "../response-selection";
import { h, useControlled } from "./internal";

export type { ResponseAction, ResponseEdit, ResponseEditPreset, ResponseEditRequest, ResponseQuote, ResponseQuotesChange } from "../response-selection";

const RawResponseSelection = createComponent({
  tagName: "tc-response-selection",
  elementClass: TcResponseSelection,
  react: React,
  events: {
    onTcQuote: "tc-quote" as EventName<CustomEvent<ResponseQuoteDetail>>,
    onTcQuotesChange: "tc-quotes-change" as EventName<CustomEvent<ResponseQuotesChange>>,
    onTcReply: "tc-reply" as EventName<CustomEvent<ResponseReplyDetail>>,
    onTcAskWhy: "tc-ask-why" as EventName<CustomEvent<ResponseAskDetail>>,
    onTcEditRequest: "tc-edit-request" as EventName<CustomEvent<ResponseEditRequest>>,
    onTcEditReject: "tc-edit-reject" as EventName<CustomEvent<ResponseEditReject>>,
    onTcTextChange: "tc-text-change" as EventName<CustomEvent<ResponseTextChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawResponseSelection>;
type Wrapped = "text" | "quotes" | "edit" | "onTcQuote" | "onTcQuotesChange" | "onTcReply" | "onTcAskWhy" | "onTcEditRequest" | "onTcEditReject" | "onTcTextChange" | "children";
export type ResponseSelectionProps = Omit<RawProps, Wrapped> & {
  /** The answer, plain text. Controlled when defined (with `onTextChange`); otherwise the component keeps it, starting at `defaultText` */
  text?: string;
  /** The answer when uncontrolled */
  defaultText?: string;
  /** Called with the new answer when a suggested edit is accepted, and the range it replaced */
  onTextChange?: (text: string, change: ResponseTextChange) => void;
  /** The quotes collected for a reply. Controlled when defined; otherwise the component keeps them, starting at `defaultQuotes` */
  quotes?: ResponseQuote[];
  /** The quotes when uncontrolled */
  defaultQuotes?: ResponseQuote[];
  /** Called with the whole new list of quotes and what changed */
  onQuotesChange?: (quotes: ResponseQuote[], change: ResponseQuotesChange["change"]) => void;
  /** Called when Reply is chosen on a passage; return false to take the quote yourself, and it isn't collected */
  onQuote?: (passage: string, start: number, end: number) => boolean | void;
  /** Called when "Reply with N quotes" is pressed; return false to keep the quotes collected */
  onReply?: (quotes: ResponseQuote[]) => boolean | void;
  /** Called when Ask why is chosen on a passage */
  onAskWhy?: (passage: string, start: number, end: number) => void;
  /** Called when an edit is asked for: start the work, watch `request.signal`, then set `edit`. Return false to refuse it */
  onEditRequest?: (request: ResponseEditRequest) => boolean | void;
  /** Your answer to the last edit request – a replacement or an error – shown inline until accepted or rejected */
  edit?: ResponseEdit | null;
  /** Called when the suggested edit is rejected (or its error dismissed). The component hides that edit until you pass a new one */
  onEditReject?: (edit: ResponseEdit) => void;
};

const NO_QUOTES: ResponseQuote[] = [];

export function ResponseSelection({ text, defaultText = "", onTextChange, quotes, defaultQuotes = NO_QUOTES, onQuotesChange, onQuote, onReply, onAskWhy, onEditRequest, edit = null, onEditReject, ...props }: ResponseSelectionProps) {
  const lastText = React.useRef<ResponseTextChange | null>(null);
  const reportText = React.useCallback((next: string) => lastText.current && onTextChange?.(next, lastText.current), [onTextChange]);
  const t = useControlled<string>(text, defaultText, reportText);
  const lastQuotes = React.useRef<ResponseQuotesChange["change"] | null>(null);
  const reportQuotes = React.useCallback((next: ResponseQuote[]) => lastQuotes.current && onQuotesChange?.(next, lastQuotes.current), [onQuotesChange]);
  const q = useControlled<ResponseQuote[]>(quotes, defaultQuotes, reportQuotes);
  // An edit the person accepted or rejected stays settled while the app still passes the same object
  const [settled, setSettled] = React.useState<ResponseEdit | null>(null);
  return h(RawResponseSelection, {
    ...props,
    text: t.value,
    quotes: q.value,
    edit: edit && edit !== settled ? edit : null,
    onTcTextChange: (e: CustomEvent<ResponseTextChange>) => {
      lastText.current = e.detail;
      setSettled(edit);
      t.handler(e.detail.text, e);
    },
    onTcQuotesChange: (e: CustomEvent<ResponseQuotesChange>) => {
      lastQuotes.current = e.detail.change;
      q.handler(e.detail.quotes, e);
    },
    onTcQuote: (e: CustomEvent<ResponseQuoteDetail>) => {
      if (onQuote?.(e.detail.passage, e.detail.start, e.detail.end) === false) e.preventDefault();
    },
    onTcReply: (e: CustomEvent<ResponseReplyDetail>) => {
      if (onReply?.(e.detail.quotes) === false) e.preventDefault();
    },
    onTcAskWhy: (e: CustomEvent<ResponseAskDetail>) => onAskWhy?.(e.detail.passage, e.detail.start, e.detail.end),
    onTcEditRequest: (e: CustomEvent<ResponseEditRequest>) => {
      if (onEditRequest?.(e.detail) === false) e.preventDefault();
    },
    onTcEditReject: (e: CustomEvent<ResponseEditReject>) => {
      setSettled(edit);
      onEditReject?.(e.detail.edit);
    },
  });
}
