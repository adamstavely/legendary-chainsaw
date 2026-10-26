"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type Ref,
} from "react";

/*
 * Text Reveal – a text effect, in a single self-contained file.
 * When the text scrolls into view it arrives piece by piece – word by word or letter by letter –
 * each piece fading in out of a soft blur while it rises a little, one after another.
 * Screen readers get the whole sentence at once; the moving pieces are hidden from them.
 * Font, size and color come from the parent. The pieces are CSS animations started by one attribute, so the whole
 * reveal costs a single render; reduced motion (live, via the media query) shows the text at once.
 * Part of Trenchcoat. Imports: react only.
 */

export type TextRevealOwnProps = {
  /** The text to reveal */
  text: string;
  /** Reveal word by word or letter by letter */
  by?: "word" | "char";
  /** Time between two pieces, in ms */
  stagger?: number;
  /** Wait before the first piece, in ms */
  delay?: number;
  /** Time each piece takes to arrive, in ms */
  duration?: number;
  /** Element to render */
  as?: "p" | "h1" | "h2" | "h3" | "span";
  /** Reveal only the first time; otherwise it plays again each time it enters the view */
  once?: boolean;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLElement>;
};

/** Other DOM props go to the root */
export type TextRevealProps = Omit<ComponentPropsWithoutRef<"p">, keyof TextRevealOwnProps> & TextRevealOwnProps;

/** The component's own ref and the caller's `ref` prop on one element (React 19 ref cleanups included) */
function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}

export function TextReveal({
  text,
  by = "word",
  stagger = 40,
  delay = 0,
  duration = 700,
  as: Tag = "p",
  once = true,
  className,
  style,
  ref: refProp,
  ...rest
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const setRoot = useRootRef(ref, refProp);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setShown(true);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  // Words and the whitespace between them; whitespace stays plain text so lines wrap normally
  const parts = useMemo(() => pieces(text, by), [text, by]);

  return (
    <Tag
      {...rest}
      ref={setRoot as never}
      className={["ui-trv", className].filter(Boolean).join(" ")}
      data-shown={shown ? "" : undefined}
      style={
        {
          "--tc-text-reveal-stagger": `${stagger}ms`,
          "--tc-text-reveal-delay": `${delay}ms`,
          "--tc-text-reveal-duration": `${duration}ms`,
          ...style,
        } as CSSProperties
      }
    >
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-text-reveal" precedence="default">
        {css}
      </style>
      <span className="ui-trv__sr">{text}</span>
      <span aria-hidden="true">{parts}</span>
    </Tag>
  );
}

/** The moving pieces, each numbered for its stagger */
function pieces(text: string, by: "word" | "char") {
  let i = 0;
  return text.split(/(\s+)/).map((part, k) => {
    if (part === "") return null;
    if (/^\s+$/.test(part)) return part;
    if (by === "word") {
      return (
        <span key={k} className="ui-trv__p" style={{ "--tc-text-reveal-i": i++ } as CSSProperties}>
          {part}
        </span>
      );
    }
    // Letter by letter: the letters of a word sit in one unbreakable group
    return (
      <span key={k} className="ui-trv__w">
        {Array.from(part).map((ch, c) => (
          <span key={c} className="ui-trv__p" style={{ "--tc-text-reveal-i": i++ } as CSSProperties}>
            {ch}
          </span>
        ))}
      </span>
    );
  });
}

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

.ui-trv {
  --tc-text-reveal-blur: 8px;
  --tc-text-reveal-rise: 0.35em;
}
.ui-trv__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.ui-trv__w {
  display: inline-block;
  white-space: nowrap;
}
.ui-trv__p {
  display: inline-block;
  opacity: 0;
  filter: blur(var(--tc-text-reveal-blur));
  transform: translateY(var(--tc-text-reveal-rise));
}
.ui-trv[data-shown] .ui-trv__p {
  animation: ui-trv-in var(--tc-text-reveal-duration) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1)) both;
  animation-delay: calc(var(--tc-text-reveal-delay) + var(--tc-text-reveal-i) * var(--tc-text-reveal-stagger));
}
@keyframes ui-trv-in {
  from {
    opacity: 0;
    filter: blur(var(--tc-text-reveal-blur));
    transform: translateY(var(--tc-text-reveal-rise));
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: none;
  }
}

/* Reduced motion: the text is simply there */
@media (prefers-reduced-motion: reduce) {
  .ui-trv .ui-trv__p,
  .ui-trv[data-shown] .ui-trv__p {
    opacity: 1;
    filter: none;
    transform: none;
    animation: none;
  }
}
`;
