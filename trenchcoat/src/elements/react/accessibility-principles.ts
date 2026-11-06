import { createComponent } from "@lit/react";
import * as React from "react";
import { TcAccessibilityPrinciples } from "../accessibility-principles";

export type { AccessibilityPrinciplesLabels } from "../accessibility-principles";
export { defaultAccessibilityPrinciplesLabels } from "../accessibility-principles";

/** Accessibility Principles illustration: four needs, the four principles that serve them, and the connectors between */
export const AccessibilityPrinciples = createComponent({ tagName: "tc-accessibility-principles", elementClass: TcAccessibilityPrinciples, react: React });
export type AccessibilityPrinciplesProps = React.ComponentProps<typeof AccessibilityPrinciples>;
