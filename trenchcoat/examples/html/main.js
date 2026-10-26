import "trenchcoat";
import "trenchcoat/tokens.css";

const $ = (s) => document.querySelector(s);
let clicks = 0;
$("#save").addEventListener("click", () => ($("#clicks").textContent = String(++clicks)));

const who = $("#who");
who.options = [
  { value: "ana", label: "Ana Lima", group: "People" },
  { value: "ben", label: "Ben Ito", group: "People" },
  { value: "cy", label: "Cy Park", group: "People" },
];
// Uncontrolled: the element keeps its value; the page mirrors it
who.addEventListener("tc-value-change", (e) => queueMicrotask(() => ($("#value").textContent = JSON.stringify(e.detail.value))));
$("#f").addEventListener("submit", (e) => {
  e.preventDefault();
  $("#submitted").textContent = JSON.stringify(new FormData(e.target).getAll("who"));
});

const table = $("#table");
table.columns = [
  { key: "name", label: "Company", type: "title" },
  { key: "stage", label: "Stage", type: "tag" },
  { key: "arr", label: "ARR", type: "number" },
];
table.rows = [
  { id: "a", name: "Acme", stage: "Lead", arr: 1200 },
  { id: "b", name: "Bolt", stage: "Won", arr: 800 },
];
table.renderCell = (row, col) => (col.key === "arr" ? `€${row.arr}` : undefined);
