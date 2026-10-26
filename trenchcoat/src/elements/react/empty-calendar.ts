import { createComponent } from "@lit/react";
import * as React from "react";
import { TcEmptyCalendar } from "../empty-calendar";

/** Stacked empty calendar cards; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const EmptyCalendar = createComponent({ tagName: "tc-empty-calendar", elementClass: TcEmptyCalendar, react: React });
export type EmptyCalendarProps = React.ComponentProps<typeof EmptyCalendar>;
