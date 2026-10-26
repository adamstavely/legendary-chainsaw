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

- **Blur Crossfade** (`blur-crossfade.tsx`) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
- **Gradient Floor** (`gradient-floor.tsx`) – A blurred colour gradient that glows up from the bottom edge – two layers that drift and morph, then settle
- **Gradient Text** (`gradient-text.tsx`) – Letters cut from a liquid, flowing gradient – the color sweeps across the word the first time it's seen
- **Grid Background** (`grid-background.tsx`) – A fine line grid that drifts slowly behind your content and fades out towards the edges
- **Number Ticker** (`number-ticker.tsx`) – Odometer-style numbers – every digit rolls to its new value and counts in from zero when it scrolls into view; each new value is announced once
- **Shimmer Loader** (`shimmer-loader.tsx`) – Skeleton blocks with a soft light sweep on one beat, plus shimmering text for “Thinking…” states that stays readable
- **Text Reveal** (`text-reveal.tsx`) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view
- **Tilt Card** (`tilt-card.tsx`) – A card that tilts in 3D towards the pointer, with a soft glare that follows it and a smooth spring back
