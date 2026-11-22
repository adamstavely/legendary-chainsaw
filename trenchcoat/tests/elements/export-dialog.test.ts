/*
 * <tc-export-dialog> in real browsers: opening as a modal, format, rows with counts and disabled choices, columns with
 * required ones, Email me and its threshold, Export's request, the statuses the page drives (preparing, ready, emailed,
 * failed) with announcements and focus, closing and focus return, cancelable events, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/export-dialog";
import { exportFileSize, type ExportColumn, type ExportRequest, type TcExportDialog } from "../../src/elements/export-dialog";
import { ExportDialog } from "../../src/elements/react/export-dialog";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const COLUMNS: ExportColumn[] = [
  { id: "id", label: "Case", required: true },
  { id: "reviewer", label: "Reviewer" },
  { id: "risk", label: "Risk score" },
  { id: "status", label: "Status" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const dialog = (el: Element) => el.querySelector<HTMLDialogElement>(".ui-exd__dialog")!;
const radios = (el: Element, name: "format" | "rows") => [...el.querySelectorAll<HTMLInputElement>(`input[type=radio][name$="-${name}"]`)];
const columnBoxes = (el: Element) => [...el.querySelectorAll<HTMLInputElement>(".ui-exd__column input")];
const primary = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-exd__footer .ui-exd__primary")!;
const make = (counts = { selected: 12, filtered: 340, all: 12480 }) =>
  fixture<TcExportDialog>(html`<tc-export-dialog .counts=${counts} .columns=${COLUMNS} email="noor@ledgerline.example" locale="en-US"></tc-export-dialog>`);

describe("tc-export-dialog", () => {
  test("opens as a named modal with the formats, rows with counts and the columns", async () => {
    const opener = document.body.appendChild(document.createElement("button"));
    opener.focus();
    const el = await make();
    expect(el.dataset.ui).toBe("exd");
    expect(dialog(el).open).toBe(false);
    el.open = true;
    await settle();
    expect(dialog(el).open).toBe(true);
    expect(text(document.getElementById(dialog(el).getAttribute("aria-labelledby")!))).toBe("Export");
    expect(radios(el, "format").map((r) => r.value)).toEqual(["csv", "xlsx", "pdf"]);
    expect([...el.querySelectorAll(".ui-exd__format-name")].map(text)).toEqual(["CSV", "Excel", "PDF"]);
    expect([...el.querySelectorAll(".ui-exd__row")].map(text)).toEqual(["Selected rows 12", "Rows matching the filters 340", "All rows 12,480"]);
    expect(radios(el, "rows").find((r) => r.checked)!.value).toBe("all");
    expect(columnBoxes(el).map((b) => b.checked)).toEqual([true, true, true, true]);
    expect(columnBoxes(el)[0]!.disabled).toBe(true);
    expect(text(el.querySelector(".ui-exd__legend .ui-exd__count"))).toBe("4 of 4");
    // Closing returns focus to what opened it
    el.querySelector<HTMLButtonElement>(".ui-exd__close")!.click();
    await settle();
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  test("a choice with no rows is disabled and says why", async () => {
    const el = await make({ selected: 0, all: 80 } as never);
    el.open = true;
    await settle();
    const [sel, fil, all] = radios(el, "rows");
    expect(sel!.disabled).toBe(true);
    expect(fil!.disabled).toBe(true);
    expect(all!.disabled).toBe(false);
    expect(text(document.getElementById(sel!.getAttribute("aria-describedby")!))).toBe("Nothing is selected");
    expect(text(document.getElementById(fil!.getAttribute("aria-describedby")!))).toBe("No filters are applied");
  });

  test("picking a format, rows and columns fires their events; Export sends the request", async () => {
    const el = await make();
    el.open = true;
    await settle();
    const got: string[] = [];
    el.addEventListener("tc-format-change", (e) => got.push(`format=${(e as CustomEvent).detail.format}`));
    el.addEventListener("tc-rows-change", (e) => got.push(`rows=${(e as CustomEvent).detail.rows}`));
    el.addEventListener("tc-selected-columns-change", (e) => got.push(`columns=${(e as CustomEvent).detail.selectedColumns.join("|")}`));
    const requests: ExportRequest[] = [];
    el.addEventListener("tc-export", (e) => requests.push((e as CustomEvent<ExportRequest>).detail));
    radios(el, "format")[1]!.click();
    radios(el, "rows")[1]!.click();
    columnBoxes(el)[2]!.click();
    await settle();
    expect(got).toEqual(["format=xlsx", "rows=filtered", "columns=id|reviewer|status"]);
    expect(text(el.querySelector(".ui-exd__legend .ui-exd__count"))).toBe("3 of 4");
    primary(el).click();
    expect(requests).toEqual([{ format: "xlsx", rows: "filtered", columns: ["id", "reviewer", "status"], emailMe: false }]);
    // Select none keeps the required column; Select all brings the rest back
    const [all, none] = [...el.querySelectorAll<HTMLButtonElement>(".ui-exd__link")];
    none!.click();
    await settle();
    expect(el.exportColumns).toEqual(["id"]);
    all!.click();
    await settle();
    expect(el.exportColumns).toEqual(["id", "reviewer", "risk", "status"]);
  });

  test("Email me starts ticked above the threshold, and can be changed", async () => {
    const el = await make();
    el.open = true;
    await settle();
    const box = () => el.querySelector<HTMLInputElement>(".ui-exd__email input")!;
    expect(text(el.querySelector(".ui-exd__email"))).toContain("Email me at noor@ledgerline.example when it's ready");
    expect(box().checked).toBe(true); // all 12,480 rows
    radios(el, "rows")[0]!.click();
    await settle();
    expect(box().checked).toBe(false); // 12 rows
    box().click();
    await settle();
    expect(el.emailMe).toBe(true);
    const requests: ExportRequest[] = [];
    el.addEventListener("tc-export", (e) => requests.push((e as CustomEvent<ExportRequest>).detail));
    primary(el).click();
    expect(requests[0]!.emailMe).toBe(true);
    const plain = await fixture<TcExportDialog>(html`<tc-export-dialog open .counts=${{ all: 3 }} .columns=${COLUMNS}></tc-export-dialog>`);
    await settle();
    expect(plain.querySelector(".ui-exd__email")).toBeNull();
  });

  test("the page drives preparing, ready, emailed and failed – each announced, with focus on its main button", async () => {
    const el = await make();
    el.open = true;
    await settle();
    const status = () => text(el.querySelector('[role="status"]'));
    let cancelled = 0;
    el.addEventListener("tc-export-cancel", () => cancelled++);
    el.status = "preparing";
    el.progress = 0.42;
    await settle();
    const bar = el.querySelector(".ui-exd__bar")!;
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("42");
    expect(status()).toBe("Preparing your export…");
    expect(document.activeElement).toBe(el.querySelector(".ui-exd__main"));
    (document.activeElement as HTMLElement).click();
    expect(cancelled).toBe(1);
    el.progress = undefined;
    await settle();
    expect(bar.hasAttribute("aria-valuenow")).toBe(false);
    expect(bar.hasAttribute("data-indeterminate")).toBe(true);

    el.downloadUrl = "blob:fake";
    el.fileName = "cases-2026-11-21.xlsx";
    el.fileSize = 48_300;
    el.status = "ready";
    await settle();
    const link = el.querySelector<HTMLAnchorElement>("a.ui-exd__main")!;
    expect(document.activeElement).toBe(link);
    expect(link.getAttribute("href")).toBe("blob:fake");
    expect(link.getAttribute("download")).toBe("cases-2026-11-21.xlsx");
    expect(text(link)).toBe("Download cases-2026-11-21.xlsx");
    expect(text(el.querySelector(".ui-exd__file"))).toBe("cases-2026-11-21.xlsx 47 KB");
    expect(status()).toBe("Your export is ready: cases-2026-11-21.xlsx");

    el.status = "emailed";
    await settle();
    expect(status()).toBe("We'll email noor@ledgerline.example when it's ready.");

    const requests: ExportRequest[] = [];
    el.addEventListener("tc-export", (e) => requests.push((e as CustomEvent<ExportRequest>).detail));
    el.error = "The server took too long.";
    el.status = "failed";
    await settle();
    expect(status()).toBe("The export didn't finish. The server took too long.");
    expect(text(document.activeElement)).toBe("Retry");
    (document.activeElement as HTMLElement).click();
    expect(requests).toHaveLength(1);
  });

  test("Escape and a click on the backdrop close it; prevented events keep the state", async () => {
    const el = await make();
    el.open = true;
    await settle();
    dialog(el).dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    expect(el.open).toBe(false);
    el.open = true;
    await settle();
    dialog(el).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(el.open).toBe(false);
    el.open = true;
    await settle();
    for (const n of ["open", "format", "rows", "selected-columns"]) el.addEventListener(`tc-${n}-change`, (e) => e.preventDefault());
    radios(el, "format")[2]!.click();
    columnBoxes(el)[1]!.click();
    el.querySelector<HTMLButtonElement>(".ui-exd__close")!.click();
    await settle();
    expect(el.open).toBe(true);
    expect(el.format).toBe("csv");
    expect(el.exportColumns).toHaveLength(4);
    expect(radios(el, "format")[0]!.checked).toBe(true);
  });

  test("file sizes read for people", () => {
    expect(exportFileSize(900)).toBe("900 bytes");
    expect(exportFileSize(48_300, "en-US")).toBe("47 KB");
    expect(exportFileSize(3_500_000, "en-US")).toBe("3.3 MB");
  });
});

describe("React", () => {
  test("open is controlled; an uncontrolled format survives re-renders; onExport gets the request", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const requests: ExportRequest[] = [];
    let asked: boolean | undefined;
    const node = (extra = {}) =>
      React.createElement(ExportDialog, { counts: { all: 40 }, columns: COLUMNS, onExport: (r: ExportRequest) => requests.push(r), open: true, onOpenChange: (o: boolean) => (asked = o), ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcExportDialog>("tc-export-dialog")!;
    expect(dialog(el).open).toBe(true);
    await act(async () => radios(el, "format")[2]!.click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.format).toBe("pdf");
    await act(async () => primary(el).click());
    expect(requests[0]).toEqual({ format: "pdf", rows: "all", columns: ["id", "reviewer", "risk", "status"], emailMe: false });
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-exd__close")!.click());
    await settle();
    expect(asked).toBe(false);
    expect(el.open).toBe(true);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}, the form and the ready state`, async () => {
        const wrap = await fixture<HTMLElement>(
          html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}>
            <tc-export-dialog look=${look} description="Fraud-review cases" .counts=${{ selected: 0, filtered: 340, all: 12480 }} .columns=${COLUMNS} email="noor@ledgerline.example"></tc-export-dialog>
          </div>`,
        );
        const el = wrap.querySelector<TcExportDialog>("tc-export-dialog")!;
        el.open = true;
        await finish(wrap);
        let { violations } = await axe.run(dialog(el));
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
        el.fileName = "cases.csv";
        el.fileSize = 2048;
        el.downloadUrl = "blob:x";
        el.status = "ready";
        await finish(wrap);
        ({ violations } = await axe.run(dialog(el)));
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
