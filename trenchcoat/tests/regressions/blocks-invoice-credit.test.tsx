/*
 * blocks/invoice-credit: lines passed after mount crashed the credit note (their amounts were never copied into
 * state); issuing ignored a failing onIssue and showed "Issued" anyway.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { InvoiceCredit } from "@blocks/invoice-credit";

const line = (id: string, name: string, rate: number) => ({ id, name, qty: 1, rate, tax: 0.2 });

describe("blocks/invoice-credit", () => {
  test("lines passed later start picked in full", () => {
    const { rerender } = render(<InvoiceCredit lines={[line("a", "Plan", 100)]} defaultView="credit" />);
    rerender(<InvoiceCredit lines={[line("a", "Plan", 100), line("b", "Seats", 50)]} defaultView="credit" />);
    expect((screen.getByRole("textbox", { name: "Credit amount for Seats" }) as HTMLInputElement).value).toBe("50.00");
    expect(screen.getByRole("checkbox", { name: "Credit Seats" }).getAttribute("aria-checked")).toBe("true");
  });

  test("a rejected onIssue keeps the note editable and shows the error; a retry can succeed", async () => {
    const onIssue = vi.fn().mockRejectedValueOnce(new Error("Ledger is locked")).mockResolvedValueOnce(undefined);
    render(<InvoiceCredit lines={[line("a", "Plan", 100)]} defaultView="credit" onIssue={onIssue} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Issue credit note" })));
    expect(screen.getByRole("alert").textContent).toBe("Ledger is locked");
    expect(screen.queryByText("Issued")).toBeNull();
    expect(onIssue).toHaveBeenCalledWith({ a: 100 }, 120);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    expect(screen.getByText("Issued")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("a controlled view reports Credit invoice without switching", () => {
    const onViewChange = vi.fn();
    const { container } = render(<InvoiceCredit view="invoice" onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Credit invoice" }));
    expect(onViewChange).toHaveBeenCalledWith("credit");
    expect(container.querySelector(".ui-iv")!.getAttribute("data-view")).toBe("invoice");
  });
});

/* WCAG + design pass: real tabs (library SegmentedControl), focus follows the sheet that comes forward, one button
   for Issue / Edit, the "Issued" status region exists from mount */
describe("blocks/invoice-credit – keyboard and focus", () => {
  test("the switch is a tablist whose tabs control the sheets; arrows switch", () => {
    render(<InvoiceCredit />);
    const tabs = [screen.getByRole("tab", { name: "Invoice" }), screen.getByRole("tab", { name: "Credit note" })];
    const panel = document.getElementById(tabs[1].getAttribute("aria-controls")!)!;
    expect(panel.getAttribute("role")).toBe("tabpanel");
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Credit note" }).getAttribute("aria-selected")).toBe("true");
  });

  test("Credit invoice goes away – focus moves to the credit note; the related invoice link moves it back", () => {
    render(<InvoiceCredit />);
    const credit = screen.getByRole("button", { name: "Credit invoice" });
    credit.focus();
    fireEvent.click(credit);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Credit note");
    const back = screen.getByRole("button", { name: "INV-2041" });
    back.focus();
    fireEvent.click(back);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Invoice");
  });

  test("Issue and Edit are the same button, so focus stays; Issued is announced by a region present from mount", () => {
    const { container } = render(<InvoiceCredit defaultView="credit" />);
    const status = container.querySelector(".ui-iv__live[role='status']")!;
    expect(status.textContent).toBe("");
    const issue = screen.getByRole("button", { name: "Issue credit note" });
    issue.focus();
    fireEvent.click(issue);
    expect(status.textContent).toBe("Issued");
    expect(screen.getByRole("button", { name: "Edit credit note" })).toBe(issue);
    expect(document.activeElement).toBe(issue);
  });
});
