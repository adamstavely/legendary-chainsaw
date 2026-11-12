<script setup lang="ts">
import { computed, ref } from "vue";
import type { Rect } from "../canvas/geometry";
import type { ShownVariant } from "../riff/session";
import LivePreview from "./LivePreview.vue";

// A variant beside the piece it came from: the same live example with the variant's props and tokens set. It's a
// picture to compare, so it never takes focus; the riff panel lists the variants and acts on them
const props = defineProps<{ variant: ShownVariant; slug: string; rect: Rect; current: boolean }>();
const domId = computed(() => `variant-${props.variant.id.replace(/[^a-z0-9-]/gi, "-")}`);
const failed = ref(false);
const structural = computed(() => "structural" in props.variant && props.variant.structural);
</script>

<template>
  <article
    class="variant"
    :class="{ 'variant--current': current, 'variant--kept': variant.kept }"
    :style="{ transform: `translate(${rect.x}px, ${rect.y}px)` }"
    :data-variant="variant.id"
    :aria-labelledby="`${domId}-name`"
  >
    <header class="variant__head">
      <span :id="`${domId}-name`" class="variant__name">{{ variant.name }}</span>
      <span v-if="variant.kept" class="variant__badge variant__badge--kept">Kept</span>
      <span v-else-if="structural" class="variant__badge">Needs new code</span>
    </header>
    <div class="variant__stage">
      <LivePreview v-if="!failed" :slug="slug" :prefix="domId" :label="variant.name" :interactive="false" :variant="variant" @failed="failed = true" />
      <p v-else class="variant__failed">This variant couldn't be shown.</p>
    </div>
  </article>
</template>

<style scoped>
.variant {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  width: 320px;
  height: 240px;
  overflow: hidden;
  border: var(--tc-hairline) solid var(--tc-border-selected);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-overlay);
}

.variant--current {
  outline: 2px solid var(--tc-focus-ring);
  outline-offset: 2px;
}

.variant__head {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-2);
  height: 40px;
  padding: 0 var(--tc-space-3);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}

.variant__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.variant__badge {
  flex: none;
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-radius-full);
  background: var(--tc-status-warning-bg);
  color: var(--tc-status-warning-fg);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-medium);
  line-height: 20px;
}

.variant__badge--kept {
  background: var(--tc-status-success-bg);
  color: var(--tc-status-success-fg);
}

.variant__stage {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: var(--tc-surface-base);
}

.variant__failed {
  display: grid;
  height: 100%;
  margin: 0;
  place-items: center;
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
}
</style>
