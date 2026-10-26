export interface PathPoint { x: number; y: number; cx?: number; cy?: number; c1x?: number; c1y?: number; c2x?: number; c2y?: number; }
export interface VectorPath { points: PathPoint[]; closed: boolean; }
export type Erasure = { type: 'brush'; action: 'erase' | 'restore'; size: number; points: {x:number;y:number}[] } | { type: 'rect'; action: 'erase' | 'restore'; x:number; y:number; width:number; height:number };
/** kind is optional for backward compatibility with original icon-only documents. */
export type ColorChannel = 'fill' | 'stroke';
export interface Palette { fillColor?: string; strokeColor?: string; fillOpacity?: number; strokeOpacity?: number; }
export interface Layer {
  id: string;
  kind?: 'icon' | 'text' | 'shape' | 'path' | 'vector';
  icon: string;
  x: number; y: number; scale: number; rotation: number; gap: number;
  mode: 'overlay' | 'space' | 'cutout';
  visible: boolean; flip: boolean;
  fillColor?: string; strokeColor?: string; strokeWidth?: number;
  fillOpacity?: number; strokeOpacity?: number;
  fillColorScope?: 'shared' | 'layer'; strokeColorScope?: 'shared' | 'layer';
  text?: string;
  font?: string;
  fontSize?: number;
  spacing?: number;
  align?: 'left' | 'center' | 'right';
  shape?: string;
  width?: number; height?: number; radius?: number;
  paint?: 'stroke' | 'fill' | 'both';
  points?: PathPoint[];
  closed?: boolean;
  paths?: VectorPath[];
  erasures?: Erasure[];
}
export interface Composition { version: 1; name: string; stroke: number; layers: Layer[]; palette?: Palette; }
export interface IconExport {
  format: 'svg' | 'vue' | 'png' | 'json'; filename: string; blob: Blob; content?: string;
}
