<script setup lang="ts">
import { DialRoot, useDialKitController } from "dialkit/vue";
import "dialkit/styles.css";
import { onBeforeUnmount, watch } from "vue";
import type { Theme } from "../data/pieces";
import { applyTuned, tunedVariant, type Dials } from "../riff/tune";

// DialKit's dials for one open piece, inline in the panel. Every move is set on the live piece straight away
const props = defineProps<{ id: string; label: string; dials: Dials; element: HTMLElement; theme: Theme }>();
const emit = defineEmits<{ change: [tuned: ReturnType<typeof tunedVariant>] }>();

const controller = useDialKitController(props.label, props.dials.config, { id: props.id });
watch(
  controller.values,
  (values) => {
    const tuned = tunedVariant(props.dials, values as Record<string, unknown>);
    applyTuned(props.element, props.dials, tuned);
    emit("change", tuned);
  },
  { deep: true },
);
// Leaving the piece puts it back as it was
onBeforeUnmount(() => applyTuned(props.element, props.dials, { props: {}, tokens: {} }));

defineExpose({ reset: () => controller.resetValues() });
</script>

<template>
  <div class="dials">
    <DialRoot mode="inline" :theme="theme" production-enabled versions="menu" />
  </div>
</template>

<style scoped>
.dials {
  min-height: 0;
}

/* DialKit's own title bar and its versions / copy toolbar: the panel already has the piece's name, and Keep and Reset.
   (Its title bar also puts aria-label and aria-expanded on a plain div, which axe rightly flags) */
.dials :deep(.dialkit-panel-header),
.dials :deep(.dialkit-panel-toolbar) {
  display: none;
}
</style>
