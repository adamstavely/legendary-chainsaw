import { fonts } from './fonts.mjs';
export { fonts };
export const shapeNames=['rectangle','circle','triangle','diamond','line'];
const n=value=>String(Number(value.toFixed(5)));
export function supportedText(text,font='sans-700') {
  return typeof text==='string' && text.length<=12 && !!fonts[font] && [...text].every(char=>Object.hasOwn(fonts[font].glyphs,char));
}
export function textWidth(text,fontId='sans-700') {
  return [...text].reduce((sum,char)=>sum+(fonts[fontId]?.glyphs[char]?.advance||0),0);
}
export function textPath(layer) {
  const font=fonts[layer.font];
  if(!font || !supportedText(layer.text,layer.font))return '';
  const chars=[...layer.text],size=layer.fontSize;
  const width=chars.reduce((sum,c)=>sum+font.glyphs[c].advance*size,0)+Math.max(0,chars.length-1)*layer.spacing;
  let x=layer.align==='left'?12:layer.align==='right'?12-width:12-width/2;
  const baseline=12+font.capHeight*size/2;
  let d='';
  for(const char of chars) {
    for(const c of font.glyphs[char].commands) {
      const xy=(a,b)=>`${n(x+c[a]*size)} ${n(baseline+c[b]*size)}`;
      if(c.type==='M'||c.type==='L')d+=`${c.type}${xy('x','y')}`;
      else if(c.type==='Q')d+=`Q${xy('x1','y1')} ${xy('x','y')}`;
      else if(c.type==='C')d+=`C${xy('x1','y1')} ${xy('x2','y2')} ${xy('x','y')}`;
      else if(c.type==='Z')d+='Z';
    }
    x+=font.glyphs[char].advance*size+layer.spacing;
  }
  return d;
}
export function pathData(points,closed) {
  if(!points?.length)return '';
  let d=`M${n(points[0].x)} ${n(points[0].y)}`;
  for(const p of points.slice(1)) d+=p.c1x!==undefined?`C${n(p.c1x)} ${n(p.c1y)} ${n(p.c2x)} ${n(p.c2y)} ${n(p.x)} ${n(p.y)}`:p.cx!==undefined?`Q${n(p.cx)} ${n(p.cy)} ${n(p.x)} ${n(p.y)}`:`L${n(p.x)} ${n(p.y)}`;
  return d+(closed?'Z':'');
}
export function geometry(layer,icons) {
  if(layer.kind==='text')return `<path d="${textPath(layer)}"/>`;
  if(layer.kind==='vector')return layer.paths.map(p=>`<path d="${pathData(p.points,p.closed)}"/>`).join('');
  if(layer.kind==='path')return `<path d="${pathData(layer.points,layer.closed)}"/>`;
  if(layer.kind!=='shape')return icons[layer.icon]||'';
  const w=layer.width,h=layer.height,x=12-w/2,y=12-h/2;
  switch(layer.shape) {
    case 'rectangle':return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(layer.radius,w/2,h/2)}"/>`;
    case 'circle':return `<ellipse cx="12" cy="12" rx="${w/2}" ry="${h/2}"/>`;
    case 'triangle':return `<path d="M12 ${y}L${x+w} ${y+h}H${x}Z"/>`;
    case 'diamond':return `<path d="M12 ${y}L${x+w} 12L12 ${y+h}L${x} 12Z"/>`;
    case 'line':return `<path d="M${x} 12H${x+w}"/>`;
    default:return '';
  }
}
export function layerLabel(layer) {
  return layer.kind==='text'?`Text: ${layer.text||'(empty)'}`:layer.kind==='shape'?layer.shape:layer.kind==='vector'?`Edited ${layer.icon||'vector'}`:layer.kind==='path'?'Custom path':layer.icon;
}
