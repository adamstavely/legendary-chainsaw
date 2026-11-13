import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFileImport, type FileImportFileChange, type FileImportHeaderRowChange, type FileImportResult } from "../file-import";
import { h, useControlled } from "./internal";

export type {
  FileImportColumn,
  FileImportColumnType,
  FileImportDelimiter,
  FileImportLabels,
  FileImportParser,
  FileImportProblem,
  FileImportProblemKind,
  FileImportResult,
} from "../file-import";

const RawFileImport = createComponent({
  tagName: "tc-file-import",
  elementClass: TcFileImport,
  react: React,
  events: {
    onTcFileChange: "tc-file-change" as EventName<CustomEvent<FileImportFileChange>>,
    onTcHeaderRowChange: "tc-header-row-change" as EventName<CustomEvent<FileImportHeaderRowChange>>,
    onTcParsed: "tc-parsed" as EventName<CustomEvent<FileImportResult>>,
    onTcContinue: "tc-continue" as EventName<CustomEvent<FileImportResult>>,
  },
});
type RawFileImportProps = React.ComponentProps<typeof RawFileImport>;

export type FileImportOwnProps = {
  /** The heading */
  title?: string;
  /** The file being read. Controlled when defined (null for none) – pass back what onFileChange reports */
  file?: File | null;
  /** The starting file when uncontrolled */
  defaultFile?: File | null;
  /** A file was chosen or dropped, or removed */
  onFileChange?: (file: File | null) => void;
  /** Whether the first row is the header row. Controlled when defined */
  headerRow?: boolean;
  /** The starting header-row choice when uncontrolled */
  defaultHeaderRow?: boolean;
  /** "First row is headers" was switched */
  onHeaderRowChange?: (headerRow: boolean) => void;
  /** The file was read: the columns, the data rows and the problems */
  onParsed?: (result: FileImportResult) => void;
  /** Continue was pressed with rows to import */
  onContinue?: (result: FileImportResult) => void;
};
export type FileImportProps = Omit<RawFileImportProps, keyof FileImportOwnProps | "heading" | "onTcFileChange" | "onTcHeaderRowChange" | "onTcParsed" | "onTcContinue"> &
  FileImportOwnProps;

export function FileImport({ title = "Import a spreadsheet", file, defaultFile = null, onFileChange, headerRow, defaultHeaderRow = true, onHeaderRowChange, onParsed, onContinue, ...props }: FileImportProps) {
  const f = useControlled(file, defaultFile, onFileChange);
  const hr = useControlled(headerRow, defaultHeaderRow, onHeaderRowChange);
  return h(RawFileImport, {
    ...props,
    heading: title,
    file: f.value,
    headerRow: hr.value,
    onTcFileChange: (e: CustomEvent<FileImportFileChange>) => f.handler(e.detail.file, e),
    onTcHeaderRowChange: (e: CustomEvent<FileImportHeaderRowChange>) => hr.handler(e.detail.headerRow, e),
    onTcParsed: (e: CustomEvent<FileImportResult>) => onParsed?.(e.detail),
    onTcContinue: (e: CustomEvent<FileImportResult>) => onContinue?.(e.detail),
  });
}
