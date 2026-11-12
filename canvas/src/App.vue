<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, shallowRef, useTemplateRef, watchEffect } from "vue";
import AppToolbar, { type Filters } from "./components/AppToolbar.vue";
import CanvasStage from "./components/CanvasStage.vue";
import PieceList from "./components/PieceList.vue";
import type { Point } from "./canvas/geometry";
import { useMedia } from "./composables/media";
import { oneOf, persisted } from "./composables/persisted";
import { CATEGORIES, LIBRARY_LABELS, PIECES, type Look, type Theme } from "./data/pieces";
import { createSetup } from "./create/api";
import { NO_RIFF, riffSetup } from "./riff/api";

export type LayoutName = "grid" | "similar" | "graph" | "free";
export type ViewName = "canvas" | "list";

const prefersDark = useMedia("(prefers-color-scheme: dark)");
const layout = persisted<LayoutName>("layout", "grid", oneOf("grid", "similar", "graph", "free"));
const view = persisted<ViewName>("view", "canvas", oneOf("canvas", "list"));
const look = persisted<Look>("look", "standard", oneOf("standard", "clean"));
const theme = persisted<Theme>("theme", prefersDark.value ? "dark" : "light", oneOf("light", "dark"));
const moved = persisted<Record<string, Point>>(
  "moved",
  {},
  (v): v is Record<string, Point> => typeof v === "object" && v !== null && Object.values(v).every((p) => typeof p?.x === "number" && typeof p?.y === "number"),
);
const filters = ref<Filters>({});
// Which components can be riffed on, and with which model: asked of the dev server, so none in a built canvas
const riff = shallowRef(NO_RIFF);
onMounted(async () => (riff.value = await riffSetup()));
// Whether the dev server can build new components, and with which agent
const create = shallowRef<{ agent: string; problem: string } | null>(null);
onMounted(async () => (create.value = await createSetup()));
const creating = ref(false);
const CreatePanel = defineAsyncComponent(() => import("./components/CreatePanel.vue"));
// New components go in a component category: the sections that aren't a whole library
const componentCategories = CATEGORIES.filter((c) => !Object.values(LIBRARY_LABELS).includes(c));
async function closeCreate() {
  creating.value = false;
  await nextTick();
  // tc-button moves aria-controls onto the native button it renders
  document.querySelector<HTMLElement>('button[aria-controls="create-panel"]')?.focus();
}

watchEffect(() => {
  document.documentElement.dataset.tcTheme = theme.value;
});

const pieces = computed(() =>
  PIECES.filter(
    (p) =>
      (!filters.value.library?.length || filters.value.library.includes(p.library)) &&
      (!filters.value.category?.length || filters.value.category.includes(p.category)),
  ),
);
const summary = computed(() => {
  const libraries = new Set(pieces.value.map((p) => p.library)).size;
  return `${pieces.value.length} of ${PIECES.length} pieces · ${libraries} ${libraries === 1 ? "library" : "libraries"}`;
});

const announcement = ref("");
function announce(text: string) {
  // Cleared first, so the same words twice are still read
  announcement.value = "";
  void nextTick(() => (announcement.value = text));
}

const stage = useTemplateRef("stage");
async function jump(id: string) {
  if (!pieces.value.some((p) => p.id === id)) {
    filters.value = {};
    announce("Filters cleared to show the piece.");
  }
  view.value = "canvas";
  await nextTick();
  stage.value?.jump(id);
}

/** "More like this": the Similar layout, at the piece */
async function showSimilar(id: string) {
  layout.value = "similar";
  await nextTick();
  // After the stage has named the piece, so this is what's heard
  await stage.value?.jump(id);
  const name = PIECES.find((p) => p.id === id)?.name;
  announce(`Similar layout. ${name} among the pieces that look most like it.`);
}

function resetLayout() {
  moved.value = {};
  announce("Pieces moved back to the grid.");
}
</script>

<template>
  <!-- The look provider is display: contents; the layout is the div inside it -->
  <tc-look-provider :look="look">
    <div class="app">
      <a class="skip" href="#main">Skip to the pieces</a>
      <AppToolbar
        v-model:layout="layout"
        v-model:view="view"
        v-model:look="look"
        v-model:theme="theme"
        v-model:filters="filters"
        v-model:creating="creating"
        :pieces="pieces"
        :libraries="LIBRARY_LABELS"
        :can-reset="layout === 'free' && Object.keys(moved).length > 0"
        :can-create="!!create"
        @jump="jump"
        @reset-layout="resetLayout"
      />
      <div class="body">
        <main id="main" tabindex="-1" class="main">
          <h2 class="sr-only">{{ view === "canvas" ? "Canvas" : "List" }} of pieces</h2>
          <CanvasStage
            v-if="view === 'canvas'"
            ref="stage"
            v-model:moved="moved"
            :pieces="pieces"
            :layout="layout"
            :theme="theme"
            :look="look"
            :summary="summary"
            :riff-setup="riff"
            @announce="announce"
            @similar="showSimilar"
          />
          <PieceList v-else :pieces="pieces" :layout="layout" :theme="theme" :look="look" :summary="summary" @show="jump" />
        </main>
        <CreatePanel v-if="creating && create" :agent="create.agent" :problem="create.problem" :categories="componentCategories" @close="closeCreate" />
      </div>
      <p role="status" class="sr-only" data-announcer>{{ announcement }}</p>
    </div>
  </tc-look-provider>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* The pieces, and the New component panel beside them when it's open */
.body {
  display: flex;
  flex: 1;
  min-height: 0;
}

@media (max-width: 48rem) {
  .body {
    flex-direction: column;
  }
}

.main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.main:focus {
  outline: none;
}

.skip {
  position: absolute;
  z-index: 10;
  top: var(--tc-space-2);
  left: var(--tc-space-2);
  padding: var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-raised);
  color: var(--tc-text-primary);
  transform: translateY(-200%);
}

.skip:focus {
  transform: none;
}
</style>
