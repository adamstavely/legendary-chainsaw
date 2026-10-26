/* stepper-form (Phase 3): values/step are controllable with deprecated initial* aliases; onComplete gets a signal and
 * nothing is set after unmount; StepperInput keeps its field wiring and doesn't force autoComplete; StepperTags and
 * StepperChoices take name/disabled/required and ignore IME composition */
import { StrictMode, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/stepper-form";
import * as clean from "@components/stepper-form-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

afterEach(() => vi.restoreAllMocks());

type Values = { name: string; invites: string[]; plan: string };
const start: Values = { name: "", invites: ["a@b.co"], plan: "x" };

for (const [style, ui] of styles) {
  const steps: standard.Step<Values>[] = [
    {
      id: "name",
      title: "Name",
      render: ({ values, setValues }) => (
        <ui.StepperField name="name" label="Name" hint="Shown to your team">
          <ui.StepperInput name="name" value={values.name} aria-describedby="extra" onChange={(e) => setValues({ name: e.target.value })} />
        </ui.StepperField>
      ),
    },
    {
      id: "more",
      title: "More",
      render: ({ values, setValues }) => (
        <>
          <ui.StepperField name="invites" label="Invites">
            <ui.StepperTags name="invites" required value={values.invites} onChange={(invites) => setValues({ invites })} />
          </ui.StepperField>
          <ui.StepperChoices name="plan" label="Plan" value={values.plan} onChange={(plan) => setValues({ plan })} options={[{ value: "x", title: "X" }, { value: "y", title: "Y" }]} />
        </>
      ),
    },
  ];

  describe(`stepper-form ${style}`, () => {
    test("controlled values: typing is reported, a parent holding state sees every patch", () => {
      const seen: Values[] = [];
      function Parent() {
        const [values, setValues] = useState(start);
        return <ui.StepperForm steps={steps} values={values} onValuesChange={(v) => (seen.push(v), setValues(v))} />;
      }
      render(<Parent />);
      fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Ada" } });
      expect(seen.at(-1)).toEqual({ ...start, name: "Ada" });
      expect((screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement).value).toBe("Ada");
    });

    test("deprecated initialValues/initialStep still work", () => {
      render(<ui.StepperForm steps={steps} initialValues={start} initialStep={1} />);
      expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeTruthy();
    });

    test("StepperInput: field wiring wins, consumer description is kept, autoComplete isn't forced", () => {
      render(<ui.StepperForm steps={steps} defaultValues={start} />);
      const input = screen.getByRole("textbox", { name: "Name" });
      expect(input.hasAttribute("autocomplete")).toBe(false);
      expect(input.getAttribute("name")).toBe("name");
      const described = input.getAttribute("aria-describedby")!.split(" ");
      expect(described).toContain("extra");
      expect(document.getElementById(described[0])!.textContent).toBe("Shown to your team");
    });

    test("tags and choices submit through hidden inputs, and Enter during IME composition doesn't add a tag", () => {
      const { container } = render(<ui.StepperForm steps={steps} defaultValues={start} defaultStep={1} />);
      const form = container.querySelector("form")!;
      expect(new FormData(form).get("invites")).toBe("a@b.co");
      expect(new FormData(form).get("plan")).toBe("x");
      const tags = container.querySelector<HTMLInputElement>(".ui-sf__tags-input")!;
      expect(tags.getAttribute("aria-required")).toBe("true");
      fireEvent.change(tags, { target: { value: "c@d.co" } });
      fireEvent.keyDown(tags, { key: "Enter", isComposing: true });
      expect(new FormData(form).get("invites")).toBe("a@b.co");
      fireEvent.keyDown(tags, { key: "Enter" });
      expect(new FormData(form).get("invites")).toBe("a@b.co,c@d.co");
    });

    test("onComplete gets a signal that aborts on unmount, and nothing is set afterwards", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      let signal: AbortSignal | undefined;
      let resolve = () => {};
      const onComplete = (_: Values, o: { signal: AbortSignal }) => {
        signal = o.signal;
        return new Promise<void>((r) => (resolve = r));
      };
      const { container, unmount } = render(
        <StrictMode>
          <ui.StepperForm steps={steps} defaultValues={start} defaultStep={1} onComplete={onComplete} />
        </StrictMode>,
      );
      await act(async () => {
        fireEvent.submit(container.querySelector("form")!);
      });
      expect(signal?.aborted).toBe(false);
      unmount();
      expect(signal?.aborted).toBe(true);
      await act(async () => resolve());
      expect(error).not.toHaveBeenCalled();
    });

    test("a rejected onComplete shows an error and can be retried", async () => {
      const onComplete = vi.fn().mockRejectedValueOnce(new Error("Server said no")).mockResolvedValueOnce(undefined);
      const { container } = render(<ui.StepperForm steps={steps} defaultValues={start} defaultStep={1} onComplete={onComplete} />);
      await act(async () => {
        fireEvent.submit(container.querySelector("form")!);
      });
      expect(screen.getByRole("alert").textContent).toBe("Server said no");
      await act(async () => {
        fireEvent.submit(container.querySelector("form")!);
      });
      expect(onComplete).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
}

/* WCAG + design pass: status region from mount, chip × focus rescue, tag problems announced, invalid field scrolled
 * into view above the sticky footer, StepperTags autoComplete */
for (const [style, ui] of styles) {
  type V = { name: string; invites: string[] };
  const steps: standard.Step<V>[] = [
    {
      id: "name",
      title: "Name",
      validate: (v) => ({ name: v.name ? undefined : "Add a name" }),
      render: ({ values, setValues }) => (
        <ui.StepperField name="name" label="Name">
          <ui.StepperInput value={values.name} onChange={(e) => setValues({ name: e.target.value })} />
        </ui.StepperField>
      ),
    },
    {
      id: "team",
      title: "Team",
      render: ({ values, setValues }) => (
        <ui.StepperField name="invites" label="Invites">
          <ui.StepperTags value={values.invites} autoComplete="email" onChange={(invites) => setValues({ invites })} />
        </ui.StepperField>
      ),
    },
  ];

  describe(`stepper-form ${style} – a11y`, () => {
    test("one status region is there from mount and says what a building block found", () => {
      render(<ui.StepperForm steps={steps} defaultValues={{ name: "Ada", invites: [] }} defaultStep={1} />);
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      const input = screen.getByRole("textbox", { name: "Invites" });
      expect(input.getAttribute("autocomplete")).toBe("email");
      fireEvent.change(input, { target: { value: "nope" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(status.textContent).toBe("That doesn't look like an email address");
      expect(screen.getAllByRole("status")).toHaveLength(1);
    });

    test("removing a chip moves focus to the next chip's ×, then the previous one, then the text field", () => {
      function Parent() {
        const [values, setValues] = useState<V>({ name: "Ada", invites: ["a@b.co", "c@d.co", "e@f.co"] });
        return <ui.StepperForm steps={steps} values={values} onValuesChange={setValues} defaultStep={1} />;
      }
      render(<Parent />);
      const x1 = screen.getByRole("button", { name: "Remove a@b.co" });
      x1.focus();
      act(() => x1.click());
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove c@d.co" }));
      const x3 = screen.getByRole("button", { name: "Remove e@f.co" });
      x3.focus();
      act(() => x3.click());
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove c@d.co" }));
      act(() => (document.activeElement as HTMLElement).click());
      expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Invites" }));
    });

    test("a failed Continue focuses the invalid field and scrolls it into view (not under the sticky footer)", () => {
      const spy = vi.fn();
      Element.prototype.scrollIntoView = spy;
      render(<ui.StepperForm steps={steps} defaultValues={{ name: "", invites: [] }} />);
      act(() => fireEvent.submit(screen.getByRole("textbox", { name: "Name" }).closest("form")!));
      expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Name" }));
      expect(spy).toHaveBeenCalledWith({ block: "nearest" });
      expect(screen.getByRole("status").textContent).toBe("Add a name");
      // @ts-expect-error – jsdom has no scrollIntoView; remove the stub again
      delete Element.prototype.scrollIntoView;
    });
  });
}
