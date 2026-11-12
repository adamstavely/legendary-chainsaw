<script setup lang="ts">
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "@lucide/vue";
import { computed, ref } from "vue";
import type { Direction, Rect } from "../canvas/geometry";
import { thumbOf, type Look, type Piece, type Theme } from "../data/pieces";
import LivePreview from "./LivePreview.vue";

const props = defineProps<{
  piece: Piece;
  rect: Rect;
  /** Show the running piece instead of its thumbnail */
  live: boolean;
  /** Opened: the live piece takes focus and input */
  open: boolean;
  /** The card the arrow keys start from; the only one in the Tab order */
  current: boolean;
  /** Free layout: the card can be moved */
  movable: boolean;
  theme: Theme;
  look: Look;
}>();
const emit = defineEmits<{ select: []; open: []; move: [direction: Direction] }>();

const domId = computed(() => `piece-${props.piece.id.replace(/[^a-z0-9-]/gi, "-")}`);
const thumb = computed(() => thumbOf(props.piece, props.theme, props.look));
// A live piece that fails to start falls back to its thumbnail
const failed = ref(false);
const initials = computed(() =>
  props.piece.name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase(),
);
const nudges: { direction: Direction; label: string; icon: typeof ArrowUp }[] = [
  { direction: "left", label: "left", icon: ArrowLeft },
  { direction: "up", label: "up", icon: ArrowUp },
  { direction: "down", label: "down", icon: ArrowDown },
  { direction: "right", label: "right", icon: ArrowRight },
];
</script>

<template>
  <article
    class="card"
    :class="{ 'card--current': current, 'card--open': open }"
    :style="{ transform: `translate(${rect.x}px, ${rect.y}px)` }"
    :data-piece="piece.id"
    :aria-labelledby="`${domId}-title`"
  >
    <header class="card__head" :data-drag-handle="movable ? piece.id : undefined">
      <button
        :id="`${domId}-title`"
        class="card__title"
        type="button"
        :tabindex="current ? 0 : -1"
        :aria-describedby="`${domId}-about`"
        :aria-expanded="piece.live && !failed ? open : undefined"
        @focus="emit('select')"
        @click="emit('open')"
      >
        {{ piece.name }}
      </button>
      <span :id="`${domId}-about`" class="sr-only">
        {{ piece.category }}. {{ piece.description }}
        {{ piece.live && !failed ? "Press Enter to open it live." : "Preview image only." }}
      </span>
      <span v-if="movable && current" class="card__nudge" role="group" :aria-label="`Move ${piece.name}`">
        <tc-button v-for="n in nudges" :key="n.direction" variant="ghost" size="sm" hide-label :label="`Move ${n.label}`" @click="emit('move', n.direction)">
          <component :is="n.icon" slot="icon" :size="16" aria-hidden="true" />
        </tc-button>
      </span>
    </header>
    <div class="card__stage">
      <LivePreview v-if="live && !failed" :slug="piece.slug" :prefix="domId" :label="piece.name" :interactive="open" @failed="failed = true" />
      <img v-else-if="thumb" class="card__thumb" :src="thumb" alt="" width="320" height="200" decoding="async" draggable="false" />
      <span v-else class="card__placeholder" aria-hidden="true">{{ initials }}</span>
    </div>
  </article>
</template>

<style scoped>
.card {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  width: 320px;
  height: 240px;
  overflow: hidden;
  border: var(--tc-hairline) solid var(--tc-border-default);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}

.card--current {
  border-color: var(--tc-border-selected);
}

.card--open {
  box-shadow: var(--tc-shadow-overlay);
}

.card__head {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1);
  height: 40px;
  padding: 0 var(--tc-space-1) 0 var(--tc-space-1);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}

.card__head[data-drag-handle] {
  cursor: grab;
}

.card__title {
  flex: 1;
  min-width: 0;
  min-height: 24px;
  padding: var(--tc-space-1) var(--tc-space-2);
  overflow: hidden;
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: none;
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.card__title:hover {
  background: var(--tc-surface-sunken);
}

.card__nudge {
  display: flex;
  flex: none;
}

.card__stage {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: var(--tc-surface-base);
}

.card__thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

.card__placeholder {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-2xl);
  font-weight: var(--tc-font-weight-semibold);
}
</style>
