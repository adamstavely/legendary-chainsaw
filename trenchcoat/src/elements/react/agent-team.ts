import { createComponent } from "@lit/react";
import * as React from "react";
import { TcAgentTeam, type AgentTeamMember } from "../agent-team";

export type { AgentTeamMember, AgentTeamTool as AgentTool } from "../agent-team";

const RawAgentTeam = createComponent({ tagName: "tc-agent-team", elementClass: TcAgentTeam, react: React });
export type AgentTeamProps = Omit<React.ComponentProps<typeof RawAgentTeam>, "children" | "look" | "members"> & {
  /** Exactly three agents, left to right */
  members: [AgentTeamMember, AgentTeamMember, AgentTeamMember];
};
/** A prompt builds a team of three agents, who pop in with their roles and tools */
export function AgentTeam(props: AgentTeamProps) {
  return React.createElement(RawAgentTeam, props);
}
