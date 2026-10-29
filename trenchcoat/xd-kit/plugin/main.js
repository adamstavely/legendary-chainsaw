// Trenchcoat UI kit for Adobe XD: Plugins › Trenchcoat UI Kit › Build kit… asks which categories, looks and themes to
// build, then draws them as artboards – one per category per look and theme – and adds the colours and type scale to
// the Assets panel. The components themselves come from kit/ (made by xd-kit/extract.mjs).
const scenegraph = require("scenegraph");
const commands = require("commands");
const assets = require("assets");
const { selection, root } = scenegraph;
const { localFileSystem } = require("uxp").storage;
const { DEFAULT_FONTS, VARIANT_LABEL, layoutKit, makeBuilder, addAssets } = require("./builder");

const VARIANTS = Object.keys(VARIANT_LABEL);

async function readJson(folder, name) {
  const file = await folder.getEntry(name);
  return JSON.parse(await file.read());
}

const h = (tag, props = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "style") Object.assign(el.style, v);
    else if (k in el) el[k] = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) el.append(typeof c === "string" ? document.createTextNode(c) : c);
  return el;
};

/** The options dialog; resolves with the choices, or null when cancelled */
function ask(index) {
  const cats = index.categories.map((c) => ({ name: c, count: index.components.filter((x) => x.category === c).length }));
  const catBoxes = cats.map((c) => h("input", { type: "checkbox", checked: true, value: c.name }));
  const variantBoxes = VARIANTS.map((v) => h("input", { type: "checkbox", checked: v === "standard-light", value: v }));
  const assetsBox = h("input", { type: "checkbox", checked: true });
  const sans = h("input", { type: "text", value: DEFAULT_FONTS.sans, style: { width: "160px" } });
  const mono = h("input", { type: "text", value: DEFAULT_FONTS.mono, style: { width: "160px" } });
  const total = h("p", { className: "count" });
  const recount = () => {
    const n = index.components.filter((x) => catBoxes.some((b) => b.checked && b.value === x.category)).length;
    const v = variantBoxes.filter((b) => b.checked).length;
    total.textContent = `${n} components × ${v} variant${v === 1 ? "" : "s"} = ${n * v} to draw`;
  };
  [...catBoxes, ...variantBoxes].forEach((b) => b.addEventListener("change", recount));
  recount();
  const all = h("button", { type: "button", "uxp-variant": "secondary", "uxp-quiet": "true" }, "All");
  const none = h("button", { type: "button", "uxp-variant": "secondary", "uxp-quiet": "true" }, "None");
  all.onclick = () => (catBoxes.forEach((b) => (b.checked = true)), recount());
  none.onclick = () => (catBoxes.forEach((b) => (b.checked = false)), recount());
  const cancel = h("button", { type: "reset", "uxp-variant": "secondary" }, "Cancel");
  const ok = h("button", { type: "submit", "uxp-variant": "cta" }, "Build");
  const form = h(
    "form",
    { method: "dialog", style: { width: "520px" } },
    h("h1", {}, "Trenchcoat UI kit"),
    h("hr"),
    h("p", {}, `${index.components.length} components, drawn as layered groups – select one and use Object › Make Component to turn it into an XD component.`),
    h("h2", {}, "Categories"),
    h("div", { className: "row" }, all, none),
    h("div", { className: "row", style: { flexWrap: "wrap" } }, cats.map((c, i) => h("label", { className: "row", style: { width: "240px", alignItems: "center" } }, catBoxes[i], h("span", {}, `${c.name} (${c.count})`)))),
    h("h2", {}, "Looks and themes"),
    h("div", { className: "row", style: { flexWrap: "wrap" } }, VARIANTS.map((v, i) => h("label", { className: "row", style: { width: "240px", alignItems: "center" } }, variantBoxes[i], h("span", {}, VARIANT_LABEL[v])))),
    h("h2", {}, "Fonts"),
    h("label", { className: "row" }, h("span", { style: { width: "60px" } }, "Text"), sans),
    h("label", { className: "row" }, h("span", { style: { width: "60px" } }, "Code"), mono),
    h("label", { className: "row" }, assetsBox, h("span", {}, "Add the colours and type scale to Assets")),
    total,
    h("footer", {}, cancel, ok),
  );
  const dialog = h("dialog", {}, form);
  cancel.onclick = (e) => {
    e.preventDefault();
    dialog.close("reasonCanceled");
  };
  const submit = (e) => {
    e?.preventDefault();
    dialog.close("ok");
  };
  // Enter submits the form; the Build button is clicked
  form.onsubmit = submit;
  ok.onclick = submit;
  document.body.append(dialog);
  return dialog.showModal().then((result) => {
    dialog.remove();
    if (result !== "ok") return null;
    return {
      categories: catBoxes.filter((b) => b.checked).map((b) => b.value),
      variants: variantBoxes.filter((b) => b.checked).map((b) => b.value),
      assets: assetsBox.checked,
      fonts: { sans: sans.value.trim() || DEFAULT_FONTS.sans, mono: mono.value.trim() || DEFAULT_FONTS.mono },
    };
  });
}

/** A small dialog that says what's being drawn; the edit stays open while it shows */
function progress() {
  const line = h("p", {}, "Starting…");
  const bar = h("progress", { max: 1, value: 0, style: { width: "100%" } });
  const dialog = h("dialog", {}, h("form", { method: "dialog", style: { width: "420px" } }, h("h1", {}, "Building the kit"), h("hr"), line, bar));
  document.body.append(dialog);
  const shown = dialog.showModal();
  return {
    set(text, fraction) {
      line.textContent = `${Math.round(fraction * 100)}% – ${text}`;
      bar.value = fraction;
    },
    async close() {
      dialog.close();
      await shown;
      dialog.remove();
    },
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

async function buildKit() {
  const folder = await (await localFileSystem.getPluginFolder()).getEntry("kit");
  const index = await readJson(folder, "index.json");
  const choice = await ask(index);
  if (!choice || !choice.categories.length || !choice.variants.length) return;
  const wanted = index.components.filter((c) => choice.categories.includes(c.category));
  const ui = progress();
  try {
    // Read the components first: the layout needs every size before anything is placed
    const data = new Map();
    for (const [i, c] of wanted.entries()) {
      if (i % 10 === 0) {
        ui.set(`Reading ${c.name}…`, (0.1 * i) / wanted.length);
        await tick();
      }
      data.set(c.slug, await readJson(folder, c.file));
    }
    const byCategory = (cat, variant) =>
      wanted.filter((c) => c.category === cat && data.get(c.slug).variants[variant]).map((c) => ({ slug: c.slug, name: c.name, tree: data.get(c.slug).variants[variant] }));
    const boards = layoutKit(choice.categories, choice.variants, byCategory);
    // To the right of anything already in the document
    let startX = 0;
    root.children.forEach((n) => {
      const b = n.boundsInParent;
      startX = Math.max(startX, b.x + b.width + 400);
    });
    const build = makeBuilder({ scenegraph, commands, selection }, { fonts: choice.fonts });
    const total = boards.reduce((n, b) => n + b.items.length, 0);
    let done = 0;
    for (const b of boards) {
      const ab = build.artboard({ ...b, x: b.x + startX }, root);
      const theme = b.variant.endsWith("dark") ? "dark" : "light";
      for (const item of b.items) {
        ui.set(`${b.category} — ${VARIANT_LABEL[b.variant]}: ${item.name}`, 0.1 + (0.9 * done) / total);
        await tick();
        build.component(item, ab, b.variant, theme);
        done++;
      }
    }
    if (choice.assets) {
      ui.set("Adding colours and text styles…", 1);
      await tick();
      addAssets({ scenegraph, assets }, await readJson(folder, "tokens.json"), { fonts: choice.fonts });
    }
    selection.items = [];
    const s = build.stats;
    console.log(`Trenchcoat kit: ${boards.length} artboards, ${done} components, ${s.nodes} layers in ${s.groups} groups and ${s.masks} masks`);
  } finally {
    await ui.close();
  }
}

module.exports = { commands: { buildKit } };
