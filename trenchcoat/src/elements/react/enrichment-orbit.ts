import { createComponent } from "@lit/react";
import * as React from "react";
import { TcEnrichmentOrbit } from "../enrichment-orbit";

/** A tile in two rings with comets and orbiting nodes; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const EnrichmentOrbit = createComponent({ tagName: "tc-enrichment-orbit", elementClass: TcEnrichmentOrbit, react: React });
export type EnrichmentOrbitProps = React.ComponentProps<typeof EnrichmentOrbit>;
