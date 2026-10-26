/* agent-cursors: one reply draft was shared by every comment pin – audit theme 10 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/agent-cursors";
import * as clean from "@components/agent-cursors-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const agents = [{ id: "ada", name: "Ada" }];
const blocks = [
  { id: "p1", text: "First paragraph" },
  { id: "p2", text: "Second paragraph" },
];
const comments = [
  { id: "c1", agent: "ada", block: "p1", text: "Shorter?" },
  { id: "c2", agent: "ada", block: "p2", text: "Source?" },
];

for (const [style, ui] of styles) {
  describe(`agent-cursors ${style}`, () => {
    test("every comment pin keeps its own reply draft", () => {
      const onReply = vi.fn();
      render(<ui.AgentCursors agents={agents} blocks={blocks} comments={comments} cursors={{}} onReply={onReply} />);
      const [first, second] = screen.getAllByPlaceholderText<HTMLInputElement>("Reply");
      fireEvent.change(first, { target: { value: "Will do" } });
      fireEvent.change(second, { target: { value: "Added a link" } });
      expect(first.value).toBe("Will do");
      expect(second.value).toBe("Added a link");

      fireEvent.keyDown(second, { key: "Enter" });
      expect(onReply).toHaveBeenCalledWith(comments[1], "Added a link");
      expect(second.value).toBe("");
      expect(first.value).toBe("Will do");
    });
  });
}

/* Phase 3: tab is controllable both ways, replies may be async */
const tabs = [
  { id: "doc", label: "Document" },
  { id: "table", label: "Table" },
];
const selected = () => screen.getAllByRole("tab").find((t) => t.getAttribute("aria-selected") === "true")?.textContent;

for (const [style, ui] of styles) {
  describe(`agent-cursors ${style} – contract`, () => {
    test("uncontrolled tab starts at defaultTab, switches on click and reports", () => {
      const onTabChange = vi.fn();
      render(<ui.AgentCursors agents={agents} blocks={blocks} cursors={{}} tabs={tabs} defaultTab="table" onTabChange={onTabChange} />);
      expect(selected()).toBe("Table");
      fireEvent.click(screen.getByRole("tab", { name: "Document" }));
      expect(selected()).toBe("Document");
      expect(onTabChange).toHaveBeenCalledWith("doc");
    });

    test("controlled tab only reports", () => {
      const onTabChange = vi.fn();
      render(<ui.AgentCursors agents={agents} blocks={blocks} cursors={{}} tabs={tabs} tab="doc" onTabChange={onTabChange} />);
      fireEvent.click(screen.getByRole("tab", { name: "Table" }));
      expect(onTabChange).toHaveBeenCalledWith("table");
      expect(selected()).toBe("Document");
    });

    test("a reply that fails comes back so it can be sent again", async () => {
      let fail: (e: Error) => void = () => {};
      const onReply = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      render(<ui.AgentCursors agents={agents} blocks={blocks} comments={comments} cursors={{}} onReply={onReply} />);
      const [first] = screen.getAllByPlaceholderText<HTMLInputElement>("Reply");
      fireEvent.change(first, { target: { value: "Will do" } });
      fireEvent.keyDown(first, { key: "Enter" });
      expect(first.getAttribute("aria-busy")).toBe("true");
      fireEvent.keyDown(first, { key: "Enter" });
      expect(onReply).toHaveBeenCalledTimes(1);
      await act(async () => fail(new Error("offline")));
      expect(first.value).toBe("Will do");
      expect(first.getAttribute("aria-invalid")).toBe("true");
    });

    test("Enter while composing (IME) does not send", () => {
      const onReply = vi.fn();
      render(<ui.AgentCursors agents={agents} blocks={blocks} comments={comments} cursors={{}} onReply={onReply} />);
      const [first] = screen.getAllByPlaceholderText<HTMLInputElement>("Reply");
      fireEvent.change(first, { target: { value: "かな" } });
      fireEvent.keyDown(first, { key: "Enter", isComposing: true });
      expect(onReply).not.toHaveBeenCalled();
    });
  });
}

/* WCAG + design pass: the suggestion window by keyboard (2.1.1), focus never lost (2.4.3), tabs pattern (4.1.2),
   Esc on hover content (1.4.13), inert closed pins (S6) */
const sugBlocks = [
  { id: "p1", text: "The quick fox jumps" },
  { id: "p2", text: "Over the lazy dog" },
];
const sugs = [
  { id: "s1", agent: "ada", block: "p1", at: 4, remove: 5, insert: "swift", note: "Shorter" },
  { id: "s2", agent: "ada", block: "p2", at: 0, insert: "Right " },
];

function Doc({ ui, onAccept }: { ui: typeof standard; onAccept?: (id: string) => void }) {
  const [list, setList] = useState(sugs);
  const drop = (s: { id: string }) => {
    onAccept?.(s.id);
    setList((l) => l.filter((x) => x.id !== s.id));
  };
  return (
    <>
      <ui.AgentCursors agents={agents} blocks={sugBlocks} suggestions={list} cursors={{}} onAccept={drop} onReject={drop} />
      <button type="button">After</button>
    </>
  );
}

for (const [style, ui] of styles) {
  describe(`agent-cursors ${style} – a11y`, () => {
    test("suggestions are named buttons that open their window; Enter moves focus in, Esc comes back", () => {
      render(<Doc ui={ui} />);
      const ins = screen.getByRole("button", { name: "Ada suggests adding: swift" });
      expect(ins.tagName).toBe("INS");
      expect(screen.getByRole("button", { name: "Ada suggests removing: quick" }).tagName).toBe("DEL");
      act(() => ins.focus());
      // Focus shows the preview without taking focus away
      expect(screen.getByRole("dialog", { name: "Suggestion from Ada" })).toBeTruthy();
      expect(document.activeElement).toBe(ins);
      fireEvent.keyDown(ins, { key: "Enter" });
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Reject" }));
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(ins);
    });

    test("Tab past the window goes on from the suggestion, not to the end of the page", () => {
      render(<Doc ui={ui} />);
      const ins = screen.getByRole("button", { name: "Ada suggests adding: swift" });
      act(() => ins.focus());
      fireEvent.keyDown(ins, { key: " " });
      const accept = screen.getByRole("button", { name: "Accept" });
      act(() => accept.focus());
      fireEvent.keyDown(accept, { key: "Tab" });
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ada suggests adding: Right" }));
    });

    test("Accept keeps focus in the document: on the next suggestion once this one is gone", async () => {
      const onAccept = vi.fn();
      render(<Doc ui={ui} onAccept={onAccept} />);
      const ins = screen.getByRole("button", { name: "Ada suggests adding: swift" });
      act(() => ins.focus());
      fireEvent.keyDown(ins, { key: "Enter" });
      fireEvent.click(screen.getByRole("button", { name: "Accept" }));
      await act(async () => {});
      expect(onAccept).toHaveBeenCalledWith("s1");
      expect(document.activeElement).not.toBe(document.body);
      expect(document.activeElement?.getAttribute("data-sug")).toBe("s2");
    });

    test("tabs follow the tabs pattern: roving tabindex, arrows, a labelled panel", () => {
      const onTabChange = vi.fn();
      render(<ui.AgentCursors agents={agents} blocks={blocks} cursors={{}} tabs={tabs} onTabChange={onTabChange} />);
      const [doc, table] = screen.getAllByRole("tab");
      expect(doc.tabIndex).toBe(0);
      expect(table.tabIndex).toBe(-1);
      act(() => doc.focus());
      fireEvent.keyDown(doc, { key: "ArrowRight" });
      expect(onTabChange).toHaveBeenCalledWith("table");
      expect(document.activeElement).toBe(table);
      expect(table.getAttribute("aria-selected")).toBe("true");
      const panel = screen.getByRole("tabpanel");
      expect(panel.getAttribute("aria-labelledby")).toBe(table.id);
      expect(table.getAttribute("aria-controls")).toBe(panel.id);
      fireEvent.keyDown(table, { key: "Home" });
      expect(document.activeElement).toBe(doc);
    });

    test("a closed comment is inert; Esc inside an open one closes it and returns focus to its pin", () => {
      render(<ui.AgentCursors agents={agents} blocks={blocks} comments={[comments[0]]} cursors={{}} onReply={() => {}} />);
      const reply = screen.getByPlaceholderText<HTMLInputElement>("Reply");
      expect(reply.closest("[inert]")).not.toBeNull();
      const pin = screen.getByRole("button", { name: "Comment from Ada: Shorter?" });
      act(() => pin.focus());
      expect(pin.getAttribute("aria-expanded")).toBe("true");
      expect(reply.closest("[inert]")).toBeNull();
      act(() => reply.focus());
      fireEvent.keyDown(reply, { key: "Escape" });
      expect(document.activeElement).toBe(pin);
      expect(pin.getAttribute("aria-expanded")).toBe("false");
      expect(reply.closest("[inert]")).not.toBeNull();
      // Enter on the pin opens it again
      fireEvent.click(pin);
      expect(pin.getAttribute("aria-expanded")).toBe("true");
    });

    test("Esc closes a pin opened by hover without moving focus", () => {
      render(
        <>
          <button type="button">Elsewhere</button>
          <ui.AgentCursors agents={agents} blocks={blocks} comments={[comments[0]]} cursors={{}} />
        </>,
      );
      const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
      act(() => elsewhere.focus());
      const pin = screen.getByRole("button", { name: "Comment from Ada: Shorter?" });
      fireEvent.mouseEnter(pin.closest(".ui-agc__pin")!);
      expect(pin.getAttribute("aria-expanded")).toBe("true");
      fireEvent.keyDown(document, { key: "Escape" });
      expect(pin.getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(elsewhere);
    });

    test("Esc hides the faces' hover tips; the live region is there from the start", () => {
      const { container } = render(<ui.AgentCursors agents={agents} blocks={blocks} cursors={{ ada: { block: "p1", at: 0 } }} />);
      const root = container.querySelector(".ui-agc")!;
      expect(screen.getByRole("status")).toBeTruthy();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(root.hasAttribute("data-hush")).toBe(true);
      fireEvent.focus(screen.getByRole("button", { name: /Follow Ada/ }));
      expect(root.hasAttribute("data-hush")).toBe(false);
    });
  });
}
