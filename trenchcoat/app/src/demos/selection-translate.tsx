import { useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SelectionTranslation } from "../../../src/elements/react";
import { buttonSm, caption, surface, textButton } from "../demo-kit";

/* A shared note from the Lyon office, in French. Select a sentence and choose Translate: the card shows it in English
   (or the language you pick – the choice is remembered below), the language it came from, Copy, Replace and Show
   original. "Translate a sentence" selects one for you. The translator here is a stand-in that knows these sentences
   only, takes a moment, and fails the first time you ask for Japanese, to show Retry. */

const NOTE = `Le salon de Lyon a attiré plus de visiteurs que prévu. Nous avons reçu quarante demandes de démonstration en deux jours.

Le stand était trop petit pour les groupes. L'année prochaine, il nous faudra un espace deux fois plus grand.`;

const SENTENCES: Record<string, Record<string, string>> = {
  "Le salon de Lyon a attiré plus de visiteurs que prévu.": {
    en: "The Lyon trade show drew more visitors than expected.",
    es: "La feria de Lyon atrajo a más visitantes de lo previsto.",
    de: "Die Messe in Lyon zog mehr Besucher an als erwartet.",
    ja: "リヨンの展示会には予想以上の来場者がありました。",
  },
  "Nous avons reçu quarante demandes de démonstration en deux jours.": {
    en: "We received forty demo requests in two days.",
    es: "Recibimos cuarenta solicitudes de demostración en dos días.",
    de: "Wir haben in zwei Tagen vierzig Demo-Anfragen erhalten.",
    ja: "2日間で40件のデモ依頼がありました。",
  },
  "Le stand était trop petit pour les groupes.": {
    en: "The stand was too small for groups.",
    es: "El stand era demasiado pequeño para los grupos.",
    de: "Der Stand war für Gruppen zu klein.",
    ja: "ブースはグループには小さすぎました。",
  },
  "L'année prochaine, il nous faudra un espace deux fois plus grand.": {
    en: "Next year, we'll need a space twice as big.",
    es: "El año que viene necesitaremos un espacio el doble de grande.",
    de: "Nächstes Jahr brauchen wir eine doppelt so große Fläche.",
    ja: "来年は2倍の広さのスペースが必要です。",
  },
};

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SelectionTranslate } = ui;
  const [text, setText] = useState(NOTE);
  const [target, setTarget] = useState("en");
  const [log, setLog] = useState("");
  const failedJapanese = useRef(false);
  const box = useRef<HTMLDivElement>(null);

  /** The stand-in translator: whole sentences only, a short wait, one failure */
  const translate = (passage: string, to: string, signal: AbortSignal) =>
    new Promise<SelectionTranslation>((resolve, reject) => {
      const t = setTimeout(() => {
        if (to === "ja" && !failedJapanese.current) {
          failedJapanese.current = true;
          reject(new Error("The translation service is busy"));
          return;
        }
        const parts = passage.split(/(?<=[.!?])\s+/).map((s) => SENTENCES[s.trim()]?.[to]);
        if (parts.some((p) => !p)) reject(new Error("This demo translates whole sentences – select one"));
        else resolve({ text: parts.join(" "), source: "fr" });
      }, 900);
      signal.addEventListener("abort", () => clearTimeout(t));
    });

  /** Selects the second sentence as a pointer would, so the toolbar opens */
  const selectSentence = () => {
    const root = box.current?.querySelector<HTMLElement>(".ui-strn__text");
    if (!root) return;
    const phrase = "Nous avons reçu quarante demandes de démonstration en deux jours.";
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
      const start = node.data.indexOf(phrase);
      if (start < 0) continue;
      root.focus();
      // As a pointer would: press, select, release – the release opens the toolbar
      root.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true, composed: true }));
      document.getSelection()?.setBaseAndExtent(node, start, node, start + phrase.length);
      document.dispatchEvent(new PointerEvent("pointerup", { button: 0, bubbles: true }));
      return;
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <div ref={box} style={{ ...surface, padding: "14px 16px", borderRadius: 12, display: "grid", gap: 8 }}>
        <div style={{ ...caption, fontWeight: 500 }}>Notes · Lyon trade show</div>
        <SelectionTranslate
          lang="fr"
          textLabel="Notes from the Lyon office"
          text={text}
          editable
          onTextChange={(next, change) => {
            setText(next);
            setLog(`Replaced a sentence with its ${LANGUAGES.find((l) => l.code === change.target)?.name ?? change.target} translation`);
          }}
          target={target}
          onTargetChange={(t) => {
            setTarget(t);
            setLog(`Translating into ${LANGUAGES.find((l) => l.code === t)?.name ?? t} from now on`);
          }}
          languages={LANGUAGES}
          resolveTranslate={translate}
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" style={buttonSm} onClick={selectSentence}>
          Translate a sentence
        </button>
        <span style={caption}>
          {log || "Select a sentence, then choose Translate"}{" "}
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setText(NOTE);
              setTarget("en");
              setLog("");
              failedJapanese.current = false;
            }}
          >
            Reset
          </button>
        </span>
      </div>
    </div>
  );
}
