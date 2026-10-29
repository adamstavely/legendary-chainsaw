import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTodoList, type TodoFilter, type TodoFilterChange, type TodoItem, type TodoItemsChange } from "../todo-list";
import { h, useControlled } from "./internal";

export type { TodoChange, TodoFilter, TodoItem, TodoLabels } from "../todo-list";

const RawTodoList = createComponent({
  tagName: "tc-todo-list",
  elementClass: TcTodoList,
  react: React,
  events: {
    onTcItemsChange: "tc-items-change" as EventName<CustomEvent<TodoItemsChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<TodoFilterChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTodoList>;
type Owned = "heading" | "items" | "filter" | "onTcItemsChange" | "onTcFilterChange" | "children";
export type TodoListProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The to-dos – controlled when given: every change reports the next list through onItemsChange */
  items?: TodoItem[];
  /** The to-dos on mount when `items` isn't controlled */
  defaultItems?: TodoItem[];
  /** The list changed; `next` is the list as it will be, `change` what happened */
  onItemsChange?: (next: TodoItem[], change: TodoItemsChange["change"]) => void;
  /** The tab shown – controlled when given */
  filter?: TodoFilter;
  /** The tab on mount when `filter` isn't controlled */
  defaultFilter?: TodoFilter;
  /** The tab changed */
  onFilterChange?: (filter: TodoFilter) => void;
};

const NONE: TodoItem[] = [];

export function TodoList({ title, items, defaultItems = NONE, onItemsChange, filter, defaultFilter = "all", onFilterChange, ...props }: TodoListProps) {
  const list = useControlled<TodoItem[]>(items, defaultItems, undefined);
  const f = useControlled<TodoFilter>(filter, defaultFilter, onFilterChange);
  return h(RawTodoList, {
    ...props,
    heading: title ?? "To-do",
    items: list.value,
    filter: f.value,
    onTcItemsChange: (e: CustomEvent<TodoItemsChange>) => {
      onItemsChange?.(e.detail.items, e.detail.change);
      list.handler(e.detail.items, e);
    },
    onTcFilterChange: (e: CustomEvent<TodoFilterChange>) => f.handler(e.detail.filter, e),
  });
}
