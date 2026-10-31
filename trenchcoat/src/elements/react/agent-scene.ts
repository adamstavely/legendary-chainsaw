import { createComponent } from "@lit/react";
import * as React from "react";
import { TcAgentScene } from "../agent-scene";

export type { AgentScene as AgentSceneName } from "../agent-scene";

/** The assistant in a small scene; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const AgentScene = createComponent({ tagName: "tc-agent-scene", elementClass: TcAgentScene, react: React });
export type AgentSceneProps = React.ComponentProps<typeof AgentScene>;
