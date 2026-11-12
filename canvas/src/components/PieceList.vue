<script setup lang="ts">
import { computed } from "vue";
import type { LayoutName } from "../App.vue";
import { similarGroups } from "../data/lookalikes";
import { CATEGORIES, thumbOf, type Look, type Piece, type Theme } from "../data/pieces";

// The canvas as a plain list: every piece under its category heading, for screen readers, small screens and anyone
// who would rather scroll than pan. In the Similar layout it groups them by look, as the canvas does
const props = defineProps<{ pieces: readonly Piece[]; layout: LayoutName; theme: Theme; look: Look; summary: string }>();
const emit = defineEmits<{ show: [id: string] }>();

const sections = computed(() => {
  const byId = new Map(props.pieces.map((p) => [p.id, p]));
  const groups =
    props.layout === "similar"
      ? similarGroups(props.pieces.map((p) => p.id))
      : CATEGORIES.map((label) => ({ label, ids: props.pieces.filter((p) => p.category === label).map((p) => p.id) }));
  return groups
    .map(({ label, ids }) => ({ label, id: `list-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, pieces: ids.map((id) => byId.get(id)!) }))
    .filter((s) => s.pieces.length);
});
</script>

<template>
  <div class="list">
    <p class="list__count">{{ summary }}</p>
    <p v-if="!pieces.length">No pieces match the filters.</p>
    <section v-for="section in sections" :key="section.label" :aria-labelledby="section.id">
      <h3 :id="section.id" class="list__heading">{{ section.label }}</h3>
      <ul class="list__items">
        <li v-for="piece in section.pieces" :key="piece.id" class="item">
          <img
            v-if="thumbOf(piece, theme, look)"
            class="item__thumb"
            :src="thumbOf(piece, theme, look)"
            alt=""
            width="160"
            height="100"
            loading="lazy"
            decoding="async"
          />
          <div class="item__text">
            <h4 class="item__name">{{ piece.name }}</h4>
            <p class="item__about">{{ piece.description }}</p>
            <tc-button
              variant="secondary"
              size="sm"
              label="Show on canvas"
              :aria-label="`Show on canvas: ${piece.name}`"
              @click="emit('show', piece.id)"
            ></tc-button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.list {
  flex: 1;
  overflow: auto;
  padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-8);
}

.list__count {
  margin: 0 0 var(--tc-space-4);
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
}

.list__heading {
  margin: var(--tc-space-6) 0 var(--tc-space-3);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-semibold);
}

.list__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  gap: var(--tc-space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  gap: var(--tc-space-3);
  padding: var(--tc-space-3);
  border: var(--tc-hairline) solid var(--tc-border-default);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
}

.item__thumb {
  flex: none;
  width: 160px;
  height: 100px;
  border-radius: var(--tc-radius-sm);
  object-fit: cover;
}

.item__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--tc-space-1);
  min-width: 0;
}

.item__name {
  margin: 0;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
}

.item__about {
  flex: 1;
  margin: 0;
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
}

@media (max-width: 30rem) {
  .item {
    flex-direction: column;
  }

  .item__thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
  }
}
</style>
