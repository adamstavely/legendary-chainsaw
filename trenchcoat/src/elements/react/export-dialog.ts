import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcExportDialog,
  type ExportDialogOpenChange,
  type ExportEmailMeChange,
  type ExportFormat,
  type ExportFormatChange,
  type ExportRequest,
  type ExportRows,
  type ExportRowsChange,
  type ExportSelectedColumnsChange,
} from "../export-dialog";
import { h, useControlled } from "./internal";

export type {
  ExportColumn,
  ExportCounts,
  ExportDialogLabels,
  ExportDialogOpenChange,
  ExportEmailMeChange,
  ExportFormat,
  ExportFormatChange,
  ExportRequest,
  ExportRows,
  ExportRowsChange,
  ExportSelectedColumnsChange,
  ExportStatus,
} from "../export-dialog";
export { defaultExportDialogLabels, exportFileSize } from "../export-dialog";

const RawExportDialog = createComponent({
  tagName: "tc-export-dialog",
  elementClass: TcExportDialog,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<ExportDialogOpenChange>>,
    onTcFormatChange: "tc-format-change" as EventName<CustomEvent<ExportFormatChange>>,
    onTcRowsChange: "tc-rows-change" as EventName<CustomEvent<ExportRowsChange>>,
    onTcSelectedColumnsChange: "tc-selected-columns-change" as EventName<CustomEvent<ExportSelectedColumnsChange>>,
    onTcEmailMeChange: "tc-email-me-change" as EventName<CustomEvent<ExportEmailMeChange>>,
    onTcExport: "tc-export" as EventName<CustomEvent<ExportRequest>>,
    onTcExportCancel: "tc-export-cancel" as EventName<CustomEvent<Record<string, never>>>,
  },
});
type RawProps = React.ComponentProps<typeof RawExportDialog>;
type Owned =
  | "heading"
  | "open"
  | "format"
  | "rows"
  | "selectedColumns"
  | "emailMe"
  | "onTcOpenChange"
  | "onTcFormatChange"
  | "onTcRowsChange"
  | "onTcSelectedColumnsChange"
  | "onTcEmailMeChange"
  | "onTcExport"
  | "onTcExportCancel"
  | "children";
export type ExportDialogProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Export" */
  title?: string;
  /** Whether the dialog is open – controlled when given */
  open?: boolean;
  /** Open on mount when `open` isn't controlled */
  defaultOpen?: boolean;
  /** The dialog was opened or closed */
  onOpenChange?: (open: boolean) => void;
  /** The format – controlled when given */
  format?: ExportFormat;
  /** The format on mount when `format` isn't controlled (default "csv") */
  defaultFormat?: ExportFormat;
  /** A format was picked */
  onFormatChange?: (format: ExportFormat) => void;
  /** Which rows – controlled when given */
  rows?: ExportRows;
  /** Which rows on mount when `rows` isn't controlled (default "all") */
  defaultRows?: ExportRows;
  /** Which rows was picked */
  onRowsChange?: (rows: ExportRows) => void;
  /** The ids of the columns to export – controlled when given */
  selectedColumns?: string[];
  /** The columns on mount when `selectedColumns` isn't controlled (default all) */
  defaultSelectedColumns?: string[];
  /** The columns changed */
  onSelectedColumnsChange?: (selectedColumns: string[]) => void;
  /** Whether to email the file – controlled when given */
  emailMe?: boolean;
  /** "Email me" was ticked or unticked */
  onEmailMeChange?: (emailMe: boolean) => void;
  /** Export or Retry was pressed: start the export and set `status` */
  onExport?: (request: ExportRequest) => void;
  /** Cancel was pressed while preparing: stop the export */
  onExportCancel?: () => void;
};

export function ExportDialog({
  title,
  open,
  defaultOpen = false,
  onOpenChange,
  format,
  defaultFormat = "csv",
  onFormatChange,
  rows,
  defaultRows = "all",
  onRowsChange,
  selectedColumns,
  defaultSelectedColumns,
  onSelectedColumnsChange,
  emailMe,
  onEmailMeChange,
  onExport,
  onExportCancel,
  ...props
}: ExportDialogProps) {
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange);
  const f = useControlled<ExportFormat>(format, defaultFormat, onFormatChange);
  const r = useControlled<ExportRows>(rows, defaultRows, onRowsChange);
  const c = useControlled<string[] | undefined>(selectedColumns, defaultSelectedColumns, onSelectedColumnsChange as ((next: string[] | undefined) => void) | undefined);
  const e = useControlled<boolean | undefined>(emailMe, undefined, onEmailMeChange as ((next: boolean | undefined) => void) | undefined);
  return h(RawExportDialog, {
    ...props,
    heading: title ?? "Export",
    open: o.value,
    format: f.value,
    rows: r.value,
    selectedColumns: c.value,
    emailMe: e.value,
    onTcOpenChange: (ev: CustomEvent<ExportDialogOpenChange>) => o.handler(ev.detail.open, ev),
    onTcFormatChange: (ev: CustomEvent<ExportFormatChange>) => f.handler(ev.detail.format, ev),
    onTcRowsChange: (ev: CustomEvent<ExportRowsChange>) => r.handler(ev.detail.rows, ev),
    onTcSelectedColumnsChange: (ev: CustomEvent<ExportSelectedColumnsChange>) => c.handler(ev.detail.selectedColumns, ev),
    onTcEmailMeChange: (ev: CustomEvent<ExportEmailMeChange>) => e.handler(ev.detail.emailMe, ev),
    onTcExport: (ev: CustomEvent<ExportRequest>) => onExport?.(ev.detail),
    onTcExportCancel: () => onExportCancel?.(),
  });
}
