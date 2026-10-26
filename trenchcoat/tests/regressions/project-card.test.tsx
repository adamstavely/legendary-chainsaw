/* project-card (Phase 3): control decided by the value prop, never by whether a callback is passed (audit theme 4) */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/project-card";
import * as clean from "@components/project-card-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const tasks = [
  { id: "a", label: "Write brief", done: false, assignee: "Ada" },
  { id: "b", label: "Review", done: true },
];

for (const [style, ui] of styles) {
  describe(`project-card ${style}`, () => {
    test("uncontrolled: an onTasksChange for analytics doesn't freeze the ticks", () => {
      const onTasksChange = vi.fn();
      render(<ui.ProjectCard title="Onboarding" defaultTasks={tasks} onTasksChange={onTasksChange} defaultOpen />);
      const row = screen.getByRole("checkbox", { name: /Write brief/ });
      fireEvent.click(row);
      expect(row.getAttribute("aria-checked")).toBe("true");
      expect(onTasksChange).toHaveBeenCalledWith([{ ...tasks[0], done: true }, tasks[1]]);
    });

    test("controlled tasks: ticks are reported, and only the parent's list shows", () => {
      const onTasksChange = vi.fn();
      const { rerender } = render(<ui.ProjectCard title="Onboarding" tasks={tasks} onTasksChange={onTasksChange} defaultOpen />);
      fireEvent.click(screen.getByRole("checkbox", { name: /Write brief/ }));
      expect(onTasksChange).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("checkbox", { name: /Write brief/ }).getAttribute("aria-checked")).toBe("false");
      rerender(<ui.ProjectCard title="Onboarding" tasks={[{ ...tasks[0], done: true }, tasks[1]]} onTasksChange={onTasksChange} defaultOpen />);
      expect(screen.getByRole("checkbox", { name: /Write brief/ }).getAttribute("aria-checked")).toBe("true");
    });

    test("uncontrolled status starts from defaultStatus and still reports picks", () => {
      const onStatusChange = vi.fn();
      render(<ui.ProjectCard title="Onboarding" defaultTasks={tasks} defaultStatus="review" onStatusChange={onStatusChange} defaultOpen />);
      expect(screen.getByRole("radio", { name: "In review" }).getAttribute("aria-checked")).toBe("true");
      fireEvent.click(screen.getByRole("radio", { name: "Done" }));
      expect(onStatusChange).toHaveBeenCalledWith("done");
      expect(screen.getByRole("radio", { name: "Done" }).getAttribute("aria-checked")).toBe("true");
    });

    test("a press outside closes the open card", () => {
      const onOpenChange = vi.fn();
      render(<ui.ProjectCard title="Onboarding" defaultTasks={tasks} defaultOpen onOpenChange={onOpenChange} />);
      fireEvent.pointerDown(document.body);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    describe("WCAG pass", () => {
      const members = [{ name: "Maya Chen" }, { name: "Jonas Weber" }];
      const statusBtn = (c: HTMLElement) => c.querySelector<HTMLElement>(".ui-pc__status")!;

      test("picking a status moves focus to the status tag before the row goes inert", () => {
        const onStatusChange = vi.fn();
        const { container } = render(<ui.ProjectCard title="Onboarding" defaultTasks={tasks} defaultOpen onStatusChange={onStatusChange} />);
        fireEvent.click(statusBtn(container));
        const option = screen.getByRole("radio", { name: "In review" });
        option.focus();
        fireEvent.click(option);
        expect(onStatusChange).toHaveBeenCalledWith("review");
        expect(container.querySelector(".ui-pc__fold--status")!.hasAttribute("inert")).toBe(true);
        expect(document.activeElement).toBe(statusBtn(container));
      });

      test("Esc in the status row returns focus to the tag; Esc again closes the card onto the head", () => {
        const { container } = render(<ui.ProjectCard title="Onboarding" defaultTasks={tasks} defaultOpen />);
        fireEvent.click(statusBtn(container));
        const option = screen.getByRole("radio", { name: "To do" });
        option.focus();
        fireEvent.keyDown(option, { key: "Escape" });
        expect(document.activeElement).toBe(statusBtn(container));
        screen.getByRole("checkbox", { name: /Write brief/ }).focus();
        fireEvent.keyDown(document.activeElement!, { key: "Escape" });
        expect(document.activeElement).toBe(container.querySelector(".ui-pc__toggle"));
      });

      test("closing the card from the head while focus is in the body moves focus to the head", () => {
        const { container } = render(<ui.ProjectCard title="Onboarding" defaultTasks={tasks} defaultOpen />);
        screen.getByRole("checkbox", { name: /Write brief/ }).focus();
        // e.g. a press outside or the pointer leaving – the same close path
        fireEvent.pointerDown(document.body);
        return Promise.resolve().then(() => expect(document.activeElement).toBe(container.querySelector(".ui-pc__toggle")));
      });

      test("status options follow the radio pattern: one tab stop, arrows choose", () => {
        const onStatusChange = vi.fn();
        const { container } = render(<ui.ProjectCard title="Onboarding" defaultTasks={tasks} defaultOpen onStatusChange={onStatusChange} />);
        fireEvent.click(statusBtn(container));
        const radios = screen.getAllByRole("radio");
        expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1, -1]);
        radios[0].focus();
        fireEvent.keyDown(radios[0], { key: "ArrowRight" });
        expect(onStatusChange).toHaveBeenCalledWith("progress");
        expect(document.activeElement).toBe(radios[1]);
        expect(radios[1].getAttribute("aria-checked")).toBe("true");
        // Arrows don't fold the row
        expect(container.querySelector(".ui-pc__fold--status")!.hasAttribute("inert")).toBe(false);
      });

      test("people buttons are named by their content (no aria-label that hides the initials), the caption is not live", () => {
        const { container } = render(<ui.ProjectCard title="Onboarding" defaultTasks={tasks} members={members} defaultOpen />);
        const maya = screen.getByRole("button", { name: "Only Maya Chen's subtasks" });
        expect(maya.hasAttribute("aria-label")).toBe(false);
        expect(maya.querySelector(".ui-pc__avatar")!.getAttribute("aria-hidden")).toBe("true");
        expect(container.querySelector("[aria-live]")).toBeNull();
      });
    });
  });
}
