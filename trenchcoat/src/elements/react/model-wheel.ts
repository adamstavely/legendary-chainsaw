import { createComponent } from "@lit/react";
import * as React from "react";
import { TcModelWheel } from "../model-wheel";

export type { WheelModel } from "../model-wheel";
/** The default models (the React module's `defaultModels` – renamed, since the chat composer's wrapper exports that name) */
export { modelWheelDefaults } from "../model-wheel";

/** AI model names on a turning drum; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const ModelWheel = createComponent({ tagName: "tc-model-wheel", elementClass: TcModelWheel, react: React });
export type ModelWheelProps = React.ComponentProps<typeof ModelWheel>;
