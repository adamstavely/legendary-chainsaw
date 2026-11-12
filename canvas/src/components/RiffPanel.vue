<script setup lang="ts">
import { Check, Shapes, SlidersHorizontal, Sparkles, Trash2, Undo2, View, X } from "@lucide/vue";
import type { PromptStarter } from "@adamstavely/trenchcoat";
import { computed, defineAsyncComponent, nextTick, ref, useId, useTemplateRef, watch } from "vue";
import type { Piece, Theme } from "../data/pieces";
import type { PieceRiffs, Round } from "../riff/session";
import type { Kept, Variant } from "../riff/types";

// Beside an open component, in two tabs: Riff asks a model for variants (in the dev server) and keeps or discards each
// one; Tune sets its props and tokens by hand on DialKit's dials. Without the dev server there's only Tune, and no tabs. The variants themselves are drawn around the piece on the canvas; this panel names
// them and acts on them, so everything here works by keyboard
const props = defineProps<{
  piece: Piece;
  riffs: PieceRiffs;
  busy: boolean;
  status: string;
  error: string;
  theme: Theme;
  /** The dev server is there: a model can riff, and variants can be kept */
  canRiff: boolean;
  /** What the panel calls the model: "Claude", or the model's id */
  model: string;
  /** What's wrong with the dev server's model setting, if anything */
  riffProblem: string;
  findElement: () => HTMLElement | null;
}>();
const emit = defineEmits<{
  riff: [prompt: string, from: Round["from"]];
  cancel: [];
  keep: [variant: Variant & { id: string }, prompt: string];
  discard: [id: string];
  remove: [kept: Kept];
  show: [id: string, round?: string];
  close: [];
  keepTuned: [variant: { name: string; props: Record<string, unknown>; tokens: Record<string, string> }];
}>();

// Only the dev server riffs, so the panel's own element loads with it rather than in every canvas
void import("@adamstavely/trenchcoat/prompt-starters");
// Tuning (its token lists, DialKit and Motion) loads with the first piece opened
const TuneSection = defineAsyncComponent(() => import("./TuneSection.vue"));

const id = useId();
const prompt = ref("");
const from = ref<Round["from"]>(null);
const field = useTemplateRef<HTMLTextAreaElement>("field");

const ideas: PromptStarter[] = [
  { id: "denser", text: "Make it denser, for people who scan a lot of these" },
  { id: "spacious", text: "Give it more room to breathe" },
  { id: "error", text: "Show it when something has gone wrong" },
  { id: "empty", text: "Show it before there's any data" },
  { id: "phone", text: "Fit it in a phone-width sheet" },
  { id: "urgent", text: "Make it feel more urgent" },
];

function send(text = prompt.value) {
  if (!text.trim() || props.busy) return;
  emit("riff", text.trim(), from.value);
  prompt.value = text.trim();
}

async function riffFrom(v: { name: string; props: Record<string, unknown>; tokens: Record<string, string> }) {
  from.value = { name: v.name, props: v.props, tokens: v.tokens };
  prompt.value = "";
  await nextTick();
  field.value?.focus();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && !e.defaultPrevented) {
    e.preventDefault();
    emit("close");
  }
}

const roundsWithVariants = computed(() => props.riffs.rounds.filter((r) => r.variants.length));
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Tabs, as the WAI-ARIA pattern has them: one tab stop, arrow keys (and Home and End) move between tabs and show
// their panel. Both panels stay mounted, so the dials and the riffs keep their state across a switch
type Tab = "riff" | "tune";
const TABS: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: "riff", label: "Riff", icon: Sparkles },
  { id: "tune", label: "Tune", icon: SlidersHorizontal },
];
const tabs = computed(() => (props.canRiff ? TABS : []));
const tab = ref<Tab>(props.canRiff ? "riff" : "tune");
watch(
  () => props.canRiff,
  (can) => !can && (tab.value = "tune"),
);
const tabButtons = useTemplateRef<HTMLButtonElement[]>("tabButtons");
function onTabKey(e: KeyboardEvent, i: number) {
  const n = tabs.value.length;
  const next = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  tab.value = tabs.value[next].id;
  tabButtons.value?.[next]?.focus();
}
</script>

<template>
  <!-- Escape anywhere in the panel steps back to the canvas, as it does in the open piece -->
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <aside class="riff" :aria-labelledby="`${id}-title`" @keydown="onKeydown">
    <header class="riff__head">
      <h2 :id="`${id}-title`" class="riff__title">
        <Sparkles :size="16" aria-hidden="true" />
        <span>{{ piece.name }}</span>
      </h2>
      <tc-button variant="ghost" size="sm" hide-label label="Close the panel" @click="emit('close')">
        <X slot="icon" :size="16" aria-hidden="true" />
      </tc-button>
    </header>

    <div v-if="tabs.length" role="tablist" class="riff__tabs" :aria-label="`Ways to change ${piece.name}`">
      <button
        v-for="(t, i) in tabs"
        :id="`${id}-tab-${t.id}`"
        :key="t.id"
        ref="tabButtons"
        type="button"
        role="tab"
        class="riff__tab"
        :aria-selected="tab === t.id"
        :aria-controls="`${id}-panel-${t.id}`"
        :tabindex="tab === t.id ? 0 : -1"
        @click="tab = t.id"
        @keydown="onTabKey($event, i)"
      >
        <component :is="t.icon" :size="16" aria-hidden="true" />
        {{ t.label }}
      </button>
    </div>

    <!-- Outside the tabs, so a riff that finishes while Tune is showing is still announced -->
    <p role="status" class="riff__status">{{ status }}</p>
    <p v-if="error" role="alert" class="riff__error">{{ error }}</p>

    <div v-if="canRiff" v-show="tab === 'riff'" :id="`${id}-panel-riff`" role="tabpanel" class="riff__panel" :aria-labelledby="`${id}-tab-riff`">
      <p v-if="riffProblem" class="riff__error">Riffing isn't set up: {{ riffProblem }}</p>
      <form v-else class="riff__form" @submit.prevent="send()">
        <p v-if="from" class="riff__from">
          <span
            >Starting from <strong>{{ from.name }}</strong></span
          >
          <tc-button variant="ghost" size="sm" label="Start from the piece instead" @click="from = null">
            <Undo2 slot="icon" :size="16" aria-hidden="true" />
          </tc-button>
        </p>
        <label :for="`${id}-prompt`" class="riff__label">What should change?</label>
        <textarea
          :id="`${id}-prompt`"
          ref="field"
          v-model="prompt"
          class="riff__prompt"
          rows="3"
          :aria-describedby="`${id}-hint`"
          @keydown.enter.exact.prevent="send()"
        ></textarea>
        <p :id="`${id}-hint`" class="riff__hint">Enter asks {{ model }} for variants; Shift + Enter adds a line.</p>
        <div class="riff__actions">
          <tc-button type="submit" variant="primary" size="sm" :loading="busy" :disabled="!prompt.trim() || busy" :label="`Ask ${model}`">
            <Sparkles slot="icon" :size="16" aria-hidden="true" />
          </tc-button>
          <tc-button v-if="busy" variant="ghost" size="sm" label="Stop" @click="emit('cancel')"></tc-button>
        </div>
      </form>

      <tc-prompt-starters
        v-if="!riffProblem && !riffs.rounds.length && !busy"
        class="riff__ideas"
        heading="Ideas"
        :items.prop="ideas"
        @tc-send="send(($event as CustomEvent<{ text: string }>).detail.text)"
        @tc-fill="prompt = ($event as CustomEvent<{ text: string }>).detail.text"
      ></tc-prompt-starters>

      <section v-if="riffs.kept.length" class="riff__group" :aria-labelledby="`${id}-kept`">
        <h3 :id="`${id}-kept`" class="riff__heading">Kept</h3>
        <ul class="riff__list">
          <li v-for="k in riffs.kept" :key="k.name" class="riff__item">
            <p class="riff__name">{{ k.name }}</p>
            <p class="riff__why">{{ k.rationale }}</p>
            <div class="riff__buttons" role="group" :aria-label="k.name">
              <tc-button variant="secondary" size="sm" label="Show" @click="emit('show', `kept-${k.name}`)">
                <View slot="icon" :size="16" aria-hidden="true" />
              </tc-button>
              <tc-button variant="ghost" size="sm" label="Riff on this" @click="riffFrom(k)">
                <Shapes slot="icon" :size="16" aria-hidden="true" />
              </tc-button>
              <tc-button variant="ghost" size="sm" label="Remove" @click="emit('remove', k)">
                <Trash2 slot="icon" :size="16" aria-hidden="true" />
              </tc-button>
            </div>
          </li>
        </ul>
      </section>

      <section v-for="round in roundsWithVariants" :key="round.id" class="riff__group" :aria-labelledby="`${id}-${round.id}`">
        <h3 :id="`${id}-${round.id}`" class="riff__heading">
          “{{ round.prompt }}”<span v-if="round.from" class="riff__based"> from {{ round.from.name }}</span>
        </h3>
        <ul class="riff__list">
          <li v-for="v in round.variants" :key="v.id" class="riff__item" :class="{ 'riff__item--shown': riffs.shown === round.id }">
            <p class="riff__name">{{ v.name }}<span v-if="v.structural" class="riff__badge">Needs new code</span></p>
            <p class="riff__why">{{ v.rationale }}</p>
            <p v-if="v.structural && v.note" class="riff__note">To build: {{ v.note }}</p>
            <details v-if="v.issues.length" class="riff__issues">
              <summary>{{ plural(v.issues.length, "change") }} left out</summary>
              <ul>
                <li v-for="issue in v.issues" :key="issue.path">
                  <code>{{ issue.path }}</code> {{ issue.message }}
                </li>
              </ul>
            </details>
            <div class="riff__buttons" role="group" :aria-label="v.name">
              <tc-button variant="secondary" size="sm" label="Show" @click="emit('show', v.id, round.id)">
                <View slot="icon" :size="16" aria-hidden="true" />
              </tc-button>
              <tc-button variant="ghost" size="sm" label="Keep" @click="emit('keep', v, round.prompt)">
                <Check slot="icon" :size="16" aria-hidden="true" />
              </tc-button>
              <tc-button variant="ghost" size="sm" label="Riff on this" @click="riffFrom(v)">
                <Shapes slot="icon" :size="16" aria-hidden="true" />
              </tc-button>
              <tc-button variant="ghost" size="sm" label="Discard" @click="emit('discard', v.id)">
                <Trash2 slot="icon" :size="16" aria-hidden="true" />
              </tc-button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <div
      v-show="tab === 'tune'"
      :id="`${id}-panel-tune`"
      class="riff__panel"
      :role="tabs.length ? 'tabpanel' : undefined"
      :aria-labelledby="tabs.length ? `${id}-tab-tune` : undefined"
    >
      <TuneSection
        :key="piece.id"
        :piece="piece"
        :theme="theme"
        :can-keep="canRiff"
        :heading-hidden="tabs.length > 0"
        :find-element="findElement"
        @keep="emit('keepTuned', $event)"
      />
    </div>
  </aside>
</template>

<style scoped>
.riff {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: var(--tc-space-3);
  width: 24rem;
  max-width: 100%;
  padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-6);
  overflow: auto;
  border-left: var(--tc-hairline) solid var(--tc-divider);
  background: var(--tc-surface-raised);
  color: var(--tc-text-primary);
}

.riff__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
}

.riff__title {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  margin: 0;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-semibold);
}

.riff__form {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-1-5);
}

.riff__label {
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
}

.riff__prompt {
  padding: var(--tc-space-2) var(--tc-space-3);
  border: var(--tc-hairline) solid var(--tc-border-default);
  border-radius: var(--tc-field-radius);
  background: var(--tc-surface-base);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  resize: vertical;
}

.riff__prompt:focus-visible {
  outline: 2px solid var(--tc-focus-ring);
  outline-offset: 1px;
}

.riff__hint,
.riff__status,
.riff__why,
.riff__note,
.riff__from,
.riff__based {
  margin: 0;
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
}

.riff__status:empty {
  display: none;
}

.riff__from {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
}

.riff__actions {
  display: flex;
  gap: var(--tc-space-2);
}

.riff__error {
  margin: 0;
  padding: var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-md);
  background: var(--tc-status-danger-bg);
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-sm);
}

.riff__group {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-2);
}

.riff__heading {
  margin: var(--tc-space-2) 0 0;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-semibold);
}

.riff__tabs {
  display: flex;
  gap: var(--tc-space-1);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}

.riff__tab {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  margin-bottom: calc(-1 * var(--tc-hairline));
  padding: var(--tc-space-2) var(--tc-space-3);
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--tc-text-secondary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  cursor: pointer;
}

.riff__tab:hover {
  color: var(--tc-text-primary);
}

.riff__tab[aria-selected="true"] {
  border-bottom-color: var(--tc-border-selected);
  color: var(--tc-text-primary);
}

.riff__tab:focus-visible {
  border-radius: var(--tc-radius-sm);
  outline: 2px solid var(--tc-focus-ring);
  outline-offset: -2px;
}

.riff__panel {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-3);
}

.riff__based {
  font-weight: var(--tc-font-weight-regular);
}

.riff__list {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.riff__item {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-1);
  padding: var(--tc-space-2) var(--tc-space-3);
  border: var(--tc-hairline) solid var(--tc-border-default);
  border-radius: var(--tc-radius-lg);
}

.riff__item--shown {
  border-color: var(--tc-border-selected);
}

.riff__name {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  margin: 0;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
}

.riff__badge {
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-radius-full);
  background: var(--tc-status-warning-bg);
  color: var(--tc-status-warning-fg);
  font-size: var(--tc-font-size-xs);
  line-height: 20px;
}

.riff__issues {
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
}

.riff__issues ul {
  margin: var(--tc-space-1) 0 0;
  padding-left: var(--tc-space-4);
}

.riff__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tc-space-1);
}

/* Below the canvas on narrow screens, where there's no room beside it */
@media (max-width: 48rem) {
  .riff {
    width: 100%;
    max-height: 50%;
    border-top: var(--tc-hairline) solid var(--tc-divider);
    border-left: 0;
  }
}
</style>
