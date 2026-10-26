import { createComponent } from "@lit/react";
import * as React from "react";
import {
  TcToaster,
  resetToasts,
  toast as elementToast,
  type ToastId,
  type ToastOptions as ElementToastOptions,
  type ToastText,
} from "../toaster";
import { h } from "./internal";

export type { ToastAction, ToastId, ToastPosition, ToastType } from "../toaster";
export { resetToasts };

export type ToastOptions = Omit<ElementToastOptions, "description" | "icon"> & {
  description?: React.ReactNode;
  /** Replaces the status icon */
  icon?: React.ReactNode;
};
/** A title, or a title with a description */
export type ToastContent = React.ReactNode | { title: React.ReactNode; description?: React.ReactNode };
export type ToastPromiseMessages<T> = {
  loading: ToastContent;
  success: ToastContent | ((value: T) => ToastContent);
  error: ToastContent | ((error: unknown) => ToastContent);
};

/* ---------- React nodes in toasts ----------
 * Text goes to the element as it is. Any other React node is rendered by a mounted <Toaster> into a hidden staging box
 * (the normal React way, as useStaged does for icons) and copied into a placeholder the element shows. */

type Staged = { node: React.ReactNode; el: HTMLElement; filled: boolean };
const staged = new Map<string, Staged>();
const stageListeners = new Set<() => void>();
let stageVersion = 0;
let stageCount = 0;
const subscribeStage = (l: () => void) => {
  stageListeners.add(l);
  return () => void stageListeners.delete(l);
};
const stageSnapshot = () => stageVersion;

function stage(node: React.ReactNode): HTMLElement {
  const el = document.createElement("span");
  el.style.display = "contents";
  staged.set(`s${++stageCount}`, { node, el, filled: false });
  stageVersion++;
  stageListeners.forEach((l) => l());
  return el;
}
const toText = (n: React.ReactNode): ToastText | undefined => {
  if (n == null || typeof n === "boolean") return undefined;
  if (typeof n === "string" || typeof n === "number" || typeof n === "bigint") return String(n);
  return stage(n);
};
const isContentObject = (c: unknown): c is { title: React.ReactNode; description?: React.ReactNode } =>
  typeof c === "object" && c !== null && !React.isValidElement(c) && !Array.isArray(c) && "title" in c;
const toContent = (c: ToastContent) => (isContentObject(c) ? { title: toText(c.title) ?? "", description: toText(c.description) } : toText(c) ?? "");
const toOptions = (o: ToastOptions | undefined): ElementToastOptions | undefined => {
  if (!o) return o;
  const { description, icon, ...rest } = o;
  const out: ElementToastOptions = { ...rest };
  if ("description" in o) out.description = toText(description);
  if (icon != null && typeof icon !== "boolean") out.icon = stage(icon);
  return out;
};

/** toast("Saved"), toast.success(…), toast.error(…), toast.info(…), toast.loading(…), toast.promise(…), toast.dismiss(id?) */
export const toast = Object.assign((title: React.ReactNode, options?: ToastOptions) => elementToast(toText(title) ?? "", toOptions(options)), {
  success: (title: React.ReactNode, options?: ToastOptions) => elementToast.success(toText(title) ?? "", toOptions(options)),
  error: (title: React.ReactNode, options?: ToastOptions) => elementToast.error(toText(title) ?? "", toOptions(options)),
  info: (title: React.ReactNode, options?: ToastOptions) => elementToast.info(toText(title) ?? "", toOptions(options)),
  /** Stays until you update it (same id) or dismiss it */
  loading: (title: React.ReactNode, options?: ToastOptions) => elementToast.loading(toText(title) ?? "", toOptions(options)),
  promise: <T>(input: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, options: Omit<ToastOptions, "id"> & { id?: ToastId } = {}) => {
    const { success, error } = messages;
    return elementToast.promise(
      input,
      {
        loading: toContent(messages.loading),
        success: typeof success === "function" ? (v: T) => toContent(success(v)) : toContent(success),
        error: typeof error === "function" ? (e: unknown) => toContent(error(e)) : toContent(error),
      },
      toOptions(options),
    );
  },
  dismiss: (id?: ToastId) => elementToast.dismiss(id),
});

const RawToaster = createComponent({ tagName: "tc-toaster", elementClass: TcToaster, react: React });
type RawToasterProps = React.ComponentProps<typeof RawToaster>;
export type ToasterProps = Omit<RawToasterProps, "stack" | "id"> & {
  /** Only shows toasts sent with { toaster: id } – for a second, separate stack. Not the element's DOM id */
  id?: string;
};

export function Toaster({ id, ...props }: ToasterProps) {
  const version = React.useSyncExternalStore(subscribeStage, stageSnapshot, stageSnapshot);
  const box = React.useRef<HTMLDivElement>(null);
  // Copy what React rendered into the placeholders the element shows; drop entries whose toast is gone
  React.useLayoutEffect(() => {
    box.current?.querySelectorAll<HTMLElement>(":scope > [data-k]").forEach((s) => {
      const entry = staged.get(s.dataset.k!);
      if (!entry) return;
      if (!entry.filled) {
        entry.el.replaceChildren(...[...s.childNodes].map((n) => n.cloneNode(true)));
        entry.filled = true;
      } else if (!entry.el.isConnected) staged.delete(s.dataset.k!);
    });
  });
  const entries = [...staged.entries()];
  return h(
    React.Fragment,
    null,
    entries.length ? h("div", { ref: box, hidden: true, "aria-hidden": "true", "data-stage": version }, entries.map(([k, s]) => h("span", { key: k, "data-k": k }, s.node))) : null,
    h(RawToaster, { ...props, stack: id }),
  );
}
