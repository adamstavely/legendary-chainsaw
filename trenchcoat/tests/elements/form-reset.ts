/*
 * Native form reset through a React wrapper, shared by the configuration panels' tests. React sets props after the
 * element connects, so the reset baseline has to be what React passed, and the reset has to reach the app through
 * onChange – a controlled panel keeps the app's value until the app takes it.
 */
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, vi } from "vitest";
import { settle } from "./helpers";

type Props<V> = { value?: V; defaultValue?: V; onChange?: (value: V, ...rest: never[]) => void };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function expectReactFormReset<V>(Component: React.ComponentType<any>, tag: string, start: V, edited: V, extra: object = {}) {
  const host = document.body.appendChild(document.createElement("div"));
  const root = createRoot(host);
  const form = (props: Props<V>) => React.createElement("form", null, React.createElement(Component, { ...extra, ...props }));
  const el = () => host.querySelector(tag) as Element & { value: V };

  // Uncontrolled: the baseline is the value React passed, not the element's own default
  const onChange = vi.fn();
  await act(async () => root.render(form({ defaultValue: start, onChange })));
  await settle();
  await act(async () => host.querySelector("form")!.reset());
  await settle();
  expect(el().value).toEqual(start);

  // Controlled: the reset is proposed through onChange and the app's value stays until it takes it
  await act(async () => root.unmount());
  const again = createRoot(host);
  await act(async () => again.render(form({ value: start, onChange })));
  await settle();
  await act(async () => again.render(form({ value: edited, onChange })));
  await settle();
  onChange.mockClear();
  await act(async () => host.querySelector("form")!.reset());
  await settle();
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange.mock.calls[0][0]).toEqual(start);
  expect(el().value).toEqual(edited);
  await act(async () => again.unmount());
  host.remove();
}
