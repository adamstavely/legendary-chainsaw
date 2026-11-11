import { describe, expect, it } from "vitest";
import { elementImports, exampleModule, htmlSnippet, parseSnippet } from "../../plugins/trenchcoat";

const page = `# Thing

## Example

\`\`\`html
<label for="who">Who</label>
<tc-combobox id="who"></tc-combobox>

<script type="module">
  import "@adamstavely/trenchcoat/combobox";
  import "@adamstavely/trenchcoat/tokens.css";
  import { html } from "lit";

  const field = document.querySelector("#who");
  field.options = [{ value: "a", label: "A" }];
  field.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
\`\`\`

\`\`\`html
<p>second block</p>
\`\`\`
`;

describe("htmlSnippet", () => {
  it("takes the first html block", () => {
    expect(htmlSnippet(page)).toContain("tc-combobox");
    expect(htmlSnippet(page)).not.toContain("second block");
  });

  it("is null without one", () => {
    expect(htmlSnippet("```tsx\nconst a = 1;\n```")).toBeNull();
  });
});

describe("parseSnippet", () => {
  const example = parseSnippet(htmlSnippet(page)!);

  it("keeps the markup without the script", () => {
    expect(example.markup).toBe('<label for="who">Who</label>\n<tc-combobox id="who"></tc-combobox>');
  });

  it("hoists the imports, dropping tokens.css", () => {
    expect(example.imports).toEqual(['import "@adamstavely/trenchcoat/combobox";', 'import { html } from "lit";']);
  });

  it("keeps the rest of the script", () => {
    expect(example.script).toMatch(/^const field = document\.querySelector\("#who"\);/);
    expect(example.script).not.toContain("import");
  });
});

describe("exampleModule", () => {
  it("runs the script inside setup, with the card's document, console and fetch", () => {
    const code = exampleModule(parseSnippet(htmlSnippet(page)!));
    expect(code).toContain("export default async function setup(document, console, fetch) {");
    expect(code.indexOf('import "@adamstavely/trenchcoat/combobox";')).toBeLessThan(code.indexOf("export const markup"));
  });
});

describe("elementImports", () => {
  it("adds imports for the elements a snippet uses but doesn't import", () => {
    const example = parseSnippet(`<tc-look-provider><tc-combobox></tc-combobox><tc-bibliography></tc-bibliography></tc-look-provider>
<script type="module">
  import "@adamstavely/trenchcoat/combobox";
  document.body.append(document.createElement("tc-toaster"));
</script>`);
    const exists = (slug: string) => slug !== "made-up";
    expect(elementImports(example, exists)).toEqual([
      'import "@adamstavely/trenchcoat/bibliography";',
      'import "@adamstavely/trenchcoat/look-provider";',
      'import "@adamstavely/trenchcoat/toaster";',
    ]);
    expect(elementImports(parseSnippet("<tc-made-up></tc-made-up>"), exists)).toEqual([]);
  });
});
