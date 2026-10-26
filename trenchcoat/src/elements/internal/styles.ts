/*
 * Light DOM elements can't use LitElement's `static styles` (those go into a shadow root), so each element type adds
 * its CSS to the document once (decision L6): a constructed stylesheet in `document.adoptedStyleSheets`, or a
 * <style> element where constructed stylesheets aren't supported. However many instances render, there is one copy.
 */
const adopted = new Set<string>();

export function adoptStyles(key: string, css: string, doc: Document = document) {
  const id = `${key}@${docId(doc)}`;
  if (adopted.has(id)) return;
  adopted.add(id);
  const view = doc.defaultView as (Window & typeof globalThis) | null;
  if (view && "adoptedStyleSheets" in doc && "replaceSync" in view.CSSStyleSheet.prototype) {
    const sheet = new view.CSSStyleSheet();
    sheet.replaceSync(css);
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
    return;
  }
  const style = doc.createElement("style");
  style.dataset.tc = key;
  style.textContent = css;
  doc.head.append(style);
}

/** For tests: forget what was adopted (the next adoptStyles adds it again) */
export function resetAdoptedStyles() {
  adopted.clear();
}

const ids = new WeakMap<Document, number>();
let next = 0;
const docId = (doc: Document) => {
  if (!ids.has(doc)) ids.set(doc, next++);
  return ids.get(doc)!;
};
