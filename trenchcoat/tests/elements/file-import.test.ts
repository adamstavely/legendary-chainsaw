/*
 * <tc-file-import> in real browsers: the CSV parser and delimiter sniffing, a file read into columns with their types
 * and problems in words, the header-row switch, drop and choose as a cancelable change, Excel through the page's
 * parser, Continue, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/file-import";
import { guessColumnType, parseDelimited, readGrid, sniffDelimiter, type FileImportResult, type TcFileImport } from "../../src/elements/file-import";
import { FileImport } from "../../src/elements/react/file-import";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const CSV = [
  "Vendor name,Contact email,Country,Contract start,Annual spend,Notes",
  "Kestrel Lab Supplies,orders@kestrel-lab.example,United Kingdom,2024-03-01,48200,",
  "Harbour Analytics,accounts@harbour-analytics.example,Netherlands,2023-11-15,126500,",
  "Tidewater Field Kits,team@tidewater.example,Australia,2025-04-12",
  '"Marlow & Finch, Archives",billing@marlowfinch.example,Ireland,2022-07-19,8400,',
].join("\r\n");
const csvFile = (text = CSV, name = "vendors.csv") => new File([text], name, { type: "text/csv" });

const make = (file: File | null = null) => fixture<TcFileImport>(html`<tc-file-import heading="Import vendors" .file=${file}></tc-file-import>`);
const ready = async (el: TcFileImport) => {
  await expect.poll(() => el.parsed !== null).toBe(true);
  await settle();
};
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
/** Chooses a file through the hidden file input, as the picker would */
const pick = (el: Element, file: File) => {
  const dt = new DataTransfer();
  dt.items.add(file);
  const input = el.querySelector<HTMLInputElement>('input[type="file"]')!;
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
};
const drop = (el: Element, file: File) => {
  const dt = new DataTransfer();
  dt.items.add(file);
  const area = el.querySelector(".ui-fim__drop")!;
  area.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: dt }));
  area.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
};

describe("tc-file-import", () => {
  test("parseDelimited: quoted fields, doubled quotes, line breaks in quotes, CRLF and blank lines", () => {
    expect(parseDelimited('a,"b, c","say ""hi"""\r\n1,"two\nlines",3\n\n', ",")).toEqual([
      ["a", "b, c", 'say "hi"'],
      ["1", "two\nlines", "3"],
    ]);
    expect(parseDelimited("x;y\n1;2", ";")).toEqual([
      ["x", "y"],
      ["1", "2"],
    ]);
  });

  test("sniffDelimiter and guessColumnType", () => {
    expect(sniffDelimiter("a;b;c\n1;2;3\n4;5;6")).toBe(";");
    expect(sniffDelimiter("a\tb\n1\t2")).toBe("\t");
    expect(sniffDelimiter("name,note\nx,a;b")).toBe(",");
    expect(guessColumnType(["", " "])).toBe("empty");
    expect(guessColumnType(["a@b.example", "c@d.example", ""])).toBe("email");
    expect(guessColumnType(["1,204.50", "-3", "12%"])).toBe("number");
    expect(guessColumnType(["2024-03-01", "12 Oct 2026", "11/04/2025"])).toBe("date");
    expect(guessColumnType(["2024-03-01", "soon"])).toBe("text");
  });

  test("readGrid: header names, problems in words – ragged rows, empty columns, a header named twice", () => {
    const r = readGrid(
      [
        ["Name", "Email", "Email", "Notes"],
        ["A", "a@x.example", "", ""],
        ["B", "b@x.example", ""],
      ],
      true,
    );
    expect(r.columns.map((c) => `${c.name}:${c.type}`)).toEqual(["Name:text", "Email:email", "Email:empty", "Notes:empty"]);
    expect(r.problems.map((p) => p.kind)).toEqual(["ragged", "empty-column", "duplicate-header"]);
    expect(r.problems[0].message).toBe("1 row has a different number of cells than the header: row 3");
    expect(r.problems[1].message).toBe("“Email” and “Notes” are empty");
    expect(r.problems[2].message).toBe("“Email” is in the header row twice");
    expect(readGrid([["a", "b"]], false).columns.map((c) => c.name)).toEqual(["Column 1", "Column 2"]);
    expect(readGrid([["a", "b"]], true).problems[0].message).toBe("The file has a header row but no rows under it");
  });

  test("the host is the root, in both looks; with no file, a drop area that opens the picker", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe("fim");
    expect(el.dataset.look).toBe("standard");
    const area = el.querySelector<HTMLButtonElement>(".ui-fim__drop")!;
    expect(area.textContent).toContain("Drop a spreadsheet here or browse");
    expect(document.getElementById(area.getAttribute("aria-describedby")!)!.textContent).toBe("CSV, TSV or Excel");
    const input = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    area.click();
    expect(click).toHaveBeenCalled();
    expect(el.querySelector(".ui-fim__foot")).toBeNull();
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
  });

  test("a file is read: what was found in words, the preview with column types, problems and a status", async () => {
    const parsed = listen<FileImportResult>(document.body, "tc-parsed");
    const el = await make(csvFile());
    await ready(el);
    expect(el.querySelector(".ui-fim__name")!.textContent).toBe("vendors.csv");
    expect(el.querySelector(".ui-fim__meta")!.textContent).toMatch(/B · 4 rows · 6 columns · Comma-separated · UTF-8$/);
    const heads = [...el.querySelectorAll("thead th")].slice(1).map((th) => th.textContent!.replace(/\s+/g, " ").trim());
    expect(heads).toEqual(["Vendor name, Text", "Contact email, Email", "Country, Text", "Contract start, Date", "Annual spend, Number", "Notes, Empty"]);
    expect(el.querySelectorAll("tbody tr")).toHaveLength(4);
    expect(el.querySelector("tbody tr:nth-child(4) td")!.textContent).toBe("Marlow & Finch, Archives");
    expect(el.querySelector("tbody tr[data-ragged] th")!.textContent).toContain("4, different number of cells");
    const problems = [...el.querySelectorAll(".ui-fim__problem")].map((p) => p.textContent!.trim());
    expect(problems).toEqual(["1 row has a different number of cells than the header: row 4", "“Notes” is empty"]);
    expect(el.querySelector(".ui-fim__problems")!.getAttribute("aria-label")).toBe("2 problems");
    expect(el.querySelector("caption")!.textContent).toBe("All 4 rows");
    expect(status(el)).toBe("vendors.csv read: 4 rows, 6 columns, 2 problems");
    expect(parsed).toHaveLength(1);
    expect(parsed[0].rows[0][0]).toBe("Kestrel Lab Supplies");
    expect(parsed[0].delimiter).toBe(",");
    expect(el.querySelector(".ui-fim__summary")!.textContent).toBe("4 rows ready to map");
  });

  test("the preview stops at preview-rows; a TSV is read with tabs and a byte-order mark is noted", async () => {
    const rows = Array.from({ length: 30 }, (_, i) => `Vendor ${i}\tv${i}@x.example`);
    const el = await fixture<TcFileImport>(html`<tc-file-import preview-rows="5" .file=${new File(["﻿Name\tEmail\n" + rows.join("\n")], "list.tsv")}></tc-file-import>`);
    await ready(el);
    expect(el.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(el.querySelector("caption")!.textContent).toBe("First 5 of 30 rows");
    expect(el.querySelector(".ui-fim__meta")!.textContent).toContain("Tab-separated · UTF-8 with a byte-order mark");
    expect(el.querySelector("thead th:nth-child(2)")!.textContent).toContain("Name");
  });

  test("“First row is headers”: a cancelable change; off, the header is read as data", async () => {
    const el = await make(csvFile());
    await ready(el);
    const box = el.querySelector<HTMLInputElement>(".ui-fim__check input")!;
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-header-row-change", stop);
    box.click();
    await settle();
    expect(el.headerRow).toBe(true);
    expect(box.checked).toBe(true);
    el.removeEventListener("tc-header-row-change", stop);
    const seen = listen<{ headerRow: boolean }>(el, "tc-header-row-change");
    box.click();
    await settle();
    expect(seen).toEqual([{ headerRow: false }]);
    expect(el.headerRow).toBe(false);
    expect(el.parsed!.rows).toHaveLength(5);
    expect(el.querySelector("thead th:nth-child(2)")!.textContent).toContain("Column 1");
    expect(status(el)).toBe("5 rows with no header row");
  });

  test("dropping a file: a cancelable tc-file-change, then it's read; Choose another file keeps the picker", async () => {
    const el = await make();
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-file-change", stop);
    drop(el, csvFile());
    await settle();
    expect(el.file).toBeNull();
    el.removeEventListener("tc-file-change", stop);
    const seen = listen<{ file: File | null }>(el, "tc-file-change");
    drop(el, csvFile("a,b\n1,2", "small.csv"));
    await ready(el);
    expect(seen.map((d) => d.file?.name)).toEqual(["small.csv"]);
    expect(el.parsed!.rows).toEqual([["1", "2"]]);
    expect(el.querySelector(".ui-fim__another")!.textContent).toBe("Choose another file");
    expect(el.querySelector('input[type="file"]')).not.toBeNull();
  });

  test("an Excel file: the page's parser reads it; without one, the error says what to do", async () => {
    const xlsx = new File(["PK"], "vendors.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const el = await make(xlsx);
    await expect.poll(() => el.querySelector(".ui-fim__error")?.textContent?.trim()).toBe("Excel workbooks can't be read here – save the sheet as CSV and choose it again.");
    expect(el.querySelector(".ui-fim__error")!.getAttribute("role")).toBe("alert");
    const parse = vi.fn(async () => [
      ["Name", "Spend"],
      ["Kestrel", 4800 as unknown as string],
    ]);
    const el2 = await fixture<TcFileImport>(html`<tc-file-import .parse=${parse} .file=${xlsx}></tc-file-import>`);
    await ready(el2);
    expect(parse).toHaveBeenCalledWith(xlsx, expect.any(AbortSignal));
    expect(el2.parsed!.rows).toEqual([["Kestrel", "4800"]]);
    expect(el2.parsed!.delimiter).toBeNull();
    expect(el2.querySelector(".ui-fim__meta")!.textContent).toContain("Read by the page");
  });

  test("Continue hands over what was read; with no rows it's held and says why", async () => {
    const el = await make(csvFile("Name,Email"));
    await ready(el);
    const go = el.querySelector<HTMLButtonElement>(".ui-fim__continue")!;
    expect(go.getAttribute("aria-disabled")).toBe("true");
    expect(document.getElementById(go.getAttribute("aria-describedby")!)!.textContent).toBe("No rows to import");
    const seen = listen<FileImportResult>(el, "tc-continue");
    go.click();
    await settle();
    expect(seen).toHaveLength(0);
    expect(status(el)).toBe("No rows to import");
    el.file = csvFile();
    await expect.poll(() => el.parsed?.rows.length).toBe(4);
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-fim__continue")!.click();
    expect(seen).toHaveLength(1);
    expect(seen[0].columns).toHaveLength(6);
  });

  test("labels rename the words", async () => {
    const el = await fixture<TcFileImport>(html`<tc-file-import .labels=${{ browse: "parcourir", hint: "CSV ou TSV" }}></tc-file-import>`);
    expect(el.querySelector(".ui-fim__browse")!.textContent).toBe("parcourir");
    expect(el.querySelector(".ui-fim__hint")!.textContent).toBe("CSV ou TSV");
  });

  test("React wrapper: an uncontrolled file survives a parent re-render; a controlled header row stays with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onFileChange = vi.fn();
    const onParsed = vi.fn();
    const onHeaderRowChange = vi.fn();
    const draw = (n: number) => root.render(React.createElement(FileImport, { title: `Import ${n}`, defaultFile: csvFile(), headerRow: true, onFileChange, onParsed, onHeaderRowChange }));
    await act(async () => draw(1));
    const el = host.querySelector("tc-file-import")!;
    await ready(el);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Import 1");
    await expect.poll(() => onParsed.mock.calls.length).toBe(1);
    await act(async () => pick(el, csvFile("a,b\n1,2", "small.csv")));
    expect(onFileChange).toHaveBeenCalledWith(expect.objectContaining({ name: "small.csv" }));
    await act(async () => draw(2));
    await expect.poll(() => el.file?.name).toBe("small.csv");
    await expect.poll(() => el.parsed?.rows.length).toBe(1);
    await settle();
    await act(async () => el.querySelector<HTMLInputElement>(".ui-fim__check input")!.click());
    await settle();
    expect(onHeaderRowChange).toHaveBeenCalledWith(false);
    expect(el.headerRow).toBe(true);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-file-import look=${look} description="Rows become vendor records" .file=${csvFile()}></tc-file-import>
            <div style="width: 340px"><tc-file-import look=${look}></tc-file-import></div>
          </div>`,
        );
        await ready(wrap.querySelector("tc-file-import")!);
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
