<script setup lang="ts">
import { computed, ref, watch, onMounted, useId, nextTick } from 'vue';
import { Magnet, PenTool, Type, Square, Circle, Triangle, Diamond, Pencil, Search, Layers, Download, Plus, Minus, Undo2, Redo2, Copy, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, RotateCcw, FlipHorizontal, Grid2X2, Moon, Sun, Upload, Check, Folder, Sparkles, ArrowUpRight, X } from '@lucide/vue';
import type { Composition, IconExport, Layer, PathPoint, Palette, ColorChannel, Erasure } from './types';
import { isSharedColor, colorStyle, drawLayer, renderLayers, svgDocument, vueDocument, validComposition } from './composition.mjs';
import { iconToPaths, splitSegment, moveAnchor } from './vectors.mjs';
import { fonts, shapeNames, supportedText, layerLabel, pathData } from './geometry.mjs';
const files = import.meta.glob('/node_modules/lucide-static/icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string,string>;
const icons: Record<string,string> = Object.fromEntries(Object.entries(files).map(([path, svg]) => [path.split('/').pop()!.replace('.svg',''), svg.replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>[\s\S]*$/,'')]));
const props = withDefaults(defineProps<{
  composition?: Composition;
  storageKey?: string;
  chrome?: boolean;
  downloads?: boolean;
}>(), { chrome: false, downloads: false });
const emit = defineEmits<{
  'composition-change': [value: Composition];
  'icon-export': [value: IconExport];
  'composer-error': [value: { message: string }];
}>();
const root = ref<HTMLElement>();
const instanceId = `ic-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
const maskId = (suffix: string) => `${instanceId}-${suffix.replace(/[^a-zA-Z0-9_-]/g,'')}`;
const storageStatus = ref('');
const palette = ref<Palette>({});
const zoom = ref(100), pan = ref({x:0,y:0});
let viewDrag: {x:number;y:number;startX:number;startY:number}|undefined;
function setZoom(value:number) { zoom.value=Math.max(25,Math.min(400,value)); }
function fitCanvas() { zoom.value=100;pan.value={x:0,y:0}; }
function viewportDown(e:PointerEvent) {
  if(e.button!==1&&!e.altKey)return;
  e.preventDefault();e.stopPropagation();(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  viewDrag={x:e.clientX,y:e.clientY,startX:pan.value.x,startY:pan.value.y};
}
function viewportMove(e:PointerEvent) {
  if(!viewDrag)return;e.preventDefault();e.stopPropagation();
  pan.value={x:viewDrag.startX+e.clientX-viewDrag.x,y:viewDrag.startY+e.clientY-viewDrag.y};
}
function viewportUp() { viewDrag=undefined; }
function zoomWheel(e:WheelEvent) { if(!e.altKey)return;e.preventDefault();setZoom(zoom.value+(e.deltaY<0?25:-25)); }

const propertyTab = ref('style');
const propertyTabs = ['edit','style','transform'];
const layer = (icon:string, extra:Partial<Layer> = {}):Layer => ({ id: crypto.randomUUID(), icon, x:0,y:0,scale:1,rotation:0,gap:1,mode:'overlay',visible:true,flip:false,...extra });
const initial = [layer('folder'),layer('check',{x:6,y:6,scale:.46,mode:'space'})];
const layers = ref<Layer[]>(initial), selected = ref(initial[1].id), name = ref('folder-check'), stroke = ref(2);
const search = ref(''), tab = ref('create'), category = ref('All icons'), dark = ref(false), grid = ref(true), notice = ref(''), exportOpen = ref(false);
const canvasBackgrounds=ref<{light?:string;dark?:string}>({});
const activeBackground=computed(()=>canvasBackgrounds.value[dark.value?'dark':'light']);
const backgroundPicker=computed(()=>{
  if(activeBackground.value)return activeBackground.value;
  if(!root.value)return '';
  const context=document.createElement('canvas').getContext('2d');if(!context)return '';
  const style=getComputedStyle(root.value);
  context.fillStyle=style.getPropertyValue(dark.value?'--ic-inverse-surface':'--ic-artboard-background').trim()||style.backgroundColor;
  return String(context.fillStyle);
});
function setCanvasBackground(value:string) {if(/^#[0-9a-f]{6}$/i.test(value))canvasBackgrounds.value[dark.value?'dark':'light']=value;}
function resetCanvasBackground() {delete canvasBackgrounds.value[dark.value?'dark':'light'];}
onMounted(()=>{
  if(!props.storageKey)return;
  try {const view=JSON.parse(localStorage.getItem(props.storageKey+':view')||'null');if(!view)return;
    for(const mode of ['light','dark'] as const)if(typeof view.backgrounds?.[mode]==='string'&&/^#[0-9a-f]{6}$/i.test(view.backgrounds[mode]))canvasBackgrounds.value[mode]=view.backgrounds[mode];
    if(typeof view.dark==='boolean')dark.value=view.dark;
  }catch{}
});
watch([canvasBackgrounds,dark],()=>{if(!props.storageKey)return;try{localStorage.setItem(props.storageKey+':view',JSON.stringify({backgrounds:canvasBackgrounds.value,dark:dark.value}));}catch{}},{deep:true});
const draftText = ref('PDF'), pen = ref(false), draftPoints = ref<PathPoint[]>([]), editNodes = ref(false), selectedNode = ref(0), snap = ref(true);
defineOptions({inheritAttrs:false});
const selectedPath = ref(0), editPanel=ref('geometry');
const editablePoints = computed(() => active.value?.kind==='vector' ? active.value.paths?.[selectedPath.value]?.points : active.value?.points);
const node = computed(() => editablePoints.value?.[selectedNode.value]);
const eraseTool = ref<'move'|'erase'|'restore'>('move'), eraseMethod = ref<'brush'|'rect'>('brush'), brushSize=ref(2);
const brushCursor=ref<{x:number;y:number}>();
const exactRect=ref({x:0,y:0,width:8,height:8});
let eraserDrag: {index:number;start:{x:number;y:number}}|undefined;
function resetEditingTools() { editPanel.value='geometry';eraseTool.value='move';eraserDrag=undefined;brushCursor.value=undefined;selectedPath.value=0;selectedNode.value=0; }
const history = ref<string[]>([]), future = ref<string[]>([]);
const active = computed(() => layers.value.find(l => l.id === selected.value));
watch(selected,()=>{resetEditingTools();propertyTab.value=active.value?.kind&&active.value.kind!=='icon'?'edit':'style';});
async function propertyTabKey(event:KeyboardEvent) {
  const key=event.key;if(!['ArrowLeft','ArrowRight','Home','End'].includes(key))return;event.preventDefault();event.stopPropagation();
  const i=propertyTabs.indexOf(propertyTab.value);propertyTab.value=key==='Home'?'edit':key==='End'?'transform':propertyTabs[(i+(key==='ArrowRight'?1:2))%3];
  await nextTick();root.value?.querySelector<HTMLElement>(`[id="${maskId('tab-'+propertyTab.value)}"]`)?.focus();
}
const shapeIcons = {rectangle:Square,circle:Circle,triangle:Triangle,diamond:Diamond,line:Minus};
const modifierGroups:Record<string,string[]> = {
  'Status': ['plus','minus','check','check-check','x','circle-alert','triangle-alert','info','circle-question-mark','ban','slash','circle-dot','circle-check','circle-plus','circle-minus','circle-x'],
  'Badges': ['badge','badge-check','badge-plus','badge-minus','badge-x','badge-alert','badge-info','badge-question-mark','badge-percent','circle','square','diamond','star','heart','bookmark','flag'],
  'Arrows': ['arrow-up','arrow-down','arrow-left','arrow-right','arrow-up-right','arrow-up-left','arrow-down-left','arrow-down-right','chevron-up','chevron-down','chevron-left','chevron-right','circle-arrow-up','circle-arrow-down','circle-arrow-left','circle-arrow-right'],
  'Actions': ['pencil','trash-2','search','download','upload','copy','link','external-link','refresh-cw','rotate-ccw','settings','sliders-horizontal','play','pause','power','ellipsis'],
  'Security': ['lock','lock-open','key-round','shield','shield-check','shield-alert','shield-plus','shield-minus','shield-x','shield-ban','eye','eye-off'],
  'People & messages': ['user','user-plus','user-minus','user-check','user-x','users','mail','message-circle','message-square','bell','bell-off','at-sign'],
  'Symbols': ['clock','calendar','pin','map-pin','zap','sparkles','flame','sun','moon','cloud','hash','percent','asterisk','dollar-sign','equal','infinity']
};
const modifierCategory=ref('All modifiers'),catalogPage=ref(0),catalogPageSize=ref(24);
const modifiers=Object.values(modifierGroups).flat();
const filtered = computed(() => Object.keys(icons).filter(n => (tab.value !== 'modifiers' || modifiers.includes(n)) && n.includes(search.value.toLowerCase().trim()) && (tab.value!=='modifiers'||modifierCategory.value==='All modifiers'||modifierGroups[modifierCategory.value]?.includes(n)) && (tab.value==='modifiers'||category.value === 'All icons' || n.includes(category.value.toLowerCase()))).sort());
const catalogPages=computed(()=>Math.max(1,Math.ceil(filtered.value.length/catalogPageSize.value)));
const visibleIcons=computed(()=>filtered.value.slice(catalogPage.value*catalogPageSize.value,(catalogPage.value+1)*catalogPageSize.value));
watch([search,tab,category,modifierCategory,catalogPageSize],()=>catalogPage.value=0);
watch([catalogPage,catalogPageSize,search,tab,category,modifierCategory],async()=>{await nextTick();root.value?.querySelector('.icon-grid')?.scrollTo({top:0});});
function catalogPageBy(delta:number) {catalogPage.value=Math.max(0,Math.min(catalogPages.value-1,catalogPage.value+delta));}
const draftCoordinate=ref({x:12,y:12});
function addDraftPoint() {if(draftPoints.value.length>=64){notify('Maximum 64 points');return;}draftPoints.value.push({...draftCoordinate.value});}
function stampBrush() {if(!canErase()||!active.value)return;remember();(active.value.erasures??=[]).push({type:'brush',action:eraseTool.value==='restore'?'restore':'erase',size:brushSize.value/active.value.scale,points:[{x:exactRect.value.x,y:exactRect.value.y}]});notify('Brush applied');}
function focusCanvas() {root.value?.querySelector<SVGSVGElement>('.composition')?.focus();}
function closeBackground(event:KeyboardEvent) {const details=event.currentTarget as HTMLDetailsElement;details.open=false;details.querySelector('summary')?.focus();event.stopPropagation();}
async function toggleExport() {exportOpen.value=!exportOpen.value;if(exportOpen.value){await nextTick();root.value?.querySelector<HTMLButtonElement>('.export-menu button')?.focus();}}
function closeExport() {exportOpen.value=false;root.value?.querySelector<HTMLButtonElement>('[part="button export-button"]')?.focus();}
const snapshot = () => JSON.stringify({version:1,name:name.value,stroke:stroke.value,palette:palette.value,layers:layers.value});
function restore(raw:string) { resetEditingTools();pen.value=false; editNodes.value=false; const data = JSON.parse(raw); layers.value = data.layers; name.value = data.name; stroke.value=data.stroke; palette.value=data.palette?{...data.palette}:{}; selected.value = layers.value.at(-1)?.id || ''; }
function remember() { history.value.push(snapshot()); if(history.value.length>100) history.value.shift(); future.value=[]; }
function undo() { if(!history.value.length)return; future.value.push(snapshot()); restore(history.value.pop()!); }
function redo() { if(!future.value.length)return; history.value.push(snapshot()); restore(future.value.pop()!); }
function add(icon:string) { if(!canAdd())return; remember(); const item=layer(icon,tab.value==='modifiers'?{x:6,y:6,scale:.45,mode:'space'}:{}); layers.value.push(item); selected.value=item.id; }
function update(key:keyof Layer,value:Layer[keyof Layer]) { if(!active.value)return; remember(); Object.assign(active.value,{[key]:value}); }
function themeColor() {
  const canvas=document.createElement('canvas').getContext('2d');
  if(!canvas||!root.value)return '';
  canvas.fillStyle=getComputedStyle(root.value).getPropertyValue('--ic-icon-color').trim()||getComputedStyle(root.value).color;
  return String(canvas.fillStyle);
}
function setColorScope(channel:ColorChannel, shared:boolean) {
  if(!active.value)return;
  const current=colorStyle(active.value,palette.value,channel);
  remember();active.value[`${channel}ColorScope`]=shared?'shared':'layer';
  if(shared){delete active.value[`${channel}Color`];delete active.value[`${channel}Opacity`];}
  else {active.value[`${channel}Color`]=current.color;active.value[`${channel}Opacity`]=current.opacity;}
}
function setColor(channel:ColorChannel,value:string) {
  if(value!=='currentColor'&&!/^#[0-9a-f]{6}$/i.test(value)||!active.value)return;
  remember();
  if(isSharedColor(active.value,channel))palette.value[`${channel}Color`]=value;
  else active.value[`${channel}Color`]=value;
}
function setOpacity(channel:ColorChannel, percent:number, record=true) {
  if(!active.value)return;if(record)remember();
  const opacity=Math.max(0,Math.min(100,percent))/100;
  if(isSharedColor(active.value,channel))palette.value[`${channel}Opacity`]=opacity;
  else active.value[`${channel}Opacity`]=opacity;
}
function pickerColor(value?:string) { return value && value!=='currentColor'?value:themeColor(); }
function changeStrokeWidth(value:number, record=true) {
  if(!active.value)return;
  const shared=active.value.strokeWidth===undefined;
  const width=Math.max(shared?.5:.1,Math.min(shared?4:8,value));
  if(record)remember();
  if(shared)stroke.value=width;else active.value.strokeWidth=width;
}
function shareStrokeWidth() {
  remember();
  for (const item of layers.value) delete item.strokeWidth;
}
const customStrokeCount = computed(() => layers.value.filter(item => item.kind !== 'text' && item.strokeWidth !== undefined).length);
function remove() { if(!active.value)return; remember(); layers.value=layers.value.filter(l=>l.id!==selected.value); selected.value=layers.value.at(-1)?.id || '';nextTick(()=>{const button=root.value?.querySelector<HTMLButtonElement>('.layer-select[aria-pressed=true]');if(button)button.focus();else focusCanvas();}); }
function duplicate() { if(!active.value||!canAdd())return; remember(); const item={...JSON.parse(JSON.stringify(active.value)),id:crypto.randomUUID()}; layers.value.push(item); selected.value=item.id; }
function reorder(index:number, delta:number) { if(index+delta<0 || index+delta>=layers.value.length)return; remember(); const item=layers.value.splice(index,1)[0]; layers.value.splice(index+delta,0,item); }
function canAdd(count=1) { if(layers.value.length+count>100){notify('Maximum 100 layers');return false;}return true; }
function insert(item:Layer) { if(!canAdd())return;remember();pen.value=false;editNodes.value=false;layers.value.push(item);selected.value=item.id; }
function addText() { if(!supportedText(draftText.value)){notify('Use up to 12 Latin letters, numbers, or punctuation');return;}insert(layer('',{kind:'text',text:draftText.value,font:'sans-700',fontSize:6,spacing:0,align:'center',mode:'space',gap:.6})); }
function setText(value:string) { if(!supportedText(value,active.value?.font)){notify('This character is not supported by the bundled font');return;}if(active.value)active.value.text=value; }
function addShape(shape:string) { insert(layer('',{kind:'shape',shape,width:16,height:16,radius:0,paint:'stroke'})); }
function blank() { remember();layers.value=[];selected.value='';name.value='custom-icon';palette.value={};pen.value=false;editNodes.value=false;tab.value='create'; }
function beginPath() { if(!canAdd())return;resetEditingTools();pen.value=true;editNodes.value=false;draftPoints.value=[];nextTick(focusCanvas); }
function finishPath(closed=false) {
  if(draftPoints.value.length<2){notify('Place at least two points on the canvas');return;}
  insert(layer('',{kind:'path',points:JSON.parse(JSON.stringify(draftPoints.value)),closed,paint:'stroke'}));editNodes.value=true;selectedNode.value=0;
}
function toggleCurve() {
  const points=editablePoints.value;if(!points||selectedNode.value===0)return;
  remember();const point=points[selectedNode.value];
  if(point.cx!==undefined||point.c1x!==undefined){for(const k of ['cx','cy','c1x','c1y','c2x','c2y'] as const)delete point[k];}
  else {const previous=points[selectedNode.value-1];point.cx=(previous.x+point.x)/2;point.cy=(previous.y+point.y)/2-3;}
}
function removeNode() { const points=editablePoints.value;if(!points||points.length<=2)return;remember();points.splice(selectedNode.value,1);for(const key of ['cx','cy','c1x','c1y','c2x','c2y'] as const)delete points[0][key];selectedNode.value=Math.max(0,selectedNode.value-1); }
function addNode() { const points=editablePoints.value;if(!points||points.length>=(active.value?.kind==='vector'?512:64))return;remember();const i=Math.min(selectedNode.value,points.length-2);splitSegment(points,i);selectedNode.value=i+1; }
function editIconPaths() {
  if(!active.value)return;
  try {const paths=iconToPaths(icons[active.value.icon]);remember();active.value.kind='vector';active.value.paths=paths;active.value.paint='stroke';resetEditingTools();editNodes.value=true;propertyTab.value='edit';}
  catch {notify('This icon could not be converted to editable paths');}
}
function togglePointEditing() { resetEditingTools();pen.value=false;editNodes.value=!editNodes.value; }
function setAnchor(key:'x'|'y',value:number) { const points=editablePoints.value;if(!points||!node.value)return;remember();moveAnchor(points,selectedNode.value,key==='x'?value:node.value.x,key==='y'?value:node.value.y); }
function setHandle(key:'c1x'|'c1y'|'c2x'|'c2y',value:number) {if(node.value){remember();node.value[key]=Math.max(-256,Math.min(256,value));}}
function setEraseTool(tool:'move'|'erase'|'restore') {eraseTool.value=tool;pen.value=false;editNodes.value=false;brushCursor.value=undefined;}
function canErase() {if(!active.value)return false;if((active.value.erasures?.length||0)>=256){notify('Maximum 256 eraser edits. Reset erasing to begin again.');return false;}return true;}
function applyExactRectangle() {
  if(!canErase()||!active.value)return;remember();
  (active.value.erasures??=[]).push({type:'rect',action:eraseTool.value==='restore'?'restore':'erase',...exactRect.value});
}
function resetErasing() {if(!active.value)return;remember();delete active.value.erasures;}
function removeSubpath() {if(active.value?.kind!=='vector'||!active.value.paths||active.value.paths.length<=1)return;remember();active.value.paths.splice(selectedPath.value,1);selectedPath.value=Math.max(0,selectedPath.value-1);selectedNode.value=0;}
function setPathClosed(value:boolean) {if(!active.value)return;remember();if(active.value.kind==='vector'&&active.value.paths)active.value.paths[selectedPath.value].closed=value;else active.value.closed=value;}
const activeTransform = computed(()=>{const l=active.value;if(!l)return '';return `translate(${l.x} ${l.y}) translate(12 12) rotate(${l.rotation}) scale(${l.scale*(l.flip?-1:1)} ${l.scale}) translate(-12 -12)`;});
function notify(text:string) { notice.value='';nextTick(()=>notice.value=text); }
const markup = computed(()=>renderLayers(layers.value,icons,stroke.value,maskId('main'),palette.value));
function deliver(blob: Blob, filename: string, format: IconExport['format'], content?: string) {
  emit('icon-export', { blob, filename, format, content });
  if (props.downloads) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  closeExport();
  notify(props.downloads ? `${filename} exported` : `${filename} ready`);
}
function download(content:string,filename:string,type:string) {
  deliver(new Blob([content], {type}), filename, filename.endsWith('.vue') ? 'vue' : filename.endsWith('.json') ? 'json' : 'svg', content);
}
const safeName = computed(()=>name.value.replace(/[^a-zA-Z0-9_-]/g,'-') || 'custom-icon');
function exportSvg() { download(svgDocument(layers.value,icons,stroke.value,name.value,palette.value),`${safeName.value}.svg`,'image/svg+xml'); }
function exportVue() { download(vueDocument(layers.value,icons,stroke.value,palette.value),`${safeName.value}.vue`,'text/plain'); }
async function exportPng() {
  const color = root.value ? getComputedStyle(root.value).getPropertyValue('--ic-icon-color').trim() || getComputedStyle(root.value).color : 'currentColor';
  const svg = svgDocument(layers.value, icons, stroke.value, name.value, palette.value)
    .replace('width="24" height="24"', 'width="512" height="512"')
    .replaceAll('currentColor', color);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], {type:'image/svg+xml'}));
  const fail = () => { URL.revokeObjectURL(url); notify('PNG export failed'); emit('composer-error', {message:'PNG export failed'}); };
  img.onload = () => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) { fail(); return; }
    context.drawImage(img,0,0);
    canvas.toBlob(blob => {
      URL.revokeObjectURL(url);
      if (blob) deliver(blob, `${safeName.value}.png`, 'png'); else fail();
    });
  };
  img.onerror = fail; img.src = url;
}
async function importFile(event:Event) { const file=(event.target as HTMLInputElement).files?.[0]; if(!file)return;try{if(file.size>1_000_000)throw Error();const data=JSON.parse(await file.text());if(!validComposition(data,icons))throw Error();remember();restore(JSON.stringify(data));notify('Composition opened');}catch{notify('Could not open this composition file');}(event.target as HTMLInputElement).value=''; }
let dragging: {x:number;y:number;startX:number;startY:number;element:SVGSVGElement;pointIndex?:number;control?:boolean|'c1'|'c2'}|undefined;
function canvasPosition(e:{clientX:number;clientY:number}, svg:SVGSVGElement, local=false, free=false) {
  const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
  if(local&&active.value){
    const l=active.value,r=-l.rotation*Math.PI/180,dx=point.x-l.x-12,dy=point.y-l.y-12;
    point.x=(dx*Math.cos(r)-dy*Math.sin(r))/(l.scale*(l.flip?-1:1))+12;
    point.y=(dx*Math.sin(r)+dy*Math.cos(r))/l.scale+12;
  }
  const quantize=(n:number)=>Math.max(free?-256:0,Math.min(free?256:24,!free&&snap.value?Math.round(n*2)/2:n));
  return {x:quantize(point.x),y:quantize(point.y)};
}
function startNode(e:PointerEvent,index:number,control:boolean|'c1'|'c2'=false) {
  if(!editablePoints.value)return;
  remember();selectedNode.value=index;const element=(e.currentTarget as SVGElement).ownerSVGElement!;element.setPointerCapture(e.pointerId);
  dragging={x:e.clientX,y:e.clientY,startX:0,startY:0,element,pointIndex:index,control};
}
function canvasClick(e:MouseEvent) {if(!pen.value||e.altKey||e.button!==0)return;if(draftPoints.value.length>=64){notify('Maximum 64 points');return;}draftPoints.value.push(canvasPosition(e,e.currentTarget as SVGSVGElement));}
function pointerDown(e:PointerEvent) {
  const element=e.currentTarget as SVGSVGElement;
  if(e.button!==0||pen.value)return;
  if(!active.value)return;
  if(eraseTool.value!=='move') {
    if(!canErase())return;
    const start=canvasPosition(e,element,true,true);remember();
    const edits=active.value.erasures??=[];
    const edit:Erasure=eraseMethod.value==='brush'?{type:'brush',action:eraseTool.value,size:Math.max(.01,Math.min(128,brushSize.value/active.value.scale)),points:[start]}:{type:'rect',action:eraseTool.value,x:start.x,y:start.y,width:0,height:0};
    eraserDrag={index:edits.length,start};edits.push(edit);element.setPointerCapture(e.pointerId);element.focus();return;
  }
  remember();element.focus();element.setPointerCapture(e.pointerId);
  dragging={x:e.clientX,y:e.clientY,startX:active.value.x,startY:active.value.y,element};
}
function pointerMove(e:PointerEvent) {
  if(active.value&&eraseTool.value!=='move') {
    const svg=e.currentTarget as SVGSVGElement,pos=canvasPosition(e,svg,true,true);brushCursor.value=pos;
    if(eraserDrag){const edit=active.value.erasures?.[eraserDrag.index];if(edit?.type==='brush'&&edit.points.length<2048){const last=edit.points.at(-1)!;if(Math.hypot(last.x-pos.x,last.y-pos.y)>.03)edit.points.push(pos);}else if(edit?.type==='rect'){edit.x=Math.min(pos.x,eraserDrag.start.x);edit.y=Math.min(pos.y,eraserDrag.start.y);edit.width=Math.abs(pos.x-eraserDrag.start.x);edit.height=Math.abs(pos.y-eraserDrag.start.y);}}
    return;
  }
  if(!dragging||!active.value)return;
  if(dragging.pointIndex!==undefined&&editablePoints.value){
    const pos=canvasPosition(e,dragging.element,true,true),point=editablePoints.value[dragging.pointIndex];
    if(dragging.control==='c1'){point.c1x=pos.x;point.c1y=pos.y;}
    else if(dragging.control==='c2'){point.c2x=pos.x;point.c2y=pos.y;}
    else if(dragging.control){point.cx=pos.x;point.cy=pos.y;}
    else moveAnchor(editablePoints.value,dragging.pointIndex,pos.x,pos.y);return;
  }
  const factor=24/dragging.element.getBoundingClientRect().width;
  const move=(v:number)=>Math.max(-24,Math.min(24,snap.value?Math.round(v*2)/2:v));
  active.value.x=move(dragging.startX+(e.clientX-dragging.x)*factor);active.value.y=move(dragging.startY+(e.clientY-dragging.y)*factor);
}
function cancelCanvasGesture() {if(dragging||eraserDrag)undo();dragging=undefined;eraserDrag=undefined;}
function keyboard(e:KeyboardEvent) {
  if(e.key==='Escape' && exportOpen.value){e.preventDefault();closeExport();return;}
  const target=e.target as HTMLElement;
  if(target.closest('input,select,textarea,[contenteditable="true"]'))return;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.stopPropagation();e.shiftKey?redo():undo();return;}
  if(!target.matches('.composition'))return;
  if(e.key==='Escape'){e.preventDefault();cancelCanvasGesture();pen.value=false;setEraseTool('move');return;}
  if(pen.value&&e.key==='Enter'){e.preventDefault();finishPath();return;}
  if(pen.value&&e.key===' '){e.preventDefault();addDraftPoint();return;}
  if(pen.value&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    e.preventDefault();const key=e.key==='ArrowLeft'||e.key==='ArrowRight'?'x':'y';
    draftCoordinate.value[key]=Math.max(0,Math.min(24,draftCoordinate.value[key]+(e.shiftKey?1:.5)*(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)));return;
  }
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();e.stopPropagation();remove();return;}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    e.preventDefault();e.stopPropagation();const key=['ArrowLeft','ArrowRight'].includes(e.key)?'x':'y';const direction=['ArrowLeft','ArrowUp'].includes(e.key)?-1:1;
    if(e.altKey){pan.value[key]+=direction*20;return;}
    if(active.value)update(key,Math.max(-24,Math.min(24,active.value[key]+(e.shiftKey?1:.25)*direction)));
  }
}
function acceptComposition(data: unknown) {
  if (!validComposition(data, icons)) { emit('composer-error', {message:'Invalid composition'}); return; }
  if (JSON.stringify(data) === snapshot()) return;
  restore(JSON.stringify(data)); history.value = []; future.value = [];
}
watch(() => props.composition, value => { if (value !== undefined) acceptComposition(value); }, {deep:true, immediate:true});
onMounted(() => {
  if (!props.storageKey || props.composition) return;
  try {
    const data = JSON.parse(localStorage.getItem(props.storageKey) || 'null');
    if (data && validComposition(data, icons)) restore(JSON.stringify(data));
  } catch { storageStatus.value = 'Storage unavailable'; }
});
watch([layers,name,stroke,palette], () => {
  const value = JSON.parse(snapshot()) as Composition;
  emit('composition-change', value);
  if (!props.storageKey) return;
  try { localStorage.setItem(props.storageKey, JSON.stringify(value)); storageStatus.value = 'Saved on this device'; }
  catch { storageStatus.value = 'Storage unavailable'; }
}, {deep:true});
</script>

<template>
<div ref="root" class="app" part="root" @keydown="keyboard" :class="{ 'dark-preview': dark }">
  <nav class="skip-links" aria-label="Editor shortcuts"><button @click="focusCanvas">Skip to canvas</button><button @click="root?.querySelector<HTMLElement>('.inspector')?.focus()">Skip to layer controls</button></nav>
  <header part="header"><slot name="brand"><a class="brand" href="#"><span class="brand-icon"><Layers /></span>icon<span class="brand-light">composer</span><span class="beta">BETA</span></a></slot><div class="header-right"><slot name="toolbar"></slot><button class="button quiet" @click="blank">New icon</button><span v-if="storageStatus" class="saved"><span></span>{{ storageStatus }}</span><label class="button quiet file-open" part="button open-button"><Upload/> Open<input class="file-input" type="file" accept=".json" aria-label="Open composition" @change="importFile"/></label><div class="export-wrap" @focusout="($event.relatedTarget && !($event.currentTarget as HTMLElement).contains($event.relatedTarget as Node)) && (exportOpen=false)"><button class="button primary" part="button export-button" :aria-expanded="exportOpen" :aria-controls="maskId('export-options')" @click="toggleExport"><Download/> Export icon <ChevronDown/></button><div v-if="exportOpen" class="export-menu" part="export-menu" :id="maskId('export-options')" role="group" aria-label="Export formats"><button @click="exportSvg">Download SVG <span>.svg</span></button><button @click="exportVue">Vue component <span>.vue</span></button><button @click="exportPng">Transparent PNG <span>512px</span></button><button @click="download(snapshot(),`${safeName}.json`,'application/json')">Editable composition <span>.json</span></button></div></div></div></header>
  <div v-if="chrome" class="intro" part="intro"><div><div class="eyebrow">A LITTLE MIX. A NEW MEANING.</div><h1>Make an icon of your own.</h1><p>Combine icons, add labels, or draw something entirely your own.</p></div><span class="intro-note"><Sparkles/> Same strokes. New possibilities.</span></div>
  <main class="workspace" part="workspace" :inert="exportOpen">
    <aside class="library" part="library" aria-label="Toolbox">
      <div class="panel-heading"><h2>Toolbox</h2><span>BUILD &amp; COMBINE</span></div>
      <div class="creation-modes" role="group" aria-label="Choose how to build">
        <button class="creation-mode" :class="{active:tab==='create'}" :aria-pressed="tab==='create'" @click="blank"><PenTool/><span><strong>Create from scratch</strong><small>Draw, shape, and add text</small></span></button>
        <button class="creation-mode" :class="{active:tab!=='create'}" :aria-pressed="tab!=='create'" @click="tab='icons'"><Search/><span><strong>Browse icons</strong><small>{{Object.keys(icons).length.toLocaleString()}} icons &amp; modifiers</small></span></button>
      </div>
      <div class="library-panels">
        <div class="library-panel" :class="{'inactive-panel':tab==='create'}" :inert="tab==='create'" :aria-hidden="tab==='create'">
          <div class="tabs" role="group" aria-label="Catalog type"><button :aria-pressed="tab==='icons'" :class="{active:tab==='icons'}" @click="tab='icons'">Icons</button><button :aria-pressed="tab==='modifiers'" :class="{active:tab==='modifiers'}" @click="tab='modifiers'">Modifiers</button></div>
          <label class="search"><Search/><input v-model="search" placeholder="Search icons…" aria-label="Search icons"/><button v-if="search" @click="search=''" aria-label="Clear search"><X/></button></label><select v-if="tab!=='modifiers'" v-model="category" aria-label="Icon category"><option>All icons</option><option>Arrow</option><option>File</option><option>Circle</option><option>User</option><option>Square</option></select><select v-else v-model="modifierCategory" aria-label="Modifier category"><option>All modifiers</option><option v-for="(_,group) in modifierGroups" :key="group">{{group}}</option></select><label class="catalog-size">Icons per page<select v-model.number="catalogPageSize"><option :value="24">24</option><option :value="48">48</option><option :value="96">96</option></select></label><div class="icon-grid" :class="{expanded:tab==='modifiers'}" tabindex="0" role="region" aria-label="Icon catalog"><button v-for="icon in visibleIcons" :key="icon" :title="`Add ${icon}`" :aria-label="`Add ${icon}`" @click="add(icon)"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" v-html="icons[icon]"/></button><p v-if="!filtered.length" class="empty">No icons found. Try another search.</p></div><nav class="catalog-pages" aria-label="Catalog pages"><button :disabled="catalogPage===0" @click="catalogPageBy(-1)">Previous</button><span role="status">{{catalogPage+1}} / {{catalogPages}} · {{filtered.length}} icons</span><button :disabled="catalogPage+1>=catalogPages" @click="catalogPageBy(1)">Next</button></nav><div class="library-footer"><Plus/> Choose an icon to add a layer</div></div>
      <div class="create-panel library-panel" :class="{'inactive-panel':tab!=='create'}" :inert="tab!=='create'" :aria-hidden="tab!=='create'" part="create-panel" tabindex="0" role="region" aria-label="Authoring tools">

        <section class="authoring-section"><div class="authoring-heading"><PenTool/><h3>Draw</h3></div><button class="draw-action" @click="beginPath"><span>Draw a custom path</span><ArrowUpRight/></button><p class="help">Place points, then refine lines and curves. On the canvas, arrow keys position the next point, Space adds it, and Enter finishes.</p><div v-if="pen" class="keyboard-drawing"><div class="field-pair"><label class="editor-field">Next point X<input type="number" min="0" max="24" step=".5" v-model.number="draftCoordinate.x" @change="draftCoordinate.x=Math.max(0,Math.min(24,draftCoordinate.x||0))"/></label><label class="editor-field">Next point Y<input type="number" min="0" max="24" step=".5" v-model.number="draftCoordinate.y" @change="draftCoordinate.y=Math.max(0,Math.min(24,draftCoordinate.y||0))"/></label></div><button class="button quiet wide" @click="addDraftPoint">Add point to drawing</button><p role="status">{{draftPoints.length}} points. Next: {{draftCoordinate.x}}, {{draftCoordinate.y}}</p></div></section>
        <section class="authoring-section"><div class="authoring-heading"><Square/><h3>Shapes</h3></div><div class="shape-picker"><button v-for="shape in shapeNames" :key="shape" :aria-label="`Add ${shape}`" @click="addShape(shape)"><component :is="shapeIcons[shape as keyof typeof shapeIcons]"/><span>{{shape}}</span></button></div></section>
        <section class="authoring-section"><div class="authoring-heading"><Type/><h3>Text &amp; numbers</h3></div><label class="editor-field">Your text<input v-model="draftText" maxlength="12" aria-label="Your text" @input="draftText=[...draftText].filter(c=>supportedText(c)).join('')"/></label><button class="button quiet wide" @click="addText"><Plus/> Add text layer</button></section>

      </div></div></aside>
    <section class="stage" part="stage" aria-label="Icon canvas">
      <div class="stage-toolbar" part="canvas-toolbar">
        <div class="canvas-identity">
          <div class="document-preview" aria-hidden="true"><svg viewBox="0 0 24 24" v-html="renderLayers(layers,icons,stroke,maskId('header'),palette)"/></div>
          <div class="document-details">
            <label class="name-field" part="name-field"><span class="name-caption">Icon name</span><span class="name-input-wrap"><input :value="name" aria-label="Icon name" title="Edit icon name" placeholder="Name your icon" maxlength="100" @focus="remember" @input="name=($event.target as HTMLInputElement).value"/><Pencil aria-hidden="true"/></span></label>
            <span class="document-meta">24 × 24 <span>·</span> Vector icon</span>
          </div>
        </div>
        <div class="tool-group">
          <div class="history-controls" role="group" aria-label="History"><button :disabled="!history.length" aria-label="Undo" title="Undo (⌘Z)" @click="undo"><Undo2/></button><button :disabled="!future.length" aria-label="Redo" title="Redo" @click="redo"><Redo2/></button></div>
          <i aria-hidden="true"></i>
          <div class="zoom-controls" role="group" aria-label="Canvas zoom"><button :disabled="zoom<=25" aria-label="Zoom out" title="Zoom out" @click="setZoom(zoom-25)"><Minus/></button><output aria-label="Zoom level">{{zoom}}%</output><button :disabled="zoom>=400" aria-label="Zoom in" title="Zoom in" @click="setZoom(zoom+25)"><Plus/></button><button aria-label="Fit canvas" title="Reset zoom and pan" @click="fitCanvas">Fit</button></div>
          <i aria-hidden="true"></i>
          <button class="snap-toggle" :class="{enabled:snap}" role="switch" :aria-checked="snap" :aria-describedby="maskId('snap-help')" title="Aligns dragged layers and path points to half-unit steps. Turn off for free positioning." @click="snap=!snap"><Magnet aria-hidden="true"/><span>Snap to grid</span></button><span class="visually-hidden" :id="maskId('snap-help')">Aligns dragged layers and path points to half-unit steps on the 24 by 24 canvas. Turn off for free positioning.</span>
          <details class="canvas-background-control" @focusout="($event.relatedTarget && !($event.currentTarget as HTMLElement).contains($event.relatedTarget as Node)) && (($event.currentTarget as HTMLDetailsElement).open=false)" @keydown.esc.prevent="closeBackground"><summary title="Set the canvas preview background"><span class="background-swatch" :style="{backgroundColor:backgroundPicker}"></span>Background</summary><div class="background-popover" part="background-controls"><label class="editor-field">Canvas background color ({{dark?'dark':'light'}} preview)<input type="color" :value="backgroundPicker" aria-label="Canvas background color" @input="setCanvasBackground(($event.target as HTMLInputElement).value)"/></label><input class="hex-color" pattern="#[0-9a-fA-F]{6}" title="Enter a six-digit hex color, for example #20744f. Empty uses the theme color." aria-description="Enter a hash followed by six hexadecimal digits. Empty uses the theme color." :value="activeBackground||''" :placeholder="backgroundPicker" aria-label="Canvas background hex color" @input="setCanvasBackground(($event.target as HTMLInputElement).value)"/><button class="button quiet wide" @click="resetCanvasBackground">Reset to theme</button><p class="help">Preview only. Exports keep their transparent background.</p></div></details>
          <div class="view-controls" role="group" aria-label="Canvas appearance"><button :class="{enabled:grid}" :aria-pressed="grid" aria-label="Toggle grid" title="Toggle grid" @click="grid=!grid"><Grid2X2/></button><button :aria-pressed="dark" aria-label="Toggle dark preview" title="Toggle dark preview" @click="dark=!dark"><Sun v-if="dark"/><Moon v-else/></button></div>
        </div>
      </div>
      <div class="canvas-area" part="canvas" :class="{gridded:grid}" :style="{'--ic-preview-background':activeBackground}" @pointerdown.capture="viewportDown" @pointermove.capture="viewportMove" @pointerup.capture="viewportUp" @pointercancel.capture="viewportUp" @wheel="zoomWheel"><div class="artboard" part="artboard" :style="{transform:`translate(${pan.x}px, ${pan.y}px) scale(${zoom/100})`}"><span class="artboard-label" aria-hidden="true">24 × 24 <span>Export area</span></span><svg class="composition" :class="{erasing:eraseTool!=='move'}" part="composition" tabindex="0" viewBox="0 0 24 24" role="group" :aria-label="pen?'Drawing path':'Icon composition'" :aria-describedby="maskId('canvas-help')" @click="canvasClick" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="dragging=undefined;eraserDrag=undefined" @pointercancel="cancelCanvasGesture" @pointerleave="brushCursor=undefined">
          <g v-html="markup" aria-hidden="true"/>
          <g v-if="pen" class="path-guides" aria-hidden="true"><circle :cx="draftCoordinate.x" :cy="draftCoordinate.y" r=".4" class="chosen"/><path :d="pathData(draftPoints,false)"/><circle v-for="(point,i) in draftPoints" :key="i" :cx="point.x" :cy="point.y" r=".3"/></g>
          <g v-if="editNodes && (active?.kind==='path'||active?.kind==='vector') && !pen" :transform="activeTransform" class="path-guides">
            <template v-for="(point,i) in editablePoints" :key="i">
              <path v-if="point.cx!==undefined" :d="`M${point.x} ${point.y}L${point.cx} ${point.cy}`"/>
              <circle v-if="point.cx!==undefined" :cx="point.cx" :cy="point.cy" r=".35" class="control-point" @pointerdown.stop="startNode($event,i,true)"/>
              <template v-if="point.c1x!==undefined">
                <path :d="`M${editablePoints?.[i-1]?.x} ${editablePoints?.[i-1]?.y}L${point.c1x} ${point.c1y}M${point.x} ${point.y}L${point.c2x} ${point.c2y}`"/>
                <circle :cx="point.c1x" :cy="point.c1y" r=".35" class="control-point" @pointerdown.stop="startNode($event,i,'c1')"/>
                <circle :cx="point.c2x" :cy="point.c2y" r=".35" class="control-point" @pointerdown.stop="startNode($event,i,'c2')"/>
              </template>
              <circle :cx="point.x" :cy="point.y" r=".45" :class="{chosen:selectedNode===i}" @pointerdown.stop="startNode($event,i)"/>
            </template>
          </g>
          <g v-if="active && eraseTool!=='move' && brushCursor && eraseMethod==='brush'" :transform="activeTransform" class="path-guides" pointer-events="none"><circle :cx="brushCursor.x" :cy="brushCursor.y" :r="brushSize/active.scale/2" class="eraser-cursor"/></g>
        </svg></div><span class="visually-hidden" :id="maskId('canvas-help')">24 by 24 export area. Arrow keys move the selected layer; Shift moves in larger steps. Alt and arrows pan. Delete removes the selected layer. Use Transform for exact positioning, Edit for path points and erasing, and the drawing coordinate fields to create paths without dragging.</span><div class="canvas-tip" v-if="!pen">{{eraseTool!=='move'?(eraseTool==='erase'?'Erase selected layer · Esc to move':'Restore selected layer · Esc to move'):editNodes?'Drag points or curve handles':'Drag to position · Alt + drag to pan'}}</div><div v-else class="pen-actions"><span>{{draftPoints.length}} points</span><button :disabled="draftPoints.length<2" @click="finishPath()">Finish path</button><button :disabled="draftPoints.length<3" @click="finishPath(true)">Close path</button><button @click="pen=false">Cancel</button></div></div>
      <div class="preview-strip" part="previews" aria-hidden="true"><span class="eyebrow">THE SMALL PICTURE</span><div class="previews"><div v-for="size in [16,20,24,32,48]" :key="size"><div class="preview-icon"><svg :width="size" :height="size" viewBox="0 0 24 24" v-html="renderLayers(layers,icons,stroke,maskId(`preview-${size}`),palette)"/></div><span>{{size}} px</span></div><div class="inverse"><div class="preview-icon"><svg width="24" height="24" viewBox="0 0 24 24" v-html="renderLayers(layers,icons,stroke,maskId('inverse'),palette)"/></div><span>on dark</span></div></div></div>

    </section>
    <aside class="inspector" part="inspector" tabindex="-1" aria-label="Layer controls"><div class="panel-heading"><h2>Layers</h2><span>{{ layers.length }} layers</span></div><p class="panel-hint">A new perspective, one layer at a time.</p><div class="layer-list" tabindex="0" role="region" aria-label="Icon layers"><div v-for="(item,reverseIndex) in [...layers].reverse()" :key="item.id" class="layer-row" part="layer" :class="{selected:selected===item.id}" @click="selected=item.id;editNodes=false"><button class="layer-select" :aria-pressed="selected===item.id" @click.stop="selected=item.id;editNodes=false"><div class="layer-thumb" aria-hidden="true"><svg viewBox="0 0 24 24" v-html="drawLayer({...item,x:0,y:0,rotation:0,scale:1},icons,stroke,'currentColor',0,palette,maskId('thumb-'+item.id))"/></div><div class="layer-text"><strong>{{layerLabel(item)}}</strong><small>{{item.mode==='space'?'Clear space':item.mode==='cutout'?'Cut out':'Overlay'}}</small></div></button><button :aria-label="item.visible?'Hide layer':'Show layer'" @click.stop="selected=item.id;update('visible',!item.visible)"><Eye v-if="item.visible"/><EyeOff v-else/></button><div class="reorder"><button aria-label="Move layer up" :disabled="reverseIndex===0" @click.stop="reorder(layers.length-1-reverseIndex,1)"><ChevronUp/></button><button aria-label="Move layer down" :disabled="reverseIndex===layers.length-1" @click.stop="reorder(layers.length-1-reverseIndex,-1)"><ChevronDown/></button></div></div><div v-if="!layers.length" class="empty">Your canvas is ready.<br/>Choose an icon to begin.</div></div>
      <div class="layer-actions"><button :disabled="!active" @click="duplicate"><Copy/> Duplicate</button><button :disabled="!active" @click="remove"><Trash2/> Remove</button></div>
      <div v-if="active" class="properties"><div class="property-heading"><h3>Layer properties</h3><button title="Reset transform" aria-label="Reset transform" @click="remember();Object.assign(active,{x:0,y:0,scale:1,rotation:0,flip:false})"><RotateCcw/></button></div><div class="property-tabs" role="tablist" aria-label="Layer controls" part="property-tabs" @keydown="propertyTabKey"><button v-for="key in propertyTabs" :key="key" role="tab" :id="maskId('tab-'+key)" :aria-selected="propertyTab===key" :aria-controls="maskId('panel-'+key)" :tabindex="propertyTab===key?0:-1" :class="{active:propertyTab===key}" @click="propertyTab=key">{{key==='edit'?'Edit':key==='style'?'Style':'Transform'}}</button></div><div class="property-body" part="property-body">
        <section :class="{'inactive-panel':propertyTab!=='edit'}" :inert="propertyTab!=='edit'" :aria-hidden="propertyTab!=='edit'" role="tabpanel" :id="maskId('panel-edit')" :aria-labelledby="maskId('tab-edit')" tabindex="0"><div class="blend-controls"><label class="field-label">Blend mode</label><div class="blend-options" role="group" aria-label="Blend mode"><button v-for="mode in ['overlay','space','cutout']" :key="mode" :class="{active:active.mode===mode}" :aria-pressed="active.mode===mode" @click="update('mode',mode)">{{mode==='overlay'?'Overlay':mode==='space'?'Clear space':'Cut out'}}</button></div><p class="blend-help">{{active.mode==='space'?'Adds a transparent gap around this layer.':active.mode==='cutout'?'Erases this shape from the layers below.':'Draws this icon over the layers below.'}}</p>
        <div v-if="active.mode==='space'" class="slider-field"><label>Clearance <span>{{active.gap}} px</span></label><input aria-label="Clearance" type="range" min="0" max="4" step="0.1" :value="active.gap" @pointerdown="remember" @input="active.gap=Number(($event.target as HTMLInputElement).value)" @keydown="remember"/></div>
        </div><div class="field-label">Editing tools</div><div class="stroke-mode-switch" role="group" aria-label="Edit tools"><button :class="{active:editPanel==='geometry'}" :aria-pressed="editPanel==='geometry'" @click="editPanel='geometry';setEraseTool('move')">Geometry</button><button :class="{active:editPanel==='eraser'}" :aria-pressed="editPanel==='eraser'" @click="editPanel='eraser';setEraseTool('erase')">Erase / restore</button></div><div class="edit-tool-panels"><div :class="{'inactive-panel':editPanel!=='geometry'}" :inert="editPanel!=='geometry'" :aria-hidden="editPanel!=='geometry'">

        <div v-if="!active.kind||active.kind==='icon'" class="type-properties"><button class="button quiet wide" @click="editIconPaths">Edit icon paths</button><p class="help">Convert to editable anchors and curves. Undo restores the original.</p></div><div v-if="active.kind==='text'" class="type-properties" part="text-controls">
          <label class="editor-field">Text<input :value="active.text" maxlength="12" aria-label="Layer text" @focus="remember" @input="setText(($event.target as HTMLInputElement).value)"/></label>
          <label class="editor-field">Font<select :value="active.font" aria-label="Text font" @change="update('font',($event.target as HTMLSelectElement).value)"><option v-for="(font,key) in fonts" :key="key" :value="key">{{font.label}}</option></select></label>
          <div class="field-pair"><label class="editor-field">Font size<input type="number" min="1" max="20" step=".5" :value="active.fontSize" aria-label="Font size" @input="update('fontSize',Math.max(1,Math.min(20,Number(($event.target as HTMLInputElement).value))))"/></label><label class="editor-field">Spacing<input type="number" min="-1" max="3" step=".1" :value="active.spacing" aria-label="Spacing between letters" @input="update('spacing',Math.max(-1,Math.min(3,Number(($event.target as HTMLInputElement).value))))"/></label></div>
          <label class="editor-field">Alignment<select :value="active.align" aria-label="Text alignment" @change="update('align',($event.target as HTMLSelectElement).value as Layer['align'])"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label><p class="help">Latin letters, numbers &amp; punctuation. Exported as vector outlines.</p>
        </div>
        <div v-if="active.kind==='shape'" class="type-properties" part="shape-controls">
          <div class="field-pair"><label class="editor-field">Width<input type="number" min=".1" max="48" step=".1" :value="active.width" aria-label="Shape width" @input="update('width',Math.max(.1,Math.min(48,Number(($event.target as HTMLInputElement).value))))"/></label><label class="editor-field">Height<input type="number" min=".1" max="48" step=".1" :value="active.height" aria-label="Shape height" @input="update('height',Math.max(.1,Math.min(48,Number(($event.target as HTMLInputElement).value))))"/></label></div>
          <label v-if="active.shape==='rectangle'" class="editor-field">Corner radius<input type="number" min="0" max="24" step=".1" :value="active.radius" aria-label="Corner radius" @input="update('radius',Math.max(0,Math.min(24,Number(($event.target as HTMLInputElement).value))))"/></label>
        </div>
        <div v-if="active.kind==='path'||active.kind==='vector'" class="type-properties" part="path-controls">
          <button class="button quiet wide" @click="togglePointEditing">{{editNodes?'Move whole path':'Edit path points'}}</button>
          <label class="check-field"><input type="checkbox" :checked="active.kind==='vector'?active.paths?.[selectedPath]?.closed:active.closed" @change="setPathClosed(($event.target as HTMLInputElement).checked)"/> Closed path</label>
          <label v-if="active.kind==='vector'" class="editor-field">Subpath<select v-model.number="selectedPath" aria-label="Selected icon subpath" @change="selectedNode=0"><option v-for="(_,i) in active.paths" :key="i" :value="i">Path {{i+1}}</option></select></label><button v-if="active.kind==='vector'" class="button quiet wide" :disabled="(active.paths?.length||0)<=1" @click="removeSubpath">Remove selected subpath</button><template v-if="editNodes && node">
            <label class="editor-field">Point<select v-model.number="selectedNode" aria-label="Selected path point"><option v-for="(_,i) in editablePoints" :value="i" :key="i">{{i+1}}</option></select></label>
            <div class="field-pair"><label class="editor-field">Point X<input type="number" min="-256" max="256" step=".25" :value="node.x" aria-label="Point X" @input="setAnchor('x',Math.max(-256,Math.min(256,Number(($event.target as HTMLInputElement).value))))"/></label><label class="editor-field">Point Y<input type="number" min="-256" max="256" step=".25" :value="node.y" aria-label="Point Y" @input="setAnchor('y',Math.max(-256,Math.min(256,Number(($event.target as HTMLInputElement).value))))"/></label></div>
            <button class="button quiet wide" :disabled="selectedNode===0" @click="toggleCurve">{{node.cx===undefined&&node.c1x===undefined?'Curve this segment':'Straighten segment'}}</button>
            <div v-if="node.cx!==undefined" class="field-pair"><label class="editor-field">Curve X<input type="number" min="-256" max="256" step=".25" :value="node.cx" aria-label="Curve X" @input="remember();node.cx=Math.max(0,Math.min(24,Number(($event.target as HTMLInputElement).value)))"/></label><label class="editor-field">Curve Y<input type="number" min="-256" max="256" step=".25" :value="node.cy" aria-label="Curve Y" @input="remember();node.cy=Math.max(0,Math.min(24,Number(($event.target as HTMLInputElement).value)))"/></label></div>
            <div v-if="node.c1x!==undefined" class="cubic-controls"><label v-for="key in (['c1x','c1y','c2x','c2y'] as const)" :key="key" class="editor-field">{{key}}<input type="number" min="-256" max="256" step=".25" :value="node[key]" :aria-label="`${key} curve handle`" @input="setHandle(key,Number(($event.target as HTMLInputElement).value))"/></label></div>
            <div class="field-pair"><button class="button quiet" :disabled="(editablePoints?.length||0)>=(active.kind==='vector'?512:64)" @click="addNode">Add point</button><button class="button quiet" :disabled="(editablePoints?.length||0)<=2" @click="removeNode">Delete point</button></div>
          </template>
        </div>
        </div><div :class="{'inactive-panel':editPanel!=='eraser'}" :inert="editPanel!=='eraser'" :aria-hidden="editPanel!=='eraser'"><section class="type-properties" part="eraser-controls"><h3>Erase selected layer</h3>
          <div class="stroke-mode-switch" role="group" aria-label="Layer editing tool"><button v-for="tool in (['move','erase','restore'] as const)" :key="tool" :class="{active:eraseTool===tool}" :aria-pressed="eraseTool===tool" @click="setEraseTool(tool)">{{tool==='move'?'Move':tool==='erase'?'Erase':'Restore'}}</button></div>
          <label class="editor-field">Eraser shape<select v-model="eraseMethod" aria-label="Eraser shape"><option value="brush">Brush</option><option value="rect">Rectangle</option></select></label>
          <div class="erase-settings"><div :class="{'inactive-panel':eraseMethod!=='brush'}" :inert="eraseMethod!=='brush'" :aria-hidden="eraseMethod!=='brush'"><label class="editor-field">Brush size (canvas units)<input type="number" min=".25" max="12" step=".25" v-model.number="brushSize" @change="brushSize=Math.max(.25,Math.min(12,brushSize||2))" aria-label="Brush size (canvas units)"/></label><p class="help">Drag over the layer, or apply a brush at exact layer coordinates below. Restore reveals original artwork.</p><div class="field-pair"><label class="editor-field">Brush X<input type="number" min="-256" max="256" step=".25" v-model.number="exactRect.x" @change="exactRect.x=Math.max(-256,Math.min(256,exactRect.x||0))"/></label><label class="editor-field">Brush Y<input type="number" min="-256" max="256" step=".25" v-model.number="exactRect.y" @change="exactRect.y=Math.max(-256,Math.min(256,exactRect.y||0))"/></label></div><button class="button quiet wide" @click="stampBrush">{{eraseTool==='restore'?'Restore brush spot':'Erase brush spot'}}</button></div>
          <div :class="{'inactive-panel':eraseMethod!=='rect'}" :inert="eraseMethod!=='rect'" :aria-hidden="eraseMethod!=='rect'"><p class="help">Drag a rectangle on the canvas, or enter exact layer coordinates.</p><div class="cubic-controls"><label v-for="key in (['x','y','width','height'] as const)" :key="key" class="editor-field">{{key}}<input type="number" :min="key==='x'||key==='y'?-256:.1" :max="key==='x'||key==='y'?256:48" step=".25" v-model.number="exactRect[key]" :aria-label="`${key} of eraser rectangle`" @change="exactRect[key]=Math.max(key==='x'||key==='y'?-256:.1,Math.min(key==='x'||key==='y'?256:48,exactRect[key]||0))"/></label></div><button class="button quiet wide" @click="applyExactRectangle">{{eraseTool==='restore'?'Restore rectangle':'Erase rectangle'}}</button></div></div>
          <button class="button quiet wide" :disabled="!active.erasures?.length" @click="resetErasing">Reset erasing</button>
        </section></div></div></section><section :class="{'inactive-panel':propertyTab!=='style'}" :inert="propertyTab!=='style'" :aria-hidden="propertyTab!=='style'" role="tabpanel" :id="maskId('panel-style')" :aria-labelledby="maskId('tab-style')" tabindex="0"><div v-if="active.kind==='shape'||active.kind==='path'||active.kind==='vector'" class="type-properties">
          <label class="editor-field">Appearance<select :value="active.paint" aria-label="Shape appearance" @change="update('paint',($event.target as HTMLSelectElement).value as Layer['paint'])"><option value="stroke">Outline</option><option value="fill">Filled</option><option value="both">Fill and outline</option></select></label>
        </div>
        <div class="type-properties" part="color-controls">
          <h3>Artwork colors</h3>
          <section v-if="active.kind==='text' || ((active.kind==='shape'||active.kind==='path'||active.kind==='vector')&&active.paint!=='stroke')" class="color-channel">
            <h3>Fill</h3>
            <div class="stroke-mode-switch" role="group" aria-label="Fill color scope"><button :class="{active:isSharedColor(active,'fill')}" :aria-pressed="isSharedColor(active,'fill')" @click="setColorScope('fill',true)">Shared</button><button :class="{active:!isSharedColor(active,'fill')}" :aria-pressed="!isSharedColor(active,'fill')" @click="setColorScope('fill',false)">This layer</button></div>
            <div class="color-row"><input type="color" :value="pickerColor(colorStyle(active,palette,'fill').color)" aria-label="Fill color" @input="setColor('fill',($event.target as HTMLInputElement).value)"/><button class="button quiet" @click="setColor('fill','currentColor')" title="Use the design system text color">Theme color</button><input class="hex-color" pattern="#[0-9a-fA-F]{6}" title="Enter a six-digit hex color, for example #20744f. Empty uses the theme color." aria-description="Enter a hash followed by six hexadecimal digits. Empty uses the theme color." :value="colorStyle(active,palette,'fill').color==='currentColor'?'':colorStyle(active,palette,'fill').color" placeholder="Theme color" aria-label="Fill hex color" @input="setColor('fill',($event.target as HTMLInputElement).value)"/></div>
            <div class="opacity-control"><label>Opacity <span>{{Math.round(colorStyle(active,palette,'fill').opacity*100)}}%</span></label><div class="opacity-inputs"><input type="range" min="0" max="100" step="1" :value="Math.round(colorStyle(active,palette,'fill').opacity*100)" aria-label="Fill opacity" @pointerdown="remember" @keydown="remember" @input="setOpacity('fill',Number(($event.target as HTMLInputElement).value),false)"/><input type="number" min="0" max="100" step="1" :value="Math.round(colorStyle(active,palette,'fill').opacity*100)" aria-label="Fill opacity percent" @input="setOpacity('fill',Number(($event.target as HTMLInputElement).value))"/></div></div>
          </section>
          <section v-if="active.kind!=='text' && (active.kind!=='shape'&&active.kind!=='path'&&active.kind!=='vector'||active.paint!=='fill'||active.shape==='line')" class="color-channel">
            <h3>Outline</h3>
            <div class="stroke-mode-switch" role="group" aria-label="Outline color scope"><button :class="{active:isSharedColor(active,'stroke')}" :aria-pressed="isSharedColor(active,'stroke')" @click="setColorScope('stroke',true)">Shared</button><button :class="{active:!isSharedColor(active,'stroke')}" :aria-pressed="!isSharedColor(active,'stroke')" @click="setColorScope('stroke',false)">This layer</button></div>
            <div class="color-row"><input type="color" :value="pickerColor(colorStyle(active,palette,'stroke').color)" aria-label="Outline color" @input="setColor('stroke',($event.target as HTMLInputElement).value)"/><button class="button quiet" @click="setColor('stroke','currentColor')" title="Use the design system text color">Theme color</button><input class="hex-color" pattern="#[0-9a-fA-F]{6}" title="Enter a six-digit hex color, for example #20744f. Empty uses the theme color." aria-description="Enter a hash followed by six hexadecimal digits. Empty uses the theme color." :value="colorStyle(active,palette,'stroke').color==='currentColor'?'':colorStyle(active,palette,'stroke').color" placeholder="Theme color" aria-label="Outline hex color" @input="setColor('stroke',($event.target as HTMLInputElement).value)"/></div>
            <div class="opacity-control"><label>Opacity <span>{{Math.round(colorStyle(active,palette,'stroke').opacity*100)}}%</span></label><div class="opacity-inputs"><input type="range" min="0" max="100" step="1" :value="Math.round(colorStyle(active,palette,'stroke').opacity*100)" aria-label="Outline opacity" @pointerdown="remember" @keydown="remember" @input="setOpacity('stroke',Number(($event.target as HTMLInputElement).value),false)"/><input type="number" min="0" max="100" step="1" :value="Math.round(colorStyle(active,palette,'stroke').opacity*100)" aria-label="Outline opacity percent" @input="setOpacity('stroke',Number(($event.target as HTMLInputElement).value))"/></div></div>
          </section>
        </div>
        <section v-if="active.kind!=='text'" class="stroke-controls" part="stroke-controls">
          <h3>Stroke width</h3>
          <div class="stroke-mode-switch" role="group" aria-label="Stroke width scope">
            <button :class="{active:active.strokeWidth===undefined}" :aria-pressed="active.strokeWidth===undefined" title="Edit the width shared by linked layers" @click="update('strokeWidth',undefined)">Shared</button>
            <button :class="{active:active.strokeWidth!==undefined}" :aria-pressed="active.strokeWidth!==undefined" title="Set an independent width for this layer" @click="update('strokeWidth',active.strokeWidth??stroke)">This layer</button>
          </div>
          <div class="stroke-value-row"><input type="range" :min="active.strokeWidth===undefined?.5:.1" :max="active.strokeWidth===undefined?4:8" :step="active.strokeWidth===undefined?.25:.1" :value="active.strokeWidth??stroke" aria-label="Stroke width" @pointerdown="remember" @keydown="remember" @input="changeStrokeWidth(Number(($event.target as HTMLInputElement).value),false)"/><label class="stroke-number"><input type="number" :min="active.strokeWidth===undefined?.5:.1" :max="active.strokeWidth===undefined?4:8" step=".1" :value="active.strokeWidth??stroke" aria-label="Exact stroke width" @input="changeStrokeWidth(Number(($event.target as HTMLInputElement).value))"/><span>px</span></label></div>
          <div class="stroke-footer"><span>{{active.strokeWidth===undefined?'Editing linked layers':'Editing this layer only'}}</span><button :disabled="customStrokeCount===0" @click="shareStrokeWidth" title="Remove custom widths and link all layers to the shared width">Match all layers</button></div>
        </section></section><section :class="{'inactive-panel':propertyTab!=='transform'}" :inert="propertyTab!=='transform'" :aria-hidden="propertyTab!=='transform'" role="tabpanel" :id="maskId('panel-transform')" :aria-labelledby="maskId('tab-transform')" tabindex="0"><label class="editor-field">Exact scale (%)<input type="number" min="10" max="200" step="1" :value="Math.round(active.scale*100)" aria-label="Exact scale (%)" @input="update('scale',Math.max(.1,Math.min(2,Number(($event.target as HTMLInputElement).value)/100)))"/></label><div class="slider-field"><label>Scale <span>{{Math.round(active.scale*100)}}%</span></label><input aria-label="Scale" type="range" min="0.1" max="2" step="0.01" :value="active.scale" @pointerdown="remember" @input="active.scale=Number(($event.target as HTMLInputElement).value)" @keydown="remember"/></div><div class="slider-field"><label>Rotation <span>{{active.rotation}}°</span></label><input aria-label="Rotation" type="range" min="-180" max="180" step="1" :value="active.rotation" @pointerdown="remember" @input="active.rotation=Number(($event.target as HTMLInputElement).value)" @keydown="remember"/></div>
        <div class="position-fields"><label>X <input type="number" min="-24" max="24" step=".25" :value="Number(active.x.toFixed(2))" @change="update('x',Math.max(-24,Math.min(24,Number(($event.target as HTMLInputElement).value))))"/></label><label>Y <input type="number" min="-24" max="24" step=".25" :value="Number(active.y.toFixed(2))" @change="update('y',Math.max(-24,Math.min(24,Number(($event.target as HTMLInputElement).value))))"/></label><button :aria-pressed="active.flip" aria-label="Flip horizontally" title="Flip horizontally" @click="update('flip',!active.flip)"><FlipHorizontal/></button></div><div class="snap-row"><span>Quick position</span><button v-for="(pos,i) in [[-6,-6],[6,-6],[0,0],[-6,6],[6,6]]" :key="i" :aria-label="['Top left','Top right','Center','Bottom left','Bottom right'][i]" @click="remember();active.x=pos[0];active.y=pos[1]"><span aria-hidden="true">{{['↖','↗','⊙','↙','↘'][i]}}</span></button></div>
      </section></div></div>
    </aside>
  </main><footer v-if="chrome" part="footer"><span>Built with <a href="https://lucide.dev" target="_blank" rel="noreferrer">Lucide <ArrowUpRight/></a> · Open source icons, endless possibilities.</span><span>Made for your next great interface.</span></footer><div class="toast" :class="{'visually-hidden':!notice}" part="toast" role="status" aria-live="polite" aria-atomic="true">{{notice}}<button v-if="notice" aria-label="Dismiss notification" @click="notice=''"><X aria-hidden="true"/></button></div>
</div>
</template>
