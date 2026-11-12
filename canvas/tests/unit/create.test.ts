import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterAll, describe, expect, it } from "vitest";
import { AGENTS, agentFromEnv, changedFiles, create, createPrompt, formatClaude, formatGeneric, inside, slugify, type Agent } from "../../plugins/create";

describe("agents", () => {
  const installed = () => true;

  it("runs each agent headless, as its own docs say", () => {
    expect(AGENTS.claude.command("P")).toEqual(
      expect.arrayContaining(["claude", "-p", "P", "--output-format", "stream-json", "--permission-mode", "acceptEdits"]),
    );
    expect(AGENTS.claude.command("P")).toContain("Bash(npm *)");
    expect(AGENTS.claude.command("P")).not.toContain("Bash");
    expect(AGENTS.codex.command("P")).toEqual(["codex", "exec", "--sandbox", "workspace-write", "--json", "P"]);
    expect(AGENTS.gemini.command("P")).toEqual(["gemini", "-p", "P", "--approval-mode", "yolo", "--output-format", "stream-json"]);
    expect(AGENTS.opencode.command("P")).toEqual(["opencode", "run", "P"]);
  });

  it("takes the agent from the environment, or says what's wrong", () => {
    expect(agentFromEnv({}, installed)).toMatchObject({ id: "claude" });
    expect(agentFromEnv({ CANVAS_AGENT: "Codex" }, installed)).toMatchObject({ id: "codex", label: "Codex" });
    expect(agentFromEnv({ CANVAS_AGENT: "codex" }, () => false)).toEqual({ problem: expect.stringMatching(/`codex` isn't installed/) });
    expect(agentFromEnv({ CANVAS_AGENT: "nope" }, installed)).toEqual({ problem: expect.stringMatching(/use claude, codex, gemini, opencode/) });
    const custom = agentFromEnv({ CANVAS_AGENT_COMMAND: '["my-agent", "--yes", "{prompt}"]', CANVAS_AGENT_NAME: "Mine" }, installed) as Agent;
    expect(custom.label).toBe("Mine");
    expect(custom.command("P")).toEqual(["my-agent", "--yes", "P"]);
    expect(agentFromEnv({ CANVAS_AGENT_COMMAND: '["my-agent"]' }, installed)).toEqual({ problem: expect.stringMatching(/\{prompt\}/) });
    expect(agentFromEnv({ CANVAS_AGENT_COMMAND: "my-agent {prompt}" }, installed)).toEqual({ problem: expect.stringMatching(/JSON array/) });
  });

  it("turns Claude Code's stream into readable lines", () => {
    const line = JSON.stringify({
      type: "assistant",
      message: {
        content: [
          { type: "text", text: "Building it." },
          { type: "tool_use", name: "Write", input: { file_path: "src/elements/x.ts" } },
        ],
      },
    });
    expect(formatClaude(line)).toBe("Building it.\n→ Write src/elements/x.ts");
    expect(formatClaude(JSON.stringify({ type: "system", subtype: "init" }))).toBeNull();
    expect(formatClaude(JSON.stringify({ type: "result", is_error: true, result: "Boom" }))).toBe("Finished with an error: Boom");
  });

  it("reads other agents' events, and plain lines", () => {
    expect(formatGeneric('{"type":"message","content":"Done the docs"}')).toBe("Done the docs");
    expect(formatGeneric('{"type":"item","item":{"text":"Ran the tests"}}')).toBe("Ran the tests");
    expect(formatGeneric('{"type":"tool_use","tool":"shell"}')).toBe("→ shell");
    expect(formatGeneric("plain words")).toBe("plain words");
    expect(formatGeneric("   ")).toBeNull();
  });
});

describe("the job", () => {
  it("asks for the skill's steps 1 to 4, never the pull request", () => {
    const prompt = createPrompt({
      name: "Fancy Thing",
      slug: "fancy-thing",
      description: "Shows things",
      category: "Agents",
      reference: "/w/.canvas-reference.png",
    });
    expect(prompt).toContain(".claude/skills/new-component/SKILL.md");
    expect(prompt).toContain("--slugs fancy-thing");
    expect(prompt).toMatch(/Don't do step 5/);
    expect(prompt).toContain("<tc-fancy-thing>");
    expect(prompt).toContain("/w/.canvas-reference.png");
  });

  it("names, lists and confines files safely", () => {
    expect(slugify("  Fancy Thing! v2 ")).toBe("fancy-thing-v2");
    expect(
      changedFiles("?? trenchcoat/src/elements/a.ts\n M trenchcoat/README.md\n?? trenchcoat/node_modules\n?? canvas/node_modules\n?? trenchcoat/src/b 2.ts\n"),
    ).toEqual(["trenchcoat/README.md", "trenchcoat/src/elements/a.ts"]);
    expect(inside("/w/x", "trenchcoat/a.ts")).toBe("/w/x/trenchcoat/a.ts");
    expect(inside("/w/x", "../y/a.ts")).toBeNull();
  });
});

// The whole path, for real: a git repo, a worktree, an agent process, its log and its files. The agent is a short
// Node script, so no model is called
describe("the create endpoint", () => {
  const scratch = mkdtempSync(join(tmpdir(), "canvas-create-"));
  const repo = join(scratch, "repo");
  const worktrees = join(scratch, "worktrees");
  mkdirSync(join(repo, "trenchcoat/src/elements"), { recursive: true });
  mkdirSync(join(repo, "canvas"), { recursive: true });
  writeFileSync(join(repo, "trenchcoat/README.md"), "# Trenchcoat\n");
  // git keeps no empty folders: the worktree needs src/elements to exist
  writeFileSync(join(repo, "trenchcoat/src/elements/button.ts"), "");
  const run = (...args: string[]) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  run("init", "-q", "-b", "main");
  run("-c", "user.name=Test", "-c", "user.email=test@example.com", "add", ".");
  run("-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-q", "-m", "init");
  afterAll(() => rmSync(scratch, { recursive: true, force: true }));

  const fake: Agent = {
    id: "fake",
    label: "Fake agent",
    command: () => [
      process.execPath,
      "-e",
      "require('fs').writeFileSync('src/elements/fancy-thing.ts', 'export const x = 1;\\n'); console.log(JSON.stringify({ text: 'Wrote the element' })); console.log('All checks passed');",
    ],
    format: formatGeneric,
  };
  let handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>;
  const plugin = create({ root: join(repo, "trenchcoat"), agent: () => fake, worktrees });
  (plugin.configureServer as (s: unknown) => void)({ middlewares: { use: (fn: typeof handler) => (handler = fn) }, httpServer: null });

  async function call(method: string, url: string, data?: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
    const req = Object.assign(Readable.from(data === undefined ? [] : [Buffer.from(JSON.stringify(data))]), {
      method,
      url,
      headers: { host: "localhost:5210", origin: "http://localhost:5210", "content-type": "application/json" },
    }) as unknown as IncomingMessage;
    return new Promise((done) => {
      const res: { statusCode: number; setHeader(): void; end(text: string): void } = {
        statusCode: 200,
        setHeader() {},
        end(text) {
          done({ status: res.statusCode, body: JSON.parse(text) });
        },
      };
      void handler(req, res as unknown as ServerResponse, () => done({ status: 0, body: {} }));
    });
  }

  it("says which agent builds", async () => {
    expect((await call("GET", "/__canvas/create")).body).toEqual({ agent: "Fake agent", problem: "" });
  });

  it("refuses a request with no description, or a name that's taken", async () => {
    expect((await call("POST", "/__canvas/create", { name: "X" })).status).toBe(400);
    writeFileSync(join(repo, "trenchcoat/src/elements/taken.ts"), "");
    expect((await call("POST", "/__canvas/create", { name: "Taken", description: "d" })).status).toBe(409);
  });

  it("builds in a worktree of its own, then shows the log and the files it changed", async () => {
    const started = await call("POST", "/__canvas/create", { name: "Fancy Thing", description: "Shows things", category: "Agents" });
    const id = started.body.id as string;
    let job = (await call("GET", `/__canvas/create/${id}`)).body;
    for (let i = 0; i < 50 && job.state === "running"; i++) {
      await new Promise((r) => setTimeout(r, 100));
      job = (await call("GET", `/__canvas/create/${id}`)).body;
    }
    expect(job.state).toBe("done");
    expect(job.branch).toMatch(/^canvas\/new-fancy-thing-/);
    expect(String(job.dir).startsWith(worktrees)).toBe(true);
    expect(job.log).toEqual(expect.arrayContaining(["Wrote the element", "All checks passed", "Done: 1 files changed."]));
    expect(job.files).toEqual(["trenchcoat/src/elements/fancy-thing.ts"]);
    // This checkout is untouched
    expect(existsSync(join(repo, "trenchcoat/src/elements/fancy-thing.ts"))).toBe(false);

    const file = await call("GET", `/__canvas/create/${id}/file?path=${encodeURIComponent("trenchcoat/src/elements/fancy-thing.ts")}`);
    expect(file.body.code).toBe("export const x = 1;\n");
    expect((await call("GET", `/__canvas/create/${id}/file?path=${encodeURIComponent("trenchcoat/README.md")}`)).status).toBe(404);
    expect((await call("GET", `/__canvas/create/${id}?from=1`)).body.log).toEqual((job.log as string[]).slice(1));
    run("worktree", "remove", "--force", String(job.dir));
  });

  it("only answers the canvas's own origin", async () => {
    const req = Object.assign(Readable.from([]), {
      method: "POST",
      url: "/__canvas/create",
      headers: { host: "localhost:5210", origin: "https://example.com", "content-type": "application/json" },
    });
    const status = await new Promise<number>((done) => {
      const res: { statusCode: number; setHeader(): void; end(): void } = { statusCode: 200, setHeader() {}, end: () => done(res.statusCode) };
      void handler(req as unknown as IncomingMessage, res as unknown as ServerResponse, () => done(0));
    });
    expect(status).toBe(403);
  });
});
