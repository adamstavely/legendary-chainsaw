<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Overview](../README.md)

# Screens

**Complete app pages inside an app shell**

Full screens – analytics, CRM, files, onboarding, settings – plus the App Shell frames (sidebar, workspace panel) they sit in. Use them as starting points for an entire page.

22 items · 22 files

- [Agent Chat](agent-chat.md) – Chat with an orchestrating agent, the agents at work, and a brief to fill in beside it
- [Agent Run](agent-run.md) – One autonomous agent run: the plan ticking through its steps, the tool calls, an approval it waits on and the draft it wrote; `onApprove` may return a promise
- [Analytics](analytics.md) – Revenue dashboard: key figures, revenue by channel, breakdown, top products and weekly trends; `period`/`defaultPeriod`/`onPeriodChange`
- [App Shell Flat](app-shell-flat.md) – The App Shell laid flat – gray sidebar and an edge-to-edge page, split by a single hairline
- [App Shell Inset](app-shell.md) – Collapsible sidebar with workspace, menu, projects and account – the frame every screen sits in. Its parts – Tabs (a tablist with arrow keys; optional `label`), ViewToggle (the library Segmented Control), SearchField, the toolbar tools, Dropdown / MenuButton menus (focus moves in, arrow keys, Escape and picks return focus to the trigger) and Popover (a named dialog, or `role="none"` around a menu) – use the pattern tokens; focus follows the sidebar and work area when they fold away; `collapsed`/`defaultCollapsed`/`onCollapsedChange` and `panelOpen`/`defaultPanelOpen`/`onPanelOpenChange`
- [App Shell Workspace Flat](app-shell-workspace-flat.md) – The flat App Shell with a resizable work area on the right – sidebar, page and tools, each split by a hairline
- [App Shell Workspace Inset](app-shell-workspace.md) – App Shell Inset with a resizable work area on the right – tools, browser and suggested sources next to the page, like Claude or Codex
- [Assistant Home](assistant-home.md) – AI assistant start page: greeting, prompt box with tools, connected apps and suggestions; the exported Composer's `onSend` may return a promise
- [Case File](case-file.md) – One case as a full page: Case Review with Donovan's read beside the evidence, and the case's file with its flag and entitlement-checked sharing
- [CRM](crm.md) – Company list with pipelines, open views as tabs and the library Data Table (used as is, no restyling); the open view is controllable via `tab`/`defaultTab`/`onTabChange`
- [Design System Component](ds-component.md) – One component's page in a design system's site, for Meridian's Button: name, purpose, status and links, then Overview (where it sits in atomic design, and a live preview in a frame you can resize with the Breakpoint Overlay beside it), Usage (variants, do's and don'ts), Accessibility (the principles and a checklist) and Code (an example and the properties table); `tab`/`defaultTab`/`onTabChange`
- [Design System Home](ds-home.md) – A design system's landing page: a hero with its name, purpose, a search and the compass rose; Foundations, Components, Patterns and Illustrations as Collection Cards with spot illustrations; what's new; and quick links as Preview Cards; `onSearch` gets the query, and the cards and links call `onNavigate`
- [Design System Illustrations](ds-illustrations.md) – An illustration library: folder tabs, a search and a grid/list toggle over Preview Cards of spot illustrations; opening one copies its import, or calls `onOpen`; the Untagged tab shows Soup Cans and an empty search Nothing Found; `tab`/`defaultTab`/`onTabChange` and `view`/`defaultView`/`onViewChange`
- [Design System Releases](ds-releases.md) – Where a design system's components, docs and assets stand on their way out: six stages from Awaiting review to Released with their counts, and for the chosen one its illustration, what the stage means and its items in the library Data Table – an empty stage shows its illustration as the empty state; `stage`/`defaultStage`/`onStageChange`
- [Evals](evals.md) – Prompt evaluation dashboard: pass rate by version, reviewable prompt changes – KPI Chart (`fill`) and Inline Diff (`fill`); test cases with a keyboard-selectable row, which you can re-run; `version`/`defaultVersion`/`onVersionChange`
- [Folder](folder.md) – Inside one folder: breadcrumbs, file cards with previews, and an empty state
- [Folders](files.md) – Folder overview with tabs, search, sort, grid/list toggle and file templates; `view`/`defaultView`/`onViewChange`
- [Integrations](integrations.md) – App directory with a sticky header, categories, search and connect states; focus stays on the list when rows leave a tab; `connected`/`defaultConnected`/`onConnectedChange`
- [Onboarding](onboarding.md) – First-run flow of an AI workspace: workspace setup, tool connections, team invites and a first agent (template radio group with arrow keys), with a getting-started checklist; `step`/`defaultStep`/`onStepChange`, and `onComplete` may return a promise
- [Search Results](search-results.md) – A full search page: the search box, filters down the side, results grouped by kind, and Nothing Found when nothing matches
- [Settings & Billing](settings-billing.md) – Settings page with tabs: workspace, members, API keys and billing with plan, the library Usage Meter (`layout="wide"`), payment method, plan comparison and invoices; `tab`/`defaultTab`/`onTabChange`
- [Sharing & Access](sharing-access.md) – An admin page for what a team shares and who can reach it: team flags, access reviews and the audit trail, under three tabs
