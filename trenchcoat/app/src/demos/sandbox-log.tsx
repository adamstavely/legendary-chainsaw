import { useEffect, useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SandboxLogStep } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

// ANSI helpers, as a test runner prints them
const E = "\x1b[";
const green = (s: string) => `${E}32m${s}${E}39m`;
const red = (s: string) => `${E}31m${s}${E}39m`;
const yellow = (s: string) => `${E}33m${s}${E}39m`;
const cyan = (s: string) => `${E}36m${s}${E}39m`;
const dim = (s: string) => `${E}2m${s}${E}22m`;
const bold = (s: string) => `${E}1m${s}${E}22m`;

const INSTALL = [
  `${dim("npm")} ${yellow("warn")} deprecated inflight@1.0.6: This module is not supported, and leaks memory.`,
  `${dim("npm")} ${yellow("warn")} deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported`,
  "",
  "added 1,284 packages, and audited 1,285 packages in 18s",
  "",
  `212 packages are looking for funding`,
  `  run ${bold("npm fund")} for details`,
  "",
  `found ${green(bold("0"))} vulnerabilities`,
].join("\n");

const LINT = [
  "",
  `${E}4m/workspace/acme-billing/src/billing/proration.ts${E}24m`,
  `  ${dim("41:9")}  ${yellow("warning")}  'roundTo' is defined but never used  ${dim("@typescript-eslint/no-unused-vars")}`,
  "",
  yellow(bold("✖ 1 problem (0 errors, 1 warning)")),
].join("\n");

/** The test run, line by line – it streams in, then fails */
const TEST_LINES = [
  "",
  ` ${bold(cyan("RUN"))}  ${cyan("v3.2.4")} ${dim("/workspace/acme-billing")}`,
  "",
  ` ${green("✓")} src/billing/currency.test.ts ${dim("(12 tests)")} ${dim("38ms")}`,
  ` ${green("✓")} src/billing/tax.test.ts ${dim("(21 tests)")} ${dim("54ms")}`,
  ` ${green("✓")} src/billing/invoice.test.ts ${dim("(18 tests)")} ${yellow("412ms")}`,
  ` ${green("✓")} src/billing/coupons.test.ts ${dim("(9 tests)")} ${dim("27ms")}`,
  ` ${red("❯")} src/billing/proration.test.ts ${dim("(7 tests | ")}${red("1 failed")}${dim(")")} ${dim("61ms")}`,
  `   ${green("✓")} prorates a downgrade at the end of the cycle`,
  `   ${red("×")} prorates a mid-cycle upgrade ${dim("12ms")}`,
  `     ${red("→ expected 1449 to be 1450 // Object.is equality")}`,
  `   ${green("✓")} keeps the anchor day across months`,
  ` ${green("✓")} src/api/webhooks.test.ts ${dim("(14 tests)")} ${dim("96ms")}`,
  ` ${green("✓")} src/api/customers.test.ts ${dim("(31 tests)")} ${yellow("640ms")}`,
  "",
  `${red(dim("⎯⎯⎯⎯⎯⎯⎯"))}${E}1m${E}41m FAIL ${E}49m${E}22m${red(dim("⎯⎯⎯⎯⎯⎯⎯"))}`,
  "",
  `${red(bold(" FAIL "))} src/billing/proration.test.ts ${dim(">")} prorates a mid-cycle upgrade`,
  `${red(bold("AssertionError"))}: expected 1449 to be 1450 ${dim("// Object.is equality")}`,
  "",
  `${green("- Expected")}`,
  `${red("+ Received")}`,
  "",
  `${green("- 1450")}`,
  `${red("+ 1449")}`,
  "",
  ` ${cyan("❯")} src/billing/proration.test.ts:${yellow("48:31")}`,
  `     46|     const credit = prorate(plan.starter, { from: "2026-10-01", to: "2026-10-16" });`,
  `     47|     const charge = prorate(plan.growth, { from: "2026-10-16", to: "2026-11-01" });`,
  `     48|     expect(charge - credit).toBe(1450);`,
  `       |                               ${red("^")}`,
  "",
  `${dim(" Test Files ")} ${red(bold("1 failed"))} ${dim("|")} ${green(bold("6 passed"))} ${dim("(7)")}`,
  `${dim("      Tests ")} ${red(bold("1 failed"))} ${dim("|")} ${green(bold("111 passed"))} ${dim("(112)")}`,
  `${dim("   Duration ")} 2.41s`,
];

const RERUN_LINES = [
  "",
  ` ${bold(cyan("RUN"))}  ${cyan("v3.2.4")} ${dim("/workspace/acme-billing")}`,
  "",
  ` ${green("✓")} src/billing/proration.test.ts ${dim("(7 tests)")} ${dim("58ms")}`,
  "",
  `${dim(" Test Files ")} ${green(bold("1 passed"))} ${dim("(1)")}`,
  `${dim("      Tests ")} ${green(bold("7 passed"))} ${dim("(7)")}`,
  `${dim("   Duration ")} 0.62s`,
];

/** A deterministic 50,000-line verbose build, to show the windowing */
function bigBuild(): string {
  const out: string[] = [];
  const mods = ["billing/proration", "billing/invoice", "api/webhooks", "api/customers", "ui/Table", "ui/Chart", "lib/money", "lib/dates"];
  for (let i = 0; i < 50_000; i++) {
    const m = mods[i % mods.length];
    const ms = (i * 37) % 900;
    if (i % 997 === 0) out.push(`${yellow("warn")} ${dim(`[${String(i).padStart(5, "0")}]`)} chunk ${m}.js is larger than 500 kB after minification`);
    else out.push(`${dim(`[${String(i).padStart(5, "0")}]`)} ${green("transform")} src/${m}.ts ${dim(`${ms}ms`)}`);
  }
  out.push(green(bold(`✓ built 50,000 modules in 41.8s`)));
  return out.join("\n");
}

const BASE: SandboxLogStep[] = [
  { id: "install", command: "npm ci", label: "Install dependencies", output: INSTALL, exitCode: 0, duration: 18_400 },
  { id: "lint", command: "npm run lint", label: "Check code style", output: LINT, exitCode: 0, duration: 4_100 },
];

/** Lines per tick and the tick, in ms – the stream stops when the run is done */
const PER_TICK = 2;
const TICK = 140;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SandboxLog } = ui;
  const [run, setRun] = useState(0);
  // How far the stream got: lines of the failing run, then lines of the re-run
  const [shown, setShown] = useState(0);
  const [big, setBig] = useState(false);
  const total = TEST_LINES.length + RERUN_LINES.length;

  useEffect(() => {
    if (shown >= total) return;
    const id = window.setTimeout(() => setShown((n) => Math.min(total, n + PER_TICK)), shown === TEST_LINES.length ? 1200 : TICK);
    return () => window.clearTimeout(id);
  }, [shown, total]);

  const build = useMemo(() => (big ? bigBuild() : ""), [big]);

  const steps = useMemo<SandboxLogStep[]>(() => {
    const first = Math.min(shown, TEST_LINES.length);
    const second = Math.max(0, shown - TEST_LINES.length);
    const failed = first >= TEST_LINES.length;
    const list: SandboxLogStep[] = [
      ...BASE,
      {
        id: `test-${run}`,
        command: "npm test",
        label: "Run the test suite",
        output: TEST_LINES.slice(0, first).join("\n"),
        exitCode: failed ? 1 : undefined,
        duration: failed ? 9_240 : Math.round(first * 230),
      },
    ];
    if (failed)
      list.push({
        id: `rerun-${run}`,
        command: "npm test -- src/billing/proration.test.ts",
        label: "Re-run after rounding the credit up",
        output: RERUN_LINES.slice(0, second).join("\n"),
        exitCode: second >= RERUN_LINES.length ? 0 : undefined,
        duration: second >= RERUN_LINES.length ? 3_080 : Math.round(second * 360),
        status: second === 0 ? "queued" : undefined,
      });
    if (big) list.push({ id: "build", command: "npm run build -- --verbose", label: "Production build", output: build, exitCode: 0, duration: 41_800 });
    return list;
  }, [shown, run, big, build]);

  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 12 }}>
      <SandboxLog title="Sandbox" environment="ubuntu-24.04 · node 22.11 · ~/acme-billing" steps={steps} />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          style={buttonSm}
          onClick={() => {
            setRun((r) => r + 1);
            setShown(0);
          }}
        >
          Run again
        </button>
        <button type="button" style={buttonSm} onClick={() => setBig((b) => !b)}>
          {big ? "Remove the build log" : "Add a 50,000-line build log"}
        </button>
        <span>Try searching for “proration”.</span>
      </div>
    </div>
  );
}
