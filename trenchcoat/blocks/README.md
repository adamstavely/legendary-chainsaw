# Trenchcoat – blocks

Every file is a single, self-contained React component (React is the only dependency).
Copy a file into your project, e.g. `components/ui/`, and import it from there.
Some files import another Trenchcoat component from `@/components/ui/<name>` – copy that one alongside (AI Workspace uses `chat-composer`).
Every block takes `className`, other DOM props and a `ref` on its root; state a parent may want follows `x` / `defaultX` / `onXChange`.
Newer blocks are built on the Lit components through `trenchcoat/react` (install `trenchcoat` instead of copying components); they follow the nearest `LookProvider`, or take a `look` prop.

- **Agent Gallery** (`agent-gallery.tsx`) – Slim gradient panels with one open product screen in the middle – pick a panel and it glides open (uses `button`)
- **AI Side Pane** (`ai-side-pane.tsx`) – An assistant docked beside a page with a chat about what's on it – resizable, collapses to a rail, opens with ⌘. and becomes a sheet on narrow screens; model, settings, prompts and page context in the composer (uses `chat-composer`, `ai-answer`, `claim-answer`, `message-actions`, `prompt-starters`, `chat-history`, `reflection-gate`, `button`)
- **AI Workspace** (`ai-workspace.tsx`) – Complete assistant app – sidebar, welcome, streaming chat and projects, built on the Chat Composer (uses `chat-composer`, `button`)
- **App Directory** (`app-directory.tsx`) – Browse, search and connect integrations – categories, filters and app cards with a connect flow (uses `button`)
- **Client Context** (`client-context.tsx`) – A client workspace with live numbers and a shared context timeline – switch clients, search, filter and add notes or files (uses `button`, `segmented-control`)
- **Evidence Gallery** (`evidence-gallery.tsx`) – The images behind a set of claims – filter by attestation, compare and download in the image grid, and each item's attestation and linked-claim count in a sortable table beside it (uses `trenchcoat/react`: `segmented-control`, `image-grid`, `data-table`)
- **Invoice & Credit Note** (`invoice-credit.tsx`) – An invoice and its credit note stacked like paper – switch between them, pick lines to credit, adjust amounts and issue (uses `button`, `segmented-control`)
- **KPI Board** (`kpi-board.tsx`) – The top of a dashboard – three trend cards, an overview chart that compares this period with the last, and a focus card; hover shows any day's value and every number rolls when the range changes (uses `button`)
- **Logo Marquee** (`logo-marquee.tsx`) – The endless “Trusted by” strip – a seamless loop that eases to a stop on hover, scrubs with inertia and lifts the hovered logo to colour, with a Pause / Play button (uses `button`)
- **Metrics Dashboard** (`metrics-dashboard.tsx`) – Sales overview – KPI cards pick the metric, one chart switches between dotted line and bars, with top products and channels (uses `button`, `segmented-control`)
- **Oversight Home** (`oversight-home.tsx`) – A role's home dashboard – the headline that needs doing, the one thing first, KPI charts against last week and the service posture table with a state filter; switch roles at the top (uses `trenchcoat/react`: `segmented-control`, `kpi-chart`, `data-table`, `button`)
- **Pricing Plans** (`pricing-plans.tsx`) – Pricing section with a monthly / yearly switch, three plan cards and collapsible details (uses `segmented-control` and `button`)
- **Publish Readiness** (`publish-readiness.tsx`) – What must pass before something is released – a summary card that opens a dialog with the checks as a progress tracker, sign-offs to give, and each blocker linked (uses `trenchcoat/react`: `dialog`, `progress-tracker`, `button`)
- **Red-team Finding** (`red-team-finding.tsx`) – What an adversarial test broke – a findings list, then the picked one's severity, failed invariants, scenario, evidence and a response timeline with undo (uses `trenchcoat/react`: `agent-ledger`, `button`)
- **Task Board** (`task-board.tsx`) – Kanban board with drag and drop, quick add, a detail panel, search, label filters and a compact view (uses `button`)
- **Testimonial Wall** (`testimonial-wall.tsx`) – The landing-page wall of quotes – columns that scroll endlessly in opposite directions, ease to a stop on hover and scrub with inertia, with a Pause / Play button (uses `button`)
- **Uncertainty Mix** (`uncertainty-mix.tsx`) – Where an answer's uncertainty comes from – the overall mix with what each kind means and a short reading of what to do, and the same mix per part in a breakdown chart (uses `trenchcoat/react`: `breakdown-chart`)
