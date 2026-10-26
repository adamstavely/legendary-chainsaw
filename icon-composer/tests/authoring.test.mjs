import {test} from 'node:test';
import assert from 'node:assert/strict';
import {textPath, geometry, pathData} from '../src/geometry.mjs';
import {drawLayer,renderLayers,svgDocument,validComposition} from '../src/composition.mjs';
const icons={file:'<path d="M4 2h10l6 6v14H4Z"/>'};
const base={id:'base',icon:'file',x:0,y:0,scale:1,rotation:0,gap:1,mode:'overlay',visible:true,flip:false};
const text={...base,id:'label',kind:'text',text:'PDF 12',font:'sans-700',fontSize:5,spacing:0,align:'center',mode:'space',fillColor:'#aabbcc'};
const shape={...base,kind:'shape',shape:'rectangle',width:8.3,height:4.7,radius:.6,paint:'both',fillColor:'#ff6600',strokeColor:'#334455',strokeWidth:.3};
const path={...base,kind:'path',points:[{x:2,y:20},{x:12,y:4,cx:3,cy:2},{x:22,y:20}],closed:true,paint:'fill'};
const document=layers=>({version:1,name:'test',stroke:2,layers});
test('text exports as deterministic vector outlines with no font/text dependency',()=>{const out=svgDocument([base,text],icons,2,'PDF');assert.match(out,/<path d="M/);assert.doesNotMatch(out,/<text|font-family|NaN|undefined/);assert.equal(textPath(text),textPath({...text}));assert.match(out,/fill="#aabbcc"/);assert.match(out,/fill="black" stroke="black"/);});
test('font, text content, alignment and spacing alter outlines',()=>{for(const change of [{text:'123'},{font:'mono-400'},{align:'left'},{fontSize:3},{spacing:.5}])assert.notEqual(textPath(text),textPath({...text,...change}));});
test('filled shapes keep independent colors and decimal dimensions',()=>{const out=drawLayer(shape,icons,2);assert.match(out,/width="8.3" height="4.7" rx="0.6"/);assert.match(out,/fill="#ff6600" stroke="#334455" stroke-width="0.3"/);});
test('filled text clearance expands mask only; cutout omits foreground',()=>{const filled=renderLayers([text],icons,2);assert.match(filled,/fill="black" stroke="black" stroke-width="2"/);assert.match(filled,/fill="#aabbcc" stroke="none" stroke-width="0"/);const cut=renderLayers([{...text,mode:'cutout'}],icons,2);assert.doesNotMatch(cut,/#aabbcc/);});
test('editable paths preserve curves and closure',()=>{assert.equal(pathData(path.points,true),'M2 20Q3 2 12 4L22 20Z');assert.match(geometry(path,icons),/Q3 2 12 4/);assert.ok(validComposition(document([path]),icons));});
test('legacy and mixed documents roundtrip',()=>{const data=document([base,text,{...shape,id:'shape'},{...path,id:'path'}]);assert.ok(validComposition(JSON.parse(JSON.stringify(data)),icons));});
test('rejects malformed and injectable text, colors, paths and duplicate IDs',()=>{for(const bad of [{...text,text:'你好'},{...text,text:'<script>alert(1)</script>'},{...text,font:'evil'},{...shape,strokeColor:'red" onload="alert(1)'},{...shape,width:0},{...path,points:[{x:2,y:3}]},{...path,points:[{x:2,y:3},{x:4,y:5,cx:6}]},{...path,points:[{x:2,y:3},{x:4,y:Infinity}]}])assert.ok(!validComposition(document([bad]),icons));assert.ok(!validComposition(document([base,{...base}]),icons));});

test('shared width updates followers while custom widths stay independent',()=>{
  const shared={...base,id:'shared'};
  const custom={...base,id:'custom',strokeWidth:.7};
  const thin=renderLayers([shared,custom],icons,1);
  const thick=renderLayers([shared,custom],icons,3);
  assert.match(thin,/stroke-width="1"/);
  assert.match(thick,/stroke-width="3"/);
  assert.match(thin,/stroke-width="0.7"/);
  assert.match(thick,/stroke-width="0.7"/);
  delete custom.strokeWidth;
  assert.equal((renderLayers([shared,custom],icons,3).match(/stroke-width="3"/g)||[]).length,2);
});

test('independent fill and outline opacity persist in vectors while masks stay solid',()=>{
  const translucent={...shape,fillOpacity:.25,strokeOpacity:.6,mode:'space'};
  const out=svgDocument([translucent],icons,2,'alpha');
  assert.match(out,/fill-opacity="0.25" stroke-opacity="0.6"/);
  assert.match(out,/fill-opacity="1" stroke-opacity="1"/);
  assert.ok(validComposition(document([translucent]),icons));
  assert.ok(validComposition(document([{...translucent,fillOpacity:0,strokeOpacity:0}]),icons));
  for(const invalid of [-.1,1.1,NaN,'0.5'])assert.ok(!validComposition(document([{...translucent,fillOpacity:invalid}]),icons));
});

test('shared palette updates linked colors without overwriting custom colors',()=>{
  const linked={...base,id:'linked',strokeColorScope:'shared'};
  const custom={...base,id:'independent',strokeColorScope:'layer',strokeColor:'#123456',strokeOpacity:.7};
  const out=svgDocument([linked,custom],icons,2,'palette',{strokeColor:'#ff0000',strokeOpacity:.25});
  assert.match(out,/stroke="#ff0000"[^>]*stroke-opacity="0.25"/);
  assert.match(out,/stroke="#123456"[^>]*stroke-opacity="0.7"/);
  const next=svgDocument([linked,custom],icons,2,'palette',{strokeColor:'#0000ff'});
  assert.match(next,/stroke="#0000ff"/);assert.match(next,/stroke="#123456"/);
});
test('fill and outline palettes are separate, and legacy custom colors remain independent',()=>{
  const linked={...shape,fillColor:undefined,strokeColor:undefined,fillColorScope:'shared',strokeColorScope:'shared'};
  const out=svgDocument([linked],icons,2,'two-tone',{fillColor:'#aabbcc',strokeColor:'#112233',fillOpacity:.2,strokeOpacity:.8});
  assert.match(out,/fill="#aabbcc" stroke="#112233"/);
  assert.match(out,/fill-opacity="0.2" stroke-opacity="0.8"/);
  assert.match(svgDocument([shape],icons,2,'legacy',{fillColor:'#000000'}),/fill="#ff6600"/);
});
test('palette roundtrips and invalid shared values are rejected',()=>{
  const value={...document([base]),palette:{strokeColor:'#112233',strokeOpacity:.3}};
  assert.ok(validComposition(JSON.parse(JSON.stringify(value)),icons));
  for(const palette of [null,[],{strokeOpacity:2},{fillColor:'red" onload="bad'}])assert.ok(!validComposition({...value,palette},icons));
  assert.ok(!validComposition(document([{...base,fillColorScope:'unknown'}]),icons));
});
