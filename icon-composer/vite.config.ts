import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => ({
  plugins: [vue({ template: { compilerOptions: { isCustomElement: tag => tag === 'slot' || tag === 'icon-composer' } } })],
  build: mode === 'library' ? {
    outDir: 'dist/elements',
    lib: { entry: 'src/element.ts', formats: ['es'], fileName: () => 'icon-composer.js' },
    // Vue is bundled so consumers do not need a framework or import map.
  } : undefined,
}));
