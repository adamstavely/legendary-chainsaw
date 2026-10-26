/*
 * integration-settings: without onGenerateKey it made up an sk_live_… key, and a rejected generate or save
 * left an unhandled rejection with no message.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/integration-settings";
import * as clean from "@components/integration-settings-clean";

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

const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("IntegrationSettings:"));
const generate = () => screen.getByRole("button", { name: "Generate a new API key" });

for (const [style, ui] of styles) {
  const { IntegrationSettings } = ui;
  const base = { name: "Shopify", logo: <span /> };

  describe(`integration-settings (${style})`, () => {
    // Runs first: the warning is once per page, so a later test would find it already spent
    test("made-up keys: marked as demo keys, silent with demo, otherwise one warning", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { unmount } = render(<IntegrationSettings {...base} demo />);
      fireEvent.click(generate());
      await advance(800);
      expect(warnings(warn)).toHaveLength(0);
      expect(screen.getByText(/^sk_demo_/)).toBeTruthy();
      expect(screen.queryByText(/sk_live_/)).toBeNull();
      unmount();

      render(
        <>
          <IntegrationSettings {...base} />
          <IntegrationSettings {...base} />
        </>,
      );
      for (const b of screen.getAllByRole("button", { name: "Generate a new API key" })) fireEvent.click(b);
      await advance(800);
      expect(warnings(warn)).toHaveLength(1);
    });

    test("a rejected onGenerateKey shows an error and the button works again", async () => {
      const onGenerateKey = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error("quota")).mockResolvedValue("sk_test_123456789abc");
      render(<IntegrationSettings {...base} onGenerateKey={onGenerateKey} />);
      fireEvent.click(generate());
      await advance(100);
      expect(screen.getByRole("alert").textContent).toMatch(/couldn't be generated/);
      fireEvent.click(generate());
      await advance(100);
      expect(screen.getByText("sk_test_123456789abc")).toBeTruthy();
      expect(screen.queryByRole("alert")).toBeNull();
    });

    test("a rejected onSave keeps the changes unsaved and shows an error", async () => {
      const onSave = vi.fn(() => Promise.reject(new Error("500")));
      render(<IntegrationSettings {...base} onSave={onSave} />);
      fireEvent.change(screen.getByLabelText("Site address"), { target: { value: "shop.example.com" } });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await advance(100);
      expect(onSave).toHaveBeenCalled();
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn't save/);
      expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(false);
    });

    test("a failed clipboard write never says the key was copied", async () => {
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
      render(<IntegrationSettings {...base} onGenerateKey={() => "sk_test_123456789abc"} />);
      fireEvent.click(generate());
      await advance(100);
      fireEvent.click(screen.getByRole("button", { name: "Copy key" }));
      await advance(100);
      expect(screen.queryByText("Copied to the clipboard.")).toBeNull();
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn't copy/);
    });
  });
}

/* Phase 3 – one API contract: saved values follow their props, async switch, abort on unmount */
for (const [style, ui] of styles) {
  const { IntegrationSettings } = ui;
  const base = { name: "Shopify", logo: <span /> };
  const site = () => screen.getByLabelText("Site address") as HTMLInputElement;

  describe(`integration-settings (${style}) – contract`, () => {
    test("defaultValues that arrive later are shown; an edited field keeps the edit", () => {
      const view = render(<IntegrationSettings {...base} defaultValues={{ siteUrl: "", timeZone: "(GMT +00:00) London" }} />);
      expect(site().value).toBe("");
      view.rerender(<IntegrationSettings {...base} defaultValues={{ siteUrl: "shop.example.com", timeZone: "(GMT +00:00) London" }} />);
      expect(site().value).toBe("shop.example.com");
      fireEvent.change(site(), { target: { value: "mine.example.com" } });
      view.rerender(<IntegrationSettings {...base} defaultValues={{ siteUrl: "other.example.com", timeZone: "(GMT +09:00) Tokyo" }} />);
      expect(site().value).toBe("mine.example.com");
      expect(screen.getByText("(GMT +09:00) Tokyo")).toBeTruthy();
    });

    test("controlled values: Save reports through onValuesChange", async () => {
      const onValuesChange = vi.fn();
      render(<IntegrationSettings {...base} values={{ siteUrl: "a.example.com" }} onValuesChange={onValuesChange} onSave={() => {}} />);
      fireEvent.change(site(), { target: { value: "b.example.com" } });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await advance(100);
      expect(onValuesChange).toHaveBeenCalledWith(expect.objectContaining({ siteUrl: "b.example.com" }));
    });

    test("an async switch shows pending, stays put on failure and says so", async () => {
      let fail!: () => void;
      const onToggle = vi.fn(() => new Promise<void>((_, reject) => (fail = () => reject(new Error("x")))));
      render(<IntegrationSettings {...base} onToggle={onToggle} />);
      const sw = screen.getByRole("switch");
      fireEvent.click(sw);
      expect(sw.getAttribute("aria-busy")).toBe("true");
      await act(async () => fail());
      expect(sw.getAttribute("aria-checked")).toBe("true");
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn't pause Shopify/);
    });

    test("onGenerateKey and onSave get a signal that aborts on unmount", async () => {
      let signal!: AbortSignal;
      const onGenerateKey = vi.fn((o: { signal: AbortSignal }) => ((signal = o.signal), new Promise<string>(() => {})));
      const { unmount } = render(<IntegrationSettings {...base} onGenerateKey={onGenerateKey} />);
      fireEvent.click(generate());
      expect(signal.aborted).toBe(false);
      unmount();
      expect(signal.aborted).toBe(true);
    });
  });
}

/*
 * WCAG pass: the time-zone trigger's name keeps its value, the zone menu is a combobox + listbox (focus stays in the
 * search, Esc / pick return focus to the trigger, Tab closes), Generate ↔ Regenerate and the closing save bar never
 * drop focus to <body>, the address is validated on leaving the field, and results go to a persistent status region.
 */
for (const [style, ui] of styles) {
  const { IntegrationSettings } = ui;
  const base = { name: "Shopify", logo: <span />, demo: true };

  describe(`integration-settings a11y (${style})`, () => {
    test("time zone: the trigger's name includes the value; menu keyboard pattern and focus return", () => {
      const onSave = vi.fn();
      render(<IntegrationSettings {...base} onSave={onSave} defaultValues={{ timeZone: "(GMT +00:00) London" }} />);
      const trigger = screen.getByRole("button", { name: /Time zone.*London/ });
      fireEvent.click(trigger);
      const search = screen.getByRole("combobox", { name: "Search time zones" });
      expect(document.activeElement).toBe(search);
      const list = screen.getByRole("listbox");
      expect(list.querySelector("button")).toBeNull();
      const active = () => search.getAttribute("aria-activedescendant");
      expect(document.getElementById(active()!)?.textContent).toMatch(/London/);
      fireEvent.keyDown(search, { key: "ArrowDown" });
      expect(document.getElementById(active()!)?.textContent).toMatch(/Berlin/);
      fireEvent.keyDown(search, { key: "Enter" });
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(trigger.textContent).toMatch(/Berlin/);
      fireEvent.click(trigger);
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(document.activeElement).toBe(trigger);
      fireEvent.click(trigger);
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Tab" });
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    test("Generate keeps focus while working, then Regenerate has it; busy Regenerate keeps a name", async () => {
      render(<IntegrationSettings {...base} />);
      const gen = generate();
      gen.focus();
      fireEvent.click(gen);
      expect(gen.getAttribute("aria-disabled")).toBe("true");
      expect(document.activeElement).toBe(gen);
      await advance(800);
      const regen = screen.getByRole("button", { name: "Regenerate" });
      expect(document.activeElement).toBe(regen);
      fireEvent.click(regen);
      expect(screen.getByRole("button", { name: /Regenerating/ })).toBe(regen);
      expect(document.activeElement).toBe(regen);
    });

    test("Discard and Save close the bar without dropping focus to <body>; results are announced", async () => {
      render(<IntegrationSettings {...base} onSave={() => Promise.resolve()} />);
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      const field = screen.getByRole("textbox", { name: "Site address" });
      fireEvent.change(field, { target: { value: "shop.com" } });
      const discard = screen.getByRole("button", { name: "Discard" });
      discard.focus();
      fireEvent.click(discard);
      await act(async () => {});
      expect(document.activeElement).toBe(field);
      expect(status.textContent).toBe("Changes discarded.");
      fireEvent.change(field, { target: { value: "shop.com" } });
      const save = screen.getByRole("button", { name: "Save" });
      save.focus();
      fireEvent.click(save);
      await act(async () => {});
      expect(document.activeElement).toBe(field);
      expect(status.textContent).toBe("Changes saved.");
    });

    test("the address is validated on leaving the field, in a hint that is live from mount", () => {
      render(<IntegrationSettings {...base} />);
      const field = screen.getByRole("textbox", { name: "Site address" });
      const hint = document.getElementById(field.getAttribute("aria-describedby")!)!;
      expect(hint.getAttribute("aria-live")).toBe("polite");
      fireEvent.change(field, { target: { value: "not a domain" } });
      expect(field.getAttribute("aria-invalid")).toBe("false");
      expect(hint.textContent).not.toMatch(/doesn't look like a domain/);
      fireEvent.blur(field);
      expect(field.getAttribute("aria-invalid")).toBe("true");
      expect(hint.textContent).toMatch(/doesn't look like a domain/);
      fireEvent.change(field, { target: { value: "shop.com" } });
      expect(field.getAttribute("aria-invalid")).toBe("false");
    });
  });
}
