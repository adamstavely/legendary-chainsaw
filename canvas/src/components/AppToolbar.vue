<script setup lang="ts">
import { Funnel, LayoutGrid, RotateCcw } from "@lucide/vue";
import type { CommandMenuGroup, FilterGroup, FilterValue, SegmentOption } from "@adamstavely/trenchcoat";
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from "vue";
import type { LayoutName, ViewName } from "../App.vue";
import { CATEGORIES, type Look, type Piece, type Theme } from "../data/pieces";

export type Filters = FilterValue;

const props = defineProps<{ pieces: readonly Piece[]; libraries: Readonly<Record<string, string>>; canReset: boolean }>();
const layout = defineModel<LayoutName>("layout", { required: true });
const view = defineModel<ViewName>("view", { required: true });
const look = defineModel<Look>("look", { required: true });
const theme = defineModel<Theme>("theme", { required: true });
const filters = defineModel<Filters>("filters", { required: true });
const emit = defineEmits<{ jump: [id: string]; "reset-layout": [] }>();

const layoutOptions: SegmentOption[] = [
  { value: "grid", label: "Grid" },
  { value: "free", label: "Free" },
];
const viewOptions: SegmentOption[] = [
  { value: "canvas", label: "Canvas" },
  { value: "list", label: "List" },
];
const lookOptions: SegmentOption[] = [
  { value: "standard", label: "Standard" },
  { value: "clean", label: "Clean" },
];
const themeOptions: SegmentOption[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// "Jump to component" lists every piece, grouped as on the canvas; it also finds pieces by their description
const jumpGroups = computed<CommandMenuGroup[]>(() =>
  CATEGORIES.map((category) => ({
    id: `category:${category}`,
    label: category,
    commands: props.pieces.filter((p) => p.category === category).map((p) => ({ id: p.id, label: p.name, keywords: `${p.description} ${p.libraryLabel}` })),
  })).filter((g) => g.commands.length),
);
const jumpMenu = useTemplateRef<HTMLElement & { query: string; onRun?: (id: string) => void }>("jumpMenu");
function runJump(id: string) {
  emit("jump", id);
  if (jumpMenu.value) jumpMenu.value.query = "";
}
// Set in script: a template binding named on… would be read as an event listener
onMounted(() => {
  if (jumpMenu.value) jumpMenu.value.onRun = runJump;
});

const filterGroups = computed<FilterGroup[]>(() => [
  { id: "library", label: "Library", options: Object.entries(props.libraries).map(([id, label]) => ({ id, label })) },
  { id: "category", label: "Category", options: CATEGORIES.filter((c) => !Object.values(props.libraries).includes(c)).map((c) => ({ id: c, label: c })) },
]);
const filterCount = computed(() => Object.values(filters.value).reduce((n, ids) => n + (ids?.length ?? 0), 0));

// Filters open as a disclosure under their button: Escape or a click outside closes it, and focus goes back
const filterOpen = ref(false);
const filterId = useId();
const filterButton = useTemplateRef<HTMLElement>("filterButton");
const filterPanel = useTemplateRef<HTMLElement>("filterPanel");
function closeFilters(restoreFocus: boolean) {
  filterOpen.value = false;
  // tc-button renders a native button inside itself (light DOM); that is what takes focus
  if (restoreFocus) filterButton.value?.querySelector("button")?.focus();
}
const inFilters = (e: Event) => {
  const path = e.composedPath();
  return (!!filterPanel.value && path.includes(filterPanel.value)) || (!!filterButton.value && path.includes(filterButton.value));
};
function onOutside(e: PointerEvent) {
  if (!inFilters(e)) closeFilters(false);
}
function onEscape(e: KeyboardEvent) {
  if (e.key === "Escape" && !e.defaultPrevented && inFilters(e)) {
    e.stopPropagation();
    closeFilters(true);
  }
}
function listen(on: boolean) {
  if (on) {
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onEscape);
  } else {
    document.removeEventListener("pointerdown", onOutside);
    document.removeEventListener("keydown", onEscape);
  }
}
watch(filterOpen, listen);
onBeforeUnmount(() => listen(false));

/** The value a tc-segmented-control's tc-value-change proposes */
const picked = <T extends string>(e: Event) => (e as CustomEvent<{ value: string }>).detail.value as T;
</script>

<template>
  <header class="bar">
    <h1 class="brand">
      <LayoutGrid :size="18" aria-hidden="true" />
      <span>Trenchcoat Canvas</span>
    </h1>

    <tc-command-menu
      ref="jumpMenu"
      class="jump"
      layout="popover"
      label="Jump to a piece"
      placeholder="Jump to a piece…"
      empty-text="No piece matches “{query}”"
      :groups.prop="jumpGroups"
      :assistant.prop="false"
    ></tc-command-menu>

    <div class="group">
      <tc-segmented-control
        v-if="view === 'canvas'"
        aria-label="Layout"
        size="sm"
        :options.prop="layoutOptions"
        :value.prop="layout"
        @tc-value-change="layout = picked($event)"
      ></tc-segmented-control>
      <tc-button v-if="canReset" variant="ghost" size="sm" label="Reset layout" @click="emit('reset-layout')">
        <RotateCcw slot="icon" :size="16" aria-hidden="true" />
      </tc-button>

      <div class="filter">
        <tc-button
          ref="filterButton"
          variant="secondary"
          size="sm"
          :label="filterCount ? `Filter (${filterCount})` : 'Filter'"
          :aria-expanded="String(filterOpen)"
          :aria-controls="filterId"
          @click="filterOpen = !filterOpen"
        >
          <Funnel slot="icon" :size="16" aria-hidden="true" />
        </tc-button>
        <div v-show="filterOpen" :id="filterId" ref="filterPanel" class="filter__panel">
          <!-- The filter menu's own heading is an h3; this keeps the outline in order -->
          <h2 class="sr-only">Filters</h2>
          <tc-filter-menu
            heading="Filter pieces"
            :groups.prop="filterGroups"
            :value.prop="filters"
            @tc-value-change="filters = ($event as CustomEvent<{ value: Filters }>).detail.value"
          ></tc-filter-menu>
        </div>
      </div>
    </div>

    <div class="group group--end">
      <tc-segmented-control
        aria-label="View"
        size="sm"
        :options.prop="viewOptions"
        :value.prop="view"
        @tc-value-change="view = picked($event)"
      ></tc-segmented-control>
      <tc-segmented-control
        aria-label="Look"
        size="sm"
        :options.prop="lookOptions"
        :value.prop="look"
        @tc-value-change="look = picked($event)"
      ></tc-segmented-control>
      <tc-segmented-control
        aria-label="Theme"
        size="sm"
        :options.prop="themeOptions"
        :value.prop="theme"
        @tc-value-change="theme = picked($event)"
      ></tc-segmented-control>
    </div>
  </header>
</template>

<style scoped>
.bar {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-3);
  padding: var(--tc-space-2) var(--tc-space-4);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
  background: var(--tc-surface-raised);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  margin: 0;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-semibold);
  white-space: nowrap;
}

.jump {
  flex: 1 1 14rem;
  max-width: 22rem;
}

.group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-2);
}

.group--end {
  margin-left: auto;
}

.filter {
  position: relative;
}

.filter__panel {
  position: absolute;
  top: calc(100% + var(--tc-space-2));
  left: 0;
  width: min(20rem, calc(100vw - 2 * var(--tc-space-4)));
  max-height: min(32rem, 70vh);
  overflow: auto;
}
</style>
