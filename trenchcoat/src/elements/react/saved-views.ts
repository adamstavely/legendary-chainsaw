import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSavedViews, type SavedViewCreate, type SavedViewId, type SavedViewRename, type SavedViewShare, type SavedViewsActiveChange } from "../saved-views";
import { h, useControlled } from "./internal";

export type { SavedView, SavedViewCreate, SavedViewId, SavedViewRename, SavedViewShare, SavedViewsActiveChange, SavedViewsLabels } from "../saved-views";
export { defaultSavedViewsLabels } from "../saved-views";

const RawSavedViews = createComponent({
  tagName: "tc-saved-views",
  elementClass: TcSavedViews,
  react: React,
  events: {
    onTcActiveChange: "tc-active-change" as EventName<CustomEvent<SavedViewsActiveChange>>,
    onTcViewSave: "tc-view-save" as EventName<CustomEvent<SavedViewId>>,
    onTcViewCreate: "tc-view-create" as EventName<CustomEvent<SavedViewCreate>>,
    onTcViewReset: "tc-view-reset" as EventName<CustomEvent<SavedViewId>>,
    onTcViewRename: "tc-view-rename" as EventName<CustomEvent<SavedViewRename>>,
    onTcViewDuplicate: "tc-view-duplicate" as EventName<CustomEvent<SavedViewId>>,
    onTcViewShare: "tc-view-share" as EventName<CustomEvent<SavedViewShare>>,
    onTcViewDefault: "tc-view-default" as EventName<CustomEvent<SavedViewId>>,
    onTcViewDelete: "tc-view-delete" as EventName<CustomEvent<SavedViewId>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSavedViews>;
type Owned =
  | "active"
  | "onTcActiveChange"
  | "onTcViewSave"
  | "onTcViewCreate"
  | "onTcViewReset"
  | "onTcViewRename"
  | "onTcViewDuplicate"
  | "onTcViewShare"
  | "onTcViewDefault"
  | "onTcViewDelete"
  | "children";
export type SavedViewsProps = Omit<RawProps, Owned> & {
  /** The open view's id – controlled when given */
  active?: string | null;
  /** The view open on mount when `active` isn't controlled */
  defaultActive?: string | null;
  /** A view was opened */
  onActiveChange?: (active: string | null) => void;
  /** Save changes – save the filters on screen into this view */
  onViewSave?: (id: string) => void;
  /** A new view was named, from the filters on screen ("current") or blank */
  onViewCreate?: (detail: SavedViewCreate) => void;
  /** Reset – go back to the open view as saved */
  onViewReset?: (id: string) => void;
  /** A view was renamed */
  onViewRename?: (detail: SavedViewRename) => void;
  /** Duplicate was picked */
  onViewDuplicate?: (id: string) => void;
  /** Share with team or Stop sharing was picked */
  onViewShare?: (detail: SavedViewShare) => void;
  /** Set as default was picked */
  onViewDefault?: (id: string) => void;
  /** Delete was confirmed */
  onViewDelete?: (id: string) => void;
};

export function SavedViews({ active, defaultActive = null, onActiveChange, onViewSave, onViewCreate, onViewReset, onViewRename, onViewDuplicate, onViewShare, onViewDefault, onViewDelete, ...props }: SavedViewsProps) {
  const a = useControlled<string | null>(active, defaultActive, onActiveChange);
  return h(RawSavedViews, {
    ...props,
    active: a.value,
    onTcActiveChange: (e: CustomEvent<SavedViewsActiveChange>) => a.handler(e.detail.active, e),
    onTcViewSave: (e: CustomEvent<SavedViewId>) => onViewSave?.(e.detail.id),
    onTcViewCreate: (e: CustomEvent<SavedViewCreate>) => onViewCreate?.(e.detail),
    onTcViewReset: (e: CustomEvent<SavedViewId>) => onViewReset?.(e.detail.id),
    onTcViewRename: (e: CustomEvent<SavedViewRename>) => onViewRename?.(e.detail),
    onTcViewDuplicate: (e: CustomEvent<SavedViewId>) => onViewDuplicate?.(e.detail.id),
    onTcViewShare: (e: CustomEvent<SavedViewShare>) => onViewShare?.(e.detail),
    onTcViewDefault: (e: CustomEvent<SavedViewId>) => onViewDefault?.(e.detail.id),
    onTcViewDelete: (e: CustomEvent<SavedViewId>) => onViewDelete?.(e.detail.id),
  });
}
