"use client";

import { useId, type ComponentPropsWithoutRef, type Ref } from "react";

/*
 * Glass Folder – a glassy folder illustration, in a single self-contained file.
 * Three documents sit in a blue folder behind a frosted front pocket.
 * Hover the folder: the pocket tips forward and every document shifts on its own.
 * The artwork scales with its container and keeps a 3 : 2 frame.
 * Decorative by default (aria-hidden); pass `label` to have it announced as an image.
 * Colours follow the page theme (a dark class, data-theme / data-tc-theme or the OS setting) through light-dark().
 */

type GlassFolderOwnProps = {
  className?: string;
  /** Accessible description – when set, the folder is announced as an image; otherwise it is decorative */
  label?: string;
  ref?: Ref<HTMLDivElement>;
};

export type GlassFolderProps = Omit<ComponentPropsWithoutRef<"div">, keyof GlassFolderOwnProps | "children"> & GlassFolderOwnProps;

const BACK =
  "M38 0H176Q196 0 204 14L218 30Q224 38 246 38H562Q600 38 600 76V462Q600 500 562 500H38Q0 500 0 462V38Q0 0 38 0Z";
const LINES = [78, 180, 140, 175, 126, 168, 110];

export function GlassFolder({ className, label, ref, ...rest }: GlassFolderProps) {
  const id = "ui-fd" + useId().replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <div
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...rest}
      ref={ref}
      className={["ui-fd", className].filter(Boolean).join(" ")}
    >
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-glass-folder" precedence="default">
        {css}
      </style>
      <div className="ui-fd-icon" aria-hidden="true">
        {/* Back of the folder with its tab */}
        <svg className="ui-fd-layer ui-fd-back" viewBox="0 0 600 500">
          <defs>
            <filter id={`${id}-hl`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
              <feOffset in="blur" dy="3" result="offset" />
              <feComposite in="blur" in2="offset" operator="arithmetic" k2="1" k3="-1" result="diff" />
              <feFlood floodColor="#fff" floodOpacity="0.65" />
              <feComposite in2="diff" operator="in" result="light" />
              <feComposite in="light" in2="SourceAlpha" operator="in" />
            </filter>
          </defs>
          <path className="ui-fd-back-fill" d={BACK} />
          <path d={BACK} fill="#000" filter={`url(#${id}-hl)`} />
        </svg>

        {/* Documents – each one moves on its own */}
        <svg className="ui-fd-layer" viewBox="0 0 600 500">
          <defs>
            <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
              <stop className="ui-fd-paper-top" offset="0%" />
              <stop className="ui-fd-paper-bottom" offset="100%" />
            </linearGradient>
            <symbol id={`${id}-doc`} overflow="visible">
              <rect className="ui-fd-paper" x="0.6" y="0.6" width="278.8" height="348.8" rx="19.4" fill={`url(#${id}-paper)`} strokeWidth="1.2" />
              {LINES.map((w, i) => (
                <rect key={i} className="ui-fd-line" x="30" y={87 + i * 28} width={w} height="9" rx="4.5" />
              ))}
            </symbol>
          </defs>
          <use className="ui-fd-doc ui-fd-doc--left" href={`#${id}-doc`} />
          <use className="ui-fd-doc ui-fd-doc--right" href={`#${id}-doc`} />
          <use className="ui-fd-doc ui-fd-doc--middle" href={`#${id}-doc`} />
        </svg>

        {/* Frosted front pocket */}
        <div className="ui-fd-front" />
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

.ui-fd {
  /* Dark: dark paper with light lines, a deeper blue folder and a pocket that lets less light through */
  --tc-glass-folder-back: light-dark(#5bb7ea, #3d8fc6);
  --tc-glass-folder-paper-top: light-dark(#ffffff, #34363c);
  --tc-glass-folder-paper-bottom: light-dark(#eaf2f8, #26292f);
  --tc-glass-folder-ink: light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.1));
  --tc-glass-folder-line: light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.16));
  --tc-glass-folder-shadow-1: light-dark(rgba(60, 130, 180, 0.28), rgba(0, 0, 0, 0.45));
  --tc-glass-folder-shadow-2: light-dark(rgba(60, 130, 180, 0.16), rgba(0, 0, 0, 0.3));
  --tc-glass-folder-shadow-3: light-dark(rgba(60, 130, 180, 0.1), transparent);
  --tc-glass-folder-doc-shadow: light-dark(rgba(0, 30, 60, 0.18), rgba(0, 0, 0, 0.45));
  --tc-glass-folder-pocket-shade: light-dark(rgba(0, 40, 75, 0.28), rgba(0, 20, 40, 0.4));
  --tc-glass-folder-pocket-top: light-dark(rgba(132, 214, 248, 0.45), rgba(100, 190, 235, 0.42));
  --tc-glass-folder-pocket-bottom: light-dark(rgba(69, 170, 220, 0.45), rgba(45, 130, 190, 0.5));
  --tc-glass-folder-pocket-rim: light-dark(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.14));
  --tc-glass-folder-pocket-lip: light-dark(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.3));
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
}

/* The folder is drawn on a 600 × 500 grid; cqw keeps every detail in proportion */
.ui-fd-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 40%;
  aspect-ratio: 6 / 5;
  container-type: inline-size;
  perspective: 220cqw;
  perspective-origin: 50% 60%;
  transform: translate(-50%, -48%);
  transition: transform var(--tc-duration-slowest, 560ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1));
}
.ui-fd-icon:hover { transform: translate(-50%, -48%) scale(1.03); }

.ui-fd-layer { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ui-fd-back {
  filter:
    drop-shadow(0 4cqw 4.6cqw var(--tc-glass-folder-shadow-1))
    drop-shadow(0 1.3cqw 2cqw var(--tc-glass-folder-shadow-2))
    drop-shadow(0 0.3cqw 0.7cqw var(--tc-glass-folder-shadow-3));
}
.ui-fd-back-fill { fill: var(--tc-glass-folder-back); }
.ui-fd-paper-top { stop-color: var(--tc-glass-folder-paper-top); }
.ui-fd-paper-bottom { stop-color: var(--tc-glass-folder-paper-bottom); }
.ui-fd-paper { stroke: var(--tc-glass-folder-ink); }
.ui-fd-line { fill: var(--tc-glass-folder-line); }

.ui-fd-doc {
  transform-box: fill-box;
  transform-origin: center;
  filter: drop-shadow(0 3px 4px var(--tc-glass-folder-doc-shadow));
  transition: transform var(--tc-duration-slowest, 560ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1));
}
.ui-fd-doc--left   { transform: translate(40px, 80px) rotate(6deg); }
.ui-fd-doc--right  { transform: translate(280px, 80px) rotate(6deg); }
.ui-fd-doc--middle { transform: translate(160px, 66px) rotate(-4deg); }
.ui-fd-icon:hover .ui-fd-doc--left   { transform: translate(32px, 70px) rotate(9deg); }
.ui-fd-icon:hover .ui-fd-doc--right  { transform: translate(286px, 76px) rotate(5deg); }
.ui-fd-icon:hover .ui-fd-doc--middle { transform: translate(166px, 52px) rotate(-7deg); }

/* Pocket: top edge at 108 of 500, corners 38; on hover it drops to 124 and tips forward */
.ui-fd-front {
  position: absolute;
  inset: 21.6% 0 0;
  border-radius: 6.333cqw;
  background:
    /* The shade starts at 74 % (70 % in dark – hence the extra stop) */
    linear-gradient(180deg, transparent 70%, light-dark(transparent, rgba(0, 20, 40, 0.053)) 74%, var(--tc-glass-folder-pocket-shade) 100%),
    linear-gradient(180deg, var(--tc-glass-folder-pocket-top) 0%, var(--tc-glass-folder-pocket-bottom) 100%);
  box-shadow: inset 0 0 0 0.67cqw var(--tc-glass-folder-pocket-rim), inset 0 0.25cqw 0 var(--tc-glass-folder-pocket-lip);
  -webkit-backdrop-filter: blur(3.3cqw) saturate(1.1);
  backdrop-filter: blur(3.3cqw) saturate(1.1);
  transform-origin: 50% 100%;
  transition: top var(--tc-duration-slowest, 560ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1)), border-radius var(--tc-duration-slowest, 560ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1)), transform var(--tc-duration-slowest, 560ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1));
}
.ui-fd-icon:hover .ui-fd-front {
  top: 24.8%;
  border-radius: 3cqw 3cqw 6.333cqw 6.333cqw;
  transform: translateZ(2.33cqw) rotateX(-9deg);
}

@media (prefers-reduced-motion: reduce) {
  .ui-fd-icon, .ui-fd-doc, .ui-fd-front { transition: none; }
}
`;
