<script setup lang="ts">
import { ExternalLink, GitPullRequest, Hammer, Plus, Square, X } from "@lucide/vue";
import { computed, nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from "vue";
import { jobFile, openPullRequest, readJob, startJob, startPreview, stopJob, type JobView } from "../create/api";

// A new component, built by a coding agent following the repo's new-component skill, in a worktree of its own. The
// designer describes it; the agent's progress streams in; then they read the code it wrote, open the piece in a
// canvas running on the worktree, and open a pull request when it's right
const props = defineProps<{ agent: string; problem: string; categories: readonly string[] }>();
const emit = defineEmits<{ close: [] }>();

// The code view is Trenchcoat's own, loaded when this panel is
void import("@adamstavely/trenchcoat/code-block");

const id = useId();
const name = ref("");
const category = ref(props.categories[0] ?? "Other");
const description = ref("");
const reference = ref<{ name: string; data: string; url: string } | null>(null);
const job = ref<JobView | null>(null);
const log = ref<string[]>([]);
const status = ref("");
const error = ref("");
const busy = ref(false);
const file = ref<{ path: string; code: string } | null>(null);
const logEl = useTemplateRef<HTMLElement>("logEl");
let polling: ReturnType<typeof setTimeout> | undefined;

const running = computed(() => job.value?.state === "running");
const language = (path: string) =>
  ({ ts: "typescript", tsx: "tsx", md: "markdown", json: "json", css: "css", mjs: "javascript" })[path.split(".").pop() ?? ""] ?? "";

function pick(e: Event) {
  const input = e.target as HTMLInputElement;
  const chosen = input.files?.[0];
  if (!chosen) return (reference.value = null);
  const reader = new FileReader();
  reader.onload = () => {
    const url = String(reader.result);
    reference.value = { name: chosen.name, data: url.slice(url.indexOf(",") + 1), url };
  };
  reader.readAsDataURL(chosen);
}

async function build() {
  if (!name.value.trim() || !description.value.trim() || busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    const started = await startJob({
      name: name.value,
      description: description.value,
      category: category.value,
      reference: reference.value && { name: reference.value.name, data: reference.value.data },
    });
    log.value = [];
    file.value = null;
    status.value = `${props.agent} is building ${name.value.trim()}…`;
    await poll(started);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}

async function poll(jobId: string) {
  clearTimeout(polling);
  try {
    const view = await readJob(jobId, log.value.length);
    job.value = view;
    log.value = [...log.value, ...view.log];
    await nextTick();
    logEl.value?.scrollTo({ top: logEl.value.scrollHeight });
    if (view.state === "running") polling = setTimeout(() => poll(jobId), 1000);
    else
      status.value =
        view.state === "done"
          ? `${view.brief.name} is built: ${view.files.length} files changed. Read them below, preview it, then open a pull request.`
          : view.state === "stopped"
            ? "Stopped. The worktree keeps what was done so far."
            : view.error;
  } catch (e) {
    error.value = (e as Error).message;
  }
}
onBeforeUnmount(() => clearTimeout(polling));

async function stop() {
  if (job.value) job.value = await stopJob(job.value.id);
}

async function show(path: string) {
  if (!job.value) return;
  try {
    file.value = await jobFile(job.value.id, path);
  } catch (e) {
    error.value = (e as Error).message;
  }
}

const previewUrl = ref("");
async function preview() {
  if (!job.value) return;
  try {
    previewUrl.value = await startPreview(job.value.id);
    status.value = `A canvas on the worktree is starting at ${previewUrl.value}. Open it to see ${job.value.brief.name} live.`;
  } catch (e) {
    error.value = (e as Error).message;
  }
}

const pullRequestUrl = ref("");
async function pullRequest() {
  if (!job.value || busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    pullRequestUrl.value = await openPullRequest(job.value.id);
    status.value = `Pull request opened: ${pullRequestUrl.value}`;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}

function again() {
  job.value = null;
  log.value = [];
  file.value = null;
  previewUrl.value = "";
  pullRequestUrl.value = "";
  status.value = "";
  name.value = "";
  description.value = "";
  reference.value = null;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && !e.defaultPrevented) {
    e.preventDefault();
    emit("close");
  }
}
watch(
  () => props.problem,
  (p) => p && (error.value = ""),
);
</script>

<template>
  <!-- Escape anywhere in the panel closes it -->
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <aside :id="`create-panel`" class="create" :aria-labelledby="`${id}-title`" @keydown="onKeydown">
    <header class="create__head">
      <h2 :id="`${id}-title`" class="create__title">
        <Hammer :size="16" aria-hidden="true" />
        <span>New component</span>
      </h2>
      <tc-button variant="ghost" size="sm" hide-label label="Close the panel" @click="emit('close')">
        <X slot="icon" :size="16" aria-hidden="true" />
      </tc-button>
    </header>

    <p v-if="problem" class="create__error">Creating isn't set up: {{ problem }}</p>

    <form v-else-if="!job" class="create__form" @submit.prevent="build">
      <p class="create__hint">
        {{ agent }} builds it with the repo's <code>new-component</code> skill – the element, both looks, the docs page and the tests – in a git worktree of its
        own. It edits files and runs commands on this computer while it works.
      </p>
      <label :for="`${id}-name`" class="create__label">Name</label>
      <input :id="`${id}-name`" v-model="name" class="create__field" type="text" required maxlength="60" autocomplete="off" />
      <label :for="`${id}-category`" class="create__label">Gallery section</label>
      <select :id="`${id}-category`" v-model="category" class="create__field">
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <label :for="`${id}-description`" class="create__label">What is it, and what's it for?</label>
      <textarea :id="`${id}-description`" v-model="description" class="create__field" rows="5" required :aria-describedby="`${id}-description-hint`"></textarea>
      <p :id="`${id}-description-hint`" class="create__hint">Who uses it, what it shows, what people do with it, and the states it has.</p>
      <label :for="`${id}-reference`" class="create__label">Reference picture <span class="create__optional">(optional)</span></label>
      <input :id="`${id}-reference`" class="create__file" type="file" accept="image/*" @change="pick" />
      <img v-if="reference" class="create__reference" :src="reference.url" :alt="`Reference: ${reference.name}`" />
      <div class="create__actions">
        <tc-button type="submit" variant="primary" size="sm" :loading="busy" :disabled="!name.trim() || !description.trim() || busy" label="Build it">
          <Hammer slot="icon" :size="16" aria-hidden="true" />
        </tc-button>
      </div>
    </form>

    <p role="status" class="create__status">{{ status }}</p>
    <p v-if="error" role="alert" class="create__error">{{ error }}</p>

    <template v-if="job">
      <p class="create__hint">
        Branch <code>{{ job.branch }}</code>
      </p>
      <!-- A log that's read on request: announcing every line would drown the status above -->
      <div ref="logEl" class="create__log" role="log" aria-live="off" :aria-label="`${job.agent}'s progress`" tabindex="0">
        <ol class="create__lines">
          <li v-for="(line, i) in log" :key="i">{{ line }}</li>
        </ol>
      </div>
      <div class="create__actions">
        <tc-button v-if="running" variant="secondary" size="sm" label="Stop" @click="stop">
          <Square slot="icon" :size="16" aria-hidden="true" />
        </tc-button>
        <template v-else>
          <tc-button v-if="job.state === 'done'" variant="secondary" size="sm" label="Preview on a canvas" @click="preview">
            <ExternalLink slot="icon" :size="16" aria-hidden="true" />
          </tc-button>
          <tc-button
            v-if="job.state === 'done' && !pullRequestUrl"
            variant="primary"
            size="sm"
            :loading="busy"
            label="Open a pull request"
            @click="pullRequest"
          >
            <GitPullRequest slot="icon" :size="16" aria-hidden="true" />
          </tc-button>
          <tc-button variant="ghost" size="sm" label="Build another" @click="again">
            <Plus slot="icon" :size="16" aria-hidden="true" />
          </tc-button>
        </template>
      </div>
      <p v-if="previewUrl" class="create__hint">
        <a :href="`${previewUrl}#/${job.brief.slug}`" target="_blank" rel="noopener"
          >Open the preview canvas<span class="sr-only"> (opens in a new tab)</span></a
        >
      </p>
      <p v-if="pullRequestUrl" class="create__hint">
        <a :href="pullRequestUrl" target="_blank" rel="noopener">Open the pull request<span class="sr-only"> (opens in a new tab)</span></a>
      </p>

      <section v-if="job.files.length" class="create__files" :aria-labelledby="`${id}-files`">
        <h3 :id="`${id}-files`" class="create__heading">Files it changed</h3>
        <ul class="create__list">
          <li v-for="path in job.files" :key="path">
            <button type="button" class="create__file-button" :aria-pressed="file?.path === path" @click="show(path)">
              {{ path.replace(/^trenchcoat\//, "") }}
            </button>
          </li>
        </ul>
        <tc-code-block v-if="file" :code.prop="file.code" :language="language(file.path)" :filename="file.path" :max-height.prop="480"></tc-code-block>
      </section>
    </template>
  </aside>
</template>

<style scoped>
.create {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: var(--tc-space-3);
  width: 28rem;
  max-width: 100%;
  padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-6);
  overflow: auto;
  border-left: var(--tc-hairline) solid var(--tc-divider);
  background: var(--tc-surface-raised);
  color: var(--tc-text-primary);
}

.create__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.create__title {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  margin: 0;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-semibold);
}

.create__form {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-1-5);
}

.create__label {
  margin-top: var(--tc-space-1-5);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
}

.create__optional,
.create__hint,
.create__status {
  margin: 0;
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-regular);
}

.create__status:empty {
  display: none;
}

.create__field {
  padding: var(--tc-space-1-5) var(--tc-space-3);
  border: var(--tc-hairline) solid var(--tc-border-default);
  border-radius: var(--tc-field-radius);
  background: var(--tc-surface-base);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
}

textarea.create__field {
  resize: vertical;
}

.create__field:focus-visible,
.create__file:focus-visible,
.create__file-button:focus-visible,
.create__log:focus-visible {
  outline: 2px solid var(--tc-focus-ring);
  outline-offset: 1px;
}

.create__file {
  font-size: var(--tc-font-size-sm);
}

.create__reference {
  max-width: 100%;
  max-height: 10rem;
  border-radius: var(--tc-radius-md);
  object-fit: contain;
  object-position: left;
}

.create__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tc-space-2);
  margin-top: var(--tc-space-1-5);
}

.create__error {
  margin: 0;
  padding: var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-md);
  background: var(--tc-status-danger-bg);
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-sm);
}

.create__log {
  max-height: 18rem;
  margin: 0;
  padding: var(--tc-space-2) var(--tc-space-3);
  overflow: auto;
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-sunken);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-xs);
  line-height: var(--tc-line-height-normal);
  list-style: none;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.create__lines {
  margin: 0;
  padding: 0;
  list-style: none;
}

.create__heading {
  margin: var(--tc-space-2) 0 0;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-semibold);
}

.create__files {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-2);
}

.create__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.create__file-button {
  min-height: 24px;
  padding: var(--tc-space-0-5) var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: none;
  color: var(--tc-accent-text);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-xs);
  text-align: start;
  cursor: pointer;
}

.create__file-button[aria-pressed="true"] {
  background: var(--tc-surface-sunken);
  color: var(--tc-text-primary);
}

@media (max-width: 48rem) {
  .create {
    width: 100%;
    max-height: 60%;
    border-top: var(--tc-hairline) solid var(--tc-divider);
    border-left: 0;
  }
}
</style>
