import { useEffect, useMemo, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { IsbnBook } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A reading-group note with three ISBNs and an invoice number that looks like one but fails its check digit, so it
   stays plain text. Hover or focus a number for its card; a moment after the page opens, the first card opens on its
   own. The "catalogue" is a fake resolver in this file – no network: the first book comes back after a short wait,
   the second isn't in it ("No details"), and the third fails once, so its card offers Retry. */

const TEXT = `Reading group, autumn term

Start with Quiet Interfaces (ISBN 978-0-306-40615-7) before the first session. The field guide is 0-8044-2957-X if you want something shorter, and the workbook is ISBN-13: 979-10-90636-07-1.

Expenses: the order reference 978-1-234-56789-0 is the invoice, not a book.`;

/** A plain cover: a coloured board with the title set on it */
const cover = (title: string, from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="120" height="180" fill="url(#g)"/><rect x="10" y="10" width="100" height="160" fill="none" stroke="rgba(255,255,255,.35)"/><text x="60" y="78" text-anchor="middle" font-family="Georgia, serif" font-size="15" fill="#fff">${title
      .split(" ")
      .map((w, i) => `<tspan x="60" dy="${i ? 18 : 0}">${w}</tspan>`)
      .join("")}</text><rect x="44" y="140" width="32" height="2" fill="rgba(255,255,255,.6)"/></svg>`,
  )}`;

const CATALOGUE: Record<string, IsbnBook> = {
  "9780306406157": {
    title: "Quiet Interfaces",
    subtitle: "Designing software that stays out of the way",
    authors: ["Ines Okafor", "Tomás Reyes"],
    publisher: "Harbour Lane Books",
    year: 2021,
    pages: 312,
    cover: cover("Quiet Interfaces", "#2f5d8a", "#1b2f4d"),
  },
  "9791090636071": {
    title: "The Practice Workbook",
    authors: ["Mira Lindqvist"],
    publisher: "Atelier Nord",
    year: 2023,
    pages: 148,
    cover: cover("Practice Workbook", "#b4572e", "#6d2c17"),
  },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { IsbnDetails } = ui;
  const [run, setRun] = useState(0);
  const [log, setLog] = useState("");
  const box = useRef<HTMLDivElement>(null);
  // Once per run: open the first card, so the page shows one without a hover
  useEffect(() => {
    const t = setTimeout(() => box.current?.querySelector("tc-isbn-details")?.openCard(0), 900);
    return () => clearTimeout(t);
  }, [run]);
  // A fresh catalogue per run, so Reset shows loading and the failure again
  const resolve = useMemo(() => {
    let failed = false;
    void run;
    return (isbn13: string, signal: AbortSignal) =>
      new Promise<IsbnBook | null>((done, fail) => {
        const t = setTimeout(() => {
          if (isbn13 === "9791090636071" && !failed) {
            failed = true;
            fail(new Error("The catalogue didn't answer"));
            return;
          }
          done(CATALOGUE[isbn13] ?? null);
        }, 700);
        signal.addEventListener("abort", () => clearTimeout(t));
      });
  }, [run]);

  return (
    <div ref={box} style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <IsbnDetails
        key={run}
        text={TEXT}
        resolve={resolve}
        onOpenChange={(isbn) => isbn && setLog(`Card open for ${isbn}`)}
        onCopy={(text, form) => setLog(`Copied ${form === "isbn13" ? "ISBN-13" : "ISBN-10"} ${text}`)}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || "Hover or focus a number to see the book"}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setRun((n) => n + 1);
            setLog("");
          }}
        >
          Reset
        </button>
      </p>
    </div>
  );
}
