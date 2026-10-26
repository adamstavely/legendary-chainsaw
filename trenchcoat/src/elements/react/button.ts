import { createComponent } from "@lit/react";
import * as React from "react";
import { TcButton } from "../button";
import { h } from "./internal";

const RawButton = createComponent({ tagName: "tc-button", elementClass: TcButton, react: React });
type RawButtonProps = React.ComponentProps<typeof RawButton>;
export type ButtonProps = Omit<RawButtonProps, "children" | "label"> & {
  /** The label – a string (or set `label`) */
  children?: React.ReactNode;
  label?: string;
  /** Icon before the label */
  icon?: React.ReactNode;
  /** Icon after the label */
  iconRight?: React.ReactNode;
};
export function Button({ children, label, icon, iconRight, ...props }: ButtonProps) {
  const text = label ?? (typeof children === "string" || typeof children === "number" ? String(children) : undefined);
  return h(
    RawButton,
    { ...props, label: text ?? "" },
    icon != null ? h("span", { slot: "icon", "aria-hidden": "true" }, icon) : null,
    iconRight != null ? h("span", { slot: "icon-right", "aria-hidden": "true" }, iconRight) : null,
  );
}
