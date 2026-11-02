import { useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A session on a research institute's sample tracker. The demo answers a few commands itself; nothing runs. */

const WELCOME = "\x1b[2mSession started in ~/institute/sample-tracker\x1b[0m\n";
const ANSWERS: Record<string, string> = {
  ls: "\x1b[34mdocs\x1b[0m  \x1b[34msrc\x1b[0m  \x1b[34mtests\x1b[0m  package.json  README.md\n",
  "git status": "On branch \x1b[36mcold-chain-alerts\x1b[0m\n\x1b[31m  modified:   src/alerts/gaps.ts\x1b[0m\n\x1b[32m  new file:   tests/gaps.test.ts\x1b[0m\n",
  "npm test": " \x1b[32m✓\x1b[0m tests/barcode.test.ts (12)\n \x1b[32m✓\x1b[0m tests/gaps.test.ts (7)\n\n\x1b[1mTests\x1b[0m  \x1b[32m19 passed\x1b[0m (19)\n",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Terminal } = ui;
  const [output, setOutput] = useState(`${WELCOME}$ git status\n${ANSWERS["git status"]}`);
  const [running, setRunning] = useState(false);
  const timer = useRef(0);
  const stop = () => {
    window.clearTimeout(timer.current);
    setRunning(false);
    setOutput((o) => `${o}\x1b[33m^C\x1b[0m\n`);
  };
  const run = (command: string) => {
    setOutput((o) => `${o}$ ${command}\n`);
    if (!command.trim()) return;
    setRunning(true);
    timer.current = window.setTimeout(() => {
      setRunning(false);
      setOutput((o) => o + (ANSWERS[command.trim()] ?? `\x1b[31mcommand not found:\x1b[0m ${command}\n`));
    }, 700);
  };
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <Terminal
        description="~/institute/sample-tracker"
        prompt="$"
        output={output}
        running={running}
        height={220}
        history={["ls", "git status", "npm test"]}
        onTcCommand={(e) => run(e.detail.command)}
        onTcInterrupt={stop}
        onTcClear={() => setOutput("")}
      />
      <div style={{ ...caption, textAlign: "center" }}>Try ls or npm test. ↑ goes back through the history, Ctrl+C stops and Ctrl+L clears.</div>
    </div>
  );
}
