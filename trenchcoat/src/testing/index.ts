/*
 * trenchcoat/testing – for testing apps built with Trenchcoat, in a real browser or jsdom, with any test runner. The drivers
 * act the way a person does: they click what's on the page and throw a clear error if it isn't there. Import the elements
 * you test yourself: nothing here loads one.
 */

type Updating = { updateComplete: Promise<unknown> };

/** Waits for every Lit element under `root` to finish updating, and for a frame */
export async function settled(root: ParentNode = document.body) {
  for (let i = 0; i < 3; i++) {
    const pending = [...root.querySelectorAll("*")].filter((el) => "updateComplete" in el) as unknown as Updating[];
    if ("updateComplete" in root) pending.push(root as unknown as Updating);
    await Promise.all(pending.map((el) => el.updateComplete));
  }
  if (typeof requestAnimationFrame === "function") await new Promise((r) => requestAnimationFrame(r));
}

/** Finishes every finite animation under `root`, so later checks read the settled state */
export async function finishAnimations(root: Element = document.body) {
  if (!root.getAnimations) return;
  for (let i = 0; i < 5; i++) {
    const running = root.getAnimations({ subtree: true }).filter((a) => a.playState !== "finished" && a.effect?.getComputedTiming().endTime !== Infinity);
    if (!running.length) return;
    for (const a of running) a.finish();
    await settled(root);
  }
}

/** Polls until `check` returns something truthy, and returns it */
export async function waitFor<T>(check: () => T, { timeout = 3000, message = "the condition" }: { timeout?: number; message?: string } = {}): Promise<NonNullable<T>> {
  const start = Date.now();
  for (;;) {
    const value = check();
    if (value) return value as NonNullable<T>;
    if (Date.now() - start > timeout) throw new Error(`Timed out after ${timeout} ms waiting for ${message}`);
    await new Promise((r) => setTimeout(r, 20));
  }
}

const words = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const matches = (text: string, wanted: string | RegExp) => (typeof wanted === "string" ? text === wanted || text.startsWith(`${wanted},`) : wanted.test(text));

/** Clicks the enabled button with this text */
export async function clickButton(root: Element, name: string | RegExp) {
  const buttons = [...root.querySelectorAll("button")];
  const button = buttons.find((b) => matches(words(b), name));
  if (!button) throw new Error(`No button "${name}". There are: ${buttons.map(words).join(" | ") || "none"}`);
  if (button.disabled) throw new Error(`The button "${name}" is disabled`);
  button.click();
  await settled(root);
}

/** Types into a field as a person does, firing input and change */
export async function typeInto(field: HTMLInputElement | HTMLTextAreaElement | null | undefined, value: string) {
  if (!field) throw new Error("No field to type into");
  field.focus();
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  await settled(field.getRootNode() as ParentNode);
}

/** Chooses from a native select by the option's words */
export async function selectOption(select: HTMLSelectElement | null | undefined, name: string | RegExp) {
  if (!select) throw new Error("No select to choose from");
  const options = [...select.options];
  const option = options.find((o) => matches(words(o), name));
  if (!option) throw new Error(`No option "${name}". There are: ${options.map(words).join(" | ")}`);
  select.value = option.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  await settled(select.getRootNode() as ParentNode);
}

/** Picks a flag on a tc-team-flag-picker. Pass null for No flag */
export async function pickFlag(picker: Element, label: string | null) {
  picker.querySelector<HTMLElement>(".ui-tfp__trigger")!.click();
  await settled(picker);
  const options = await waitFor(() => {
    const found = [...picker.querySelectorAll<HTMLElement>('[role="option"]')];
    return found.length ? found : null;
  }, { message: "the flag list" });
  const name = label ?? "No flag";
  const option = options.find((o) => words(o.querySelector(".ui-tfp__name")) === name);
  if (!option) throw new Error(`No flag "${name}". There are: ${options.map((o) => words(o.querySelector(".ui-tfp__name"))).join(" | ")}`);
  option.click();
  await settled(picker);
}

/** Adds someone on a tc-share-panel, waits for their check, and returns its status */
export async function addRecipient(panel: Element, name: string, { level }: { level?: string } = {}) {
  await typeInto(panel.querySelector<HTMLInputElement>(".ui-shr__search"), name);
  const result = await waitFor(() => [...panel.querySelectorAll<HTMLElement>(".ui-shr__result")].find((r) => words(r.querySelector(".ui-shr__name")) === name), { message: `"${name}" in the results` });
  result.click();
  await settled(panel);
  const row = await waitFor(() => [...panel.querySelectorAll<HTMLElement>(".ui-shr__row")].find((r) => words(r.querySelector(".ui-shr__name")) === name), { message: `the row for "${name}"` });
  if (level) await selectOption(row.querySelector("select"), level);
  await waitFor(() => row.dataset.status !== "checking", { message: `the entitlement check for "${name}"` });
  await settled(panel);
  return row.dataset.status;
}

/** Presses Share on a tc-share-panel */
export async function submitShare(panel: Element) {
  const button = panel.querySelector<HTMLButtonElement>(".ui-shr__share")!;
  if (button.disabled) throw new Error(`Share is disabled: "${words(button)}"`);
  button.click();
  await settled(panel);
}

/** Records a decision on a tc-case-review */
export async function decideCase(review: Element, option: string, reason: string) {
  const input = review.querySelector<HTMLInputElement>(`input[value="${CSS.escape(option)}"]`);
  if (!input) throw new Error(`No outcome "${option}"`);
  input.click();
  await settled(review);
  await typeInto(review.querySelector<HTMLTextAreaElement>(".ui-csr__note"), reason);
  review.querySelector<HTMLElement>(".ui-csr__record")!.click();
  await settled(review);
}

/** An entitlement check for tests: answers by recipient id, allowing anyone else. An Error is thrown, as a failed check */
export function mockEntitlement(answers: Record<string, unknown> = {}) {
  return async (recipient: { id: string }) => {
    const answer = answers[recipient.id];
    if (answer instanceof Error) throw answer;
    return (answer ?? { status: "allowed" }) as never;
  };
}

/** Small, fictional data to start from */
export const fixtures = {
  flags: [
    { id: "review", label: "Needs review", meaning: "A second reader should check this.", color: "#CA8A04" },
    { id: "hold", label: "Legal hold", meaning: "Don't change or delete it.", color: "#DC2626" },
  ],
  people: [
    { id: "noor", kind: "person" as const, name: "Noor Haddad", detail: "noor@example.org" },
    { id: "ines", kind: "person" as const, name: "Inês Costa" },
    { id: "stats", kind: "group" as const, name: "Biostatistics", detail: "12 members" },
  ],
};
