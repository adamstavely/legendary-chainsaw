import examples from "virtual:tc-examples";
import { afterEach, describe, expect, it } from "vitest";
import { mountExample, prefixIds, scopeSelector, scopedDocument } from "../../src/data/examples";
import "../../src/elements";

// Docs snippets that lean on something the page around them provides (a variable, a template elsewhere on the page):
// on the canvas these cards show their thumbnail instead
const NEEDS_THE_PAGE: Record<string, string> = {
  "agent-recap": "uses the app's lastSeenAt",
  "header-brand": "reads a <template> defined elsewhere on the page",
  "image-generation": "drives the app's own generation job",
  stories: "uses the app's own story data",
  "structured-output": "reads the app's model stream",
};

let host: HTMLElement;
afterEach(() => host?.remove());
function card() {
  host = document.createElement("div");
  document.body.append(host);
  return host;
}

describe("prefixIds", () => {
  it("prefixes ids and every reference to them", () => {
    const root = card();
    root.innerHTML = `<label for="a">A</label><input id="a" aria-describedby="b c"><p id="b"></p><p id="c"></p>`;
    const ids = prefixIds(root, "card-1");
    expect(root.querySelector("input")!.id).toBe("card-1-a");
    expect(root.querySelector("label")!.htmlFor).toBe("card-1-a");
    expect(root.querySelector("input")!.getAttribute("aria-describedby")).toBe("card-1-b card-1-c");
    expect(scopeSelector("#a > span, #zz", ids)).toBe("#card-1-a > span, #zz");
  });
});

describe("scopedDocument", () => {
  it("finds elements in the card only, by their original ids", () => {
    const outside = document.createElement("p");
    outside.id = "x";
    document.body.append(outside);
    const root = card();
    root.innerHTML = `<p id="x">inside</p>`;
    const doc = scopedDocument(root, prefixIds(root, "p"));
    expect(doc.querySelector("#x")!.textContent).toBe("inside");
    expect(doc.getElementById("x")!.textContent).toBe("inside");
    expect(doc.body).toBe(root);
    expect(doc.createElement("div")).toBeInstanceOf(HTMLDivElement);
    outside.remove();
  });
});

describe("every docs example", () => {
  it("mounts in a card, and its elements are defined", async () => {
    const failed: string[] = [];
    const undefinedTags = new Set<string>();
    for (const slug of Object.keys(examples)) {
      const root = card();
      try {
        await mountExample(root, slug, `t-${slug}`);
        for (const el of root.querySelectorAll("*"))
          if (el.localName.startsWith("tc-") && !customElements.get(el.localName)) undefinedTags.add(`${slug}: ${el.localName}`);
      } catch {
        failed.push(slug);
      }
      root.remove();
    }
    expect(failed.sort()).toEqual(Object.keys(NEEDS_THE_PAGE).sort());
    expect([...undefinedTags]).toEqual([]);
  }, 120_000);
});
