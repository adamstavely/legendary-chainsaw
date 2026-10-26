import { createComponent } from "@lit/react";
import * as React from "react";
import { TcNumberTicker } from "../number-ticker";
import { h } from "./internal";

const RawNumberTicker = createComponent({ tagName: "tc-number-ticker", elementClass: TcNumberTicker, react: React });
type RawNumberTickerProps = React.ComponentProps<typeof RawNumberTicker>;

export type NumberTickerOwnProps = {
  /** The number to show */
  value: number;
  /** Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" } */
  format?: Intl.NumberFormatOptions;
  /** Locale for formatting, e.g. "en-US" – defaults to the browser's */
  locale?: string;
  /** Length of a roll in ms */
  duration?: number;
  /** Wait before the first count-in, in ms */
  delay?: number;
  /** Class names for the root element */
  className?: string;
  /** The root element */
  ref?: React.Ref<TcNumberTicker>;
};
/** Other DOM props go to the root */
export type NumberTickerProps = Omit<RawNumberTickerProps, keyof NumberTickerOwnProps> & NumberTickerOwnProps;

export function NumberTicker(props: NumberTickerProps) {
  return h(RawNumberTicker, props as RawNumberTickerProps);
}
