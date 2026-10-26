import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

const CURRENT = `import { db } from "../db";

const TTL_MS = 60 * 60 * 1000;

export async function getSession(token: string) {
  const session = await db.sessions.find(token);
  if (!session) return null;
  return session;
}

export async function touch(token: string) {
  await db.sessions.update(token, { seenAt: Date.now() });
}
`;

const SUGGESTED = `import { db } from "../db";

/** Sessions expire after an hour without activity */
const TTL_MS = 60 * 60 * 1000;

export async function getSession(token: string) {
  const session = await db.sessions.find(token);
  if (!session) return null;
  // Expired sessions are removed instead of being returned
  if (Date.now() - session.seenAt > TTL_MS) {
    await db.sessions.remove(token);
    return null;
  }
  return session;
}

export async function touch(token: string) {
  await db.sessions.update(token, { seenAt: Date.now() });
}
`;

const SHELL = `# Run the session tests once more
$ npm test -- --filter session
$ git commit -am "Expire idle sessions after an hour"`;

const CHUNK = 14;
const TICK_MS = 50;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CodeBlock } = ui;
  const [run, setRun] = useState(0);
  const [shown, setShown] = useState(0);
  const [applied, setApplied] = useState(false);

  // The assistant writes the fix in chunks, then stops
  useEffect(() => {
    setShown(0);
    setApplied(false);
    const t = setInterval(() => {
      setShown((n) => {
        const next = Math.min(SUGGESTED.length, n + CHUNK);
        if (next >= SUGGESTED.length) clearInterval(t);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [run]);

  const streaming = shown < SUGGESTED.length;
  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 12 }}>
      <CodeBlock
        filename="src/auth/session.ts"
        language="ts"
        code={SUGGESTED.slice(0, shown)}
        current={CURRENT}
        streaming={streaming}
        applied={applied}
        maxHeight={340}
        onApply={() => setApplied(true)}
      />
      <CodeBlock language="bash" code={SHELL} lineNumbers={false} />
      <div style={{ ...caption, textAlign: "center" }}>
        {streaming ? "Writing the fix…" : applied ? "Applied to src/auth/session.ts. " : "Open Diff to compare with the file, then Apply. "}
        {!streaming && (
          <button type="button" style={textButton} onClick={() => setRun((r) => r + 1)}>
            Write it again
          </button>
        )}
      </div>
    </div>
  );
}
