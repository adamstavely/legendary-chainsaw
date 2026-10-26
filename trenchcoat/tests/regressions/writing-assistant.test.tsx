/*
 * H6 writing-assistant: dictation errors used to fall back to a sample take that was sent as the user's message,
 * a rejected `respond` left the assistant busy forever, and New chat didn't cancel a pending reply.
 */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/writing-assistant";
import * as clean from "@components/writing-assistant-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition;
});

const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("WritingAssistant:"));

/** A speech recognizer that fails the way a blocked microphone does */
const installDeniedRecognition = () => {
  (window as { SpeechRecognition?: unknown }).SpeechRecognition = class {
    lang = "";
    interimResults = false;
    continuous = false;
    onresult = null;
    onerror: ((e: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    start() {
      queueMicrotask(() => {
        this.onerror?.({ error: "not-allowed" });
        this.onend?.();
      });
    }
    stop() {}
    abort() {}
  };
};

for (const [style, ui] of styles) {
  const { WritingAssistant } = ui;

  describe(`writing-assistant (${style})`, () => {
    // Runs first: the warning is once per page, so a later test would find it already spent
    test("sample replies: silent with demo, otherwise one warning however often they're used", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { unmount } = render(<WritingAssistant demo />);
      fireEvent.click(screen.getByRole("button", { name: "Polish my email" }));
      await advance(800);
      expect(warnings(warn)).toHaveLength(0);
      unmount();

      render(
        <>
          <WritingAssistant />
          <WritingAssistant />
        </>,
      );
      for (const chip of screen.getAllByRole("button", { name: "Polish my email" })) fireEvent.click(chip);
      await advance(800);
      expect(warnings(warn)).toHaveLength(1);
    });

    test("a blocked microphone shows an error and sends nothing", async () => {
      installDeniedRecognition();
      const respond = vi.fn(() => "reply");
      render(<WritingAssistant respond={respond} dictation="Canned sentence" />);
      fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
      await advance(6000);
      expect(respond).not.toHaveBeenCalled();
      expect(screen.queryByText("Canned sentence")).toBeNull();
      expect(screen.getByRole("alert").textContent).toMatch(/microphone/i);
      expect(screen.getByRole("button", { name: "Dictate" }).getAttribute("aria-pressed")).toBe("false");
    });

    test("without speech recognition it says so instead of simulating – unless demo", async () => {
      const respond = vi.fn(() => "reply");
      const { unmount } = render(<WritingAssistant respond={respond} dictation="Canned sentence" />);
      fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
      await advance(6000);
      expect(respond).not.toHaveBeenCalled();
      expect(screen.getByRole("alert").textContent).toMatch(/isn't supported/);
      unmount();

      render(<WritingAssistant respond={respond} dictation="Canned sentence" demo />);
      fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
      await advance(6000);
      // WCAG fix pass (3.2.2): dictation fills the field and waits – nothing is sent on its own
      const field = screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement;
      expect(field.value).toBe("Canned sentence");
      expect(respond).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(field);
      fireEvent.keyDown(field, { key: "Enter" });
      await advance(1000);
      expect(respond).toHaveBeenCalledWith("Canned sentence", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    });

    test("a rejected respond clears the busy state and the message can be sent again", async () => {
      const respond = vi.fn<(m: string) => Promise<string>>().mockRejectedValueOnce(new Error("offline")).mockResolvedValue("Second try worked");
      render(<WritingAssistant respond={respond} />);
      fireEvent.click(screen.getByRole("button", { name: "Polish my email" }));
      await advance(1000);
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn't get a reply/);
      expect(screen.queryByLabelText("Writing")).toBeNull();

      const field = screen.getByRole("textbox", { name: "Message" });
      fireEvent.change(field, { target: { value: "Polish my email" } });
      fireEvent.keyDown(field, { key: "Enter" });
      await advance(2000);
      expect(respond).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Second try worked")).toBeTruthy();
      expect(screen.queryByRole("alert")).toBeNull();
    });

    test("New chat drops a reply that is still on its way", async () => {
      let resolve!: (s: string) => void;
      const respond = vi.fn(() => new Promise<string>((r) => (resolve = r)));
      render(<WritingAssistant respond={respond} greeting="Fresh start" />);
      fireEvent.click(screen.getByRole("button", { name: "Polish my email" }));
      // Past the minimum typing beat, so only the reply itself is outstanding
      await advance(800);
      fireEvent.click(screen.getByRole("button", { name: "New chat" }));
      await act(async () => resolve("Late reply"));
      await advance(2000);
      expect(screen.queryByText("Late reply")).toBeNull();
      expect(screen.getByText("Fresh start")).toBeTruthy();
    });
  });
}

/* Phase 3: the conversation can be read, seeded and controlled; a reply on its way gets an AbortSignal */
for (const [style, ui] of styles) {
  const { WritingAssistant } = ui;
  describe(`writing-assistant (${style}) contract`, () => {
    test("defaultMessages seeds the chat; every message is reported with the whole conversation", async () => {
      const onMessagesChange = vi.fn();
      const seed = [{ id: "s1", role: "assistant" as const, text: "Welcome back." }];
      render(<WritingAssistant respond={() => "Sure."} defaultMessages={seed} onMessagesChange={onMessagesChange} />);
      expect(screen.getByText("Welcome back.")).toBeTruthy();
      fireEvent.change(screen.getByRole("textbox", { name: "Message" }), { target: { value: "Shorter please" } });
      fireEvent.keyDown(screen.getByRole("textbox", { name: "Message" }), { key: "Enter" });
      expect(onMessagesChange.mock.lastCall![0].map((m: { text: string }) => m.text)).toEqual(["Welcome back.", "Shorter please"]);
      await advance(800);
      expect(onMessagesChange.mock.lastCall![0].map((m: { role: string; text: string }) => `${m.role}:${m.text}`)).toEqual([
        "assistant:Welcome back.",
        "user:Shorter please",
        "assistant:Sure.",
      ]);
    });

    test("controlled messages: only the parent's list shows", () => {
      const onMessagesChange = vi.fn();
      render(<WritingAssistant respond={() => "Sure."} messages={[]} onMessagesChange={onMessagesChange} />);
      fireEvent.click(screen.getAllByRole("button", { name: "Polish my email" })[0]);
      expect(onMessagesChange).toHaveBeenCalledTimes(1);
      expect(screen.queryByText("Polish my email", { selector: "p" })).toBeNull();
    });

    test("respond gets the history and a signal that New chat aborts", async () => {
      let signal: AbortSignal | undefined;
      let history: unknown[] = [];
      const respond = vi.fn((_: string, ctx: { signal: AbortSignal; history: unknown[] }) => {
        signal = ctx.signal;
        history = ctx.history;
        return new Promise<string>(() => {});
      });
      render(<WritingAssistant respond={respond} />);
      fireEvent.click(screen.getByRole("button", { name: "Polish my email" }));
      await advance(100);
      expect(history).toHaveLength(1);
      expect(signal?.aborted).toBe(false);
      fireEvent.click(screen.getByRole("button", { name: "New chat" }));
      expect(signal?.aborted).toBe(true);
    });

    test("unmounting aborts a reply on its way", async () => {
      let signal: AbortSignal | undefined;
      const { unmount } = render(
        <WritingAssistant
          respond={(_, ctx) => {
            signal = ctx.signal;
            return new Promise<string>(() => {});
          }}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Polish my email" }));
      await advance(100);
      unmount();
      expect(signal?.aborted).toBe(true);
    });
  });
}

/* Phase 4 – a reply streams in word by word through its text node: one commit to start, one to end */
for (const [style, ui] of styles) {
  const { WritingAssistant } = ui;
  test(`writing-assistant (${style}): streaming a reply doesn't commit per word`, async () => {
    let commits = 0;
    const reply = "one two three four five six seven eight nine ten";
    const { container } = render(
      <Profiler id="w" onRender={() => commits++}>
        <WritingAssistant respond={() => reply} />
      </Profiler>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Polish my email" }));
    await advance(700, 10);
    const answer = () => container.querySelector('[class*="__msg--assistant"]')?.textContent;
    expect(answer()).toBe("one");
    const before = commits;
    await advance(38 * 4, 38);
    expect(answer()).toBe("one two three four five");
    expect(commits).toBe(before);
    await advance(1000);
    expect(answer()).toBe(reply);
  });
}

/* WCAG fix pass: replies streamed into aria-live word by word (4.1.3), a suggestion chip took focus with it (2.4.3),
   and New chat left focus on a hidden button */
for (const [style, ui] of styles) {
  const { WritingAssistant } = ui;
  describe(`writing-assistant (${style}) – announcements and focus`, () => {
    test("the reply is announced once, whole, through a status region present from mount", async () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList);
      const { container } = render(<WritingAssistant name="Quill" respond={() => "All good here"} />);
      const region = container.querySelector('[role="status"]')!;
      expect(region.textContent).toBe("");
      const field = screen.getByRole("textbox", { name: "Message" });
      fireEvent.change(field, { target: { value: "hi" } });
      fireEvent.keyDown(field, { key: "Enter" });
      await advance(200);
      expect(region.textContent).toBe("Writing…");
      expect(container.querySelector("[aria-live]")).toBeNull();
      await advance(2000);
      expect(region.textContent).toBe("Quill: All good here");
    });

    test("a suggestion chip hands focus to the field; New chat does too", async () => {
      render(<WritingAssistant demo suggestions={["Make it shorter"]} />);
      const chip = screen.getByRole("button", { name: "Make it shorter" });
      act(() => chip.focus());
      fireEvent.click(chip);
      const field = screen.getByRole("textbox", { name: "Message" });
      expect(document.activeElement).toBe(field);
      await advance(3000);
      const reset = screen.getByRole("button", { name: "New chat" });
      act(() => reset.focus());
      fireEvent.click(reset);
      expect(document.activeElement).toBe(field);
    });
  });
}
