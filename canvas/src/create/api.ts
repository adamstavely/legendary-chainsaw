// The browser side of creating components: calls the dev server's endpoints (plugins/create.ts), which run the agent
const CREATE = "/__canvas/create";
const json = { "content-type": "application/json" };

async function ok<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message ?? `The dev server said ${res.status}.`);
  return data as T;
}

/** Which agent builds, or what's wrong with its setting; null in a built canvas, which has no dev server */
export async function createSetup(): Promise<{ agent: string; problem: string } | null> {
  if (!import.meta.env.DEV) return null;
  try {
    return await ok<{ agent: string; problem: string }>(await fetch(CREATE));
  } catch {
    return null;
  }
}

export type JobState = "running" | "done" | "failed" | "stopped";
export type JobView = {
  id: string;
  brief: { name: string; slug: string; description: string; category: string };
  agent: string;
  branch: string;
  dir: string;
  state: JobState;
  /** The log from the line asked for */
  log: string[];
  /** The line to ask from next time */
  next: number;
  files: string[];
  preview: string | null;
  pullRequest: string | null;
  error: string;
};

export type NewComponent = { name: string; description: string; category: string; reference: { name: string; data: string } | null };

export const startJob = async (input: NewComponent) =>
  (await ok<{ id: string }>(await fetch(CREATE, { method: "POST", headers: json, body: JSON.stringify(input) }))).id;
export const readJob = async (id: string, from: number) => ok<JobView>(await fetch(`${CREATE}/${id}?from=${from}`));
export const stopJob = async (id: string) => ok<JobView>(await fetch(`${CREATE}/${id}`, { method: "DELETE", headers: json }));
export const jobFile = async (id: string, path: string) =>
  ok<{ path: string; code: string }>(await fetch(`${CREATE}/${id}/file?path=${encodeURIComponent(path)}`));
export const startPreview = async (id: string) => (await ok<{ url: string }>(await fetch(`${CREATE}/${id}/preview`, { method: "POST", headers: json }))).url;
export const openPullRequest = async (id: string) =>
  (await ok<{ url: string }>(await fetch(`${CREATE}/${id}/pull-request`, { method: "POST", headers: json }))).url;
