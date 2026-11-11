# Trenchcoat – motion

Every file is a single, self-contained React component (React is the only dependency).
Copy a file into your project, e.g. `components/ui/`, and import it from there.
Each component accepts `className` and any DOM props for its root, and a React 19 `ref` to the root element.
Animations run through CSS or write straight to the DOM (no React render per frame) and pause while off screen or in a
hidden tab. Loops that start on their own run for about five seconds and then rest (WCAG 2.2.2): Gradient Floor,
Gradient Text and Grid Background take `playFor` (seconds; `Infinity` keeps them going – then offer a pause), Shimmer
Loader runs three passes (`--tc-shimmer-loader-passes`). All follow `prefers-reduced-motion`, including when it changes
while the page is open.
Some files import another Trenchcoat component from `@/components/ui/<name>` – copy that one alongside.

- **Attention Pulse** (`attention-pulse.tsx`) – Draws the eye once – a soft ring passes around something new a single time, and never on page load
- **Badge Pop** (`badge-pop.tsx`) – A count badge on a corner of what it wraps that pops and rolls its digits when the count rises, shrinks away at zero, caps at 99+ or shows a dot, and says the count once it settles
- **Banner Stack** (`banner-stack.tsx`) – Notices that pile up instead of pushing the page down – the newest on top, older ones peeking smaller and dimmed behind it, spreading into a list on hover or focus and sliding away when dismissed
- **Blur Crossfade** (`blur-crossfade.tsx`) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
- **Collapse** (`collapse.tsx`) – Content that glides open and shut to its real height, with nothing to measure, and can't be reached while shut
- **Dissolve Clear** (`dissolve-clear.tsx`) – A clear button for a text input – the field empties at once and keeps focus while the old text dissolves letter by letter, with Escape to clear too
- **Drag Lift** (`drag-lift.tsx`) – Lifts its child while it's dragged – it follows the pointer and leaves a gap, Escape cancels and it glides home, and where it lands is the page's call
- **Error Shake** (`error-shake.tsx`) – Wraps a field and shakes it once when it turns invalid, with an error outline that pulses and stays and a message that slides in and is announced, never on first load
- **Gradient Floor** (`gradient-floor.tsx`) – A blurred colour gradient that glows up from the bottom edge – two layers that drift and morph, then settle
- **Gradient Text** (`gradient-text.tsx`) – Letters cut from a liquid, flowing gradient – the color sweeps across the word the first time it's seen
- **Grid Background** (`grid-background.tsx`) – A fine line grid that drifts slowly behind your content and fades out towards the edges
- **Icon Swap** (`icon-swap.tsx`) – One icon turning into the next – copy into a check, play into pause – with a turn, a shrink and a blur, in place, and turning back on its own after a while if asked
- **Like Burst** (`like-burst.tsx`) – A like or save toggle whose icon fills with a spring and a small ring and particle burst when it's pressed on, with a count that rolls by one
- **List Motion** (`list-motion.tsx`) – Rows that glide when reordered, added or removed, in any framework, instead of jumping
- **Menu Morph** (`menu-morph.tsx`) – A button that grows into its menu – the surface stretches out of the button's box, the items rise in turn, and it shrinks back into the button on closing, with the menu button pattern's keys
- **Number Change** (`number-change.tsx`) – A number that briefly highlights when it changes, tinted by direction with an arrow and a word for screen readers, and never on first render
- **Number Ticker** (`number-ticker.tsx`) – Odometer-style numbers – every digit rolls to its new value and counts in from zero when it scrolls into view; each new value is announced once
- **Page Slide** (`page-slide.tsx`) – Views that slide side by side as you move between them – forward from the end, back from the start, with a touch of parallax, the height gliding along and focus landing on the new view's heading
- **Progress Bar** (`progress-bar.tsx`) – A thin bar for a wait of known or unknown length – a value or a sweep, which fills and fades out when done
- **Shared Element** (`shared-element.tsx`) – A piece of content grows into its detail view, with focus moving along and Escape to close, so people keep their place
- **Shimmer Loader** (`shimmer-loader.tsx`) – Skeleton blocks with a soft light sweep on one beat, plus shimmering text for “Thinking…” states that stays readable
- **Sliding Indicator** (`sliding-indicator.tsx`) – A highlight that slides to the selected tab, option or nav link – an underline or a pill that follows the page's own selected state, with an optional hover ghost
- **Stack Spread** (`stack-spread.tsx`) – An overlapping row – reviewers' initials, file chips, tags – that fans apart on hover or focus, each item lifting as the pointer passes, with "+N" past a maximum
- **Staggered Reveal** (`staggered-reveal.tsx`) – Children arrive one after another, once, the first time they're seen, with capped waits and nothing hidden without motion
- **Status Morph** (`status-morph.tsx`) – One state's mark changing into the next with its word – pending, checking, done, failed or warning – with polite announcing on request
- **Success Check** (`success-check.tsx`) – A small tick that draws itself once, for shared or saved, and then rests
- **Text Reveal** (`text-reveal.tsx`) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view
- **Tilt Card** (`tilt-card.tsx`) – A card that tilts in 3D towards the pointer, with a soft glare that follows it and a smooth spring back
