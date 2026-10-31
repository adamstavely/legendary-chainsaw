import { AgentFace } from "./agent-face";

export { AgentFace };

if (!customElements.get("agent-face")) customElements.define("agent-face", AgentFace);

declare global {
  interface HTMLElementTagNameMap {
    "agent-face": AgentFace;
  }
}
