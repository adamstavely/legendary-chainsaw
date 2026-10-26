import svgpath from 'svgpath';
const finite = value => Number.isFinite(value);
export function pathToNodes(d) {
  const parsed=svgpath(d).abs().unshort().unarc();
  if(parsed.err)throw new Error('Invalid SVG path');
  const paths=[];let path;
  parsed.iterate((s,_i,x,y)=>{
    const op=s[0].toUpperCase();
    if(op==='M'){path={points:[{x:s[1],y:s[2]}],closed:false};paths.push(path);return;}
    if(!path)throw new Error('Missing path start');
    if(op==='Z'){path.closed=true;return;}
    let p;
    if(op==='L')p={x:s[1],y:s[2]};
    else if(op==='H')p={x:s[1],y};
    else if(op==='V')p={x,y:s[1]};
    else if(op==='Q')p={x:s[3],y:s[4],cx:s[1],cy:s[2]};
    else if(op==='C')p={x:s[5],y:s[6],c1x:s[1],c1y:s[2],c2x:s[3],c2y:s[4]};
    else throw new Error(`Unsupported SVG command ${op}`);
    if(!Object.values(p).every(finite))throw new Error('Invalid SVG coordinates');
    path.points.push(p);
  });
  return paths.filter(p=>p.points.length>=2);
}
export function iconToPaths(svg) {
  const cleaned=svg.replace(/<!--[\s\S]*?-->/g,'');
  const paths=[];
  for(const match of cleaned.matchAll(/<([a-z]+)\b([^>]*?)\/?\s*>/gi)) {
    const tag=match[1],attrs=Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
    const num=(k,fallback=0)=>attrs[k]===undefined?fallback:Number(attrs[k]);
    let d='';
    if(tag==='path')d=attrs.d||'';
    else if(tag==='line')d=`M${num('x1')} ${num('y1')}L${num('x2')} ${num('y2')}`;
    else if(tag==='polyline'||tag==='polygon') {const values=(attrs.points||'').trim().split(/[\s,]+/).map(Number);if(values.length<4||values.length%2)throw new Error('Invalid polygon');d=`M${values[0]} ${values[1]}`;for(let i=2;i<values.length;i+=2)d+=`L${values[i]} ${values[i+1]}`;if(tag==='polygon')d+='Z';}
    else if(tag==='circle'||tag==='ellipse') {const cx=num('cx'),cy=num('cy'),rx=num(tag==='circle'?'r':'rx'),ry=num(tag==='circle'?'r':'ry');d=`M${cx-rx} ${cy}A${rx} ${ry} 0 1 0 ${cx+rx} ${cy}A${rx} ${ry} 0 1 0 ${cx-rx} ${cy}Z`;}
    else if(tag==='rect') {const x=num('x'),y=num('y'),w=num('width'),h=num('height'),rx=Math.min(num('rx',num('ry')),w/2),ry=Math.min(num('ry',rx),h/2);d=rx>0&&ry>0?`M${x+rx} ${y}H${x+w-rx}A${rx} ${ry} 0 0 1 ${x+w} ${y+ry}V${y+h-ry}A${rx} ${ry} 0 0 1 ${x+w-rx} ${y+h}H${x+rx}A${rx} ${ry} 0 0 1 ${x} ${y+h-ry}V${y+ry}A${rx} ${ry} 0 0 1 ${x+rx} ${y}Z`:`M${x} ${y}H${x+w}V${y+h}H${x}Z`;}
    else throw new Error(`Unsupported SVG element ${tag}`);
    if(attrs.transform)d=svgpath(d).transform(attrs.transform).toString();
    paths.push(...pathToNodes(d));
  }
  if(!paths.length||paths.length>128||paths.some(p=>p.points.length>512))throw new Error('Icon is too complex to edit');
  return paths;
}
export function splitSegment(points,index) {
  if(index<0||index>=points.length-1)return;
  const a=points[index],b=points[index+1];
  const mid=(p,q)=>({x:(p.x+q.x)/2,y:(p.y+q.y)/2});
  let inserted;
  if(b.c1x!==undefined) {
    const c={x:b.c1x,y:b.c1y},d={x:b.c2x,y:b.c2y};
    const ab=mid(a,c),bc=mid(c,d),cd=mid(d,b),abc=mid(ab,bc),bcd=mid(bc,cd),m=mid(abc,bcd);
    inserted={...m,c1x:ab.x,c1y:ab.y,c2x:abc.x,c2y:abc.y};Object.assign(b,{c1x:bcd.x,c1y:bcd.y,c2x:cd.x,c2y:cd.y});
  } else if(b.cx!==undefined) {
    const c={x:b.cx,y:b.cy},ac=mid(a,c),cb=mid(c,b),m=mid(ac,cb);inserted={...m,cx:ac.x,cy:ac.y};b.cx=cb.x;b.cy=cb.y;
  } else inserted=mid(a,b);
  points.splice(index+1,0,inserted);
}
export function moveAnchor(points,index,x,y) {
  const p=points[index],dx=x-p.x,dy=y-p.y;
  p.x=x;p.y=y;
  if(p.c2x!==undefined){p.c2x+=dx;p.c2y+=dy;}
  const next=points[index+1];if(next?.c1x!==undefined){next.c1x+=dx;next.c1y+=dy;}
}
