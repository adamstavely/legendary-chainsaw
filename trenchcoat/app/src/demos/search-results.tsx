import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SearchResultsFile, SearchResultsOptions, SearchResultsStatus } from "../../../src/elements/react";
import { searchResultsPattern } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's sample tracker, searched in place: the demo searches its own few lines, as a page would ask a server. */

const SOURCE: Record<string, string[]> = {
  "src/routes/freezers/+page.svelte": [
    "<script lang=\"ts\">",
    "  import { freezerTemperature } from \"$lib/freezer\";",
    "  export let data;",
    "</script>",
    "<h1>Freezers</h1>",
    "{#each data.freezers as freezer}<FreezerCard {freezer} />{/each}",
  ],
  "src/lib/freezer.ts": [
    "export type Freezer = { id: string; room: string; setPoint: number };",
    "/** Reads a freezer's last logged temperature, in °C */",
    "export function freezerTemperature(freezer: Freezer, log: Reading[]) {",
    "  return log.filter((r) => r.freezer === freezer.id).at(-1)?.value ?? null;",
    "}",
  ],
  "src/lib/alerts/gaps.ts": [
    "import { freezerTemperature } from \"../freezer\";",
    "// Raise an alert when a freezer hasn't logged a reading for more than an hour",
    "export const GAP_MINUTES = 60;",
  ],
  "tests/freezer.test.ts": [
    "import { freezerTemperature } from \"../src/lib/freezer\";",
    "test(\"an empty log has no temperature\", () => expect(freezerTemperature(f, [])).toBe(null));",
  ],
  "docs/custody-policy.md": ["Samples move between freezers only with a signed custody form.", "A freezer alarm is answered within 15 minutes."],
};

function search(query: string, options: SearchResultsOptions): SearchResultsFile[] {
  const re = searchResultsPattern(query, options);
  if (!re) return [];
  return Object.entries(SOURCE)
    .map(([path, lines]) => ({
      path,
      matches: lines.flatMap((text, i) => {
        re.lastIndex = 0;
        const m = re.exec(text);
        return m ? [{ line: i + 1, column: m.index + 1, text }] : [];
      }),
    }))
    .filter((f) => f.matches.length);
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SearchResults } = ui;
  const [query, setQuery] = useState("freezer");
  const [options, setOptions] = useState<SearchResultsOptions>({ caseSensitive: false, wholeWord: false, regex: false });
  const [status, setStatus] = useState<SearchResultsStatus>("done");
  const [replaceable, setReplaceable] = useState(false);
  const [note, setNote] = useState("");
  const results = status === "done" ? search(query, options) : [];
  const run = (q: string) => {
    setQuery(q);
    setStatus("searching");
    setTimeout(() => setStatus("done"), 400);
  };
  return (
    <div style={{ width: "100%", maxWidth: 400, display: "grid", gap: 8 }}>
      <SearchResults
        description="sample-tracker"
        query={query}
        options={options}
        results={results}
        status={status}
        replaceable={replaceable}
        defaultSelected={{ path: "src/lib/freezer.ts", line: 3 }}
        maxHeight={380}
        onOptionsChange={setOptions}
        onTcSearch={(e) => run(e.detail.query)}
        onTcOpen={(e) => setNote(`Open ${e.detail.path} at line ${e.detail.line}.`)}
        onTcReplace={(e) => setNote(e.detail.path ? `Replace in ${e.detail.path}, line ${e.detail.line}.` : `Replace all “${e.detail.query}” with “${e.detail.replacement}”.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Change the search and press Enter, or toggle match case."}{" "}
        <button type="button" style={textButton} onClick={() => setReplaceable(!replaceable)}>
          {replaceable ? "Hide replace" : "Show replace"}
        </button>
      </div>
    </div>
  );
}
