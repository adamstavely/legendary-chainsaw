"use client";
import { useState, type FormEvent } from "react";
import { Button, Combobox, DataTable, LookProvider, type ComboboxOption, type DataColumn, type DataRow } from "trenchcoat/react";

const people: ComboboxOption[] = [
  { value: "ana", label: "Ana Lima", group: "People" },
  { value: "ben", label: "Ben Ito", group: "People" },
  { value: "cy", label: "Cy Park", group: "People" },
];
const columns: DataColumn[] = [
  { key: "name", label: "Company", type: "title" },
  { key: "stage", label: "Stage", type: "tag" },
  { key: "arr", label: "ARR", type: "number" },
];
const initialRows: DataRow[] = [
  { id: "a", name: "Acme", stage: "Lead", arr: 1200 },
  { id: "b", name: "Bolt", stage: "Won", arr: 800 },
];
const renderCell = (row: DataRow, col: DataColumn) => (col.key === "arr" ? `€${row.arr}` : undefined);

export function Demo() {
  const [clicks, setClicks] = useState(0);
  const [who, setWho] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<string[] | null>(null);
  const [rows, setRows] = useState(initialRows);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(new FormData(e.currentTarget).getAll("who") as string[]);
  };
  return (
    <main>
      <Button id="save" onClick={() => setClicks((n) => n + 1)}>Save</Button>
      <output id="clicks">{clicks}</output>
      <form id="f" onSubmit={submit}>
        <label htmlFor="who">Reviewers</label>
        <Combobox id="who" name="who" required options={people} value={who} onChange={(next) => setWho(next)} />
        <Button type="submit" variant="secondary">Send</Button>
      </form>
      <output id="value">{JSON.stringify(who)}</output>
      <output id="submitted">{submitted ? JSON.stringify(submitted) : ""}</output>
      <DataTable id="table" title="Accounts" columns={columns} rows={rows} onRowsChange={setRows} renderCell={renderCell} />
      <LookProvider look="clean">
        <Button id="clean" variant="ghost">Clean</Button>
      </LookProvider>
    </main>
  );
}
