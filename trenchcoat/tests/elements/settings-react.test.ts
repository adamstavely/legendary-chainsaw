import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { Dialog, NumberField } from "../../src/elements/react";
import type { TcDialog } from "../../src/elements/dialog";
import { cleanup, settle } from "./helpers";
afterEach(cleanup);

test("uncontrolled wrapper retains edits and form reset across parent renders", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const root = createRoot(host);
  const render = (key: number) =>
    flushSync(() =>
      root.render(
        React.createElement(
          "form",
          { "data-render": key },
          React.createElement(NumberField, {
            label: "Workers",
            name: "workers",
            defaultValue: 4,
            min: 1,
            max: 32,
          }),
        ),
      ),
    );
  render(1);
  await settle();
  const input = host.querySelector("input")!;
  input.value = "8";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  render(2);
  await settle();
  expect(input.value).toBe("8");
  host.querySelector("form")!.reset();
  await settle();
  render(3);
  await settle();
  expect(input.value).toBe("4");
  root.unmount();
});

test("React dialog content stays interactive across renders and can close the modal", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const root = createRoot(host);
  function Demo() {
    const [open, setOpen] = React.useState(true);
    const [count, setCount] = React.useState(0);
    return React.createElement(
      Dialog,
      { label: "Settings", open, onOpenChange: setOpen },
      React.createElement(
        "button",
        { onClick: () => setCount((n) => n + 1) },
        `Count ${count}`,
      ),
      React.createElement("button", { onClick: () => setOpen(false) }, "Done"),
    );
  }
  flushSync(() => root.render(React.createElement(Demo)));
  await settle();
  await settle();
  const el = host.querySelector<TcDialog>("tc-dialog")!;
  const count = [...el.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent === "Count 0",
  )!;
  expect(count.closest("dialog")).not.toBe(null);
  count.click();
  await settle();
  expect(count.textContent).toBe("Count 1");
  [...el.querySelectorAll<HTMLButtonElement>("button")]
    .find((b) => b.textContent === "Done")!
    .click();
  await settle();
  expect(el.open).toBe(false);
  root.unmount();
});
