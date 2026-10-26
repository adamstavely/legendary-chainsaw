import { maskGeometry } from './erasing.mjs';
import { geometry, shapeNames, supportedText } from './geometry.mjs';
export function escapeXml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])); }
export function isSharedColor(layer, channel) {
  return layer[`${channel}ColorScope`]==='shared'||(layer[`${channel}ColorScope`]!=='layer'&&layer[`${channel}Color`]===undefined&&layer[`${channel}Opacity`]===undefined);
}
export function colorStyle(layer, palette={}, channel='fill') {
  const source=isSharedColor(layer,channel)?palette:layer;
  return {color:source[`${channel}Color`]??'currentColor',opacity:source[`${channel}Opacity`]??1};
}
export function drawLayer(layer, icons, stroke = 2, color = 'currentColor', clearance = 0, palette = {}, eraseId = 'layer-erase') {
  const transform = `translate(${layer.x} ${layer.y}) translate(12 12) rotate(${layer.rotation}) scale(${layer.scale * (layer.flip ? -1 : 1)} ${layer.scale}) translate(-12 -12)`;
  const text=layer.kind==='text';
  const fill=text || (['shape','path','vector'].includes(layer.kind)&&layer.paint!=='stroke'&&!(layer.kind==='shape'&&layer.shape==='line'));
  const outline=!text && (!fill || layer.paint==='both');
  const width=((outline?(layer.strokeWidth ?? stroke):0)+clearance*2)/layer.scale;
  const fillStyle=colorStyle(layer,palette,'fill'),strokeStyle=colorStyle(layer,palette,'stroke');
  const fillColor=color==='black'?'black':fillStyle.color;
  const strokeColor=color==='black'?'black':strokeStyle.color;
  return `<g transform="${transform}" fill="${fill?fillColor:'none'}" stroke="${width>0?strokeColor:'none'}" stroke-width="${width}" fill-opacity="${color==='black'?1:fillStyle.opacity}" stroke-opacity="${color==='black'?1:strokeStyle.opacity}" stroke-linecap="round" stroke-linejoin="round">${maskGeometry(geometry(layer,icons),layer.erasures,eraseId)}</g>`;
}
export function renderLayers(layers, icons, stroke = 2, prefix = 'composer', palette = {}) {
  let content = '';
  for (const [i, layer] of layers.entries()) {
    if (!layer.visible) continue;
    if (layer.mode !== 'overlay') {
      const id = `${prefix}-mask-${i}`;
      content = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-24" y="-24" width="72" height="72" style="mask-type:luminance"><rect x="-24" y="-24" width="72" height="72" fill="white"/>${drawLayer(layer,icons,stroke,'black',layer.mode==='space'?layer.gap:0,palette,`${prefix}-erase-cut-${i}`)}</mask></defs><g mask="url(#${id})">${content}</g>`;
    }
    if (layer.mode !== 'cutout') content += drawLayer(layer,icons,stroke,'currentColor',0,palette,`${prefix}-erase-${i}`);
  }
  return content;
}
export function svgDocument(layers, icons, stroke, name, palette = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" role="img" aria-label="${escapeXml(name)}">${renderLayers(layers, icons, stroke, 'export', palette)}</svg>`;
}
export function validComposition(value, icons) {
  if(!value || value.version!==1 || typeof value.name!=='string'||value.name.length>100||!Number.isFinite(value.stroke)||value.stroke<.5||value.stroke>4||!Array.isArray(value.layers)||value.layers.length>100)return false;
  const validColor=c=>c===undefined||c==='currentColor'||typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
  const validAlpha=n=>n===undefined||Number.isFinite(n)&&n>=0&&n<=1;
  if(value.palette!==undefined&&(!value.palette||typeof value.palette!=='object'||Array.isArray(value.palette)||!validColor(value.palette.fillColor)||!validColor(value.palette.strokeColor)||!validAlpha(value.palette.fillOpacity)||!validAlpha(value.palette.strokeOpacity)))return false;
  const ids=new Set();
  return value.layers.every(l=>{
    if(!l||typeof l.id!=='string'||!l.id||ids.has(l.id))return false;
    ids.add(l.id);
    if(!['overlay','space','cutout'].includes(l.mode)||typeof l.visible!=='boolean'||typeof l.flip!=='boolean'||!['x','y','scale','rotation','gap'].every(k=>Number.isFinite(l[k]))||l.scale<.1||l.scale>2||l.gap<0||l.gap>4||Math.abs(l.x)>24||Math.abs(l.y)>24||Math.abs(l.rotation)>360)return false;
    if(['fill','stroke'].some(c=>l[c+'ColorScope']!==undefined&&!['shared','layer'].includes(l[c+'ColorScope'])))return false;
    const bounded=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
    const coord=v=>bounded(v,-256,256);
    const validPoint=p=>p&&coord(p.x)&&coord(p.y)&&(p.cx===undefined&&p.cy===undefined||coord(p.cx)&&coord(p.cy))&&(['c1x','c1y','c2x','c2y'].every(k=>p[k]===undefined)||['c1x','c1y','c2x','c2y'].every(k=>coord(p[k])));
    if(l.erasures!==undefined&&(!Array.isArray(l.erasures)||l.erasures.length>256||!l.erasures.every(e=>e&&['erase','restore'].includes(e.action)&&(e.type==='rect'?coord(e.x)&&coord(e.y)&&bounded(e.width,0,512)&&bounded(e.height,0,512):e.type==='brush'&&bounded(e.size,.01,128)&&Array.isArray(e.points)&&e.points.length>=1&&e.points.length<=2048&&e.points.every(p=>p&&coord(p.x)&&coord(p.y))))))return false;
    if(l.kind==='vector')return ['stroke','fill','both'].includes(l.paint)&&Array.isArray(l.paths)&&l.paths.length>=1&&l.paths.length<=128&&l.paths.every(p=>p&&typeof p.closed==='boolean'&&Array.isArray(p.points)&&p.points.length>=2&&p.points.length<=512&&p.points.every(validPoint));
    if((l.fillOpacity!==undefined&&!bounded(l.fillOpacity,0,1))||(l.strokeOpacity!==undefined&&!bounded(l.strokeOpacity,0,1)))return false;
    const validColor=c=>c===undefined||c==='currentColor'||typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
    if(!validColor(l.fillColor)||!validColor(l.strokeColor)||(l.strokeWidth!==undefined&&!bounded(l.strokeWidth,.1,8)))return false;
    if(l.kind==='text')return supportedText(l.text,l.font)&&bounded(l.fontSize,1,20)&&bounded(l.spacing,-1,3)&&['left','center','right'].includes(l.align);
    if(l.kind==='shape')return shapeNames.includes(l.shape)&&bounded(l.width,.1,48)&&bounded(l.height,.1,48)&&bounded(l.radius,0,24)&&['stroke','fill','both'].includes(l.paint);
    if(l.kind==='path')return Array.isArray(l.points)&&l.points.length>=2&&l.points.length<=64&&typeof l.closed==='boolean'&&['stroke','fill','both'].includes(l.paint)&&l.points.every(validPoint);
    return (l.kind===undefined||l.kind==='icon')&&Object.hasOwn(icons,l.icon);
  });
}

export function vueDocument(layers,icons,stroke=2,palette={}) {
  const body=renderLayers(layers,icons,stroke,'__ICON_ID__',palette).replaceAll('__ICON_ID__','${id}');
  const code=`<script setup lang="ts">\nimport { computed, useId } from 'vue';\nconst props = withDefaults(defineProps<{ size?: number | string; color?: string; strokeWidth?: number; title?: string }>(), { size: 24, color: 'currentColor', strokeWidth: ${stroke} });\nconst id = 'icon-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');\nconst paths = computed(() => \`${body}\`.replace(/stroke-width="([\\d.]+)"/g, (_, width) => 'stroke-width="' + (Number(width) * props.strokeWidth / ${stroke}) + '"'));\n<`+`/script>\n\n<template>\n  <svg xmlns="http://www.w3.org/2000/svg" :width="size" :height="size" viewBox="0 0 24 24" fill="none" :style="{ color }" :role="title ? 'img' : undefined" :aria-label="title" :aria-hidden="title ? undefined : true">\n    <g v-html="paths" />\n  </svg>\n</template>\n`;
  return code;
}
