import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Button, Combobox, DataTable, LookProvider, Switch } from "trenchcoat/angular";
import { SwitchValueAccessor } from "trenchcoat/angular/forms";
import type { ComboboxOption, DataColumn, DataRow } from "trenchcoat";

@Component({
  selector: "app-root",
  // The wrappers: no CUSTOM_ELEMENTS_SCHEMA, and every binding below is type-checked
  imports: [Button, Combobox, DataTable, LookProvider, Switch, SwitchValueAccessor, FormsModule],
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
      <!-- Angular only: a handler runs once per change, and ngModel drives an element -->
      <output id="changes">{{ changes() }}</output>
      <tc-switch id="notify" label="Notify me" [(ngModel)]="notify"></tc-switch>
      <output id="notify-value">{{ notify }}</output>
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
  changes = signal(0);
  notify = true;

  // Controlled: the app keeps the value and passes it back
  onWho(e: CustomEvent<{ value: string[] }>) {
    e.preventDefault();
    this.changes.update((n) => n + 1);
    this.who.set(e.detail.value);
  }
  onRows(e: CustomEvent<{ rows: DataRow[] }>) {
    e.preventDefault();
    this.rows.set(e.detail.rows);
  }
  submit(e: Event) {
    e.preventDefault();
    this.submitted.set(new FormData(e.target as HTMLFormElement).getAll("who") as string[]);
  }
}
