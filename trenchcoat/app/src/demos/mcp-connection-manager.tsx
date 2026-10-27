import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { McpConnection, McpCredential, McpServer } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* An engineering team's agent workspace. GitHub is connected; the database server is configured but off; the docs
   search failed this morning and comes back on Retry. Inspect a server to see what it exposes; Add server walks the
   form, and Test tries it first. The "client" below stands in for the app's MCP client – it waits a moment, honours the
   abort signal, and reports through `connections`. */

const CREDENTIALS: McpCredential[] = [
  { id: "vault/github-agents", label: "GitHub app token", hint: "9f1c" },
  { id: "vault/docs-search", label: "Docs search key", hint: "2a77" },
  { id: "vault/linear", label: "Linear API key", hint: "c410" },
];
const SERVERS: McpServer[] = [
  { id: "github", name: "GitHub", transport: "http", target: "https://mcp.github.example.com/v1", auth: "token", credentialRef: "vault/github-agents" },
  { id: "postgres", name: "Analytics database", transport: "stdio", target: "npx -y @modelcontextprotocol/server-postgres postgres://readonly@analytics/prod", auth: "none" },
  { id: "docs", name: "Docs search", transport: "sse", target: "https://docs.example.com/mcp/sse", auth: "token", credentialRef: "vault/docs-search" },
];
const FOUND: Record<string, Omit<McpConnection, "status">> = {
  github: {
    tools: [
      { name: "search_issues", description: "Find issues and pull requests by text, label or author" },
      { name: "get_pull_request", description: "Read a pull request with its diff and review comments" },
      { name: "create_issue", description: "Open an issue in a repository" },
      { name: "list_commits", description: "Commits on a branch, newest first" },
      { name: "create_review", description: "Leave a review on a pull request" },
    ],
    resources: [
      { name: "Repository README", uri: "repo://acme/web/README.md" },
      { name: "Contributing guide", uri: "repo://acme/web/CONTRIBUTING.md" },
    ],
    prompts: [
      { name: "summarize_pr", description: "Summarise a pull request for a reviewer" },
      { name: "triage_issue", description: "Suggest labels and an owner for a new issue" },
    ],
  },
  postgres: {
    tools: [
      { name: "query", description: "Run a read-only SQL query" },
      { name: "describe_table", description: "Columns, types and indexes of a table" },
    ],
    resources: [{ name: "Schema", uri: "postgres://analytics/prod/schema" }],
    prompts: [],
  },
  docs: {
    tools: [{ name: "search_docs", description: "Search the product documentation" }],
    resources: [],
    prompts: [{ name: "answer_with_citations", description: "Answer a question, citing the pages used" }],
  },
};
const START: Record<string, McpConnection> = {
  github: { status: "connected", at: "08:58", ...FOUND.github },
  docs: { status: "failed", at: "09:12", message: "401 – the token was rejected. It may have been rotated." },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { McpConnectionManager } = ui;
  const [servers, setServers] = useState(SERVERS);
  const [connections, setConnections] = useState(START);
  const [note, setNote] = useState("Retry the docs search, or connect the database.");
  const host = useRef<HTMLDivElement>(null);
  const report = (id: string, c: McpConnection) => setConnections((all) => ({ ...all, [id]: c }));
  /** The app's MCP client, in miniature */
  const reach = (server: McpServer, signal: AbortSignal, verb: string) => {
    const timer = setTimeout(() => {
      const at = new Date();
      const found = FOUND[server.id] ?? { tools: [{ name: "list_projects", description: "Projects the token can see" }, { name: "create_ticket", description: "Open a ticket" }], resources: [], prompts: [] };
      if (server.transport !== "stdio" && !/^https?:\/\/[^/]+\.[^/]+/.test(server.target)) return report(server.id, { status: "failed", at, message: "Nothing answered at that URL." });
      report(server.id, { status: "connected", at, ...found });
      setNote(`${server.name} ${verb}.`);
    }, 1200);
    signal.addEventListener("abort", () => clearTimeout(timer));
  };
  // Inspect GitHub on arrival, so what it exposes shows without a click
  useEffect(() => {
    const t = setTimeout(() => host.current?.querySelector<HTMLButtonElement>(".ui-mcs__inspect")?.click(), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={host} style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <McpConnectionManager
        description="Agents workspace · Engineering"
        credentials={CREDENTIALS}
        value={servers}
        connections={connections}
        onChange={(next, change) => {
          setServers(next);
          setNote(change.type === "add" ? `${change.server.name} added.` : `${change.server.name} removed.`);
        }}
        onConnect={(server, signal) => reach(server, signal, "connected")}
        onTest={(server, signal) => reach(server, signal, "works – add it to keep it")}
        onDisconnect={(server) => {
          report(server.id, { status: "disconnected", at: new Date(), ...FOUND[server.id] });
          setNote(`${server.name} disconnected.`);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setServers(SERVERS);
            setConnections(START);
            setNote("Back to the start.");
          }}
        >
          Start again
        </button>
      </div>
    </div>
  );
}
