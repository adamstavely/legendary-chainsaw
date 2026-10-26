import { defineCustomElement } from 'vue';
import App from './App.vue';
import styles from './style.css?inline';
export type { Composition, Layer, IconExport, Palette, ColorChannel, PathPoint, VectorPath, Erasure } from './types';

/** Shadow styles contain layout only. Supply theme.css or map --ic-* tokens. */
export const IconComposerElement = defineCustomElement(App, { styles: [styles] });

/** Registration is explicit so importing the module does not mutate the host. */
export function registerIconComposer(tagName = 'icon-composer'): void {
  if (!customElements.get(tagName)) customElements.define(tagName, tagName === 'icon-composer' ? IconComposerElement : defineCustomElement(App, { styles: [styles] }));
}
