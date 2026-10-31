# Trenchcoat – screens

Every file is a single, self-contained React component; its only dependencies are React and lucide-react (1.55.0) for
the icons. Copy a file into your project, e.g. `components/ui/`, and import it from there.
Screens import other Trenchcoat files from `@/components/ui/<name>` – the App Shell and the components each one lists
in its header – so copy those alongside.
On every screen, `className`, other DOM props and `ref` go to the App Shell's root.
Screens use the components' scale: the App Shell's parts (tabs, tools, search, menus, toast) are built from the
pattern tokens (control, field, menu, segmented, pill, card), and library components inside a screen are used as is –
no restyling of their classes and no `zoom`.

- **Agent Chat** (`agent-chat.tsx`) – Chat with an orchestrating agent, the agents at work, and a brief to fill in beside it
- **Agent Run** (`agent-run.tsx`) – One autonomous agent run: the plan ticking through its steps, the tool calls, an approval it waits on and the draft it wrote; `onApprove` may return a promise
- **Analytics** (`analytics.tsx`) – Revenue dashboard: key figures, revenue by channel, breakdown, top products and weekly trends; `period`/`defaultPeriod`/`onPeriodChange`
- **App Shell Inset** (`app-shell.tsx`) – Collapsible sidebar with workspace, menu, projects and account – the frame every screen sits in. Its parts – Tabs (a tablist with arrow keys; optional `label`), ViewToggle (the library Segmented Control), SearchField, the toolbar tools, Dropdown / MenuButton menus (focus moves in, arrow keys, Escape and picks return focus to the trigger) and Popover (a named dialog, or `role="none"` around a menu) – use the pattern tokens; focus follows the sidebar and work area when they fold away; `collapsed`/`defaultCollapsed`/`onCollapsedChange` and `panelOpen`/`defaultPanelOpen`/`onPanelOpenChange`
- **App Shell Flat** (`app-shell-flat.tsx`) – The App Shell laid flat – gray sidebar and an edge-to-edge page, split by a single hairline
- **App Shell Workspace Inset** (`app-shell-workspace.tsx`) – App Shell Inset with a resizable work area on the right – tools, browser and suggested sources next to the page, like Claude or Codex
- **App Shell Workspace Flat** (`app-shell-workspace-flat.tsx`) – The flat App Shell with a resizable work area on the right – sidebar, page and tools, each split by a hairline
- **Assistant Home** (`assistant-home.tsx`) – AI assistant start page: greeting, prompt box with tools, connected apps and suggestions; the exported Composer's `onSend` may return a promise
- **Case File** (`case-file.tsx`) – One case as a full page: Case Review with Donovan's read beside the evidence, and the case's file with its flag and entitlement-checked sharing
- **CRM** (`crm.tsx`) – Company list with pipelines, open views as tabs and the library Data Table (used as is, no restyling); the open view is controllable via `tab`/`defaultTab`/`onTabChange`
- **Evals** (`evals.tsx`) – Prompt evaluation dashboard: pass rate by version, reviewable prompt changes – KPI Chart (`fill`) and Inline Diff (`fill`); test cases with a keyboard-selectable row, which you can re-run; `version`/`defaultVersion`/`onVersionChange`
- **Folders** (`files.tsx`) – Folder overview with tabs, search, sort, grid/list toggle and file templates; `view`/`defaultView`/`onViewChange`
- **Folder** (`folder.tsx`) – Inside one folder: breadcrumbs, file cards with previews, and an empty state
- **Integrations** (`integrations.tsx`) – App directory with a sticky header, categories, search and connect states; focus stays on the list when rows leave a tab; `connected`/`defaultConnected`/`onConnectedChange`
- **Onboarding** (`onboarding.tsx`) – First-run flow of an AI workspace: workspace setup, tool connections, team invites and a first agent (template radio group with arrow keys), with a getting-started checklist; `step`/`defaultStep`/`onStepChange`, and `onComplete` may return a promise
- **Settings & Billing** (`settings-billing.tsx`) – Settings page with tabs: workspace, members, API keys and billing with plan, the library Usage Meter (`layout="wide"`), payment method, plan comparison and invoices; `tab`/`defaultTab`/`onTabChange`
