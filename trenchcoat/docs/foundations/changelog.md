<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

# Changelog

## 0.28.2 – Notifications bell

- **Notifications:** the bell is named by its own text ("Notifications, 7 unread", as screen-reader text) instead of an
  `aria-label` over the visible count, so its visible label is part of its name (WCAG 2.5.3).
- **Notifications:** the unread badge is red 600 behind its white numerals, 5.5:1 in both themes; red 500 (light) and
  red 400 (dark) gave 3.9:1 and 2.9:1 (WCAG 1.4.3). `--tc-notifications-badge-bg` overrides it.

## 0.28.1 – Angular 22 and accessibility fixes

- **Angular bindings:** the `@angular/core` and `@angular/forms` peer range now allows Angular 22. The wrappers are
  compiled in partial mode, so Angular 22 apps link them unchanged.
- **Stories:** a tile is named by its own text – the name, then the new or seen count in screen-reader text – instead of
  an `aria-label`, so its visible name starts its accessible one (WCAG 2.5.3). axe flagged the old name as not matching
  the tile's visible initials and name.
- **Command Menu:** in popover layout, the results close when focus leaves the field (Tab, Shift+Tab), so they no
  longer stay open over whatever has focus next (WCAG 2.4.11).
- **Approval Card:** the ⌘↵ hint on Approve, in dark mode, goes from 4.0:1 to about 5.7:1 against its key cap (WCAG
  1.4.3).

## 0.28.0 – Admin: spend, governance and data

- **Spend Breakdown:** AI spend by model, feature, user or team – a ranked list with shares and the change on the period
  before in words, a stacked bar per day or a table, a period switch, and picking a slice to filter.
- **Spend Limits:** spend caps per member, team or API key – the workspace default, spent of each cap in words and a
  meter, over-limit rows first, in-place editing, Block / Warn / Notify, and add and remove.
- **Budget Alerts:** drag markers along the month's budget bar, with the forecast hatched beyond what's spent – keyboard
  sliders, click to add, each alert's channel and recipients, and when the forecast crosses it.
- **Top Spenders:** who is behind most of the spend, ranked – share bars, change in words, top model and a sparkline,
  kind chips, and the long tail folded into one line.
- **Seat Usage:** seats paid for against seats used – active, idle and unassigned in one bar with their cost, a breakdown
  by plan or team, and idle members to reclaim after a confirmation.
- **Cost Anomaly:** one spend spike – how far over expected, a chart with the expected band (or a table), what drove it
  with shares, the evidence, and Set a limit, Investigate and Mark as expected with Undo.
- **Model Access:** which models a workspace may use – allow or block each with Require approval, warnings for blocked
  models agents still use, the default model and a rule for new models.
- **Moderation Queue:** reported replies judged one at a time – report or classifier score, policy, the conversation with
  the reply marked, and Keep, Remove, Restrict or Escalate by button or key, with required notes and Undo.
- **Role Editor:** what each role can do – a grid of permissions by role with dependencies kept in step, a locked Owner,
  custom roles, member counts, and Discard and Save over a summary of changes.
- **Trust Center:** a vendor's security page – certifications with status in words, documents to view or request (NDA
  noted), the DPA to review and sign, and common questions.
- **Subprocessor List:** every vendor that touches customer data, with data categories, location, transfer mechanism and
  status in words; filters, Export CSV (formula-safe) and Subscribe to changes.
- **Data Region:** where a workspace's data lives, item by item in words, and a checked flow to move it – region, impact,
  schedule, confirm by typing the workspace's name, and progress.
- **Data Controls:** a person's own data – training, history and memory switches with what each means and when it
  changed, Export my data with its status, and Delete all chats behind a confirmation.
- **Standalone gallery and `docs/`:** rebuilt with the above.

## 0.27.0 – Developer tools and skills

- **Run Receipt:** what one agent run cost, as a receipt – models, tools, lookups and retries, the subtotal, cache
  savings and total, the costliest step, Copy run ID, Open trace and Download CSV.
- **Run Log:** every agent run on one line, with status, agent and trigger chips, search, a time range, failed runs that
  open to their error, and live runs held behind Show new.
- **Request Log:** every model-provider request on one line – status in words, latency bars, tokens, cost and cache –
  with class and model filters, bodies and headers with secrets masked, and Copy as cURL.
- **Rate Limit Status:** usage against each provider's rate limits – requests and tokens a minute as meters, headroom in
  words with a reset countdown, 429s, tier and a peak sparkline, tightest first.
- **Quickstart:** a first API request with the key filled in – four languages, four steps, the key masked in an
  environment variable, Copy with a key warning, and Run it with the response.
- **Endpoint Bar:** one endpoint on one line – method badge, environment select, path with described {params},
  Deprecated and Beta, Copy URL and Try it.
- **Schema Fields:** an API's fields from a JSON Schema – types, required, allowed values, defaults and limits in words,
  nested objects folding with Expand all, a filter, and a copyable link to each field.
- **Response Examples:** example responses one tab per status, with folded headers and a pretty-printed body to copy in
  each media type.
- **API Reference Nav:** endpoints grouped by resource with method badges, names or paths, a filter, the current page in
  view, deprecated endpoints marked, and tree keys with type-ahead.
- **Copy Page Menu:** copy a docs page as Markdown for a model – or view it, copy its link, open it in a chat assistant
  with a prompt filled in, or download it as .md.
- **Skill Library:** a workspace's skills grouped by who made them, each with a switch, its trigger, last use and
  Update; search, source and on/off filters, and Add skill.
- **Skill Detail:** one skill's maker, version, triggers, tools with their permissions in words, files and runs, with
  Enable / Update / Export / Remove, confirming before turning on anything risky.
- **Standalone gallery and `docs/`:** rebuilt with the above.

## 0.26.0 – Bulk runs and imports, and Downloading and Uploading

- **File Import:** drop a CSV, TSV or Excel file and see what was read – rows, columns, delimiter and encoding, a
  header-row switch, a preview with each column's type in words, problems in words, and Continue.
- **Column Mapper:** a model's column matches to check – a select per column prefilled from its suggestion with the
  confidence in a word, Use suggestion, Accept all, and missing or doubled fields in words before Continue.
- **Import Review:** fix, deduplicate and check rows before import – cell problems in words, duplicates with Keep this
  and Merge, filter tabs with counts, edits in place, skip and restore, and Import held until nothing's left to fix.
- **Enrichment Grid:** a table a model fills in, cell by cell – AI columns marked with their prompt, each cell's state in
  words with confidence and source, progress and time left, Pause / Resume and Retry failed, only the rows in view drawn.
- **AI Column Create:** a column a prompt fills for every row – name, type and choices, {{column}} variables inserted
  from chips and checked, model and web search, a three-row preview, and Create column with the run's estimate.
- **Run Estimate:** what a bulk run will cost before it starts – a cost range, cells, tokens, lookups and time, where the
  money goes, the budget left with a warning, a sample run and a spend cap (`estimateRun()` exported).
- **Cell Inspector:** why one AI cell says what it says – value and confidence, the prompt with the row filled in,
  reasoning, sources, tokens and cost, and history – with Accept, Edit value, Re-run and Mark as wrong.
- **Downloading (illustration):** a document whose badge shows an arrow dropping into a tray, with the words
  Downloading, for a file or export on its way to the person – beside the workflow stages.
- **Uploading (illustration):** a document whose badge shows an arrow rising out of a tray, with the words Uploading –
  the in-progress sibling of Upload Failed.
- **Standalone gallery and `docs/`:** rebuilt with the above.

## 0.25.0 – Evals in production

- **Test Run Panel:** try an agent while you edit it – draft or live badge, the conversation with its tool calls, test
  variables, Reset, and Save as test case.
- **Review Queue:** grade real outputs one at a time from the keyboard – per-criterion pass or fail and 1–5 grades, a
  note, a suggested verdict, progress, skip and undo.
- **Eval Criteria Editor:** define what an LLM judge asks – pass or fail, scale or label answers, weights as shares,
  examples, checks in words, the assembled prompt and Try on sample.
- **Quality Trend:** judge scores on live chats day by day, with sample-size bands, changes pinned on the time axis, a
  sentence on what moved since the latest change, and a table view.
- **Quality Drop:** one drop in a judge score – the likely cause with its confidence in words, failing chats as quotes,
  the topics it clusters in, and Roll back, Investigate or Dismiss.
- **Change Impact:** before against after for one change – a dumbbell row per criterion with a verdict in words from
  the counts, cost and latency deltas, and a segment switch.
- **Failure Clusters:** failing chats grouped by topic with size, share and trend in words; quotes, Open chats, Add to
  dataset and Mark as known.
- **Quality Alerts:** alert rules written as sentences with labelled slots, a switch, last fired and a 30-day preview.
- **Judge Sampling:** a judge's sampling rate per segment, always-include rules and model, with live estimates of chats
  judged, monthly cost and the drop it can see, and a budget warning.
- **Eval Scorecard:** `runs` adds run history – pass rate against a baseline, each run's change in words, the cases that
  regressed, Set as baseline and a table view.
- **Evaluation Dataset Editor:** `fromRun` turns a real run into a test case, with suggested checks, tags and split.
- **Standalone gallery and `docs/`:** rebuilt with the above.

## 0.24.0 – Agent setup and deploy

- **Agent List:** every agent in a workspace with the failing ones lifted into Needs attention and why in words; search,
  status filter and sort, and a row that opens the agent.
- **Agent Summary:** one agent's profile – status, model, tools, owner and versions, two weeks of runs as a chart with a
  table, success rate, median run and cost, recent failures, and Edit, Run test and Pause.
- **Agent Create:** describe an agent and get a streamed draft to edit – name, instructions, tools, model, triggers and
  open questions – then Create.
- **Workflow Canvas:** an agent workflow as a node graph – drag, connect and arrange steps with the pointer or the
  keyboard, pan and zoom, watch a run colour each step, or read it as a list.
- **Step Picker:** search step kinds and tools to add next, grouped, with suggested and recent steps first – inline or
  as a popover.
- **Step Inspector:** a step's inputs as typed values or mappings from earlier steps' outputs, missing inputs in words,
  a test run, and its input and output.
- **Secrets Manager:** write-only secrets for agents – missing ones first with the agents that need them, set and
  replace without ever showing a value, delete that names what breaks.
- **Trigger List:** every way an agent starts, each with a switch – what starts it in words, when it last fired,
  errors, Edit and Add trigger by kind.
- **Deploy Channels:** where an agent can be reached – status in words, the version it serves, last week's traffic, and
  Set up, Configure, Pause or Resume.
- **Channel Setup:** connect a channel and set when the agent replies – Connect, Where, When it replies (including
  business hours), Test and Go live, each step checked in words.
- **Embed Widget:** the chat a visitor opens on a website – a corner launcher with an unread count, a greeting,
  starters, the conversation with a person taking over, styled by the site's accent, radius and side.
- **Embed Configurator:** style the site widget beside a live preview, with the accent checked for contrast in words,
  and copy its install snippet.
- **Trigger Builder:** a webhook kind (with `webhookUrl`) – the address with Copy, the method, a secret header, a sample
  payload with Send test request, and the last request in words.
- **Knowledge Source Manager:** with `add-inline`, Add source opens a panel to drop files, paste links (checked and
  deduplicated, with how far to crawl) or paste text; Add fires `tc-sources-add`.
- **Approval Card:** `editable-args` lets people change a call's arguments before approving – typed fields, JSON checked
  as it's typed, a diff of the changes, Reset, and "Approve with changes".
- **Preview Frame:** `html` runs model-written HTML in a scripts-only sandbox with no network unless `allow-network`;
  its errors feed the console count and a problems list with Ask to fix.
- **Handoff Brief:** hand on an agent run that's still going – its status and step, what the receiver takes over, pause
  until they accept, then "Waiting for … to accept" with Cancel handoff.
- **Running Now** and **Background Tasks:** `notifiable` adds a bell on tasks still going – tell me when it finishes,
  optionally by channel.
- **Standalone gallery and `docs/`:** rebuilt with the above.
## 0.22.1 – A comment thread's first reply shows in full; read-only threads

- **Comment Thread:** the first reply on an empty thread shows in full – the list was held at its empty height, so the
  reply sat in a sliver of a scroll area.
- **Comment Thread:** `readonly` (reflected) hides the reply field, for people who may read a thread but not reply.

## 0.23.0 – Images and tool results

- **Edit Region:** brush, erase or box part of an image and say what should change; Generate sends the instruction, the
  mask as a PNG at the image's size, its bounds and coverage.
- **Point and Ask:** pin or box parts of an image, ask about each and all of them, and show answers under each mark –
  every step works from the keyboard.
- **Region Overlay:** what a vision model read, drawn on the image – numbered boxes linked to a list with kind,
  confidence and read text, filtered by kind and a confidence threshold.
- **Before After:** an original and its edit with a divider to drag (or arrow keys), vertical or side by side.
- **Line Items:** rows a model reads off a document, edited in place with locale numbers, totals with tax that recompute
  live, "Check" and "Low confidence" in words, a warning when the total doesn't match the document's, and Confirm.
- **Test Run Result:** only what failed – counts in words over a bar, each failure with its message, a line diff and the
  trimmed stack with a file link, passed tests folded, Re-run failed, and live counts while running.
- **Schedule Card:** a recurring agent task – the schedule in words, a live countdown to the next run, the last runs as
  marks with when and how long, and Run now, Pause / Resume and Edit.
- **Map Itinerary:** a trip planned day by day, each day's stops in order and on a map drawn from their coordinates –
  the chosen day's route standing out and map tiles only on request.
- **Recipe Card:** a recipe to cook from – scaling servings, metric or imperial (oven temperatures too), an ingredient
  checklist, and steps with the current one marked and built-in timers.
- **Message Drafts:** text-message drafts in two to four tones, edited in place with an SMS length (GSM or Unicode),
  then Copy, Send or Open in Messages.
- **New-component integration pass:** also runs the canvas's tests, and warns when the framework example apps aren't
  installed (the snippets check skips itself without them).
- **Standalone gallery and `docs/`:** rebuilt with the above.

## 0.22.0 – Chat: tabs, a dock, ghost text, shared threads and recovery states

- **Session Tabs:** open chats as tabs above a thread – status in a mark and a word, unread dots, close, drag or
  Alt+Shift+arrows to reorder, and a menu of tabs scrolled out of view.
- **Thread Header:** the bar at the top of a thread – rename in place, model and project chips, Share, side-panel
  toggles and a menu of actions, folding into the menu when narrow.
- **Panel Dock:** one side panel beside a chat with a tab per open item – resized from its edge, folded to a rail,
  closed with Escape, and a full-width sheet when narrow.
- **Ghost Completion:** dimmed suggestions after the caret – Tab takes them, Ctrl/⌘ + → takes a word, Escape dismisses.
- **Multiplayer Thread:** one thread, several people and one model – presence and typing, @-mentions, and whether the
  model answers every message or only when mentioned.
- **Answer Arena** compares three or four models: columns or a tab pager, a pick-the-best vote with "All equally good"
  and "All bad", and the winner's id in the event.
- **AI Answer:** an interrupted state that keeps the text so far, with Continue and Retry, and an unavailable state with
  a live retry countdown, Try now and a fallback model.
- **Chat Composer:** `limit` holds sending back without losing the draft – a message limit with when it resets, or a
  trial that's over – with a notice and an optional action.
- **Cited Answer:** View in document opens the source's full text at the cited passage, with Previous and Next through
  that document's passages (`documents` / `loadDocument`, `tc-source-open`).
- **Message Actions:** `reportable` adds Report – flag a harmful reply for review with a reason, then Undo.
- **Selection Toolbar:** `rewritable` adds Rewrite – rewrite the selection with an instruction or a quick chip, shown as
  a word diff to accept, reject or try again.
- **Mention Picker:** commands can take `args` (text, number or choice), asked for in a short form and inserted as the
  assembled command.
- **`docs/` checked in CI** (`npm run check:docs-md`) and exported by the new-component integration pass; a merge to
  `main` mirrors it to [trenchcoat-docs](https://github.com/adamstavely/trenchcoat-docs), replacing only the folders it
  copies, so files added there directly stay.
- **Standalone gallery:** rebuilt with all of the above, now by `npm run build:standalone`, which the new-component
  integration pass runs.

- **`docs/` checked in CI:** a PR fails when `docs/` doesn't match the gallery (`npm run check:docs-md`), and the
  new-component integration pass now exports it, so every new component's page is in `docs/`.
- **Mirrored to trenchcoat-docs:** a merge to `main` that changes `docs/` or the standalone gallery copies both to the
  [trenchcoat-docs](https://github.com/adamstavely/trenchcoat-docs) repo.

## 0.21.0 – Image Generation

- **Image Generation:** one image while it's generated – its place in the queue, then the picture taking shape in a
  frame of the image's own shape as a blurred preview or colour field clears, with the step, percentage and time left;
  the image fading in when it's done, or why it failed with Try again; the prompt, and Cancel, Download, Regenerate and
  Copy prompt. Image Grid shows variations; this is the one image on its way.
- **Standalone gallery and `docs/`:** rebuilt with it.

## 0.20.0 – Agent attention pieces and confetti

- **Decision Card:** one question an agent needs answered, docked above the composer – numbered options with one
  recommended, 1–9 to pick, Approve / Decline with a reason, a queue, and a receipt with Undo.
- **Away Summary:** the "while you were away" card at the top of a chat thread – what needs you, what failed, what's done.
- **Agent Recap:** the same for a home page – a stacked chart of the period with notable events marked, and Needs you,
  Failed and Done acted on in place. Agent Inbox's recap view is part of its inbox; this is a card of its own.
- **Judge Bracket:** how an LLM judge picks the best of several attempts, as a tournament that fills as verdicts stream in.
- **Running Now:** a header pill, "3 running · 2 need you", opening a panel of agents' background tasks.
- **Confetti (motion):** a celebration burst from what it wraps or the top of the viewport, on one canvas that's removed
  when it settles; a brief tint instead under reduced motion.
- **Standalone gallery and `docs/`:** rebuilt with the new pieces.

## 0.19.0 – Charts, AI pieces, a signature pad and transitions

- **Charts:** Stage Bars (a funnel as a list of pills, with stat tiles and a period switch), Week Bars (a week of daily
  totals against a goal, with a week switcher), Score Ring (one score from weighted sub-scores) and Active Days (a daily
  goal month by month, a small ring per day).
- **Bubble Chart:** points by group, with a legend that isolates, hides and shows each group, and stat tiles under it.
- **Radial Bar Chart:** `variant="rings"` – activity rings with a lap past each target and a tile per ring.
- **AI:** Diff Table (an AI's proposed edits to a table, reviewed in place), Pixel Loader (a pixel-grid working row with
  the time elapsed) and Fine-tune Card (an inspector where an agent tunes a design and the person takes over).
- **Signature Pad:** a form field for signing – drawn or typed, undo and clear, exported as SVG or an image.
- **Motion:** Badge Pop, Banner Stack, Dissolve Clear, Error Shake, Icon Swap, Like Burst, Menu Morph, Page Slide,
  Sliding Indicator and Stack Spread.
- **Standalone gallery and `docs/`:** rebuilt with every new piece – 471 Markdown pages, and a 27 MB single-file gallery.
- **new-component skill:** `add-to-gallery.mjs` writes categories to `app/src/catalog.ts`, where they moved in 0.18.0.

## 0.18.0 – The gallery's pages as Markdown

- **`docs/`:** every page of the gallery as a Markdown file – 453 of them: the overview, one index per library, each
  component, block, screen, illustration and motion piece, and the foundations (Tokens, Browser support and Performance
  with their tables, every spot illustration by name, the changelog). A component's file has everything its page shows,
  in the page's order: install and import, overview, anatomy, looks, usage, the API tables, frameworks, accessibility,
  browser support, performance, content, do and don't, related and changelog – and what the page keeps behind tabs,
  the five frameworks' snippets and bindings, is written out in full. Blocks get the same page from their guidance and
  API, which the gallery only searches. Links between pages are relative, so the folder reads on GitHub as it is.
- **`npm run export:docs-md`** rewrites `docs/` from the gallery's sources (`app/src/docs/markdown.ts`, through Vite);
  `-- --check` fails when it's out of date. The library list – names, intros and categories – moved from the registry
  to `app/src/catalog.ts`, so the export reads it without loading the demos.
- **Tests:** the idle update-budget test measures the elements 40 at a time, each batch its own test and alone on the
  page, after its charts' entrances have played. With all of them on one page it took 184–226 of its 240 s in WebKit on
  CI, and timed out; it now takes about a minute.

## 0.17.8 – The standalone gallery, rebuilt

- **Standalone gallery:** `standalone/trenchcoat-gallery.html` is rebuilt from this release – it was last built on
  Oct 29 and now has all 435 items: 97 more components, 5 blocks (Access Review, Audit Trail, Case Review, File Details,
  Session Panel), 7 screens, 24 illustrations and 10 motion pieces. It's about 26 MB (7.6 MB gzipped).

## 0.17.7 – Popovers sit by their buttons on a zoomed page; a card's icon can sit by its title

- **Popovers** (the header nav's account card, the notifications panel, the app picker, hover cards, the selection
  toolbar – everything placed by the shared popover controller): on a page using CSS zoom – `zoom: 0.9` on `<html>`
  to make a whole site a step smaller, say – they open where they belong, by their trigger. The top layer escapes
  transforms but still inherits zoom, so they were placed by unzoomed coordinates and landed off to the side (about
  10% of the way back towards the page's top-left corner).
- **Card headers:** `--tc-head-align: start`, set from the page, puts a card's icon level with its title instead of in
  the middle of the title and subtitle – for a card whose subtitle runs to several lines, like an AI summary's subject,
  badge and model, where the middle sits well below the title. Unset, it stays centred.

## 0.17.6 – Header nav sizes for a taller bar

- **Header Nav:** four sizes the page can set on `tc-header-nav`, and the bell and the app picker inside it follow:
  `--tc-hn-trigger-size` (the three round buttons; the control height by default), `--tc-hn-icon-size` (the bell and
  the waffle; 18px), `--tc-hn-face-size` (the avatar; the small control height) and `--tc-hn-initials-size` (the
  initials' text; the xs font size). A taller app bar can scale them up together without restyling the elements. The
  account card's own avatar keeps its size.

## 0.17.5 – Long facet options fit the sidebar; the AI summary's disclaimer sits under its ask box

- **Facet Sidebar:** an option too long for the sidebar ends in an ellipsis inside the card, with its count still
  showing and its whole name on hover. Before, the longest option widened the list past the card's edge, where it was
  cut off mid-word, count and all.
- **AI Summary:** the `disclaimer` sits right under the ask box, above "Was this helpful?" and Sources, rather than
  at the bottom of the card – it reads with the box it's about.

## 0.17.4 – A search box on the facet sidebar; a disclaimer on the AI summary

- **Facet Sidebar:** `search-label` adds a search box above the filters, for searching the results' own text – "Search
  topics", say. It's a white field the size of a page's own, not a long facet's small sunken one. Each keystroke sets
  `query` and fires `tc-query-change` (`{ query }`); the page does the searching. Clear all shows while there's a
  search and empties it along with the filters.
- **AI Summary:** `disclaimer` puts one quiet line at the bottom of the card – "AI can make mistakes. Check important
  info." – as the chat composer and side pane have. It also describes the ask box to screen readers. Unset, there's none.

## 0.17.3 – Priority list columns line up

- **Priority List:** when no row has a priority, a code or a logo, the badge column goes, rather than indent every row
  with an empty one – the names start at the row's edge, under their heading. A row with no trend keeps the line's
  room when other rows have one, so every change lines up after the lines instead of jumping left.

## 0.17.2 – The AI summary shows a finished answer whole

- **AI Summary:** an answer written over its thinking row – the same message id, its status now done or error – is
  scrolled into view once it's written, so a long answer's end isn't left below the scroll area's edge. New messages
  were already scrolled to; an answer that grew in place wasn't.

## 0.17.1 – Centered figure columns and names on the priority list; the AI summary scrolls within, its ask box white

- **Priority List:** a `PriorityFigureColumn` takes `align: "center"`, centering its heading and values – "Last month"
  over its counts – instead of lining them up at the column's end. `name-align="center"` centers the names, with their
  heading over the names alone rather than over the badge column too – for short names such as codes.

- **AI Summary:** given a height shorter than its content, the summary and the conversation scroll between the header
  and the ask box, which stay put with the footer – the page needn't scroll the whole card. At its natural height
  nothing scrolls.
- **AI Summary:** the ask box is a white field in the clean look too, not a gray sunken one. Its send button is still
  the primary action, unless the page sets `--tc-aism-send-bg` (with `--tc-aism-send-bg-hover`,
  `--tc-aism-send-bg-active` and `--tc-aism-send-fg`) on the element or a parent – a brand blue, say. With nothing
  to send it fades to 45%, not 20%, so it keeps its colour rather than washing out to gray.

## 0.17.0 – Subagent List, and subagents in the Session Panel

- **Subagent List** (`tc-subagent-list`): the sub-agents a session has started, grouped Active (running or waiting)
  and Done (finished, failed or stopped) with counts. Each row is the agent's own mark – a flower, star, rings or
  leaves in one of six tones, drawn from its id – its name, what it's doing now, and a time: a clock that ticks while
  it's active ("1m 26s") or how long ago it ended ("just now", "1h ago"). Waiting, failed and stopped say so in words;
  rows are one tab stop with the arrow keys; choosing one fires a cancelable `tc-selected-change`; agents that finish,
  fail or start waiting are announced. Also exported: `subagentMark()` and `subagentClock()`.
- **Session Panel:** a **Subagents** section – `subagents` takes the session's sub-agents and draws them with a bare
  Subagent List, its value the number active. Choosing one fires `tc-subagent-change` with a controllable `subagent`
  (`subagent` / `defaultSubagent` / `onSubagentChange` in React); the list's own `tc-selected-change` stops at the
  panel, so it's never taken for the tool rail's. `now` holds the clocks still. Subagents is open by default, between
  Outputs and Changes; `sections` now defaults to `["environment", "subagents", "changes"]`.

## 0.16.0 – Wider figure columns on the priority list; the AI summary's ask box stays at the bottom

- **Priority List:** a `PriorityFigureColumn` takes a `width` in px, for a heading longer than the 56px default allows –
  "Last month" and "This month" fit in 88px. The name column gives up the room; the header and every row share the
  widths, and a missing or invalid width keeps 56px.
- **AI Summary:** stretched taller than its content – to a grid row's height, say – the card fills the element and the
  room goes under the summary, so the ask box and the footer ("Was this helpful?", Sources, Copy, Regenerate) sit at the
  bottom with no space below them. At its natural height nothing changes.

## 0.15.0 – Time Details

- **Time Details** (`tc-time-details`): times in a passage of text, found and underlined – hover or focus one and a
  tooltip shows it in the reader's own zone (“Your local time · 1:00 AM EST”), with the weekday and date when the day
  changes (“Saturday, 7 November · The day before”). It reads 24- and 12-hour times with a zone (“06:00 UTC”, “6 PM
  ET”, “14:00 GMT+1”, “06:00Z”), ISO stamps, an ISO date before a time, and ranges (“05:30–09:00 UTC”); ET, CT, MT
  and PT follow daylight saving. Times without a date fall on `date` or today; the reader's zone is the browser's,
  or `time-zone`. Each time is described by its local time for screen readers. Also exported: `findTimes()`.

## 0.14.1 – Choice cards are reachable by keyboard with nothing chosen

- **Stepper Form:** `tc-stepper-choices` with no option chosen – an empty `value`, or one that matches no option – made
  every card `tabindex="-1"`, so the group couldn't be reached with Tab (WCAG 2.1.1). Following the ARIA radio group
  pattern, the first enabled card now takes the Tab stop when none is chosen; the chosen card still does otherwise.
  Space picks it, Enter picks it and continues, and the arrow keys move and pick from there, skipping disabled cards.
  A `StepperChoice` can be `disabled`; with the group disabled, or every card disabled, nothing is focusable.

## 0.14.0 – Forecasts on the KPI chart; priority lists that keep their trend line

- **KPI Chart:** forecasts. A `KpiSeries` takes `forecastFrom`, the index into `values` and `labels` where its forecast
  starts: from there the line continues dashed, joined to the last actual point with no gap. An optional `band`
  (`{ low, high }`, one of each per point) shades the forecast's range in the series' colour behind the line, over the
  forecast part only; the y scale takes the band in.
  - A quiet dashed rule and a small label mark the first forecast point; `forecast-label` (`forecastLabel`, default
    “Forecast”) names it there, in the legend's dashed entry (added when any series has a forecast) and in the tooltip,
    which reads forecast points as “Forecast · 14 (11–17)”.
  - The plot's accessible name says where the forecast starts (“…; the forecast starts at May”), and the arrow keys
    read forecast points as such (“Jun: Papers forecast 17 (13–40)”). The band follows the line's draw-in animation,
    which reduced motion turns off; both looks.
  - Without `forecastFrom`, nothing changes.
- **Priority List:** `keep-trend-line` (`keepTrendLine`, false by default) keeps the momentum line at every width where
  the momentum column shows (it still folds below 400px), at the column's full 108px beside the change; the name
  column gives up the difference and truncates sooner – meant for short names such as codes. It composes with `hide`
  and the frame's credit for hidden columns: a 460px list of codes with two figures and coverage, open, work and health
  hidden keeps the line and both figures, without overflowing.

## 0.13.0 – Footnotes; follow-up questions in the AI summary; header tooltips and Terms; inline select labels; priority-list logos

- **Footnotes:** `tc-footnotes` (`@adamstavely/trenchcoat/footnotes`, React `Footnotes`, Angular `Footnotes` from
  `@adamstavely/trenchcoat/angular/footnotes`), a quiet card of caveats and notes under a page's charts.
  - `heading` (“Notes”), `description`, `notes` (`FootnoteNote[]`: `id`, `text`, `href?`, `linkLabel?`, exported),
    `numbered` (true by default; `numbered="false"` gives a bulleted list) and `look`. The notes are small secondary
    text in the standard card shell, with a muted icon so the card sits below the charts it explains.
  - A note's link (its `linkLabel`, or “More”; `href` through `safeUrl`, an unsafe one dropped) fires a cancelable
    `tc-navigate` (`{ href, id }`: `FootnotesNavigate`) – prevented, the link isn't followed, so an app's router can
    take it. Modifier clicks are left to the browser.
  - The host is a region named by the heading. With no notes it renders nothing at all – no heading-only card, no
    region.
- **AI Summary:** follow-up questions. `ask` (the attribute, a placeholder such as “Ask Donovan a follow-up…”) shows a
  question box at the bottom of the card, under the summary and above the footer: one line that grows to four, with
  Send, on the field tokens in both looks. Enter sends and Shift+Enter starts a new line; sending fires a cancelable
  `tc-ask` (`{ question }`: `AiSummaryAsk`, trimmed, never blank) and clears the box unless it's prevented. The box is
  disabled while an answer is being written, and focus returns to it once it's done.
- **AI Summary:** `messages` (`AiSummaryMessage[]`, exported: `id`, `role: "user" | "assistant"`, `text`, `status?:
  "thinking" | "done" | "error"`, `points?`) shows the conversation under the summary, below a quiet “Follow-up”
  divider, oldest first: questions as bubbles at the right, answers as text with the summary's typography and a small
  copy of the icon. A `"thinking"` answer shimmers as the summary does; answer points cite `sources` with the same
  chips and `tc-cite-open`. New messages fade in (not with reduced motion) and scroll into view within the nearest
  scroll container; each answer is announced politely once written.
- **AI Summary:** `icon`, an `<svg>` or `<img>` element (cloned) in place of the header's sparkle, drawn at its size –
  a persona's logo, say. `badge` renames the “AI-generated” badge (“Rule-based”); an empty string hides it.
- **React:** `AiSummary` takes `onAsk(question)`; return false to keep the question in the box. **Angular:** the
  `AiSummary` directive takes `icon`, `badge`, `ask` and `messages`, and emits `tcAsk` (`tc-ask`).
- **Header Nav:** the bell, the app picker and the avatar each show their name in a tooltip under them on hover (after
  a beat) and keyboard focus – the bell's `heading` (“Notifications”), the picker's `label` (“Apps”) and the avatar's
  `account-label` with the person's name (“Account: Helena Vance”). Hidden while the trigger's popover is open, and
  with Escape until the next hover or focus; on an `inverse` bar they take the dark theme's tooltip colours.
  `tc-notifications` and `tc-app-picker` show theirs standalone too.
- **Header Nav:** the account card's defaults add **Terms and Conditions** (`id: "terms"`) before Sign out. Picking it
  fires `tc-account-select` with `id: "terms"`; open a read-only `tc-terms-dialog` on it (no consents, `canDecline`
  false, `accept-label="Close"`), as the gallery now does.
- **Profile Menu:** a `"terms"` icon (Lucide scroll-text) for `profileMenuIcon`, and `TermsIcon` in React.
- **Select:** `label-placement="start"` (`labelPlacement`, `"top" | "start"`, default `"top"`) puts the visible label
  before the trigger on one line, vertically centred, as a caption (the `--tc-caption-*` tokens), with the list still
  opening under the trigger; `aria-labelledby` is unchanged. It only applies with `label-visible`, which stays off by
  default: without it there's no visible label and the trigger is exactly as before, so removing `label-visible` turns
  the inline label off.
- **Priority List:** `PriorityItem.badgeImage`, a logo URL (through `safeMediaUrl`) shown in the badge column in place
  of a row's code – the code badge's height, contained in the column, with its rounded corners and `alt=""`, the code
  staying as screen-reader text. Missing, unsafe or failing to load (an `error`), the row shows its code badge; a failed
  logo is remembered per row, so it doesn't retry or flicker and the columns don't shift.

## 0.12.0 – Name the momentum column, hide the health word; hidden priority columns keep what's left; a brandless side nav's button at the end

- **Priority List:** `momentum-label` (`momentumLabel`, default “Momentum”) names the momentum column, and is what screen
  readers hear before each row's change – `momentum-label="Trend"` reads “Trend down 5%”.
- **Priority List:** `hide` takes `"health"` too, leaving the health word out from under each name (screen readers still
  hear it); a row with no owner or team then shows its name alone.
- **Priority List:** badge codes up to five letters (“EAPMC”) show whole – the code column is 48px (44px when narrow), up
  from 40px (36px), which clipped them.
- **Priority List:** with `hide`, the columns that remain fold away only when they run out of room themselves. Before,
  they folded at the widths that assumed every column was shown, so a Centres list with coverage, open and work hidden
  lost its momentum and figures in a 450px rail with room to spare. A hidden column counts the width it has where the
  figures fold, so the name never gets less room than it would with every column shown.
- **Side Nav:** without a brand – when the app's header carries it, say – the collapse button keeps to the end of the bar,
  as it does beside a brand, instead of the start; folded into a rail it stays centred.

## 0.11.0 – Results list headings as given; priority lists without some columns; side-nav item spacing

- **Results List:** `plural-kinds="false"` (`pluralKinds`, true by default) shows each group heading exactly as its
  kind, for kinds that are proper names – “NREL” and “Sandia National Laboratories” instead of “NRELs” and
  “Sandia National Laboratorieses”. Left on, headings are put in the plural as before.
- **Priority List:** `hide` leaves built-in columns out – `hide="coverage open work"` as an attribute, or an array of
  `PriorityColumn` (`"momentum" | "coverage" | "open" | "work"`, exported). Hidden columns go from the header and the
  rows, and their grid tracks go too, so no gap is left and the name and figures take the room; the columns that remain
  still fold away as the list narrows.
- **Side Nav:** `--tc-snav-item-gap` sets the space between items (default `--tc-space-0-5`, as today) and
  `--tc-snav-item-height` each item's least height (default `--tc-control-h-md`, as today). The collapsed rail uses
  the same two, with its icons still centred.

## 0.10.0 – A brand for app headers; large side-nav names aren't clipped

- **Header Brand:** `tc-header-brand` (`@adamstavely/trenchcoat/header-brand`, React `HeaderBrand`, Angular
  `HeaderBrand` from `@adamstavely/trenchcoat/angular/header-brand`), the product's logo and name at the start of a
  full-width app header.
  - `name`; `href` makes it a link (through `safeUrl` – an unsafe link leaves plain text); `icon`, an SVG or img
    element cloned before the name; `inverse` draws it in the dark theme's colours on a dark bar, as
    `tc-header-nav inverse` does; and `look`.
  - A click on the link fires a cancelable `tc-navigate` (`{ href }`): prevented, the link isn't followed, so an app's
    router can take it. Clicks with a modifier key are left to the browser.
  - Sized from the page: `--tc-hb-name-size` (default `--tc-font-size-lg`), `--tc-hb-logo-size` (24px),
    `--tc-hb-weight` (semibold), `--tc-hb-gap` (`--tc-space-2`) and `--tc-hb-line-height` (1.1, relative to the
    name's size). The name is never truncated or clipped, and the brand is centred vertically, with a focus ring on
    the link.
- **Side Nav:** the brand's name takes a line height relative to its own size (`--tc-snav-brand-line-height`, 1.2 by
  default) instead of the bar's fixed one, so a large `--tc-snav-brand-size` (48px, say) is no longer clipped top
  and bottom. It still ends in an ellipsis when it's too wide.

## 0.9.0 – A single-choice dropdown

- **Select:** `tc-select` (`@adamstavely/trenchcoat/select`, React `Select`, Angular `Select` from
  `@adamstavely/trenchcoat/angular/select`), a plain single-choice dropdown for a page or card header, or a form.
  - The trigger is a secondary button (the `--tc-action-secondary-*` and `--tc-control-*-md` tokens, so it lines up
    with the buttons beside it) showing the chosen option's label, or `placeholder` (“Choose…”) while `value` is unset or
    unknown, and a chevron. The list under it is the menu pattern: a `listbox` of `option`s with `aria-selected`, a
    check on the chosen one and an optional `description` line; `disabled` options show but can't be picked.
  - `options: SelectOption[]` (`{ value, label, description?, disabled? }`), `value`, `label` (the accessible name –
    shown above the trigger with `label-visible`, else read by screen readers only), `placeholder`, `open`,
    `align="start" | "end"`, `disabled`, `name` (a hidden input for native forms) and `look`.
  - `tc-value-change` (`{ value }`) and `tc-open-change` (`{ open }`) are cancelable: prevented, `value` or `open`
    stays (controlled use). Angular gets a value accessor for `ngModel` and reactive forms.
  - ↓ / ↑ on the trigger open the list; in it the arrows, Home and End move past disabled options, Enter or Space
    picks, letters jump to the next option starting with them, Esc closes and returns focus to the trigger, Tab or a
    click outside closes. Near the edge of the screen the list slides in to stay whole. Option ids come from their
    position, never from their values.

## 0.8.0 – Dialogs that print whole, priority lists that keep their names

- **Dialog:** printed, an open dialog prints whole – no height limit or scrolling, no backdrop, shadow, rounding or
  fixed box – from the top of the first page, with the page behind it hidden. The heading and description print; the
  footer (Close and the actions) doesn't. Before, only the first screenful printed.
- **Priority List:** the name keeps at least 140px from 300px up. The columns fold on the list's own width – the
  open pill now goes at 480px and the momentum's change at 400px, the work count at 560px – and with figures the
  line, work count and open pill go at 760px. Before, at 300–480px the name could shrink to almost nothing.
- **Command Menu:** an app header's ⌘K search over results from a server.
  - `layout="popover"`: a compact field (32 px, 280–420 px wide) with a ⌘K hint that opens the results in a popover
    under it – a combobox and its listbox. Esc or a click outside closes it and keeps the text; Enter runs the active
    row and closes it.
  - `filter="none"`: `groups` show exactly as given, for the page to fill from its API on `tc-query-change`.
  - `loading` shows and announces “Searching…”; `empty-text` (with `{query}`) is what shows when nothing matches; in
    popover layout the results are announced as a count (“5 results”).
  - `assistant="false"` leaves out the “Ask assistant about …” row.
  - `inverse` styles the field for a dark header bar while the popover keeps the page's theme; `label` names the field.

## 0.7.0 – Switches in the account card

- **Profile Menu:** an item with `checked` is an on/off switch – a button with `role="switch"` and `aria-checked`,
  with a small switch (the switch tokens, as on `tc-switch`) at the end of its row. Picking it by click, Enter or
  Space fires `tc-item-select` with `{ id, checked }`, `checked` being its new state; the page sets the item's
  `checked` (controlled). The detail type is exported as `ProfileMenuItemSelect`.
- **Profile Menu:** `"moon"` and `"sun"` built-in icons (Lucide), and `MoonIcon` and `SunIcon` in React.
- **Header Nav:** a switch item in the account card fires `tc-account-select` with `checked` and keeps the card open;
  other actions still close it. React's `onAccountSelect` gets `checked` as a second argument.
- **Tokens:** `--tc-font-sans` now starts with “Inter Variable”, the name `@fontsource-variable/inter` gives the face,
  so apps that self-host Inter that way get it instead of the system font. “Inter” and “InterVariable” still follow.
  Getting Started lists which ways of loading Inter it matches.
- **Side Nav:** `--tc-snav-brand-size`, `--tc-snav-brand-weight` and `--tc-snav-logo-size` size the product's name and
  logo from the page, defaulting to today's look (the bar's font size, semibold, 28px). The logo is capped at the
  rail's inner width, so the collapsed rail still centres it whole.
- **Side Nav:** `--tc-snav-head-gap` – the space between the brand's row and the first item, open or folded into the
  rail. It defaults to `--tc-space-2`, as today, and leaves the space between the bar's other parts alone.
- **Header Nav:** `inverse`, for a header bar that's dark in both themes. The bell, the app picker's button, the
  avatar and the hairline take the dark theme's colours, hover fills and focus ring whatever the page's theme, while
  the account card and the notifications and app picker panels keep the page's theme. The unread badge is ringed in
  `--tc-hn-ring`, like the presence dot, so a page can set it to the bar's colour.

## 0.6.0 – Priority list: columns of the page's own, rows without a tier

- **Priority List:** `figures` – more columns after Work, each `{ id, label, unit? }`, filled from each row's
  `figures` by id; a missing value leaves its cell empty. Values are right-aligned tabular numbers like the work count,
  and screen readers hear each with its column's label (“. 2 Last mo.”). The columns line up with their headings for
  any number of them, and fold away after the work count and before the coverage bar as the element narrows; with
  figures, the work count goes at 600px instead of 520px.
- **Priority List:** `priority` is optional, and `badge` gives a row without one a short code (“CEC”) in a neutral
  badge, read in place of the tier. The badge column widens to fit codes. With `grouped`, those rows come last, under
  no header. A summary of centres can now look just like the priorities list.
- **Priority List:** the narrow layouts' column widths now take effect. They were set on the element, which is its own
  size container and so can't match its own container queries; below 680px the name column could shrink to nothing.
  They're now set on the list's card, and `--tc-prl-cols` lists the columns after the badge.

## 0.5.0 – Org unit card figures, and agent operations: Root Cause Tree, Tool Access Map, Collaboration Stream, Agent Fleet, Approval Gates, Inspect Frame

- **Org Unit Card:** `OrgTeam.figures` – more figures on a team's row, after coverage, gaps and FTE: each an `id`, a
  `value` written as shown ("50%", "—"), a quiet `label` under it ("joint") and an optional `tone` (`"success"`,
  `"warning"`, `"danger"`) that tints the value as a stat's tone does. Like the built-in figures, they hide when the
  card is narrower than 560px. The `OrgFigure` type is exported, from the React entry too.
- **Root Cause Tree** (`tc-root-cause-tree`): a fault tree of hypotheses an agent checks one by one – each says Not
  checked, Checking, Ruled out or Confirmed; OR and AND branches; ruled-out branches mute and the way from the
  confirmed cause up to the failure is drawn link by link. A tree with arrow keys and an evidence panel.
- **Tool Access Map** (`tc-tool-access-map`): one agent with every tool it can reach in a ring – used, failed, running,
  not used yet or no access, in words – each tool's calls with arguments, results and a cancelable `tc-replay`. Takes
  the same call feed as Agent Graph.
- **Collaboration Stream** (`tc-collaboration-stream`): what agents say to each other in a run – from and to on every
  message, handoffs as slim rows, questions for you with an answer box, file previews, details with tool calls,
  filter tabs and an @-composer (`tc-send`).
- **Agent Fleet** (`tc-agent-fleet`): several top-level agents as cards summing up their sub-agents; opening one shows
  its `tc-agent-tree` beside it (below it when narrow).
- **Approval Gates** (`tc-approval-gates`): an agent run's approval requests as a stack – the one to decide on top
  with its diff or arguments and the steps it holds; decisions (`tc-decide`) drop it into the Decided list.
- **Approval Card:** optional `diff` (a small unified diff) and `args` (the call's arguments) in the preview.
- **Agent Inbox:** `view="recap"` with `since` – “While you were away”, a curve of what happened, and Needs you, Failed
  and Done groups; done tasks marked `undoable` get Undo (`tc-undo`).
- **Run Checkpoints:** `branches` and `branch` – a restore starts a new attempt that forks from its checkpoint, and
  earlier attempts stay visible, labelled and inspectable (`tc-branch-change`).
- **Inspect Frame** illustration (`tc-inspect-frame`): any component seen like a selection in a design tool – tilted
  back, a cursor walks its measured rows while a frame, padding guides and a width chip draw round each; finite, and
  still under reduced motion.

## 0.4.1 – Lint fixes for charts

- **`trenchcoat lint`:** a chart's own properties inherited from the chart base – `heading`, `description`, `data`,
  `highlight`, `format`, `unit`, `locale`, `height`, `still`, `easing`, `duration`, `hide-labels`, `hide-tooltip`,
  `bare`, `view`, `labels` – are no longer reported as unknown. They're now in every chart's API docs too.
- **`trenchcoat lint`:** `="false"` on a boolean that's on by default (`sort` and `list` on `tc-segmented-bar`,
  `reviewable` on `tc-guardrail-notice`) is no longer a `boolean-attribute` error: those read "false" as off.

## 0.4.0 – Dialog sizes, choice cards that wrap, textareas in the stepper

- **Dialog:** `size` – `"sm"` (480px), `"md"` (640px, the default and today's width), `"lg"` (880px) or `"xl"`
  (1120px), never past 90% of the window. sm and md fit their content up to that width; lg and xl always take it, for
  reports with tables. The widths are tokens a page can override: `--tc-dialog-w-sm` … `--tc-dialog-w-xl`.
- **Stepper choices:** the cards share a row only while each is at least `--tc-sf-choice-min` (168px) wide; more
  wrap onto further rows instead of turning into slivers.
- **Stepper input:** a `<textarea>` inside is styled and wired like an `<input>` – the field's border, focus ring and
  invalid state, its id and description – starts at its `rows` and resizes vertically.
- **Image Grid:** a download still fetching its image when the grid leaves the page now lets go of the image's object
  URL and saves nothing, instead of starting the download from a page that has moved on.

## 0.3.0 – Angular: one entry point per element

- **Angular:** every directive has its own entry point, `@adamstavely/trenchcoat/angular/<name>` (typed by
  `dist/angular/<name>.d.ts`): `import { SideNav } from "@adamstavely/trenchcoat/angular/side-nav"` loads that
  element only, so an element used on a lazy route stays in that route's chunk. Through the index
  (`@adamstavely/trenchcoat/angular`, still exported, with `TRENCHCOAT`), a bundler with lazy routes can hoist every
  element imported that way into the initial bundle. The docs, `trenchcoat info` and `trenchcoat init` now show the
  per-element import; `check:angular` compiles against one and checks, with an esbuild code-splitting build, that a
  lazy chunk's elements stay out of the initial chunks.

## 0.2.1 – Side Nav: the brand routes too

- **Side Nav:** a plain click on the linked brand (`brand-href`) fires the cancelable `tc-navigate` as the items do,
  with `{ id: "brand", href, item, brand: true }` (`SIDE_NAV_BRAND_ID`), so a single-page app can route it instead of
  reloading. ⌘/Ctrl-, Shift- and middle clicks stay with the browser; `current` doesn't change.

## 0.2.0 – Side Nav

- **Side Nav** (`tc-side-nav`): an app's main navigation down the side – the brand at the top, places with icons,
  badges and section captions, one of them the current page (`aria-current="page"`), and the page's own children
  at the bottom. Items with `href` are real links; a plain click fires a cancelable `tc-navigate` ({ id, href, item })
  for a router, and ⌘/Ctrl- or Shift-clicks are left to the browser. `collapsible` folds it into an icon-only rail
  (`collapsed`, cancelable `tc-collapsed-change`). React `SideNav`, Angular `SideNav`.

## Unreleased – Charts: Rose, Hexbin, Network Graph and Small Multiples

- **Rose Chart:** a polar area (Nightingale rose) chart – equal-angle wedges whose area shows each value, the largest
  emphasised; stacked by `series` with a legend; `start-angle` and `inner-radius`; round-value rings on chips.
- **Hexbin Chart:** many x–y points gathered into hexagons shaded by `aggregate` – count, or the sum or mean of a
  `value` – with a ramp legend and the densest ringed; the hexagons grow on large data so 50,000 points stay in SVG.
- **Network Graph:** any nodes and links laid out by a deterministic force simulation – same data, same picture; a
  change glides from the last layout. Groups take their own inks with a legend, the most-linked are named, a node's
  neighbourhood lights on hover or focus, `drag-nodes` lets the pointer pin nodes, and links move to a canvas past
  `canvas-threshold` nodes. Nodes can come from link rows alone, so specs can draw it.
- **Small Multiples:** one chart from a spec repeated in a grid, a panel per value of `facet`, on a shared scale
  (`shared="y"` for Line, Area and Bar), with one legend, pointing linked across the panels, `sort` and columns that
  fit the width.
- **Bar Chart:** `yDomain`, a fixed value range, as Line and Area have.
- **Chart base:** `linkActive(key)` lights a mark from outside without a tooltip or event – what Small Multiples uses.
- **`tc-chart`, the CLI and MCP tools:** 39 chart types (`rose`, `hexbin`, `network`); `suggestCharts` proposes a
  hexbin for thousands of points, a rose for a 7-, 12- or 24-step cycle and a network graph for looping links.

## Unreleased – Charts: Histogram, Combo Chart, Venn Diagram, trend lines and bands

Charts the library still lacked after the ztd-charts port – not from ztd.

- **Histogram:** raw numbers binned into touching bars on round edges (Freedman–Diaconis by default, or `bins` /
  `bin-width`), the tallest bin emphasised; `cumulative`, a `density` curve, and `markers` for the mean and median.
- **Combo Chart:** bars and lines over one x – grouped or `stacked` bars, lines with dots – with the lines on a second
  axis at the right when their range is far from the bars' (`line-axis` to choose); the legend tells bars from lines
  and names each one's axis.
- **Venn Diagram:** how two or three sets overlap, circle areas proportional to the sets and overlaps as close as they
  can be; each region's count on a chip, every region a keyboard stop; with more sets, the three largest are drawn.
- **Bubble Chart:** `trend="linear"` fits a least-squares line with its r², `trend-band` shades its 95% confidence
  band, and `trend="smooth"` draws a LOESS curve.
- **Line Chart and Area Chart:** `lower` and `upper` shade a band round each line – a forecast range or an
  uncertainty – read with each value.
- **`tc-chart`, the CLI and MCP tools:** 36 chart types (`histogram`, `combo`, `venn`); `suggestCharts` proposes a
  histogram for one measure with no groups, and a combo chart for two measures on very different scales.

## Unreleased – Charts, part 6: what ztd-charts' versions added to ours

The last part of the ztd-charts port (`audit/ztd-charts-port-plan.md`): Trenchcoat kept its own Gauge, Heatmap, Radar
Chart and Sparkline, and gains what ztd-charts' versions of them did.

- **Radar Chart:** `levels` (how many rings `grid="web"` draws) and `grid="circle"` for round rings; shapes grow from
  the centre on screen and glide when the data changes; `still` and `replay()`, as the other charts have.
- **Gauge:** `variant="ticks"` – a ring of marks lit up to the value, `ticks` for how many; a new value lights or dims
  them one after another.
- **Heatmap:** `legendLabels` – words at the legend's ends ("Fewer", "More"); a canvas for big matrices above
  `canvas-threshold` cells, with the keyboard, tooltip, selection and table view unchanged.
- **Sparkline:** `show-value` writes the last value after the line, still fitting the text it sits in.

## Unreleased – Charts, part 5: specs, server rendering and agents

Part 5 of the ztd-charts port (`audit/ztd-charts-port-plan.md`).

- **Chart** (`tc-chart`): any chart from a JSON spec – `{ type, data, encoding, options, title, description }` – checked
  first, what's wrong shown instead of a chart, only declared properties set. ztd-charts' specs draw as they are, and
  specs also draw Gauge, Heatmap, Radar Chart and Sparkline, their rows reshaped into those elements' properties.
- **`trenchcoat/charts`:** the chart types, `validateSpec`, `specToElement`, `resolveSpecData` (`{ url }` and CSV),
  `suggestCharts`, and `renderChartToSVG` – a standalone SVG without a browser, the tokens resolved for a look and theme.
- **CLI:** `trenchcoat chart types | validate | render | suggest`.
- **MCP server:** `list_chart_types`, `validate_chart_spec`, `render_chart` (inline data only) and `suggest_charts`.
- The charts' shared sheets register in one place (`chartSheets`), so the server renderer can collect them.

## Unreleased – Charts, part 4: distribution and time

Part 4 of the ztd-charts port (`audit/ztd-charts-port-plan.md`).

- **Beeswarm Chart** (`tc-beeswarm-chart`) and **Bubble Chart** (`tc-bubble-chart`): every point drawn, switching to a
  canvas for thousands of them.
- **Calendar Heatmap** (`tc-calendar-heatmap`): a value per day on a grid of weeks, years stacked.
- **Parallel Chart** (`tc-parallel-chart`): parallel coordinates, a canvas for many rows.
- **Box Plot** (`tc-box-plot`) and **Ridgeline Chart** (`tc-ridgeline-chart`): spreads within groups – boxes, violins
  and density ridges.
- **Candlestick Chart** (`tc-candlestick-chart`): open, high, low and close per period, hollow when rising, with moving
  averages, volume, and a range to pick or zoom into (`brush`).
- **Stream Graph** (`tc-stream-graph`): series flowing round a moving centre line.
- **Radial Bar Chart** (`tc-radial-bar-chart`): a few ratios as rings towards their targets.

## Unreleased – Charts, part 3: part-to-whole and flow

Part 3 of the ztd-charts port (`audit/ztd-charts-port-plan.md`).

- **Waffle Chart** (`tc-waffle-chart`): shares as a grid of 100 cells, one emphasised with its share written large.
- **Funnel Chart** (`tc-funnel-chart`): what's left at each step, with each step's rate and the biggest drop.
- **Marimekko Chart** (`tc-marimekko-chart`): columns as wide as their share, each stacked to 100%.
- **Treemap** (`tc-treemap`): nested tiles sized by value, names on card-coloured chips.
- **Sunburst Chart** (`tc-sunburst-chart`): a hierarchy as rings, the largest leaf's path emphasised.
- **Sankey Chart** (`tc-sankey-chart`): flows between stages as bands as wide as their value.
- **Chord Chart** (`tc-chord-chart`): what groups exchange, as arcs and ribbons.

## Unreleased – Charts, part 2: comparison

Part 2 of the ztd-charts port (`audit/ztd-charts-port-plan.md`): eight comparison charts, and more for every chart.

- **Lollipop Chart** (`tc-lollipop-chart`): one value per item as a stem and dot, from the largest.
- **Dumbbell Chart** (`tc-dumbbell-chart`): two values per item – before and after – as a hollow and a solid dot.
- **Slope Chart** (`tc-slope-chart`): how each item changed between two moments.
- **Bump Chart** (`tc-bump-chart`): how ranks change step to step.
- **Bullet Chart** (`tc-bullet-chart`): measures against targets and ranges, with quiet or status-tinted bands.
- **Segmented Bar** (`tc-segmented-bar`): shares of one whole as a single bar, with a list.
- **Waterfall Chart** (`tc-waterfall-chart`): steps up and down from a start to an end, with totals.
- **Pareto Chart** (`tc-pareto-chart`): bars from the largest with the running share and a threshold.
- **Line and Area Chart:** `brush="select"` picks a range by dragging (or Shift+arrows and Enter) and shows its change
  with its high and low; `brush="zoom"` narrows the chart to it, with Show all to undo; `tc-brush` reports the range.
- **Every chart:** `replay()` plays the entrance again; "Share" is renameable through `labels`; a canvas underlay for
  charts with thousands of marks.

## Unreleased – Charts, ported from ztd-charts

The first part of porting [ztd-charts](https://github.com/Junhan2/ztd-charts) (MIT) to Lit
(`audit/ztd-charts-port-plan.md`): its framework-free engine and five charts, in a new **Charts** section of the
gallery.

- **Chart engine** (`internal/chart/`): scales, layouts, data parsing, text measuring and ztd's spring motion engine,
  translated to English; a chart base that measures its plot, plays the entrance once on screen, glides on data
  changes, and gives every chart the same card, keyboard model, tooltip, announcements and table view. Charts paint
  with the chart tokens through overridable `--tc-plot-*` component tokens: one accent against quiet ink for emphasis,
  `--tc-chart-1…6` for categories.
- **Bar Chart** (`tc-bar-chart`): grouped, stacked or 100% bars, upright or lying down, the highest emphasised.
- **Line Chart** (`tc-line-chart`): lines over time, one emphasised against quiet others or each in its own ink, with
  end labels, reference lines and the nearest point read across every series.
- **Area Chart** (`tc-area-chart`): stacked, 100% or overlapping areas over time.
- **Pie Chart** (`tc-pie-chart`) and **Donut Chart** (`tc-donut-chart`): shares of a whole; the donut holds the total
  and a legend of every share.
- `THIRD-PARTY-NOTICES.md` carries ztd-charts' licence and ships in the package.

## Unreleased – PR Link, Breakpoint Overlay, Soup Cans and design system screens

- **PR Link** (`tc-pr-link`): a pull request named in running text – its state's mark and owner/repo#number · title as
  a link, with a card of its state, repository, time, author, lines added and removed, and files changed on hover or
  focus; `compact` for just #number. The card is a tooltip the link is described by.
- **Breakpoint Overlay** (`tc-breakpoint-overlay`): which breakpoint the page is at – a corner badge that opens a scale
  and list of every breakpoint with its range and media query, and a ruler across the window; ⌥⇧O to open it. It
  follows the window or a `target` element. Loupe now shares its breakpoint helpers.
- **Soup Cans** (`tc-soup-cans`): three unlabeled tins standing at different heights, for things not yet labelled or
  sorted.
- **Screens:** Design System Home, Design System Component, Design System Illustrations and Design System Releases – a
  design system's site built from the library, its stage and spot illustrations. Spot illustrations can be imported
  as URLs from `trenchcoat/illustrations/spot/…` in the gallery and the screens.
- **Hotkeys** match the physical key too, so Option combinations work on a Mac (⌥⇧O types "Ø" but is still KeyO).

## Unreleased – Workflow stage illustrations

- **Illustrations:** In Translation, In Quality Control, In Coordination, Pending Release and Released – the workflow
  stages beside Awaiting Review, drawn the same way: a document with a pastel badge, each stage in its own colour, its
  words as real text, and a short motion that rests.

## Unreleased – Compass rose

- **Compass rose** (`illustrations/spot/site/compass-rose.svg`): the homepage hero illustration, a step up from the
  other spots – a raised medallion with a compass rose, an ink north point and a dotted route around it – in the same
  one-blue family. The rose settles into place once, and holds still under reduced motion.

## Unreleased – Spot illustrations

- **Spot illustrations** (`illustrations/spot/`): 224 small illustrations for page headers, cards, empty states and
  docs, in the soft style with one blue mark – foundations, guidelines, patterns, design principles, the 30 Laws of UX,
  research, AI, tools, admin and site topics. Each is one self-contained SVG: light colours as plain attributes for
  design tools, and a scoped style that adds dark, following the OS as an image and the page's theme when inlined.
  Shipped in the package as `trenchcoat/illustrations/spot/<folder>/<name>.svg`, indexed in its README, and browsable
  with search under Foundations → Spot illustrations.

## Unreleased – Message Status, Collection Card and Preview Card

- **Message Status** (`tc-message-status`): the quiet row under a sent message – a read receipt (sending, sent,
  delivered, read, or Not sent with Retry), a relative time that keeps itself fresh, and Copy, Send again, Branch into
  a new chat and Edit, with cancelable `tc-retry`, `tc-branch` and `tc-edit`.
- **Collection Card** (`tc-collection-card`): a card that introduces a collection and links into it – up to three
  previews, the title with its counts, a bold line, a description, the item names that fit in two lines, and Browse →.
- **Preview Card** (`tc-preview-card`): a gallery tile – a picture or a live component scaled down from its design
  width, a one-line title and a two-line description, a badge, a horizontal form and a loading skeleton.

## Unreleased – Atomic Design illustration

- **Atomic Design** (`tc-atomic-design`, `AtomicDesign`): atomic design one stage at a time, picked by `stage` – the
  five stages from abstract to concrete, then atoms (label, input, button), a molecule (a search form), an organism (a
  site header), a template (the layout in placeholders) and a page (the layout with its content). The same parts carry
  from stage to stage; the words come from `labels`, and its name is a sentence for the stage.

## Unreleased – Accessibility Principles illustration

- **Accessibility Principles** (`tc-accessibility-principles`, `AccessibilityPrinciples`): the four kinds of need
  accessibility serves – visual, hearing, motor and cognitive – above the four principles that serve them, with a
  connector from each principle to its needs. Drawn like the other illustrations, in a 4 : 3 frame so the words fit;
  the words come from `labels`, and its name is a sentence saying which principle serves which need.

## Unreleased – Selection Toolbar

- **Selection Toolbar** (`tc-selection-toolbar`): the formatting bar that floats over selected text – quick actions,
  toggles that show what's on, menus for text style, colour and list type, and a link. It fires `tc-command` for the
  page's editor to apply; `selectionRect()` gives it an anchor, and `focusToolbar()` is for the editor's Alt + F10.
- **Malware Blocked** is redrawn in the style of the other state illustrations (Something Wrong, No Access, Nothing
  Found): a soft page tile, a pastel shield with a darker edge and ink, chunkier strokes and a soft glow beneath.
- **Content Hidden** is redrawn for sensitive content: a photo pixelated to a person's outline with the family's warning
  sign on it, in the same style; its default caption is now Sensitive content.
- **Illustrations:** Offline, Limit Reached, Preview Unavailable, Upload Failed, Link Expired, Awaiting Review, All Done and Processing,
  in the same style as the other state illustrations, each with its words as real text.

## Unreleased – Review fixes for workspace components

- **Security:** links from data go through `safeUrl` before Process List, Preview Frame and Pull Request render or emit them,
  and the docs open them with `noopener`; models can no longer set the Terminal's `masked` prompt.
- **React:** the wrappers of elements that hold the page's children (Panel Card, Dialog, Tool Call Card, Preview Frame)
  ignore change events bubbling up from those children, so a Change List inside a Panel Card no longer folds the card. Console Clear and Preview Frame navigation survive re-renders; Search Results owns `query` and
  `replacement` (new `tc-replacement-change`).
- **Keyboard and focus:** unique row keys in Problem List, tab stops kept by item rather than position, focus kept after
  Clear, Archive and Re-run, long trees and lists keep a tab stop after scrolling, Icon Rail's More menu follows the
  menu-button pattern, Enter during IME composition no longer runs a command.
- **Correct results:** Branch Switcher offers "Create" for names like `login` beside `feature/login` and only suggests names
  git accepts; Search Results selects each match on a line (`column`) and whole-word matches around symbols; File Tree
  opens folders whose name matches the filter; Element Inspector hides stale details; Diff Viewer counts lines exactly;
  Web Vitals accepts any case of ids; the Voice Orb and number fields shrug off non-numeric values.
- **Words:** Pull Request, Session List and Branch Switcher text comes from `labels` and `locale`, with the year on older dates.

## Unreleased – Production readiness fixes

- **Generative UI:** browser-normalized URLs are checked against allowed origins. HAL Form is application-owned and excluded from model-generated tools and component blocks.
- **Search Results:** arbitrary regexes no longer execute during rendering; search providers supply `ranges` for regex highlights and replacement previews.
- **Web Vitals:** default timing thresholds follow the selected milliseconds/seconds unit.
- **Preview Frame:** address navigation is retained per tab and follows application updates.
- **Process List:** dynamic controls retain a keyboard entry point. **Branch Switcher:** distinct branch names retain distinct accessible option IDs.

## Unreleased – Workspace & sessions

- **Components:** Panel Card, Icon Rail, Meter Row, Environment List, Change List, Check Status, Terminal, Diff Viewer, File Tree, Search Results,
  Problem List, Pull Request, Branch Switcher, Session List, Preview Frame and Process List.
- **Web development:** Console Panel, Network Log, Element Inspector, Web Vitals and Route Map, for looking inside the page a
  session is building.
- **Block:** Session Panel, a working session's side panel built from them.
- **Voice Orb:** `variant` adds ring, wave, bars, blob and orbit faces; Voice Mode takes them as `orb-variant`.
- **Fixed:** the blob variant's edge lurched when the level changed; it now moves at a steady pace.

## Unreleased – Tools

- **CLI** (`trenchcoat`): `list`, `info`, `add` and `init`, from a registry built with the package.
- **Linter** (`trenchcoat lint`): checks a project's use of elements, attributes, events, imports and tokens against the package's API.
- **MCP server** (`trenchcoat-mcp`): `search_components`, `get_component`, `get_usage` and `lint_code`, read-only.
- **Fixed:** the Angular example gave its combobox a `heading` it doesn't have; it's now `label`. The linter found this.
- **`trenchcoat/headless`** and **`trenchcoat/testing`**: behaviour without markup, and helpers for testing apps.

## Unreleased – File protection, workflows and motion

- **Components:** Content Shield, Legal Hold Manager, Sensitivity Label Picker, Scan Status, Bulk Action Bar, Approval Chain,
  Redaction Review and Share Link Manager.
- **Motion:** Status Morph, Number Change, Progress Bar, Staggered Reveal, Drag Lift and Shared Element.

## Unreleased – Deeper agent views

- **Conflict Radar** can settle conflicts: each agent's approach, a Keep choice, and `mergeable` with Merge once everything's
  settled. It also has a legend.
- **Scheduled Runs** defaults to a calendar with Auto and Manual, a Now line, drag and % of the limit. `layout="cards"` keeps
  the old look, and `task` in `tc-placements-change` can now be null.
- **Agent Handoff** has `view="pipeline"` with queues between agents, plus model, cost and activity on each step.
- **Agent Findings** has overall progress, severity totals, a `critical` severity, per-agent counts, locations, relative time
  and `layout="stacked"`.

## Unreleased – Six more agent views

- **Conflict Radar** (`tc-conflict-radar`), **Scheduled Runs** (`tc-scheduled-runs`), **Fallback Chain** (`tc-fallback-chain`),
  **Agent Handoff** (`tc-agent-handoff`), **Agent Findings** (`tc-agent-findings`) and **Agent Monitor** (`tc-agent-monitor`):
  where parallel agents collide, tasks across a week's sessions, one request finding a model, what's lost between agents,
  what a group of agents found, and one agent at work.

## Unreleased – Content Hidden, Malware Blocked and First Use

- **Content Hidden** (`tc-content-hidden`), **Malware Blocked** (`tc-malware-blocked`) and **First Use** (`tc-first-use`) –
  illustrations with their words as real text, for objectionable content on an overlay, a file that can't be shown, and
  a new workspace.

## Unreleased – Donovan scenes and neutral marks

- **Agent Scene** (`tc-agent-scene`) – the assistant in a small scene for all clear, working and offline.
- **Lead Sourcing** and **Enrichment Orbit** take `neutral`, which draws plain marks in place of third-party logos.
- **Fixed:** `tc-agent-face` drew nothing from the built package, because the build dropped the vendored face.

## Unreleased – Sharing and search screens

- **Sharing & Access** – a screen with team flags, access reviews and the audit trail.
- **Search Results** – a screen with search, filters, results and Nothing Found.

## Unreleased – Case review

- **Case Review** (`tc-case-review`) – a block for one case: evidence, a timeline, the assistant's labelled suggestion, and
  a decision that needs a written reason. Nothing is chosen for you.
- **Case File** – a screen with Case Review, Donovan and the case's file.

## Unreleased – Reviewing access and the record

- **Access Review** (`tc-access-review`) – a block for periodic reviews of who can see what: keep or remove each one,
  with a written reason for keeping anyone flagged.
- **Audit Trail** (`tc-audit-trail`) – a block showing who did what and when, with search, a filter by outcome and a CSV
  export that keeps spreadsheet formulas from running.

## Unreleased – Motion for state changes

- **List Motion** (`tc-list-motion`) – rows glide when reordered, added or removed. Team Flag Editor now uses it.
- **Collapse** (`tc-collapse`), **Success Check** (`tc-success-check`) and **Attention Pulse** (`tc-attention-pulse`) –
  opening and shutting, a one-time tick, and a one-time ring to draw the eye.

## Unreleased – File details and states

- **File Details** (`tc-file-details`) – a block with one file's details, the team's flag, a summary, its versions and
  entitlement-checked sharing.
- **No Access** (`tc-no-access`), **Nothing Found** (`tc-nothing-found`) and **Something Wrong** (`tc-something-wrong`) –
  illustrations for the states people reach when a page can't show what they wanted.

## Unreleased – Sharing

- **Share Panel** (`tc-share-panel`) – shares with people and groups at a level for each, after checking each one's
  entitlement. Anyone not authorized is flagged, the person sharing is told, and they're left out; a failed check counts
  as not authorized.

## Unreleased – Team flags

- **Team Flag Editor** (`tc-team-flag-editor`) – where a team sets each flag's colour, name, meaning and order, and asks
  first before removing a flag that's on files. `readonly` shows the flags to people who can't change them.
- **Team Flag Picker** (`tc-team-flag-picker`) – picks one of those flags for a file, with what each one means in the
  list, and says when a file's flag has since been removed.

## Unreleased – Donovan's face

- **Agent Face** (`tc-agent-face`) – Donovan's animated face: idle, listening, thinking, speaking, happy, confused,
  sleeping, error and surprised, blending on springs, with floating white hands, blinks, glances and `playGesture` for a wave, nod, hop or spin. It
  wraps `<agent-face>` from `agent-face/`, stops drawing when off screen, and rests when it isn't busy.

## Unreleased – a form the server describes

- **HAL Form** (`tc-hal-form`) – give it a HAL-FORMS document (`resource`) or its URL (`src`) and it draws the template
  as controls: every `type`, `options` inline or from `options.link` (JSON or CSV), `selectedValues`, `minItems` and
  `maxItems`. It checks `required`, `regex`, lengths, ranges and steps when a field is left and on submit, then sends to
  `_htarget`, `target`, the `self` link or `src`, as JSON, form encoding or a query string. `fetcher` adds auth,
  cancelable `tc-submit` hands the request to the app, and `errors` shows the server's messages on fields.

## Unreleased – a chat minimap

- **Chat Minimap** (`tc-chat-minimap`) – a slim rail beside a long chat with a tick for each message the person sent,
  longer for longer messages, and the one in view lit. Pointing at a tick (or moving to it with the arrow keys) shows
  the message and where it falls; a click or Enter scrolls the chat back to it, holding still while the jump scrolls.
  It follows the chat's scroller by itself, or the page drives `current` with `manual`; cancelable `tc-jump` and
  `tc-current-change`.

## Unreleased – a radar chart and a year list

- **Radar Chart** (`tc-radar-chart`) – a few measures on axes round a centre, joined into a shape: one series with its
  value over each axis's name, or up to three compared in their own colours with a legend. A cross of axes or a web of
  rings (`grid="web"`), scaled to the largest value, 100 for “%”, or `max`; read as its numbers, with a Table view.
- **Year List** (`tc-year-list`) – years to choose one from, newest first, as a column or a row that scrolls: a
  `listbox` with one tab stop, keys that move without choosing, Enter or Space to choose, typing a year to jump to it,
  an optional count on each year and a cancelable `tc-selected-change`.

## Unreleased – inline details for entities and identifiers, three inputs and three charts

- **Entity Details** (`tc-entity-details`) – emails, phone numbers, links and @handles in text are found and marked;
  hover, focus or right-click opens a card with Copy, Write email / Call / Open and what your `resolve` (or a
  `tc-entity-lookup` listener) knows. **Identifier Details** (`tc-identifier-details`) does the same for DOIs, IP
  addresses (private and reserved ranges named), file hashes, CVE ids and tracking numbers.
- **Tree Select** (`tc-tree-select`) – one or many from a nested hierarchy, with filtering that keeps parents, ARIA tree
  keys and cascading parent checkboxes; a form control.
- **Breadcrumbs** (`tc-breadcrumbs`) – a trail whose middle folds into "…" when it doesn't fit, with a cancelable
  `tc-navigate` and Copy path.
- **Tag Input** (`tc-tag-input`) – free-text chips with suggestions, paste, limits, de-duplication and validation; a form
  control.
- **Sparkline** (`tc-sparkline`), **Heatmap** (`tc-heatmap`) and **Gauge** (`tc-gauge`) – an inline trend, a shaded
  matrix with legend, selection and table view, and a value against its bands as a dial, half dial or bar (optionally a
  slider).

## Unreleased – search results, research planning, and people

- **Search**
  - **Results List** (`tc-results-list`) – results with the query's words marked in their snippets, grouped by kind
    with counts, Relevance / Date, “Did you mean” and Show more.
  - **Facet Sidebar** (`tc-facet-sidebar`) – checkbox, radio, range and date filters with counts, active filters as
    chips with Clear all.
  - **Saved Search Alerts** (`tc-saved-search-alerts`) – saved searches that report new matches, with frequency,
    channels, pause, Run now and remove with Undo.
- **Research & portfolio**
  - **Roadmap Timeline** (`tc-roadmap-timeline`) – Gantt-style lanes with progress, milestones, Today and
    dependency arrows, at week, month or quarter scale.
  - **Prioritisation Matrix** (`tc-prioritisation-matrix`) – value against effort, points dragged or moved with
    the arrow keys, listed by quadrant.
  - **Risk Register** (`tc-risk-register`) – a 5 × 5 likelihood × impact grid beside a sortable, rescorable register.
  - **Bibliography** (`tc-bibliography`) – references in APA, MLA, Chicago, Harvard or IEEE, with Copy and BibTeX /
    RIS export.
- **People & profiles**
  - **Org Chart** (`tc-org-chart`) – reporting lines that fold, search that opens the way, pan and zoom, an outline
    when narrow.
  - **Person Hovercard** (`tc-person-hovercard`) – the profile card behind any name, with status and local time.
  - **Team Roster** (`tc-team-roster`) – a directory with everyone's local time and the team's best hour to meet.
  - **Relationship Graph** (`tc-relationship-graph`) – people and organisations around one of them, re-centring on
    click, with a keyboard list of every connection.
## Unreleased – a to-do list

- **To-do List** (`tc-todo-list`) – add a to-do (Enter), tick it off, click its words to edit them, move it with
  Alt + ↑ / ↓, remove it with Undo; All / To do / Done tabs with counts, a done bar and Clear done. One cancelable
  `tc-items-change` carries the whole next list and what changed, so a page can keep it in its own store.
## Unreleased – Loupe, a design-system inspector

- **Loupe** (`tc-loupe`) – remade from cautious-lamp's LoupeTool. ⌘⇧L outlines the page's components
  (`data-ds-component` and the library's own elements) with a card of name, path, size, look and docs / source /
  design links; a ruler marks the breakpoints and the window's width; flex and grid containers are outlined and listed.
  Unlike the original, the page keeps scrolling and working underneath, outlines follow scrolling, resizing and DOM
  changes (no polling), the overlay sits in the top layer so transformed or contained ancestors can't shift it, and
  everything is reachable from keyboard lists in the panel. Kept out of generative UI.
## Unreleased – a JSON viewer for review

- **JSON Viewer** (`tc-json-viewer`) – a JSON document laid out for someone to check: Document reads it like a form
  (keys in plain words, nested objects as sections, lists of like objects as tables, links, dates and yes/no drawn as
  what they are) and Raw is the pretty-printed JSON with line numbers; `layout="split"` shows them side by side, each
  field linked to its lines. Search marks and counts matches in every view; reviewers flag fields with notes
  (`tc-flags-change`); Copy and Download hand over the JSON – `source` as written, so integers too big to hold exactly
  (which are marked) keep their digits. `source` text that isn't valid JSON shows where it breaks. With `modal`, it's
  a dialog opened by `open`.
## Unreleased – fixes from a review of the newest components

- **Text to Speech** – when another reader (or the page) cancels the browser's shared speech queue, it pauses instead
  of showing "Reading" with nothing spoken; `lang` reflects to the attribute, as HTMLElement's does.
- **Access Request** – sending, cancelling and Request again keep focus (on what replaced the button); when the page
  controls `status`, the sent time, announcements and validation reset still happen; `level` and `duration` change
  through cancelable `tc-level-change` / `tc-duration-change`, and the React wrapper controls them
  (`onAccessDurationChange` – `onDurationChange` is a React media prop).
- **Score Survey** – a comment typed for a score whose follow-up question has gone isn't sent.
- **Colour Picker** – in CMYK with alpha, changing only the opacity keeps the colour exactly.
- **Speed Reader** – a listener that keeps the place pauses the reading instead of leaving it stuck on Pause.
- **Score Summary** – NPS and CSAT are worked out from the counts and rounded once: a balanced split is 0, not −1.
- **Geo Location** – a copy the browser refused no longer says Copied.

## Unreleased – fixes: redaction, release gates, deletion scopes and configuration panels

- **Conversation Annotation** – a redaction its message no longer matches blocks Send, says why, and the export blanks
  its quote wherever it still appears, so unmasked text is never sent. Redacted text is now absent from the whole
  page: a label over it quotes it as █, and so do the selection hint, the correction editor and its word diff.
- **Configuration Release Control** – the gate is checked again while the confirmation is open and at Confirm. If it
  fails (an approval withdrawn, a hold, a rollback that no longer applies), Confirm is disabled and the dialog says why.
- **Data Handling Policy** – Request deletion picks the first scope it can delete and never an unavailable one; Confirm
  refuses an unavailable scope and is disabled with the reason, including when the scope changes while open.
- **Form reset in twelve configuration panels** (Model Settings, Conversation Annotation, Data Handling Policy,
  Evaluation Dataset Editor, Gate Config, Instruction Editor, MCP Connection Manager, Output Schema Builder, Provider
  Connection, Retrieval Settings, Tool Configuration, Trigger Builder) – the baseline is taken on the first update,
  after React has set its props, not on connect. A reset fires the cancelable `tc-value-change`, so controlled
  wrappers hear about it (`field` is `null` in Data Handling Policy, `change.type` is `"reset"` in MCP Connection Manager).
- **MCP Connection Manager** – an app that answers inside its `tc-connect` listener no longer leaves the server
  stuck on Connecting….
- **Tool Configuration** – `__proto__`, `constructor` and `prototype` are refused as parameter names with a message,
  and if one gets through it stays an ordinary key in the schema and the example call.
- **Number Field** and **Slider Field** – clearing an optional field sets the value to `null` and submits nothing.
  A cleared required field is invalid.

## Unreleased – a UI kit for Adobe XD

- **`xd-kit/`** – an Adobe XD plugin that draws every component (Standard and Clean, light and dark) into an XD
  document as layered, named groups on one artboard per category, and adds the colour tokens and type scale to
  Assets. The drawings are read from the rendered components (`node xd-kit/extract.mjs`), so the kit follows the
  code; `npm run xd-kit` extracts, tests and packs `xd-kit/dist/trenchcoat-ui-kit.xdx`. XD's plugin API can't create
  components, so each group is one ⌘K away from becoming one.

## Unreleased – coordinates in text, and a sharper search family

- **Coordinate Details** (`tc-coordinate-details`) – the geospatial partner to ISBN Details. Coordinates in a passage
  (decimal, hemisphere-lettered or DMS) are found, range-checked and marked; hovering, focusing or right-clicking one
  opens a card with the place (from your `resolve` or a `tc-coordinate-lookup` listener), decimal and DMS with Copy,
  "Open in" mapping links and a map that loads only when asked. `trigger` picks hover, right-click or both.
- **AI Search** – suggestions take a `hint`, pick out what's typed, show ↵ on the highlighted one and the move / search
  / close keys beneath; Send appears once there's something to send.
- **Search History** – each search leads with an icon for how it ran (AI mode, builder, search), its scopes, results
  and time read as one line, and a row's actions show on hover or focus (a saved search keeps its star).
- **Query Builder** – the AND / OR switch is set in the UI font, the "Where / and / or" words show down to 500 px, and
  the date picker's button is quieter. **Routine Form**'s time picker button matches.

## Unreleased – colour picker, NPS / CSAT, coordinates, access requests, reading aloud

- `tc-color-picker` – a saturation and brightness square, hue and opacity sliders, HEX / RGB / CMYK fields, an
  eyedropper where the browser has one (`EyeDropper`), swatches and Copy. A form control, so Angular gets a
  ValueAccessor. CMYK is a plain device-independent conversion, not an ICC print profile.
- `tc-score-survey` – the NPS (0–10) or CSAT (1–5) question with a follow-up per band, Submit and a thank-you.
- `tc-score-summary` – NPS or CSAT results: the score, change and trend, target, bands and a bar per score.
- `tc-geo-location` – coordinates in decimal or DMS, Copy, Open in Google Maps, Apple Maps, OpenStreetMap, Bing or
  your own `providers`, and an OpenStreetMap embed that loads nothing until Show map. Generative UI can't set `embed`
  or `embedSrc`, so a generated map always waits for the click.
- `tc-access-request` – ask for access to one piece of data: level, duration, justification, fields; then pending,
  approved, denied or expired.
- `tc-text-to-speech` – reads a passage aloud with the browser's voices, marking the sentence and word.
- `tc-speed-reader` – RSVP speed reading at 100–1000 words a minute with the recognition point on a guide mark.
- The standalone gallery is rebuilt (#30).

## Unreleased – blocks as elements, routines, a calendar of calendars

### Blocks are Lit elements

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`,
  `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`,
  `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`,
  `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular
  (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
- Each `blocks/<slug>.tsx` is now a thin React wrapper that keeps its exports, props and types. Its `ref` is the
  `tc-<slug>` element, and with no `look` and no `LookProvider` a block is Standard, like every element (the React
  blocks read the page's `data-tc-look`).
- Every block has both looks; client-context, metrics-dashboard and task-board gain a Clean look.
- Renamed exports where names clashed in the barrel: ai-workspace's `ChatMessage`, `Conversation` and `Project` are
  `AiWorkspaceMessage`, `AiWorkspaceConversation` and `AiWorkspaceProject` (the block file still exports the old
  names). uncertainty-mix's element property is `hiddenKinds` and oversight-home's is `roleId` (`hidden` and `role`
  are HTMLElement's); the React props are unchanged.
- Fixed on the way: oversight-home's changes read "++6%" / "−+50%"; the side pane's composer was too tall as a sheet;
  red-team-finding's muted text on the selected row failed contrast in dark mode.

### New

- **Routine Form** (`tc-routine-form`): set up a scheduled routine – name, frequency, start time in a time zone with
  the next run worked out (DST-safe, `nextRoutineRun()` exported), first run now or on schedule, email notifications
  and instructions, with validation and Create / Save.
- **Multi Calendar** (`tc-multi-calendar`): a calendar of calendars – many people's Google, Outlook, Exchange and
  iCal calendars in Day, Week, Month, Agenda and a People view (one column per person), with show/hide per calendar,
  conflicts across a person's calendars, and create, edit, drag to move or resize, and delete on writable calendars –
  every change a cancelable event, so the page owns saving.
- **Search history:** an opt-in Schedule action on saved searches (`schedulable`, cancelable `tc-schedule`).

### Changed

- **Search components redesigned** to sit with the rest of the library: AI Search has a tray and card with the
  switches below and a keys hint; Query Builder draws its selects as library fields, reads as a sentence and keeps
  each condition on one line; Search History's filter is a quiet field.
- **Chat composer** measures its message again when its width changes.
- **Elements** keep rendering when a Lit parent swaps the last child it put inside them (`<tc-button>${icon}`), which
  used to throw "ChildPart has no parentNode".
- **Multi Calendar:** an event widens into free columns to its right, so busy days keep their titles readable.

## Unreleased – review fixes

### Generative UI (security)

- **Prototype keys:** a `__proto__` key can no longer carry props past the validator, and `required` is checked
  against the object's own keys.
- **Links:** every string an element binds to `href`/`src` is now checked: the generator marks those fields
  `format: "uri-reference"`, and any property ending in `href`, `url` or `src` is a link too (`policyHref`,
  `siteUrl`). `//host` and `/\host` are no longer accepted as relative links.
- **`allowedOrigins`:** a new option on `checkProps`, `checkComponent`, `mountComponent` and `tc-generated-ui` keeps
  images and other resources that load by themselves to the origins you list. Colour fields must be real colours
  (no `url()`).
- **Validator:** `not: {}` fields are dropped; `anyOf` keeps the branch with the fewest issues; values in open
  objects are checked, not copied; top-level `required`/`additionalProperties`, `minItems`/`maxItems` and string
  and number limits are enforced; `MAX_BYTES` is UTF-8 bytes. `date-time` strings become `Date`s, which the
  elements expect.
- **Mounting:** a prop a revised answer drops is reset; a component that fails to load shows a note, reports an
  issue and is retried.
- **Docs:** the Claude example caps its tool loop, checks components on the server and returns what was left out.

### Angular

- `trenchcoat/angular` imports `./<slug>.js`, so it loads under webpack, Karma, Vitest and Node, not only esbuild.
- Server-side rendering no longer crashes: `command-menu` builds its icons on first use instead of when the module
  loads. `check:angular` now imports every dist module in Node with no DOM.
- Form controls: a change the page cancels with `preventDefault()` no longer reaches the form; `reset()` / `null`
  becomes the element's empty value instead of crashing (combobox, dropzone); `disable()` on an element with no
  `disabled` warns in dev mode.
- Every output has a typed `$event`; the generator fails on an untyped event or an event name it can't map.

### Elements

- **Links from data** go through a shared `safeUrl` check in 50 elements: `javascript:` and other schemes render as
  text instead of a link.
- **money-flow:** totals are kept per currency; it keeps re-laying out after being moved in the page (as does
  chat-composer).
- **evidence-list:** hashes are compared as digests (case, spaces, prefix spelling); different algorithms read
  "Hashes not compared", not a mismatch.
- **Focus follows the item** when data changes in travel-itinerary, search-history, coverage-ring and profile-header.
- **search-history** reads the clock on every tick, so times stay right after sleep.
- **query-builder** only says "Copied" when the copy worked, and escapes backslashes and query syntax in values.
- **Bad data** (invalid dates, unknown tones or modes) no longer breaks rendering.
- Smaller: travel-itinerary's percentage is clamped, fingerprint-card's clip ids are unique, citation-badge closes
  on Escape while hovered, and the React `AiSearch` takes a controlled `value`.

### Tokens, build and tooling

- **DTCG export (`tokens/dtcg/`):**
  - `--check` now compares every exported token, resolved through its aliases, with what Chromium computes from
    `tokens.css` in each look and theme. Before, both sides came from the same parser, so a conversion bug passed.
  - Font weights that point at another weight (`--tc-control-font-weight`) stay `fontWeight` aliases instead of
    numbers.
  - Shadows and borders keep references to their colour and width tokens (`{border.default}`, `{focus-ring.width}`).
    Only `color-mix()`, `calc()` and theme branches that are literals in the CSS are exported resolved.
  - **Breaking for Tokens Studio users:** `$themes.json` and `$metadata.json` moved to `tokens/dtcg/tokens-studio/`,
    beside copies of the sets in the form Tokens Studio reads: string values, its own types (`boxShadow`,
    `fontWeights`) and `DEFAULT` for a group's own token. Its DTCG mode doesn't read 2025.10 colour and dimension
    objects yet.
  - The CSS-only tokens are listed for every set, primitives included.
- **Package:**
  - iCloud's `<name> 2.ts` copies are no longer build entries, type-checked or packed.
  - `trenchcoat/internal/*`, `trenchcoat/elements/*`, `trenchcoat/angular/*` (other than `angular/forms`) and other
    internal paths are no longer importable: they weren't API, and their types pointed at the wrong files.
  - `trenchcoat/package.json` is exported.
  - A `sideEffects` pattern that matched nothing is gone.
  - The Angular peer range is now the tested one, `>=19.0.0 <22.0.0`.
- **CI:**
  - Playwright browsers are cached per version.
  - The package is built and packed in its own named step.
  - Actions are pinned to commit SHAs.
  - The token check runs after Chromium is installed.
- **new-component skill:**
  - `integrate.mjs` no longer deletes a copy of a hand-written file in `src/generative`, or a copy with no original.
    It also cleans up duplicated folders (`schemas 2/`), and it fails clearly instead of running every test when a
    component has no test file.
  - `add-to-gallery.mjs` keeps a category's order, handles lists over several lines and category names with `$`, and
    writes nothing unless every component fits.

## Unreleased – Phase 4: a skill for building components

### Added

- **`.claude/skills/new-component/`:** an agent skill with the library's way of building components, so a new one
  comes out like the rest. It covers:
  - deciding whether something new is needed;
  - the element conventions and the five files per component;
  - parallel fork briefs for batches;
  - integration, visual review, and the PR / CI / merge flow;
  - the problems that have bitten before.
  - **Scripts:**
    - `add-to-gallery.mjs` registers components in the README and a gallery section.
    - `integrate.mjs` runs the integration pass in order, stopping at the first failure:
      1. iCloud duplicate cleanup;
      2. regenerating the element index, docs, Angular wrappers and generative schemas;
      3. perf and thumbnails for anything new;
      4. every CI check;
      5. tests in three browsers.
  - **Test cases** in `evals/`, for `claude plugin eval`.

## Unreleased – Phase 3: generative UI

### Added

- **`trenchcoat/generative`:** what an app needs to let a model place components in its answers.
  - **Catalogue:** `catalog` and `catalogPrompt()`, a line per component.
  - **Schemas and tools:** `loadSchema()`, one JSON Schema per component; `toolDefinitions()` and `tagOfTool()`,
    tools for the Messages API.
  - **Checks:** `checkComponent()` and `mountComponent()`.
  - **On a server:** tool definitions and checks work there too.
- **Schemas for 189 components**, generated from their TypeScript types and JSDoc by `scripts/gen-schemas.mjs`
  (`npm run check:generative` keeps them in step).
  - **Left out:** properties that take functions, DOM nodes or files, and fields deeper down that do.
  - **App-controlled:** dialogs, the composer, global shortcuts, the look provider and decoration stay that way.
- **`tc-generated-ui`:** a `component` block, `{ type: "component", tag, props }`, places any catalogued component.
  - **Checks:** props are checked against the schema before they're set; what doesn't fit is left out and listed in
    `tc-spec-check`.
  - **Events:** the component's events come back as `tc-component-event`, also exposed as React's `onComponentEvent`;
    preventing it prevents the component's own.
  - **Guardrails:** links must be http(s), mailto or relative; lists are capped at 200 items, strings at 4,000
    characters, nesting at 8 levels and props at 200 KB.
- **Foundations → Generative UI:** both ways in (the component block, and tool use with the Messages API), with the
  guardrails.

## Unreleased – Phase 2: DTCG token export

### Added

- **`tokens/dtcg/`** (also `trenchcoat/tokens/dtcg/*`): the token dictionary in the Design Tokens Community Group
  format (DTCG 2025.10), for design tools. Generated from `tokens/tokens.css` by `scripts/tokens-dtcg.mjs`.
  - **Primitives:** `primitives.json` holds the 165 primitives.
  - **Modes:** `standard-light`, `standard-dark`, `clean-light` and `clean-dark` each hold every semantic and
    pattern token. A token that the CSS points at another is an alias (`{gray.900}`); anything else is the value
    resolved for that look and theme.
  - **Tokens Studio:** `$themes.json` and `$metadata.json` pair each mode with the primitives.
  - **Types:** colour (sRGB components and hex), dimension, duration, cubic Bézier, font family and weight, number,
    shadow and border.
  - **CSS-only:** the few values with no DTCG type (em letter-spacing, `uppercase`, a padding shorthand) are listed
    with their CSS under `$extensions`.
- **`check:tokens`:** also fails when the export is out of date, when an alias doesn't resolve, or when a token,
  resolved through the export, differs from the CSS in any look and theme.

## Unreleased – Phase 2: Angular wrappers

### Added

- **`trenchcoat/angular`:** a standalone directive for every element, named after it (`tc-combobox` → `Combobox`),
  plus `TRENCHCOAT` for all of them. Generated from the elements' JSDoc by `scripts/gen-angular.mjs` and built by
  `ngc` in partial mode for Angular 19 and later.
  - **No schema:** no `CUSTOM_ELEMENTS_SCHEMA`, and strict templates check every binding.
  - **Inputs:** typed from the element's properties. Plain boolean and numeric attributes are accepted
    (`required`, `value="0.6"`).
  - **Events:** typed, so `$event` is the event's `CustomEvent<…>`. Each handler runs once per event.
- **`trenchcoat/angular/forms`:** a `ControlValueAccessor` for each of the 41 elements that hold a `value`, for
  `[(ngModel)]`, `[formControl]` and `formControlName`. It also provides `TRENCHCOAT_FORMS`. `@angular/forms` is an
  optional peer.
- **`npm run check:angular`:** checks the wrappers in CI.
  - **Up to date:** confirms the generated wrappers are current.
  - **Strict compile:** builds them, and compiles an app against them with strict templates.
  - **Mistakes caught:** confirms five common mistakes fail the build.

### Changed

- **`examples/angular`:** uses the directives with no schema, and checks two things in Chromium: a handler runs once
  per event, and `[(ngModel)]` drives `tc-switch`.
- **Docs:** every page's Angular quick start and controlled example use the directives, and `check:snippets` now
  type-checks their bindings and `$event`.
- **Event details:** four change events gained a field named after the property they change. The existing fields
  stay. The docs' controlled examples read these names, which the events lacked; the new Angular type check caught
  it.
  - `tc-artifact-panel`'s `tc-selected-change`: `selected`.
  - `tc-email-draft`'s `tc-recipient-change`: `recipient`.
  - `tc-reliance-gauge`'s `tc-review-level-change`: `reviewLevel`.
  - `tc-transcript-review`'s `tc-translation-mode-change`: `translationMode`.

## Unreleased – Phase 1: records, investigations and search

Fourteen new Lit elements. Each comes with both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a
gallery demo, a docs page and an overview thumbnail. The gallery gains a **Search** section.

### Added

- **People & profiles:**
  - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category.
  - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys.
  - `tc-place-list`: places with type, status, coordinates and dates.
  - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats.
  - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips.
    - Entities' and transfers' flows are lit with a readout, and there's a table view.
  - `tc-co-occurrence`: entities ranked by the events they share with a subject.
    - Strength in words and bars, with counts per source.
  - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement.
  - `tc-asset-list`: grouped assets with masked identifiers and a status.
  - `tc-contact-channels`: emails, phone numbers, messaging and addresses.
    - Masked until shown, with role, last use and verification.
- **Data & charts:**
  - `tc-ops-overview`: a dense strip of a health pill and count tiles with their change.
  - `tc-sla-status`: on-time share, a Met / At risk / Breached split, a trend and a bar per type.
- **Search:**
  - `tc-query-builder`: conditions in AND / OR groups.
    - Read back in words and as a query string.
  - `tc-search-history`: recent and saved searches.
    - Run again, save, and remove with Undo.
  - `tc-ai-search`: one search box with an AI mode.
    - Suggestions, example prompts, a "search within file contents" option, scope chips and ⌘K.

### Changed

- **Standalone gallery:** `standalone/trenchcoat-gallery.html` is rebuilt with every component to date.
  - It was last built at Part 7, so the people, research, summary, search and record components are new to it.
  - Its size is now about 17 MB.

## Unreleased – summaries, session state and status tracking

Four new Lit elements. Each comes with both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a gallery
demo, a docs page and an overview thumbnail.

### Added

- **`tc-ai-summary`** (AI & chat): the gist of a thread, meeting or set of documents.
  - **Summary:** a TL;DR, then a summary that streams in.
  - **Sources:** key points cite their sources as numbered chips with previews, plus open questions.
  - **Freshness:** a note when the sources have moved on, with Update.
  - **Controls:** Short / Detailed, feedback, a Sources list, Copy and Regenerate.
- **`tc-digest`** (AI & chat): a one-minute digest arranged around what the reader needs, with a reading-time
  estimate.
  - **Sections:** what matters, what to do (ticked off as you go), what changed, and what's safe to ignore.
- **`tc-session-state`** (AI & chat): where a long LLM session stands.
  - **Header:** a health pill.
  - **Tiles:** primary goal, open loops, pending artifacts, and context pressure with a meter that warns as it fills.
  - **Chips:** status chips; the tiles can open what they count.
- **`tc-status-tracker`** (Research & portfolio): a fixed sequence of gates or stages on a line.
  - **Status:** each cleared, pending, blocked or not reached, in words and marks.
  - **Progress:** the line fills as they clear, and the current step is marked.
  - **Records:** a legend, and a step's evidence record on click; vertical when narrow.

## Unreleased – research and portfolio

Fourteen new Lit elements in a new **Research & portfolio** section of the gallery. Each comes with both looks, a
React wrapper, tests in Chromium, Firefox and WebKit, a gallery demo, a docs page and an overview thumbnail.

### Added

- **`tc-traceability-spine`:** the chain from open questions to outcomes.
  - **Columns:** one per stage – Question, Gap, Work, Paper, Cited by, or your own stages.
  - **Linking and tracing:** linked cards are joined by lines. Clicking a card, or pressing Enter on it, traces its
    whole path and dims the rest.
- **`tc-grade-distribution`:** a count over each assessment grade.
  - **Display:** grades with no assessments are muted, and an optional bar shows their proportions.
  - **Filtering:** a grade can be picked as a filter.
- **`tc-investment-balance`:** each priority tier's share of items, budget and people, side by side.
  - **Flags:** over- and under-invested tiers are flagged in words.
  - **Summary:** the biggest mismatch is said in one line.
- **`tc-capacity-bars`:** each person's allocation, split by what they work on, against their capacity.
  - **Scale:** all people share one scale.
  - **Over capacity:** marked on the person and counted.
- **`tc-budget-burn`:** spent against budget for each item, with a pace marker.
  - **Pace:** Ahead, On or Behind pace in words.
  - **Totals and sorting:** totals in the header, and a sort by budget or burn.
- **`tc-publication-impact`:** one paper's impact.
  - **About the paper:** venue, topic, grade and authors.
  - **Reach:** downloads, views, citations and attention, with a reads sparkline, plus mentions.
  - **Readers and feedback:** who is reading, and peer, reader and sponsor feedback, each with a sentiment.
- **`tc-audience-mix`:** who is reading.
  - **Breakdowns:** sector mix, internal versus external, and top places.
- **`tc-citation-badge`:** an embeddable badge of citation tallies – publications, supporting, mentioning and
  contrasting.
  - **Layouts:** labelled or compact.
  - **Details:** a tooltip says what each type means, and an optional link goes to more. No third-party branding.
- **`tc-citation-sections`:** where a work is cited.
  - **Donut:** citing sections – Intro, Methods, Results, Discussion, Other – with letter chips and a legend.
- **`tc-priority-list`:** topics or projects by priority.
  - **Each row:** health, a momentum line with its change, a coverage bar, what's open and the work in flight.
  - **Filtering and grouping:** health filters, and groups per priority.
- **`tc-gap-exposure`:** gaps or risks, and whether anyone is working on them.
  - **Exposure:** severe uncovered gaps are called out.
  - **Investment:** what's been invested in each.
  - **Grouping:** by priority or severity, with an uncovered-only switch.
- **`tc-coverage-ring`:** one share as a large ring.
  - **Bar:** runs from healthiest to needs attention, and reads out each segment.
- **`tc-org-unit-card`:** an organisational unit at a glance.
  - **Header:** its lead and health counts.
  - **Stats:** the page's own stats, with a spent-of-budget bar.
  - **Teams:** each folds open onto its topics.
- **`tc-work-item`:** one piece of work as a card.
  - **Status:** in words, with progress and a due date (marked when overdue).
  - **Resources:** people, what it delivers, spent against budget, and effort.

## Unreleased – people and profiles, and file summaries

Ten new Lit elements, each with both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a gallery demo,
a docs page and an overview thumbnail. Eight sit in a new **People & profiles** section of the gallery; Day Rhythm
is under Data & charts and File Summary under AI & chat.

### Added

- **`tc-profile-header`:** the top of a person's or an account's page.
  - **Identity:** picture or initials, name, a status and tags.
  - **Details:** other names as chips, and a line of key facts.
  - **Actions and tabs:** the page's actions with an overflow button, and a row of section tabs (WAI-ARIA tabs).
- **`tc-person-links`:** the people linked to someone.
  - **Each person:** role, an ID or second line, and the link's strength in words and bars.
  - **List:** a count, "View network" and "Show all". Selecting a person fires a cancelable event.
- **`tc-fact-sheet`:** facts in sections, each value tagged with its source and an Admiralty grade (A1–F6).
  - **Confidence:** the tag is tinted and marked by confidence band.
  - **Uncertainty:** conflicting readings appear side by side, unknowns are stated, and a "How grades work" scale is
    one click away.
- **`tc-document-list`:** identity and record documents.
  - **Each document:** type, country, a masked number shown one at a time, expiry, and a status pill (Verified,
    Active, Expired, Flagged, Fraudulent, or your own).
  - **List:** counts in the header, and View per row.
- **`tc-fingerprint-card`:** a ten-print card in ANSI/NIST finger positions.
  - **Each finger:** a drawn print and its status: captured with NFIQ quality, poor, not captured, unable to print,
    or bandaged.
  - **Interaction:** arrow keys move across both hands, and a finger's detail opens below the card.
- **`tc-biometric-status`:** enrolment across face, fingerprints, iris, DNA, voice, gait and more.
  - **Each record:** a status pill and a quality meter.
  - **Summary:** the count enrolled, and an optional match score.
- **`tc-day-rhythm`:** a typical day as a strip of blocks by kind of place or activity.
  - **Layout:** one row per kind of day, with hour ticks, a now marker and a legend.
  - **Interaction:** the block under the pointer or focus is named in full.
- **`tc-watchlist`:** what a team is watching, most at risk first.
  - **Each row:** avatar, reference, case tag, and a risk badge in words.
  - **List:** filters by risk, a count and View all.
- **`tc-alert-feed`:** a live feed of alerts.
  - **Each alert:** a category, severity shown as an edge, a mark and a word, and a relative time that stays fresh.
  - **Actions:** Escalate and Acknowledge.
  - **Pausing:** Pause feed holds new alerts back, and arrivals are announced politely.
- **`tc-file-summary`:** an AI summary of a file that streams in.
  - **Content:** key points citing their pages or times, plus the people, organisations, dates and amounts mentioned.
  - **Controls:** Short / Detailed, coverage, and Copy, Regenerate and Open file.

### Changed

- **CI:** WebKit runs across eight machines instead of six, after a sixth ran out of memory.
- **`tc-model-settings`:** the signature panel above the controls is now opt-in with `signature`. It drew every
  parameter a second time, so the card read as having two of each setting.

## Unreleased – activity clock and activity calendar

Both are Lit elements with both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a gallery demo and a
docs page, listed under Data & charts. They share one shading scale (`internal/activity-scale.ts`).

### Added

- **`tc-activity-clock`:** activity by hour, a clock per day.
  - **Rings:** an inner AM ring and an outer PM ring of twelve hour segments, labelled at 12 o'clock, with 12 at the top.
  - **Shading:** each segment shaded by its value in `levels` steps, scaled to the busiest hour shown or `max`. An
    hour with no data is outlined, not shaded.
  - **Middle:** the weekday and date, or the hour under the pointer or focus and its value.
  - **Header and selection:** the busiest hour in the header, and a selected hour reported with a cancelable
    `tc-selected-change`.
  - **Keyboard:** a grid with a row per day; ← → move an hour, ↑ ↓ a day, Page keys switch between AM and PM.
- **`tc-activity-calendar`:** a year of activity, contribution-graph style.
  - **Layout:** a column per week and a row per weekday, ending on `end`, with `weeks` and `week-start` settings.
  - **Labels:** month names along the top, and weekday names pinned down the side while the weeks scroll. The newest
    week starts in view.
  - **Values:** a missing day counts as 0, and null is outlined as no data.
  - **Header, footer and selection:** the total in the header; the footer reads out the day under the pointer or
    focus. A selected day is reported with a cancelable `tc-selected-change`.
  - **Keyboard:** ↑ ↓ move a day, ← → a week, Page keys four weeks.

## Unreleased – remediation Part 7 (terms dialog, skills in the composer, app picker, notifications, header nav)

See `audit/remediation-plan.md`, Part 7. Every new component is a Lit element with both looks, a React wrapper,
tests in Chromium, Firefox and WebKit, a gallery demo and a docs page.

### Added

- **`tc-terms-dialog`:** terms to agree to.
  - **Changed terms:** re-acceptance opens with a "What's changed" summary, and changed sections are marked.
  - **Reading:** a jump list that folds into a Contents button.
  - **Accepting:** required and optional consents; Accept can wait for the end of the text, and says why it's waiting.
  - **Other actions:** Decline, print and download, plus a blocking mode.
  - **Saving:** app-driven saving with error and retry.
- **`tc-app-picker`:** the app launcher.
  - **Sections:** Pinned, Recent and All apps, or your own groups.
  - **Finding and opening:** search; real links; arrow keys across the grid.
  - **Pins and states:** an "Edit pins" mode, loading and error states, and an inline panel layout.
- **`tc-notifications`:** the notification center.
  - **Bell:** an unread badge.
  - **List:** All / Unread and category tabs, with items grouped by day.
  - **Per item:** read toggle, actions and dismiss; "Mark all as read".
  - **More:** load more or infinite scroll, polite announcements of new arrivals, and an inline mode. Every change is
    a cancelable event.
- **Skills in `tc-chat-composer`:** `skills`, `recentSkills`, `searchSkills`, `skill`.
  - **Typeahead:** typing `/` at the start of a message opens a ranked typeahead, grouped by source, with recent skills
    first.
  - **Token:** a pick adds a tinted `/skill` token with its argument hint.
  - **Events:** `tc-send` gains `skill` and `args`, and there is a new `tc-skill-change`.
  - **Toolbar:** an optional "/" button.
- **`tc-mention-picker`:** item descriptions, recents, ranking across groups, word-match highlighting and per-trigger
  search. It stays backwards-compatible.
- **Header Nav block:** notifications, app picker and the account avatar for the right end of an app header, with
  one popover open at a time.
- **Shared code:**
  - `internal/modal.ts`, the `ModalController` that `tc-dialog`, `tc-terms-dialog` and `tc-stories` share;
  - `cardHead()` gains `picture`, `pictureShape` and `keepAside`.
- **`standalone/trenchcoat-gallery.html`:** the whole gallery in one HTML file that opens from disk, with no server
  and no network.

### Changed

- **`tc-stories`:** opens a "what changed" brief instead of a story player.
  - **The row stays:** the gradient ring still means something new.
  - **The brief:** a light modal with an optional summary, then a bento of update tiles (metric, status move, note,
    list, image, link), new ones first. Previous and Next move between entries.
  - **Entries:** `entries`, which can be people or accounts; `people` still works.
  - **Removed:** the timers, video and swipe.
- **`tc-dialog`** uses the shared `ModalController`. If the browser closes it on its own, focus now goes back to the
  button that opened it.
- **`tc-profile-menu`:** Standard rounds a photo avatar, as Clean does.
- **Gallery:** "Feedback & onboarding" moved up the sidebar; it was listed after Utilities.
- **Tests:** a new `parkPointer()` helper keeps the real pointer from leaking between test files.

## Unreleased – remediation Part 6 (text selection, the rest of THEMIS, blocks, docs for every framework)

See `audit/remediation-plan.md`, Part 6, and `audit/part6-brief.md`. Every new component is a Lit element with
both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a gallery demo and a docs page.

### Added

- **Text selection:**
  - `tc-text-annotator`: highlight a passage and comment on it;
  - `tc-response-selection`: select part of a model reply to reply to it or request an edit;
  - `tc-selection-translate`: translate the selected text;
  - `tc-isbn-details`: hover an ISBN for its book details.
- **Feedback and onboarding:**
  - `tc-stories`: a gradient ring for new updates that opens a modal viewer;
  - `tc-background-tasks`.
- **Trust & calibration**, from THEMIS and built domain-neutral:
  - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`,
    `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`;
  - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`,
    `tc-reasoning-flags`.
- **Blocks:** the five THEMIS blocks and the AI side pane. The side pane is a chat drawer about the page beside it.
- **`tc-chat-composer` toolbar:**
  - model picker, settings and prompt library;
  - page context you can connect and disconnect;
  - a disclaimer line under the input;
  - `hide*` props for each piece.
- **Docs on every page:**
  - Usage and Frameworks tabs for HTML, React / Next.js, Vue / Nuxt, Angular and Svelte;
  - a Browser support section with each component's minimum versions;
  - a Performance section with bundle size, render times and runtime cost.

  New foundations pages cover frameworks, browser support and performance. Components' fallback-only tokens now
  show in the token table.
- **Tooling:**
  - `npm run measure:perf` writes `app/src/docs/perf.json`; `-- --missing` measures only new or changed elements;
  - `npm run check:snippets` type-checks each page's framework snippets and is part of `npm run ci`;
  - the browser feature table is `scripts/browser-features.json`.
- **Shared code:**
  - selection: `SelectionController`, `SelectionToolbarController`;
  - popovers: `PopoverController` and `placePopover`, in the top layer with hover intent;
  - `RequestController`, `internal/kit.ts`, `internal/source-line.ts`;
  - the `--tc-highlight-*` tokens.

### Changed

- **Eight enhancements to existing components**, plus gap fixes:
  - dialog actions, and dialog styles no longer leaking;
  - progress-tracker states;
  - data-table `selectable`;
  - image-grid badges, meta, `openable` and fill;
  - breakdown-chart wrap and fill;
  - kpi-chart colours, `lowerIsBetter` and `deltaFormat`;
  - ai-answer `hideActions`.
- Popovers across the library share one helper.
- `tc-evidence-coverage`'s types are `EvidenceCoverageStatus` and `EvidenceCoverageOpenChange`, so they don't clash
  with coverage-matrix's.
- CI moved to the repo root as `.github/workflows/trenchcoat-ci.yml`, so GitHub runs it. It runs only for changes
  under `trenchcoat/`, and it now also checks the framework snippets.

## Unreleased – remediation Part 5 (more AI components, trust & calibration), the AI configuration rebuild and one card style

See `audit/remediation-plan.md`, Part 5; `audit/ai-config-brief.md`; and `audit/style-drift.md`. Every new or
rebuilt component is a Lit element with both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a
gallery demo and a docs page.

### Added

- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`,
  `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`,
  `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
- **Trust & calibration**, from THEMIS and built domain-neutral:
  - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`,
    `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`;
  - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`,
    `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`;
  - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`,
    `tc-playbook-canvas`.
- `tc-approval-card` gains decision detail: why you're seeing it, what each choice does, editable arguments and
  evidence chips.
- **Shared code:**
  - helpers: `ToolbarController`, `internal/util.ts`, `internal/format.ts` and `internal/layered-graph.ts`;
  - tokens: source, validity, syntax and teal tones, and danger action tokens;
  - `internal/card-head.ts`, the shared card header.
- **New style tokens:**
  - the card title and the line under it: `--tc-title-*`, `--tc-subtitle-*`;
  - the card header: `--tc-head-*`;
  - the compact field: `--tc-field-h-sm`.
- **New ratchet counters:** literal font-family, font-size and letter-spacing.
- `check-prefixes` checks that every element's `ui` prefix is unique.

### Changed

- **AI configuration** – provider-connection, mcp-connection-manager, tool-configuration, model-settings,
  model-routing, instruction-editor, knowledge-source-manager, retrieval-settings, multimodal-input,
  output-schema-builder, evaluation-dataset-editor, conversation-annotation, configuration-release-control and
  data-handling-policy:
  - Each was rebuilt from one generic form into a purpose-built view led by its state: a connection path, a route
    that lights up, a retrieval pipeline you edit, a data lifecycle, a release pipeline with its gate, an API
    reference entry, a schema tree beside its rendered answer, and inline annotation.
  - Their APIs changed; see each page.
- **One card style.** Every card's title uses the title tokens in ink, never accent or gray. In Standard the
  header sits on the gray tray with a boxed icon; in Clean it is the card's first row.
- **Type and controls.** Font families, sizes and tracking moved to tokens, and buttons and fields to the control
  and field tokens, across about 150 elements. Seventeen plain-text titles became real headings.
- kpi-chart, progress-tracker, setup-guide and writing-assistant now sit on the Standard tray.
- decision-inbox has a `heading` (React `title`), default "Decisions"; the count moved to the line under it.
- The form primitives' shared `internal/settings.ts` lost its unused panel and field helpers.

### Fixed

- **Buttons at the wrong size and weight:** in email-draft, filter-menu, integration-settings, billing-schedule,
  comments-panel, smart-recommendation, writing-assistant and setup-guide, a button reset outranked the control
  styles. Their buttons rendered at the page's 16px in the regular weight.
- **stepper-form error contrast:** its error messages were 3.9:1; they now use the danger text colour.
- **Gallery styles leaking into components:** the docs page's `h2` and the home page's section spacing were
  styling headings and sections inside components.
- **Stale gallery modules:** a long-running dev server served old modules (mcp-connection-manager failed to
  render). This was fixed by restarting the server; no source change was needed.

## Unreleased – remediation Part 4 (a design-system page for every component)

See `audit/remediation-plan.md`, Part 4.

### Added

- A design-system page for every component, illustration and motion piece in the gallery: overview, when to use and when not, anatomy pinned on the live demo, looks, usage for HTML, React, Vue, Angular and Svelte, the full API (generated), the React props, accessibility with the keyboard table, content guidance, do and don't, related components and the changelog. Foundations pages: getting started, looks, themes, tokens, patterns, accessibility.
- `npm run check:docs`: every public property, event, slot and React prop has a description, every page has its guidance, and every React example type-checks.

### Fixed

- data-table and agent-lanes: a look selector left in front of a comment turned two rules into descendant selectors, so Clean lost data-table's coloured tag pills and agent-lanes' Reject / Approve button styles.
- agent-lanes says "1 task needs you" (was "1 task need you").

## Unreleased – remediation Part 3 (new components)

See `audit/remediation-plan.md`, Part 3. Each is a Lit element with both looks, a React wrapper in `trenchcoat/react`,
browser tests in Chromium, Firefox and WebKit, and a gallery demo.

### Added

- `tc-run-checkpoints` – a run's restore points as a list and a timeline: what each point captured, what going back discards (steps, file changes, tokens, cost), a note for the retry, and `restorer` that may return a promise. Listbox keyboard; `tc-selected-change`, `tc-restore`.
- `tc-budget-guard` – spend and token caps for a live run: a big meter and thin ones, the pace to the cap, a warning with Raise to buttons at `warnAt`, and a hard stop with an alert. `tc-limits-change` (cancelable), `tc-cap-reach` once per cap, `tc-stop`.
- `tc-handoff` – the agent hands the task to a person: what it did, why it stopped, what it needs; Take over turns the needs into a checklist with a note, Hand back folds it to one line. ⌘/Ctrl+Enter; `tc-status-change`, `tc-checked-change`, `tc-note-change`, `tc-return`.
- `tc-live-view` – the agent's screen (frames, a live video or canvas, or your own content) with its pointer, clicks, typing and keys drawn on top, a step caption, and Pause / Take over; your clicks are reported in frame pixels while you have control.
- `tc-sandbox-log` – sandbox command output: a block per step with command, exit code and time; ANSI colours (16, 256 and true colour) mapped to tokens, never parsed as HTML; incremental parsing while it streams; copy and search; windowed (50,000 lines render under 400 rows).
- `tc-code-block` – a streaming code block: a small tokenizer per language (TS/JS, Python, JSON, HTML, CSS, shell) re-highlighting only changed lines, Copy, Apply, and a line diff against `current` with folded unchanged runs. Toolbar keyboard; `tc-view-change`, `tc-copy`, `tc-apply`.
- `tc-artifact-panel` – what a run produced: a list, a preview per kind (Markdown text, code through `tc-code-block`, images, tables from CSV), versions with a diff against the one before, and download (a Blob by default, cancelable).
- `tc-run-compare` – two runs or prompt versions side by side: outputs and prompts word-diffed with inline-diff's Myers diff, steps aligned and marked Added / Dropped / Changed, cost, time and tokens marked better or worse. Tabs; `tc-view-change`, `tc-pick`.
- `tc-tool-permissions` – a grid of agents × tool scopes, allow / ask / deny per cell (a destructive scope never offers allow), presets, a Custom state, and a summary of changes against `saved`. WAI-ARIA grid; `tc-value-change` with the cause, `tc-save`.
- `tc-trigger-builder` – an event or a schedule, an active window, conditions with all/any, a plain-language summary and the next run times; form-associated (JSON under `name`, validity, reset). Built from combobox, date-range-picker and segmented-control.
- `tc-mention-picker` – the / and @ picker for a textarea, input or contenteditable: grouped, scored results, the field keeps focus (aria-activedescendant), ↵ / Tab insert a token or a chip, and the composer's Enter-to-send never sees that ↵. `search` may be async.
- `tc-context-tray` – what's in context as chips with token weights, a meter against the window with a reserved share, pin, remove with undo (⌘/Ctrl+Z), and a warning near the limit. Toolbar keyboard; `tc-items-change` (cancelable).
- `tc-conversation-branches` – edit a past message to fork the conversation; a 2 / 3 switcher on the edited message, each branch's replies (with `tc-message-actions`) below, and `tc-edit` answered with the new replies or a promise of them.
- `tc-chat-history` – conversations grouped by Pinned, folders, Today … month: search, rename in place (F2), pin, move, delete with undo, a context menu; the WAI-ARIA tree pattern, windowed (10,000 chats render under 120 rows).
- `tc-voice-mode` – a voice conversation: `tc-voice-orb` for the state, live captions that announce finished turns once, and Mute / Captions / Interrupt / End in a toolbar; Esc interrupts. The audio stays the app's.
- `tc-answer-arena` – two models' answers streamed side by side, then A / B / tie with a reason; blind mode reveals the names after the vote. `tc-value-change` (cancelable).
- `tc-image-grid` – generated images as a grid: pending, done and failed tiles, regenerate, upscale, download (saves by default), compare two with a keyboard slider, and required, editable alt text. WAI-ARIA grid.
- chat-composer (the Lit element and `trenchcoat/react`): opt-in `mentions` (a `tc-mention-picker` on the message)
  and `context` / `context-limit` (a `tc-context-tray` above it). Without them it renders as before.

### Checks

- The ratchet counts any reference to `Date.now`, not only calls – an alias (`const read = Date.now`) or
  `Date.now.call(Date)` used to get past it. chat-history and trigger-builder read the clock once when they connect
  (the default for `now`), recorded in the baseline.
- The gallery's spacing between its own sections no longer reaches sections inside a component's stage.

## Unreleased – remediation Part 2 (the shift to Lit)

See `audit/remediation-plan.md`, Part 2, and `audit/lit-port-plan.md`.

### Added

- Lit 3 web components: `tc-button`, `tc-combobox` and `tc-data-table` (the pilot), `tc-look-provider` for an
  app-wide default look, the shared controllers (row window, focus rescue, smooth height, off-screen, on-screen,
  ARIA forwarding, hotkeys, rolling numbers). Pixel-identical to the React components in both looks and themes.
- The package build (`npm run build:package`): ES modules per element, TypeScript declarations,
  `custom-elements.json`, React wrappers (`trenchcoat/react`, same API as the React components) and typed bindings
  for Vue (`trenchcoat/vue`) and Svelte (`trenchcoat/svelte`). Still private, 0.1.0, UNLICENSED.
- `examples/`: React, Next.js, Vue, Nuxt, Angular, Svelte and plain-HTML apps that install the packed package;
  `npm run examples` checks all seven.
- Every other component as an element (step 2.6): 61 more, 64 in all, each with its React wrapper under the same
  name and props in `trenchcoat/react`, browser tests in Chromium, Firefox and WebKit, and its gallery demo diffed
  against React in both looks and themes (all under 1 %; the remaining differences are demos that use
  `Math.random()` or a running clock). Import one element with `trenchcoat/<slug>`.
- The 22 illustrations and 8 motion pieces as elements (step 2.7), 105 tags in all; shimmer-loader is two
  (`tc-skeleton`, `tc-shimmer-text`). Same React names and props through `trenchcoat/react`; parity with the React
  versions at 0.00 % except voice-orb's canvas particles (timing) and tilt-card, which drops 3 px of line space
  under its inline-block root.
- glass-folder has an `open` property: the look its hover gives, on demand.
- filter-menu renders only the rows near the viewport in groups over 60 options (tested with 5,000).
- otp-input, dropzone and stepper-form's tags and choices are form controls (ElementInternals): they submit under
  `name`, honour `required`, reset and a disabled fieldset, and are named by a page `<label for>`.

### Breaking

- `components/` is gone: no more generated single-file components and no `-clean` copies. Each component is
  `src/components/<slug>.tsx` with both looks – set `look="clean"` for Clean. Components no longer carry token
  fallbacks or inlined helpers: load `tokens/tokens.css` (it also holds the theme and forced-colours rules they used
  to inline). `npm run build:lib` and `check:lib` are removed. plan-vs-actual (Clean only) is now
  `src/components/plan-vs-actual.tsx`. No app uses Trenchcoat yet, so there is no deprecation period.
- The React components are retired except the ones blocks and screens still import (agent-plan, approval-card,
  button, chat-composer, combobox, data-table, filter-menu, inline-diff, kpi-chart, segmented-control, setup-guide,
  thinking-loader, thinking-state, tool-call-card, usage-meter). Use `trenchcoat/react`: same names and props.
- The React illustrations and motion pieces are retired except glass-folder (three screens import it).
- model-wheel's `defaultModels` is `modelWheelDefaults` (chat-composer's wrapper exports `defaultModels`).
- Renamed types, so the package index can export every element's types: decision-inbox `Decision` →
  `InboxDecision`, plan-vs-actual `PlanStep` → `PlanVsActualStep`, agent-plan `PlanStep` / `PlanStepStatus` →
  `AgentPlanStep` / `AgentPlanStepStatus`. decision-tree keeps `Decision` on the wrapper.
- `ref` on a wrapper is the custom element. Where the React component had an imperative handle (review-center,
  inline-diff, decision-tree), the element has the same methods.
- A few callbacks get the native event instead of React's synthetic one: model-picker `onKeyDown`, toaster
  `ToastAction.onClick` (`preventDefault()` still works). Model-picker, toaster and review-center handle Escape or
  their shortcuts on the element first; a page's `onKeyDown` on the component sees them after (or not, for Escape
  while a menu or toast is open).
- React nodes passed as content (icons, avatars, approval-card previews, toast text, MessageText children) are
  rendered once in a hidden box and cloned into the element: they look the same, but event handlers inside them
  don't run. Plain strings are unaffected. stepper-form steps are the exception: they render through a portal and
  stay live React.

### Behaviour changes

- trace-waterfall rows show an outline when focused in forced-colours mode (their ring was a box-shadow, which
  forced colours removes). data-table sorts only when its rows, sort or columns change – scrolling 10,000 sorted
  rows was 72 ms per step.
- thinking-state no longer reports `onOpenChange(true)` on mount when `open` is held false; date-range-picker
  doesn't flash its "Last 30 days" stand-in before reading today; memory-panel with `undoFor={Infinity}` keeps a
  failure message instead of clearing it at once; dropzone keeps focus on a row while another row folds away (the
  React version lost it in real browsers).

## Unreleased – remediation Part 1 (design work that carries over to Lit)

See `audit/remediation-plan.md`, Part 1.

### Visible changes

- Type scale (decision B): text at 11.5, 12.5 and 13.5 px is now 11, 12 and 13 px in every component and
  illustration, and fields (`--tc-field-font-size`) are 13 px. `--tc-font-size-xs-plus`, `-sm-plus` and `-md-plus`
  are deprecated – only blocks and screens still use them – and check-tokens rejects new uses elsewhere.
- Spacing on the scale: padding, margin and gap in every component, illustration and motion piece use
  `--tc-space-*` (3,389 values that were already on the scale, 322 that were 1 px off it and moved by 1 px). What
  stays literal – 1 px, fractions, negatives and values 2 px or more off the scale – is counted by the ratchet's
  new "literal spacing" rule (448 in these libraries; blocks and screens are untouched).
- Line heights and radii on the scale (`scripts/apply-scales.mjs`): 12 values already on it and 56 that were 1 px off
  now use `--tc-line-height-*` / `--tc-radius-*` (in Clean-only rules, 5 px radii use Clean's
  `--tc-radius-badge`); memory-panel's cards use `--tc-shadow-raised`. Ratchet totals: line-height 151 → 109,
  radius 176 → 101, blurred shadow 50 → 46. Unitless line heights, illustration art shadows and values 2 px or more
  off the scale stay literal.

- Decision C: breakdown-chart's default palettes (and the gallery demo's colours) are at least 3:1 against the
  surface in both themes, with a 2 px gap between segments; date-range-picker's picked range is a 3:1 band
  (`--tc-date-range-picker-band`) with the day numbers still at 4.5:1 or more.
- fan-out-grid cells and agent-queue backlog squares stay 12 px but sit 24 px apart, and each takes clicks across
  24 px (WCAG 2.5.8) – the grids show fewer items per row.

- Smaller illustrations: region-dach's US, China, India, Brazil and Japan outlines are simplified
  (Ramer–Douglas–Peucker; the faded neighbours much more than the land), 167 → 82 KB of source, with a few islets
  under 2.5 units dropped from the neighbours; project-flow's four avatars are WebP instead of PNG, 137 → 90 KB.

- Forced colours (Windows High Contrast): every component carries one shared block (`scripts/tokens.mjs`
  `FORCED_RULES`, also in tokens.css section 3b) that gives buttons, fields, switches and comboboxes a system-colour
  edge (forced colours drop the box-shadows they used), outlines listboxes, menus, dialogs and tablists, shows
  selected / pressed / checked / current items in Highlight, draws switch knobs, and greys disabled controls. Only
  active under `@media (forced-colors: active)`; the normal looks don't change.

### Behaviour changes

- context-window: Clean's "Compacting…" shine runs 3 times and rests, like every other shimmer (it ran endlessly).
- inline-diff: `diffWords` uses Myers' O(ND) diff instead of a capped LCS table. Long texts stay word by word (a
  3,000-word text with 150 edits gives 150 changes, where anything over ~1,500 words used to become one
  replacement), and the work grows with the edits, not the length squared. Its third argument is now a work budget
  (tokens × edits); past it the middle is still one replacement.

### Removed

- illustrations/frost-cloud and illustrations/glow-cloud, with their demos and tests.

## Unreleased – accessibility and design pass, blocks, screens, illustrations, motion

All 187 published files now pass axe (WCAG 2.0–2.2 A/AA) in light and dark in a real browser, and every library
follows the same pattern tokens and scales as the components. Dark mode works the same through `.dark`,
`data-tc-theme` or the OS setting everywhere (dark-only colour rules: 247 → 0). Endless animations settle on their
own and pause off-screen.

### Visible changes

- Blocks use the library's Button and SegmentedControl, and the pattern tokens for fields, menus, switches, pills,
  cards and trays (decision 3).
- Screens use the components' own scale (decision 2): the App Shell's tabs, search fields, menus, toolbar buttons and
  cards are on the pattern tokens, and no screen restyles a component from outside or shrinks it with `zoom`, so
  components look the same in a screen as in their own demo. The workspace shells no longer scroll sideways.
- Illustrations follow the page theme (project-flow picks its dark scene from the colour scheme; voice-orb redraws
  on theme change).

### Behaviour changes

- illustrations/project-flow: without `theme` it follows the page theme (it used to default to light).
- App Shell Popover, Dropdown and MenuButton move focus into the menu on open and back to the trigger on close;
  the toast's status region is always mounted.
- motion: gradient-floor, gradient-text and grid-background settle after `playFor` (default 5 s, `Infinity` to
  loop); ShimmerText's default `duration` is 1.6 s; gradient-text's default light colour is darker (#ec4899).

### Added (all optional)

- kpi-chart `fill`, inline-diff `fill`, usage-meter `layout="wide"` – what screens used to force by overriding
  internals.
- Pause controls: blocks/logo-marquee and testimonial-wall `paused` / `defaultPaused` / `onPausedChange` /
  `pauseButton`.
- illustrations/layer-stack `rounds`, model-wheel `turns`; motion `playFor`; number-ticker accepts `aria-live`.
- App Shell Tabs `label`, `fullWidth`, `className`; Popover `role` and `label`.

## Unreleased – accessibility and design pass, components

Every component (both looks) now has 0 axe violations (WCAG 2.0–2.2 A/AA) in light and dark in a real browser,
and the audit's critical keyboard blockers are fixed (data-table and command-menu Tab traps, agent-cursors'
suggestion popover, context-map tiles). Components use the pattern tokens from `tokens/tokens.css` (controls,
fields, menus, pills, cards, trays, kbd, switches, segmented controls) and the duration, easing, type, radius and
z-index scales; dark mode works the same through `.dark`, `data-tc-theme` or the OS setting. See
`audit/design-review/README.md` for the decisions behind the visible changes.

### Visible changes

- Standard primary actions are flat ink everywhere (Button and every component's own primary).
- Button sizes come from the control tokens: Standard sm/md/lg 32/40/48 → 28/32/40 px (Clean unchanged).
- Fields show a ≥3:1 edge and a focus ring; focus rings everywhere use the focus tokens.
- Pills, kbd chips, switches, trays (inset 6 → 4 px in Standard) and cards follow one recipe per look.
- Endless shimmers, sweeps and glows run a few cycles and stop (and pause off-screen); state is never shown by
  colour alone (marks, edges, underlines, dash patterns).

### Behaviour changes

- toaster: toasts with an action don't auto-dismiss (`actionDuration`, default Infinity).
- segmented-control selects on pointer release, not press.
- writing-assistant: dictation fills the field and no longer sends by itself.
- data-table renders only the rows in view above 60 rows (was 200); combobox windows options above 300 matches;
  command-menu shows at most `maxRows` (default 200) results.
- Roles that promised a keyboard pattern they didn't implement were replaced: agent-tree (nested lists instead of
  tree), profile-menu (buttons instead of menu), comments-panel filters and experiment-card winners (`aria-pressed`
  buttons), setup-guide tasks (`role="checkbox"`), date-range-picker presets (toggle buttons).
- usage-meter: the `--tc-usage-meter-track`, `-fill` and `-action-bg-hover` custom properties are gone; it uses the
  meter and action tokens.

### Added (all optional)

- Pause controls: agent-graph `paused` / `defaultPaused` / `onPausedChange`, agent-lanes and progress-tracker
  Pause/Play buttons.
- Timing: approval-card `allowStopTimer` / `stopTimerLabel`, review-center `undoTimeout` and `shortcuts={false}`,
  memory-panel's Undo pauses on hover and focus.
- combobox `invalid`, otp-input `labelledBy`, stepper-form tags `autoComplete`, decision-tree Previous/Next buttons,
  inline-diff "Undo last decision", agent-plan Move up/down buttons, delegate-board click-to-assign.

## Unreleased – blocks, screens, illustrations, motion (code-quality Phase 5)

The single-look libraries now follow the same contract as components (`CONTRIBUTING.md`): `className`, DOM props
and `ref` on the root (screens pass them to the App Shell root), controllable state as `x` / `defaultX` /
`onXChange`, promise-aware async callbacks, timers and listeners cleaned up on unmount, and animations that pause
off-screen and in hidden tabs. Each file has a contract spec. React commits per 5 s across all demos: 1,009 → 898
(kpi-board 49 → 1, illustrations agent-team 43 → 1, screens agent-run 30 → 22). "affectUI" is now Trenchcoat
throughout.

### Breaking: values you pass now stay in control

| File | Prop now controlled | Starting value | Change handler |
|---|---|---|---|
| blocks/task-board | `tasks` | `defaultTasks` | `onTasksChange` (`onChange` deprecated) |
| blocks/ai-workspace | `conversations`, `projects` | `defaultConversations`, `defaultProjects` | `onConversationsChange`, `onProjectsChange` |
| illustrations/region-dach, world-map | `region`, `continent` (now warn without a handler unless `showSwitcher={false}`) | `defaultRegion`, `defaultContinent` | `onRegionChange`, `onContinentChange` |

### Behaviour changes

- blocks/app-directory: `onToggle` runs when the user clicks (not after the simulated delay) and may return a
  promise; a rejection leaves the app unchanged and shows an error.
- Decorative illustrations are `aria-hidden` unless given `label` (then `role="img"` with that name).
- illustrations/cover-flow: a controlled `index` only changes through `onIndexChange`; gestures no longer report
  every cover passing by.
- illustrations/voice-orb: the root forwards DOM props and `ref`; a caller's `onClick` runs first, and
  `preventDefault()` in it skips `onPress`.
- motion/tilt-card: a caller's pointer handlers run alongside the card's instead of being replaced.

### Deprecated (kept for one release)

- blocks/task-board `onChange` → `onTasksChange`
- illustrations/layer-stack `onChange` → `onIndexChange`

### Added

- Controllable props: screens/app-shell `collapsed`, `panelOpen`; screens crm/settings-billing `tab`, evals
  `version`, files `view`, integrations `connected`, onboarding `step`, analytics `period`; blocks agent-gallery
  `index`, pricing-plans `billing`, client-context `client`, invoice-credit `view`, metrics-dashboard `range`/`metric`,
  app-directory `connected`, kpi-board `range`/`segment`; illustrations layer-stack `index`.
- Promise-aware callbacks: screens onboarding `onComplete`, agent-run `onApprove`, assistant-home `onSend`; blocks
  invoice-credit `onIssue`, metrics-dashboard `onExport`, ai-workspace `respond`.
- blocks/metrics-dashboard `now` (epoch ms).

## Unreleased – performance (code-quality Phase 4)

Animated components no longer re-render React to move pixels: clocks, countdowns, progress bars, rolling numbers
and typing reveals write to the DOM (text nodes, CSS custom properties) and React renders only when structure or a
discrete label changes. Live clocks pause off-screen and in hidden tabs. Across the gallery's demos, React commits
in 5 simulated seconds went from 2,311 to 1,009 (e.g. context-window 84 → 3, compact-breakdown 82 → 5,
agent-steering 52 → 2, agent-lanes 51 → 5, trace-waterfall 51 → 8, tool-call-card 60 → 9). No-deps layout effects
that measured on every render are keyed or ResizeObserver-driven, and functions over ~300 lines are split into
named parts.

### Behaviour changes

- data-table renders only the rows in view above 200 rows (spacer rows keep the scroll height; `aria-rowcount` and
  `aria-rowindex` are set on every row).
- dropzone reports progress through `onChange` at most once a second (status changes are still reported at once).
- toaster: when several toasters share the hotkey, the newest one with a toast takes it; Ctrl/⌘ + the key no longer
  triggers it.

### Added

- agent-lanes `rate`: how fast its clock runs, in clock ms per real ms (0 with `now`, 1 without – as before).

## Unreleased – one API contract (code-quality Phase 3)

Every component built from `src/components/` now follows the contract in [CONTRIBUTING.md](../../CONTRIBUTING.md):
controlled/uncontrolled state through one rule, `className`/rest props/`ref` on the root, promise-aware async
callbacks, hydration-safe rendering, form fields on inputs, opt-out shortcuts and `useId` ids.

### Breaking: values you pass now stay in control

A value prop that is defined now **controls** the component. Before, several components copied it into state once and
ignored later changes, or decided control by whether a callback was passed. If you passed one of these as a starting
value, move it to the `default…` prop (or pass the change handler too). In development, a controlled value without
its change handler logs a warning naming the prop.

| Component | Prop now controlled | Starting value | Change handler |
|---|---|---|---|
| data-table | `rows` | `defaultRows` | `onRowsChange` |
| billing-schedule | `phase` | `defaultPhase` | `onPhaseChange` |
| project-card | `tasks`, `status` | `defaultTasks`, `defaultStatus` | `onTasksChange`, `onStatusChange` |
| memory-panel | `memories` | `defaultMemories` | `onChange` |

The same rule now applies to the props that used to be copied once (comment-thread, comments-panel,
notification-stack, email-draft, progress-tracker, setup-guide, tips-panel, reaction-bar, integration-picker,
integration-settings, decision-inbox, review-center) and to the local decision maps in agent-inbox, agent-lanes and
delegate-board: a decision you make is kept until the task you pass changes, then your data wins.

### Breaking: `now` is epoch ms everywhere

fan-out-grid and plan-vs-actual read `now` as epoch ms and tick on their own clock when it isn't passed. The old
meaning (ms from the start of the job, with job-relative task times) is `elapsed`. trace-waterfall without
`startedAt` still reads `now` the old way, deprecated in favour of `elapsed`.

### Deprecated (kept for one release)

- stepper-form `initialValues` → `defaultValues`; `initialStep` → `defaultStep`
- setup-guide `onChange` → `onDoneChange` (same arguments)
- cited-answer `defaultOpen` → `defaultPreview`
- trace-waterfall `now` without `startedAt` → `elapsed`

### Added

- `className`, DOM props and `ref` on every component root (components with an imperative handle – decision-tree,
  review-center, inline-diff – keep it).
- New controllable state (`x` / `defaultX` / `onXChange`) where a parent may want it, e.g. agent-cursors `tab` and
  `following`, agent-graph `selected`, agent-inbox `view` and `expanded`, agent-lanes `expanded`, agent-ledger
  `onUndoneChange`, agent-queue `paused` and `openId`, agent-steering `draft`, agent-tree `collapsed`.
- Async callbacks (send, run, approve, upload, retry, compact …) may return a promise: the component shows pending,
  and a rejection shows an error you can retry from. Long operations (chat-composer, command-menu, context-window,
  dropzone, integration-picker/-settings, message-actions, otp-input, stepper-form, writing-assistant) receive an
  `AbortSignal`.
- Inputs (combobox, otp-input, segmented-control, date-range-picker, dropzone, filter-menu, stepper-form …) take
  `name` (hidden input for native forms), `disabled` and `required`; Enter ignores IME composition.
- `hotkey` on command-menu, integration-picker and toaster: `false` turns the shortcut off, a string changes it; one
  listener per shortcut however many instances.
