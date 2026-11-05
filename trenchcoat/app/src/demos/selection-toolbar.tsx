import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SelectionToolbarCommand } from "../../../src/elements/react";
import type { TcSelectionToolbar } from "../../../src/elements/selection-toolbar";
import { caption, surface, textButton } from "../demo-kit";

/* A methods memo at a research institute, editable. Select any text and the bar floats over it: Bold, Italic and the
   rest show what's on at the selection, the menus set the block, colour and list, and the actions say what they'd do.
   It starts over a phrase in the second bullet. The editor here is the browser's own contenteditable with execCommand
   – a stand-in for a real editor; the bar only reports commands. */

const MEMO = `<h3>Review panel: changes for next year</h3>
<ul>
  <li><strong>Score proposals on evidence,</strong> not seniority or volume: methods, pilot data and reviewer notes.</li>
  <li><span data-pick><strong>Separate method review from budget review</strong> with a second panel, so disputes about</span> design are settled by the people who run the studies.</li>
  <li><strong>Check scores against outcomes</strong> with a yearly look at which funded studies reported on time.</li>
</ul>
<p>Comments by Friday, please. The panel meets on the 14th.</p>`;

const COMMANDS: Record<string, string> = { bold: "bold", italic: "italic", underline: "underline", strike: "strikeThrough" };
const BLOCKS = ["h1", "h2", "h3", "p"];

/** What the bar should show for the selection: the toggles that are on, the block, the list */
function stateAt(editor: HTMLElement) {
  const sel = document.getSelection();
  const node = sel?.anchorNode;
  const el = node ? (node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement) : null;
  const pressed = Object.keys(COMMANDS).filter((id) => document.queryCommandState(COMMANDS[id]));
  if (el?.closest("code") && editor.contains(el)) pressed.push("code");
  const block = el?.closest("h1, h2, h3, p, li");
  const list = el?.closest("ul, ol");
  const values: Record<string, string> = {
    style: block && BLOCKS.includes(block.tagName.toLowerCase()) ? block.tagName.toLowerCase() : "p",
    list: !list ? "none" : list.tagName === "OL" ? "numbers" : "bullets",
  };
  return { pressed, values };
}

/** A CSS colour (a token) as the rgb() execCommand needs */
function resolved(color: string) {
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.append(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  return rgb;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SelectionToolbar, defaultSelectionToolbarItems, selectionRect } = ui;
  const editor = useRef<HTMLDivElement>(null);
  const bar = useRef<TcSelectionToolbar>(null);
  const [anchor, setAnchor] = useState<Element | DOMRect | ReturnType<typeof selectionRect>>(null);
  const [open, setOpen] = useState(true);
  const [pressed, setPressed] = useState<string[]>(["bold"]);
  const [values, setValues] = useState<Record<string, string>>({ style: "p", list: "bullets" });
  const [note, setNote] = useState("");

  useEffect(() => {
    const el = editor.current;
    if (!el) return;
    el.innerHTML = MEMO;
    setAnchor(el.querySelector("[data-pick]"));
  }, []);

  /** After a selection or a command: float over the selection, or close when there's none */
  const follow = () => {
    const el = editor.current;
    const sel = document.getSelection();
    if (!el || !sel?.anchorNode || !el.contains(sel.anchorNode)) return;
    el.querySelector("[data-pick]")?.removeAttribute("data-pick");
    const rect = selectionRect();
    if (!rect) {
      setOpen(false);
      return;
    }
    const s = stateAt(el);
    setPressed(s.pressed);
    setValues(s.values);
    setAnchor(rect);
    setOpen(true);
  };

  const run = ({ id, value }: SelectionToolbarCommand) => {
    const el = editor.current;
    if (!el) return;
    if (id in COMMANDS) document.execCommand(COMMANDS[id]);
    else if (id === "code") {
      const sel = document.getSelection();
      const code = sel?.anchorNode?.parentElement?.closest("code");
      if (code) code.replaceWith(...code.childNodes);
      else if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        const wrap = document.createElement("code");
        wrap.append(range.extractContents());
        range.insertNode(wrap);
        sel.selectAllChildren(wrap);
      }
    } else if (id === "style" && typeof value === "string") document.execCommand("formatBlock", false, value === "small" ? "p" : value);
    else if (id === "list") {
      const current = stateAt(el).values.list;
      if (current === "bullets" || current === "checks") document.execCommand("insertUnorderedList");
      if (current === "numbers") document.execCommand("insertOrderedList");
      if (value === "bullets" || value === "checks") document.execCommand("insertUnorderedList");
      if (value === "numbers") document.execCommand("insertOrderedList");
    } else if (id === "color" && typeof value === "string") {
      const option = defaultSelectionToolbarItems.flatMap((i) => (i.type === "menu" && i.id === "color" ? i.options : [])).find((o) => o.value === value);
      if (option?.color) document.execCommand("foreColor", false, resolved(option.color));
    } else {
      const text = document.getSelection()?.toString().trim() ?? "";
      const quoted = text.length > 40 ? `${text.slice(0, 40)}…` : text;
      setNote({ ask: `Ask about “${quoted}”.`, comment: `Comment on “${quoted}”.`, react: `React to “${quoted}”.`, link: `Add a link to “${quoted}”.` }[id] ?? id);
      return;
    }
    setNote("");
    follow();
  };

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
      <div style={{ ...surface, padding: "56px 20px 16px" }}>
        <div
          ref={editor}
          className="demo-stb-editor"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Memo"
          onPointerUp={follow}
          onKeyUp={(e) => (e.shiftKey || e.key === "a" ? follow() : undefined)}
          onKeyDown={(e) => {
            if (e.altKey && e.key === "F10") {
              e.preventDefault();
              bar.current?.focusToolbar();
            }
          }}
          style={{ outline: "none", fontFamily: "var(--tc-font-sans)", fontSize: "var(--tc-font-size-sm)", lineHeight: "var(--tc-line-height-relaxed)", color: "var(--tc-text-primary)" }}
        />
      </div>
      <SelectionToolbar
        ref={bar}
        anchor={anchor}
        open={open}
        editor={editor.current}
        pressed={pressed}
        values={values}
        onPressedChange={setPressed}
        onValuesChange={setValues}
        onTcCommand={(e) => run(e.detail)}
        onTcClose={() => setOpen(false)}
      />
      <style>{`.demo-stb-editor [data-pick] { background: var(--tc-accent-highlight); } .demo-stb-editor h3 { margin: 0 0 8px; font-size: var(--tc-font-size-md); } .demo-stb-editor ul { margin: 0 0 8px; padding-inline-start: 20px; } .demo-stb-editor code { font-family: var(--tc-font-mono); font-size: 0.92em; padding: 0 3px; border-radius: 4px; background: var(--tc-surface-well); }`}</style>
      <div style={caption}>
        {note || "Select any text to format it – the bar shows what's on at the selection. Alt + F10 moves to the bar, Escape goes back."}{" "}
        {note ? (
          <button type="button" style={textButton} onClick={() => setNote("")}>
            OK
          </button>
        ) : null}
      </div>
    </div>
  );
}
