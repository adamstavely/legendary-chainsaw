import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import type { ChangeAction, ChangeOpen } from "../change-list";
import type { EnvironmentAction, EnvironmentTogglesChange } from "../environment-list";
import type { IconRailAction, IconRailSelectedChange } from "../icon-rail";
import { TcSessionPanel, type SessionPanelSection, type SessionPanelSectionOpen, type SessionPanelSectionsChange, type SessionPanelSubagentChange } from "../session-panel";
import type { Subagent } from "../subagent-list";
import { h, useControlled } from "./internal";

export type { SessionPanelLabels, SessionPanelSection, SessionPanelSectionOpen, SessionPanelSectionsChange, SessionPanelSubagentChange } from "../session-panel";

const RawSessionPanel = createComponent({
  tagName: "tc-session-panel",
  elementClass: TcSessionPanel,
  react: React,
  events: {
    onTcSectionsChange: "tc-sections-change" as EventName<CustomEvent<SessionPanelSectionsChange>>,
    onTcSectionOpen: "tc-section-open" as EventName<CustomEvent<SessionPanelSectionOpen>>,
    onTcSubagentChange: "tc-subagent-change" as EventName<CustomEvent<SessionPanelSubagentChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<IconRailSelectedChange>>,
    onTcTogglesChange: "tc-toggles-change" as EventName<CustomEvent<EnvironmentTogglesChange>>,
    onTcAction: "tc-action" as EventName<CustomEvent<IconRailAction | ChangeAction | EnvironmentAction>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<ChangeOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSessionPanel>;
type Owned = "tool" | "toggles" | "sections" | "subagent" | "onTcSelectedChange" | "onTcTogglesChange" | "onTcSectionsChange" | "onTcSubagentChange" | "children";
export type SessionPanelProps = Omit<RawProps, Owned> & {
  /** The id of the chosen tool – controlled when given */
  tool?: string | null;
  /** The tool on mount when `tool` isn't controlled */
  defaultTool?: string | null;
  /** A tool was chosen or cleared */
  onToolChange?: (tool: string | null) => void;
  /** The environment rows' switches – controlled when given */
  toggles?: Record<string, boolean>;
  /** The switches on mount when `toggles` isn't controlled */
  defaultToggles?: Record<string, boolean>;
  /** A switch changed */
  onTogglesChange?: (toggles: Record<string, boolean>) => void;
  /** The sections folded open – controlled when given */
  sections?: SessionPanelSection[];
  /** The open sections on mount when `sections` isn't controlled */
  defaultSections?: SessionPanelSection[];
  /** A section folded open or shut */
  onSectionsChange?: (sections: SessionPanelSection[]) => void;
  /** The chosen subagent's id – controlled when given */
  subagent?: string | null;
  /** The chosen subagent on mount when `subagent` isn't controlled */
  defaultSubagent?: string | null;
  /** A subagent was chosen */
  onSubagentChange?: (subagent: string | null, agent: Subagent | null) => void;
};

export function SessionPanel({
  tool,
  defaultTool = null,
  onToolChange,
  toggles,
  defaultToggles = {},
  onTogglesChange,
  sections,
  defaultSections = ["environment", "subagents", "changes"],
  onSectionsChange,
  subagent,
  defaultSubagent = null,
  onSubagentChange,
  ...props
}: SessionPanelProps) {
  const agent = React.useRef<Subagent | null>(null);
  const t = useControlled<string | null>(tool, defaultTool, onToolChange);
  const a = useControlled<string | null>(subagent, defaultSubagent, onSubagentChange ? (next) => onSubagentChange(next, agent.current) : undefined);
  const g = useControlled<Record<string, boolean>>(toggles, defaultToggles, onTogglesChange);
  const s = useControlled<SessionPanelSection[]>(sections, defaultSections, onSectionsChange);
  return h(RawSessionPanel, {
    ...props,
    tool: t.value,
    toggles: g.value,
    sections: s.value,
    subagent: a.value,
    onTcSelectedChange: (e: CustomEvent<IconRailSelectedChange>) => t.handler(e.detail.selected, e),
    onTcTogglesChange: (e: CustomEvent<EnvironmentTogglesChange>) => g.handler(e.detail.toggles, e),
    onTcSectionsChange: (e: CustomEvent<SessionPanelSectionsChange>) => s.handler(e.detail.sections, e),
    onTcSubagentChange: (e: CustomEvent<SessionPanelSubagentChange>) => {
      agent.current = e.detail.agent;
      a.handler(e.detail.subagent, e);
    },
  });
}
