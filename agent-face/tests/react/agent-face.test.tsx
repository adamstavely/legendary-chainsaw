import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import type { AgentFace as AgentFaceElement } from "../../src/element";
import { AgentFace } from "../../src/react";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
});

async function mount(ui: React.ReactNode) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(ui);
    await import("../../src/element");
  });
  return host.querySelector("agent-face")!;
}
const label = (el: AgentFaceElement) => el.shadowRoot!.querySelector("canvas")!.getAttribute("aria-label");

describe("AgentFace for React", () => {
  it("passes its props to the element", async () => {
    const el = await mount(<AgentFace state="thinking" size={26} name="Ada" motion="reduced" announce className="mine" data-x="1" />);
    expect(el.state).toBe("thinking");
    expect(el.getBoundingClientRect().width).toBe(26);
    expect(label(el)).toBe("Ada is thinking");
    expect(el.getAttribute("class")).toBe("mine");
    expect(el.getAttribute("data-x")).toBe("1");
    expect(el.shadowRoot!.querySelector("[role=status]")).not.toBeNull();
  });

  it("gives the element through its ref", async () => {
    const ref = createRef<AgentFaceElement>();
    await mount(<AgentFace ref={ref} />);
    expect(ref.current?.tagName).toBe("AGENT-FACE");
    expect(ref.current?.playGesture("nod")).toBe(true);
  });

  it("follows prop changes, and removed props don't leave junk", async () => {
    const el = await mount(<AgentFace motion="reduced" labels={{ idle: "Prêt" }} amplitude={0.5} />);
    expect(label(el)).toBe("Prêt");
    expect(el.amplitude).toBe(0.5);
    await act(async () => root!.render(<AgentFace motion="reduced" state="error" />));
    expect(el.state).toBe("error");
    expect(el.amplitude).toBeNull();
    expect(el.labels).toEqual({});
  });

  it("renders on a server without a browser element", () => {
    expect(renderToString(<AgentFace state="happy" size={64} />)).toContain('<agent-face state="happy" size="64"');
  });
});
