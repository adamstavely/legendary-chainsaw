import { createComponent } from "@lit/react";
import * as React from "react";
import { TcAtomicDesign } from "../atomic-design";

export type { AtomicDesignLabels, AtomicDesignStage } from "../atomic-design";
export { defaultAtomicDesignLabels } from "../atomic-design";

/** Atomic Design illustration, one stage at a time: overview, atoms, molecule, organism, template or page */
export const AtomicDesign = createComponent({ tagName: "tc-atomic-design", elementClass: TcAtomicDesign, react: React });
export type AtomicDesignProps = React.ComponentProps<typeof AtomicDesign>;
