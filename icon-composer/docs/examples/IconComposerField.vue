<script setup lang="ts">
// Copy to the consuming application's src/components/ directory.
// Copy dist/elements/* to src/vendor/icon-composer/ before building the host app.
import { onMounted, ref } from 'vue';
import type { Composition, IconExport } from '../vendor/icon-composer/icon-composer.js';
import '../vendor/icon-composer/theme.css';

const props = defineProps<{ modelValue?: Composition }>();
const emit = defineEmits<{
  'update:modelValue': [value: Composition];
  export: [value: IconExport];
  error: [value: { message: string }];
}>();
const ready = ref(false);
const registrationError = ref('');
onMounted(async () => {
  try {
    const { registerIconComposer } = await import('../vendor/icon-composer/icon-composer.js');
    registerIconComposer();
    ready.value = true;
  } catch {
    registrationError.value = 'The icon editor could not be loaded.';
    emit('error', { message: registrationError.value });
  }
});
function changed(event: CustomEvent<[Composition]>) {
  emit('update:modelValue', event.detail[0]);
}
function exported(event: CustomEvent<[IconExport]>) {
  emit('export', event.detail[0]);
}
function failed(event: CustomEvent<[{ message: string }]>) {
  emit('error', event.detail[0]);
}
</script>

<template>
  <icon-composer
    v-if="ready"
    :composition.prop="props.modelValue"
    :downloads.prop="false"
    :chrome.prop="false"
    @composition-change="changed"
    @icon-export="exported"
    @composer-error="failed"
  >
    <span slot="brand">Icon library</span>
  </icon-composer>
  <p v-else role="status">{{ registrationError || 'Loading icon editor…' }}</p>
</template>
