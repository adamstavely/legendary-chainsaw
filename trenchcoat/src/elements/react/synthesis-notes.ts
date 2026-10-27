import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSynthesisNotes, type SynthesisExport, type SynthesisNote, type SynthesisNotesChange } from "../synthesis-notes";
import { h, useControlled } from "./internal";

export { DEFAULT_SYNTHESIS_SECTIONS, synthesisMarkdown } from "../synthesis-notes";
export type { SynthesisExport, SynthesisNote, SynthesisSection } from "../synthesis-notes";

const RawSynthesisNotes = createComponent({
  tagName: "tc-synthesis-notes",
  elementClass: TcSynthesisNotes,
  react: React,
  events: {
    onTcNotesChange: "tc-notes-change" as EventName<CustomEvent<SynthesisNotesChange>>,
    onTcExport: "tc-export" as EventName<CustomEvent<SynthesisExport>>,
  },
});
type RawSynthesisNotesProps = React.ComponentProps<typeof RawSynthesisNotes>;

export type SynthesisNotesProps = Omit<RawSynthesisNotesProps, "notes" | "heading" | "noExport" | "onChange" | "onTcNotesChange" | "onTcExport"> & {
  /** The notes (controlled): the lists show exactly these and ask for changes through onChange. Leave it undefined to let the element keep them, starting at `defaultNotes` */
  notes?: SynthesisNote[];
  /** The notes to start with when uncontrolled */
  defaultNotes?: SynthesisNote[];
  /** Called with the whole list after any change, controlled or not */
  onChange?: (notes: SynthesisNote[]) => void;
  /** Shows Export and is called with the notes, their provenance and a Markdown copy when it's pressed */
  onExport?: (data: SynthesisExport) => void;
  /** The heading, and the group's name */
  title?: string;
};

const NO_NOTES: SynthesisNote[] = [];

export function SynthesisNotes({ notes, defaultNotes = NO_NOTES, onChange, onExport, title = "Your notes", ...props }: SynthesisNotesProps) {
  const n = useControlled(notes, defaultNotes, onChange);
  return h(RawSynthesisNotes, {
    ...props,
    heading: title,
    notes: n.value,
    noExport: !onExport,
    onTcNotesChange: (e: CustomEvent<SynthesisNotesChange>) => n.handler(e.detail.notes, e),
    onTcExport: (e: CustomEvent<SynthesisExport>) => onExport?.(e.detail),
  });
}
