import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from "@angular/core";
import "trenchcoat";
import type { ComboboxOption, DataColumn, DataRow } from "trenchcoat";

@Component({
  selector: "app-root",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <main>
      <tc-button id="save" label="Save" (click)="clicks.set(clicks() + 1)"></tc-button>
      <output id="clicks">{{ clicks() }}</output>
      <form id="f" (submit)="submit($event)">
        <label for="who">Reviewers</label>
        <tc-combobox id="who" name="who" required [options]="people" [value]="who()" (tc-value-change)="onWho($event)"></tc-combobox>
        <tc-button type="submit" variant="secondary" label="Send"></tc-button>
      </form>
      <output id="value">{{ json(who()) }}</output>
      <output id="submitted">{{ submitted() ? json(submitted()) : "" }}</output>
      <tc-data-table id="table" heading="Accounts" [columns]="columns" [rows]="rows()" [renderCell]="renderCell" (tc-rows-change)="onRows($event)"></tc-data-table>
      <tc-look-provider look="clean">
        <tc-button id="clean" variant="ghost" label="Clean"></tc-button>
      </tc-look-provider>
    </main>
  `,
})
export class AppComponent {
  people: ComboboxOption[] = [
    { value: "ana", label: "Ana Lima", group: "People" },
    { value: "ben", label: "Ben Ito", group: "People" },
    { value: "cy", label: "Cy Park", group: "People" },
  ];
  columns: DataColumn[] = [
    { key: "name", label: "Company", type: "title" },
    { key: "stage", label: "Stage", type: "tag" },
    { key: "arr", label: "ARR", type: "number" },
  ];
  rows = signal<DataRow[]>([
    { id: "a", name: "Acme", stage: "Lead", arr: 1200 },
    { id: "b", name: "Bolt", stage: "Won", arr: 800 },
  ]);
  renderCell = (row: DataRow, col: DataColumn) => (col.key === "arr" ? `€${row.arr}` : undefined);
  clicks = signal(0);
  who = signal<string[]>([]);
  submitted = signal<string[] | null>(null);
  json = (v: unknown) => JSON.stringify(v);

  // Controlled: the app keeps the value and passes it back
  onWho(e: Event) {
    e.preventDefault();
    this.who.set((e as CustomEvent<{ value: string[] }>).detail.value);
  }
  onRows(e: Event) {
    e.preventDefault();
    this.rows.set((e as CustomEvent<{ rows: DataRow[] }>).detail.rows);
  }
  submit(e: Event) {
    e.preventDefault();
    this.submitted.set(new FormData(e.target as HTMLFormElement).getAll("who") as string[]);
  }
}
