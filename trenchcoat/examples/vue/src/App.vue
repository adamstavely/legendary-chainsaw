<script setup lang="ts">
import { ref } from "vue";
import type { ComboboxOption, DataColumn, DataRow } from "trenchcoat";

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
const rows = ref<DataRow[]>([
  { id: "a", name: "Acme", stage: "Lead", arr: 1200 },
  { id: "b", name: "Bolt", stage: "Won", arr: 800 },
]);
const renderCell = (row: DataRow, col: DataColumn) => (col.key === "arr" ? `€${row.arr}` : undefined);

const clicks = ref(0);
const who = ref<string[]>([]);
const submitted = ref<string[] | null>(null);
// Controlled: the app keeps the value and passes it back
const onWho = (e: CustomEvent<{ value: string[] }>) => {
  e.preventDefault();
  who.value = e.detail.value;
};
const onRows = (e: CustomEvent<{ rows: DataRow[] }>) => {
  e.preventDefault();
  rows.value = e.detail.rows;
};
const submit = (e: Event) => {
  submitted.value = new FormData(e.target as HTMLFormElement).getAll("who") as string[];
};
</script>

<template>
  <main>
    <tc-button id="save" label="Save" @click="clicks++"></tc-button>
    <output id="clicks">{{ clicks }}</output>
    <form id="f" @submit.prevent="submit">
      <label for="who">Reviewers</label>
      <tc-combobox id="who" name="who" required :options="people" :value="who" @tc-value-change="onWho"></tc-combobox>
      <tc-button type="submit" variant="secondary" label="Send"></tc-button>
    </form>
    <output id="value">{{ JSON.stringify(who) }}</output>
    <output id="submitted">{{ submitted ? JSON.stringify(submitted) : "" }}</output>
    <tc-data-table id="table" heading="Accounts" :columns="columns" :rows="rows" :renderCell="renderCell" @tc-rows-change="onRows"></tc-data-table>
    <tc-look-provider look="clean">
      <tc-button id="clean" variant="ghost" label="Clean"></tc-button>
    </tc-look-provider>
  </main>
</template>
