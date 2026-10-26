/* combobox: Phase 3 contract – form integration, IME, controllable value/open, async create */
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/combobox";
import * as clean from "@components/combobox-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const OPTIONS = [
  { value: "a", label: "Ada" },
  { value: "b", label: "Ben" },
  { value: "c", label: "Cy" },
];

for (const [style, ui] of styles) {
  describe(`combobox ${style}`, () => {
    const hidden = (c: HTMLElement) => [...c.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((i) => [i.name, i.value, i.disabled]);

    test("name renders one hidden input per value, submitted with a native form", async () => {
      const view = render(
        <form>
          <ui.Combobox options={OPTIONS} name="people" defaultValue={["a", "c"]} />
        </form>,
      );
      expect(hidden(view.container)).toEqual([
        ["people", "a", false],
        ["people", "c", false],
      ]);
      expect(new FormData(view.container.querySelector("form")!).getAll("people")).toEqual(["a", "c"]);
    });

    test("required blocks an empty native form; disabled leaves the values out", async () => {
      const view = render(
        <form>
          <ui.Combobox options={OPTIONS} name="people" required />
        </form>,
      );
      const form = view.container.querySelector("form")!;
      expect(form.checkValidity()).toBe(false);
      view.rerender(
        <form>
          <ui.Combobox options={OPTIONS} name="people" required defaultValue={["b"]} value={["b"]} />
        </form>,
      );
      expect(form.checkValidity()).toBe(true);
      view.rerender(
        <form>
          <ui.Combobox options={OPTIONS} name="people" value={["b"]} disabled />
        </form>,
      );
      expect(new FormData(form).getAll("people")).toEqual([]);
      expect(view.container.querySelector<HTMLInputElement>('[role="combobox"]')!.disabled).toBe(true);
    });

    test("Enter while an IME is composing does not pick", async () => {
      const onChange = vi.fn();
      const view = render(<ui.Combobox options={OPTIONS} onChange={onChange} defaultOpen />);
      const input = view.container.querySelector<HTMLInputElement>('[role="combobox"]')!;
      fireEvent.keyDown(input, { key: "Enter", isComposing: true });
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onChange).toHaveBeenCalledWith(["a"], [OPTIONS[0]]);
    });

    test("controlled value only reports; open is controllable", async () => {
      const onChange = vi.fn();
      const onOpenChange = vi.fn();
      const view = render(<ui.Combobox options={OPTIONS} name="p" value={["a"]} onChange={onChange} open onOpenChange={onOpenChange} />);
      const input = view.container.querySelector<HTMLInputElement>('[role="combobox"]')!;
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onChange).toHaveBeenCalledWith(["a", "b"], [OPTIONS[0], OPTIONS[1]]);
      expect(hidden(view.container).map((h) => h[1])).toEqual(["a"]);
      fireEvent.keyDown(input, { key: "Escape" });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(view.container.querySelector('[role="listbox"]')).toBeTruthy();
    });

    test("an async onCreate shows pending, recovers from a rejection, then picks the created option", async () => {
      let reject!: (e: Error) => void;
      let resolve!: (o: { value: string; label: string }) => void;
      const onCreate = vi
        .fn()
        .mockImplementationOnce(() => new Promise((_, r) => (reject = r)))
        .mockImplementationOnce(() => new Promise((r) => (resolve = r)));
      const onChange = vi.fn();
      const view = render(<ui.Combobox options={OPTIONS} creatable onCreate={onCreate} onChange={onChange} defaultOpen />);
      const input = view.container.querySelector<HTMLInputElement>('[role="combobox"]')!;
      fireEvent.change(input, { target: { value: "Dee" } });
      fireEvent.keyDown(input, { key: "Enter" });
      const row = () => view.container.querySelector<HTMLElement>('[class*="__create"]')!;
      expect(row().getAttribute("aria-busy")).toBe("true");
      await act(async () => reject(new Error("nope")));
      expect(row().textContent).toMatch(/Couldn't create/);
      expect(row().getAttribute("aria-busy")).toBeNull();
      fireEvent.keyDown(input, { key: "Enter" });
      await act(async () => resolve({ value: "d", label: "Dee" }));
      expect(onChange).toHaveBeenCalledWith(["d"], [{ value: "d", label: "Dee" }]);
    });

    test("className, rest props and ref reach the root", () => {
      const ref = { current: null as HTMLDivElement | null };
      const view = render(<ui.Combobox options={OPTIONS} ref={ref} className="mine" id="field" />);
      const root = view.container.querySelector<HTMLElement>("#field")!;
      expect(ref.current).toBe(root);
      expect(root.className).toMatch(/ui-cbx.*mine/);
    });

    // WCAG fix pass (S2, S10, 1.4.13, 4.1.2) and the long-list windowing (performance audit)
    test("the active row keeps its highlight when the pointer leaves the list; the keyboard adds the focus ring", () => {
      const view = render(<ui.Combobox options={OPTIONS} defaultOpen />);
      const root = view.container.querySelector<HTMLElement>(".ui-cbx")!;
      const input = view.container.querySelector<HTMLInputElement>('[role="combobox"]')!;
      const pill = view.container.querySelector<HTMLElement>(".ui-cbx__pill")!;
      fireEvent.mouseMove(view.getAllByRole("option")[1]);
      expect(root.hasAttribute("data-kbd")).toBe(false);
      fireEvent.mouseLeave(view.getByRole("listbox"));
      expect(pill.style.opacity).toBe("1");
      expect(input.getAttribute("aria-activedescendant")).toBe(view.getAllByRole("option")[1].id);
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(root.hasAttribute("data-kbd")).toBe(true);
      expect(pill.style.opacity).toBe("1");
    });

    test("“+N” names the hidden picks and opens the list, where they can be unticked", () => {
      const onChange = vi.fn();
      const view = render(<ui.Combobox options={OPTIONS} defaultValue={["a", "b", "c"]} maxVisibleTags={1} onChange={onChange} />);
      const more = view.getByRole("button", { name: /more selected/ });
      expect(more.getAttribute("aria-label")).toMatch(/^(2|3) more selected: .*Cy/);
      fireEvent.click(more);
      expect(view.getByRole("listbox")).toBeTruthy();
      expect(document.activeElement).toBe(view.container.querySelector('[role="combobox"]'));
      fireEvent.click(view.getByRole("option", { name: "Cy" }));
      expect(onChange).toHaveBeenLastCalledWith(["a", "b"], expect.anything());
    });

    test("invalid marks the input aria-invalid and the root data-invalid", () => {
      const view = render(<ui.Combobox options={OPTIONS} invalid />);
      expect(view.container.querySelector('[role="combobox"]')!.getAttribute("aria-invalid")).toBe("true");
      expect(view.container.querySelector(".ui-cbx")!.hasAttribute("data-invalid")).toBe(true);
    });

    test("a long list renders only the rows in view, keeps the active one and gives every row its position", () => {
      const many = Array.from({ length: 1000 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}`, group: i < 500 ? "First" : "Second" }));
      const view = render(<ui.Combobox options={many} defaultOpen />);
      const input = view.container.querySelector<HTMLInputElement>('[role="combobox"]')!;
      const rows = view.getAllByRole("option");
      expect(rows.length).toBeLessThan(100);
      expect(rows[0].getAttribute("aria-setsize")).toBe("1000");
      expect(rows[0].getAttribute("aria-posinset")).toBe("1");
      fireEvent.keyDown(input, { key: "ArrowUp" });
      const active = document.getElementById(input.getAttribute("aria-activedescendant")!)!;
      expect(active.textContent).toContain("Option 999");
      expect(active.getAttribute("aria-posinset")).toBe("1000");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(view.container.querySelector('input[type="hidden"]')).toBeNull();
      expect(view.getByRole("list", { name: "Selected" }).textContent).toContain("Option 999");
    });

    test("a short list renders every row without positions", () => {
      const view = render(<ui.Combobox options={OPTIONS} defaultOpen />);
      const rows = view.getAllByRole("option");
      expect(rows).toHaveLength(3);
      expect(rows[0].hasAttribute("aria-setsize")).toBe(false);
    });
  });
}
