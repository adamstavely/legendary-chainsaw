import { createComponent } from "@lit/react";
import * as React from "react";
import { TcSomethingWrong } from "../something-wrong";

/** Something Wrong illustration; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const SomethingWrong = createComponent({ tagName: "tc-something-wrong", elementClass: TcSomethingWrong, react: React });
export type SomethingWrongProps = React.ComponentProps<typeof SomethingWrong>;
