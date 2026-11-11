<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { mountExample } from "../data/examples";

// A piece running for real, from its docs example. It renders at twice the card's size and is scaled down to fit,
// so it reads at its natural size once the canvas is zoomed to 200%. Until the viewer opens it, it is inert: it
// can't take focus or clicks, so Tab moves between cards rather than through every live control.
const props = defineProps<{ slug: string; prefix: string; label: string; interactive: boolean }>();
const emit = defineEmits<{ failed: []; ready: [] }>();
const root = useTemplateRef<HTMLElement>("root");

onMounted(() => {
  if (!root.value) return;
  mountExample(root.value, props.slug, props.prefix).then(
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
