# Trenchcoat – components

One source per component, with both looks: the `look` prop picks Standard (the default) or Clean. Components share
the helpers in `src/internal/` and read their values from `tokens/tokens.css`, which an app loads once. These React
components are being ported to Lit web components (`audit/lit-port-plan.md`); the package build follows.

- **Agent Cursors** (`agent-cursors.tsx`) – Agents working in a document like teammates in a multiplayer editor – live pointers with names, suggestions typed letter by letter, images they resize, code they fix and comments beside the page
- **Agent Graph** (`agent-graph.tsx`) – Agents and the tools they call as a living network – a pulse along the link for every call and its answer, busy links growing thicker, agents that breathe while they work and turn amber when they need you
- **Agent Inbox** (`agent-inbox.tsx`) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place
- **Agent Lanes** (`agent-lanes.tsx`) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- **Agent Ledger** (`agent-ledger.tsx`) – Everything an agent changed in your systems, each change with an undo – before and after per row, and pointing at Undo shows what builds on it: what would be undone too, and what can't be taken back
- **Agent Plan** (`agent-plan.tsx`) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
- **Agent Queue** (`agent-queue.tsx`) – The work waiting for your agents, and how fast it moves – jobs drop into a live queue, glide into free worker slots as growing bars and land in Done or Failed, while a depth chart shows the backlog build up when a rate limit pauses the workers and drain when they resume
- **Agent Steering** (`agent-steering.tsx`) – Steer an agent while it works – queue a note for the next step and watch it glide into the plan when the agent picks it up, or interrupt right away
- **Agent Tree** (`agent-tree.tsx`) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- **AI Answer** (`ai-answer.tsx`) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- **Approval Card** (`approval-card.tsx`) – An agent asks before it acts – risk badge, preview, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- **Autonomy Dial** (`autonomy-dial.tsx`) – How much an agent may do on its own – a three-stop dial, and its real actions gliding between “Runs on its own” and “Asks you first”, with a lock for what always asks
- **Billing Schedule** (`billing-schedule.tsx`) – Build a billing phase – start date, duration, products with repeats and timing, discount, minimum and live totals
- **Breakdown Chart** (`breakdown-chart.tsx`) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- **Button** (`button.tsx`) – Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state
- **Change Summary** (`change-summary.tsx`) – What moved since last time – one metric per row with a colored trend
- **Chat Composer** (`chat-composer.tsx`) – Prompt composer with model picker, voice input, app connections and approval request
- **Cited Answer** (`cited-answer.tsx`) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- **Combobox** (`combobox.tsx`) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- **Command Menu** (`command-menu.tsx`) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- **Comment Thread** (`comment-thread.tsx`) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
- **Comments Panel** (`comments-panel.tsx`) – Comment feed with filters, runnable /edit commands, resolve and a composer
- **Compact Breakdown** (`compact-breakdown.tsx`) – A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes
- **Context Map** (`context-map.tsx`) – What fills an agent's context window, as a living treemap – system prompt, tools, memory, every file, the chat and tool results as tiles that glide as it grows, the free space dashed, and compaction squeezing old turns into a summary
- **Context Window** (`context-window.tsx`) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- **Data Table** (`data-table.tsx`) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- **Date Range Picker** (`date-range-picker.tsx`) – Presets and two calendars with a hover preview, comparison with the previous period or year, full keyboard control
- **Decision Inbox** (`decision-inbox.tsx`) – Open decisions with two quick answers each – answered ones confirm and fold away
- **Decision Tree** (`decision-tree.tsx`) – An agent stuck on a decision lays out its options as a tree – the consequences of each branch, the risky ones marked, its own pick highlighted – and you choose a path or write your own
- **Delegate Board** (`delegate-board.tsx`) – Hand work to your agents by dragging it onto them – each agent previews its new “busy until” time, or switch to Auto and every new task goes to whoever is free first
- **Dropzone** (`dropzone.tsx`) – Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry
- **Email Draft** (`email-draft.tsx`) – Agent-written email for review – switch recipient and tone, edit inline, remove the attachment, send or discard with undo
- **Experiment Card** (`experiment-card.tsx`) – An A/B test in two lines that quietly unfolds on hover – variants linked to a tiny chart, a metric switch with rolling numbers, and a winner you pick with a click
- **Fan-out Grid** (`fan-out-grid.tsx`) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover
- **Filter Menu** (`filter-menu.tsx`) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- **Inline Diff** (`inline-diff.tsx`) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- **Integration Picker** (`integration-picker.tsx`) – Integrations page of a command menu – search, a list of services and the picked one with its connection on two tiles
- **Integration Settings** (`integration-settings.tsx`) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
- **KPI Chart** (`kpi-chart.tsx`) – Metric card with a multi-line chart and a tooltip that follows the pointer
- **Memory Panel** (`memory-panel.tsx`) – What the assistant remembers about you, grouped and editable – a master switch, category filters, and on every memory edit in place, pause or forget with Undo on the tray
- **Message Actions** (`message-actions.tsx`) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- **Model Picker** (`model-picker.tsx`) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
- **Notification Stack** (`notification-stack.tsx`) – Notice cards stacked behind each other – dismiss the front one to reveal the next
- **OTP Input** (`otp-input.tsx`) – The verification code field done right – a gliding focus ring, paste and SMS autofill, a calm shake on errors and a morph into Verified
- **Parallel Attempts** (`parallel-attempts.tsx`) – An agent tries the same task several ways at once and the best one wins – every attempt races as a row with its model, approach and live bar, then gets a score; the best is marked and picked, and you can switch to another
- **Permission Request** (`permission-request.tsx`) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- **Plan vs Actual (Clean only)** (`plan-vs-actual.tsx`) – An agent's plan against what really happens – every step's bar grows over its dashed planned ghost, overruns turn amber, the steps after it slide right, and the expected finish moves away from the planned one
- **Profile Menu** (`profile-menu.tsx`) – Account card with the signed-in user, menu actions and profile setup progress
- **Progress Tracker** (`progress-tracker.tsx`) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- **Project Card** (`project-card.tsx`) – A two-line project summary that quietly unfolds on hover – a progress ring with one segment per subtask, a people filter and a status picker, all linked by hover
- **Prompt Library** (`prompt-library.tsx`) – Saved prompt templates with variables – type straight into the sentence, watch the finished prompt assemble below, and use it once every variable is filled
- **Reaction Bar** (`reaction-bar.tsx`) – Like, comment, repost and share in one pill – icons pop and fill, counts roll in digit by digit
- **Review Center** (`review-center.tsx`) – A focused workspace for what your agents want to do – the queue sorted by risk, one item at a time with the shaky spans marked, Approve, Edit, Reject and Skip on single keys, a stamp as each one leaves and the next one rising in
- **Segmented Control** (`segmented-control.tsx`) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- **Setup Guide** (`setup-guide.tsx`) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- **Smart Recommendation** (`smart-recommendation.tsx`) – Suggestion card with a confidence signal, alternatives to switch to and accept with undo
- **Stepper Form** (`stepper-form.tsx`) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- **Thinking Loader** (`thinking-loader.tsx`) – A small working pill for AI replies – an eight-ray spinner and a shimmering label that rolls through phases and settles on a check
- **Thinking State** (`thinking-state.tsx`) – AI working panel with a live timer, searched sources and thinking steps that appear one by one
- **Tips Panel** (`tips-panel.tsx`) – Grid of short tips with one action each – taken tips turn into a done state
- **Toaster** (`toaster.tsx`) – Calm toasts from anywhere – a stack that fans out on hover, promise toasts that morph from spinner to check, swipe to dismiss
- **Tool Call Card** (`tool-call-card.tsx`) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up
- **Trace Waterfall** (`trace-waterfall.tsx`) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- **Usage Meter** (`usage-meter.tsx`) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- **Writing Assistant** (`writing-assistant.tsx`) – AI chat card with a soft gradient glow, suggestions, streaming replies and live voice dictation

Live previews: run `npm run dev` and open the gallery.
