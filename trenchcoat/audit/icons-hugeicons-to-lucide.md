# Hugeicons → Lucide

**Done (2026-10-24):** every Screen now uses Lucide (`lucide-react` 1.55.0). This is the record of what replaced what; compare them in the gallery at `#/icons`. Data: `app/src/icons/hugeicons-to-lucide.ts`.

The Screens used **101 Hugeicons, 250 references in 14 files**: 86 have the same glyph in Lucide · 10 close · 1 different metaphor · 4 brand logos with no Lucide icon.

## How it was done

- The `Icon` wrapper in `screens/app-shell.tsx` now takes a Lucide component (`<Icon icon={HouseIcon} />`), and `LucideIcon` replaced `IconSvgElement` in every prop type. Screens import Lucide's `…Icon`-suffixed names so they can't shadow globals like `File`, `Image` or `Link`.
- Stroke weight is unchanged: the wrapper still passes the shell's 1.9px (Lucide's default is 2px).
- Brand logos: Lucide has none. Slack (an "On Slack" nav item) and TikTok (a campaign channel) were removed from Agent Chat. Facebook and Instagram are defined in Agent Chat with `createLucideIcon` from Lucide's last brand glyphs, so they match the set.
- Hugeicons is now only a dev dependency, used by the gallery's comparison page.

| Hugeicons | Lucide (now used) | Alternatives | Match | Note | Used in |
|---|---|---|---|---|---|
| `AiBrain01Icon` | `brain` | `brain-circuit` | Close |  | agent-chat ×3, agent-run ×2, assistant-home ×2 |
| `AiMagicIcon` | `wand-sparkles` | `sparkles` | Close | Hugeicons draws sparkles only; Lucide adds a wand | assistant-home ×2 |
| `Analytics01Icon` | `chart-column-big` | `chart-no-axes-combined`, `chart-spline` | Close | Hugeicons frames the bars in a rounded square | agent-chat ×1, agent-run ×1, analytics ×2, crm ×1, evals ×1, onboarding ×2, settings-billing ×1 |
| `ArrowDown01Icon` | `chevron-down` |  | Same glyph | Hugeicons "Arrow…01" icons are chevrons | app-shell ×5, assistant-home ×1, crm ×1, evals ×1 |
| `ArrowLeft01Icon` | `chevron-left` |  | Same glyph |  | onboarding ×1 |
| `ArrowLeft02Icon` | `arrow-left` |  | Same glyph |  | folder ×1 |
| `ArrowRight01Icon` | `chevron-right` |  | Same glyph |  | agent-chat ×1, app-shell ×2, integrations ×1, onboarding ×3 |
| `ArrowUp02Icon` | `arrow-up` |  | Same glyph |  | assistant-home ×1 |
| `ArrowUpDownIcon` | `arrow-up-down` | `chevrons-up-down` | Same glyph |  | app-shell ×1 |
| `ArrowUpRight01Icon` | `arrow-up-right` |  | Same glyph |  | app-shell-workspace ×1 |
| `BubbleChatIcon` | `message-circle-more` | `message-circle` | Same glyph |  | agent-chat ×2, agent-run ×2, evals ×1, onboarding ×2, settings-billing ×1 |
| `Building03Icon` | `building` | `building-complex` | Close |  | crm ×1 |
| `Calendar03Icon` | `calendar` | `calendar-days` | Same glyph |  | agent-chat ×1, agent-run ×1, analytics ×1, crm ×1 |
| `Cancel01Icon` | `x` |  | Same glyph |  | agent-chat ×1, app-shell ×3, assistant-home ×1, onboarding ×1 |
| `ChartColumnIcon` | `chart-column` | `chart-column-big` | Same glyph |  | assistant-home ×1, onboarding ×1 |
| `ChatEdit01Icon` | `message-square-plus` | `square-pen`, `message-square` | Different metaphor | No speech bubble with a pen in Lucide; plus-in-bubble or the usual "new chat" square-pen | folder ×1 |
| `CheckListIcon` | `list-checks` | `list-todo` | Same glyph |  | agent-chat ×3, agent-run ×1 |
| `CheckmarkBadge01Icon` | `badge-check` |  | Same glyph |  | integrations ×1 |
| `CheckmarkCircle02Icon` | `circle-check` | `circle-check-big` | Same glyph |  | agent-chat ×1 |
| `Clock01Icon` | `clock` |  | Same glyph |  | agent-run ×1 |
| `Coins01Icon` | `coins` |  | Close | Hugeicons stacks the coins; Lucide shows two side by side | agent-run ×1 |
| `CommandLineIcon` | `square-terminal` | `terminal` | Same glyph |  | app-shell-workspace ×1 |
| `Copy01Icon` | `copy` |  | Same glyph |  | agent-run ×1, crm ×1, onboarding ×1, settings-billing ×1 |
| `CpuIcon` | `cpu` |  | Same glyph |  | evals ×1 |
| `CreditCardIcon` | `credit-card` |  | Same glyph |  | settings-billing ×1 |
| `CustomerSupportIcon` | `headset` | `headphones` | Same glyph |  | onboarding ×2 |
| `DashboardSquare02Icon` | `layout-dashboard` | `layout-grid` | Same glyph |  | app-shell ×1, onboarding ×2, settings-billing ×1 |
| `Database01Icon` | `database` |  | Same glyph |  | assistant-home ×1, evals ×1 |
| `Delete02Icon` | `trash` |  | Same glyph | Not Lucide's "delete", which is a backspace key | agent-chat ×1, folder ×1, settings-billing ×2 |
| `Dollar01Icon` | `dollar-sign` | `circle-dollar-sign` | Same glyph |  | agent-chat ×1, agent-run ×2, crm ×2 |
| `Download04Icon` | `download` |  | Same glyph |  | analytics ×1, settings-billing ×2 |
| `Facebook01Icon` | – |  | No Lucide icon | Lucide has no brand logos – Agent Chat defines it with createLucideIcon from Lucide's last brand glyph | agent-chat ×1 |
| `File01Icon` | `file-text` | `sticky-note`, `file` | Close | Hugeicons puts the folded corner bottom-right, like sticky-note | assistant-home ×2 |
| `File02Icon` | `file-text` |  | Same glyph |  | app-shell ×1 |
| `FileAddIcon` | `file-plus` | `file-plus-corner` | Same glyph |  | crm ×1 |
| `FileEditIcon` | `file-pen` | `file-pen-line` | Same glyph |  | agent-run ×1 |
| `FilterIcon` | `funnel` | `list-filter` | Same glyph | Lucide renamed filter → funnel | app-shell ×1 |
| `Folder01Icon` | `folder` |  | Same glyph |  | agent-chat ×1, agent-run ×1, app-shell ×1, crm ×1, settings-billing ×1 |
| `FolderOpenIcon` | `folder-open` |  | Same glyph |  | app-shell ×1, assistant-home ×1 |
| `Globe02Icon` | `globe` |  | Same glyph |  | app-shell-workspace ×1, assistant-home ×1, settings-billing ×1 |
| `GridViewIcon` | `layout-grid` | `grid2x2` | Same glyph |  | app-shell ×1, crm ×1 |
| `HelpCircleIcon` | `circle-question-mark` |  | Same glyph | Lucide renamed help-circle → circle-question-mark | app-shell ×1 |
| `Home01Icon` | `house` |  | Same glyph | Lucide renamed home → house | agent-chat ×1, agent-run ×1, analytics ×1, crm ×1, evals ×1, onboarding ×1 |
| `Image01Icon` | `image` |  | Same glyph |  | agent-chat ×1, assistant-home ×2 |
| `ImageUpload01Icon` | `image-up` | `image-plus` | Same glyph |  | settings-billing ×1 |
| `InstagramIcon` | – |  | No Lucide icon | Lucide has no brand logos – Agent Chat defines it with createLucideIcon from Lucide's last brand glyph | agent-chat ×1 |
| `Invoice01Icon` | `receipt-text` | `receipt`, `file-text` | Same glyph |  | analytics ×1 |
| `KanbanIcon` | `square-kanban` | `kanban` | Same glyph |  | crm ×1 |
| `Key01Icon` | `key` | `key-round` | Same glyph |  | settings-billing ×1 |
| `LeftToRightListBulletIcon` | `list` |  | Same glyph |  | app-shell ×1 |
| `Link01Icon` | `link` | `link2` | Same glyph |  | crm ×1, folder ×1, onboarding ×1 |
| `Location01Icon` | `map-pin` |  | Same glyph |  | agent-chat ×1 |
| `Logout01Icon` | `log-out` |  | Same glyph |  | app-shell ×1 |
| `Mail01Icon` | `mail` |  | Same glyph |  | agent-run ×3, evals ×2, settings-billing ×2 |
| `Megaphone01Icon` | `megaphone` |  | Same glyph |  | agent-chat ×3 |
| `Mic01Icon` | `mic` |  | Same glyph |  | assistant-home ×1 |
| `MoneyReceive01Icon` | `banknote-arrow-down` | `hand-coins`, `wallet` | Close |  | evals ×1 |
| `MoreHorizontalIcon` | `ellipsis` |  | Same glyph | Lucide renamed more-horizontal → ellipsis | agent-chat ×1, agent-run ×1, app-shell-flat ×1, app-shell-workspace ×1, folder ×1, settings-billing ×1 |
| `NoteEditIcon` | `notebook-pen` | `square-pen` | Same glyph |  | app-shell-workspace ×1 |
| `PaintBoardIcon` | `palette` |  | Same glyph |  | agent-chat ×1 |
| `PencilEdit02Icon` | `pencil-line` | `pencil`, `square-pen` | Same glyph |  | agent-chat ×1, app-shell ×1, assistant-home ×1, folder ×1, settings-billing ×1 |
| `PinIcon` | `pin` |  | Same glyph |  | agent-chat ×1 |
| `PlayCircleIcon` | `circle-play` |  | Same glyph | Lucide renamed play-circle → circle-play | agent-run ×2 |
| `PlayIcon` | `play` |  | Same glyph |  | evals ×1 |
| `Plug01Icon` | `plug` | `plug2` | Same glyph |  | assistant-home ×1 |
| `PlusSignIcon` | `plus` |  | Same glyph |  | app-shell ×1, assistant-home ×1, files ×2, integrations ×2, settings-billing ×1 |
| `PresentationBarChart01Icon` | `presentation` | `chart-column-big` | Close | Lucide's presentation board is empty; Hugeicons draws a chart on it | agent-run ×1, assistant-home ×1 |
| `RefreshIcon` | `rotate-cw` | `refresh-cw` | Same glyph | Single arrow – rotate-cw; refresh-cw has two | crm ×1 |
| `RepeatIcon` | `repeat` | `repeat2` | Same glyph |  | agent-run ×1, analytics ×1 |
| `Search01Icon` | `search` |  | Same glyph |  | agent-run ×1, app-shell-workspace ×1, app-shell ×3 |
| `Settings01Icon` | `settings` | `settings2` | Same glyph |  | app-shell ×1, settings-billing ×1 |
| `Share08Icon` | `share2` | `share`, `square-arrow-out-up-right` | Same glyph | Hugeicons Share08 is the three-node share glyph | agent-chat ×1, agent-run ×1, app-shell-flat ×1 |
| `ShoppingBag01Icon` | `shopping-bag` |  | Same glyph |  | agent-chat ×1, analytics ×1 |
| `SidebarLeftIcon` | `panel-left` |  | Same glyph |  | app-shell ×3 |
| `SidebarRightIcon` | `panel-right` |  | Same glyph |  | agent-chat ×1, agent-run ×1, app-shell ×3 |
| `SlackIcon` | – |  | No Lucide icon | Dropped – the Slack nav item and TikTok channel were removed from Agent Chat | agent-chat ×1 |
| `SparklesIcon` | `sparkles` |  | Same glyph |  | agent-chat ×2, assistant-home ×1 |
| `SquareLock02Icon` | `lock-keyhole` | `lock` | Same glyph |  | files ×2 |
| `StarIcon` | `star` |  | Same glyph |  | crm ×1 |
| `StopCircleIcon` | `circle-stop` |  | Same glyph | Lucide renamed stop-circle → circle-stop | agent-run ×1 |
| `Store01Icon` | `store` |  | Same glyph |  | analytics ×1 |
| `TShirtIcon` | `shirt` |  | Same glyph |  | agent-chat ×2 |
| `Table01Icon` | `table` | `sheet`, `table2` | Same glyph |  | assistant-home ×1, crm ×1 |
| `Tag01Icon` | `tag` |  | Same glyph |  | crm ×1 |
| `Target02Icon` | `target` | `crosshair` | Same glyph |  | agent-chat ×2, crm ×1 |
| `TaskDaily01Icon` | `clipboard-list` | `calendar-check`, `clipboard-check` | Close |  | agent-chat ×1 |
| `Telescope01Icon` | `telescope` |  | Same glyph |  | assistant-home ×2 |
| `TestTube01Icon` | `test-tube` | `flask-conical` | Same glyph |  | evals ×1 |
| `TextAlignLeftIcon` | `text-align-start` |  | Same glyph | Lucide renamed align-left → text-align-start | crm ×1 |
| `Tick02Icon` | `check` |  | Same glyph |  | app-shell ×2, crm ×1, integrations ×1, onboarding ×3, settings-billing ×1 |
| `Ticket01Icon` | `ticket` |  | Same glyph |  | evals ×1 |
| `TiktokIcon` | – |  | No Lucide icon | Dropped – the Slack nav item and TikTok channel were removed from Agent Chat | agent-chat ×1 |
| `Upload04Icon` | `upload` |  | Same glyph |  | folder ×1 |
| `UserAdd01Icon` | `user-plus` | `user-round-plus` | Same glyph |  | assistant-home ×1, evals ×1, settings-billing ×1 |
| `UserGroupIcon` | `users` | `users-round` | Close | Hugeicons shows three people; Lucide two | agent-chat ×1, agent-run ×1 |
| `UserIcon` | `user` | `user-round` | Same glyph |  | app-shell ×1, crm ×1 |
| `UserMultiple02Icon` | `users-round` | `users` | Same glyph |  | files ×2, folder ×1 |
| `UserMultipleIcon` | `users` |  | Same glyph |  | analytics ×1, crm ×2 |
| `UserSearch01Icon` | `user-search` | `user-round-search` | Same glyph |  | onboarding ×1 |
| `Wallet01Icon` | `wallet` | `wallet-minimal` | Same glyph |  | analytics ×2 |
| `WorkflowSquare03Icon` | `workflow` | `git-fork` | Same glyph |  | agent-chat ×1, agent-run ×3 |
