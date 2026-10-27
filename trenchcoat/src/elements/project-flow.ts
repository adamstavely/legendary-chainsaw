import { html, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-project-flow> – the Lit port of illustrations/project-flow.tsx: an animated illustration block. The scene is
 * drawn on a 2312 × 1644 artboard and scaled to the width of its container (written to the stage directly, so a
 * resize never re-renders). The cards build up one after another; put a new element in to replay it.
 *
 *   <tc-project-flow label="A task with subtasks and their tech stacks"></tc-project-flow>
 *
 * The background is transparent – set --tc-project-flow-fade to your page colour so the edges fade into it. The
 * build-up waits while the scene is off screen or the tab is hidden (data-paused); reduced motion shows the finished
 * scene. It follows the page theme – a .dark class, data-theme / data-tc-theme on an ancestor or the OS setting – and
 * switches to the dark scene (finished, without replaying: data-settled) when the theme changes; `theme` pins one.
 * Decorative by default (the host is aria-hidden); with `label` the host is an image (role="img") named by it.
 * The scene markup is fixed (the design's own, with WebP avatars and logos inlined).
 */

const W = 2312;
/** Attributes that switch the theme on an ancestor */
const THEME_ATTRS = ["class", "style", "data-theme", "data-tc-theme"];

let seq = 0;

/* ---------- Scenes (artboard coordinates, 1:1 from the design) ---------- */

const assets: Record<string, string> = {
  "__A_male_memoji_2__": "data:image/webp;base64,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",
  "__A_male_memoji_1__": "data:image/webp;base64,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",
  "__A_group_1__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='13.9451' height='13.9441' viewBox='0 0 13.9451 13.9441' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Group'%3E %3Cpath id='Vector' d='M10.8491 6.192C9.14513 6.192 7.75312 4.8 7.75312 3.096C7.75312 1.392 9.14513 0 10.8491 0C12.5531 0 13.9451 1.392 13.9451 3.096V6.192H10.8491Z' fill='%2336C5F0'/%3E %3Cpath id='Vector_2' d='M10.848 7.7521C12.552 7.7521 13.944 9.1441 13.944 10.8481C13.944 12.5521 12.552 13.9441 10.848 13.9441H3.096C1.392 13.9441 0 12.5521 0 10.8481C0 9.1441 1.392 7.7521 3.096 7.7521H10.848Z' fill='%2336C5F0'/%3E %3C/g%3E %3C/svg%3E",
  "__A_group_2__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='13.9357' height='13.9441' viewBox='0 0 13.9357 13.9441' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Group'%3E %3Cpath id='Vector' d='M7.74375 10.8481C7.74375 9.1441 9.13575 7.7521 10.8397 7.7521C12.5437 7.7521 13.9357 9.1441 13.9357 10.8481C13.9357 12.5521 12.5437 13.9441 10.8397 13.9441H7.74375V10.8481Z' fill='%232EB67D'/%3E %3Cpath id='Vector_2' d='M6.192 10.848C6.192 12.552 4.8 13.944 3.096 13.944C1.392 13.944 0 12.552 0 10.848V3.096C0 1.392 1.392 0 3.096 0C4.8 0 6.192 1.392 6.192 3.096V10.848Z' fill='%232EB67D'/%3E %3C/g%3E %3C/svg%3E",
  "__A_group_0__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='13.9452' height='13.9441' viewBox='0 0 13.9452 13.9441' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Group'%3E %3Cpath id='Vector' d='M6.192 3.096C6.192 4.8 4.8 6.192 3.096 6.192C1.392 6.192 0 4.8 0 3.096C0 1.392 1.392 0 3.096 0H6.192V3.096Z' fill='%23E01E5A'/%3E %3Cpath id='Vector_2' d='M7.75316 3.09607C7.75316 1.39207 9.14516 7.40051e-05 10.8492 7.40051e-05C12.5532 7.40051e-05 13.9452 1.39207 13.9452 3.09607V10.8481C13.9452 12.5521 12.5532 13.9441 10.8492 13.9441C9.14516 13.9441 7.75316 12.5521 7.75316 10.8481V3.09607Z' fill='%23E01E5A'/%3E %3C/g%3E %3C/svg%3E",
  "__A_group_3__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='13.944' height='13.944' viewBox='0 0 13.944 13.944' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Group'%3E %3Cpath id='Vector' d='M3.096 7.75195C4.8 7.75195 6.192 9.14395 6.192 10.848C6.192 12.552 4.8 13.9439 3.096 13.9439C1.392 13.9439 0 12.552 0 10.848V7.75195H3.096Z' fill='%23ECB22E'/%3E %3Cpath id='Vector_2' d='M3.096 6.192C1.392 6.192 0 4.8 0 3.096C0 1.392 1.392 0 3.096 0H10.848C12.552 0 13.944 1.392 13.944 3.096C13.944 4.8 12.552 6.192 10.848 6.192H3.096Z' fill='%23ECB22E'/%3E %3C/g%3E %3C/svg%3E",
  "__A_gmail__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='30.8398' height='24.5317' viewBox='0 0 30.8398 24.5317' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='idrA5FDGTH_1785762702011 1' clip-path='url(%23clip0_0_54)'%3E %3Cpath id='path1' d='M24.1809 3.15411H30.8395V22.429C30.8395 23.5902 29.898 24.5317 28.7367 24.5317H25.2322C25.0942 24.5317 24.9574 24.5045 24.8299 24.4516C24.7023 24.3988 24.5864 24.3214 24.4888 24.2237C24.3912 24.1261 24.3137 24.0102 24.2609 23.8827C24.2081 23.7551 24.1809 23.6184 24.1809 23.4803V3.15411Z' fill='url(%23paint0_linear_0_54)'/%3E %3Cpath id='path2' d='M6.65859 3.15411H0V22.429C0 23.5902 0.941489 24.5317 2.10271 24.5317H5.60723C5.7453 24.5317 5.88201 24.5045 6.00957 24.4516C6.13712 24.3988 6.25302 24.3214 6.35065 24.2237C6.44828 24.1261 6.52572 24.0102 6.57856 23.8827C6.63139 23.7551 6.65859 23.6184 6.65859 23.4803V3.15411Z' fill='%23FC413D'/%3E %3Cpath id='path3' d='M5.47164 0.780842C4.06405 -0.402284 1.96397 -0.220399 0.78084 1.18719C-0.402286 2.59461 -0.220401 4.69469 1.18719 5.87799L14.518 17.0835C14.7706 17.2958 15.09 17.4122 15.42 17.4122C15.75 17.4122 16.0694 17.2958 16.322 17.0835L29.6528 5.87781C31.0602 4.69469 31.2421 2.59461 30.059 1.18702C28.8759 -0.220399 26.7758 -0.402284 25.3684 0.780842L15.4199 9.14333L5.47164 0.780842Z' fill='url(%23paint1_linear_0_54)'/%3E %3C/g%3E %3Cdefs%3E %3ClinearGradient id='paint0_linear_0_54' x1='27.5102' y1='3.15411' x2='27.5102' y2='24.5317' gradientUnits='userSpaceOnUse'%3E %3Cstop stop-color='%2360D673'/%3E %3Cstop offset='0.17' stop-color='%2342C868'/%3E %3Cstop offset='0.39' stop-color='%230EBC5F'/%3E %3Cstop offset='0.62' stop-color='%2300A9BB'/%3E %3Cstop offset='0.86' stop-color='%233C90FF'/%3E %3Cstop offset='1' stop-color='%233186FF'/%3E %3C/linearGradient%3E %3ClinearGradient id='paint1_linear_0_54' x1='3.30313e-05' y1='3.52733' x2='30.8398' y2='3.52733' gradientUnits='userSpaceOnUse'%3E %3Cstop offset='0.08' stop-color='%23FF63A0'/%3E %3Cstop offset='0.3' stop-color='%23FC413D'/%3E %3Cstop offset='0.5' stop-color='%23FC413D'/%3E %3Cstop offset='0.65' stop-color='%23FC413D'/%3E %3Cstop offset='0.72' stop-color='%23FC5C30'/%3E %3Cstop offset='0.86' stop-color='%23FEB10C'/%3E %3Cstop offset='0.91' stop-color='%23FEC700'/%3E %3Cstop offset='0.96' stop-color='%23FFDB0F'/%3E %3C/linearGradient%3E %3CclipPath id='clip0_0_54'%3E %3Crect width='30.8398' height='24.5317' fill='white'/%3E %3C/clipPath%3E %3C/defs%3E %3C/svg%3E",
  "__A_figma__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='22.8234' height='34.2351' viewBox='0 0 22.8234 34.2351' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Symbol (1) 1' clip-path='url(%23clip0_0_60)'%3E %3Cpath id='Vector' d='M11.4102 17.1175C11.4102 13.9984 13.9387 11.4698 17.0579 11.4698C20.177 11.4698 22.7057 13.9984 22.7057 17.1175C22.7057 20.2367 20.177 22.7653 17.0579 22.7653C13.9387 22.7653 11.4102 20.2367 11.4102 17.1175Z' fill='%231ABCFE'/%3E %3Cpath id='Vector_2' d='M0.115048 28.4131C0.115048 25.294 2.64363 22.7653 5.76281 22.7653H11.4106V28.4131C11.4106 31.5323 8.88201 34.0609 5.76281 34.0609C2.64363 34.0609 0.115048 31.5323 0.115048 28.4131Z' fill='%230ACF83'/%3E %3Cpath id='Vector_3' d='M11.4102 0.174285V11.4698H17.0579C20.1771 11.4698 22.7057 8.94121 22.7057 5.82204C22.7057 2.70288 20.1771 0.174285 17.0579 0.174285H11.4102Z' fill='%23FF7262'/%3E %3Cpath id='Vector_4' d='M0.115048 5.82205C0.115048 8.94121 2.64363 11.4698 5.76281 11.4698H11.4106V0.174285H5.76281C2.64363 0.174285 0.115048 2.70287 0.115048 5.82205Z' fill='%23F24E1E'/%3E %3Cpath id='Vector_5' d='M0.115048 17.1175C0.115048 20.2367 2.64363 22.7653 5.76281 22.7653H11.4106V11.4698H5.76281C2.64363 11.4698 0.115048 13.9984 0.115048 17.1175Z' fill='%23A259FF'/%3E %3C/g%3E %3Cdefs%3E %3CclipPath id='clip0_0_60'%3E %3Crect width='22.8234' height='34.2351' fill='white'/%3E %3C/clipPath%3E %3C/defs%3E %3C/svg%3E",
  "__A_framer__": "data:image/webp;base64,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",
  "__A_clickup__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='27' height='32' viewBox='0 0 27 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Group'%3E %3Cpath id='Vector' fill-rule='evenodd' clip-rule='evenodd' d='M0 24.6079L4.97628 20.8146C7.63686 24.2188 10.4453 25.8237 13.5493 25.8237C16.6533 25.8237 19.4124 24.2675 21.9252 20.8632L27 24.5593C23.354 29.4225 18.8212 32 13.5493 32C8.32664 32 3.74453 29.4225 0 24.6079Z' fill='url(%23paint0_linear_0_51)'/%3E %3Cpath id='Vector_2' fill-rule='evenodd' clip-rule='evenodd' d='M13.5493 8.21884L4.68066 15.7568L0.591241 11.0395L13.5985 0L26.5073 11.0395L22.3686 15.7082L13.5493 8.21884Z' fill='url(%23paint1_linear_0_51)'/%3E %3C/g%3E %3Cdefs%3E %3ClinearGradient id='paint0_linear_0_51' x1='0' y1='26.4127' x2='27.022' y2='26.4127' gradientUnits='userSpaceOnUse'%3E %3Cstop stop-color='%238930FD'/%3E %3Cstop offset='1' stop-color='%2349CCF9'/%3E %3C/linearGradient%3E %3ClinearGradient id='paint1_linear_0_51' x1='0.588925' y1='7.8757' x2='26.4801' y2='7.8757' gradientUnits='userSpaceOnUse'%3E %3Cstop stop-color='%23FF02F0'/%3E %3Cstop offset='1' stop-color='%23FFC800'/%3E %3C/linearGradient%3E %3C/defs%3E %3C/svg%3E",
  "__A_male_memoji_3__": "data:image/webp;base64,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",
  "__A_clip_0__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='167' height='167' viewBox='0 0 167 167' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Clip path group'%3E %3Cmask id='mask0_0_44' style='mask-type:luminance' maskUnits='userSpaceOnUse' x='0' y='0' width='167' height='167'%3E %3Cg id='SVGID_2_'%3E %3Cpath id='Vector' d='M167 0H0V167H167V0Z' fill='white'/%3E %3C/g%3E %3C/mask%3E %3Cg mask='url(%23mask0_0_44)'%3E %3Cpath id='Vector_2' d='M65.7556 67.8441C68.3649 66.8003 73.0618 67.3222 74.6274 70.4535C75.6712 73.0628 76.7149 76.716 76.7149 76.1941C76.7149 74.1066 76.7149 69.9316 77.2368 67.8441C77.7587 66.2785 78.8024 64.7128 80.8899 64.191C82.4556 63.6691 84.0212 63.6691 85.5868 63.6691C87.1524 64.191 88.7181 65.2347 89.7618 66.2785C91.8493 69.4097 91.8493 76.1941 91.8493 75.6722C92.3712 74.1066 92.3712 69.4097 93.4149 67.3222C93.9368 66.2785 96.0243 65.2347 97.0681 64.7128C98.6337 64.191 100.721 64.191 102.287 64.7128C103.331 64.7128 105.418 66.2785 105.94 67.3222C106.984 68.8878 107.506 74.1066 108.027 76.1941C108.027 76.716 108.549 74.1066 109.593 72.541C111.681 69.4097 118.987 68.366 119.509 75.6722C119.509 79.3253 119.509 78.8035 119.509 81.4128C119.509 84.0222 119.509 85.5878 119.509 87.6753C119.509 89.7628 118.987 94.4597 118.465 96.5472C117.943 98.1128 116.377 101.766 114.812 103.853C114.812 103.853 109.071 110.116 108.549 113.247C108.027 116.378 108.027 116.378 108.027 118.466C108.027 120.553 108.549 123.163 108.549 123.163C108.549 123.163 104.374 123.685 102.287 123.163C100.199 122.641 97.5899 118.988 97.0681 117.422C96.0243 115.857 94.4587 115.857 93.4149 117.422C92.3712 119.51 89.7618 123.163 88.1962 123.163C84.5431 123.685 77.2368 123.163 72.0181 123.163C72.0181 123.163 73.0618 117.944 70.9743 115.857C69.4087 114.291 66.7993 111.682 65.2337 110.116L61.0587 105.419C59.4931 103.332 55.8399 100.722 54.7962 94.9816C53.7524 90.2847 53.7524 87.6753 54.7962 85.5878C55.8399 83.5003 58.4493 82.4566 59.4931 82.4566C60.5368 82.4566 63.1462 82.4566 64.1899 82.9785C65.2337 83.5003 65.7556 84.0222 66.7993 85.066C67.8431 86.6316 68.3649 87.6753 67.8431 85.5878C67.3212 84.0222 66.2774 82.4566 65.7556 80.3691C65.2337 78.2816 63.6681 75.6722 63.6681 72.541C61.0587 72.541 61.5806 69.4097 65.7556 67.8441Z' fill='white'/%3E %3C/g%3E %3C/g%3E %3C/svg%3E",
  "__A_clip_1__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='167' height='167' viewBox='0 0 167 167' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Clip path group'%3E %3Cmask id='mask0_0_36' style='mask-type:luminance' maskUnits='userSpaceOnUse' x='0' y='0' width='167' height='167'%3E %3Cg id='SVGID_2_'%3E %3Cpath id='Vector' d='M167 0H0V167H167V0Z' fill='white'/%3E %3C/g%3E %3C/mask%3E %3Cg mask='url(%23mask0_0_36)'%3E %3Cpath id='Vector_2' d='M65.7556 67.8441C68.3649 66.8003 73.0618 67.3222 74.6274 70.4535C75.6712 73.0628 76.7149 76.716 76.7149 76.1941C76.7149 74.1066 76.7149 69.9316 77.2368 67.8441C77.7587 66.2785 78.8024 64.7128 80.8899 64.191C82.4556 63.6691 84.0212 63.6691 85.5868 63.6691C87.1524 64.191 88.7181 65.2347 89.7618 66.2785C91.8493 69.4097 91.8493 76.1941 91.8493 75.6722C92.3712 74.1066 92.3712 69.4097 93.4149 67.3222C93.9368 66.2785 96.0243 65.2347 97.0681 64.7128C98.6337 64.191 100.721 64.191 102.287 64.7128C103.331 64.7128 105.418 66.2785 105.94 67.3222C106.984 68.8878 107.506 74.1066 108.027 76.1941C108.027 76.716 108.549 74.1066 109.593 72.541C111.681 69.4097 118.987 68.366 119.509 75.6722C119.509 79.3253 119.509 78.8035 119.509 81.4128C119.509 84.0222 119.509 85.5878 119.509 87.6753C119.509 89.7628 118.987 94.4597 118.465 96.5472C117.943 98.1128 116.377 101.766 114.812 103.853C114.812 103.853 109.071 110.116 108.549 113.247C108.027 116.378 108.027 116.378 108.027 118.466C108.027 120.553 108.549 123.163 108.549 123.163C108.549 123.163 104.374 123.685 102.287 123.163C100.199 122.641 97.5899 118.988 97.0681 117.422C96.0243 115.857 94.4587 115.857 93.4149 117.422C92.3712 119.51 89.7618 123.163 88.1962 123.163C84.5431 123.685 77.2368 123.163 72.0181 123.163C72.0181 123.163 73.0618 117.944 70.9743 115.857C69.4087 114.291 66.7993 111.682 65.2337 110.116L61.0587 105.419C59.4931 103.332 55.8399 100.722 54.7962 94.9816C53.7524 90.2847 53.7524 87.6753 54.7962 85.5878C55.8399 83.5003 58.4493 82.4566 59.4931 82.4566C60.5368 82.4566 63.1462 82.4566 64.1899 82.9785C65.2337 83.5003 65.7556 84.0222 66.7993 85.066C67.8431 86.6316 68.3649 87.6753 67.8431 85.5878C67.3212 84.0222 66.2774 82.4566 65.7556 80.3691C65.2337 78.2816 63.6681 75.6722 63.6681 72.541C61.0587 72.541 61.5806 69.4097 65.7556 67.8441Z' stroke='black' stroke-width='3.91406' stroke-linejoin='round'/%3E %3C/g%3E %3C/g%3E %3C/svg%3E",
  "__A_clip_2__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='167' height='167' viewBox='0 0 167 167' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Clip path group'%3E %3Cmask id='mask0_0_40' style='mask-type:luminance' maskUnits='userSpaceOnUse' x='0' y='0' width='167' height='167'%3E %3Cg id='SVGID_2_'%3E %3Cpath id='Vector' d='M167 0H0V167H167V0Z' fill='white'/%3E %3C/g%3E %3C/mask%3E %3Cg mask='url(%23mask0_0_40)'%3E %3Cpath id='Vector_2' d='M102.287 108.028V90.284' stroke='black' stroke-width='3.91406' stroke-linecap='round'/%3E %3C/g%3E %3C/g%3E %3C/svg%3E",
  "__A_clip_3__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='167' height='167' viewBox='0 0 167 167' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Clip path group'%3E %3Cmask id='mask0_0_29' style='mask-type:luminance' maskUnits='userSpaceOnUse' x='0' y='0' width='167' height='167'%3E %3Cg id='SVGID_2_'%3E %3Cpath id='Vector' d='M167 0H0V167H167V0Z' fill='white'/%3E %3C/g%3E %3C/mask%3E %3Cg mask='url(%23mask0_0_29)'%3E %3Cpath id='Vector_2' d='M91.85 108.028L91.3281 90.284' stroke='black' stroke-width='3.91406' stroke-linecap='round'/%3E %3C/g%3E %3C/g%3E %3C/svg%3E",
  "__A_clip_4__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='167' height='167' viewBox='0 0 167 167' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='Clip path group'%3E %3Cmask id='mask0_0_22' style='mask-type:luminance' maskUnits='userSpaceOnUse' x='0' y='0' width='167' height='167'%3E %3Cg id='SVGID_2_'%3E %3Cpath id='Vector' d='M167 0H0V167H167V0Z' fill='white'/%3E %3C/g%3E %3C/mask%3E %3Cg mask='url(%23mask0_0_22)'%3E %3Cpath id='Vector_2' d='M81.4118 90.284V108.028' stroke='black' stroke-width='3.91406' stroke-linecap='round'/%3E %3C/g%3E %3C/g%3E %3C/svg%3E",
  "__A_hand_open__": "data:image/svg+xml,%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 32 32' enable-background='new 0 0 32 32' xml:space='preserve'%3E %3Cg%3E %3Cdefs%3E %3Crect id='SVGID_1_' width='32' height='32'/%3E %3C/defs%3E %3CclipPath id='SVGID_2_'%3E %3Cuse xlink:href='%23SVGID_1_' overflow='visible'/%3E %3C/clipPath%3E %3Cpath clip-path='url(%23SVGID_2_)' fill='%23FFFFFF' d='M12.6,16.6c-0.1-0.4-0.2-0.8-0.4-1.6c-0.2-0.6-0.3-0.9-0.5-1.2 c-0.2-0.5-0.3-0.7-0.5-1.2c-0.1-0.3-0.4-1-0.5-1.4c-0.1-0.5,0-0.9,0.2-1.2c0.3-0.3,1-0.5,1.4-0.4c0.4,0.1,0.7,0.5,0.9,0.8 c0.3,0.5,0.4,0.6,0.7,1.5c0.4,1,0.6,1.9,0.6,2.2l0.1,0.5c0,0,0-1.1,0-1.2c0-1-0.1-1.8,0-2.9c0-0.1,0.1-0.6,0.1-0.7 c0.1-0.5,0.3-0.8,0.7-1c0.4-0.2,0.9-0.2,1.4,0c0.4,0.2,0.6,0.5,0.7,1c0,0.1,0.1,1,0.1,1.1c0,1,0,1.6,0,2.2c0,0.2,0,1.6,0,1.5 c0.1-0.7,0.1-3.2,0.3-3.9c0.1-0.4,0.4-0.7,0.8-0.9c0.4-0.2,1.1-0.1,1.4,0.2c0.3,0.3,0.4,0.7,0.5,1.2c0,0.4,0,0.9,0,1.2 c0,0.9,0,1.3,0,2.1c0,0,0,0.3,0,0.2c0.1-0.3,0.2-0.5,0.3-0.7c0-0.1,0.2-0.6,0.4-0.9c0.1-0.2,0.2-0.4,0.4-0.7 c0.2-0.3,0.4-0.4,0.7-0.6c0.5-0.2,1.1,0.1,1.3,0.6c0.1,0.2,0,0.7,0,1.1c-0.1,0.6-0.3,1.3-0.4,1.6c-0.1,0.4-0.3,1.2-0.3,1.6 c-0.1,0.4-0.2,1.4-0.4,1.8c-0.1,0.3-0.4,1-0.7,1.4c0,0-1.1,1.2-1.2,1.8c-0.1,0.6-0.1,0.6-0.1,1c0,0.4,0.1,0.9,0.1,0.9 s-0.8,0.1-1.2,0c-0.4-0.1-0.9-0.8-1-1.1c-0.2-0.3-0.5-0.3-0.7,0c-0.2,0.4-0.7,1.1-1.1,1.1c-0.7,0.1-2.1,0-3.1,0c0,0,0.2-1-0.2-1.4 c-0.3-0.3-0.8-0.8-1.1-1.1l-0.8-0.9c-0.3-0.4-0.6-1.1-1.2-2c-0.3-0.5-1-1.1-1.3-1.6c-0.2-0.4-0.3-1-0.2-1.3 c0.2-0.6,0.7-0.9,1.4-0.8c0.5,0,0.8,0.2,1.2,0.5c0.2,0.2,0.6,0.5,0.8,0.7c0.2,0.2,0.2,0.3,0.4,0.5C12.6,16.8,12.6,16.9,12.6,16.6' /%3E %3Cpath clip-path='url(%23SVGID_2_)' fill='none' stroke='%23000000' stroke-width='0.75' stroke-linecap='round' stroke-linejoin='round' d=' M12.6,16.6c-0.1-0.4-0.2-0.8-0.4-1.6c-0.2-0.6-0.3-0.9-0.5-1.2c-0.2-0.5-0.3-0.7-0.5-1.2c-0.1-0.3-0.4-1-0.5-1.4 c-0.1-0.5,0-0.9,0.2-1.2c0.3-0.3,1-0.5,1.4-0.4c0.4,0.1,0.7,0.5,0.9,0.8c0.3,0.5,0.4,0.6,0.7,1.5c0.4,1,0.6,1.9,0.6,2.2l0.1,0.5 c0,0,0-1.1,0-1.2c0-1-0.1-1.8,0-2.9c0-0.1,0.1-0.6,0.1-0.7c0.1-0.5,0.3-0.8,0.7-1c0.4-0.2,0.9-0.2,1.4,0c0.4,0.2,0.6,0.5,0.7,1 c0,0.1,0.1,1,0.1,1.1c0,1,0,1.6,0,2.2c0,0.2,0,1.6,0,1.5c0.1-0.7,0.1-3.2,0.3-3.9c0.1-0.4,0.4-0.7,0.8-0.9c0.4-0.2,1.1-0.1,1.4,0.2 c0.3,0.3,0.4,0.7,0.5,1.2c0,0.4,0,0.9,0,1.2c0,0.9,0,1.3,0,2.1c0,0,0,0.3,0,0.2c0.1-0.3,0.2-0.5,0.3-0.7c0-0.1,0.2-0.6,0.4-0.9 c0.1-0.2,0.2-0.4,0.4-0.7c0.2-0.3,0.4-0.4,0.7-0.6c0.5-0.2,1.1,0.1,1.3,0.6c0.1,0.2,0,0.7,0,1.1c-0.1,0.6-0.3,1.3-0.4,1.6 c-0.1,0.4-0.3,1.2-0.3,1.6c-0.1,0.4-0.2,1.4-0.4,1.8c-0.1,0.3-0.4,1-0.7,1.4c0,0-1.1,1.2-1.2,1.8c-0.1,0.6-0.1,0.6-0.1,1 c0,0.4,0.1,0.9,0.1,0.9s-0.8,0.1-1.2,0c-0.4-0.1-0.9-0.8-1-1.1c-0.2-0.3-0.5-0.3-0.7,0c-0.2,0.4-0.7,1.1-1.1,1.1 c-0.7,0.1-2.1,0-3.1,0c0,0,0.2-1-0.2-1.4c-0.3-0.3-0.8-0.8-1.1-1.1l-0.8-0.9c-0.3-0.4-0.6-1.1-1.2-2c-0.3-0.5-1-1.1-1.3-1.6 c-0.2-0.4-0.3-1-0.2-1.3c0.2-0.6,0.7-0.9,1.4-0.8c0.5,0,0.8,0.2,1.2,0.5c0.2,0.2,0.6,0.5,0.8,0.7c0.2,0.2,0.2,0.3,0.4,0.5 C12.6,16.8,12.6,16.9,12.6,16.6'/%3E %3Cline clip-path='url(%23SVGID_2_)' fill='none' stroke='%23000000' stroke-width='0.75' stroke-linecap='round' x1='19.6' y1='20.7' x2='19.6' y2='17.3'/%3E %3Cline clip-path='url(%23SVGID_2_)' fill='none' stroke='%23000000' stroke-width='0.75' stroke-linecap='round' x1='17.6' y1='20.7' x2='17.5' y2='17.3'/%3E %3Cline clip-path='url(%23SVGID_2_)' fill='none' stroke='%23000000' stroke-width='0.75' stroke-linecap='round' x1='15.6' y1='17.3' x2='15.6' y2='20.7'/%3E %3C/g%3E %3C/svg%3E",
  "__A_tdesign_logo__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='tdesign:logo-cnb-filled' clip-path='url(%23clip0_0_58)'%3E %3Cpath id='Vector' d='M17.293 2.807C17.329 2.70338 17.3332 2.59135 17.305 2.48532C17.2769 2.3793 17.2177 2.28411 17.135 2.212C15.9775 1.21347 14.528 0.61638 13.003 0.51C10.606 0.336 9.121 0.978 8.371 1.455C8.29626 1.50308 8.23416 1.5684 8.18992 1.64547C8.14568 1.72254 8.1206 1.80911 8.11677 1.8979C8.11295 1.98668 8.13051 2.07508 8.16796 2.15567C8.20541 2.23626 8.26167 2.30668 8.332 2.361L14.441 7.109C14.5658 7.20583 14.712 7.27144 14.8673 7.30037C15.0227 7.32931 15.1826 7.32072 15.334 7.27533C15.4853 7.22994 15.6236 7.14906 15.7374 7.03942C15.8511 6.92978 15.9371 6.79456 15.988 6.645L17.293 2.807ZM2.235 16.9C2.11378 16.9821 2.02138 17.1002 1.97079 17.2376C1.92021 17.3751 1.91398 17.5249 1.953 17.666C2.186 18.501 2.878 20.238 4.843 21.818C6.807 23.398 9.131 23.569 10.124 23.545C10.2691 23.5422 10.4096 23.4938 10.5256 23.4065C10.6416 23.3193 10.7271 23.1977 10.77 23.059L14.685 10.666C14.968 9.771 13.965 9.021 13.187 9.544L2.235 16.9ZM5.097 3.822C5.00212 3.78476 4.90026 3.76868 4.79852 3.7749C4.69679 3.78112 4.59764 3.80948 4.508 3.858C3.784 4.252 1.928 5.468 0.97 7.964C0.232 9.888 0.492 12.016 0.695 13.057C0.762 13.397 1.121 13.593 1.443 13.467L13.192 8.88C14.031 8.553 14.034 7.367 13.197 7.035L5.097 3.822ZM22.525 12.703C22.865 12.933 23.329 12.73 23.388 12.323C23.544 11.248 23.678 9.376 23.056 7.964C22.226 6.082 20.818 4.922 20.149 4.45C20.0462 4.37838 19.9224 4.3433 19.7973 4.35037C19.6722 4.35744 19.5531 4.40625 19.459 4.489L16.494 7.119C16.3811 7.21925 16.2926 7.34393 16.2353 7.48355C16.1779 7.62317 16.1531 7.77404 16.1628 7.92468C16.1726 8.07532 16.2166 8.22174 16.2915 8.35281C16.3664 8.48388 16.4702 8.59612 16.595 8.681L22.525 12.703ZM14.24 22.74C14.21 23.09 14.507 23.38 14.856 23.342C15.979 23.222 18.288 22.776 20.016 21.124C21.2168 19.9653 22.0486 18.4777 22.407 16.848C22.4281 16.7467 22.4266 16.6419 22.4023 16.5413C22.3781 16.4406 22.3319 16.3466 22.267 16.266L17.083 9.87C16.521 9.177 15.402 9.519 15.324 10.407L14.24 22.74Z' fill='black'/%3E %3C/g%3E %3Cdefs%3E %3CclipPath id='clip0_0_58'%3E %3Crect width='24' height='24' fill='white'/%3E %3C/clipPath%3E %3C/defs%3E %3C/svg%3E",
  "__A_tdesign_logo_white__": "data:image/svg+xml,%3Csvg preserveAspectRatio='none' overflow='visible' style='display: block;' width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cg id='tdesign:logo-cnb-filled' clip-path='url(%23clip0_0_58)'%3E %3Cpath id='Vector' d='M17.293 2.807C17.329 2.70338 17.3332 2.59135 17.305 2.48532C17.2769 2.3793 17.2177 2.28411 17.135 2.212C15.9775 1.21347 14.528 0.61638 13.003 0.51C10.606 0.336 9.121 0.978 8.371 1.455C8.29626 1.50308 8.23416 1.5684 8.18992 1.64547C8.14568 1.72254 8.1206 1.80911 8.11677 1.8979C8.11295 1.98668 8.13051 2.07508 8.16796 2.15567C8.20541 2.23626 8.26167 2.30668 8.332 2.361L14.441 7.109C14.5658 7.20583 14.712 7.27144 14.8673 7.30037C15.0227 7.32931 15.1826 7.32072 15.334 7.27533C15.4853 7.22994 15.6236 7.14906 15.7374 7.03942C15.8511 6.92978 15.9371 6.79456 15.988 6.645L17.293 2.807ZM2.235 16.9C2.11378 16.9821 2.02138 17.1002 1.97079 17.2376C1.92021 17.3751 1.91398 17.5249 1.953 17.666C2.186 18.501 2.878 20.238 4.843 21.818C6.807 23.398 9.131 23.569 10.124 23.545C10.2691 23.5422 10.4096 23.4938 10.5256 23.4065C10.6416 23.3193 10.7271 23.1977 10.77 23.059L14.685 10.666C14.968 9.771 13.965 9.021 13.187 9.544L2.235 16.9ZM5.097 3.822C5.00212 3.78476 4.90026 3.76868 4.79852 3.7749C4.69679 3.78112 4.59764 3.80948 4.508 3.858C3.784 4.252 1.928 5.468 0.97 7.964C0.232 9.888 0.492 12.016 0.695 13.057C0.762 13.397 1.121 13.593 1.443 13.467L13.192 8.88C14.031 8.553 14.034 7.367 13.197 7.035L5.097 3.822ZM22.525 12.703C22.865 12.933 23.329 12.73 23.388 12.323C23.544 11.248 23.678 9.376 23.056 7.964C22.226 6.082 20.818 4.922 20.149 4.45C20.0462 4.37838 19.9224 4.3433 19.7973 4.35037C19.6722 4.35744 19.5531 4.40625 19.459 4.489L16.494 7.119C16.3811 7.21925 16.2926 7.34393 16.2353 7.48355C16.1779 7.62317 16.1531 7.77404 16.1628 7.92468C16.1726 8.07532 16.2166 8.22174 16.2915 8.35281C16.3664 8.48388 16.4702 8.59612 16.595 8.681L22.525 12.703ZM14.24 22.74C14.21 23.09 14.507 23.38 14.856 23.342C15.979 23.222 18.288 22.776 20.016 21.124C21.2168 19.9653 22.0486 18.4777 22.407 16.848C22.4281 16.7467 22.4266 16.6419 22.4023 16.5413C22.3781 16.4406 22.3319 16.3466 22.267 16.266L17.083 9.87C16.521 9.177 15.402 9.519 15.324 10.407L14.24 22.74Z' fill='white'/%3E %3C/g%3E %3Cdefs%3E %3CclipPath id='clip0_0_58'%3E %3Crect width='24' height='24' fill='%23292929'/%3E %3C/clipPath%3E %3C/defs%3E %3C/svg%3E"
};

const fill = (markup: string) => markup.replace(/__A_\w+?__/g, (key) => assets[key] ?? "");

const scenes: Record<"light" | "dark", string> = {
  light: fill(`
  <div class="pf-g pf-g-task">
  <div class="pf-card pf-shadow-md-card" style="left:841px; top:359px; width:584px; height:281px;"></div>
  <p class="pf-abs pf-t-title" style="left:884.66px; top:409px;">Task: Web Design</p>
  <p class="pf-abs pf-t-sub" style="left:885px; top:462.87px;">Assigned to&nbsp;</p>
  <div class="pf-abs pf-avatar pf-bg-yellow" style="left:1035.71px; top:451.1px;">
    <img src="__A_male_memoji_2__" alt="">
  </div>
  <div class="pf-abs pf-avatar pf-bg-purple" style="left:1092px; top:451.1px;">
    <img src="__A_male_memoji_1__" alt="">
  </div>
  <div class="pf-abs pf-tech-row" style="left:882.57px; top:525.76px;">
    <div class="pf-pill"><span>Tech-Stack</span></div>
    <div class="pf-icon-row">
      <div class="pf-icon">
        <div class="pf-glow pf-slack"></div>
          <div class="pf-ring pf-slack"></div>
        <div class="pf-tile pf-slack">
          <div class="pf-slack-glyph">
            <img src="__A_group_1__" style="left:0; top:0;" alt="">
            <img src="__A_group_2__" style="left:15.53px; top:0; width:13.934px;" alt="">
            <img src="__A_group_0__" style="left:0; top:15.53px;" alt="">
            <img src="__A_group_3__" style="left:15.53px; top:15.53px;" alt="">
          </div>
        </div>
      </div>
      <div class="pf-icon">
        <div class="pf-glow pf-gmail"></div>
          <div class="pf-ring pf-gmail"></div>
        <div class="pf-tile pf-gmail"><img src="__A_gmail__" alt=""></div>
      </div>
      <div class="pf-icon">
        <div class="pf-glow pf-figma"></div>
          <div class="pf-ring pf-figma pf-grad"></div>
        <div class="pf-tile pf-figma"><img src="__A_figma__" alt=""></div>
      </div>
      <div class="pf-icon">
        <div class="pf-glow pf-framer"></div>
          <div class="pf-ring pf-framer pf-grad"></div>
        <div class="pf-tile pf-framer"><div class="pf-fill"><img src="__A_framer__" alt=""></div></div>
      </div>
      <div class="pf-icon">
        <div class="pf-glow pf-clickup"></div>
          <div class="pf-ring pf-clickup pf-grad"></div>
        <div class="pf-tile pf-clickup"><img src="__A_clickup__" alt=""></div>
      </div>
    </div>
  </div>
  </div>
  <div class="pf-g pf-g-addon">
  <div class="pf-g pf-addon-pulse">
  <div class="pf-g pf-addon-veil">
  <div class="pf-card-unit pf-sq9-unit" style="left:264.75px; top:816.85px; width:702px; height:340px;">
    <div class="pf-card pf-shadow-sq9" style="left:0; top:0; width:702px; height:340px;"></div>
    <p class="pf-abs pf-t-title" style="left:43.66px; top:50px;">Subtasks: List Below</p>
    <p class="pf-abs pf-t-sub" style="left:44px; top:103.87px;">Assigned to&nbsp;</p>
    <div class="pf-abs" style="left:194.71px; top:92.1px; display:flex; align-items:center; gap:var(--tc-space-1-5, 6px);">
      <div class="pf-avatar pf-bg-yellow"><img src="__A_male_memoji_2__" alt=""></div>
      <div class="pf-avatar pf-bg-purple"><img src="__A_male_memoji_1__" alt=""></div>
      <div class="pf-avatar pf-bg-pink"><img src="__A_male_memoji_3__" alt=""></div>
    </div>
  </div>
  <div class="pf-card-unit pf-sq10-unit" style="left:293.34px; top:973.67px; width:644.82px; height:281px;">
    <div class="pf-card pf-shadow-sq10" style="left:0; top:0; width:644.82px; height:281px;"></div>
    <p class="pf-abs pf-t-title" style="left:43.66px; top:50px;">Subtask 1: Create Wireframe</p>
    <p class="pf-abs pf-t-sub" style="left:44px; top:103.87px;">Assigned to&nbsp;</p>
    <div class="pf-abs pf-avatar pf-bg-purple" style="left:194.71px; top:92.1px;">
      <img src="__A_male_memoji_1__" alt="">
    </div>
    <div class="pf-abs pf-tech-row" style="left:41.57px; top:166.76px;">
      <div class="pf-pill"><span>Tech-Stack</span></div>
      <div class="pf-icon-row">
        <div class="pf-icon">
          <div class="pf-glow pf-slack"></div>
          <div class="pf-ring pf-slack"></div>
          <div class="pf-tile pf-slack">
            <div class="pf-slack-glyph">
              <img src="__A_group_1__" style="left:0; top:0;" alt="">
              <img src="__A_group_2__" style="left:15.53px; top:0; width:13.934px;" alt="">
              <img src="__A_group_0__" style="left:0; top:15.53px;" alt="">
              <img src="__A_group_3__" style="left:15.53px; top:15.53px;" alt="">
            </div>
          </div>
        </div>
        <div class="pf-icon">
          <div class="pf-glow pf-gmail pf-strong"></div>
          <div class="pf-ring pf-gmail"></div>
          <div class="pf-tile pf-gmail"><img src="__A_gmail__" alt=""></div>
        </div>
        <div class="pf-icon">
          <div class="pf-glow pf-figma"></div>
          <div class="pf-ring pf-figma pf-grad"></div>
          <div class="pf-tile pf-figma"><img src="__A_figma__" alt=""></div>
        </div>
        <div class="pf-icon">
          <div class="pf-glow pf-framer"></div>
          <div class="pf-ring pf-framer pf-grad"></div>
          <div class="pf-tile pf-framer"><div class="pf-fill"><img src="__A_framer__" alt=""></div></div>
        </div>
      </div>
    </div>
  </div>
  <div class="pf-abs pf-hand" style="left:759px; top:762.73px; width:167.06px; height:167.06px; transform:rotate(-0.85deg);">
    <div class="pf-hand-grab">
      <img src="__A_clip_0__" style="position:absolute; inset:0; width:100%; height:100%;" alt="">
      <img src="__A_clip_1__" style="position:absolute; inset:0; width:100%; height:100%;" alt="">
      <img src="__A_clip_2__" style="position:absolute; inset:0; width:100%; height:100%;" alt="">
      <img src="__A_clip_3__" style="position:absolute; inset:0; width:100%; height:100%;" alt="">
      <img src="__A_clip_4__" style="position:absolute; inset:0; width:100%; height:100%;" alt="">
    </div>
    <img class="pf-hand-open" src="__A_hand_open__" alt="">
    </div>
  </div>
  </div>
  </div>
  <div class="pf-g pf-g-client">
  <div class="pf-card pf-shadow-sm-card" style="left:807px; top:152px; width:652px; height:138px;"></div>
  <div class="pf-vline" style="left:1158px; top:191px;"></div>
  <p class="pf-abs pf-t-sub" style="left:1181px; top:208px;">Onboarded: 25 Jun</p>
  <div class="pf-abs" style="left:850.66px; top:189px; display:flex; align-items:center; gap:var(--tc-space-2-5, 10px);">
    <p class="pf-t-title">Client:</p>
    <div class="pf-client-icon">
      <div class="pf-backdrop"></div>
      <div class="pf-glow"></div>
      <div class="pf-face"></div>
      <img class="pf-logo" src="__A_tdesign_logo__" alt="">
    </div>
    <p class="pf-t-title">Unify</p>
  </div>
  </div>
  <div class="pf-g pf-g-notes">
  <div class="pf-card pf-shadow-sm-card" style="left:1493px; top:428px; width:615px; height:138px;"></div>
  <p class="pf-abs pf-t-sub" style="left:1857px; top:485px;">Updated: Today</p>
  <p class="pf-abs pf-t-title" style="left:1603px; top:478px;">Client Notes</p>
  <div class="pf-abs pf-client-icon" style="left:1531px; top:465px; height:61.615px;">
    <div class="pf-backdrop"></div>
    <div class="pf-glow" style="left:4.64px; top:53px;"></div>
    <div class="pf-face" style="left:4.31px; top:4.41px;"></div>
    <img class="pf-logo" src="__A_tdesign_logo__" style="left:18.34px; top:20px;" alt="">
  </div>
  <div class="pf-vline" style="left:1836px; top:467px;"></div>
  </div>
  <div class="pf-g pf-g-pm">
  <div class="pf-card pf-shadow-md-card" style="left:1335px; top:910px; width:584px; height:281px;"></div>
  <p class="pf-abs pf-t-title" style="left:1501.94px; top:973.97px;">Project Manager</p>
  <p class="pf-abs pf-t-sub" style="left:1501.29px; top:1020.84px;">Managing Project Progress</p>
  <div class="pf-abs pf-avatar-lg pf-bg-yellow" style="left:1376.57px; top:958.57px;">
    <img src="__A_male_memoji_2__" alt="">
  </div>
  <div class="pf-abs pf-tech-row" style="left:1376.57px; top:1079.76px;">
    <div class="pf-pill"><span>Tech-Stack</span></div>
    <div class="pf-icon-row">
      <div class="pf-icon">
        <div class="pf-glow pf-slack"></div>
          <div class="pf-ring pf-slack"></div>
        <div class="pf-tile pf-slack">
          <div class="pf-slack-glyph">
            <img src="__A_group_1__" style="left:0; top:0;" alt="">
            <img src="__A_group_2__" style="left:15.53px; top:0; width:13.934px;" alt="">
            <img src="__A_group_0__" style="left:0; top:15.53px;" alt="">
            <img src="__A_group_3__" style="left:15.53px; top:15.53px;" alt="">
          </div>
        </div>
      </div>
      <div class="pf-icon">
        <div class="pf-glow pf-gmail"></div>
          <div class="pf-ring pf-gmail"></div>
        <div class="pf-tile pf-gmail"><img src="__A_gmail__" alt=""></div>
      </div>
      <div class="pf-icon">
        <div class="pf-glow pf-clickup"></div>
          <div class="pf-ring pf-clickup pf-grad"></div>
        <div class="pf-tile pf-clickup"><img src="__A_clickup__" alt=""></div>
      </div>
    </div>
  </div>
  </div>
  <div class="pf-g pf-g-ux">
  <div class="pf-card pf-shadow-md-card" style="left:1335px; top:1235px; width:584px; height:281px;"></div>
  <p class="pf-abs pf-t-title" style="left:1501.94px; top:1298.97px;">UX Designer</p>
  <p class="pf-abs pf-t-sub" style="left:1501.29px; top:1345.84px;">Designing UX Elements</p>
  <div class="pf-abs pf-avatar-lg pf-bg-purple" style="left:1376.57px; top:1283.57px;">
    <img src="__A_male_memoji_1__" alt="">
  </div>
  <div class="pf-abs pf-tech-row" style="left:1376.57px; top:1404.76px;">
    <div class="pf-pill"><span>Tech-Stack</span></div>
    <div class="pf-icon-row">
      <div class="pf-icon">
        <div class="pf-glow pf-slack"></div>
          <div class="pf-ring pf-slack"></div>
        <div class="pf-tile pf-slack">
          <div class="pf-slack-glyph">
            <img src="__A_group_1__" style="left:0; top:0;" alt="">
            <img src="__A_group_2__" style="left:15.53px; top:0; width:13.934px;" alt="">
            <img src="__A_group_0__" style="left:0; top:15.53px;" alt="">
            <img src="__A_group_3__" style="left:15.53px; top:15.53px;" alt="">
          </div>
        </div>
      </div>
      <div class="pf-icon">
        <div class="pf-glow pf-figma"></div>
          <div class="pf-ring pf-figma pf-grad"></div>
        <div class="pf-tile pf-figma"><img src="__A_figma__" alt=""></div>
      </div>
      <div class="pf-icon">
        <div class="pf-glow pf-framer"></div>
          <div class="pf-ring pf-framer pf-grad"></div>
        <div class="pf-tile pf-framer"><div class="pf-fill"><img src="__A_framer__" alt=""></div></div>
      </div>
    </div>
  </div>
  </div>
  <div class="pf-abs" style="left:1121px; top:626px; width:514.5px; height:285px;">
    <svg width="517" height="285" viewBox="0 0 517 285" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <path class="pf-draw" style="animation-duration:.6s; animation-delay:1.5s;" pathLength="1" d="M12 21V56C12 78.0914 29.9086 96 52 96H474.5C496.591 96 514.5 113.909 514.5 136L514.5 285" stroke="#82BCFF" stroke-width="5"/>
      <circle class="pf-dot" style="animation-delay:1.3s;" cx="12" cy="12" r="9" fill="white" stroke="#82BCFF" stroke-width="6"/>
    </svg>
  </div>
  <div class="pf-abs" style="left:600px; top:626px; width:545px; height:195px;">
    <svg width="545" height="195" viewBox="0 0 545 195" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <path class="pf-draw" style="animation-duration:.45s; animation-delay:5.05s;" pathLength="1" d="M533 21V56C533 78.0914 515.091 96 493 96H55.75C33.6586 96 15.75 113.909 15.75 136L15.75 190.85" stroke="#82BCFF" stroke-width="5"/>
    </svg>
  </div>
  <div class="pf-abs" style="left:1121px; top:277px; width:24px; height:82px;">
    <svg width="24" height="82" viewBox="0 0 24 82" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <line class="pf-draw" style="animation-duration:.3s; animation-delay:.6s;" pathLength="1" x1="12.5" y1="13" x2="12.5" y2="82" stroke="#82BCFF" stroke-width="5"/>
      <circle class="pf-dot" style="animation-delay:.45s;" cx="12" cy="12" r="9" fill="white" stroke="#82BCFF" stroke-width="6"/>
    </svg>
  </div>
  <div class="pf-abs" style="left:1615px; top:1176px; width:24px; height:59px;">
    <svg width="24" height="59" viewBox="0 0 24 59" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <path class="pf-draw" style="animation-duration:.25s; animation-delay:2.65s;" pathLength="1" d="M12.4999 13L12.5 59" stroke="#82BCFF" stroke-width="5"/>
      <circle class="pf-dot" style="animation-delay:2.5s;" cx="12" cy="12" r="9" fill="white" stroke="#82BCFF" stroke-width="6"/>
    </svg>
  </div>
  <div class="pf-abs" style="left:1411px; top:487px; width:82px; height:24px;">
    <svg width="82" height="24" viewBox="0 0 82 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <line class="pf-draw" style="animation-duration:.3s; animation-delay:1.5s;" pathLength="1" x1="13" y1="12" x2="82" y2="12" stroke="#82BCFF" stroke-width="5"/>
      <circle class="pf-dot" style="animation-delay:1.3s;" cx="12" cy="12" r="9" fill="white" stroke="#82BCFF" stroke-width="6"/>
    </svg>
  </div>
  <div class="pf-g pf-g-roles">
  <div class="pf-card pf-shadow-sm-card" style="left:1497px; top:783px; width:272px; height:89px; border-radius:24px;"></div>
  <p class="pf-abs" style="left:1633px; top:814px; transform:translateX(-50%); font-weight:500; font-size:var(--tc-project-flow-sub-size); line-height:26.333px; letter-spacing:var(--tc-tracking-snug); color:var(--tc-project-flow-sub); text-align:center; white-space:nowrap;">Assigned Roles</p>
  </div>
  <div class="pf-abs" style="left:662px; top:686px; width:471.041px; height:105.368px;">
    <svg width="473.129" height="108.519" viewBox="0 0 473.129 108.519" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <defs>
        <mask id="__MASK__" maskUnits="userSpaceOnUse" x="-10" y="-10" width="493" height="128">
          <path class="pf-draw" style="animation: ui-pf-draw-line .75s cubic-bezier(.2,.75,.25,1) 3.4s both, ui-pf-undraw-line .5s ease-in 4.8s both;" pathLength="1" d="M471.088 0.101136C473.088 39.6011 401.588 67.1011 343.088 69.6011C284.588 72.1011 224.588 22.6011 147.588 20.1011C70.5881 17.6011 10.5881 55.6011 9.58809 96.1011" stroke="#fff" stroke-width="16"/>
        </mask>
      </defs>
      <g mask="url(#__MASK__)">
        <path d="M471.088 0.101136C473.088 39.6011 401.588 67.1011 343.088 69.6011C284.588 72.1011 224.588 22.6011 147.588 20.1011C70.5881 17.6011 10.5881 55.6011 9.58809 96.1011" stroke="#82BCFF" stroke-width="4" stroke-dasharray="10 10"/>
      </g>
      <path class="pf-arrow-head" d="M18.4813 93.0981L8.76344 105.469L1.47216 91.4066" stroke="#82BCFF" stroke-width="3.31653"/>
    </svg>
  </div>
  <div class="pf-edge-overlay pf-one"></div>
  <div class="pf-edge-overlay pf-two"></div>`),
  dark: fill(`
  <div class="pf-g pf-g-task">
  <div class="pf-card pf-shadow-md-card" style="left:841px; top:359px; width:584px; height:281px;"></div>
  <p class="pf-abs pf-t-title" style="left:884.66px; top:409px;">Task: Web Design</p>
  <p class="pf-abs pf-t-sub" style="left:885px; top:462.87px;">Assigned to&nbsp;</p>
  <div class="pf-abs pf-avatar pf-bg-yellow" style="left:1035.71px; top:451.1px;">
    <img src="__A_male_memoji_2__" alt="">
  </div>
  <div class="pf-abs pf-avatar pf-bg-purple" style="left:1092px; top:451.1px;">
    <img src="__A_male_memoji_1__" alt="">
  </div>
  <div class="pf-abs pf-tech-row" style="left:882.57px; top:525.76px;">
    <div class="pf-pill"><span>Tech-Stack</span></div>
    <div class="pf-icon-row">
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-slack"></div>
          <div class="pf-glow pf-slack"></div>
        <div class="pf-tile pf-slack">
          <div class="pf-slack-glyph">
            <img src="__A_group_1__" style="left:0; top:0;" alt="">
            <img src="__A_group_2__" style="left:15.53px; top:0; width:13.934px;" alt="">
            <img src="__A_group_0__" style="left:0; top:15.53px;" alt="">
            <img src="__A_group_3__" style="left:15.53px; top:15.53px;" alt="">
          </div>
        </div>
      </div>
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-gmail"></div>
          <div class="pf-glow pf-gmail"></div>
        <div class="pf-tile pf-gmail pf-tile-shadow"><img src="__A_gmail__" alt=""></div>
      </div>
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-figma"></div>
          <div class="pf-glow pf-figma"></div>
        <div class="pf-tile pf-figma"><img src="__A_figma__" alt=""></div>
      </div>
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-framer"></div>
          <div class="pf-glow pf-framer"></div>
        <div class="pf-tile pf-framer"><div class="pf-fill"><img src="__A_framer__" alt=""></div></div>
      </div>
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-clickup"></div>
          <div class="pf-glow pf-clickup"></div>
        <div class="pf-tile pf-clickup pf-tile-shadow"><img src="__A_clickup__" alt=""></div>
      </div>
    </div>
  </div>
  </div>
  <div class="pf-g pf-g-addon">
  <div class="pf-g pf-addon-pulse">
  <div class="pf-g pf-addon-veil">
  <div class="pf-card-unit pf-sq9-unit" style="left:264.75px; top:816.85px; width:702px; height:340px;">
    <div class="pf-card pf-shadow-sq9" style="left:0; top:0; width:702px; height:340px;"></div>
    <p class="pf-abs pf-t-title" style="left:43.66px; top:50px;">Subtasks: List Below</p>
    <p class="pf-abs pf-t-sub" style="left:44px; top:103.87px;">Assigned to&nbsp;</p>
    <div class="pf-abs" style="left:194.71px; top:92.1px; display:flex; align-items:center; gap:var(--tc-space-1-5, 6px);">
      <div class="pf-avatar pf-bg-yellow"><img src="__A_male_memoji_2__" alt=""></div>
      <div class="pf-avatar pf-bg-purple"><img src="__A_male_memoji_1__" alt=""></div>
      <div class="pf-avatar pf-bg-pink"><img src="__A_male_memoji_3__" alt=""></div>
    </div>
  </div>
  <div class="pf-card-unit pf-sq10-unit" style="left:293.34px; top:973.67px; width:644.82px; height:281px;">
    <div class="pf-card pf-shadow-sq10" style="left:0; top:0; width:644.82px; height:281px;"></div>
    <p class="pf-abs pf-t-title" style="left:43.66px; top:50px;">Subtask 1: Create Wireframe</p>
    <p class="pf-abs pf-t-sub" style="left:44px; top:103.87px;">Assigned to&nbsp;</p>
    <div class="pf-abs pf-avatar pf-bg-purple" style="left:194.71px; top:92.1px;">
      <img src="__A_male_memoji_1__" alt="">
    </div>
    <div class="pf-abs pf-tech-row" style="left:41.57px; top:166.76px;">
      <div class="pf-pill"><span>Tech-Stack</span></div>
      <div class="pf-icon-row">
        <div class="pf-icon">
          <div class="pf-backdrop pf-bd-slack"></div>
          <div class="pf-glow pf-slack"></div>
          <div class="pf-tile pf-slack">
          <div class="pf-slack-glyph">
            <img src="__A_group_1__" style="left:0; top:0;" alt="">
            <img src="__A_group_2__" style="left:15.53px; top:0; width:13.934px;" alt="">
            <img src="__A_group_0__" style="left:0; top:15.53px;" alt="">
            <img src="__A_group_3__" style="left:15.53px; top:15.53px;" alt="">
          </div>
        </div>
        </div>
        <div class="pf-icon">
          <div class="pf-backdrop pf-bd-gmail"></div>
          <div class="pf-glow pf-gmail"></div>
          <div class="pf-tile pf-gmail pf-tile-shadow"><img src="__A_gmail__" alt=""></div>
        </div>
        <div class="pf-icon">
          <div class="pf-backdrop pf-bd-figma"></div>
          <div class="pf-glow pf-figma"></div>
          <div class="pf-tile pf-figma"><img src="__A_figma__" alt=""></div>
        </div>
        <div class="pf-icon">
          <div class="pf-backdrop pf-bd-framer"></div>
          <div class="pf-glow pf-framer"></div>
          <div class="pf-tile pf-framer"><div class="pf-fill"><img src="__A_framer__" alt=""></div></div>
        </div>
      </div>
    </div>
  </div>
  <div class="pf-abs pf-hand" style="left:759px; top:762.73px; width:167.06px; height:167.06px; transform:rotate(-0.85deg);">
    <div class="pf-hand-grab">
      <img src="__A_clip_0__" style="position:absolute; inset:0; width:100%; height:100%;" alt="">
      <img src="__A_clip_1__" style="position:absolute; inset:0; width:100%; height:100%;" alt="">
      <img src="__A_clip_2__" style="position:absolute; inset:0; width:100%; height:100%;" alt="">
      <img src="__A_clip_3__" style="position:absolute; inset:0; width:100%; height:100%;" alt="">
      <img src="__A_clip_4__" style="position:absolute; inset:0; width:100%; height:100%;" alt="">
    </div>
    <img class="pf-hand-open" src="__A_hand_open__" alt="">
    </div>
  </div>
  </div>
  </div>
  <div class="pf-g pf-g-client">
  <div class="pf-card pf-shadow-sm-card" style="left:807px; top:152px; width:652px; height:138px;"></div>
  <div class="pf-vline" style="left:1158px; top:191px;"></div>
  <p class="pf-abs pf-t-sub" style="left:1181px; top:208px;">Onboarded: 25 Jun</p>
  <div class="pf-abs" style="left:850.66px; top:189px; display:flex; align-items:center; gap:var(--tc-space-2-5, 10px);">
    <p class="pf-t-title">Client:</p>
    <div class="pf-client-icon">
      <div class="pf-backdrop"></div>
      <div class="pf-glow"></div>
      <div class="pf-face"></div>
      <img class="pf-logo" src="__A_tdesign_logo_white__" alt="">
    </div>
    <p class="pf-t-title">Unify</p>
  </div>
  </div>
  <div class="pf-g pf-g-notes">
  <div class="pf-card pf-shadow-sm-card" style="left:1493px; top:428px; width:615px; height:138px;"></div>
  <p class="pf-abs pf-t-sub" style="left:1857px; top:485px;">Updated: Today</p>
  <p class="pf-abs pf-t-title" style="left:1603px; top:478px;">Client Notes</p>
  <div class="pf-abs pf-client-icon" style="left:1531px; top:465px; height:61.615px;">
    <div class="pf-backdrop"></div>
    <div class="pf-glow" style="left:4.64px; top:53px;"></div>
    <div class="pf-face" style="left:4.31px; top:4.41px;"></div>
    <img class="pf-logo" src="__A_tdesign_logo_white__" style="left:18.34px; top:20px;" alt="">
  </div>
  <div class="pf-vline" style="left:1836px; top:467px;"></div>
  </div>
  <div class="pf-g pf-g-pm">
  <div class="pf-card pf-shadow-md-card" style="left:1335px; top:910px; width:584px; height:281px;"></div>
  <p class="pf-abs pf-t-title" style="left:1501.94px; top:973.97px;">Project Manager</p>
  <p class="pf-abs pf-t-sub" style="left:1501.29px; top:1020.84px;">Managing Project Progress</p>
  <div class="pf-abs pf-avatar-lg pf-bg-yellow" style="left:1376.57px; top:958.57px;">
    <img src="__A_male_memoji_2__" alt="">
  </div>
  <div class="pf-abs pf-tech-row" style="left:1376.57px; top:1079.76px;">
    <div class="pf-pill"><span>Tech-Stack</span></div>
    <div class="pf-icon-row">
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-slack"></div>
          <div class="pf-glow pf-slack"></div>
        <div class="pf-tile pf-slack">
          <div class="pf-slack-glyph">
            <img src="__A_group_1__" style="left:0; top:0;" alt="">
            <img src="__A_group_2__" style="left:15.53px; top:0; width:13.934px;" alt="">
            <img src="__A_group_0__" style="left:0; top:15.53px;" alt="">
            <img src="__A_group_3__" style="left:15.53px; top:15.53px;" alt="">
          </div>
        </div>
      </div>
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-gmail"></div>
          <div class="pf-glow pf-gmail"></div>
        <div class="pf-tile pf-gmail pf-tile-shadow"><img src="__A_gmail__" alt=""></div>
      </div>
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-clickup"></div>
          <div class="pf-glow pf-clickup"></div>
        <div class="pf-tile pf-clickup pf-tile-shadow"><img src="__A_clickup__" alt=""></div>
      </div>
    </div>
  </div>
  </div>
  <div class="pf-g pf-g-ux">
  <div class="pf-card pf-shadow-md-card" style="left:1335px; top:1235px; width:584px; height:281px;"></div>
  <p class="pf-abs pf-t-title" style="left:1501.94px; top:1298.97px;">UX Designer</p>
  <p class="pf-abs pf-t-sub" style="left:1501.29px; top:1345.84px;">Designing UX Elements</p>
  <div class="pf-abs pf-avatar-lg pf-bg-purple" style="left:1376.57px; top:1283.57px;">
    <img src="__A_male_memoji_1__" alt="">
  </div>
  <div class="pf-abs pf-tech-row" style="left:1376.57px; top:1404.76px;">
    <div class="pf-pill"><span>Tech-Stack</span></div>
    <div class="pf-icon-row">
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-slack"></div>
          <div class="pf-glow pf-slack"></div>
        <div class="pf-tile pf-slack">
          <div class="pf-slack-glyph">
            <img src="__A_group_1__" style="left:0; top:0;" alt="">
            <img src="__A_group_2__" style="left:15.53px; top:0; width:13.934px;" alt="">
            <img src="__A_group_0__" style="left:0; top:15.53px;" alt="">
            <img src="__A_group_3__" style="left:15.53px; top:15.53px;" alt="">
          </div>
        </div>
      </div>
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-figma"></div>
          <div class="pf-glow pf-figma"></div>
        <div class="pf-tile pf-figma"><img src="__A_figma__" alt=""></div>
      </div>
      <div class="pf-icon">
        <div class="pf-backdrop pf-bd-framer"></div>
          <div class="pf-glow pf-framer"></div>
        <div class="pf-tile pf-framer"><div class="pf-fill"><img src="__A_framer__" alt=""></div></div>
      </div>
    </div>
  </div>
  </div>
  <div class="pf-abs" style="left:1121px; top:626px; width:514.5px; height:285px;">
    <svg width="517" height="285" viewBox="0 0 517 285" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <path class="pf-draw" style="animation-duration:.6s; animation-delay:1.5s;" pathLength="1" d="M12 21V56C12 78.0914 29.9086 96 52 96H474.5C496.591 96 514.5 113.909 514.5 136L514.5 285" stroke="#82BCFF" stroke-width="5"/>
      <circle class="pf-dot" style="animation-delay:1.3s;" cx="12" cy="12" r="9" fill="white" stroke="#82BCFF" stroke-width="6"/>
    </svg>
  </div>
  <div class="pf-abs" style="left:600px; top:626px; width:545px; height:195px;">
    <svg width="545" height="195" viewBox="0 0 545 195" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <path class="pf-draw" style="animation-duration:.45s; animation-delay:5.05s;" pathLength="1" d="M533 21V56C533 78.0914 515.091 96 493 96H55.75C33.6586 96 15.75 113.909 15.75 136L15.75 190.85" stroke="#82BCFF" stroke-width="5"/>
    </svg>
  </div>
  <div class="pf-abs" style="left:1121px; top:277px; width:24px; height:82px;">
    <svg width="24" height="82" viewBox="0 0 24 82" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <line class="pf-draw" style="animation-duration:.3s; animation-delay:.6s;" pathLength="1" x1="12.5" y1="13" x2="12.5" y2="82" stroke="#82BCFF" stroke-width="5"/>
      <circle class="pf-dot" style="animation-delay:.45s;" cx="12" cy="12" r="9" fill="white" stroke="#82BCFF" stroke-width="6"/>
    </svg>
  </div>
  <div class="pf-abs" style="left:1615px; top:1176px; width:24px; height:59px;">
    <svg width="24" height="59" viewBox="0 0 24 59" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <path class="pf-draw" style="animation-duration:.25s; animation-delay:2.65s;" pathLength="1" d="M12.4999 13L12.5 59" stroke="#82BCFF" stroke-width="5"/>
      <circle class="pf-dot" style="animation-delay:2.5s;" cx="12" cy="12" r="9" fill="white" stroke="#82BCFF" stroke-width="6"/>
    </svg>
  </div>
  <div class="pf-abs" style="left:1411px; top:487px; width:82px; height:24px;">
    <svg width="82" height="24" viewBox="0 0 82 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <line class="pf-draw" style="animation-duration:.3s; animation-delay:1.5s;" pathLength="1" x1="13" y1="12" x2="82" y2="12" stroke="#82BCFF" stroke-width="5"/>
      <circle class="pf-dot" style="animation-delay:1.3s;" cx="12" cy="12" r="9" fill="white" stroke="#82BCFF" stroke-width="6"/>
    </svg>
  </div>
  <div class="pf-g pf-g-roles">
  <div class="pf-card pf-shadow-sm-card" style="left:1497px; top:783px; width:272px; height:89px; border-radius:24px;"></div>
  <p class="pf-abs" style="left:1633px; top:814px; transform:translateX(-50%); font-weight:500; font-size:var(--tc-project-flow-sub-size); line-height:26.333px; letter-spacing:var(--tc-tracking-snug); color:var(--tc-project-flow-sub); text-align:center; white-space:nowrap;">Assigned Roles</p>
  </div>
  <div class="pf-abs" style="left:662px; top:686px; width:471.041px; height:105.368px;">
    <svg width="473.129" height="108.519" viewBox="0 0 473.129 108.519" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      <defs>
        <mask id="__MASK__" maskUnits="userSpaceOnUse" x="-10" y="-10" width="493" height="128">
          <path class="pf-draw" style="animation: ui-pf-draw-line .75s cubic-bezier(.2,.75,.25,1) 3.4s both, ui-pf-undraw-line .5s ease-in 4.8s both;" pathLength="1" d="M471.088 0.101136C473.088 39.6011 401.588 67.1011 343.088 69.6011C284.588 72.1011 224.588 22.6011 147.588 20.1011C70.5881 17.6011 10.5881 55.6011 9.58809 96.1011" stroke="#fff" stroke-width="16"/>
        </mask>
      </defs>
      <g mask="url(#__MASK__)">
        <path d="M471.088 0.101136C473.088 39.6011 401.588 67.1011 343.088 69.6011C284.588 72.1011 224.588 22.6011 147.588 20.1011C70.5881 17.6011 10.5881 55.6011 9.58809 96.1011" stroke="#82BCFF" stroke-width="4" stroke-dasharray="10 10"/>
      </g>
      <path class="pf-arrow-head" d="M18.4813 93.0981L8.76344 105.469L1.47216 91.4066" stroke="#82BCFF" stroke-width="3.31653"/>
    </svg>
  </div>
  <div class="pf-edge-overlay pf-one"></div>
  <div class="pf-edge-overlay pf-two"></div>`),
};

/**
 * Cards for a task, its subtasks, roles and tech stack build up one after another.
 * @tag tc-project-flow
 */
export class TcProjectFlow extends TcElement {
  static override ui = "pf";
  static override looks = false;

  /** Light or dark cards; without it the scene follows the page theme */
  @property() accessor theme: "light" | "dark" | undefined = undefined;
  /** Describes the scene to assistive tech (role="img"); without it the illustration is decorative and hidden */
  @property() accessor label: string | undefined = undefined;

  /** @internal The colour scheme in use where the element sits */
  @state() accessor pageScheme: "light" | "dark" = "light";
  /** @internal The scheme changed after it connected: the swapped-in scene shows finished */
  @state() accessor settled = false;

  /** @internal Mask id, unique per instance */
  private readonly maskId = `ui-pf-mask${++seq}`;
  /** @internal */
  private readonly screen = new OnScreenController(this);
  /** @internal */
  private resize?: ResizeObserver;
  /** @internal */
  private themeWatch?: MutationObserver;
  /** @internal */
  private media?: MediaQueryList;
  /** @internal The first read after connecting doesn't count as a change */
  private firstRead = true;

  override connectedCallback() {
    super.connectedCallback();
    // Read before the first paint (the element's CSS is adopted by now), then whenever an ancestor's theme
    // attributes or the OS setting change
    this.firstRead = true;
    this.readScheme();
    this.themeWatch = new MutationObserver((records) => {
      if (records.some((r) => r.target instanceof Node && r.target.contains(this))) this.readScheme();
    });
    this.themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: THEME_ATTRS, subtree: true });
    this.media = window.matchMedia?.("(prefers-color-scheme: dark)");
    this.media?.addEventListener?.("change", this.readScheme);
    this.resize = new ResizeObserver(this.fit);
    this.resize.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.themeWatch?.disconnect();
    this.media?.removeEventListener?.("change", this.readScheme);
    this.resize?.disconnect();
  }

  /** @internal The text colour comes from light-dark(), so a light ink means dark */
  private readScheme = () => {
    if (this.theme !== undefined) return;
    const [r, g, b] = (getComputedStyle(this).color.match(/[\d.]+/g) ?? ["0", "0", "0"]).map(Number);
    const next = 0.2126 * r + 0.7152 * g + 0.0722 * b > 128 ? "dark" : "light";
    if (next !== this.pageScheme && !this.firstRead) this.settled = true;
    this.pageScheme = next;
    this.firstRead = false;
  };

  /** @internal Scales the artboard to the width; the stage stays hidden until it has a size */
  private fit = () => {
    const stage = this.querySelector<HTMLElement>(":scope > .pf-stage");
    if (!stage) return;
    const scale = this.clientWidth / W;
    stage.style.transform = `scale(${scale})`;
    stage.style.visibility = scale > 0 ? "" : "hidden";
  };

  /** @internal The scene in use */
  get scene() {
    return this.theme ?? this.pageScheme;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // Unpinned again: follow the page from here
    if (changed.has("theme") && changed.get("theme") !== undefined && this.theme === undefined) {
      this.firstRead = true;
      this.readScheme();
    }
    if (this.theme) this.setAttribute("data-theme", this.theme);
    else this.removeAttribute("data-theme");
    this.dataset.scene = this.scene;
    this.toggleAttribute("data-settled", this.settled);
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  protected override updated() {
    // A described image when there's a label, otherwise decoration that assistive tech skips
    if (this.label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label);
      this.removeAttribute("aria-hidden");
    } else {
      if (this.getAttribute("role") === "img") this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
    this.fit();
  }

  protected override render() {
    const scene = this.scene;
    // A new stage per scene, so the swapped-in one starts fresh
    return keyed(scene, html`<div class="pf-stage" aria-hidden="true" style="visibility: hidden">${unsafeHTML(scenes[scene].replaceAll("__MASK__", this.maskId))}</div>`);
  }

  static override css = /* css */ `
/* Theme: the colours below use light-dark(), which follows color-scheme – the page theme (.dark, data-theme /
   data-tc-theme or the OS setting) unless the theme prop pins it */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="pf"] {
  /* Background of the artboard (transparent by default), the color the edges fade into, and the dot grid */
  --tc-project-flow-bg: transparent;
  --tc-project-flow-fade: light-dark(#ffffff, #141414);
  --tc-project-flow-dot: light-dark(#f2f2f2, #272727);
  /* Scene colours, light and dark */
  --tc-project-flow-card: light-dark(#ffffff, #1a1a1a);
  --tc-project-flow-card-edge: light-dark(#efeeee, #202020);
  --tc-project-flow-card-border: 2px;
  --tc-project-flow-title: light-dark(#1b1b1b, #ffffff);
  /* Secondary lines: #737373 is 4.7 : 1 on the white card (the old #989898 was 2.9 : 1) */
  --tc-project-flow-sub: light-dark(#737373, rgba(255, 255, 255, 0.6));
  --tc-project-flow-pill: light-dark(#fdf7e8, #352d19);
  /* The dark pill has no visible edge: its border takes the fill colour, so the box stays the same size */
  --tc-project-flow-pill-edge: light-dark(#ffebb9, #352d19);
  /* Pill text: #8a6510 is 4.9 : 1 on the pale yellow (the old #bf9221 was 2.7 : 1) */
  --tc-project-flow-pill-text: light-dark(#8a6510, #eeb629);
  --tc-project-flow-pill-weight: 500;
  --tc-project-flow-tile: light-dark(#ffffff, #292929);
  --tc-project-flow-tile-end: light-dark(#f8f8f8, #292929);
  --tc-project-flow-avatar-purple: light-dark(#f0e8fd, #2e2653);
  --tc-project-flow-avatar-yellow: light-dark(#fdf7e8, #352d19);
  --tc-project-flow-avatar-pink: light-dark(#fde8e8, #59274b);
  --tc-project-flow-client-backdrop: light-dark(rgba(189, 189, 189, 0.2), rgba(218, 218, 218, 0.2));
  --tc-project-flow-client-glow: light-dark(rgba(190, 190, 190, 0.6), rgba(0, 0, 0, 0.6));
  --tc-project-flow-line: light-dark(#e8e8e8, rgba(255, 255, 255, 0.8));
  position: relative;
  width: 100%;
  aspect-ratio: 2312 / 1644;
  overflow: hidden;
  /* Type inside the 2312 px stage, which is scaled down to fit – illustration sizes, not the UI scale */
  --tc-project-flow-title-size: 37.618px;
  --tc-project-flow-sub-size: 26.333px;
  --tc-project-flow-pill-size: 20.674px;
  font-family: var(--tc-font-sans);
  /* Read by the component to pick the scene that matches the theme in use */
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
/* The dark scene's geometry: a thicker card edge and a lighter pill label */
[data-ui="pf"][data-scene="dark"] {
  --tc-project-flow-card-border: 3.762px;
  --tc-project-flow-pill-weight: 400;
}
[data-ui="pf"] *, [data-ui="pf"] *::before, [data-ui="pf"] *::after { box-sizing: border-box; margin: 0; padding: 0; }
[data-ui="pf"] .pf-stage { position: absolute; left: 0; top: 0; transform-origin: 0 0; }

[data-ui="pf"] .pf-stage {width: 2312px; height: 1644px; overflow: hidden; background: var(--tc-project-flow-bg);}
[data-ui="pf"] .pf-stage img { display: block; }
[data-ui="pf"] .pf-abs { position: absolute; }
[data-ui="pf"] .pf-edge-overlay {
    position: absolute;
    inset: 0;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    pointer-events: none;
    z-index: 50;
    -webkit-mask-image: radial-gradient(1069.15px 822px at 50% 50%, transparent 50.5%, #000 100%);
    mask-image: radial-gradient(1069.15px 822px at 50% 50%, transparent 50.5%, #000 100%);
  }
[data-ui="pf"] .pf-edge-overlay.pf-one {background: color-mix(in srgb, var(--tc-project-flow-fade) 2%, transparent);}
[data-ui="pf"] .pf-edge-overlay.pf-two {background: color-mix(in srgb, var(--tc-project-flow-fade) 70%, transparent);}
[data-ui="pf"] .pf-card {
    position: absolute;
    background: var(--tc-project-flow-card);
    border: var(--tc-project-flow-card-border) solid var(--tc-project-flow-card-edge);
    border-radius: 37.618px;
  }
[data-ui="pf"] .pf-shadow-sm-card {
    box-shadow: 0 28px 8px rgba(0,0,0,0), 0 18px 7px rgba(0,0,0,0.01),
                0 10px 6px rgba(0,0,0,0.02), 0 5px 5px rgba(0,0,0,0.03),
                0 1px 2px rgba(0,0,0,0.04);
  }
[data-ui="pf"] .pf-shadow-md-card {
    box-shadow: 0 56px 16px rgba(0,0,0,0), 0 36px 14px rgba(0,0,0,0.01),
                0 20px 12px rgba(0,0,0,0.02), 0 9px 9px rgba(0,0,0,0.03),
                0 2px 5px rgba(0,0,0,0.04);
  }
[data-ui="pf"] .pf-shadow-sq9 {
    box-shadow: 0 388px 109px rgba(0,0,0,0), 0 248px 99px rgba(0,0,0,0.01),
                0 140px 84px rgba(0,0,0,0.03), 0 62px 62px rgba(0,0,0,0.05),
                0 16px 34px rgba(0,0,0,0.06);
  }
[data-ui="pf"] .pf-shadow-sq10 {
    box-shadow: 0 277px 78px rgba(0,0,0,0), 0 177px 71px rgba(0,0,0,0.01),
                0 100px 60px rgba(0,0,0,0.02), 0 44px 44px rgba(0,0,0,0.03),
                0 11px 24px rgba(0,0,0,0.04);
  }
[data-ui="pf"] .pf-t-title {
    font-weight: 500;
    font-size: var(--tc-project-flow-title-size);
    line-height: 37.618px;
    letter-spacing: var(--tc-tracking-tight);
    color: var(--tc-project-flow-title);
    white-space: nowrap;
  }
[data-ui="pf"] .pf-t-sub {
    font-weight: 400;
    font-size: var(--tc-project-flow-sub-size);
    line-height: 26.333px;
    letter-spacing: var(--tc-tracking-tight);
    color: var(--tc-project-flow-sub);
    white-space: nowrap;
  }
[data-ui="pf"] .pf-pill {
    display: flex;
    align-items: center;
    justify-content: center;
    
    padding: 11.362px 15.506px;
    background: var(--tc-project-flow-pill);
    border: 1.723px solid var(--tc-project-flow-pill-edge);
    border-radius: 68.914px;
    flex: none;
  }
[data-ui="pf"] .pf-pill span {
    font-weight: var(--tc-project-flow-pill-weight);
    font-size: var(--tc-project-flow-pill-size);
    line-height: 20.674px;
    letter-spacing: var(--tc-tracking-tight);
    color: var(--tc-project-flow-pill-text);
    white-space: nowrap;
  }
[data-ui="pf"] .pf-tech-row {
    display: flex;
    align-items: center;
    gap: var(--tc-space-2, 8px);
  }
[data-ui="pf"] .pf-tile img { position: absolute; }
[data-ui="pf"] .pf-tile.pf-slack { background: #4B144B; }
[data-ui="pf"] .pf-slack-glyph { position: absolute; left: 11.97px; top: 12.34px; width: 29.474px; height: 29.474px; }
[data-ui="pf"] .pf-slack-glyph img { position: absolute; width: 13.946px; height: 13.944px; }
[data-ui="pf"] .pf-tile.pf-gmail { background: var(--tc-project-flow-tile); }
[data-ui="pf"] .pf-tile.pf-gmail img { left: 11.16px; top: 14.34px; width: 30.84px; height: 24.532px; }
[data-ui="pf"] .pf-tile.pf-figma { background: linear-gradient(to bottom, #292C2E, #000); }
[data-ui="pf"] .pf-tile.pf-figma img { left: 15.35px; top: 9.34px; width: 22.823px; height: 34.235px; }
[data-ui="pf"] .pf-tile.pf-framer .pf-fill {
    position: absolute;
    inset: 0;
    border-radius: 12.729px;
    overflow: hidden;
  }
[data-ui="pf"] .pf-tile.pf-framer .pf-fill img {
    position: absolute;
    left: -13.85%;
    top: -13.94%;
    width: 127.69%;
    height: 127.69%;
  }
[data-ui="pf"] .pf-tile.pf-clickup { background: var(--tc-project-flow-tile); }
[data-ui="pf"] .pf-tile.pf-clickup img { left: 13.73px; top: 11.24px; width: 27px; height: 32px; }
[data-ui="pf"] .pf-avatar {
    display: flex;
    align-items: center;
    padding: 8.381px;
    width: 50.285px;
    height: 50.285px;
    border-radius: 83.809px;
    flex: none;
  }
[data-ui="pf"] .pf-avatar img { width: 33.523px; height: 33.523px; object-fit: cover; }
[data-ui="pf"] .pf-avatar-lg {
    display: flex;
    align-items: center;
    padding: 17.706px;
    width: 106.237px;
    height: 106.237px;
    border-radius: 177.062px;
  }
[data-ui="pf"] .pf-avatar-lg img { width: 70.825px; height: 70.825px; object-fit: cover; }
[data-ui="pf"] .pf-bg-purple { background: var(--tc-project-flow-avatar-purple); }
[data-ui="pf"] .pf-bg-yellow { background: var(--tc-project-flow-avatar-yellow); }
[data-ui="pf"] .pf-bg-pink { background: var(--tc-project-flow-avatar-pink); }
[data-ui="pf"] .pf-client-icon {
    position: relative;
    width: 61.615px;
    height: 63.6px;
    flex: none;
  }
[data-ui="pf"] .pf-client-icon .pf-backdrop {
    position: absolute;
    left: 0;
    top: 0;
    width: 61.615px;
    height: 61.615px;
    border-radius: 14.964px;
    background: var(--tc-project-flow-client-backdrop);
    backdrop-filter: blur(0.889px);
    -webkit-backdrop-filter: blur(0.889px);
  }
[data-ui="pf"] .pf-client-icon .pf-glow {
    position: absolute;
    left: 4.64px;
    top: 53px;
    width: 53.664px;
    height: 10.6px;
    border-radius: 12.729px;
    background: var(--tc-project-flow-client-glow);
    filter: blur(9.441px);
  }
[data-ui="pf"] .pf-client-icon .pf-face {
    position: absolute;
    left: 4.32px;
    top: 4.32px;
    width: 53.811px;
    height: 53.811px;
    border-radius: 12.729px;
    background: linear-gradient(to bottom, var(--tc-project-flow-tile) 24.981%, var(--tc-project-flow-tile-end) 99.763%);
  }
[data-ui="pf"] .pf-client-icon .pf-logo {
    position: absolute;
    left: 18.34px;
    top: 20px;
    width: 24px;
    height: 24px;
  }
[data-ui="pf"] .pf-vline {
    position: absolute;
    width: 2px;
    height: 60px;
    background: var(--tc-project-flow-line);
  }
[data-ui="pf"] .pf-card-unit {
    position: absolute;
    transform: translate(0, 0) rotate(6.86deg) scale(1);
  }
[data-ui="pf"] .pf-g { position: absolute; inset: 0; }
@keyframes ui-pf-slide-down { from { opacity: 0; transform: translateY(-34px); } to { opacity: 1; transform: none; } }
@keyframes ui-pf-fade-up { from { opacity: 0; transform: translateY(18px); }  to { opacity: 1; transform: none; } }
@keyframes ui-pf-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ui-pf-draw-line { to { stroke-dashoffset: 0; } }
@keyframes ui-pf-undraw-line { to { stroke-dashoffset: -1; } }
@keyframes ui-pf-fade-out { to { opacity: 0; } }
@keyframes ui-pf-drag-in {
    from { opacity: 0; transform: translate(-300px, 340px); }
    20%  { opacity: 1; }
    to   { opacity: 1; transform: none; }
  }
@keyframes ui-pf-drop-pulse {
    0%   { transform: scale(1); }
    35%  { transform: scale(0.955); }
    70%  { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
@keyframes ui-pf-hand-away {
    0%   { opacity: 1; transform: translate(0, 0) rotate(-0.85deg) scale(1); }
    100% { opacity: 0; transform: translate(-150px, 170px) rotate(-6deg) scale(0.9); }
  }
@keyframes ui-pf-clear-veil { to { filter: blur(0); opacity: 1; } }
@keyframes ui-pf-straighten-card { to { transform: translate(0, 0) rotate(0deg) scale(1); } }
@keyframes ui-pf-to-md-shadow {
    to {
      box-shadow: 0 56px 16px rgba(0,0,0,0), 0 36px 14px rgba(0,0,0,0.01),
                  0 20px 12px rgba(0,0,0,0.02), 0 9px 9px rgba(0,0,0,0.03),
                  0 2px 5px rgba(0,0,0,0.04);
    }
  }
[data-ui="pf"] .pf-g-client { animation: ui-pf-slide-down 0.55s cubic-bezier(.22,.8,.36,1) 0s both; }
[data-ui="pf"] .pf-g-task { animation: ui-pf-fade-up 0.45s cubic-bezier(.22,.8,.36,1) 0.85s both; }
[data-ui="pf"] .pf-g-notes { animation: ui-pf-fade-up 0.45s cubic-bezier(.22,.8,.36,1) 1.75s both; }
[data-ui="pf"] .pf-g-roles { animation: ui-pf-fade-in 0.4s ease-out 1.8s both; }
[data-ui="pf"] .pf-g-pm { animation: ui-pf-fade-up 0.45s cubic-bezier(.22,.8,.36,1) 2.1s both; }
[data-ui="pf"] .pf-g-ux { animation: ui-pf-fade-up 0.45s cubic-bezier(.22,.8,.36,1) 2.9s both; }
[data-ui="pf"] .pf-dot { opacity: 0; animation: ui-pf-fade-in 0.2s ease-out both; }
[data-ui="pf"] .pf-draw { stroke-dasharray: 1 1; stroke-dashoffset: 1; animation: ui-pf-draw-line ease-in-out both; }
[data-ui="pf"] .pf-g-addon { z-index: 55; animation: ui-pf-drag-in 0.75s cubic-bezier(.2,.75,.25,1) 3.4s both; }
[data-ui="pf"] .pf-addon-pulse { transform-origin: 615px 1025px; animation: ui-pf-drop-pulse 0.45s ease-in-out 4.18s both; }
[data-ui="pf"] .pf-addon-veil { filter: blur(2.2px); opacity: 0.82; animation: ui-pf-clear-veil 0.45s ease-out 4.18s both; }
[data-ui="pf"] .pf-sq9-unit, [data-ui="pf"] .pf-sq10-unit { animation: ui-pf-straighten-card 0.45s cubic-bezier(.3,.9,.35,1) 4.18s both; }
[data-ui="pf"] .pf-sq9-unit .pf-card, [data-ui="pf"] .pf-sq10-unit .pf-card { animation: ui-pf-to-md-shadow 0.45s cubic-bezier(.3,.9,.35,1) 4.18s both; }
[data-ui="pf"] .pf-hand { animation: ui-pf-hand-away 0.45s cubic-bezier(.5,0,.75,.6) 4.63s both; }
[data-ui="pf"] .pf-hand-grab { position: absolute; inset: 0; animation: ui-pf-fade-out 0.08s linear 4.33s both; }
[data-ui="pf"] .pf-hand-open { position: absolute; left: 6px; top: -7px; width: 174px; height: 174px; opacity: 0; animation: ui-pf-fade-in 0.08s linear 4.33s both; }
[data-ui="pf"] .pf-arrow-head {
    opacity: 0;
    animation: ui-pf-fade-in 0.15s ease-out 4.05s both,
               ui-pf-fade-out 0.25s ease-out 5.15s both;
  }

/* ---------- Tech-stack icons: the two scenes lay them out differently (rings in light, frosted backdrops in dark) ---------- */
[data-ui="pf"][data-scene="light"] .pf-icon-row {
    display: flex;
    align-items: center;
    gap: var(--tc-space-4, 16px);
  }
[data-ui="pf"][data-scene="light"] .pf-icon {
    position: relative;
    width: 55px;
    height: 59.75px;
    flex: none;
  }
[data-ui="pf"][data-scene="light"] .pf-icon .pf-tile {
    position: absolute;
    left: 0;
    top: 0;
    width: 53.811px;
    height: 53.811px;
    border-radius: 12.729px;
  }
[data-ui="pf"][data-scene="light"] .pf-icon .pf-glow {
    position: absolute;
    width: 53.664px;
    height: 10.6px;
    border-radius: 12.729px;
    filter: blur(9.441px);
  }
[data-ui="pf"][data-scene="light"] .pf-ring {
    position: absolute;
    left: -6px;
    top: -6px;
    width: 65.811px;
    height: 65.811px;
    border-radius: 18.729px;
    pointer-events: none;
  }
[data-ui="pf"][data-scene="light"] .pf-ring.pf-grad {
    padding: var(--tc-space-1-5, 6px);
    opacity: 0.1;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }
[data-ui="pf"][data-scene="light"] .pf-ring.pf-slack { border: 6px solid rgba(75,20,75,0.1); }
[data-ui="pf"][data-scene="light"] .pf-glow.pf-slack { left: 0.97px; top: 48.24px; background: rgba(75,20,75,0.6); }
[data-ui="pf"][data-scene="light"] .pf-ring.pf-gmail { border: 6px solid #F6F6F6; }
[data-ui="pf"][data-scene="light"] .pf-glow.pf-gmail { left: 1.34px; top: 48.72px; background: rgba(120,120,120,0.4); }
[data-ui="pf"][data-scene="light"] .pf-glow.pf-gmail.pf-strong { background: rgba(120,120,120,0.6); }
[data-ui="pf"][data-scene="light"] .pf-ring.pf-figma { background: linear-gradient(to bottom, #292C2E 4.6%, #000 86.3%); }
[data-ui="pf"][data-scene="light"] .pf-glow.pf-figma { left: 1.34px; top: 48.97px; background: rgba(68,68,68,0.6); }
[data-ui="pf"][data-scene="light"] .pf-tile.pf-framer { overflow: hidden; }
[data-ui="pf"][data-scene="light"] .pf-ring.pf-framer { background: linear-gradient(to bottom, #23CFFD 4.6%, #204ED7 86.3%); }
[data-ui="pf"][data-scene="light"] .pf-glow.pf-framer { left: 1.34px; top: 49.09px; background: rgba(17,62,244,0.6); }
[data-ui="pf"][data-scene="light"] .pf-ring.pf-clickup { background: linear-gradient(to bottom, #FF6777 4.6%, #6686FB 86.3%); }
[data-ui="pf"][data-scene="light"] .pf-glow.pf-clickup { left: 1.34px; top: 49.15px; background: rgba(255,100,122,0.4); }
[data-ui="pf"][data-scene="dark"] .pf-icon-row {
    display: flex;
    align-items: center;
    gap: var(--tc-space-2, 8px);
  }
[data-ui="pf"][data-scene="dark"] .pf-icon {
    position: relative;
    width: 61.615px;
    height: 63.6px;
    flex: none;
  }
[data-ui="pf"][data-scene="dark"] .pf-icon .pf-backdrop {
    position: absolute;
    left: 0;
    top: 0;
    width: 61.615px;
    height: 61.615px;
    border-radius: 14.964px;
    backdrop-filter: blur(0.889px);
    -webkit-backdrop-filter: blur(0.889px);
  }
[data-ui="pf"][data-scene="dark"] .pf-bd-slack { background: rgba(75,20,75,0.2); }
[data-ui="pf"][data-scene="dark"] .pf-bd-gmail { background: rgba(153,153,153,0.2); }
[data-ui="pf"][data-scene="dark"] .pf-bd-figma { background: rgba(124,124,124,0.2); }
[data-ui="pf"][data-scene="dark"] .pf-bd-framer { background: rgba(11,139,248,0.2); }
[data-ui="pf"][data-scene="dark"] .pf-bd-clickup { background: rgba(168,168,168,0.2); }
[data-ui="pf"][data-scene="dark"] .pf-icon .pf-glow {
    position: absolute;
    left: 4.64px;
    top: 53px;
    width: 53.664px;
    height: 10.6px;
    border-radius: 12.729px;
    filter: blur(9.441px);
  }
[data-ui="pf"][data-scene="dark"] .pf-glow.pf-slack { background: rgba(75,20,75,0.6); }
[data-ui="pf"][data-scene="dark"] .pf-glow.pf-gmail { background: rgba(0,0,0,0.6); }
[data-ui="pf"][data-scene="dark"] .pf-glow.pf-figma { background: rgba(0,0,0,0.6); }
[data-ui="pf"][data-scene="dark"] .pf-glow.pf-framer { background: rgba(11,139,248,0.6); }
[data-ui="pf"][data-scene="dark"] .pf-glow.pf-clickup { background: rgba(0,0,0,0.6); }
[data-ui="pf"][data-scene="dark"] .pf-icon .pf-tile {
    position: absolute;
    left: 4.32px;
    top: 4.32px;
    width: 53.811px;
    height: 53.811px;
    border-radius: 12.729px;
    overflow: hidden;
  }
[data-ui="pf"][data-scene="dark"] .pf-tile-shadow {
    box-shadow: 0 37px 10px rgba(0,0,0,0), 0 24px 9px rgba(0,0,0,0.03),
                0 13px 8px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.17),
                0 1px 3px rgba(0,0,0,0.2);
  }

/* The build-up holds while the scene is off screen or the tab is hidden, and goes on from there once it's back */
[data-ui="pf"][data-paused] .pf-stage, [data-ui="pf"][data-paused] .pf-stage * { animation-play-state: paused; }

/* Reduced motion, and a scene swapped in after a theme change: the finished scene right away. !important beats the
   per-line timings written inline in the scene markup */
@media (prefers-reduced-motion: reduce) {
  [data-ui="pf"] .pf-stage :is(.pf-g, .pf-dot, .pf-draw, .pf-card-unit, .pf-card-unit .pf-card, .pf-arrow-head, .pf-hand, .pf-hand-grab, .pf-hand-open) { animation-duration: 0.001s !important; animation-delay: 0s !important; }
}
[data-ui="pf"][data-settled] .pf-stage :is(.pf-g, .pf-dot, .pf-draw, .pf-card-unit, .pf-card-unit .pf-card, .pf-arrow-head, .pf-hand, .pf-hand-grab, .pf-hand-open) { animation-duration: 0.001s !important; animation-delay: 0s !important; }
`;
}

if (!customElements.get("tc-project-flow")) customElements.define("tc-project-flow", TcProjectFlow);

declare global {
  interface HTMLElementTagNameMap {
    "tc-project-flow": TcProjectFlow;
  }
}
