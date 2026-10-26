<script>
  const people = [
    { value: "ana", label: "Ana Lima", group: "People" },
    { value: "ben", label: "Ben Ito", group: "People" },
    { value: "cy", label: "Cy Park", group: "People" },
  ];
  const columns = [
    { key: "name", label: "Company", type: "title" },
    { key: "stage", label: "Stage", type: "tag" },
    { key: "arr", label: "ARR", type: "number" },
  ];
  let rows = $state([
    { id: "a", name: "Acme", stage: "Lead", arr: 1200 },
    { id: "b", name: "Bolt", stage: "Won", arr: 800 },
  ]);
  const renderCell = (row, col) => (col.key === "arr" ? `€${row.arr}` : undefined);
  let clicks = $state(0);
  let who = $state([]);
  let submitted = $state(null);
  let combo = $state();
  let table = $state();

  // Controlled: the app keeps the value and passes it back. Custom event names have dashes, so they're
  // listened to on the element itself
  $effect(() => {
    const onWho = (e) => {
      e.preventDefault();
      who = e.detail.value;
    };
    const onRows = (e) => {
      e.preventDefault();
      rows = e.detail.rows;
    };
    combo.addEventListener("tc-value-change", onWho);
    table.addEventListener("tc-rows-change", onRows);
    return () => {
      combo.removeEventListener("tc-value-change", onWho);
      table.removeEventListener("tc-rows-change", onRows);
    };
  });
  const submit = (e) => {
    e.preventDefault();
    submitted = new FormData(e.currentTarget).getAll("who");
  };
</script>

<main>
  <tc-button id="save" label="Save" onclick={() => clicks++}></tc-button>
  <output id="clicks">{clicks}</output>
  <form id="f" onsubmit={submit}>
    <label for="who">Reviewers</label>
    <tc-combobox bind:this={combo} id="who" name="who" required options={people} value={$state.snapshot(who)}></tc-combobox>
    <tc-button type="submit" variant="secondary" label="Send"></tc-button>
  </form>
  <output id="value">{JSON.stringify(who)}</output>
  <output id="submitted">{submitted ? JSON.stringify(submitted) : ""}</output>
  <tc-data-table bind:this={table} id="table" heading="Accounts" {columns} rows={$state.snapshot(rows)} {renderCell}></tc-data-table>
  <tc-look-provider look="clean">
    <tc-button id="clean" variant="ghost" label="Clean"></tc-button>
  </tc-look-provider>
</main>
