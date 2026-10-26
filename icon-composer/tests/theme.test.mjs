import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const styles = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../src/theme.css', import.meta.url), 'utf8');
test('reference theme supplies every token consumed by shadow layout', () => {
  const references = [...styles.matchAll(/var\((--ic-[\w-]+)/g)].map(match => match[1]);
  // Preview override is populated at runtime by the background preference.
  const definitions = new Set([...theme.matchAll(/(--ic-[\w-]+)\s*:/g)].map(match => match[1]));
  definitions.add('--ic-preview-background');
  assert.deepEqual([...new Set(references)].filter(token => !definitions.has(token)), []);
});
test('embeddable layout has no fixed palette, external fonts, or document selectors', () => {
  assert.doesNotMatch(styles, /#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i);
  assert.doesNotMatch(styles, /@import|https?:|font-family\s*:\s*['"]/i);
  assert.doesNotMatch(styles, /(?:^|[}\n])\s*(?:html|body|:root)\s*[{,]/);
  assert.doesNotMatch(theme, /(?:^|[}\n])\s*(?:html|body|:root)\s*[{,]/);
});

const palette = Object.fromEntries([...theme.matchAll(/(--ic-[\w-]+):\s*(#[\da-f]{3,6});/gi)].map(m => [m[1],m[2]]));
function luminance(hex) {
  let raw=hex.slice(1);if(raw.length===3)raw=[...raw].map(c=>c+c).join('');
  const rgb=[0,2,4].map(i=>parseInt(raw.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(a,b) {const values=[luminance(palette[a]),luminance(palette[b])].sort((x,y)=>y-x);return (values[0]+.05)/(values[1]+.05);}
test('reference theme meets AA text and UI contrast on editor surfaces',()=>{
  for(const surface of ['--ic-surface','--ic-surface-subtle','--ic-background','--ic-accent-subtle']) {
    for(const text of ['--ic-text','--ic-muted','--ic-accent'])assert.ok(contrast(text,surface)>=4.5,`${text} on ${surface}`);
    assert.ok(contrast('--ic-control-border',surface)>=3,`Control border on ${surface}`);
  }
  assert.ok(contrast('--ic-on-accent','--ic-accent')>=4.5);
  assert.ok(contrast('--ic-inverse-text','--ic-inverse-surface')>=4.5);
});
