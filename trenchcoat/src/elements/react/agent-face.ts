import { createComponent } from "@lit/react";
import * as React from "react";
import { TcAgentFace } from "../agent-face";
import { h } from "./internal";

export type { AgentFaceGesture, AgentFaceMotion, AgentFaceState } from "../agent-face";

const RawAgentFace = createComponent({ tagName: "tc-agent-face", elementClass: TcAgentFace, react: React });
export type AgentFaceProps = React.ComponentProps<typeof RawAgentFace>;

/** Agent Face – Donovan's animated face, which shows what the agent is doing. Its ref has `playGesture` */
export function AgentFace(props: AgentFaceProps) {
  return h(RawAgentFace, props);
}
