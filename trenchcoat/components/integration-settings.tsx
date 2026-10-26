"use client";

/*
 * Integration Settings – the settings card of one connected service, in a single self-contained file.
 * Switch it on and off, generate and copy an API key, set the site address with validation and pick a time zone.
 * Changes collect in a save bar. The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: integration-settings.tsx is Standard,
 * integration-settings-clean.tsx is Clean). Clean is one white card: the header with the switch on top, the settings
 * (with an "API key" label) in hairline-separated sections below, and the save bar as the card's last row; icons are
 * finer, the time zone search carries a magnifier and "Generating…" shimmers instead of showing a spinner.
 */
// Generated from src/components/integration-settings.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-is";

export type IntegrationValues = { enabled: boolean; siteUrl: string; timeZone: string; apiKey: string | null };

export type IntegrationSettingsOwnProps = {
  /** The service's name, e.g. "Shopify" */
  name: string;
  logo: ReactNode;
  /** Small number next to the name, e.g. synced orders */
  count?: number;
  /** Line under the name, e.g. when it was connected */
  meta?: string;
  /** The saved values. Controlled when defined: the card shows them, edits collect in the save bar, and saved changes
   *  (Save, the switch) are reported through onValuesChange. Fields that weren't edited follow new values right away */
  values?: Partial<IntegrationValues>;
  /** Saved values when uncontrolled. Read again when they change (e.g. once they've loaded) – fields that weren't
   *  edited follow */
  defaultValues?: Partial<IntegrationValues>;
  /** Called with all values whenever the saved values change: after a save, or when the switch flips */
  onValuesChange?: (values: IntegrationValues) => void;
  /** Helper text under the address field */
  siteHint?: string;
  timeZones?: string[];
  /**
   * Creates a key – return it, or a promise of it; a rejection shows an error and keeps the old key. Without it a
   * random `sk_demo_…` key is made up (and warns once, unless `demo` is set)
   */
  onGenerateKey?: (options: { signal: AbortSignal }) => string | Promise<string>;
  /** Called with all values when Save is pressed. A rejection keeps the changes unsaved and shows an error.
   *  The signal aborts when the card unmounts */
  onSave?: (values: IntegrationValues, options: { signal: AbortSignal }) => void | Promise<void>;
  /** Demo mode: keys are made up silently when onGenerateKey is missing. For galleries and prototypes */
  demo?: boolean;
  /** Called when the switch flips. May return a promise: the switch shows that it's working and flips when it
   *  resolves; a rejection leaves it as it was and shows an error */
  onToggle?: (enabled: boolean, options: { signal: AbortSignal }) => void | Promise<unknown>;
  /** Visual style. Defaults to the file's look: Standard in integration-settings.tsx, Clean in integration-settings-clean.tsx */
  look?: Look;
  className?: string;
  /** The root <section> */
  ref?: Ref<HTMLElement>;
};

export type IntegrationSettingsProps = Omit<ComponentPropsWithoutRef<"section">, keyof IntegrationSettingsOwnProps> & IntegrationSettingsOwnProps;

const defaultZones = [
  "(GMT −08:00) Los Angeles",
  "(GMT −05:00) New York",
  "(GMT −03:00) São Paulo",
  "(GMT +00:00) London",
  "(GMT +01:00) Berlin",
  "(GMT +01:00) Amsterdam",
  "(GMT +01:00) Warsaw",
  "(GMT +02:00) Athens",
  "(GMT +04:00) Dubai",
  "(GMT +05:30) Mumbai",
  "(GMT +08:00) Singapore",
  "(GMT +09:00) Tokyo",
  "(GMT +10:00) Sydney",
];

// Warns once per page (not per instance) when a key is made up because onGenerateKey is missing
let warnedDemoKey = false;
const warnDemoKey = () => {
  if (warnedDemoKey) return;
  warnedDemoKey = true;
  console.warn(
    "IntegrationSettings: no onGenerateKey handler – simulating key generation. Pass `demo` to keep the simulation, or `onGenerateKey` to wire it up. The simulation will be off by default in the next major version.",
  );
};

const KEYS = ["enabled", "siteUrl", "timeZone", "apiKey"] as const;
const sameValues = (a: IntegrationValues, b: IntegrationValues) => KEYS.every((k) => a[k] === b[k]);
/** The draft on new saved values: fields that weren't edited (still equal the old saved value) take the new one */
const rebase = (draft: IntegrationValues, from: IntegrationValues, to: IntegrationValues): IntegrationValues => {
  const out = { ...draft };
  for (const k of KEYS) if (draft[k] === from[k]) (out as Record<string, unknown>)[k] = to[k];
  return out;
};

// One formatter for the file – toLocaleString would build a new Intl.NumberFormat on every call
const INTEGER = new Intl.NumberFormat("en-US");

const DOMAIN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const clean = (v: string) => v.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");

/* ---------- Parts ---------- */

type ApiKeyProps = {
  apiKey: string | null;
  revealed: boolean;
  copied: boolean;
  busy: boolean;
  error: string;
  look: Look;
  onReveal: () => void;
  onCopy: () => void;
  onGenerate: () => void;
};

/** The API key: generate one, then show, copy or regenerate it */
function ApiKey({ apiKey, revealed, copied, busy, error, look, onReveal, onCopy, onGenerate }: ApiKeyProps) {
  const isClean = look === "clean";
  const masked = apiKey ? `${apiKey.slice(0, 8)}${"•".repeat(14)}${apiKey.slice(-4)}` : "";
  return (
    <div className="ui-is__section">
      {isClean && <span className="ui-is__label">API key</span>}
      {apiKey ? (
        <div className="ui-is__key" data-new={revealed || undefined}>
          <code>{revealed ? apiKey : masked}</code>
          <button type="button" className="ui-is__mini" aria-label={revealed ? "Hide key" : "Show key"} onClick={onReveal}>
            <Icon d={revealed ? "M2 8s2.2-4.5 6-4.5S14 8 14 8s-2.2 4.5-6 4.5S2 8 2 8ZM2.5 2.5l11 11" : "M2 8s2.2-4.5 6-4.5S14 8 14 8s-2.2 4.5-6 4.5S2 8 2 8ZM8 9.8a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z"} size={isClean ? undefined : 15} look={look} />
          </button>
          <button type="button" className="ui-is__mini" aria-label="Copy key" onClick={onCopy}>
            <Icon d={copied ? "m3.5 8.5 3 3 6-7" : "M5.5 5.5V3.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M3.5 5.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z"} size={isClean ? undefined : 15} look={look} />
          </button>
          <button type="button" className="ui-is__regen" data-focus-key="key" onClick={() => !busy && onGenerate()} aria-disabled={busy || undefined}>
            {busy ? (
              <>
                <span className="ui-is__spinner" aria-hidden="true" />
                <span className="ui-is__sr">Regenerating…</span>
              </>
            ) : (
              "Regenerate"
            )}
          </button>
        </div>
      ) : (
        <button type="button" className="ui-is__generate" data-focus-key="key" onClick={() => !busy && onGenerate()} aria-disabled={busy || undefined}>
          {isClean ? (
            <>
              {busy ? (
                <span className="ui-is__shimmer">
                  Generating…
                  {/* A narrow window sweeps a full-colour copy of the label across it (transform only) */}
                  <span className="ui-is__shine" aria-hidden="true">
                    <span>Generating…</span>
                  </span>
                </span>
              ) : (
                <span>Generate a new API key</span>
              )}
              <KeyIcon />
            </>
          ) : (
            <>
              <span>{busy ? "Generating…" : "Generate a new API key"}</span>
              {busy ? <span className="ui-is__spinner" aria-hidden="true" /> : <KeyIcon />}
            </>
          )}
        </button>
      )}
      {error && (
        <p className="ui-is__note" data-error="" role="alert">
          {error}
        </p>
      )}
      {apiKey && revealed && !error && (
        <p className="ui-is__note">
          {copied ? "Copied to the clipboard." : "Copy it now – it is shown in full only once."}
        </p>
      )}
    </div>
  );
}

type SaveBarProps = { open: boolean; error: string; clean: boolean; saving: boolean; canSave: boolean; onDiscard: () => void; onSave: () => void };

/** Standard: the save bar below the card · Clean: the card's last row – it slides open when something changed */
function SaveBar({ open, error, clean, saving, canSave, onDiscard, onSave }: SaveBarProps) {
  return (
    <div className="ui-is__save" data-open={open || undefined} inert={!open}>
      <div className="ui-is__save-inner">
        {error ? (
          <span className={clean ? "ui-is__save-text" : "ui-is__save-error"} data-error={clean ? "" : undefined} role="alert">
            {error}
          </span>
        ) : (
          <span className={clean ? "ui-is__save-text" : undefined}>Unsaved changes</span>
        )}
        <div className="ui-is__save-actions">
          <button type="button" className="ui-is__btn" onClick={onDiscard}>
            Discard
          </button>
          <button type="button" className="ui-is__btn ui-is__btn--primary" onClick={onSave} disabled={!canSave || saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function IntegrationSettings({
  name,
  logo,
  count,
  meta,
  values: valuesProp,
  defaultValues,
  onValuesChange,
  siteHint = "Your store's primary domain, without https://",
  timeZones = defaultZones,
  onGenerateKey,
  onSave,
  onToggle,
  demo = false,
  look,
  className,
  ref,
  ...rest
}: IntegrationSettingsProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const isClean = resolvedLook === "clean";
  const root = useRef<HTMLElement>(null);
  const rootRef = useRootRef(root, ref);
  const full = (v: Partial<IntegrationValues> | undefined): IntegrationValues => ({ enabled: true, siteUrl: "", timeZone: timeZones[0], apiKey: null, ...v });
  // The saved values: the `values` prop when passed, else kept here from defaultValues – which are read again
  // whenever they change (data that arrives after the first render)
  // (Not useControllable: following new defaultValues must not be reported as a change)
  const defaults = full(defaultValues);
  const [ownSaved, setOwnSaved] = useState(defaults);
  const [lastDefaults, setLastDefaults] = useState(defaults);
  if (!sameValues(defaults, lastDefaults)) {
    setLastDefaults(defaults);
    setOwnSaved(defaults);
  }
  const saved = valuesProp ? full(valuesProp) : ownSaved;
  const latestSaved = useRef(saved);
  useEffect(() => {
    latestSaved.current = saved;
  });
  const setSaved = (next: IntegrationValues) => {
    latestSaved.current = next;
    if (valuesProp === undefined) setOwnSaved(next);
    onValuesChange?.(next);
  };
  // The draft being edited; when the saved values change, fields that weren't edited follow (adjusted while rendering)
  const [values, setValues] = useState(saved);
  const [base, setBase] = useState(saved);
  if (!sameValues(saved, base)) {
    setBase(saved);
    setValues(rebase(values, base, saved));
  }
  const [keyState, setKeyState] = useState<"idle" | "busy">("idle");
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [saveError, setSaveError] = useState("");
  // Results that arrive after unmount are ignored, and running work is aborted
  const alive = useRef(true);
  const timers = useRef<number[]>([]);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    const pending = timers.current;
    const controller = new AbortController();
    abort.current = controller;
    return () => {
      alive.current = false;
      controller.abort();
      pending.forEach(clearTimeout);
    };
  }, []);
  const signal = () => (abort.current ??= new AbortController()).signal;
  const urlId = useId();
  const hintId = useId();
  // The persistent status region: final results only (key generated, copied, saved, discarded)
  const [announce, setAnnounce] = useState("");
  // The address is checked when the field is left (and the error clears as soon as it's fixed), not per keystroke
  const [showUrlError, setShowUrlError] = useState(false);
  const focusField = () => root.current?.querySelector<HTMLElement>(".ui-is__field input");
  // Focus never drops to <body>: Generate ↔ Regenerate share a focus key; a closing save bar hands focus to the field
  useFocusRescue(root, { fallback: () => focusField() ?? root.current?.querySelector<HTMLElement>(".ui-is__switch") });

  const url = clean(values.siteUrl);
  const urlValid = url === "" || DOMAIN.test(url);
  const urlError = showUrlError && !urlValid;
  const dirty = values.siteUrl !== saved.siteUrl || values.timeZone !== saved.timeZone || values.apiKey !== saved.apiKey;

  const set = (patch: Partial<IntegrationValues>) => setValues((v) => ({ ...v, ...patch }));

  const generate = async () => {
    if (keyState === "busy") return;
    setKeyState("busy");
    setKeyError("");
    if (!onGenerateKey && !demo) warnDemoKey();
    try {
      // The made-up key says it's a demo, so it can't pass for a live one
      const key = await (onGenerateKey
        ? onGenerateKey({ signal: signal() })
        : new Promise<string>((r) =>
            timers.current.push(
              window.setTimeout(
                () => r(`sk_demo_${Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("")}`),
                700,
              ),
            ),
          ));
      if (!alive.current) return;
      set({ apiKey: key });
      setRevealed(true);
      setCopied(false);
      setAnnounce("New key generated. Copy it now – it is shown in full only once.");
    } catch {
      if (alive.current) setKeyError("The key couldn't be generated. Try again.");
    } finally {
      if (alive.current) setKeyState("idle");
    }
  };

  const copy = async () => {
    if (!values.apiKey) return;
    try {
      await navigator.clipboard.writeText(values.apiKey);
    } catch {
      // Denied, or no clipboard at all (insecure page)
      if (alive.current) setKeyError("Couldn't copy the key – select it and copy it by hand.");
      return;
    }
    if (!alive.current) return;
    setKeyError("");
    setCopied(true);
    setAnnounce("Key copied to the clipboard.");
    timers.current.push(window.setTimeout(() => setCopied(false), 1400));
  };

  const save = async () => {
    if (!urlValid || saving) return;
    setSaving(true);
    setSaveError("");
    const next = { ...values, siteUrl: url };
    try {
      await onSave?.(next, { signal: signal() });
      if (!alive.current) return;
      // The save bar closes (inert): focus goes to the address field first
      rescueFocus(root.current?.querySelector(".ui-is__save"), [focusField]);
      setValues(next);
      setBase(next);
      setSaved(next);
      setAnnounce("Changes saved.");
    } catch {
      if (alive.current) setSaveError("Couldn't save – try again.");
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const toggle = async () => {
    if (toggling) return;
    const enabled = !values.enabled;
    setToggleError("");
    const result = onToggle?.(enabled, { signal: signal() });
    if (result instanceof Promise) {
      setToggling(true);
      try {
        await result;
      } catch {
        if (alive.current) {
          setToggling(false);
          setToggleError(enabled ? `Couldn't switch ${name} on – try again.` : `Couldn't pause ${name} – try again.`);
        }
        return;
      }
      if (!alive.current) return;
      setToggling(false);
    }
    // The switch saves at once: the draft and the saved values both flip
    setValues((v) => ({ ...v, enabled }));
    setBase((b) => ({ ...b, enabled }));
    setSaved({ ...latestSaved.current, enabled });
  };

  // The API key, the site address and the time zone
  const sections = (
    <>
      <ApiKey
        apiKey={values.apiKey}
        revealed={revealed}
        copied={copied}
        busy={keyState === "busy"}
        error={keyError}
        look={resolvedLook}
        onReveal={() => setRevealed((r) => !r)}
        onCopy={copy}
        onGenerate={generate}
      />

      <div className="ui-is__section">
        <label className="ui-is__label" htmlFor={urlId}>
          Site address
        </label>
        <div className="ui-is__field" data-invalid={urlError || undefined}>
          <span className="ui-is__prefix">https://</span>
          <input
            id={urlId}
            value={values.siteUrl}
            onChange={(e) => {
              const next = e.target.value.replace(/^https?:\/\//i, "");
              set({ siteUrl: next });
              // A shown error clears as soon as the address is fixed
              const v = clean(next);
              if (v === "" || DOMAIN.test(v)) setShowUrlError(false);
            }}
            onBlur={() => setShowUrlError(!urlValid)}
            placeholder="yourstore.com"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={urlError}
            aria-describedby={hintId}
          />
          {url && urlValid && <span className="ui-is__ok" aria-hidden="true"><Icon d="m3.5 8.5 3 3 6-7" size={isClean ? undefined : 14} look={resolvedLook} /></span>}
        </div>
        {/* Mounted from the start and changed only on leaving the field, so the error is announced once */}
        <p className="ui-is__hint" id={hintId} data-error={urlError || undefined} aria-live="polite">
          {urlError ? "That doesn't look like a domain – try something like yourstore.com" : siteHint}
        </p>
      </div>

      <div className="ui-is__section">
        <span className="ui-is__label" id={`${urlId}-tz`}>
          Time zone
        </span>
        <ZonePicker zones={timeZones} value={values.timeZone} onChange={(timeZone) => set({ timeZone })} labelledBy={`${urlId}-tz`} look={resolvedLook} />
      </div>
    </>
  );

  return (
    <>
      <style href="ui-integration-settings" precedence="default">
        {css}
      </style>
      <section
        aria-label={`${name} settings`}
        {...rest}
        ref={rootRef}
        className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
        data-look={resolvedLook}
        data-off={!values.enabled || undefined}
      >
        <header className="ui-is__head">
          <span className="ui-is__logo">{logo}</span>
          <span className="ui-is__who">
            <span className="ui-is__name">
              <span className="ui-is__name-text">{name}</span>
              {count !== undefined && <span className="ui-is__count">{INTEGER.format(count)}</span>}
            </span>
            <span className="ui-is__meta" data-error={toggleError ? "" : undefined} role={toggleError ? "alert" : undefined}>
              {toggleError || (values.enabled ? meta : "Paused – no data is synced")}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={values.enabled}
            aria-busy={toggling || undefined}
            aria-label={`${name} sync`}
            className="ui-is__switch"
            data-pending={toggling || undefined}
            onClick={toggle}
          >
            <span />
          </button>
        </header>

        <div className="ui-is__fold" data-open={values.enabled || undefined} inert={!values.enabled}>
          <div className="ui-is__fold-inner">
            {/* Standard: the settings sit on a white card inside the tray · Clean: hairline-separated sections */}
            {isClean ? sections : <div className="ui-is__card">{sections}</div>}

            {/* Standard: the save bar below the card · Clean: the card's last row – it slides open when something changed */}
            <SaveBar
              open={dirty}
              error={saveError}
              clean={isClean}
              saving={saving}
              canSave={urlValid}
              onDiscard={() => {
                rescueFocus(root.current?.querySelector(".ui-is__save"), [focusField]);
                setValues(saved);
                setSaveError("");
                setShowUrlError(false);
                setAnnounce("Changes discarded.");
              }}
              onSave={save}
            />
          </div>
        </div>
        <span className="ui-is__sr" role="status">
          {announce}
        </span>
      </section>
    </>
  );
}

/**
 * Time zone dropdown with a search field. The search field is a combobox for the listbox below it (APG): focus stays
 * in the field, ↑/↓/Home/End move the active zone, Enter picks it, Esc closes; picking and Esc return focus to the
 * trigger, Tab (or focus leaving) closes the menu.
 */
function ZonePicker({
  zones,
  value,
  onChange,
  labelledBy,
  look,
}: {
  zones: string[];
  value: string;
  onChange: (v: string) => void;
  labelledBy: string;
  look: Look;
}) {
  const isClean = look === "clean";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const optionId = (i: number) => `${id}-o${i}`;

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open]);

  const list = useMemo(() => zones.filter((z) => z.toLowerCase().includes(query.trim().toLowerCase())), [zones, query]);
  const at = Math.min(active, list.length - 1);

  useEffect(() => {
    if (open && at >= 0) document.getElementById(optionId(at))?.scrollIntoView?.({ block: "nearest" });
  });

  // Focus moves to the trigger before the menu unmounts, so it never drops to <body>
  const close = () => {
    triggerRef.current?.focus({ preventScroll: true });
    setOpen(false);
  };
  const pick = (z: string) => {
    onChange(z);
    close();
  };
  const openMenu = () => {
    setQuery("");
    setActive(Math.max(0, zones.indexOf(value)));
    setOpen(true);
  };

  const search = (
    <input
      autoFocus
      role="combobox"
      aria-expanded="true"
      aria-controls={`${id}-list`}
      aria-autocomplete="list"
      aria-activedescendant={at >= 0 ? optionId(at) : undefined}
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setActive(0);
      }}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        const last = list.length - 1;
        const move = (i: number) => {
          e.preventDefault();
          setActive(Math.max(0, Math.min(last, i)));
        };
        if (e.key === "ArrowDown") move(at + 1);
        else if (e.key === "ArrowUp") move(at - 1);
        else if (e.key === "Home" && e.ctrlKey) move(0);
        else if (e.key === "End" && e.ctrlKey) move(last);
        else if (e.key === "Enter") {
          e.preventDefault();
          if (list[at]) pick(list[at]);
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close();
        } else if (e.key === "Tab") setOpen(false);
      }}
      placeholder="Search city or offset"
      aria-label="Search time zones"
    />
  );

  return (
    <div
      className="ui-is__zone"
      ref={ref}
      onBlur={(e) => {
        // Focus left the picker (Tab, or a click elsewhere): close
        if (open && !ref.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        className="ui-is__field ui-is__zone-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelledBy} ${id}-trigger`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openMenu();
          }
        }}
      >
        <span className="ui-is__zone-value">{value}</span>
        <ClockIcon look={look} />
      </button>
      {open && (
        <div className="ui-is__menu">
          <div className="ui-is__menu-search">
            {isClean && <Icon d="M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM13.5 13.5 10.6 10.6" look={look} />}
            {search}
          </div>
          {list.length === 0 && <p className="ui-is__menu-empty">No time zone matches.</p>}
          <div className="ui-is__menu-list" id={`${id}-list`} role="listbox" aria-labelledby={labelledBy}>
            {list.map((z, i) => (
              <div
                key={z}
                id={optionId(i)}
                role="option"
                aria-selected={z === value}
                data-active={i === at || undefined}
                className="ui-is__option"
                // Keep focus in the search field while clicking
                onPointerDown={(e) => e.preventDefault()}
                onPointerMove={() => setActive(i)}
                onClick={() => pick(z)}
              >
                {z}
                {z === value && <Icon d="m3.5 8.5 3 3 6-7" size={isClean ? undefined : 14} look={look} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const KeyIcon = () => (
  <svg className="ui-is__glyph-solid" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M10.5 1.5a4 4 0 0 0-3.86 5.05L1.8 11.4a1 1 0 0 0-.3.7v1.9a.5.5 0 0 0 .5.5h1.9a.5.5 0 0 0 .5-.5V13h1v-1h1v-1l.95-.95A4 4 0 1 0 10.5 1.5Zm1 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
  </svg>
);
/** Standard: a filled clock face · Clean: a line clock */
const ClockIcon = ({ look }: { look: Look }) =>
  look === "clean" ? (
    <Icon d="M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM8 4.5V8l2.5 1.5" look={look} />
  ) : (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="var(--tc-text-muted, var(--_tc-text-muted))" />
      <path d="M8 4.5V8h3" fill="none" stroke="var(--tc-surface-raised, var(--_tc-surface-raised))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
const Icon = ({ d, size = 16, look }: { d: string; size?: number; look: Look }) => (
  <svg
    className="ui-is__glyph"
    viewBox="0 0 16 16"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={look === "clean" ? "1.2" : "1.4"}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

/* ---------- Shared helpers (inlined from src/internal) ---------- */

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
function rescueFocus(
  from: Element | null | undefined,
  targets: Array<Element | string | null | undefined | (() => Element | null | undefined)>,
  within: ParentNode = document,
) {
  const active = document.activeElement;
  if (!from || !active || !from.contains(active)) return false;
  for (const t of targets) {
    const el = typeof t === "function" ? t() : typeof t === "string" ? within.querySelector(t) : t;
    if (el !== active && focusable(el)) {
      (el as HTMLElement).focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

type Options = {
  /** Where focus goes when the control it was on is gone – gets that control's `data-focus-key` (if it had one) */
  fallback?: (key: string | null) => Element | null | undefined;
};

/**
 * Safety net for a component's root: when the focused element inside it is removed, disabled or made inert and
 * focus fell to <body>, focus moves (before paint) to
 *   1. an element with the same `data-focus-key` (the control was re-mounted, e.g. a card moved to another list),
 *   2. `fallback(key)`, e.g. the next row or the trigger,
 *   3. the root itself (made focusable with tabindex=-1 if it isn't).
 * Prefer moving focus explicitly with rescueFocus where the right target is known; this catches the rest.
 */
function useFocusRescue(root: RefObject<HTMLElement | null>, options: Options = {}) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    const el = root.current;
    if (!el || typeof MutationObserver !== "function") return;
    let last: HTMLElement | null = null;
    const onFocusIn = (e: FocusEvent) => {
      last = e.target instanceof HTMLElement ? e.target : null;
    };
    const check = () => {
      const prev = last;
      if (!prev || !el.isConnected) return;
      const gone = !focusable(prev);
      const active = document.activeElement;
      const lost = !active || active === document.body || active === prev;
      if (!lost || !gone) return;
      const key = prev.getAttribute("data-focus-key");
      const same = key ? [...el.querySelectorAll(`[data-focus-key="${CSS.escape(key)}"]`)].find((c) => c !== prev && focusable(c)) : null;
      const target = [same, latest.current.fallback?.(key)].find(focusable) as HTMLElement | undefined;
      last = null;
      if (target) target.focus({ preventScroll: true });
      else {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [root]);
}

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
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

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-is:where([data-look="standard"]),
.ui-is__portal:where([data-look="standard"]) {
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #232326);
  --_tc-field-bg-sunken: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-field-font-size: 13px;
  --_tc-field-h: 36px;
  --_tc-field-px: 12px;
  --_tc-field-radius: 10px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-invalid: inset 0 0 0 1px light-dark(#e5484d, #ff6369);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-halo-width: 3px;
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring: light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xl: 16px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-menu-item-px: 10px;
  --_tc-menu-item-radius: 8px;
  --_tc-menu-item-selected-fg: light-dark(#2456d6, #8ab4ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-pill-radius: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-control: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-border: color-mix(in srgb, light-dark(#1f8a4c, #3ec27a) 40%, transparent);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-switch-h: 20px;
  --_tc-switch-knob: 16px;
  --_tc-switch-knob-bg: #ffffff;
  --_tc-switch-off: light-dark(#858585, #7c7c82);
  --_tc-switch-on: #2f68ff;
  --_tc-switch-radius: 999px;
  --_tc-switch-w: 32px;
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
  --_tc-z-dropdown: 30;
}
.ui-is:where([data-look="clean"]),
.ui-is__portal:where([data-look="clean"]) {
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #252527);
  --_tc-field-bg-sunken: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-field-font-size: 13px;
  --_tc-field-h: 32px;
  --_tc-field-px: 10px;
  --_tc-field-radius: 8px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52));
  --_tc-field-shadow-invalid: inset 0 0 0 1px light-dark(#e5484d, #ff6369);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-halo-width: 3px;
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring: light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xl: 16px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-menu-item-px: 8px;
  --_tc-menu-item-radius: 6px;
  --_tc-menu-item-selected-fg: light-dark(#0058cf, #70b8ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-pill-radius: 5px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-control: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-border: color-mix(in srgb, light-dark(#1f8a4c, #3ec27a) 40%, transparent);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-switch-h: 16px;
  --_tc-switch-knob: 12px;
  --_tc-switch-knob-bg: #ffffff;
  --_tc-switch-off: light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-switch-on: light-dark(#0060e2, #1a6cf0);
  --_tc-switch-radius: 5px;
  --_tc-switch-w: 28px;
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
@media (forced-colors: active) {
  :where([data-look], [data-look] *):not(#tc-fc):is(button, [role="button"], [role="switch"], [role="combobox"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, textarea):not([role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"]) { border: 1px solid ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(input, select, textarea) { border-color: FieldText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([role="listbox"], [role="menu"], [role="dialog"], [role="tooltip"], [role="tablist"], [role="radiogroup"]) { outline: 1px solid CanvasText; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) { forced-color-adjust: none; background: Highlight !important; color: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) * { color: HighlightText !important; background: none !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"] span:empty { background: ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"][aria-checked="true"] span:empty { background: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(:disabled, [aria-disabled="true"]) { color: GrayText !important; border-color: GrayText !important; }
}

:where([data-look="standard"], [data-look="standard"] *).ui-is {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  /* The tray pattern: the header lives on the tray, the settings in the card on top of it */
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-is */
:where([data-look="clean"], [data-look="clean"] *).ui-is {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
  /* One white card – the edge is a shadow, not a border */
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-is *, .ui-is *::before, .ui-is *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-is button { margin: 0; font: inherit; color: inherit; cursor: pointer; }
.ui-is button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__head { display: flex; align-items: center; gap: var(--tc-space-3-5, var(--_tc-space-3-5)); padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--tc-radius-xl, var(--_tc-radius-xl));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
}
:where([data-look="clean"], [data-look="clean"] *):where(.ui-is) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-is) svg { display: block; flex: none; }
/* Header: logo tile, name with count, meta line and the switch */
:where([data-look="clean"], [data-look="clean"] *).ui-is__head { display: flex; align-items: center; gap: var(--tc-space-3, var(--_tc-space-3)); padding: var(--tc-space-4, var(--_tc-space-4)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
}
.ui-is__logo svg { width: 22px; height: 22px; }
.ui-is__who { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__name { display: inline-flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); }
/* Count: the pill pattern */
.ui-is__count {
  display: inline-flex;
  align-items: center;
  flex: none;
  height: var(--tc-pill-h, var(--_tc-pill-h));
  padding: 0 var(--tc-pill-px, var(--_tc-pill-px));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__meta { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* The switch pattern; the off track is --tc-switch-off (≥ 3:1), on is the accent */
.ui-is__switch {
  position: relative;
  flex: none;
  width: var(--tc-switch-w, var(--_tc-switch-w));
  height: var(--tc-switch-h, var(--_tc-switch-h));
  padding: 0;
  border: 0;
  border-radius: var(--tc-switch-radius, var(--_tc-switch-radius));
  background: var(--tc-switch-off, var(--_tc-switch-off)) !important;
  transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-is__switch[aria-checked="true"] { background: var(--tc-switch-on, var(--_tc-switch-on)) !important; }
.ui-is__switch span {
  position: absolute;
  top: var(--tc-space-0-5, var(--_tc-space-0-5));
  left: var(--tc-space-0-5, var(--_tc-space-0-5));
  width: var(--tc-switch-knob, var(--_tc-switch-knob));
  height: var(--tc-switch-knob, var(--_tc-switch-knob));
  /* the track radius less the 2px inset */
  border-radius: calc(var(--tc-switch-radius, var(--_tc-switch-radius)) - var(--tc-space-0-5, var(--_tc-space-0-5)));
  background: var(--tc-switch-knob-bg, var(--_tc-switch-knob-bg));
  box-shadow: var(--tc-shadow-control, var(--_tc-shadow-control));
  transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-is__switch[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w, var(--_tc-switch-w)) - var(--tc-switch-h, var(--_tc-switch-h)))); }
/* A hit area of at least 24 × 24 around the small switch */
.ui-is__switch::after { content: ""; position: absolute; inset: -8px -6px; }
/* Switching off folds the settings away */
:where([data-look="standard"], [data-look="standard"] *).ui-is__fold { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__name { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__name-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__meta { overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* A small switch: 28×16, white knob with the card shadow */
/* Switching off folds the settings away – only this part animates, the header stays */
:where([data-look="clean"], [data-look="clean"] *).ui-is__fold { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-is__fold[data-open] { grid-template-rows: 1fr; opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__fold-inner { min-height: 0; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__fold-inner { min-width: 0; min-height: 0; overflow: hidden; }
.ui-is__fold[data-open] .ui-is__fold-inner { overflow: visible; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__card {
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__section { padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4-5, var(--_tc-space-4-5)) var(--tc-space-4-5, var(--_tc-space-4-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__section + .ui-is__section { border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__label { display: block; margin-bottom: var(--tc-space-2, var(--_tc-space-2)); font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__generate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: var(--tc-field-h, var(--_tc-field-h));
  padding: 0 var(--tc-field-px, var(--_tc-field-px));
  border: 0;
  border-radius: var(--tc-field-radius, var(--_tc-field-radius));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)) !important;
  color: var(--tc-text-muted, var(--_tc-text-muted)) !important;
  text-align: left;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__generate:hover:not([aria-disabled="true"]) { background: var(--tc-fill-strong, var(--_tc-fill-strong)); color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
/* Sections sit right in the card, split by hairlines */
:where([data-look="clean"], [data-look="clean"] *).ui-is__section { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__label { display: block; margin: 0 0 var(--tc-space-1-5, var(--_tc-space-1-5)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* No key yet: a quiet full-width slot */
:where([data-look="clean"], [data-look="clean"] *).ui-is__generate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2, var(--_tc-space-2));
  width: 100%;
  height: 32px;
  padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-2-5, var(--_tc-space-2-5)) !important;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-fill-subtle, var(--_tc-fill-subtle)) !important;
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default));
  color: var(--tc-text-secondary, var(--_tc-text-secondary)) !important;
  text-align: left;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__generate svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__generate:hover:not([aria-disabled="true"]) { background: var(--tc-fill-default, var(--_tc-fill-default)) !important; color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__generate:hover:not([aria-disabled="true"]) svg { color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-is__generate[aria-disabled="true"] { cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__key {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  height: var(--tc-field-h, var(--_tc-field-h));
  padding: 0 6px 0 var(--tc-field-px, var(--_tc-field-px));
  border-radius: var(--tc-field-radius, var(--_tc-field-radius));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  animation: ui-is-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__key[data-new] { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); box-shadow: inset 0 0 0 1px var(--tc-status-success-border, var(--_tc-status-success-border)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__key code {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__mini {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: transparent;
  color: var(--tc-text-muted, var(--_tc-text-muted)) !important;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__mini:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
/* Regenerate: looks exactly like a small Button secondary */
.ui-is__regen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-width: 88px;
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  margin-left: var(--tc-space-0-5, var(--_tc-space-0-5));
  padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm)) !important;
  border: 0;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)) !important;
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size)) !important;
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)) !important;
  transition: box-shadow var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-is__regen:hover:not([aria-disabled="true"]) { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
.ui-is__regen[aria-disabled="true"] { cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__note { margin: var(--tc-space-2, var(--_tc-space-2)) 0 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__note[data-error] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__save-error { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* The key: a field-like row with ghost buttons; a fresh key gets a light green fill */
:where([data-look="clean"], [data-look="clean"] *).ui-is__key {
  display: flex;
  align-items: center;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  height: 36px;
  padding: 0 var(--tc-space-1, var(--_tc-space-1)) 0 var(--tc-space-2-5, var(--_tc-space-2-5));
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  transition: background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-is-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__key[data-new] { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); box-shadow: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__key code {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__mini {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted)) !important;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__mini:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)) !important; color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__key[data-new] .ui-is__mini:hover { background: var(--tc-fill-default, var(--_tc-fill-default)) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__note { margin: var(--tc-space-1-5, var(--_tc-space-1-5)) 0 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); animation: ui-is-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__note[data-error] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__save-text[data-error] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-is__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--tc-border-strong, var(--_tc-border-strong));
  border-top-color: var(--tc-text-primary, var(--_tc-text-primary));
  border-radius: 50%;
  animation: ui-is-spin var(--tc-duration-reveal, var(--_tc-duration-reveal)) linear infinite;
}
/* Fields: the field pattern – border-control ring (≥ 3:1), focus ring + halo on the wrapper, red ring when invalid */
.ui-is__field {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  width: 100%;
  height: var(--tc-field-h, var(--_tc-field-h));
  padding: 0 var(--tc-field-px, var(--_tc-field-px)) !important;
  border: 0;
  border-radius: var(--tc-field-radius, var(--_tc-field-radius));
  background: var(--tc-field-bg, var(--_tc-field-bg)) !important;
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  font-size: var(--tc-field-font-size, var(--_tc-field-font-size)) !important;
  color: var(--tc-text-primary, var(--_tc-text-primary)) !important;
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-is__field:hover { box-shadow: var(--tc-field-shadow-hover, var(--_tc-field-shadow-hover)); }
.ui-is__field:focus-within { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
.ui-is__field.ui-is__zone-btn:focus-visible { outline: none; }
.ui-is__field[data-invalid] { box-shadow: var(--tc-field-shadow-invalid, var(--_tc-field-shadow-invalid)); }
.ui-is__field[data-invalid]:focus-within { box-shadow: var(--tc-field-shadow-invalid, var(--_tc-field-shadow-invalid)), 0 0 0 var(--tc-focus-halo-width, var(--_tc-focus-halo-width)) color-mix(in srgb, var(--tc-status-danger-solid, var(--_tc-status-danger-solid)) 24%, transparent); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__prefix { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__field input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  font: inherit;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
/* Fields: white with the hairline shadow; invalid gets a light red fill */
:where([data-look="clean"], [data-look="clean"] *).ui-is__prefix { flex: none; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__field input {
  flex: 1;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
.ui-is__field input::placeholder,
.ui-is__menu-search input::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); opacity: 1; }
/* The wrapper shows the focus ring (field pattern) */
.ui-is__field input:focus,
.ui-is__menu-search input:focus { outline: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__ok { display: grid; color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); animation: ui-is-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__hint { margin: var(--tc-space-2, var(--_tc-space-2)) 0 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__hint[data-error] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__ok { display: grid; flex: none; color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); animation: ui-is-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__hint { margin: var(--tc-space-1-5, var(--_tc-space-1-5)) 0 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__hint[data-error] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-is__zone { position: relative; }
.ui-is__zone-btn { justify-content: space-between; gap: var(--tc-space-2, var(--_tc-space-2)); text-align: left; }
/* Zone menu: the menu pattern */
.ui-is__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  transform-origin: top center;
  animation: ui-is-drop var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
/* Search inside the menu: a sunken field with the field ring */
.ui-is__menu-search {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  margin: 0 0 var(--tc-space-1, var(--_tc-space-1));
  padding: 0 var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border-radius: calc(var(--tc-menu-radius, var(--_tc-menu-radius)) - var(--tc-menu-padding, var(--_tc-menu-padding)));
  background: var(--tc-field-bg-sunken, var(--_tc-field-bg-sunken));
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
}
.ui-is__menu-search:focus-within { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
.ui-is__menu-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
.ui-is__menu-list { display: grid; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); max-height: 200px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
.ui-is__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2, var(--_tc-space-2));
  min-height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 0 var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  cursor: pointer;
  transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
/* The active option (keyboard or pointer) – focus stays in the search field, so the ring marks it */
.ui-is__option[data-active] { background: var(--tc-menu-item-hover, var(--_tc-menu-item-hover)); }
.ui-is__menu:has(.ui-is__menu-search:focus-within) .ui-is__option[data-active] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) var(--tc-focus-ring, var(--_tc-focus-ring)); }
.ui-is__option[aria-selected="true"] { color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__menu-empty { margin: 0; padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2-5, var(--_tc-space-2-5)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Save bar in the gray extension, slides open when something changed */
:where([data-look="standard"], [data-look="standard"] *).ui-is__save { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-is__zone-value { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__zone-btn svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__option svg { animation: ui-is-pop var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__menu-empty { margin: 0; padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)); text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Save bar: the card's last row under a hairline, slides open when something changed */
:where([data-look="clean"], [data-look="clean"] *).ui-is__save { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: 0fr; transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-is__save[data-open] { grid-template-rows: 1fr; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__save-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  min-height: 0;
  overflow: hidden;
  padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-4-5, var(--_tc-space-4-5));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__save[data-open] .ui-is__save-inner { padding-top: var(--tc-space-2, var(--_tc-space-2)); padding-bottom: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__save-actions { display: flex; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
/* Discard and Save look exactly like Button secondary / primary */
.ui-is__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)) !important;
  border: 0;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)) !important;
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size)) !important;
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)) !important;
  transition: box-shadow var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-is__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
.ui-is__btn--primary { min-width: 56px; background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)) !important; box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)) !important; }
.ui-is__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)) !important; box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); }
.ui-is__btn--primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)) !important; }
.ui-is__btn--primary:disabled { opacity: 0.4; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__save-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  min-height: 0;
  overflow: hidden;
  padding: 0 var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-4, var(--_tc-space-4));
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__save[data-open] .ui-is__save-inner { padding-top: var(--tc-space-2-5, var(--_tc-space-2-5)); padding-bottom: var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__save-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__save-actions { display: flex; flex: none; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
/* Shimmer over the working label: a window and the full-colour copy inside it move in opposite directions, so the
   copy stays on the label – transform only, three passes and done */
:where([data-look="clean"], [data-look="clean"] *).ui-is__shimmer { position: relative; display: inline-block; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__shine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 40%;
  overflow: hidden;
  pointer-events: none;
  animation: ui-is-window var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3 both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__shine > span { display: block; white-space: nowrap; color: var(--tc-text-primary, var(--_tc-text-primary)); animation: ui-is-window-copy var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3 both; }
@keyframes ui-is-in { from { opacity: 0; transform: translateY(2px); } }
@keyframes ui-is-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-is-pop { from { opacity: 0; transform: scale(0.5); } }
@keyframes ui-is-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-is__fold,
:where([data-look="standard"], [data-look="standard"] *).ui-is__save,
:where([data-look="standard"], [data-look="standard"] *).ui-is__switch,
:where([data-look="standard"], [data-look="standard"] *).ui-is__switch span,
:where([data-look="standard"], [data-look="standard"] *).ui-is__generate { transition: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__key,
:where([data-look="standard"], [data-look="standard"] *).ui-is__menu,
:where([data-look="standard"], [data-look="standard"] *).ui-is__ok { animation: none; }
}
@keyframes ui-is-window { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
@keyframes ui-is-window-copy { from { transform: translateX(40%); } to { transform: translateX(-100%); } }
/* Narrow (phones): tighter padding, the key row keeps its buttons */
@container (max-width: 400px) {
:where([data-look="clean"], [data-look="clean"] *).ui-is__head { gap: var(--tc-space-2-5, var(--_tc-space-2-5)); padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__logo { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__logo svg { width: 20px; height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__section { padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__regen { min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__save-inner { padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-3, var(--_tc-space-3)); }
}
/* Touch screens: bigger targets; 16px text in fields so iOS doesn't zoom in */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-is__field,
:where([data-look="clean"], [data-look="clean"] *).ui-is__generate { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__field input,
:where([data-look="clean"], [data-look="clean"] *).ui-is__menu-search input { font-size: var(--tc-font-size-xl, var(--_tc-font-size-xl)); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__key { height: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__mini { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__regen,
:where([data-look="clean"], [data-look="clean"] *).ui-is__btn { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__menu-search { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__option { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-is *,
:where([data-look="clean"], [data-look="clean"] *).ui-is *::before,
:where([data-look="clean"], [data-look="clean"] *).ui-is *::after { animation: none !important; transition: none !important; }
}
/* Announcements for screen readers only */
.ui-is__sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ui-is__switch[data-pending] { opacity: 0.6; cursor: progress; }
.ui-is__meta[data-error] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
`;
