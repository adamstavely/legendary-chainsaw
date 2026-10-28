import { safeUrl } from "./safe-url";

/*
 * Images, video and audio from data. An <img>, <image>, <video> or <audio> never runs script from its src, so
 * besides what safeUrl allows they may load in-page sources: a data: image (an avatar inlined as base64) or a blob:
 * URL (a preview of a file the person just picked). Links and frames use safeUrl.
 */

/** The source when it's safe for an image or media src, otherwise undefined (bind it with `ifDefined`) */
export function safeMediaUrl(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  if (/^\s*(data:(image|video|audio)\/[\w.+-]+[;,]|blob:)/i.test(url)) return url.trim();
  return safeUrl(url);
}
