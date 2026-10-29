/*
 * <tc-bibliography> in real browsers: the formatter in each style against hand-checked strings, BibTeX and RIS, the
 * list (style, sort, search, ticking, Copy, Export with its menu), the React wrapper and axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/bibliography";
import {
  formatReference,
  toBibTeX,
  toRIS,
  type BibliographyCopy,
  type BibliographyExport,
  type Reference,
  type TcBibliography,
} from "../../src/elements/bibliography";
import { Bibliography } from "../../src/elements/react/bibliography";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ARTICLE: Reference = {
  id: "okafor2021",
  type: "article",
  authors: [
    { family: "Okafor", given: "Miriam" },
    { family: "Tran", given: "Linh" },
  ],
  title:
    "Rubble stabilisation and early coral recruitment on degraded reef flats",
  container: "Journal of Reef Restoration",
  year: 2021,
  volume: 14,
  issue: 2,
  pages: "112-129",
  doi: "10.5555/jrr.2021.0142",
  tags: ["substrate"],
};
const BOOK: Reference = {
  id: "haddad2019",
  type: "book",
  authors: [{ family: "Haddad", given: "Rami" }],
  title: "Gardening the sea: A practical guide to coral nurseries",
  publisher: "Harbour Lane Press",
  year: 2019,
};
const FOUR: Reference = {
  id: "silva2023",
  type: "article",
  authors: [
    { family: "Silva", given: "João Pedro" },
    { family: "Mensah", given: "Ama" },
    { family: "Lindqvist", given: "Mira" },
    { family: "Okafor", given: "Miriam" },
  ],
  title: "Heat-tolerant fragments outgrow nursery controls",
  container: "Coral Ecology Letters",
  year: 2023,
  volume: 8,
  issue: 4,
  pages: "455–470",
  doi: "https://doi.org/10.5555/cel.2023.0084",
};
const WEB: Reference = {
  id: "web",
  type: "web",
  authors: [{ family: "Mensah", given: "Ama" }],
  title: "Training volunteer divers",
  container: "Reef Volunteers Network",
  year: 2024,
  url: "https://example.org/guides/divers",
  accessed: "2026-09-14",
};
const REFS = [ARTICLE, BOOK, FOUR, WEB];

const text = (el: Element | null | undefined) =>
  (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const make = (look = "standard") =>
  fixture<TcBibliography>(
    html`<tc-bibliography
      look=${look}
      heading="Reading list"
      .references=${REFS}
    ></tc-bibliography>`,
  );
const entries = (el: Element) =>
  [...el.querySelectorAll(".ui-bib__entry")].map(
    (e) => (e as HTMLElement).dataset.id,
  );

describe("formatReference", () => {
  test("APA 7", () => {
    expect(formatReference(ARTICLE, "apa")).toBe(
      "Okafor, M., & Tran, L. (2021). Rubble stabilisation and early coral recruitment on degraded reef flats. Journal of Reef Restoration, 14(2), 112–129. https://doi.org/10.5555/jrr.2021.0142",
    );
    expect(formatReference(BOOK, "apa")).toBe(
      "Haddad, R. (2019). Gardening the sea: A practical guide to coral nurseries. Harbour Lane Press.",
    );
    expect(formatReference(FOUR, "apa")).toMatch(
      /^Silva, J\. P\., Mensah, A\., Lindqvist, M\., & Okafor, M\. \(2023\)\./,
    );
    expect(formatReference({ ...BOOK, year: undefined }, "apa")).toContain(
      "(n.d.)",
    );
  });
  test("MLA 9", () => {
    expect(formatReference(ARTICLE, "mla")).toBe(
      "Okafor, Miriam, and Linh Tran. “Rubble stabilisation and early coral recruitment on degraded reef flats.” Journal of Reef Restoration, vol. 14, no. 2, 2021, pp. 112–129. https://doi.org/10.5555/jrr.2021.0142.",
    );
    expect(formatReference(BOOK, "mla")).toBe(
      "Haddad, Rami. Gardening the sea: A practical guide to coral nurseries. Harbour Lane Press, 2019.",
    );
    expect(formatReference(FOUR, "mla")).toMatch(
      /^Silva, João Pedro, et al\. “/,
    );
    expect(formatReference(WEB, "mla")).toContain(
      "Accessed 14 September 2026.",
    );
  });
  test("Chicago", () => {
    expect(formatReference(ARTICLE, "chicago")).toBe(
      "Okafor, Miriam, and Linh Tran. “Rubble stabilisation and early coral recruitment on degraded reef flats.” Journal of Reef Restoration 14, no. 2 (2021): 112–129. https://doi.org/10.5555/jrr.2021.0142.",
    );
    expect(formatReference(BOOK, "chicago")).toBe(
      "Haddad, Rami. Gardening the sea: A practical guide to coral nurseries. Harbour Lane Press, 2019.",
    );
    expect(formatReference(FOUR, "chicago")).toMatch(
      /^Silva, João Pedro, Ama Mensah, Mira Lindqvist, and Miriam Okafor\. /,
    );
  });
  test("Harvard", () => {
    expect(formatReference(ARTICLE, "harvard")).toBe(
      "Okafor, M. and Tran, L. (2021) ‘Rubble stabilisation and early coral recruitment on degraded reef flats’, Journal of Reef Restoration, 14(2), pp. 112–129. Available at: https://doi.org/10.5555/jrr.2021.0142.",
    );
    expect(formatReference(BOOK, "harvard")).toBe(
      "Haddad, R. (2019) Gardening the sea: A practical guide to coral nurseries. Harbour Lane Press.",
    );
    expect(formatReference(FOUR, "harvard")).toMatch(
      /^Silva, J\. P\. et al\. \(2023\)/,
    );
    expect(formatReference(WEB, "harvard")).toBe(
      "Mensah, A. (2024) Training volunteer divers, Reef Volunteers Network. Available at: https://example.org/guides/divers (Accessed: 14 September 2026).",
    );
  });
  test("IEEE", () => {
    expect(formatReference(ARTICLE, "ieee", 1)).toBe(
      "[1] M. Okafor and L. Tran, “Rubble stabilisation and early coral recruitment on degraded reef flats,” Journal of Reef Restoration, vol. 14, no. 2, pp. 112–129, 2021, doi: 10.5555/jrr.2021.0142.",
    );
    expect(formatReference(BOOK, "ieee", 2)).toBe(
      "[2] R. Haddad, Gardening the sea: A practical guide to coral nurseries. Harbour Lane Press, 2019.",
    );
    expect(formatReference(FOUR, "ieee")).toMatch(
      /^J\. P\. Silva, A\. Mensah, M\. Lindqvist, and M\. Okafor, /,
    );
    expect(formatReference(WEB, "ieee")).toBe(
      "A. Mensah, “Training volunteer divers,” Reef Volunteers Network, 2024, accessed 14 September 2026. [Online]. Available: https://example.org/guides/divers",
    );
  });
  test("et al. rules: APA lists 20 then an ellipsis; IEEE shortens at seven", () => {
    const many = (n: number): Reference => ({
      ...BOOK,
      authors: Array.from({ length: n }, (_, i) => ({
        family: `Author${i + 1}`,
        given: "Ann",
      })),
    });
    expect(formatReference(many(21), "apa")).toContain(
      "Author19, A., . . . Author21, A. (2019)",
    );
    expect(formatReference(many(7), "ieee")).toMatch(/^A\. Author1 et al\., /);
    expect(formatReference(many(6), "ieee")).toMatch(
      /A\. Author5, and A\. Author6, /,
    );
  });
});

describe("exports", () => {
  test("BibTeX: types, keys, authors joined by and, page ranges with --", () => {
    const out = toBibTeX([ARTICLE, BOOK, { ...ARTICLE, id: "dup" }]);
    expect(out).toContain("@article{okafor2021rubble,");
    expect(out).toContain("@article{okafor2021rubblea,");
    expect(out).toContain("  author = {Okafor, Miriam and Tran, Linh}");
    expect(out).toContain("  journal = {Journal of Reef Restoration}");
    expect(out).toContain("  pages = {112--129}");
    expect(out).toContain("@book{haddad2019gardening,");
    expect(out).toContain("  publisher = {Harbour Lane Press}");
  });
  test("RIS: one record per reference, closed with ER", () => {
    const out = toRIS([ARTICLE, WEB]);
    expect(out.split("\n").slice(0, 4)).toEqual([
      "TY  - JOUR",
      "AU  - Okafor, Miriam",
      "AU  - Tran, Linh",
      "TI  - Rubble stabilisation and early coral recruitment on degraded reef flats",
    ]);
    expect(out).toContain("SP  - 112\nEP  - 129");
    expect(out).toContain("DO  - 10.5555/jrr.2021.0142");
    expect(out).toContain("TY  - ELEC");
    expect(out.match(/ER {2}- /g)).toHaveLength(2);
  });
});

describe("tc-bibliography", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the header, the toolbar and an ordered list sorted by author`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("bib");
      expect(text(el.querySelector(".ui-bib__count"))).toBe("4 references");
      expect(el.querySelector("ol")!.getAttribute("aria-labelledby")).toBe(
        el.querySelector(".tc-head__title")!.id,
      );
      expect(entries(el)).toEqual([
        "haddad2019",
        "web",
        "okafor2021",
        "silva2023",
      ]);
      // Italics where the style sets them; the DOI a safe, live link
      const okafor = el.querySelector('[data-id="okafor2021"]')!;
      expect(text(okafor.querySelector("i"))).toBe(
        "Journal of Reef Restoration",
      );
      expect(okafor.querySelector("a")!.getAttribute("href")).toBe(
        "https://doi.org/10.5555/jrr.2021.0142",
      );
      expect(
        okafor
          .querySelector<HTMLInputElement>('input[type="checkbox"]')!
          .getAttribute("aria-label"),
      ).toBe(ARTICLE.title);
    });
  }

  test("style, sort and search; IEEE numbers the entries; style changes are cancelable", async () => {
    const el = await make();
    const styles: string[] = [];
    el.addEventListener("tc-citation-style-change", (e) =>
      styles.push((e as CustomEvent).detail.citationStyle),
    );
    const [styleSel, sortSel] =
      el.querySelectorAll<HTMLSelectElement>("select");
    styleSel.value = "ieee";
    styleSel.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.citationStyle).toBe("ieee");
    expect([...el.querySelectorAll(".ui-bib__num")].map(text)).toEqual([
      "[1]",
      "[2]",
      "[3]",
      "[4]",
    ]);
    sortSel.value = "year";
    sortSel.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(entries(el)).toEqual([
      "web",
      "silva2023",
      "okafor2021",
      "haddad2019",
    ]);
    const search = el.querySelector<HTMLInputElement>(".ui-bib__search-input")!;
    search.value = "heat";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(entries(el)).toEqual(["silva2023"]);
    search.value = "zzz";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(text(el.querySelector(".ui-bib__empty"))).toBe(
      "No references match “zzz”.",
    );
    el.addEventListener("tc-citation-style-change", (e) => e.preventDefault(), {
      once: true,
    });
    styleSel.value = "mla";
    styleSel.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.citationStyle).toBe("ieee");
    expect(styles).toEqual(["ieee", "mla"]);
  });

  test("ticking, select all, Copy selected and a reference's Copy fire cancelable tc-copy with the formatted text", async () => {
    const el = await make();
    const copies: BibliographyCopy[] = [];
    el.addEventListener("tc-copy", (e) => {
      copies.push((e as CustomEvent<BibliographyCopy>).detail);
      e.preventDefault();
    });
    el.querySelector<HTMLInputElement>('[data-id="okafor2021"] input')!.click();
    await settle();
    expect(el.selected).toEqual(["okafor2021"]);
    const copySel = [
      ...el.querySelectorAll<HTMLButtonElement>(".ui-bib__btn"),
    ].find((b) => text(b).startsWith("Copy"))!;
    expect(text(copySel)).toBe("Copy 1 selected");
    copySel.click();
    el.querySelector<HTMLButtonElement>(
      '[data-id="haddad2019"] .ui-bib__copy',
    )!.click();
    await settle();
    expect(copies.map((c) => c.ids)).toEqual([["okafor2021"], ["haddad2019"]]);
    expect(copies[0].text).toBe(formatReference(ARTICLE, "apa"));
    const all = el.querySelector<HTMLInputElement>(".ui-bib__all input")!;
    expect(all.indeterminate).toBe(true);
    all.click();
    await settle();
    expect(el.selected.sort()).toEqual([
      "haddad2019",
      "okafor2021",
      "silva2023",
      "web",
    ]);
  });

  test("Export: a menu with arrow keys; tc-export carries the text for the ticked (or all) references", async () => {
    const el = await make();
    const exports: BibliographyExport[] = [];
    el.addEventListener("tc-export", (e) => {
      exports.push((e as CustomEvent<BibliographyExport>).detail);
      e.preventDefault();
    });
    const btn = el.querySelector<HTMLButtonElement>(".ui-bib__export-btn")!;
    btn.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    await settle();
    const items = [...el.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(items[0]);
    items[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    await settle();
    expect(document.activeElement).toBe(items[1]);
    items[1].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    await settle();
    expect(exports[0].format).toBe("ris");
    expect(exports[0].ids).toHaveLength(4);
    expect(el.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(btn);
    el.selected = ["haddad2019"];
    await settle();
    btn.click();
    await settle();
    el.querySelectorAll<HTMLElement>('[role="menuitem"]')[0].click();
    await settle();
    expect(exports[1]).toMatchObject({ format: "bibtex", ids: ["haddad2019"] });
    expect(exports[1].text).toContain("@book{haddad2019gardening,");
    // Escape closes the menu
    btn.click();
    await settle();
    el.querySelector<HTMLElement>('[role="menuitem"]')!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await settle();
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });

  test("React wrapper: uncontrolled selection survives re-renders; controlled style stays until the parent changes it", async () => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const styles: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(Bibliography, {
        title: "Mine",
        references: REFS,
        citationStyle: "apa",
        onCitationStyleChange: (s) => void styles.push(s),
        "data-n": n,
      } as React.ComponentProps<typeof Bibliography>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-bibliography")!;
    expect(text(el.querySelector(".tc-head__title"))).toBe("Mine");
    el.querySelector<HTMLInputElement>('[data-id="okafor2021"] input')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toEqual(["okafor2021"]);
    const sel = el.querySelector<HTMLSelectElement>("select")!;
    sel.value = "mla";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(styles).toEqual(["mla"]);
    expect(el.citationStyle).toBe("apa");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the menu open and IEEE`, async () => {
      const wrap = await fixture(
        html`<div
          data-tc-theme=${theme}
          style="padding: 16px; background: var(--tc-surface-base)"
        >
          <tc-bibliography
            heading="Reading list"
            .references=${REFS}
            .selected=${["okafor2021"]}
          ></tc-bibliography>
          <tc-bibliography
            look="clean"
            citation-style="ieee"
            heading="IEEE list"
            .references=${REFS}
          ></tc-bibliography>
          <tc-bibliography heading="Empty"></tc-bibliography>
        </div>`,
      );
      wrap.querySelector<HTMLButtonElement>(".ui-bib__export-btn")!.click();
      await finish(wrap);
      const result = await axe.run(wrap, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
        resultTypes: ["violations"],
      });
      expect(
        result.violations.map(
          (v) =>
            `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
        ),
      ).toEqual([]);
    });
  }
});
