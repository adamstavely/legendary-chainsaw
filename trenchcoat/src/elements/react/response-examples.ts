import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcResponseExamples, type ResponseExamplesMediaTypeChange, type ResponseExamplesStatusChange } from "../response-examples";
import { h, useControlled } from "./internal";

export type { ResponseExample, ResponseExampleBody, ResponseExamplesLabels, ResponseExamplesMediaTypeChange, ResponseExamplesStatusChange, ResponseStatusClass } from "../response-examples";
export { defaultResponseExamplesLabels, responseBodies, responseBodyText, responseReason, responseStatusClass } from "../response-examples";

const RawResponseExamples = createComponent({
  tagName: "tc-response-examples",
  elementClass: TcResponseExamples,
  react: React,
  events: {
    onTcStatusChange: "tc-status-change" as EventName<CustomEvent<ResponseExamplesStatusChange>>,
    onTcMediaTypeChange: "tc-media-type-change" as EventName<CustomEvent<ResponseExamplesMediaTypeChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawResponseExamples>;
export type ResponseExamplesProps = Omit<RawProps, "heading" | "status" | "mediaType" | "onTcStatusChange" | "onTcMediaTypeChange" | "children"> & {
  /** The heading – often the endpoint, "GET /records/{id}" */
  title?: string;
  /** The status whose tab is showing ("200") – controlled when given */
  status?: string;
  /** On mount, when `status` isn't controlled; the first tab when empty */
  defaultStatus?: string;
  /** Called with the status of the tab chosen */
  onStatusChange?: (status: string) => void;
  /** The body's media type – controlled when given */
  mediaType?: string;
  /** On mount, when `mediaType` isn't controlled; the status's first when empty */
  defaultMediaType?: string;
  /** Called with the media type chosen for the body */
  onMediaTypeChange?: (mediaType: string) => void;
};

export function ResponseExamples({ title, status, defaultStatus = "", onStatusChange, mediaType, defaultMediaType = "", onMediaTypeChange, ...props }: ResponseExamplesProps) {
  const s = useControlled<string>(status, defaultStatus, onStatusChange);
  const m = useControlled<string>(mediaType, defaultMediaType, onMediaTypeChange);
  return h(RawResponseExamples, {
    ...props,
    heading: title ?? "Responses",
    status: s.value,
    mediaType: m.value,
    onTcStatusChange: (e: CustomEvent<ResponseExamplesStatusChange>) => s.handler(e.detail.status, e),
    onTcMediaTypeChange: (e: CustomEvent<ResponseExamplesMediaTypeChange>) => m.handler(e.detail.mediaType, e),
  });
}
