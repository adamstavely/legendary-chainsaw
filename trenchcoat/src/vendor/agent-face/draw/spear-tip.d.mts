export interface LogoGradient {
  from: readonly [number, number];
  to: readonly [number, number];
  stops: readonly (readonly [number, string])[];
}
export const BODY_PATH: string;
export const LEG_PATH: string;
export const LEG_FACE_PATH: string;
export const TIP_PATH: string;
export const BODY_GRADIENT: LogoGradient;
export const LEG_GRADIENT: LogoGradient;
export const LEG_RIM: LogoGradient;
