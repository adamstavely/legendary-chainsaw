import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {iconToPaths,pathToNodes,splitSegment,moveAnchor} from '../src/vectors.mjs';
import {pathData} from '../src/geometry.mjs';
import {erasureMarkup} from '../src/erasing.mjs';
import {renderLayers,svgDocument,validComposition,vueDocument} from '../src/composition.mjs';
import {parse,compileScript,compileTemplate} from '@vue/compiler-sfc';
const base={id:'base',icon:'file',x:2,y:1,scale:.5,rotation:45,gap:1,mode:'overlay',visible:true,flip:false};
const icons={file:'<path d="M4 2h10l6 6v14H4Z"/>'};
const erasures=[{type:'brush',action:'erase',size:2,points:[{x:2,y:2},{x:10,y:10}]},{type:'brush',action:'restore',size:1,points:[{x:5,y:5}]},{type:'rect',action:'erase',x:0,y:12,width:24,height:12}];
const doc=layers=>({version:1,name:'test',stroke:2,layers});
test('eraser masks follow layer transforms and keep erase/restore order',()=>{
 const out=svgDocument([{...base,erasures}],icons,2,'masked');
 assert.match(out,/rotate\(45\) scale\(0.5 0.5\)/);
 assert.match(out,/id="export-erase-0"/);
 const brush=out.indexOf('stroke="black" stroke-width="2"'),restore=out.indexOf('r="0.5" fill="white"'),rect=out.indexOf('x="0" y="12" width="24" height="12" fill="black"');
 assert.ok(brush>=0&&restore>brush&&rect>restore);
 assert.match(out,/fill="white" stroke="none" fill-opacity="1" stroke-opacity="1"/);
});
test('erasing is isolated to the selected layer and preview mask IDs do not collide',()=>{
 const out=renderLayers([{...base,erasures},{...base,id:'untouched'}],icons,2,'one');
 assert.equal((out.match(/<mask /g)||[]).length,1);
 assert.equal((out.match(/<path d="M4 2/g)||[]).length,2);
 assert.ok(out.includes('url(#one-erase-0)'));
 assert.ok(renderLayers([{...base,erasures}],icons,2,'two').includes('url(#two-erase-0)'));
});
test('erasing also applies to subtract/clear-space geometry',()=>{
 const out=renderLayers([{...base,erasures,mode:'space'}],icons,2,'space');
 assert.match(out,/space-erase-cut-0/);assert.match(out,/space-erase-0/);
});
test('eraser documents roundtrip and malformed strokes are rejected',()=>{
 assert.ok(validComposition(JSON.parse(JSON.stringify(doc([{...base,erasures}]))),icons));
 for(const invalid of [{type:'brush',action:'erase',size:0,points:[{x:1,y:1}]},{type:'brush',action:'erase',size:1,points:[]},{type:'rect',action:'bad',x:0,y:0,width:1,height:1},{type:'rect',action:'erase',x:NaN,y:0,width:1,height:1},{type:'rect',action:'erase',x:0,y:0,width:-1,height:1}])assert.ok(!validComposition(doc([{...base,erasures:[invalid]}]),icons));
});
test('SVG circles, arcs, rects, and subpaths become editable cubic/line nodes',()=>{
 const paths=iconToPaths('<circle cx="12" cy="12" r="8"/><rect x="2" y="2" width="8" height="8" rx="2"/><path d="M2 2h4v4z M12 12q2 4 6 0"/>');
 assert.equal(paths.length,4);assert.ok(paths[0].points.some(p=>p.c1x!==undefined));
 assert.match(pathData(paths[0].points,paths[0].closed),/C/);
 assert.ok(validComposition(doc([{...base,kind:'vector',paint:'stroke',paths}]),icons));
 assert.equal(pathToNodes('M2 2 h4 v4 z')[0].points[2].y,6);
});
test('adding a point splits a cubic without changing its curve',()=>{
 const points=[{x:0,y:0},{x:8,y:8,c1x:8,c1y:0,c2x:0,c2y:8}];
 splitSegment(points,0);assert.equal(points.length,3);assert.equal(points[1].x,4);assert.equal(points[1].y,4);
 assert.deepEqual([points[1].c1x,points[1].c1y,points[2].c2x,points[2].c2y],[4,0,4,8]);
 const oldIn=points[1].c2x,oldOut=points[2].c1x;moveAnchor(points,1,5,4);assert.equal(points[1].c2x,oldIn+1);assert.equal(points[2].c1x,oldOut+1);
});
test('every installed Lucide icon converts to a valid editable vector layer',()=>{
 for(const filename of readdirSync('node_modules/lucide-static/icons').filter(n=>n.endsWith('.svg'))) {
 const svg=readFileSync('node_modules/lucide-static/icons/'+filename,'utf8').replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>[\s\S]*$/,'');
 assert.ok(validComposition(doc([{...base,kind:'vector',paint:'stroke',paths:iconToPaths(svg)}]),icons),filename);
 }
});
test('Vue exports containing eraser masks and edited curves compile',()=>{
 const value={...base,kind:'vector',paint:'stroke',paths:iconToPaths('<circle cx="12" cy="12" r="8"/>'),erasures};
 const source=vueDocument([value],icons,2);
 const {descriptor,errors}=parse(source);assert.deepEqual(errors,[]);
 compileScript(descriptor,{id:'test'});
 assert.deepEqual(compileTemplate({source:descriptor.template.content,filename:'Icon.vue',id:'test'}).errors,[]);
 assert.match(source,/maskUnits="userSpaceOnUse"/);
 assert.match(source,/\$\{id\}-erase-0/);
});
