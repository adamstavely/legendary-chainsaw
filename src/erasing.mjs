const n=v=>String(Number(v.toFixed(5)));
export function erasureMarkup(strokes=[]) {
  return strokes.map(s=>{
    const color=s.action==='restore'?'white':'black';
    if(s.type==='rect')return `<rect x="${n(s.x)}" y="${n(s.y)}" width="${n(s.width)}" height="${n(s.height)}" fill="${color}"/>`;
    const d=s.points.map((p,i)=>`${i?'L':'M'}${n(p.x)} ${n(p.y)}`).join('');
    if(s.points.length===1)return `<circle cx="${n(s.points[0].x)}" cy="${n(s.points[0].y)}" r="${n(s.size/2)}" fill="${color}"/>`;
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${n(s.size)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
}
export function maskGeometry(shape,strokes,id) {
  if(!strokes?.length)return shape;
  return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-256" y="-256" width="512" height="512" style="mask-type:luminance" fill="white" stroke="none" fill-opacity="1" stroke-opacity="1"><rect x="-256" y="-256" width="512" height="512" fill="white"/>${erasureMarkup(strokes)}</mask></defs><g mask="url(#${id})">${shape}</g>`;
}
