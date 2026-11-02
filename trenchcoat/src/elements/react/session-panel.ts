import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import type { ChangeAction, ChangeOpen } from "../change-list";
import type { EnvironmentAction, EnvironmentTogglesChange } from "../environment-list";
import type { IconRailAction, IconRailSelectedChange } from "../icon-rail";
import { TcSessionPanel, type SessionPanelSection, type SessionPanelSectionOpen, type SessionPanelSectionsChange } from "../session-panel";
import { h, useControlled } from "./internal";

export type { SessionPanelLabels, SessionPanelSection, SessionPanelSectionOpen, SessionPanelSectionsChange } from "../session-panel";

const RawSessionPanel = createComponent({
  tagName: "tc-session-panel",
  elementClass: TcSessionPanel,
  react: React,
  events: {
    onTcSectionsChange: "tc-sections-change" as EventName<CustomEvent<SessionPanelSectionsChange>>,
    onTcSectionOpen: "tc-section-open" as EventName<CustomEvent<SessionPanelSectionOpen>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<IconRailSelectedChange>>,
    onTcTogglesChange: "tc-toggles-change" as EventName<CustomEvent<EnvironmentTogglesChange>>,
    onTcAction: "tc-action" as EventName<CustomEvent<IconRailAction | ChangeAction | EnvironmentAction>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<ChangeOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSessionPanel>;
type Owned = "tool" | "toggles" | "sections" | "onTcSelectedChange" | "onTcTogglesChange" | "onTcSectionsChange" | "children";
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
};

export function SessionPanel({ tool, defaultTool = null, onToolChange, toggles, defaultToggles = {}, onTogglesChange, sections, defaultSections = ["environment", "changes"], onSectionsChange, ...props }: SessionPanelProps) {
  const t = useControlled<string | null>(tool, defaultTool, onToolChange);
  const g = useControlled<Record<string, boolean>>(toggles, defaultToggles, onTogglesChange);
  const s = useControlled<SessionPanelSection[]>(sections, defaultSections, onSectionsChange);
  return h(RawSessionPanel, {
    ...props,
    tool: t.value,
    toggles: g.value,
    sections: s.value,
    onTcSelectedChange: (e: CustomEvent<IconRailSelectedChange>) => t.handler(e.detail.selected, e),
    onTcTogglesChange: (e: CustomEvent<EnvironmentTogglesChange>) => g.handler(e.detail.toggles, e),
    onTcSectionsChange: (e: CustomEvent<SessionPanelSectionsChange>) => s.handler(e.detail.sections, e),
  });
}
