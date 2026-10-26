/*
 * H8 chat-composer: the mic typed a hard-coded sentence, and "Connect apps" / "Request approval" turned into
 * success on a timer whatever really happened.
 */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/chat-composer";
import * as clean from "@components/chat-composer-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("ChatComposer:"));
const body = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-apps]")!;
const message = () => screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement;

type Session = Parameters<NonNullable<standard.ChatComposerProps["onDictate"]>>[0];

for (const [style, ui] of styles) {
  const { ChatComposer } = ui;

  describe(`chat-composer (${style})`, () => {
    // Runs first: the warning is once per page, so a later test would find it already spent
    test("simulations: silent with demo, otherwise one warning for the whole component", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { unmount } = render(<ChatComposer demo />);
      fireEvent.click(screen.getByRole("button", { name: "Voice input" }));
      fireEvent.click(screen.getByRole("button", { name: "Connect apps" }));
      await advance(1500);
      expect(warnings(warn)).toHaveLength(0);
      unmount();

      render(
        <>
          <ChatComposer />
          <ChatComposer />
        </>,
      );
      for (const b of screen.getAllByRole("button", { name: "Voice input" })) fireEvent.click(b);
      for (const b of screen.getAllByRole("button", { name: "Connect apps" })) fireEvent.click(b);
      await advance(1500);
      expect(warnings(warn)).toHaveLength(1);
    });

    test("with onDictate the mic shows what your speech-to-text heard, not a sample sentence", async () => {
      let session!: Session;
      const onDictate = vi.fn((s: Session) => {
        session = s;
        return new Promise<void>(() => {});
      });
      render(<ChatComposer onDictate={onDictate} dictation="Sample sentence nobody said" />);
      fireEvent.click(screen.getByRole("button", { name: "Voice input" }));
      await advance(100);
      act(() => session.onTranscript("hello world"));
      await advance(3000);
      fireEvent.click(screen.getByRole("button", { name: "Use recording" }));
      expect(message().value).toBe("hello world");
      expect(session.signal.aborted).toBe(true);
      expect(screen.queryByText(/Sample sentence/)).toBeNull();
    });

    test("a rejected onDictate ends the recording with an error and adds nothing", async () => {
      render(<ChatComposer onDictate={() => Promise.reject(new Error("no mic"))} />);
      fireEvent.click(screen.getByRole("button", { name: "Voice input" }));
      await advance(200);
      expect(screen.getByRole("alert").textContent).toMatch(/Dictation/);
      expect(message().value).toBe("");
      expect(message().readOnly).toBe(false);
    });

    test("Connect apps waits for onConnectApps and goes back with an error when it rejects", async () => {
      let reject!: (e: Error) => void;
      const { container } = render(<ChatComposer loadMs={300} onConnectApps={() => new Promise((_, r) => (reject = r))} />);
      fireEvent.click(screen.getByRole("button", { name: "Connect apps" }));
      await advance(2000);
      // Long past loadMs, still loading: the timer alone no longer decides
      expect(body(container).dataset.apps).toBe("loading");
      await act(async () => reject(new Error("oauth closed")));
      expect(body(container).dataset.apps).toBe("idle");
      expect(screen.getByRole("alert").textContent).toMatch(/couldn't be connected/);
    });

    test("Connect apps turns into Select a project once onConnectApps resolves", async () => {
      const { container } = render(<ChatComposer loadMs={300} onConnectApps={() => Promise.resolve()} />);
      fireEvent.click(screen.getByRole("button", { name: "Connect apps" }));
      await advance(400);
      expect(body(container).dataset.apps).toBe("done");
    });

    test("a rejected onRequestApproval grants nothing and says so", async () => {
      const { container } = render(<ChatComposer loadMs={300} onRequestApproval={() => Promise.reject(new Error("denied"))} />);
      fireEvent.click(screen.getByRole("button", { name: "Request approval" }));
      await advance(400);
      expect(body(container).dataset.approval).toBe("idle");
      expect(screen.getByRole("alert").textContent).toMatch(/Approval wasn't granted/);
    });

    // Phase 3: one API contract
    test("the message is controllable: value shows, typing is reported, uncontrolled keeps its own", () => {
      const onValueChange = vi.fn();
      const { rerender } = render(<ChatComposer demo value="Hello" onValueChange={onValueChange} />);
      expect(message().value).toBe("Hello");
      fireEvent.change(message(), { target: { value: "Hello there" } });
      expect(onValueChange).toHaveBeenLastCalledWith("Hello there");
      expect(message().value).toBe("Hello"); // controlled: the parent decides
      rerender(<ChatComposer demo value="Reset" onValueChange={onValueChange} />);
      expect(message().value).toBe("Reset");
    });

    test("an uncontrolled composer starts at defaultValue and still reports changes", () => {
      const onValueChange = vi.fn();
      render(<ChatComposer demo defaultValue="Draft" onValueChange={onValueChange} />);
      expect(message().value).toBe("Draft");
      fireEvent.change(message(), { target: { value: "Draft 2" } });
      expect(message().value).toBe("Draft 2");
      expect(onValueChange).toHaveBeenCalledWith("Draft 2");
    });

    test("an empty models list renders a disabled picker instead of crashing", () => {
      render(<ChatComposer demo models={[]} />);
      const picker = screen.getByRole("button", { name: /No model/ });
      expect((picker as HTMLButtonElement).disabled).toBe(true);
    });

    test("the selected model follows the models list when the selected one disappears", () => {
      const a = { id: "a", name: "Alpha", description: "" };
      const b = { id: "b", name: "Beta", description: "" };
      const { rerender } = render(<ChatComposer demo models={[a, b]} defaultModel="b" />);
      expect(screen.getByRole("button", { name: /Beta/ })).toBeTruthy();
      rerender(<ChatComposer demo models={[a]} defaultModel="b" />);
      expect(screen.getByRole("button", { name: /Alpha/ })).toBeTruthy();
    });

    test("an async onSend keeps the message until it resolves, and keeps it with an error when it rejects", async () => {
      let settle!: { resolve: () => void; reject: (e: Error) => void };
      const onSend = vi.fn(() => new Promise<void>((resolve, reject) => (settle = { resolve, reject })));
      render(<ChatComposer demo defaultValue="Ship it" onSend={onSend} />);
      fireEvent.click(screen.getByRole("button", { name: "Send message" }));
      expect(onSend).toHaveBeenCalledWith("Ship it", { model: "auto" });
      expect(message().value).toBe("Ship it");
      expect((screen.getByRole("button", { name: "Send message" }) as HTMLButtonElement).disabled).toBe(true);
      await act(async () => settle.reject(new Error("offline")));
      expect(message().value).toBe("Ship it");
      expect(screen.getByRole("alert").textContent).toMatch(/wasn't sent/);
      fireEvent.click(screen.getByRole("button", { name: "Send message" }));
      await act(async () => settle.resolve());
      expect(message().value).toBe("");
    });

    test("the audio trace scrolls in the DOM: a new level is no re-render (Phase 4)", async () => {
      let commits = 0;
      const levels: ((level: number) => void)[] = [];
      const { container } = render(
        <Profiler id="cc" onRender={() => commits++}>
          <ChatComposer onDictate={(s: Session) => void levels.push(s.onLevel)} />
        </Profiler>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Voice input" }));
      await act(async () => {});
      const bars = () => [...container.querySelectorAll<HTMLElement>(".ui-chat-composer__trace > span")].map((b) => b.style.height);
      const silent = bars();
      const before = commits;
      act(() => {
        for (let i = 0; i < 20; i++) levels[0](i % 2 ? 1 : 0.5);
      });
      expect(commits - before).toBe(0);
      expect(bars()).not.toEqual(silent);
      expect(bars()).toHaveLength(16);
    });
    /* WCAG + design pass */
    test("the mic hands focus to Discard recording, and Escape discards and returns to the message (2.4.3, 2.1.1)", async () => {
      render(<ChatComposer demo />);
      const mic = screen.getByRole("button", { name: "Voice input" });
      mic.focus();
      fireEvent.click(mic);
      await act(async () => {});
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Discard recording" }));
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      await act(async () => {});
      expect(document.activeElement).toBe(message());
    });

    test("Connect apps hands focus to Select a project when it goes inert (2.4.3)", async () => {
      render(<ChatComposer loadMs={300} onConnectApps={() => Promise.resolve()} />);
      const connect = screen.getByRole("button", { name: "Connect apps" });
      connect.focus();
      fireEvent.click(connect);
      await advance(400);
      expect(document.activeElement?.textContent).toMatch(/Select a project/);
    });

    test("Tab out of the model list goes on from the model button, not from <body> (2.4.3)", async () => {
      render(<ChatComposer />);
      const model = screen.getByRole("button", { name: /Auto/ });
      model.focus();
      fireEvent.keyDown(model, { key: "ArrowDown" });
      await act(async () => {});
      const list = screen.getByRole("listbox", { name: "Select a model", hidden: true });
      fireEvent.keyDown(list, { key: "Tab" });
      await act(async () => {});
      expect(document.activeElement).toBe(model);
    });

    test("the words heard so far describe Use recording (the on-screen draft is aria-hidden)", async () => {
      let session!: Session;
      render(<ChatComposer onDictate={(s: Session) => void (session = s)} />);
      fireEvent.click(screen.getByRole("button", { name: "Voice input" }));
      await act(async () => {});
      act(() => session.onTranscript("hello there"));
      const use = screen.getByRole("button", { name: "Use recording" });
      expect(document.getElementById(use.getAttribute("aria-describedby")!)?.textContent).toBe("Heard so far: hello there");
    });

    test("styles: --u is clamped to the type floor in rem; placeholder token; the card shows the focus ring while typing", () => {
      render(<ChatComposer />);
      const sheet = [...document.querySelectorAll("style")].map((x) => x.textContent).join("\n");
      expect(sheet).toMatch(/--u: clamp\(calc\(0\.8125rem \/ 59\.428\)/);
      expect(sheet).not.toMatch(/::placeholder\s*{[^}]*--tc-text-disabled/);
      expect(sheet).toMatch(/:has\(\.ui-chat-composer__message:focus-visible\)\s*{[^}]*outline: var\(--tc-focus-outline/);
      expect(sheet).toMatch(/\.ui-chat-composer__menu-panel:focus-visible \.ui-chat-composer__menu-fill\s*{[^}]*box-shadow: inset/);
      expect(sheet).not.toMatch(/@keyframes ui-chat-composer-sweep\s*{[^@]*background-position/);
    });
  });
}
