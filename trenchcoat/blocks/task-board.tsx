"use client";

import {
  TaskBoard as TaskBoardElement,
  type Task,
  type TaskBoardProps as ElementProps,
  type TaskLabel,
  type TaskPerson,
  type TaskStatus,
} from "trenchcoat/react";

/*
 * Task Board – a kanban board for a sprint. Drag cards between columns and reorder them, add cards per column, open a
 * card to change its status, priority, labels and title, search, filter by label and switch to a compact view.
 * Built on the <tc-task-board> element through `trenchcoat/react` (install `trenchcoat` and import its tokens.css):
 * the element holds the layout, styles, drag and drop and keyboard model, so the same board is available to Angular,
 * Vue and plain HTML. It follows the nearest <LookProvider>, or takes a `look` prop.
 *
 * Keyboard: every card opens with Enter or Space; the detail panel changes status (the alternative to dragging),
 * Esc closes it and focus returns to the card. The label menu follows the menu pattern (arrows, Home/End, Esc).
 */

export type { Task, TaskLabel, TaskPerson, TaskStatus };

export type TaskBoardProps = ElementProps & {
  /** The labels a card can carry */
  labels: TaskLabel[];
  /** The people a card can be assigned to */
  people: TaskPerson[];
  /** Breadcrumb above the board */
  path?: string[];
};

export function TaskBoard(props: TaskBoardProps) {
  return <TaskBoardElement {...props} />;
}
