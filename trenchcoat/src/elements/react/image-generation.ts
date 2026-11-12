import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcImageGeneration,
  type ImageGenerationCancel,
  type ImageGenerationDownload,
  type ImageGenerationExpandedChange,
  type ImageGenerationRequest,
  type ImageGenerationStatus,
} from "../image-generation";
import { h, useControlled } from "./internal";

export type { ImageGenerationCancel, ImageGenerationDownload, ImageGenerationLabels, ImageGenerationRequest, ImageGenerationStatus } from "../image-generation";
export { defaultImageGenerationLabels, formatEta, parseAspectRatio } from "../image-generation";

const RawImageGeneration = createComponent({
  tagName: "tc-image-generation",
  elementClass: TcImageGeneration,
  react: React,
  events: {
    onTcCancel: "tc-cancel" as EventName<CustomEvent<ImageGenerationCancel>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<ImageGenerationRequest>>,
    onTcRegenerate: "tc-regenerate" as EventName<CustomEvent<ImageGenerationRequest>>,
    onTcDownload: "tc-download" as EventName<CustomEvent<ImageGenerationDownload>>,
    onTcCopyPrompt: "tc-copy-prompt" as EventName<CustomEvent<ImageGenerationRequest>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<ImageGenerationExpandedChange>>,
  },
});
type RawImageGenerationProps = React.ComponentProps<typeof RawImageGeneration>;

export type ImageGenerationOwnProps = {
  /** Names the card – what the image is for */
  title?: string;
  /** Whether a long prompt shows in full. Controlled when defined */
  expanded?: boolean;
  /** Whether a long prompt starts in full when uncontrolled */
  defaultExpanded?: boolean;
  /** Show more or Show less on a long prompt */
  onExpandedChange?: (expanded: boolean) => void;
  /** Cancel while queued or generating – stop the job. Call event.preventDefault() to keep the card as it is until your status arrives */
  onCancel?: (status: ImageGenerationStatus, event: Event) => void;
  /** Try again on a failed image – start the job again */
  onRetry?: (prompt: string) => void;
  /** Regenerate on a done image, or Start again after a cancel – start a new job */
  onRegenerate?: (prompt: string) => void;
  /** Download on a done image; it's saved unless you call event.preventDefault() */
  onDownload?: (src: string, filename: string, event: Event) => void;
  /** Copy prompt; it's copied unless you call event.preventDefault() */
  onCopyPrompt?: (prompt: string, event: Event) => void;
};
export type ImageGenerationProps = Omit<
  RawImageGenerationProps,
  keyof ImageGenerationOwnProps | "heading" | "onTcCancel" | "onTcRetry" | "onTcRegenerate" | "onTcDownload" | "onTcCopyPrompt" | "onTcExpandedChange"
> &
  ImageGenerationOwnProps;

/** One image while it's generated: queued, sharpening as it progresses, then the image – or why it failed */
export function ImageGeneration({ title = "Image", expanded, defaultExpanded = false, onExpandedChange, onCancel, onRetry, onRegenerate, onDownload, onCopyPrompt, ...props }: ImageGenerationProps) {
  const x = useControlled(expanded, defaultExpanded, onExpandedChange);
  return h(RawImageGeneration, {
    ...props,
    heading: title,
    expanded: x.value,
    onTcExpandedChange: (e: CustomEvent<ImageGenerationExpandedChange>) => x.handler(e.detail.expanded, e),
    onTcCancel: (e: CustomEvent<ImageGenerationCancel>) => onCancel?.(e.detail.status, e),
    onTcRetry: (e: CustomEvent<ImageGenerationRequest>) => onRetry?.(e.detail.prompt),
    onTcRegenerate: (e: CustomEvent<ImageGenerationRequest>) => onRegenerate?.(e.detail.prompt),
    onTcDownload: (e: CustomEvent<ImageGenerationDownload>) => onDownload?.(e.detail.src, e.detail.filename, e),
    onTcCopyPrompt: (e: CustomEvent<ImageGenerationRequest>) => onCopyPrompt?.(e.detail.prompt, e),
  });
}
