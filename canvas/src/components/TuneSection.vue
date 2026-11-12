<script setup lang="ts">
import { RotateCcw, Save } from "@lucide/vue";
import tokensOf from "virtual:tc-tokens";
import { computed, defineAsyncComponent, onMounted, ref, shallowRef, useId, useTemplateRef } from "vue";
import type { Piece, Theme } from "../data/pieces";
import { propsOf } from "../riff/apply";
import { dialsFor, type Dials } from "../riff/tune";

// Tune: the open piece's props and tokens on DialKit dials. A tuned version can be kept like a riffed variant – in
// the dev server, which writes the file
const props = defineProps<{
  piece: Piece;
  theme: Theme;
  canKeep: boolean;
  /** In the panel's Tune tab, the tab names the section: its heading is for screen readers only */
  headingHidden?: boolean;
  findElement: () => HTMLElement | null;
}>();
const emit = defineEmits<{ keep: [variant: { name: string; props: Record<string, unknown>; tokens: Record<string, string> }] }>();

// DialKit (and Motion, which it animates with) load with the first piece opened, not with the canvas
const TuneDials = defineAsyncComponent(() => import("./TuneDials.vue"));

const id = useId();
const element = shallowRef<HTMLElement | null>(null);
const dials = shallowRef<Dials | null>(null);
const problem = ref("");
const tuned = shallowRef<{ props: Record<string, unknown>; tokens: Record<string, string> }>({ props: {}, tokens: {} });
const name = ref("");
const dialsRef = useTemplateRef<{ reset: () => void }>("dialsRef");
const moved = computed(() => Object.keys(tuned.value.props).length + Object.keys(tuned.value.tokens).length);

/** The live piece mounts after the panel opens: wait for it, briefly */
async function waitForElement(): Promise<HTMLElement | null> {
  for (let i = 0; i < 50; i++) {
    const el = props.findElement();
    if (el) return el;
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

onMounted(async () => {
  const tag = `tc-${props.piece.slug}`;
  const [{ loadSchema }, tokens, el] = await Promise.all([
    import("~tc/src/generative/index"),
    tokensOf[props.piece.slug]?.().then((m) => m.default) ?? Promise.resolve([]),
    waitForElement(),
  ]);
  const schema = await loadSchema(tag);
  if (!el) return (problem.value = "The live piece didn't start, so there's nothing to tune.");
  if (!schema) return (problem.value = "This piece has no props schema, so there are no dials for it.");
  // Wait for the example's own script to finish setting the piece up, then start the dials from what it shows
  await new Promise((r) => setTimeout(r, 50));
  element.value = el;
  dials.value = dialsFor(schema, propsOf(el), tokens);
});

function keep() {
  emit("keep", { name: name.value.trim() || `Tuned ${props.piece.name}`, ...tuned.value });
  name.value = "";
}
</script>

<template>
  <section class="tune" :aria-labelledby="`${id}-title`">
    <h3 :id="`${id}-title`" class="tune__title" :class="{ 'sr-only': headingHidden }">Tune</h3>
    <p class="tune__hint">Move a dial and the piece changes as you go. Tokens step along their own scale.</p>
    <p v-if="problem" class="tune__hint">{{ problem }}</p>
    <p v-else-if="!dials" class="tune__hint">Loading the dials…</p>
    <template v-else-if="element">
      <TuneDials :id="`tune-${piece.id}`" ref="dialsRef" :label="piece.name" :dials="dials" :element="element" :theme="theme" @change="tuned = $event" />
      <p class="tune__hint" aria-live="polite">{{ moved ? `${moved} ${moved === 1 ? "change" : "changes"} from the original.` : "No changes yet." }}</p>
      <div class="tune__actions">
        <tc-button variant="ghost" size="sm" label="Reset" :disabled="!moved" @click="dialsRef?.reset()">
          <RotateCcw slot="icon" :size="16" aria-hidden="true" />
        </tc-button>
      </div>
      <form v-if="canKeep" class="tune__keep" @submit.prevent="keep">
        <label :for="`${id}-name`" class="tune__label">Name for the tuned version</label>
        <input :id="`${id}-name`" v-model="name" class="tune__name" type="text" :placeholder="`Tuned ${piece.name}`" />
        <tc-button type="submit" variant="secondary" size="sm" label="Keep tuned version" :disabled="!moved">
          <Save slot="icon" :size="16" aria-hidden="true" />
        </tc-button>
      </form>
    </template>
  </section>
</template>

<style scoped>
.tune {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-2);
}

.tune__title {
  margin: 0;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-semibold);
}

.tune__hint {
  margin: 0;
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
}

.tune__actions {
  display: flex;
  gap: var(--tc-space-1);
}

.tune__keep {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-1-5);
  align-items: flex-start;
}

.tune__label {
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
}

.tune__name {
  align-self: stretch;
  padding: var(--tc-space-1-5) var(--tc-space-3);
  border: var(--tc-hairline) solid var(--tc-border-default);
  border-radius: var(--tc-field-radius);
  background: var(--tc-surface-base);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
}

.tune__name:focus-visible {
  outline: 2px solid var(--tc-focus-ring);
  outline-offset: 1px;
}
</style>
