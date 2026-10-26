import { createComponent } from "@lit/react";
import * as React from "react";
import { TcTeamInvite, type TeamInviteAvatar } from "../team-invite";

export type { TeamInviteAvatar } from "../team-invite";

const RawTeamInvite = createComponent({ tagName: "tc-team-invite", elementClass: TcTeamInvite, react: React });
export type TeamInviteProps = Omit<React.ComponentProps<typeof RawTeamInvite>, "children" | "look" | "avatars"> & {
  /** The two teammates that are already connected, then the one being invited */
  avatars: [TeamInviteAvatar, TeamInviteAvatar, TeamInviteAvatar];
};
/** A third teammate is dragged into the empty slot and joins the team */
export function TeamInvite(props: TeamInviteProps) {
  return React.createElement(RawTeamInvite, props);
}
