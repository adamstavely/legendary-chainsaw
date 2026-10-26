import { createComponent } from "@lit/react";
import * as React from "react";
import { TcLeadSourcing } from "../lead-sourcing";

/** Lead Sourcing – decorative unless `label` describes it as an image */
export const LeadSourcing = createComponent({ tagName: "tc-lead-sourcing", elementClass: TcLeadSourcing, react: React });
export type LeadSourcingProps = React.ComponentProps<typeof LeadSourcing>;
