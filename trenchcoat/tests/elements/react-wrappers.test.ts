/*
 * The shared React wrapper helpers (src/elements/react/internal.ts) in a real browser.
 */
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { Combobox } from "../../src/elements/react";
import type { TcCombobox } from "../../src/elements/combobox";
import { cleanup, settle } from "./helpers";

afterEach(cleanup);

const options = [
  { value: "ana", label: "Ana Lima" },
  { value: "ben", label: "Ben Ito" },
];

describe("React wrappers", () => {
  test("uncontrolled: a value the user picked survives the parent re-rendering", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const render = (n: number) => flushSync(() => root.render(React.createElement("div", { "data-n": n }, React.createElement(Combobox, { label: "Who", options, defaultValue: ["ana"] }))));
    render(1);
    await settle();
    const el = host.querySelector<TcCombobox>("tc-combobox")!;
    el.value = ["ana", "ben"];
    el.dispatchEvent(new CustomEvent("tc-value-change", { detail: { value: ["ana", "ben"], options }, cancelable: true }));
    await settle();
    render(2);
    await settle();
    expect(el.value).toEqual(["ana", "ben"]);
    root.unmount();
  });
});
