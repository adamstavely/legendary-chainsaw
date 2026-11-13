import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcSkillLibrary,
  type LibrarySkill,
  type SkillEnabledChange,
  type SkillLibraryAdd,
  type SkillLibraryAddSource,
  type SkillLibraryGroupChange,
  type SkillLibraryOpen,
  type SkillLibraryQueryChange,
  type SkillLibraryShow,
  type SkillLibraryShowChange,
  type SkillLibrarySkillsChange,
  type SkillLibraryUpdate,
} from "../skill-library";
import { h, useControlled } from "./internal";

export type {
  LibrarySkill,
  SkillEnabledChange,
  SkillLibraryAdd,
  SkillLibraryAddSource,
  SkillLibraryGroupChange,
  SkillLibraryLabels,
  SkillLibraryOpen,
  SkillLibraryQueryChange,
  SkillLibraryShow,
  SkillLibraryShowChange,
  SkillLibrarySkillsChange,
  SkillLibraryUpdate,
} from "../skill-library";
export { defaultSkillLibraryLabels, skillGroups } from "../skill-library";

const RawSkillLibrary = createComponent({
  tagName: "tc-skill-library",
  elementClass: TcSkillLibrary,
  react: React,
  events: {
    onTcEnabledChange: "tc-enabled-change" as EventName<CustomEvent<SkillEnabledChange>>,
    onTcSkillsChange: "tc-skills-change" as EventName<CustomEvent<SkillLibrarySkillsChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<SkillLibraryQueryChange>>,
    onTcGroupChange: "tc-group-change" as EventName<CustomEvent<SkillLibraryGroupChange>>,
    onTcShowChange: "tc-show-change" as EventName<CustomEvent<SkillLibraryShowChange>>,
    onTcUpdate: "tc-update" as EventName<CustomEvent<SkillLibraryUpdate>>,
    onTcAdd: "tc-add" as EventName<CustomEvent<SkillLibraryAdd>>,
    onTcSkillOpen: "tc-skill-open" as EventName<CustomEvent<SkillLibraryOpen>>,
  },
});

type Owned =
  | "heading"
  | "skills"
  | "query"
  | "group"
  | "show"
  | "onTcEnabledChange"
  | "onTcSkillsChange"
  | "onTcQueryChange"
  | "onTcGroupChange"
  | "onTcShowChange"
  | "onTcUpdate"
  | "onTcAdd"
  | "onTcSkillOpen"
  | "children";
export type SkillLibraryProps = Omit<React.ComponentProps<typeof RawSkillLibrary>, Owned> & {
  /** The heading; "Skills" by default */
  title?: string;
  /** The skills – controlled when given */
  skills?: LibrarySkill[];
  /** The skills on mount, when `skills` isn't controlled */
  defaultSkills?: LibrarySkill[];
  /** Called with the whole list after a switch is flipped, and the skill that changed */
  onSkillsChange?: (skills: LibrarySkill[], id: string) => void;
  /** A switch was flipped; return false to keep it as it was */
  onEnabledChange?: (id: string, enabled: boolean, skill: LibrarySkill) => boolean | void;
  /** The search text – controlled when given */
  query?: string;
  /** The search text on mount, when `query` isn't controlled */
  defaultQuery?: string;
  /** Called with the search text as it's typed */
  onQueryChange?: (query: string) => void;
  /** The source shown, or null for all – controlled when given */
  group?: string | null;
  /** The source on mount, when `group` isn't controlled */
  defaultGroup?: string | null;
  /** Called with the source picked */
  onGroupChange?: (group: string | null) => void;
  /** "all", "on" or "off" – controlled when given */
  show?: SkillLibraryShow;
  /** Which skills show on mount, when `show` isn't controlled */
  defaultShow?: SkillLibraryShow;
  /** Called with All, On or Off as it's picked */
  onShowChange?: (show: SkillLibraryShow) => void;
  /** Update was pressed on a skill: install `version` */
  onUpdate?: (id: string, version: string, skill: LibrarySkill) => void;
  /** Upload, From a URL or Create was picked in Add skill */
  onAdd?: (source: SkillLibraryAddSource) => void;
  /** A skill's name was pressed: open its detail */
  onSkillOpen?: (id: string, skill: LibrarySkill) => void;
};
const NONE: LibrarySkill[] = [];

export function SkillLibrary({
  title,
  skills,
  defaultSkills = NONE,
  onSkillsChange,
  onEnabledChange,
  query,
  defaultQuery = "",
  onQueryChange,
  group,
  defaultGroup = null,
  onGroupChange,
  show,
  defaultShow = "all",
  onShowChange,
  onUpdate,
  onAdd,
  onSkillOpen,
  ...props
}: SkillLibraryProps) {
  const last = React.useRef("");
  const s = useControlled(skills, defaultSkills, onSkillsChange ? (next: LibrarySkill[]) => onSkillsChange(next, last.current) : undefined);
  const q = useControlled(query, defaultQuery, onQueryChange);
  const g = useControlled<string | null>(group, defaultGroup, onGroupChange);
  const v = useControlled(show, defaultShow, onShowChange);
  return h(RawSkillLibrary, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    skills: s.value,
    query: q.value,
    group: g.value,
    show: v.value,
    onTcEnabledChange: (e: CustomEvent<SkillEnabledChange>) => {
      if (onEnabledChange?.(e.detail.id, e.detail.enabled, e.detail.skill) === false) e.preventDefault();
    },
    onTcSkillsChange: (e: CustomEvent<SkillLibrarySkillsChange>) => {
      last.current = e.detail.id;
      s.handler(e.detail.skills, e);
    },
    onTcQueryChange: (e: CustomEvent<SkillLibraryQueryChange>) => q.handler(e.detail.query, e),
    onTcGroupChange: (e: CustomEvent<SkillLibraryGroupChange>) => g.handler(e.detail.group, e),
    onTcShowChange: (e: CustomEvent<SkillLibraryShowChange>) => v.handler(e.detail.show, e),
    onTcUpdate: (e: CustomEvent<SkillLibraryUpdate>) => onUpdate?.(e.detail.id, e.detail.version, e.detail.skill),
    onTcAdd: (e: CustomEvent<SkillLibraryAdd>) => onAdd?.(e.detail.source),
    onTcSkillOpen: (e: CustomEvent<SkillLibraryOpen>) => onSkillOpen?.(e.detail.id, e.detail.skill),
  });
}
