# Trenchcoat – illustrations

Every file is a single, self-contained React component (React is the only dependency).
Copy a file into your project, e.g. `components/ui/`, and import it from there.
Some files import another Trenchcoat component from `@/components/ui/<name>` – copy that one alongside.
Colours follow the page theme – a `.dark` class, `data-theme` / `data-tc-theme` or the OS setting – through `light-dark()`.
They are decorative unless given a `label`, loops are finite or rest, and `prefers-reduced-motion` keeps them still.

- **Accessibility Principles** (`accessibility-principles.tsx`) – Visual, hearing, motor and cognitive needs on pastel tiles, with arrows up from the four principles that serve them – perceivable, operable, understandable and robust – for an accessibility statement or design guide
- **Agent Scene** (`agent-scene.tsx`) – The assistant in a small scene – happy above an empty tray, thinking beside a stack of pages, or asleep beside a sign
- **Agent Team** (`agent-team.tsx`) – A prompt types itself and branches out into three agents, each with a role and overlapping tool logos – three times, then the team stays
- **Atomic Design** (`atomic-design.tsx`) – Atomic design one stage at a time – the five stages from abstract to concrete, then atoms, a search-form molecule, a header organism, a wireframe template and the finished page (`stage`)
- **Content Hidden** (`content-hidden.tsx`) – A picture pixelated into an obscured grid with a warning sign on it, with the words Sensitive content, to sit on an overlay covering obscene, sexual or graphic content
- **Cover Flow** (`cover-flow.tsx`) – Browse covers in 3D – drag, flick or scrub the row, it springs to the nearest cover; images drift in their frames over a soft reflection
- **DACH Region** (`region-dach.tsx`) – DACH map with fading neighbours and a pastel band along the border, switchable to the US, China, India, Brazil or Japan
- **Doc Status** (`doc-status.tsx`) – Where a document stands, as one illustration whose `status` picks the badge's drawing, colours, motion and words – draft, awaiting review, approved, changes requested, in translation, in quality control, in coordination, pending release, scheduled, released, queued, processing, in progress, success, partly processed, failed, uploading, downloading, malware scan or blocked, preview unavailable, locked, restricted, on legal hold, redacted, password protected, encrypted, shared, awaiting signature, signed, comments waiting, update available, converting to text, archived, in trash, expired, duplicate, metadata cleansing (required, in progress, failed, done), added to Readbook, working offline and sync conflict
- **Empty Calendar** (`empty-calendar.tsx`) – Stack of calendar cards marked empty, fanning out on hover; the shimmer runs a few cycles and rests
- **Enrichment Orbit** (`enrichment-orbit.tsx`) – Grok tile inside two rings with comets and data nodes orbiting around it – a few rounds, then they rest
- **Folder Status** (`folder-status.tsx`) – A folder scene for where a folder stands – empty, shared, syncing, archived, locked or restricted – each with its own badge, colour, finite motion and words, which follow the status unless `caption` sets its own
- **Ghosted Chat** (`ghosted-chat.tsx`) – Unanswered chat messages marked as read, with a thumbs-down reply on hover; the red shine sweeps three times
- **Glass Folder** (`glass-folder.tsx`) – Glassy blue folder with documents behind a frosted pocket that tips open on hover
- **Glow Keyboard** (`glow-keyboard.tsx`) – AI chat input that types itself over a glass keyboard – every key press sends a wave up the gradient floor; after typing each prompt once the scene rests
- **Inspect Frame** (`inspect-frame.tsx`) – Any component seen like a selection in a design tool – tilted back, a cursor walks through its rows while a frame with handles, padding numbers on guide lines and a W Fill width chip draw round each; twice through, then it rests on the first row
- **Integration Beam** (`integration-beam.tsx`) – Your product between the tools it connects – light pulses flow along curved beams, hover to focus a tool, click to pause it; a few sync cycles each time it comes into view
- **Integration Flow** (`integration-flow.tsx`) – Integration pills rotating along a dashed arc, each beaming its data into a central analysis hub – once round the integrations, then it rests
- **Integration Grid** (`integration-grid.tsx`) – Honeycomb-like wall of integration logos around a bright centre tile with your product mark, fading out toward the edges
- **Layer Stack** (`layer-stack.tsx`) – Isometric stack of five layers with a list beside it – the chosen entry lifts its layer out in color; steps through twice and rests (`rounds`)
- **Lead Sourcing** (`lead-sourcing.tsx`) – ChatGPT tile linked to Gmail and Grok, with a shine running along the connection
- **Logo Cluster** (`logo-cluster.tsx`) – Your mark on a white disc in the middle – company logos bounce out of it and settle around it; the ring turns once
- **Model Wheel** (`model-wheel.tsx`) – AI model names on a turning drum – the rows bend away at the edges and each model lands on a soft gray fill; turns once round the drum and rests (`turns`)
- **Outreach Branches** (`outreach-branches.tsx`) – Lines branching out to Gmail, Slack and Notion with colored pulses flowing down
- **Page State** (`page-state.tsx`) – The full-page and empty states as one illustration – nothing found, first use, offline, something wrong, page not found, link expired, no access, access requested, session expired, limit reached, maintenance, coming soon, not available in your region and AI unavailable – each its own small scene with a colour, finite motion and words that follow the status unless `caption` sets its own
- **Project Flow** (`project-flow.tsx`) – Animated scene of a client task branching into subtasks, notes and assigned roles; follows the page theme (light or dark scene); `theme` pins one
- **Side Folder** (`side-folder.tsx`) – Glassy blue folder on its side, documents sliding out to the right as the pocket swings open on hover
- **Soup Cans** (`soup-cans.tsx`) – Three plain soup cans with no labels, standing together at different heights with ridge rings, for items that are there but not yet labelled or sorted
- **Tab Overload** (`tab-overload.tsx`) – Overlapping browser windows where the highlight follows the hovered tab
- **Team Invite** (`team-invite.tsx`) – Connected teammates – a cursor drags a new one into the empty slot, the line turns solid and they go online
- **Tray Status** (`tray-status.tsx`) – A tray scene for where things stand – all done, nothing here yet, no matches, drop files to upload, new items (with a count), importing, import complete, imported with errors, export ready, sync complete, paused, upload failed or storage full – each with its own badge, colour, finite motion and words, which follow the status unless `caption` sets its own
- **Voice Orb** (`voice-orb.tsx`) – The face of a voice assistant – a sphere of dots that breathes, catches sound, collapses into a spinning ring while thinking and ripples when it speaks
- **World Map Continental** (`world-map.tsx`) – World map with one highlighted continent and a pastel band along its coastline, switchable between all six
