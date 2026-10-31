export interface Tickable {
  tick(dtMs: number): void;
}

const faces = new Set<Tickable>();
let handle = 0;
let last = 0;

function frame(time: number): void {
  handle = 0;
  const dt = last ? time - last : 16;
  last = time;
  for (const face of [...faces]) face.tick(dt);
  if (faces.size > 0) handle = requestAnimationFrame(frame);
  else last = 0;
}

/** Every face on the page shares one animation frame */
export function addToLoop(face: Tickable): void {
  faces.add(face);
  if (!handle) handle = requestAnimationFrame(frame);
}

export function removeFromLoop(face: Tickable): void {
  faces.delete(face);
  if (faces.size === 0 && handle) {
    cancelAnimationFrame(handle);
    handle = 0;
    last = 0;
  }
}

export function loopSize(): number {
  return faces.size;
}
