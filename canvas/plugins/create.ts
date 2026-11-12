// Creating new components from the canvas, in the dev server only. A designer describes a piece; a coding agent builds
// it by following the repo's own new-component skill (trenchcoat/.claude/skills/new-component), in a git worktree of
// its own so nothing touches this checkout until someone opens a pull request.
//
// The agent is your choice – any of these, run headless, with the model it's set up for:
//
//   CANVAS_AGENT          claude (the default), codex, gemini or opencode
//   CANVAS_AGENT_COMMAND  or your own command, as a JSON array with "{prompt}" where the prompt goes:
//                         ["my-agent", "--yes", "{prompt}"]
//   CANVAS_WORKTREES      where the worktrees go (default ~/.trenchcoat-canvas/worktrees – outside iCloud-synced folders)
//
//   GET    /__canvas/create                       which agent builds, or what's wrong with the setting
//   POST   /__canvas/create                       { name, description, category, reference? } → { id }
//   GET    /__canvas/create/<id>?from=<n>         the job: its state, and its log from line n
//   DELETE /__canvas/create/<id>                  stops it
//   GET    /__canvas/create/<id>/file?path=<p>    one of the files it changed
//   POST   /__canvas/create/<id>/preview          starts a canvas on the worktree → { url }
//   POST   /__canvas/create/<id>/pull-request     commits trenchcoat/, pushes the branch, opens a PR → { url }
//
// An agent edits files and runs commands. Each preset gives it no more than the skill needs, where the agent allows:
// Claude Code gets edits plus npm, npx, node and read-only git; Codex runs in its workspace-write sandbox; Gemini CLI
// has no narrower setting than yolo; opencode uses its own permission settings.
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";
import type { Plugin } from "vite";
import { body, sameOrigin, send } from "./riff";

export const CREATE = "/__canvas/create";

export type Agent = {
  id: string;
  label: string;
  /** The command and its arguments, with the prompt in place */
  command: (prompt: string) => string[];
  /** A line of the agent's output as something a person can read, or null to leave it out */
  format: (line: string) => string | null;
};

const CLAUDE_TOOLS = [
  "Read",
  "Edit",
  "Write",
  "Glob",
  "Grep",
  "Skill",
  "Bash(npm *)",
  "Bash(npx *)",
  "Bash(node *)",
  "Bash(git status*)",
  "Bash(git diff*)",
  "Bash(git log*)",
  "Bash(ls *)",
  "Bash(rm -rf node_modules/.vitest-cache)",
];

const short = (s: string, n = 160) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Claude Code's stream-json: its words, and each tool it uses, as one line */
export function formatClaude(line: string): string | null {
  let event: {
    type?: string;
    message?: { content?: { type: string; text?: string; name?: string; input?: Record<string, unknown> }[] };
    result?: string;
    is_error?: boolean;
  };
  try {
    event = JSON.parse(line);
  } catch {
    return line.trim() || null;
  }
  if (event.type === "assistant")
    return (
      (event.message?.content ?? [])
        .map((b) =>
          b.type === "text"
            ? b.text?.trim()
            : b.type === "tool_use"
              ? `→ ${b.name} ${short(String(b.input?.file_path ?? b.input?.command ?? b.input?.pattern ?? b.input?.skill ?? ""))}`.trim()
              : "",
        )
        .filter(Boolean)
        .join("\n") || null
    );
  if (event.type === "result") return event.is_error ? `Finished with an error: ${event.result ?? ""}` : null;
  return null;
}

/** Other agents' JSON events: whatever text they carry; plain lines as they are */
export function formatGeneric(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("{")) return trimmed;
  try {
    const event = JSON.parse(trimmed) as Record<string, unknown>;
    // The words, wherever the event keeps them: a text-like key first, then inside any nested object
    const pick = (o: Record<string, unknown>, depth = 0): string | null => {
      for (const key of ["text", "message", "content", "result", "command", "output"]) {
        const v = o[key];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
      if (depth > 3) return null;
      for (const v of Object.values(o))
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const inner = pick(v as Record<string, unknown>, depth + 1);
          if (inner) return inner;
        }
      return null;
    };
    const text = pick(event);
    const tool = typeof event.tool === "string" ? event.tool : typeof event.name === "string" ? event.name : null;
    return text ? short(text, 400) : tool ? `→ ${tool}` : null;
  } catch {
    return trimmed;
  }
}

export const AGENTS: Record<string, Agent> = {
  claude: {
    id: "claude",
    label: "Claude Code",
    command: (p) => ["claude", "-p", p, "--output-format", "stream-json", "--verbose", "--permission-mode", "acceptEdits", "--allowedTools", ...CLAUDE_TOOLS],
    format: formatClaude,
  },
  codex: { id: "codex", label: "Codex", command: (p) => ["codex", "exec", "--sandbox", "workspace-write", "--json", p], format: formatGeneric },
  gemini: {
    id: "gemini",
    label: "Gemini CLI",
    command: (p) => ["gemini", "-p", p, "--approval-mode", "yolo", "--output-format", "stream-json"],
    format: formatGeneric,
  },
  opencode: { id: "opencode", label: "opencode", command: (p) => ["opencode", "run", p], format: formatGeneric },
};

/** The agent the environment asks for, or what's wrong with the setting */
export function agentFromEnv(
  env: Record<string, string | undefined> = process.env,
  onPath = (cmd: string) => spawnSync("which", [cmd]).status === 0,
): Agent | { problem: string } {
  if (env.CANVAS_AGENT_COMMAND) {
    let parts: unknown;
    try {
      parts = JSON.parse(env.CANVAS_AGENT_COMMAND);
    } catch {
      return { problem: 'CANVAS_AGENT_COMMAND must be a JSON array, like ["my-agent", "{prompt}"].' };
    }
    if (!Array.isArray(parts) || !parts.length || !parts.every((p) => typeof p === "string") || !parts.includes("{prompt}"))
      return { problem: 'CANVAS_AGENT_COMMAND must be a JSON array of strings with "{prompt}" in it.' };
    const [cmd] = parts as string[];
    return {
      id: "custom",
      label: env.CANVAS_AGENT_NAME || cmd,
      command: (p) => (parts as string[]).map((a) => (a === "{prompt}" ? p : a)),
      format: formatGeneric,
    };
  }
  const id = (env.CANVAS_AGENT ?? "claude").toLowerCase();
  const agent = AGENTS[id];
  if (!agent) return { problem: `CANVAS_AGENT is “${env.CANVAS_AGENT}”: use ${Object.keys(AGENTS).join(", ")}, or set CANVAS_AGENT_COMMAND.` };
  const [cmd] = agent.command("");
  if (!onPath(cmd)) return { problem: `CANVAS_AGENT is ${id}, but \`${cmd}\` isn't installed (or isn't on the dev server's PATH).` };
  return agent;
}

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

export type Brief = { name: string; slug: string; description: string; category: string; reference: string | null };

/** What the agent is asked to do: follow the skill to the end of its checks, and stop short of the pull request */
export function createPrompt(b: Brief): string {
  return `You're building one new Trenchcoat component for a designer, who asked for it on the Trenchcoat canvas.

Read the new-component skill – .claude/skills/new-component/SKILL.md, from this directory (trenchcoat/) – and its references, and follow it. Do its steps 1 to 4: decide, build the five files, integrate (node .claude/skills/new-component/scripts/integrate.mjs --slugs ${b.slug}), and fix what that reports until it passes. Don't do step 5: don't commit, push or open a pull request – the designer reviews the work on the canvas first, and opens the pull request from there. Don't change anything outside trenchcoat/.

The component:
- Name: ${b.name} – slug ${b.slug}, element <tc-${b.slug}>
- Gallery category: ${b.category}
- What it is and what it's for: ${b.description}${b.reference ? `\n- A reference picture is at ${b.reference}: take the idea from it, not its styling, branding or text.` : ""}

Keep the demo data fictional and neutral. Finish with a short summary: what you built, and any check that didn't pass.`;
}

export type JobState = "running" | "done" | "failed" | "stopped";
export type Job = {
  id: string;
  brief: Brief;
  agent: string;
  branch: string;
  dir: string;
  state: JobState;
  log: string[];
  files: string[];
  preview: string | null;
  pullRequest: string | null;
  error: string;
};

/** The files a job changed under trenchcoat/, from `git status --porcelain` – never the linked node_modules */
export function changedFiles(porcelain: string): string[] {
  return porcelain
    .split("\n")
    .map((l) => l.slice(3).trim())
    .map((p) => (p.includes(" -> ") ? p.split(" -> ")[1] : p))
    .filter((p) => p.startsWith("trenchcoat/") && !p.split("/").includes("node_modules") && !/ \d+(\.[\w]+)?$/.test(p))
    .sort();
}

/** A path inside the worktree, or null when it would leave it */
export function inside(dir: string, path: string): string | null {
  const full = resolve(dir, path);
  return full === dir || full.startsWith(dir + sep) ? full : null;
}

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${(r.stderr || r.stdout).trim().slice(0, 300)}`);
  return r.stdout;
};

function freePort(from: number): Promise<number> {
  return new Promise((done) => {
    const server = createServer();
    server.once("error", () => done(freePort(from + 1)));
    server.listen(from, () => server.close(() => done(from)));
  });
}

export type Options = {
  /** trenchcoat/ in the checkout the canvas runs from */
  root: string;
  agent?: () => Agent | { problem: string };
  worktrees?: string;
};

export function create({
  root,
  agent = () => agentFromEnv(),
  worktrees = process.env.CANVAS_WORKTREES || join(homedir(), ".trenchcoat-canvas", "worktrees"),
}: Options): Plugin {
  // Found when the dev server starts, so a build never runs git
  let repo = "";
  const jobs = new Map<string, Job>();
  const children = new Set<ChildProcess>();
  const running = new Map<string, ChildProcess>();

  const view = (job: Job, from = 0) => ({ ...job, log: job.log.slice(from), next: job.log.length });

  function start(brief: Brief, chosen: Agent, image: { name: string; data: string } | null): Job {
    const id = randomUUID().slice(0, 8);
    const branch = `canvas/new-${brief.slug}-${id}`;
    const dir = join(worktrees, `${brief.slug}-${id}`);
    mkdirSync(worktrees, { recursive: true });
    git(repo, "worktree", "add", "-b", branch, dir, "HEAD");
    // The worktree shares this checkout's installed packages, so the skill's checks run without an install
    for (const pkg of ["trenchcoat", "canvas"]) {
      const from = join(repo, pkg, "node_modules");
      const to = join(dir, pkg, "node_modules");
      if (existsSync(from) && !existsSync(to)) symlinkSync(realpathSync(from), to, "dir");
    }
    let reference: string | null = null;
    if (image) {
      // Beside the worktree's folders, not in trenchcoat/, so it's never part of the pull request
      reference = join(dir, `.canvas-reference${/\.(png|jpe?g|webp|gif)$/i.exec(image.name)?.[0] ?? ".png"}`);
      writeFileSync(reference, Buffer.from(image.data, "base64"));
    }
    const job: Job = {
      id,
      brief: { ...brief, reference },
      agent: chosen.label,
      branch,
      dir,
      state: "running",
      log: [],
      files: [],
      preview: null,
      pullRequest: null,
      error: "",
    };
    jobs.set(id, job);
    job.log.push(`${chosen.label} is building ${brief.name} in ${dir}, on branch ${branch}.`);

    const [cmd, ...args] = chosen.command(createPrompt(job.brief));
    const child = spawn(cmd, args, { cwd: join(dir, "trenchcoat"), env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    children.add(child);
    running.set(id, child);
    const lines = (stream: NodeJS.ReadableStream, format: (l: string) => string | null) => {
      let rest = "";
      stream.setEncoding("utf8");
      stream.on("data", (chunk: string) => {
        const parts = (rest + chunk).split("\n");
        rest = parts.pop() ?? "";
        for (const line of parts) {
          const text = format(line);
          if (text) job.log.push(...text.split("\n"));
        }
      });
    };
    lines(child.stdout!, chosen.format);
    lines(child.stderr!, (l) => l.trim() || null);
    child.on("error", (error) => {
      job.state = "failed";
      job.error = `Couldn't start ${chosen.label}: ${error.message}`;
    });
    child.on("close", (code) => {
      children.delete(child);
      running.delete(id);
      job.files = changedFiles(git(dir, "status", "--porcelain", "--untracked-files=all"));
      if (job.state === "running") job.state = code === 0 ? "done" : "failed";
      if (job.state === "failed" && !job.error) job.error = `${chosen.label} stopped with exit code ${code}.`;
      job.log.push(job.state === "done" ? `Done: ${job.files.length} files changed.` : job.state === "stopped" ? "Stopped." : job.error);
    });
    return job;
  }

  async function preview(job: Job): Promise<string> {
    if (job.preview) return job.preview;
    const port = await freePort(5230);
    const child = spawn("npx", ["vite", "--port", String(port), "--strictPort"], { cwd: join(job.dir, "canvas"), env: process.env, stdio: "ignore" });
    children.add(child);
    child.on("close", () => children.delete(child));
    job.preview = `http://localhost:${port}/`;
    return job.preview;
  }

  function pullRequest(job: Job): string {
    if (job.pullRequest) return job.pullRequest;
    const files = changedFiles(git(job.dir, "status", "--porcelain", "--untracked-files=all"));
    if (!files.length) throw new Error("There's nothing to put in a pull request: no files changed under trenchcoat/.");
    git(job.dir, "add", "--", ...files);
    git(
      job.dir,
      "commit",
      "-m",
      `Trenchcoat: ${job.brief.name} (tc-${job.brief.slug})\n\nBuilt from the canvas by ${job.agent}, with the new-component skill.\n\n${job.brief.description}`,
    );
    git(job.dir, "push", "-u", "origin", job.branch);
    const r = spawnSync(
      "gh",
      [
        "pr",
        "create",
        "--head",
        job.branch,
        "--title",
        `Trenchcoat: ${job.brief.name}`,
        "--body",
        `A new component, \`tc-${job.brief.slug}\`, asked for on the Trenchcoat canvas and built by ${job.agent} with the new-component skill.\n\n> ${job.brief.description}\n\nReview it like any other component: the gallery, the docs page, both looks and both themes, and CI.`,
      ],
      { cwd: job.dir, encoding: "utf8" },
    );
    if (r.status !== 0) throw new Error(`The branch is pushed, but the pull request couldn't be opened: ${(r.stderr || r.stdout).trim().slice(0, 300)}`);
    job.pullRequest = r.stdout.trim().split("\n").pop() ?? "";
    return job.pullRequest;
  }

  return {
    name: "canvas-create",
    apply: "serve",
    configureServer(server) {
      repo = git(root, "rev-parse", "--show-toplevel").trim();
      server.httpServer?.once("close", () => children.forEach((c) => c.kill()));
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://canvas");
        if (url.pathname !== CREATE && !url.pathname.startsWith(`${CREATE}/`)) return next();
        if (!sameOrigin(req)) return send(res, 403, { message: "Only the canvas can call this." });
        const [, id, action] = url.pathname.slice(CREATE.length).split("/");
        const job = id ? jobs.get(id) : undefined;
        try {
          if (!id && req.method === "GET") {
            const a = agent();
            return send(res, 200, "problem" in a ? { agent: "", problem: a.problem } : { agent: a.label, problem: "" });
          }
          if (!id && req.method === "POST") {
            const a = agent();
            if ("problem" in a) return send(res, 400, { message: a.problem });
            // A reference picture can be a few MB
            const input = (await body(req, 12_000_000)) as {
              name?: string;
              description?: string;
              category?: string;
              reference?: { name: string; data: string };
            };
            const name = String(input.name ?? "")
              .trim()
              .slice(0, 60);
            const slug = slugify(name);
            const description = String(input.description ?? "")
              .trim()
              .slice(0, 4000);
            if (!slug || !description) return send(res, 400, { message: "Give the component a name and say what it's for." });
            if (existsSync(join(root, "src/elements", `${slug}.ts`))) return send(res, 409, { message: `There's already a tc-${slug}. Choose another name.` });
            const category =
              String(input.category ?? "")
                .trim()
                .slice(0, 60) || "Other";
            const job = start({ name, slug, description, category, reference: null }, a, input.reference?.data ? input.reference : null);
            return send(res, 200, { id: job.id });
          }
          if (!job) return send(res, 404, { message: "No such job." });
          if (!action && req.method === "GET") return send(res, 200, view(job, Number(url.searchParams.get("from") ?? 0) || 0));
          if (!action && req.method === "DELETE") {
            if (job.state === "running") {
              job.state = "stopped";
              running.get(job.id)?.kill();
            }
            return send(res, 200, view(job));
          }
          if (action === "file" && req.method === "GET") {
            const path = url.searchParams.get("path") ?? "";
            const full = job.files.includes(path) ? inside(job.dir, path) : null;
            if (!full || !existsSync(full)) return send(res, 404, { message: "Not one of the files this job changed." });
            return send(res, 200, { path, code: readFileSync(full, "utf8") });
          }
          if (action === "preview" && req.method === "POST") return send(res, 200, { url: await preview(job) });
          if (action === "pull-request" && req.method === "POST") {
            if (job.state !== "done") return send(res, 409, { message: "The build hasn't finished cleanly, so there's no pull request to open yet." });
            return send(res, 200, { url: pullRequest(job) });
          }
          return send(res, 405, { message: "Method not allowed." });
        } catch (error) {
          send(res, 500, { message: error instanceof Error ? error.message : "Something went wrong." });
        }
      });
    },
  };
}
