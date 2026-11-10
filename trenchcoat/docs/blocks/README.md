<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Overview](../README.md)

# Blocks

**Ready-made sections built from components**

Larger compositions such as a KPI board, a pricing table, an AI workspace or a task board. They combine several components with layout and sample data – drop one in to get a whole section of a page.

23 items · 23 files

- [Access Review](access-review.md) – A periodic check of who can see what – keep or remove each one, with anyone flagged first and a written reason for keeping them
- [Agent Gallery](agent-gallery.md) – Slim gradient panels with one open product screen in the middle – pick a panel and it glides open (uses `button`)
- [AI Side Pane](ai-side-pane.md) – An assistant docked beside a page with a chat about what's on it – resizable, collapses to a rail, opens with ⌘. and becomes a sheet on narrow screens; model, settings, prompts and page context in the composer (uses `chat-composer`, `ai-answer`, `claim-answer`, `message-actions`, `prompt-starters`, `chat-history`, `reflection-gate`, `button`)
- [AI Workspace](ai-workspace.md) – Complete assistant app – sidebar, welcome, streaming chat and projects, built on the Chat Composer (uses `chat-composer`, `button`)
- [App Directory](app-directory.md) – Browse, search and connect integrations – categories, filters and app cards with a connect flow (uses `button`)
- [Audit Trail](audit-trail.md) – Who did what and when, for the record – grouped by day, with search, a filter by outcome, details on demand and a safe CSV export
- [Case Review](case-review.md) – One case ready for a person to decide – evidence, a timeline, the assistant's labelled suggestion, and a decision that needs a written reason (uses `fact-sheet`, `entity-timeline`, `agent-face`)
- [Client Context](client-context.md) – A client workspace with live numbers and a shared context timeline – switch clients, search, filter and add notes or files (uses `button`, `segmented-control`)
- [Evidence Gallery](evidence-gallery.md) – The images behind a set of claims – filter by attestation, compare and download in the image grid, and each item's attestation and linked-claim count in a sortable table beside it (uses `@adamstavely/trenchcoat/react`: `segmented-control`, `image-grid`, `data-table`)
- [File Details](file-details.md) – One file in one place – what it is, the team's flag on it, what's in it, its versions, and who it's shared with after their entitlements are checked (uses `team-flag-picker`, `file-summary`, `version-history`, `share-panel`)
- [Header Nav](header-nav.md) – The right end of an app header – notifications bell, app picker and the person's avatar, which opens their account card; one popover at a time, the three as one set of round buttons, and it fits a 320 px header (uses `@adamstavely/trenchcoat/react`: `notifications`, `app-picker`, `profile-menu`)
- [Invoice & Credit Note](invoice-credit.md) – An invoice and its credit note stacked like paper – switch between them, pick lines to credit, adjust amounts and issue (uses `button`, `segmented-control`)
- [KPI Board](kpi-board.md) – The top of a dashboard – three trend cards, an overview chart that compares this period with the last, and a focus card; hover shows any day's value and every number rolls when the range changes (uses `button`)
- [Logo Marquee](logo-marquee.md) – The endless “Trusted by” strip – a seamless loop that eases to a stop on hover, scrubs with inertia and lifts the hovered logo to colour, with a Pause / Play button (uses `button`)
- [Metrics Dashboard](metrics-dashboard.md) – Sales overview – KPI cards pick the metric, one chart switches between dotted line and bars, with top products and channels (uses `button`, `segmented-control`)
- [Oversight Home](oversight-home.md) – A role's home dashboard – the headline that needs doing, the one thing first, KPI charts against last week and the service posture table with a state filter; switch roles at the top (uses `@adamstavely/trenchcoat/react`: `segmented-control`, `kpi-chart`, `data-table`, `button`)
- [Pricing Plans](pricing-plans.md) – Pricing section with a monthly / yearly switch, three plan cards and collapsible details (uses `segmented-control` and `button`)
- [Publish Readiness](publish-readiness.md) – What must pass before something is released – a summary card that opens a dialog with the checks as a progress tracker, sign-offs to give, and each blocker linked (uses `@adamstavely/trenchcoat/react`: `dialog`, `progress-tracker`, `button`)
- [Red-team Finding](red-team-finding.md) – What an adversarial test broke – a findings list, then the picked one's severity, failed invariants, scenario, evidence and a response timeline with undo (uses `@adamstavely/trenchcoat/react`: `agent-ledger`, `button`)
- [Session Panel](session-panel.md) – The side panel of a working session – tools, where it runs, how full its context is, its connectors, outputs, subagents and background tasks, and the changes it has made (uses `tc-panel-card`, `tc-subagent-list`).
- [Task Board](task-board.md) – Kanban board with drag and drop, quick add, a detail panel, search, label filters and a compact view (uses `button`)
- [Testimonial Wall](testimonial-wall.md) – The landing-page wall of quotes – columns that scroll endlessly in opposite directions, ease to a stop on hover and scrub with inertia, with a Pause / Play button (uses `button`)
- [Uncertainty Mix](uncertainty-mix.md) – Where an answer's uncertainty comes from – the overall mix with what each kind means and a short reading of what to do, and the same mix per part in a breakdown chart (uses `@adamstavely/trenchcoat/react`: `breakdown-chart`)
