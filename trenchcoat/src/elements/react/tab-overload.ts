import { createComponent } from "@lit/react";
import * as React from "react";
import { TcTabOverload } from "../tab-overload";

const RawTabOverload = createComponent({ tagName: "tc-tab-overload", elementClass: TcTabOverload, react: React });
export type TabOverloadProps = Omit<React.ComponentProps<typeof RawTabOverload>, "children" | "look">;
/** Three overlapping browser windows; `label` describes the scene, without it it's decorative */
export function TabOverload(props: TabOverloadProps) {
  return React.createElement(RawTabOverload, props);
}
