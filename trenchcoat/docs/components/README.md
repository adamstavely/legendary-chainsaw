<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Overview](../README.md)

# Components

**Interactive building blocks for AI-native products**

Self-contained UI pieces – agent views, chat and answer UIs, charts, inputs and feedback. Each one ships in a Standard and a Clean style with the same props. Start here when you need a single control or widget.

376 items · 376 files

## Agents (58)

- [Agent Create](agent-create.md) – Describe an agent and get a working draft – a request with example chips, Generate, then the draft streamed in to edit: name, instructions, tools as switches, model, triggers, and the model's open questions to answer before Create
- [Agent Cursors](agent-cursors.md) – Agents working in a document like teammates in a multiplayer editor – live pointers with names, suggestions typed letter by letter, images they resize, code they fix and comments beside the page
- [Agent Findings](agent-findings.md) – A group of agents checking something – one row per agent with its progress, beside a feed of what they've found, newest first, with severity in words, filters and new findings announced
- [Agent Fleet](agent-fleet.md) – Several top-level agents side by side – each card sums up its sub-agents in words, with status, cost and time, and a click opens its tree beside it while the last one folds back into its card
- [Agent Graph](agent-graph.md) – Agents and the tools they call as a living network – a pulse along the link for every call and its answer, busy links growing thicker, agents that breathe while they work and turn amber when they need you
- [Agent Handoff](agent-handoff.md) – A task passed along a chain of agents – at each handoff how much carried over and, in words, what got lost, with the total in the header
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Agent Lanes](agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Agent Ledger](agent-ledger.md) – Everything an agent changed in your systems, each change with an undo – before and after per row, and pointing at Undo shows what builds on it: what would be undone too, and what can't be taken back
- [Agent List](agent-list.md) – Every agent in a workspace, with the failing ones lifted into Needs attention and why in words – search, status chips, sort by name, last run, failures or cost, and a row that opens the agent
- [Agent Monitor](agent-monitor.md) – One agent at work as a compact card – its current step with a clock and the cost so far, a strip of steps sized by duration, the finished steps, and Pause and Stop
- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
- [Agent Queue](agent-queue.md) – The work waiting for your agents, and how fast it moves – jobs drop into a live queue, glide into free worker slots as growing bars and land in Done or Failed, while a depth chart shows the backlog build up when a rate limit pauses the workers and drain when they resume
- [Agent Recap](agent-recap.md) – What your agents did while you were away, for a home page – a small chart of the period with a bar per 15 or 30 minutes stacked by done, failed and needs you and a marker on each notable event, then Needs you, Failed and Done as columns acted on in place, items gliding out as they're handled, and Clear done
- [Agent Steering](agent-steering.md) – Steer an agent while it works – queue a note for the next step and watch it glide into the plan when the agent picks it up, or interrupt right away
- [Agent Summary](agent-summary.md) – One agent's profile – status, model, tools, owner, live and draft versions, two weeks of runs as a daily chart that switches to a table, success rate, median run and cost, recent failures with their errors, and Edit, Run test and Pause
- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Approval Gates](approval-gates.md) – The approval requests of one agent run as a stack of cards – the one to decide now on top with who asks, the diff or arguments and the steps it holds; approve, reject or ask for changes with a note, and it drops into the decided list while the next rises
- [Artifact Panel](artifact-panel.md) – Everything a run produced in one place – files, code, documents and images with a preview for each, versions you can diff, and download
- [Autonomy Dial](autonomy-dial.md) – How much an agent may do on its own – a three-stop dial, and its real actions gliding between “Runs on its own” and “Asks you first”, with a lock for what always asks
- [Away Summary](away-summary.md) – The "while you were away" card at the top of a chat thread – how long you were gone, then what needs you with its action, what failed with Retry, and what's done folded to a count, Mark all seen, and one quiet line when nothing happened
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Collaboration Stream](collaboration-stream.md) – What agents say to each other in a run, as a quiet chat – who to whom on every message, handoffs as slim rows, questions for you with an answer box, files that preview, details with tool calls, filter tabs and an @-composer
- [Conflict Radar](conflict-radar.md) – Which parallel agents touch the same files and where they collide – a grid of files by agents, conflicts first, status in words, and who changed which lines
- [Context Map](context-map.md) – What fills an agent's context window, as a living treemap – system prompt, tools, memory, every file, the chat and tool results as tiles that glide as it grows, the free space dashed, and compaction squeezing old turns into a summary
- [Context Window](context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- [Decision Card](decision-card.md) – One question an agent needs answered before it carries on, docked above the composer – how long it has waited, numbered options with one recommended (focused, never picked), 1–9 to pick, Something else, or Approve and Decline with a reason, a queue to step through, and a receipt with Undo
- [Decision Inbox](decision-inbox.md) – Open decisions with two quick answers each – answered ones confirm and fold away
- [Decision Tree](decision-tree.md) – An agent stuck on a decision lays out its options as a tree – the consequences of each branch, the risky ones marked, its own pick highlighted – and you choose a path or write your own
- [Delegate Board](delegate-board.md) – Hand work to your agents by dragging it onto them – each agent previews its new “busy until” time, or switch to Auto and every new task goes to whoever is free first
- [Eval Criteria Editor](eval-criteria-editor.md) – What an LLM judge asks about each answer – criteria as questions answered pass or fail, on a scale with words at its ends, or with a label, weights shown as each one's share of the score, worked examples, problems in words beside the field, reorder from the keyboard, the assembled judge prompt to copy, and Try on sample
- [Failure Clusters](failure-clusters.md) – Failing chats grouped by topic, biggest first – a size bar, the count and share, the trend in a word and an arrow, the criteria each fails, and a row that opens to a summary, quotes, Open chats, Add to dataset and Mark as known; filtered by criterion, or as bubbles
- [Fallback Chain](fallback-chain.md) – One request finding a model that answers, as a small flow – each model in fallback order, waiting, trying, failed, answered or skipped, with reasons and timings
- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover
- [Handoff](handoff.md) – The agent hands the task to you mid-run – what it did, why it stopped and what it needs – and takes it back when you're done
- [Judge Bracket](judge-bracket.md) – How an LLM judge picks the best of several attempts, as a tournament – matches that fill as verdicts stream in, the winner moving on along its connector and the loser stepping back, any match's two answers with the judge's reason and confidence, and the champion to use
- [Live View](live-view.md) – Watch the agent's screen as it works – its clicks and typing drawn on top, a caption for each step, and Pause or Take over at any moment
- [Parallel Attempts](parallel-attempts.md) – An agent tries the same task several ways at once and the best one wins – every attempt races as a row with its model, approach and live bar, then gets a score; the best is marked and picked, and you can switch to another
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Plan vs Actual](plan-vs-actual.md) – An agent's plan against what really happens – every step's bar grows over its dashed planned ghost, overruns turn amber, the steps after it slide right, and the expected finish moves away from the planned one
- [Review Center](review-center.md) – A focused workspace for what your agents want to do – the queue sorted by risk, one item at a time with the shaky spans marked, Approve, Edit, Reject and Skip on single keys, a stamp as each one leaves and the next one rising in
- [Review Queue](review-queue.md) – Grade real outputs one at a time from the keyboard – the input, output and reference, pass or fail and 1–5 grades per criterion, a note and a suggested verdict, P / F / 1–5 / Enter / J / K / S / U shortcuts with a list on ?, progress with skipped ones counted, and Undo
- [Root Cause Tree](root-cause-tree.md) – How an agent finds out why something failed, as a fault tree – hypotheses with their evidence ruled out one by one, OR and AND branches, and the way from the confirmed cause up to the failure lit
- [Run Checkpoints](run-checkpoints.md) – A run's restore points on a timeline – what each one captured, what going back discards, and “go back to step 4 and try again”, with earlier attempts kept as branches
- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Running Now](running-now.md) – A live status of agents' background tasks for a header or sidebar – one quiet pill, "3 running · 2 need you", opening a panel of tasks under Needs you, Running and Recently done, each with a filling ring, its agent, elapsed time and Review, Stop or Open
- [Sandbox Log](sandbox-log.md) – Command output from the agent's sandbox – a block per step with the command, exit code and time, streaming text in colour, copy and search, fast with long logs
- [Schedule Card](schedule-card.md) – A recurring agent task at a glance – the schedule in words, a live countdown to the next run, the last runs as marks in words with when and how long, and Run now, Pause / Resume and Edit
- [Scheduled Runs](scheduled-runs.md) – Agent tasks placed into a week's sessions under usage limits – pinned first, big tasks split into linked parts, small ones filling gaps, and an Unscheduled list
- [Subagent List](subagent-list.md) – The sub-agents a session started, grouped Active and Done with counts – each with its own drawn mark, what it's doing now, and a clock that ticks while it runs or how long ago it finished; waiting and failed in words, choose one to open it
- [Test Run Panel](test-run-panel.md) – Try an agent while you edit it – a badge for the draft or live version, the conversation with the tools it called folded into rows, test variables sent with every message, Reset, and Save as test case on each reply
- [Test Run Result](test-run-result.md) – A test run that shows only what failed – counts in words over a bar, each failure opening to its message, expected against received, the stack trimmed to the project's own frames and a link to the file and line, passed tests folded into one line, and Re-run failed
- [Tool Access Map](tool-access-map.md) – One agent in the middle and every tool it can reach around it – used, failed, running, not used yet or no access, in words – with each tool's calls and a replay
- [Tool Call Card](tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times

## AI configuration (25)

- [Channel Setup](channel-setup.md) – Connect one channel and set when an agent replies there – Connect, Where (a searchable pick of channels or inboxes), When it replies (every message, mentions, direct messages or business hours), Test and Go live, each checked in words before the next
- [Configuration release control](configuration-release-control.md) – A configuration version moving through environments: the pipeline, a gate on evidence and approvals, confirmed promote and rollback
- [Conversation annotation](conversation-annotation.md) – Label and redact spans in a conversation, rate turns, correct answers as a diff, and send the reviewed example to a dataset
- [Data handling policy](data-handling-policy.md) – Organization data handling as a lifecycle – retention, logs and redaction, memory, training, deletion – led by the effective policy, with locked stages and deletion requests
- [Deploy Channels](deploy-channels.md) – Where an agent can be reached, one row per channel – live first, status as a mark and a word, the version it serves, last week's messages, and Set up, Configure, Pause or Resume
- [Embed Configurator](embed-configurator.md) – Style a site's chat widget beside a live preview – title, greeting, up to four starter prompts to add, move and remove, an accent with its contrast in words, the corner, the radius, the launcher's words and the domains it may load on, with the install snippet to copy
- [Embed Widget](embed-widget.md) – The chat a visitor opens on a website – a corner launcher with an unread count, and a panel with the agent's name and reply time, a greeting, starter questions, the conversation with a person taking over, a message field and a privacy line, styled by the site's accent, radius and side
- [Evaluation Dataset Editor](evaluation-dataset-editor.md) – Edit an eval set's cases, checks, tags and splits, compare it with an earlier version, and import or export it as JSON Lines
- [Instruction Editor](instruction-editor.md) – System and developer instructions with variable chips, missing and unused warnings, an app-supplied token count, versions and a word diff
- [Judge Sampling](judge-sampling.md) – How much of an agent's traffic an LLM judge reads, and what it costs – a stepped rate per segment, rules that always include a chat, the judge model, and live estimates of chats judged a day, the monthly cost and what the sample can see, with a budget cap that warns
- [Knowledge Source Manager](knowledge-source-manager.md) – Sources a knowledge base answers from – ingestion state and progress, docs and chunks, sync schedule, stale and duplicate warnings, and a handoff to chunk review
- [MCP connection manager](mcp-connection-manager.md) – MCP servers at a glance – status and what each exposes; add one (transport, auth, test), inspect its tools, resources and prompts, connect, retry and remove
- [Model Routing](model-routing.md) – Routing rules as a route with a fallback chain, target health, breakers and residency, and a route test that lights up the path taken
- [Model Settings](model-settings.md) – The parameters a model supports, explained, with presets, a value signature, incompatible-setting feedback and what differs from the defaults
- [Multimodal input](multimodal-input.md) – Attach mixed media with local previews, upload state, format limits, and token estimates.
- [Output Schema Builder](output-schema-builder.md) – Build a structured-output schema as a tree beside a rendered preview of the answer – types visible, problems flagged on their rows – with raw JSON and the JSON Schema as tabs
- [Provider connection](provider-connection.md) – A model provider connection read as a path – endpoint, credential, deployment – with each hop's health from an app-run test, the last check and the models it reports
- [Quality Alerts](quality-alerts.md) – Alert rules that read as sentences – "Alert #ops-quality when Correctness drops below 3.5 over 24 hours on at least 50 chats", each slot a labelled field, with an on/off switch, when it last fired, how often it would have fired in the last 30 days, and problems in words
- [Retrieval Settings](retrieval-settings.md) – Chunking, top-k, a score threshold, keyword ↔ vector balance, reranking and metadata filters, edited on a picture of the pipeline, with the app's cost and latency
- [Secrets Manager](secrets-manager.md) – The secrets agents run on, write-only – missing ones first with the agents that need them, expired and expiring next, Set value or Replace in a password field that's handed to the page and forgotten, Delete that names what will stop working, and new secrets by UPPER_SNAKE name
- [Step Inspector](step-inspector.md) – One workflow step's settings – its title and each input with where it comes from, typed in or mapped from an earlier step's output as a chip ("Extract fields › amount"), what's missing in words, Test with sample, and the last run's input and output as JSON
- [Step Picker](step-picker.md) – What to add next to a workflow – a search over step kinds and tools grouped as Triggers, AI, Tools, Logic, People and Output, led by suggested steps with why and recent ones, inline or as a popover by the button that opened it
- [Tool Configuration](tool-configuration.md) – A tool as its API reference entry: name as the title, signature and description, a doc table of parameters edited in place, an example call and the JSON Schema, with the approval it needs
- [Trigger List](trigger-list.md) – Every way an agent starts, one row each – schedule, webhook, event, email or manual in words, when it last fired and how often this week, errors in words, a switch to turn it off, Edit, and Add trigger by kind
- [Workflow Canvas](workflow-canvas.md) – An agent workflow as a node graph – step cards with their kind, status in a mark and a word, and curved labelled connectors; pan and zoom, drag steps and connect them from their ports or the keyboard (M moves, C connects, A adds), a flowing connector into the running step, and the same graph as a list

## AI & chat (56)

- [Agent Face](agent-face.md) – Donovan's animated face, which shows what the agent is doing – nine states that blend on springs, blinks and glances, a nod or a hop, sharp from 16 to 256 px and resting when it isn't busy
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- [AI Summary](ai-summary.md) – The gist of a thread, meeting or set of documents – a TL;DR, a summary that streams in, key points citing their sources as numbered chips, open questions, a note when the sources have moved on, and feedback, Sources, Copy and Regenerate
- [Answer Arena](answer-arena.md) – Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason
- [Before After](before-after.md) – An original and its edit in one frame with a divider to drag between them – labelled sides, arrow keys on the divider, vertical stacking, and a switch to side by side
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Chat History](chat-history.md) – Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats
- [Chat Minimap](chat-minimap.md) – A rail of ticks beside a long chat, one per message you sent, longer for longer ones – the one in view lit, the message on hover or with the arrow keys, a click to jump back to it – following the chat as it scrolls
- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- [Clarifying Questions](clarifying-questions.md) – The agent asks before it starts – two or three quick questions with choices or a short answer, sent back as one reply
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Comment Thread](comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
- [Comments Panel](comments-panel.md) – Comment feed with filters, runnable /edit commands, resolve and a composer
- [Context Tray](context-tray.md) – What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window
- [Conversation Branches](conversation-branches.md) – Edit a past message and the conversation forks – a 2 / 3 switcher on the edited message, and each branch's replies below it
- [Diff Table](diff-table.md) – An AI's proposed edits to a table, reviewed in place – old values struck and new ones marked, added and removed rows, accept or reject per edit, per row or all, undo, a popover with the reason, and edits that sweep in while streaming
- [Digest](digest.md) – A one-minute digest of a pile of information, arranged around what the reader needs – what matters, what to do (ticked off as you go), what changed and what's safe to ignore, with a reading-time estimate and points that cite their sources
- [Edit Region](edit-region.md) – Brush a mask over an image and say what should change – brush, eraser and a box you move from the keyboard, undo and redo, how much is selected, and Generate with the mask as a PNG at the image's size
- [Email Draft](email-draft.md) – Agent-written email for review – switch recipient and tone, edit inline, remove the attachment, send or discard with undo
- [Extraction Review](extraction-review.md) – Fields pulled from a document, each linked to its place on the page – confidence per field, accept, correct or reject, field by field from the keyboard
- [Feedback Rubric](feedback-rubric.md) – Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals
- [File Summary](file-summary.md) – What's in a file without opening it – an AI summary that streams in, key points citing their pages or times, the people, organisations, dates and amounts it mentions, and Copy, Regenerate and Open file
- [Generated UI](generated-ui.md) – A model's answer drawn as real components – tables, charts, metrics, forms and callouts from a spec, checked as it arrives, with plain text for anything unknown
- [Ghost Completion](ghost-completion.md) – Dimmed AI suggestions after the caret as you write – Tab takes them, Ctrl/⌘ + → takes a word, Escape dismisses, and typing the same letters uses them up; asked from the page after typing pauses, aborted when it resumes
- [Guardrail Notice](guardrail-notice.md) – When a policy blocks, redacts or rewrites content – which policy, why, what changed with personal data masked, and a way to ask for review
- [Image Generation](image-generation.md) – One image while it's generated – its place in the queue, then the picture taking shape in a frame of the image's own shape as a blurred preview or colour field clears, the step, percentage and time left, the image fading in when it's done or why it failed with Try again, the prompt with Show more, and Cancel, Download, Regenerate and Copy prompt
- [Image Grid](image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [JSON Viewer](json-viewer.md) – A JSON document laid out for review – Document, Tree and Raw views, search across them, flags with notes on fields, Copy and Download – inline or as a dialog
- [Line Items](line-items.md) – Rows a model reads off an invoice, receipt or claim, to fix, total and confirm – rows that stream in, "Check" on the cells it wasn't sure of, every cell edited in place with locale numbers, a subtotal, tax and total that recompute as you type, and a warning when the total doesn't match the document's
- [Map Itinerary](map-itinerary.md) – A trip planned day by day – the days as tabs, each day's stops in order with times, kinds and travel between them, and the stops on a map drawn from their coordinates, the chosen day's route standing out and tiles loading only on request
- [Memory Panel](memory-panel.md) – What the assistant remembers about you, grouped and editable – a master switch, category filters, and on every memory edit in place, pause or forget with Undo on the tray
- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip
- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Message Drafts](message-drafts.md) – A short text message drafted in two to four tones – edit in place with its length in characters and SMS messages (GSM or Unicode), then Copy, Send or Open in Messages; sending folds it into a receipt
- [Message Status](message-status.md) – The quiet row under a sent message – a read receipt from sending to delivered to read (or Not sent with Retry), a relative time that keeps itself fresh, and Copy, Send again, Branch into a new chat and Edit
- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
- [Multiplayer Thread](multiplayer-thread.md) – One chat thread shared by several people and one model – grouped messages with names, joins and leaves, who's here and typing, @-mentions, a switch for whether the model answers every message or only when mentioned, and "Replying to" on its answers
- [Pixel Loader](pixel-loader.md) – A small working row – a 5 × 5 grid of dots lit in a wave, a snake, a twinkle or an orbit, a shimmering label and the time since the work started, settling into a check or a cross when it ends
- [Point and Ask](point-and-ask.md) – Pin or box parts of an image and ask about them – numbered marks you drag, nudge and resize from the keyboard, a question per mark and one over all, and answers streamed back under each
- [Prompt Library](prompt-library.md) – Saved prompt templates with variables – type straight into the sentence, watch the finished prompt assemble below, and use it once every variable is filled
- [Prompt Starters](prompt-starters.md) – Where to begin, and what to ask next – suggestions for an empty chat and follow-ups after an answer, from the conversation's context
- [Recipe Card](recipe-card.md) – A recipe ready to cook from – servings that scale every quantity (½, 1⅓), metric or imperial with oven temperatures converted, ingredients to tick off, and numbered steps with the current one marked and timers on the steps that name a time
- [Region Overlay](region-overlay.md) – What a vision model read, drawn on the image – numbered boxes linked to a list with each region's kind, confidence in a word and a percentage and the text it read, filtered by kind and a confidence threshold, with the boxes switched off to see the image plainly
- [Response Selection](response-selection.md) – Select part of a model's answer and act on it – reply quoting it, ask why, or request an edit that comes back as a diff to accept or reject
- [Retrieval Inspector](retrieval-inspector.md) – What the model was given to answer with – every retrieved chunk with its score, source, freshness, and whether the answer used it
- [Selection Translate](selection-translate.md) – Select text and translate it – the translation in a card with the detected language, copy, replace in place and show original
- [Session State](session-state.md) – Where a long LLM session stands – a health pill, tiles for the primary goal, open loops, pending artifacts and context pressure with a meter that warns as it fills, and status chips, the tiles optionally opening what they count
- [Smart Recommendation](smart-recommendation.md) – Suggestion card with a confidence signal, alternatives to switch to and accept with undo
- [Speed Reader](speed-reader.md) – Speed reading one word at a time in a fixed frame – the recognition point on a guide mark, longer pauses at sentence ends, 100–1000 words a minute, 1–3 words at a time, a scrubber with the time left, and the sentence around the word when paused
- [Structured Output](structured-output.md) – Streaming JSON as a typed tree, checked against its schema as it arrives – missing and invalid fields flagged, copy as JSON or code
- [Text To Speech](text-to-speech.md) – Reads a passage aloud with the browser's voices – the sentence and the spoken word marked as it goes, click a sentence to read from there, play, pause, skip and stop, and a voice, speed and pitch picker
- [Thinking Loader](thinking-loader.md) – A small working pill for AI replies – an eight-ray spinner and a shimmering label that rolls through phases and settles on a check
- [Thinking State](thinking-state.md) – AI working panel with a live timer, searched sources and thinking steps that appear one by one
- [Voice Mode](voice-mode.md) – A spoken conversation with the model – live transcript, listening and speaking states, interrupt, mute and end, with captions for every turn
- [Writing Assistant](writing-assistant.md) – AI chat card with a soft gradient glow, suggestions, streaming replies and live voice dictation

## Data & charts (26)

- [Active Days](active-days.md) – A daily goal month by month – each day's date in a small ring filled towards the goal, a check when it's met, months running on down with their names sticking, the month's days at goal, best streak and busiest weekday, and any day's value and share of the goal on hover or focus
- [Activity Calendar](activity-calendar.md) – A year of activity at a glance – a square per day in a column per week, shaded by how much happened, with month and weekday names, the total, and any day's value on hover or focus
- [Activity Clock](activity-clock.md) – When activity happens, a clock per day – an AM ring and a PM ring of hour segments shaded by how busy each hour was, the weekday and date in the middle, and any hour's value there on hover or focus
- [Billing Schedule](billing-schedule.md) – Build a billing phase – start date, duration, products with repeats and timing, discount, minimum and live totals
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Change Impact](change-impact.md) – Did a change make the agent better or worse – before against after per judge criterion as a dumbbell, the difference and a verdict in words (Better, likely · No clear change · Worse, likely) from the counts, cost and latency, sample sizes, a summing-up line and a segment switch
- [Change Summary](change-summary.md) – What moved since last time – one metric per row with a colored trend
- [Compact Breakdown](compact-breakdown.md) – A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Day Rhythm](day-rhythm.md) – A typical day as a strip of blocks by kind of place or activity – Home, Work, Transit – one row per kind of day, with hour ticks, a now marker, a legend and the block under the pointer named in full
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Experiment Card](experiment-card.md) – An A/B test in two lines that quietly unfolds on hover – variants linked to a tiny chart, a metric switch with rolling numbers, and a winner you pick with a click
- [Footnotes](footnotes.md) – A quiet card of caveats and notes under a page's charts – numbered or bulleted, each with an optional link an app's router can take, and nothing at all when there are none
- [Gauge](gauge.md) – One value against its range as a 270° dial, a half dial or a bar – the value in big type with the band it's in, bands and ticks round it, a target line and the change since last time; optionally a slider you drag or move with the keys
- [Heatmap](heatmap.md) – A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Ops Overview](ops-overview.md) – An operations overview in one dense strip – a status line, a health pill and count tiles, each with its change since the last period in words and green or red by which way is good, an optional sparkline and tone, optionally opening what it counts
- [Project Card](project-card.md) – A two-line project summary that quietly unfolds on hover – a progress ring with one segment per subtask, a people filter and a status picker, all linked by hover
- [Quality Drop](quality-drop.md) – One drop in a judge score on live chats – what fell and since when, a small chart round it, the likely cause with how sure in words and failing chats as quotes, the topics it clusters in, and Roll back (after saying what reverts), Investigate or Dismiss as expected
- [Quality Trend](quality-trend.md) – Judge scores on live chats day by day – a line per criterion with a band from its sample size, the changes pinned on the time axis, a sentence saying what moved since the latest one, a 7 / 30 / 90-day switch, criterion toggles and a table view
- [Radar Chart](radar-chart.md) – A few measures on axes round a centre, joined into a shape – one series with its value on each axis, or up to three compared – as a cross of axes or a web of rings, with a table view
- [Score Ring](score-ring.md) – One overall score from weighted sub-scores – a ring with a segment per part as long as its weight and filled to its score, the score and its band in the middle, a row per part that isolates its segment, and the metrics behind the score
- [Score Summary](score-summary.md) – NPS or CSAT results – the score in big type, the change since last time with a sparkline, the target, the bands with shares and counts, and a bar per score you can pick to filter comments
- [SLA Status](sla-status.md) – How well service levels are met – the share on time, a Met / At risk / Breached split in words and marks, a weekly trend, a bar per type of request with a readout, and a period chooser
- [Sparkline](sparkline.md) – A small trend chart that sits in text or a table cell – line, area, bars or win-loss, sized from the text – with markers, a reference line, a tone for which way it went and, when interactive, a tooltip per point
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

## Feedback & onboarding (10)

- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
- [Notification Stack](notification-stack.md) – Notice cards stacked behind each other – dismiss the front one to reveal the next
- [Notifications](notifications.md) – The notification center – a bell with an unread badge that opens a panel of notifications grouped by day, with tabs, read state, inline actions, Mark all as read and Load more
- [Progress Tracker](progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Score Survey](score-survey.md) – The NPS or CSAT question a person answers – eleven numbers with the bands shown quietly, or five faces with words; number keys pick, a follow-up per band, Submit and a thank-you with Change answer
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Stories](stories.md) – Avatars for people and accounts with a gradient ring for something new – open one for a "what changed" brief: a bento grid of metric, status, note, list, image and link tiles
- [Terms Dialog](terms-dialog.md) – Agreeing to terms in a modal designed for reading – version and date, a jump list, what changed since you last agreed, required and optional consents, and Accept that says why it waits
- [Tips Panel](tips-panel.md) – Grid of short tips with one action each – taken tips turn into a done state
- [Toaster](toaster.md) – Calm toasts from anywhere – a stack that fans out on hover, promise toasts that morph from spinner to check, swipe to dismiss

## Inputs & controls (41)

- [App Picker](app-picker.md) – The app launcher for a suite header – a grid button that opens your apps as tiles, with pinned and recent apps, search, the current app marked and arrow keys that move in two dimensions
- [Breadcrumbs](breadcrumbs.md) – Where you are in a hierarchy as a trail of links: the current page last, the middle folding into "…" when it doesn't fit or passes `max`, a cancelable `tc-navigate` for routing, and Copy path
- [Bulk Action Bar](bulk-action-bar.md) – What can be done to everything selected – how many, the page's actions, Select all and Clear, a question before danger, and Undo for a few seconds afterwards
- [Button](button.md) – Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state
- [Checkbox](checkbox.md) – A form-associated boolean choice
- [Color Picker](color-picker.md) – Pick a colour – a saturation and brightness square, hue and opacity sliders, HEX / RGB / CMYK fields that convert as you type, an eyedropper where the browser has one, swatches, Copy, and the previous colour one press away
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [Date Range Picker](date-range-picker.md) – Presets and two calendars with a hover preview, comparison with the previous period or year, full keyboard control
- [Dialog](dialog.md) – A native modal with interactive content and restored focus
- [Dropzone](dropzone.md) – Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry
- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [HAL Form](hal-form.md) – A form the server describes – a HAL-FORMS document drawn as controls, every type and inline or linked options, checked by its rules and sent as its template asks, as JSON, form encoding or a query string
- [Header Brand](header-brand.md) – The product's logo and name at the start of a full-width app header – a link home an app's router can take over, sized from the page, never clipped, with an inverse look for a dark bar
- [Integration Picker](integration-picker.md) – Integrations page of a command menu – search, a list of services and the picked one with its connection on two tiles
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
- [ISBN Details](isbn-details.md) – ISBN numbers in text, validated and marked – hover or focus one for the book's cover, title, authors, publisher, year and pages
- [Number Field](number-field.md) – A bounded numeric input with native validation
- [OTP Input](otp-input.md) – The verification code field done right – a gliding focus ring, paste and SMS autofill, a calm shake on errors and a morph into Verified
- [Profile Menu](profile-menu.md) – Account card with the signed-in user, menu actions and profile setup progress
- [Radio Group](radio-group.md) – A native keyboard-operated single choice
- [Reaction Bar](reaction-bar.md) – Like, comment, repost and share in one pill – icons pop and fill, counts roll in digit by digit
- [Secret Field](secret-field.md) – A masked credential input with an explicit reveal control
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Select](select.md) – A plain single-choice dropdown – a secondary-button trigger with the chosen option opens a list with a check on it, optional descriptions and disabled options, arrow keys and type-ahead
- [Selection Toolbar](selection-toolbar.md) – The formatting bar that floats over selected text: quick actions, toggles like bold and italic that show what's on, menus for text style, colour and list, and a link – it fires commands for the page's editor to apply.
- [Sensitivity Label Picker](sensitivity-label-picker.md) – Sets a file's classification – a mark and word on a small button, a list of labels with what each means, and a reason asked before lowering it
- [Share Panel](share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
- [Side Nav](side-nav.md) – An app's main navigation down the side – brand, places with icons and badges in sections, the current page, real links with a cancelable `tc-navigate` for routing, a footer of the page's own and a fold into an icon-only rail
- [Signature Pad](signature-pad.md) – A form field for signing – draw with a mouse, pen or finger in ink that follows speed and pressure, or type the name in a script face; undo and clear, the signer, the date and a statement below, submitted with the form, and exported as SVG or an image
- [Slider Field](slider-field.md) – A synchronized slider and numeric input
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Switch](switch.md) – An accessible on/off setting
- [Tag Input](tag-input.md) – A field of free-text chips: add with Enter, a comma or Tab, or paste several at once, with suggestions, a limit, no duplicates, your own validation with the reason shown, and keyboard removal
- [Team Flag Editor](team-flag-editor.md) – Where a team decides what its flags mean – each flag's colour, name, meaning and order, with a check on names and a question before removing a flag that's on files.
- [Team Flag Picker](team-flag-picker.md) – Picks one of a team's flags for a file – a small button with the flag's colour and name, opening a list of flags with what each one means.
- [Text Annotator](text-annotator.md) – Highlight text in a document in a colour and comment on it – marks in the text, comments in the margin, edit, resolve and filter
- [To-do List](todo-list.md) – A to-do list people keep themselves – add, tick off, edit in place, move with Alt + arrows and remove with Undo, with All / To do / Done tabs, progress and Clear done
- [Tooltip](tooltip.md) – Keyboard, pointer and touch help text
- [Tree Select](tree-select.md) – Pick one or many from a nested hierarchy: the picked path in the field, a filterable tree with the parents of every match kept, ARIA tree keys, and parent checkboxes that check what's beneath them
- [Year List](year-list.md) – Years to choose one from, newest first – a column, or a row that scrolls – with a count on each, keyboard moves that don't choose, and typing a year to jump to it

## People & profiles (27)

- [Account List](account-list.md) – The financial accounts linked to a person or a company – institution, type, an IBAN-style identifier masked until shown one at a time, a balance or flagged amount and a status each (Monitored, Flagged, Under review, Closed or your own), with your own stats above
- [Alert Feed](alert-feed.md) – A live feed of alerts, newest first – category, severity as an edge, mark and word, a fresh relative time, Escalate and Acknowledge on each, Pause feed with new alerts held back, and polite announcements
- [Asset List](asset-list.md) – The assets on record for a person, an account or a company, in groups – each with its kind, name, an identifier masked to its last four characters until shown, a detail line, what it's linked to and a status in words, with Open per row
- [Biometric Status](biometric-status.md) – Where someone's biometric enrolment stands – face, fingerprints, iris, voice and more, each with its status, detail and quality meter, the count enrolled and an optional match score
- [Co-Occurrence](co-occurrence.md) – Who keeps turning up alongside a subject – accounts, cards, devices or people ranked by shared events, each with a strength in words and bars, a score, the share of events, a count per source and when last seen, opening onto the shared events themselves
- [Contact Channels](contact-channels.md) – The ways to reach a person or an account, grouped as Email, Phone, Messaging and Address – each masked until shown, with its role, when it was last used, how far it's verified, Copy and the page's own actions
- [Coordinate Details](coordinate-details.md) – Coordinates in text, checked and marked – hover, focus or right-click one for the place, decimal and DMS with Copy, mapping links and a map that loads only on request
- [Document List](document-list.md) – Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row
- [Entity Details](entity-details.md) – Email addresses, phone numbers, links and @handles in text, found and marked – hover, focus or right-click one for its domain, country or site (with an http warning), Copy, Write email / Call / Open, and what your directory knows about it
- [Entity Timeline](entity-timeline.md) – What happened to a person, account or case, in order – events under month headers, each with a category, its source and Admiralty grade tinted by confidence, an optional flag and a detail that opens in place, filtered by category chips with counts
- [Evidence List](evidence-list.md) – The exhibits behind a matter – reference, title, type, source with its grade, date, holder and a status in words, each opening onto its chain of custody with every step's hash, copyable, and whether the hashes agree
- [Fact Sheet](fact-sheet.md) – What's known and how far to trust it – facts in sections, each value tagged with its source and an Admiralty grade, tinted and marked by confidence, with conflicting readings side by side and unknowns said plainly
- [Fingerprint Card](fingerprint-card.md) – A ten-print card – each finger's print and status in ANSI/NIST positions, captured with its NFIQ quality, poor, not captured, unable to print or bandaged, and a finger's detail
- [Geo Location](geo-location.md) – Coordinates made useful – decimal or degrees-minutes-seconds, Copy, Open in Google Maps, Apple Maps, OpenStreetMap, Bing or your own tools, and an embedded map that loads nothing until Show map
- [Identifier Details](identifier-details.md) – DOIs, IP addresses, file hashes, CVE ids and tracking numbers in text, found, checked and marked – hover, focus or right-click one for its normalised value with Copy, its range, algorithm, year or carrier, doi.org and NVD links, and what your sources know (severity, owner, status)
- [Money Flow](money-flow.md) – How money moved between entities – people, companies, shells and banks in columns, transfers as bands sized by amount with flag chips, an entity's or a transfer's flows lit with a readout in words, a list of every transfer and a table view
- [Multi Calendar](multi-calendar.md) – A calendar of calendars: many people's Google, Outlook, Exchange and iCal calendars in one Day, Week, Month, Agenda or People view, with show/hide per calendar, conflicts across a person's calendars, and create, edit, drag-to-move and delete on writable ones
- [Org Chart](org-chart.md) – Who reports to whom – people's cards joined by reporting lines, branches that fold, search that opens the way to matches, a picked person's manager and reports, pan and zoom, and an outline when narrow
- [Person Hovercard](person-hovercard.md) – The profile card behind any name – picture, pronouns, title and team, status, local time and time difference, manager, Email, Message, View profile and links – on hover, focus or tap
- [Person Links](person-links.md) – The people linked to a person or an account – role, an ID or second line, and how strong each link is in words and bars, with a count, a "View network" action and "Show all"
- [Place List](place-list.md) – The places on record – type with an icon, Confirmed / Unverified / Vacated in words, address, coordinates and when each applies, with a place picked for a map
- [Profile Header](profile-header.md) – The top of a person's or an account's page – picture or initials, name, status and tags, other names as chips, a line of key facts, the page's actions and a row of section tabs
- [Relationship Graph](relationship-graph.md) – Connections between people and organisations around one of them – direct and second-hand rings in a fixed layout, relationships drawn by strength, re-centring on click, and a panel and keyboard list of every connection
- [Team Roster](team-roster.md) – A team directory with everyone's local time – status, role and team, how far ahead or behind you they are, whether they're working, skills – grouped and filtered as a list or a grid, with the team's best hour to meet
- [Time Details](time-details.md) – Times in text, found and underlined – hover or focus one for “Your local time”: the time in the reader’s own zone, with the weekday and date when the day changes; times without a zone, versions and rooms stay plain
- [Travel Itinerary](travel-itinerary.md) – Trips as legs for a travel or expense audit – route codes, mode and carrier, the document used, confidence as a meter and %, source and grade, flags such as No record or Cash ticket in words, and connecting legs grouped into journeys
- [Watchlist](watchlist.md) – The people, accounts or entities a team is watching, most at risk first – avatar, reference, case tag and a risk badge in words, with a count, filters by risk and View all

## Research & portfolio (19)

- [Audience Mix](audience-mix.md) – Who is reading – a sector mix as bars, an internal-versus-external split and the top places, each with its share, and the row under the pointer or focus named in full
- [Bibliography](bibliography.md) – A reading list set in APA, MLA, Chicago (notes–bibliography), Harvard or IEEE, with live DOIs, tags, search and sort, Copy, and export as BibTeX, RIS or plain text
- [Budget Burn](budget-burn.md) – How fast each budget is being spent – spent against budget, the burn as a bar with a pace marker and Ahead, On or Behind pace in words, people and team, totals in the header and a sort by budget or burn
- [Capacity Bars](capacity-bars.md) – How loaded each person is – their allocation split by what they work on, against their capacity on one shared scale, each piece named with its amount, anyone over capacity marked and counted
- [Citation Badge](citation-badge.md) – A small badge of how a work is cited – publications, supporting, mentioning and contrasting counts with their marks, labelled or compact, a tooltip saying what each means and an optional link to the details
- [Citation Sections](citation-sections.md) – Where a work is cited – a donut of citing sections (Intro, Methods, Results, Discussion, Other) shaded darkest first, a legend with letter chips and counts, and the section under the pointer or focus with its share
- [Coverage Ring](coverage-ring.md) – One share at a glance – a large ring with the percentage and a caption, a title and a line, and a bar from healthiest to needs attention that reads out each segment
- [Gap Exposure](gap-exposure.md) – Gaps or risks and whether anyone is working on them – severity in words and a mark, the item and its priority, coverage, owner and what's invested, with the severe uncovered ones called out, grouping by priority or severity and an uncovered-only switch
- [Grade Distribution](grade-distribution.md) – How a set of assessments came out – a count over each grade (Outstanding to Dissatisfactory, or your own), how many were assessed, empty grades muted, an optional bar in proportion and a grade picked as a filter
- [Investment Balance](investment-balance.md) – Are dollars and people following priority? – each tier's share of items, budget and people side by side as numbers and bars, over- and under-invested tiers flagged in words, and the biggest mismatch said in one line
- [Org Unit Card](org-unit-card.md) – An organisational unit at a glance – code, name, lead, On track / Watch / At risk counts, the page's stats with a spent-of-budget bar, and teams that fold open onto their topics' priority, coverage, open gaps and momentum
- [Prioritisation Matrix](prioritisation-matrix.md) – Value against effort as a 2 × 2 – numbered points you drag or move with the arrow keys, gathered when they overlap, and the items listed by quadrant beside it
- [Priority List](priority-list.md) – A portfolio's topics or projects by priority – a tier badge, owner and team, health in words, momentum as a line with its change, coverage as a bar, what's open and the work in flight, with health filters and groups per priority
- [Publication Impact](publication-impact.md) – One paper's impact on one card – venue, topic, grade and authors, downloads, views, citations and attention with a reads sparkline, mentions, who is reading, and peer, reader and sponsor feedback with a sentiment each
- [Risk Register](risk-register.md) – A 5 × 5 likelihood × impact heat grid with counts and moves since the last review, beside a sortable register whose risks open with their mitigation and can be rescored
- [Roadmap Timeline](roadmap-timeline.md) – Workstreams on a calendar, Gantt style – lanes, bars with progress and status, milestones, a Today line and dependency arrows (red when dates clash), at week, month or quarter scale, with details for the work you select
- [Status Tracker](status-tracker.md) – Where work stands in a fixed sequence of steps – gates or stages on a line, each cleared, pending, blocked or not reached in words and marks, the line filling as they clear, the current step marked, a legend, and a step's evidence record on click
- [Traceability Spine](traceability-spine.md) – The chain from open questions to outcomes – a column per stage from questions and gaps to work, papers and who cites them, linked cards joined by lines, and a card's whole path traced on click with the rest dimmed
- [Work Item](work-item.md) – One piece of work as a card – status in words, a note, progress, a due date marked when overdue, people, what it delivers, spent against budget, effort and a "Synced · read-only" source, the whole card opening it

## Search (7)

- [AI Search](ai-search.md) – One search box with an AI mode – recent and suggested searches as you type, a multi-line prompt with example prompts in AI mode, Search within file contents, removable scope chips, Clear and ⌘K
- [Facet Sidebar](facet-sidebar.md) – Filters beside search results, with counts – checkbox, radio, range and date facets that fold, the filters in use as removable chips with Clear all, Show more and a search box in long facets
- [Query Builder](query-builder.md) – A search query built from conditions – a field, an operator that fits its type and a value per condition, AND / OR per group with one level of nesting, and the query read back in words and as a query string with Copy and Run
- [Results List](results-list.md) – Search results to read and open – kind, title, a snippet with the query's words marked, source and date, grouped by kind with counts, Relevance / Date, “Did you mean” and Show more
- [Routine Form](routine-form.md) – Set up a routine: name, frequency and start time in a time zone with the next run worked out, first run now or on schedule, email notifications and instructions, with Dismiss and Create routine
- [Saved Search Alerts](saved-search-alerts.md) – Saved searches that tell you about new matches – “12 new since Tue”, how often and where each one checks, pause, Run now, remove with Undo, and Add alert from the current search
- [Search History](search-history.md) – Recent and saved searches – tabs with counts, a filter, searches grouped by day with scope chips, result counts and times, and Run again, a save star and Remove with Undo on each

## Workspace & sessions (28)

- [Branch Switcher](branch-switcher.md) – the current branch with ahead/behind counts and a filterable list of worktrees, local and remote branches to switch to or create from.
- [Change List](change-list.md) – Proposed code changes as compact rows – state, title, where it is, lines added and removed, and its checks, with a menu per row and Show more.
- [Check Status](check-status.md) – The automated checks on a change – a summary in words and a row for each, failing first, with Re-run, or just a mark and "5/11" for a list row.
- [Collection Card](collection-card.md) – A card that introduces a whole collection and links into it – up to three previews, the title with its counts, a bold line, a description, the names inside as many as fit in two lines, and Browse →; the whole card is one target and its words stay selectable
- [Console Panel](console-panel.md) – A web page's browser console: level chips with counts, a text filter, repeat badges, sources, and stacks that fold open.
- [Diff Viewer](diff-viewer.md) – The changes to a set of files – totals, a row per file with its status and lines added and removed, opening to a line diff
- [Element Inspector](element-inspector.md) – A page's elements as a tree written like the markup, beside the chosen element's box model and styles; hovering an element fires an event so the page can outline it in a preview.
- [Environment List](environment-list.md) – Where a session runs, as rows of machine, folders, repository and branch, each with an optional small action or a switch.
- [File Tree](file-tree.md) – A project's files – folders that fold, a filter, an icon per kind of file and a Git status, with search inside files left to the page
- [Fine-tune Card](fine-tune-card.md) – An inspector where an agent tunes a design and the person takes over – numbers you drag or type, a percentage, a choice and swatches over a live preview, the agent's changes counted in and marked, and a revert
- [Icon Rail](icon-rail.md) – A row of icon buttons for a panel – one chosen, a tooltip on each, one tab stop, and an optional More menu.
- [Meter Row](meter-row.md) – How full something is on one line – a label, a percentage and a tiny bar, with a mark and a word when it's getting full; can open the details or sit compact beside a value.
- [Network Log](network-log.md) – The requests a web page made: status, method, name, size, time and a waterfall, with type chips and a detail of headers and response.
- [Panel Card](panel-card.md) – One section of a side panel – a heading, a short value and content that glides open and shut, or a row that opens something else.
- [Panel Dock](panel-dock.md) – One side panel beside a chat, with a tab per open item – an artifact, a file, a source or a preview – resized from its edge, folded to a rail of icons, closed with Escape, and a full-width sheet when space is narrow
- [PR Link](pr-link.md) – A pull request named in running text – its state's mark and owner/repo#number · title as a link, with a card of its state, author, lines changed and files on hover or focus; compact for just #number
- [Preview Card](preview-card.md) – A gallery tile – a large preview above a one-line title and a two-line description; a picture or a live component scaled down from its design width, a badge, a horizontal list form and a loading skeleton, the whole card one link
- [Preview Frame](preview-frame.md) – a browser pane around a page the app supplies: address, back, forward and reload, phone, tablet and desktop widths zoomed to fit, a console count, tabs, and loading, error and empty states.
- [Problem List](problem-list.md) – diagnostics from a build, type check or linter, grouped by file, with a severity filter with counts, a text filter, severity marks that aren't colour alone, and quick fixes.
- [Process List](process-list.md) – dev servers and background jobs with status, port link, uptime, CPU and memory, and last output, with Stop, Start, Restart and View output.
- [Pull Request](pull-request.md) – one pull request at a glance: branches, review, checks, whether it can merge, and the button its state calls for.
- [Route Map](route-map.md) – An app's routes as an indented list with :params picked out, a status mark and word, load time and last visit; status chips filter it, and pressing a route opens it.
- [Search Results](search-results.md) – results of a search across files, grouped by file with the matched text marked, with match case, whole word and regular expression toggles, collapse all, and an optional replace preview.
- [Session List](session-list.md) – sessions in a sidebar, pinned first and grouped by project or status, with status, unread dot, branch, time, Pin and Archive.
- [Session Tabs](session-tabs.md) – Open chats as tabs above a thread – status as a mark and a word, unread dots, close, drag or Alt+Shift+arrows to reorder, and a menu of the tabs scrolled out of view
- [Terminal](terminal.md) – A command line for a panel – output in colour above a prompt with history, Ctrl+C and Ctrl+L; the page runs the commands
- [Thread Header](thread-header.md) – The bar at the top of a chat thread – the title renamed in place, model and project chips, Share, side-panel toggles and a menu of actions, folding into the menu when narrow
- [Web Vitals](web-vitals.md) – A tile per measure (LCP, INP, CLS, FCP, TTFB or the page's own) with its value, a Good / Needs improvement / Poor word, a three-zone track and earlier readings, plus an optional Mobile / Desktop switch.

## Charts (39)

- [Area Chart](area-chart.md) – Totals and their make-up over time as filled areas – stacked, stacked to 100% or overlapping – with names at their ends, the nearest month read across every series, and a table view
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Beeswarm Chart](beeswarm-chart.md) – A distribution point by point – every value a dot pushed clear of the others, in one row or a row per group with its median marked – the highest group emphasised, dots that grow in, and a canvas for thousands of points
- [Box Plot](box-plot.md) – How values spread within each group – quartile boxes with medians, whiskers to 1.5 IQR and outlier rings, or violins, or both – the highest median emphasised, boxes that open from their medians, and a table view
- [Bubble Chart](bubble-chart.md) – Points by two values with a third as the circle's area, or a scatter plot without it – the largest emphasised and named where names fit, points by group with a legend that isolates, hides and shows each group, stat tiles under it, and a canvas for thousands of points
- [Bullet Chart](bullet-chart.md) – Each measure against its target and poor–fair–good ranges, one row each – the one furthest behind in the accent, its own scale or one shared, quiet or status-tinted bands, values at the right
- [Bump Chart](bump-chart.md) – How items' ranks change step to step, one line each with first place on top – ranks given or worked out from values, the biggest climber in the accent, names at both ends, lines that draw in and glide
- [Calendar Heatmap](calendar-heatmap.md) – An amount per day on a grid of weeks, each day shaded from light to the full accent, the busiest outlined, a year per row over several years, a scale legend, weeks that fade in, a canvas for long ranges, and a table view
- [Candlestick Chart](candlestick-chart.md) – A reading's open, high, low and close per period as candles – hollow when it rose, solid when it fell – with moving averages, a volume strip, the latest close tagged, a range to pick or zoom into, and a table view
- [Chart](chart.md) – Any of the library's charts from a JSON spec – checked first, then drawn with the chart the spec names; what's wrong shown instead of a chart; the same specs draw as SVG on a server
- [Chord Chart](chord-chart.md) – What a handful of groups exchange with each other – an arc per group sized by what it sends and receives, a ribbon per pair showing both directions, the largest group and its ribbons in the accent, and a table view
- [Combo Chart](combo-chart.md) – Bars and lines over one shared x, grouped or stacked bars with lines and dots, a second axis at the right when the ranges are far apart, and a legend that tells bars from lines and names their axis.
- [Donut Chart](donut-chart.md) – Shares of a whole round a hole holding the total, with a legend of every slice and its share beside or under it, slices that sweep round and a total that counts up
- [Dumbbell Chart](dumbbell-chart.md) – Two values per item, before and after or target and actual, as a hollow and a solid dot joined by a bar, ordered by the second, the biggest move emphasised, bars that stretch in, and a table view
- [Funnel Chart](funnel-chart.md) – How many are left at each step of a process as centred bars narrowing down the page, joined by curved necks, each step's rate against the one before or the first, the biggest drop emphasised, and a table view
- [Hexbin Chart](hexbin-chart.md) – Thousands of points by x and y gathered into hexagons shaded by count, or the sum or mean of a value, with a ramp legend and the densest ringed.
- [Histogram](histogram.md) – How raw numbers spread, as touching bars on round bin edges, with the tallest bin emphasised, a running total, a density curve and mean and median lines if wanted.
- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Lollipop Chart](lollipop-chart.md) – One value per item as a thin stem and dot, ordered from the largest, lying down or upright, the largest emphasised, values past the dots, missing ones written "–", stems that grow in and glide when the data changes, and a table view
- [Marimekko Chart](marimekko-chart.md) – Two shares in one picture – columns as wide as their share of the whole, each stacked to 100% by series – one series emphasised and named in a legend, blocks that rise and glide when the data changes, and a table view
- [Network Graph](network-graph.md) – Any nodes and links laid out by force, so clusters and bridges show for themselves, with groups in their own inks, the most-linked named, a node's neighbourhood lit on hover or focus, and nodes that can be dragged into place.
- [Parallel Chart](parallel-chart.md) – Parallel coordinates: rows as lines across a vertical axis per measure, each on its own scale, axes that can run upside down, one row emphasised and named, gaps for missing values, a canvas for many rows, and a table view
- [Pareto Chart](pareto-chart.md) – Which few items make most of a whole – bars from the largest down, the running share as a line across them, a dashed 80% threshold, the bars that reach it emphasised and their share beside the line, with a table view
- [Pie Chart](pie-chart.md) – A few shares of a whole as slices, each in its own ink or one emphasised, the shares written beside them and the pointed-at slice lifting out
- [Radial Bar Chart](radial-bar-chart.md) – A few ratios as rings round a centre, each filled towards its target – the largest emphasised, each named with its value where its ring starts, or activity rings with a lap past each target and a tile per ring – rings that sweep round in turn
- [Ridgeline Chart](ridgeline-chart.md) – How values spread across many groups as overlapping density ridges, each with a tick at its median – the highest median emphasised, sortable by median, ridges that rise and reshape when the data changes, and a table view
- [Rose Chart](rose-chart.md) – A polar area (Nightingale rose) chart: equal-angle wedges whose area shows each value, the largest emphasised, stacked by series with a legend if wanted, with round-value rings.
- [Sankey Chart](sankey-chart.md) – How an amount flows between stages – nodes in columns by step, flows as bands as wide as their value, one node and its flows in the accent, a node's or flow's path lit on hover, and a table view
- [Segmented Bar](segmented-bar.md) – Shares of one whole as a single bar cut into parts, with a list of names, values and shares – largest first in the accent, the rest in quiet shades or chart inks, tall or thin, parts that grow and glide
- [Slope Chart](slope-chart.md) – How each item changed between two moments, as lines from first value to last, the biggest rise emphasised, names and values nudged apart on both sides, lines that draw themselves in, and a table view
- [Small Multiples](small-multiples.md) – One chart repeated in a grid, a panel per value of a field – any chart a spec can draw – on a shared scale, with one legend, linked pointing and columns that fit the width.
- [Stage Bars](stage-bars.md) – A funnel as a list – a rounded pill per stage sized to its share of the first, the count and share beside it, a headline that follows the pointer with the change chip, stat tiles, an optional period switch that re-grows the pills, and a table view
- [Stream Graph](stream-graph.md) – Several series flowing over time, stacked round a moving centre line – the largest emphasised against shades of the quiet ink, layers ordered inside-out and named beside their ends – every series read at the nearest x
- [Sunburst Chart](sunburst-chart.md) – A hierarchy as rings, top level innermost – the largest leaf and its path to the centre emphasised, outer names and shares beside the circle, inner names on card-coloured chips, rings that sweep round in turn
- [Treemap](treemap.md) – Parts of a whole as squarified tiles sized by value, nested under group headers with their shares – the largest emphasised, names and shares on card-coloured chips in tiles big enough, tiles that grow in and glide on change
- [Venn Diagram](venn-diagram.md) – How two or three sets overlap, as circles sized by the sets, with each region's own count on a chip and the three largest drawn when there are more.
- [Waffle Chart](waffle-chart.md) – Shares of a whole as a grid of 100 cells, one category emphasised with its share written large beside it, the rest in the chart inks with a legend, cells that pop in one by one and a share that counts up, and a table view
- [Waterfall Chart](waterfall-chart.md) – How a starting figure becomes an ending one – steps up and down bridged by dashed connectors, totals on the baseline, rises and falls in the status inks with a legend, signed changes beside each bar and a table view
- [Week Bars](week-bars.md) – A week of daily totals as rounded bars against a dashed goal line – days that reach it in the accent, the week's total counting up with the average per day, a week switcher the bars glide between, today marked, and a table view

## Trust & calibration (37)

- [Access Request](access-request.md) – Ask for access to one piece of data – the resource with its owner and classification in words, the level, how long, a required justification and the fields needed – then where it stands: pending with who decides, approved with the time left, denied with the reason, or expired
- [Agreement Tracker](agreement-tracker.md) – How often the AI agreed with you versus pushed back this session – it turns amber on a run of agreement and points to the counter-argument
- [Approval Chain](approval-chain.md) – Several people signing off in order – who's next and who's overdue in words, with Approve, Decline with a note, and Delegate for the person it's waiting on
- [Attestation Check](attestation-check.md) – Verify a signed evidence package by its hash or file – signature, chain integrity and what it covers, checked locally
- [Capability Notice](capability-notice.md) – When a request falls where the AI is only partly proven or not proven – a capped confidence, who was notified, and how far the request is from the usual
- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it
- [Confidence Brief](confidence-brief.md) – An answer explained for someone who wasn't there – what we conclude, the kind of uncertainty, what would change it, assumptions, signs to watch and the track record
- [Content Shield](content-shield.md) – Keeps content unloaded until someone chooses to see it – a picture, the reason and Show, with the content cloned in only on reveal and removed again on Hide
- [Correction Propagation](correction-propagation.md) – How far a correction reaches – every artifact and released package that cites the corrected claim, each sent for review, nothing rewritten behind your back
- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [Disagreement Banner](disagreement-banner.md) – When today's answer contradicts an earlier one on the same question – both side by side, the difference marked
- [Engagement Quality](engagement-quality.md) – Whether reviews are genuine – an index from reused text, time on the source, batch dismissals and repeated commitments, shown as quality, not a violation
- [Evidence Coverage](evidence-coverage.md) – What an answer could and couldn't see – each source category current, stale or missing, with a request for coverage
- [Friction Profile](friction-profile.md) – Switch between standard, elevated and deadline modes and see how each safeguard changes – shortened, deferred or tightened
- [Gate Config](gate-config.md) – When a person decides – the conditions that pause a run, who reviews, what they see, and what they're allowed to do
- [Handoff Brief](handoff-brief.md) – Work passing from one person to another – summary, open items and commitments, each acknowledged by the receiver, blocked when they lack access
- [Kill Switch](kill-switch.md) – System posture and the emergency stop – what's running, a confirmed Stop that says what it halts, and resume
- [Knowledge Promotion](knowledge-promotion.md) – Promote a verified fact into shared team knowledge against a checklist, with disputed facts side by side
- [Legal Hold Manager](legal-hold-manager.md) – Which items are on legal hold, who placed each hold, why and until when – overdue reviews marked, items added, and Release only with a written reason
- [Lineage Graph](lineage-graph.md) – Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away
- [Playbook Canvas](playbook-canvas.md) – An agent workflow, phase by phase – triggers, intake, context, analysis and review as steps you add and order, with review gates, versions and a dry run
- [Policy Simulator](policy-simulator.md) – Try an action against the policy before it's real – allow, needs approval, deny or hard stop, the rule that decided it and why
- [Provenance Summary](provenance-summary.md) – What a document is made of – how much came from sources, from AI and from its authors, section by section
- [Reasoning Flags](reasoning-flags.md) – Inline markers for weak reasoning in an answer – circular, hedged then certain, self-contradicting or overconfident – each with an explanation
- [Redaction Review](redaction-review.md) – Checking what's been redacted before a document's shared – solid bars with reasons, reveal one at a time, approve or reject, and Share once none are left
- [Reflection Gate](reflection-gate.md) – A moment to think before relying on AI – state the task and what's at stake, say what you believe, restate the answer, or name what you'll verify
- [Reliance Gauge](reliance-gauge.md) – Whether trust in the AI matches how it performs – a reliance index with its trend, signals against review thresholds, and overtrust and undertrust caught
- [Review Conflict](review-conflict.md) – Two reviewers disagree – both verdicts with who gave them, resolved by a third person with a reason, or kept blind
- [Run Manifest](run-manifest.md) – What it takes to reproduce a run – model, settings, instruction hash, sources, intent and the verification summary, ready to export
- [Scan Status](scan-status.md) – Where a file stands in malware scanning – queued, scanning, clean, suspicious, quarantined or failed, inline or as a card, with Rescan and Request review
- [Session Context Bar](session-context-bar.md) – The session's declared terms kept in view – intent, knowledge mode, scope, review, posture, limits, deadline and budget
- [Share Link Manager](share-link-manager.md) – The links that already share something – status in words, expiry, opens and who made them, with Copy, Change expiry and Revoke, which says how many opens it's had
- [Synthesis Notes](synthesis-notes.md) – Your own conclusions, assumptions and open questions, kept apart from the model's output and exported with where they came from
- [Transcript Review](transcript-review.md) – Recorded audio or video with a transcript that follows playback – speakers, timestamps, recognition confidence and low-confidence segments to verify
- [Validity Badge](validity-badge.md) – How fresh a piece of evidence is – a band from high to stale that ages over time, contested and superseded marks, and a margin strip for a document
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Version History](version-history.md) – The versions of an agent, prompt or workflow – draft, active or deprecated, who and when, and what changed in behaviour

## Utilities (3)

- [Breakpoint Overlay](breakpoint-overlay.md) – Which breakpoint the page is at – a corner badge that opens a scale and list of every breakpoint with its media query, and a ruler across the window; follows the window or an element – ⌥⇧O to open it
- [Look Provider](look-provider.md) – Sets the look, Standard or Clean, for every Trenchcoat element inside it – one wrapper for a whole app, with any element still free to choose its own
- [Loupe](loupe.md) – A design-system inspector over the live page – components outlined with a card of their name, path and links, a breakpoint ruler, flex and grid containers listed – ⌘⇧L to turn it on
