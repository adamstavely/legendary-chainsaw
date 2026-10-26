import { createComponent } from "@lit/react";
import * as React from "react";
import { TcOutreachBranches } from "../outreach-branches";

/** Lines branching out to Gmail, Slack and Notion; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const OutreachBranches = createComponent({ tagName: "tc-outreach-branches", elementClass: TcOutreachBranches, react: React });
export type OutreachBranchesProps = React.ComponentProps<typeof OutreachBranches>;
