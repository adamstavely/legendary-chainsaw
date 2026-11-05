/*
 * <tc-terminal> in real browsers: output and colours, commands, history, interrupt and clear, following the end,
 * windowing, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/terminal";
import type { TcTerminal } from "../../src/elements/terminal";
import { Terminal } from "../../src/elements/react/terminal";
import { checkProps, loadSchema } from "../../src/generative";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const make = (output = "", look: "standard" | "clean" = "standard") => fixture<TcTerminal>(html`<tc-terminal look=${look} .output=${output}></tc-terminal>`);
const input = (el: Element) => el.querySelector<HTMLInputElement>(".ui-trm__input")!;
const press = (el: Element, key: string, init: KeyboardEventInit = {}) => input(el).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));
const frames = async (n: number) => {
  for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r));
};
async function type(el: TcTerminal, text: string) {
  input(el).value = text;
  input(el).dispatchEvent(new Event("input", { bubbles: true }));
  await el.updateComplete;
}

describe("tc-terminal", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: draws output with colours as text, never HTML`, async () => {
      const el = await make("\x1b[31mred\x1b[0m plain\n<b>not bold</b>\n", look);
      expect(el.dataset.ui).toBe("trm");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-trm__fg-red")!.textContent).toBe("red");
      expect(el.querySelector(".ui-trm__out b")).toBeNull();
      expect(el.text).toBe("red plain\n<b>not bold</b>");
      expect(el.querySelector('[role="log"]')).not.toBeNull();
    });
  }

  test("colon sub-parameters are part of their code, and private CSI sequences are consumed", async () => {
    const el = await make("\x1b[1;4mA\x1b[4:0mB\x1b[0m\n\x1b[4:3mC\x1b[0m\n\x1b[38:2::255:0:0mR\x1b[0m\n\x1b[>4;2mkeys\n");
    const lines = [...el.querySelectorAll(".ui-trm__line")];
    // 4:0 turns the underline off and keeps the bold
    expect([...lines[0].querySelectorAll("span")].map((s) => [s.className, s.textContent])).toEqual([
      ["ui-trm__b ui-trm__u", "A"],
      ["ui-trm__b", "B"],
    ]);
    // 4:3, a curly underline, is an underline – not italic
    expect(lines[1].querySelector("span")!.className).toBe("ui-trm__u");
    // The colour space's empty slot isn't a reset
    expect(lines[2].querySelector("span")!.className).toBe("ui-trm__fg-red");
    expect(lines[3].textContent).toBe("keys");
  });

  test("Enter fires tc-command, empties the prompt and remembers the command", async () => {
    const el = await make();
    const got: string[] = [];
    el.addEventListener("tc-command", (e) => got.push((e as CustomEvent).detail.command));
    await type(el, "npm test");
    press(el, "Enter");
    await el.updateComplete;
    expect(got).toEqual(["npm test"]);
    expect(el.value).toBe("");
    press(el, "ArrowUp");
    await el.updateComplete;
    expect(el.value).toBe("npm test");
  });

  test("a prevented tc-command keeps the text", async () => {
    const el = await make();
    el.addEventListener("tc-command", (e) => e.preventDefault());
    await type(el, "rm notes");
    press(el, "Enter");
    await el.updateComplete;
    expect(el.value).toBe("rm notes");
  });

  test("history walks back and returns to what was being written", async () => {
    const el = await make();
    el.history = ["one", "two"];
    await el.updateComplete;
    await type(el, "dra");
    press(el, "ArrowUp");
    await el.updateComplete;
    expect(el.value).toBe("two");
    press(el, "ArrowUp");
    await el.updateComplete;
    expect(el.value).toBe("one");
    press(el, "ArrowUp");
    await el.updateComplete;
    expect(el.value).toBe("one");
    press(el, "ArrowDown");
    await el.updateComplete;
    press(el, "ArrowDown");
    await el.updateComplete;
    expect(el.value).toBe("dra");
  });

  test("while running, Enter waits and Ctrl+C and Stop interrupt", async () => {
    const el = await make();
    el.running = true;
    await el.updateComplete;
    let commands = 0;
    let stops = 0;
    el.addEventListener("tc-command", () => commands++);
    el.addEventListener("tc-interrupt", () => stops++);
    press(el, "Enter");
    press(el, "c", { ctrlKey: true });
    el.querySelector<HTMLButtonElement>(".ui-trm__stop")!.click();
    expect(commands).toBe(0);
    expect(stops).toBe(2);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Command running");
    el.running = false;
    await el.updateComplete;
    await el.updateComplete;
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Command finished");
    expect(el.querySelector(".ui-trm__stop")).toBeNull();
  });

  test("Ctrl+L and Clear fire tc-clear; Ctrl+C empties an idle prompt", async () => {
    const el = await make("text\n");
    let clears = 0;
    el.addEventListener("tc-clear", () => clears++);
    press(el, "l", { ctrlKey: true });
    el.querySelector<HTMLButtonElement>('[aria-label="Clear"]')!.click();
    expect(clears).toBe(2);
    await type(el, "half");
    input(el).setSelectionRange(4, 4);
    press(el, "c", { ctrlKey: true });
    await el.updateComplete;
    expect(el.value).toBe("");
  });

  test("masked input stays out of the history", async () => {
    const el = await make();
    el.masked = true;
    await el.updateComplete;
    expect(input(el).type).toBe("password");
    await type(el, "secret");
    press(el, "Enter");
    el.masked = false;
    await el.updateComplete;
    press(el, "ArrowUp");
    await el.updateComplete;
    expect(el.value).toBe("");
  });

  test("follows the end until the reader scrolls up", async () => {
    const lines = (n: number, from = 0) => Array.from({ length: n }, (_, i) => `line ${i + from}`).join("\n") + "\n";
    const el = await make(lines(50));
    const out = el.querySelector<HTMLElement>(".ui-trm__out")!;
    await expect.poll(() => out.scrollTop + out.clientHeight).toBeGreaterThanOrEqual(out.scrollHeight - 4);
    out.scrollTop = 0;
    out.dispatchEvent(new Event("scroll"));
    el.output += lines(5, 50);
    await settle(el.parentElement!);
    expect(out.scrollTop).toBe(0);
  });

  test("long output draws only the rows near the view, and its end", async () => {
    const big = Array.from({ length: 20000 }, (_, i) => `line ${i}`).join("\n") + "\n";
    const el = await make(big);
    await expect.poll(() => el.querySelector(".ui-trm__lines")!.textContent).toContain("line 19999");
    expect(el.querySelectorAll(".ui-trm__line").length).toBeLessThan(500);
  });

  test("long output that follows the end settles: no update per frame while idle, and a jump to the top shows rows", async () => {
    const big = Array.from({ length: 2000 }, (_, i) => `line ${i}`).join("\n") + "\n";
    const el = await make(big);
    await expect.poll(() => el.querySelector(".ui-trm__lines")!.textContent).toContain("line 1999");
    await frames(3);
    // Count the element's updates by wrapping its (protected) updated()
    let updates = 0;
    const probe = el as unknown as { updated: (c: Map<string, unknown>) => void };
    const was = probe.updated.bind(el);
    probe.updated = (c) => {
      updates++;
      was(c);
    };
    await frames(20);
    expect(updates).toBeLessThan(3);
    const out = el.querySelector<HTMLElement>(".ui-trm__out")!;
    out.scrollTop = 0;
    out.dispatchEvent(new Event("scroll"));
    await expect.poll(() => el.querySelector(".ui-trm__lines")!.textContent).toContain("line 0");
  });

  test("Clear keeps focus in the terminal when the page empties the output", async () => {
    const el = await make("text\n");
    el.addEventListener("tc-clear", () => (el.output = ""));
    const clear = el.querySelector<HTMLButtonElement>('[aria-label="Clear"]')!;
    clear.focus();
    clear.click();
    await el.updateComplete;
    expect(clear.disabled).toBe(true);
    expect(document.activeElement).toBe(input(el));
  });

  test("Enter while an input method is composing doesn't run the command", async () => {
    const el = await make();
    const commands: string[] = [];
    el.addEventListener("tc-command", (e) => commands.push((e as CustomEvent<{ command: string }>).detail.command));
    await type(el, "にほ");
    press(el, "Enter", { isComposing: true });
    press(el, "Enter", { keyCode: 229 });
    await el.updateComplete;
    expect(commands).toEqual([]);
    expect(el.value).toBe("にほ");
    press(el, "Enter");
    expect(commands).toEqual(["にほ"]);
  });

  test("a generated terminal can't become a password prompt: models can't set masked", async () => {
    const schema = await loadSchema("tc-terminal");
    const { props, issues } = checkProps(schema!, { output: "sudo password for adam:", masked: true });
    expect(props).toEqual({ output: "sudo password for adam:" });
    expect(issues.map((i) => i.path)).toEqual(["props/masked"]);
  });

  test("disabled can't be typed in", async () => {
    const el = await make();
    el.disabled = true;
    await el.updateComplete;
    expect(input(el).disabled).toBe(true);
  });

  test("React: uncontrolled text survives parent re-renders; controlled stays until changed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(Terminal, { defaultValue: "ls", title: "Shell" })));
    const el = host.querySelector("tc-terminal") as TcTerminal;
    expect(el.heading).toBe("Shell");
    await act(async () => void (await type(el, "ls -l")));
    await act(async () => root.render(React.createElement(Terminal, { defaultValue: "ls", title: "Shell 2" })));
    expect(el.value).toBe("ls -l");
    await act(async () => root.render(React.createElement(Terminal, { value: "fixed" })));
    await act(async () => void (await type(el, "other")));
    await settle(host);
    expect(el.value).toBe("fixed");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make("\x1b[32mok\x1b[0m \x1b[31mfailed\x1b[0m \x1b[2mdim\x1b[0m\n", look);
        el.running = true;
        await settle(el.parentElement!);
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.map((v) => v.id)).toEqual([]);
      });
});
