<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { mountExample } from "../data/examples";
import { applyVariant } from "../riff/apply";

// A piece running for real, from its docs example. It renders at twice the card's size and is scaled down to fit,
// so it reads at its natural size once the canvas is zoomed to 200%. Until the viewer opens it, it is inert: it
// can't take focus or clicks, so Tab moves between cards rather than through every live control. A variant is the same
// example with the variant's props and tokens set on the piece once its script has run.
const props = defineProps<{
  slug: string;
  prefix: string;
  label: string;
  interactive: boolean;
  variant?: { props: Record<string, unknown>; tokens: Record<string, string> };
}>();
const emit = defineEmits<{ failed: []; ready: [] }>();
const root = useTemplateRef<HTMLElement>("root");

onMounted(() => {
  if (!root.value) return;
  const root_ = root.value;
  mountExample(root_, props.slug, props.prefix)
    .then(async () => {
      if (!props.variant) return;
      const piece = root_.querySelector<HTMLElement>(`tc-${props.slug}`);
      if (!piece) throw new Error(`No tc-${props.slug} in the example`);
      await applyVariant(piece, props.variant);
    })
    .then(
      () => emit("ready"),
      () => emit("failed"),
    );
});
onBeforeUnmount(() => root.value?.replaceChildren());
</script>

<template>
  <div class="live" :inert="!interactive">
    <!-- Scrollable when the piece is bigger than the card, so it takes focus for keyboard scrolling while open -->
    <div ref="root" class="live__piece" role="region" :aria-label="`${label}, live`" :tabindex="interactive ? 0 : undefined"></div>
  </div>
</template>

<style scoped>
.live {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.live__piece {
  width: 200%;
  height: 200%;
  padding: var(--tc-space-6);
  overflow: auto;
  transform: scale(0.5);
  transform-origin: 0 0;
}
</style>
