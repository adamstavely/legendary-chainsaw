/*
 * "Notify me when it's done" for a list of tasks – what Running Now and Background Tasks share. The element keeps its
 * public properties (notifiable, notify, notifyChannels, notifyVia and the channelsFor state) and its events; this
 * holds the behaviour:
 *   · a bell on each task that can be watched toggles it – or, with notifyChannels, opens a short list of channel
 *     checkboxes under the task (Escape closes the list and goes back to the bell)
 *   · switching fires a cancelable tc-notify-change ({ notify, id, on, channels?, notifyVia }); prevented, nothing
 *     changes. Otherwise the element's lists change and the change is announced
 *   · a watched task that finishes is queued with finished() and told with tc-notify after the update that shows it
 *     (flush() from updated())
 *
 *   private notifier = new TaskNotify<Task>(this, {
 *     watchable: (t) => t.status === "running", name: (t) => t.title, say: (s) => this.say(s),
 *     emit: (type, detail, opts) => this.emit(type, detail, opts), prefix: "ui-x",
 *   });
 */

/** What the element exposes: its public notify properties and the channel list's open task */
export type TaskNotifyHost = HTMLElement & {
  notifiable: boolean;
  notify: string[];
  notifyChannels: string[];
  notifyVia: Record<string, string[]>;
  channelsFor: string;
  requestUpdate(): void;
  readonly updateComplete: Promise<boolean>;
};

/** tc-notify-change's detail */
export type TaskNotifyChange = { notify: string[]; id: string; on: boolean; channels?: string[]; notifyVia: Record<string, string[]> };

export type TaskNotifyOptions<T> = {
  /** Which tasks can be watched (the element's notifiable is checked too) */
  watchable: (task: T) => boolean;
  /** A task's name, for the announcements */
  name: (task: T) => string;
  /** The element's polite announcer */
  say: (text: string) => void;
  /** The element's emit, so the events carry its own options */
  emit: (type: string, detail: unknown, options?: { cancelable?: boolean }) => boolean;
  /** The element's class prefix ("ui-rnw"): the bell is `.<prefix>__bell`, the channel list `.<prefix>__channels` */
  prefix: string;
};

export class TaskNotify<T extends { id: string }> {
  /** Watched tasks that finished, told after the update that shows them */
  private finishedWatched: { id: string; status: string; task: T; channels?: string[] }[] = [];

  constructor(
    private host: TaskNotifyHost,
    private o: TaskNotifyOptions<T>,
  ) {}

  /** Whether a task gets a bell */
  can(task: T) {
    return this.host.notifiable && this.o.watchable(task);
  }

  /** Whether a task is watched */
  watched(task: T) {
    return this.can(task) && this.host.notify.includes(task.id);
  }

  /** A task the element saw finish – told with tc-notify on the next flush() if it was watched */
  finished(task: T, status: "done" | "failed") {
    const h = this.host;
    if (!h.notifiable || !h.notify.includes(task.id)) return;
    this.finishedWatched.push({ id: task.id, status, task, channels: h.notifyChannels.length ? (h.notifyVia[task.id] ?? []) : undefined });
  }

  /** From updated(): tells the page about the watched tasks that finished */
  flush() {
    const done = this.finishedWatched;
    this.finishedWatched = [];
    for (const d of done) this.o.emit("tc-notify", d);
  }

  /** From willUpdate(): closes the channel list when its task can't be watched any more */
  prune(tasks: readonly T[]) {
    const h = this.host;
    if (h.channelsFor && !tasks.some((t) => t.id === h.channelsFor && this.can(t))) h.channelsFor = "";
  }

  /** Switches watching a task, or one of its channels */
  set(task: T, on: boolean, channels?: string[]) {
    const h = this.host;
    const notify = on ? [...h.notify.filter((id) => id !== task.id), task.id] : h.notify.filter((id) => id !== task.id);
    const notifyVia = { ...h.notifyVia };
    if (channels && channels.length) notifyVia[task.id] = channels;
    else delete notifyVia[task.id];
    const detail: TaskNotifyChange = { notify, id: task.id, on, notifyVia, ...(channels ? { channels } : {}) };
    if (!this.o.emit("tc-notify-change", detail, { cancelable: true })) {
      h.requestUpdate();
      return;
    }
    h.notify = notify;
    h.notifyVia = notifyVia;
    const name = this.o.name(task);
    this.o.say(on ? `${channels?.length ? `You'll be told by ${channels.join(", ")}` : "You'll be told"} when ${name} finishes` : `No longer watching ${name}`);
  }

  /** The bell: toggles watching, or opens the channel list */
  bell(task: T) {
    const h = this.host;
    if (h.notifyChannels.length) {
      h.channelsFor = h.channelsFor === task.id ? "" : task.id;
      if (h.channelsFor) h.updateComplete.then(() => h.querySelector<HTMLInputElement>(`.${this.o.prefix}__channels[data-id="${CSS.escape(task.id)}"] input`)?.focus());
      return;
    }
    this.set(task, !h.notify.includes(task.id));
  }

  /** A channel's checkbox */
  channel(task: T, channel: string, checked: boolean) {
    const h = this.host;
    const now = h.notifyVia[task.id] ?? [];
    const channels = h.notifyChannels.filter((c) => (c === channel ? checked : now.includes(c)));
    this.set(task, channels.length > 0, channels);
  }

  /** Escape in the channel list closes it (the panel stays open) and goes back to the bell */
  channelsKey(e: KeyboardEvent, task: T) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    const h = this.host;
    h.channelsFor = "";
    h.updateComplete.then(() => h.querySelector<HTMLElement>(`.${this.o.prefix}__bell[data-id="${CSS.escape(task.id)}"]`)?.focus());
  }
}
