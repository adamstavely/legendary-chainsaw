# AI component coverage and proposed additions

Reviewed the component catalog, gallery registry, block catalog, and screen catalog in Trenchcoat on October 26, 2026. This is a coverage and product-design review, not a claim that every existing implementation has been audited. Priorities below are judgments based on reuse across AI products, workflow completeness, and overlap with existing components.

## What is already covered

The library has substantial coverage of chat, agent orchestration, approvals, run inspection, provenance, feedback, context, and human review. The recent configuration additions cover model parameters, instruction messages, output schemas, tools, knowledge sources, retrieval parameters, evaluation datasets, and model routing.

The next investment should complete the workflows around those pieces rather than add more variations of agent timelines, progress displays, or answer cards.

## Build next

1. **Provider Connection.** Configure an AI provider, deployment/model endpoint, credential reference, connection test, and connection health. Include authentication failures, expired credentials, and unavailable models. Distinct from Model Picker and Model Routing, which select among already configured models. Compose Secret Field and Integration Settings patterns; do not store raw credentials in ordinary exported settings.

2. **Document Chunk Editor.** Preview a source document beside its resulting chunks; edit boundaries, inspect token counts and metadata, exclude sections, and request reindexing. Knowledge Source Manager manages sources, Retrieval Settings manages policy, and Retrieval Inspector shows query results; none provides the ingestion editing step.

3. **Guardrail Policy Editor.** Configure policy rules, thresholds, enforcement mode, redaction, and handling of blocked inputs or outputs; test sample content against a policy. Guardrail Notice explains an enforcement event and Policy Simulator previews a decision. Reuse those outputs rather than duplicate them. Enforcement remains an application service.

4. **Configuration Release Control.** Version and promote an instruction/model/tool/retrieval configuration through draft, staging, and production; show the diff, evaluation evidence, approval, rollout state, and rollback target. Instruction Editor has prompt versions, but release management spans the full configuration. Best delivered as a block composed from Run Compare, Approval Card, and Eval Scorecard, with a small reusable release/version selector.

5. **AI Failure Recovery.** A reusable error surface for unavailable providers, context limits, rate limits, interrupted streams, and invalid structured output. Show retained partial output, whether retry is safe, application-provided retry timing, and available recovery actions. Existing Tool Call Card handles tool failures; this fills the model/session layer. Retry must be explicit for actions with side effects.

6. **MCP Connection Manager.** Add a server, choose a supported transport, authenticate, test connectivity, inspect discovered tools/resources/prompts, and manage connection status. Tool Configuration defines a tool; Tool Permissions governs authorization. This component manages the server lifecycle and composes both where appropriate.

7. **Grader Editor.** Define exact-match, schema, code, rubric, or model-based graders; configure thresholds and judge settings; test a sample; show grader errors and disagreements. Evaluation Dataset Editor currently includes cases, assertions, and weighted criteria, so basic grading is partially covered. Add a dedicated editor only for reusable and more expressive graders; do not duplicate simple case assertions.

8. **Production AI Health.** An operational block showing request failures, latency percentiles, token/cost trends, evaluation regressions, and affected model/configuration versions, with links into traces. Compose KPI Chart, Usage Meter, Trace Waterfall, and Eval Scorecard. Define units, time windows, sample sizes, and data freshness explicitly. The existing analytics screens focus on revenue, while traces focus on individual runs.

## Consider after the core workflows

9. **Data Handling Policy.** Configure conversation retention, memory persistence, logging/redaction, training-use preferences, and deletion requests. Memory Panel covers individual memories; it does not cover organization-level data handling. Display application-reported effective policy and inherited restrictions; UI settings alone do not enforce retention.

10. **Conversation Annotation.** Select spans or turns, apply labels, redact sensitive text, correct an answer, and send reviewed examples to an evaluation dataset. Feedback Rubric rates an answer and Extraction Review checks document fields; neither covers reusable conversation annotation. Compose with Feedback Rubric where possible.

11. **Batch Job Submission.** Preview an input dataset, map columns to prompt variables, validate rows, estimate application-supplied cost, submit a batch, and download row-level results or retry selected failures. Agent Queue and Fan-out Grid already cover execution progress; add the submission/result workflow rather than another queue display.

12. **Multimodal Input.** Compose image, audio, video, or document inputs with upload state, supported-format constraints, previews, and application-supplied token estimates. Start as a Chat Composer extension composed with Dropzone and Context Tray. Image Grid and Voice Mode cover output/conversation behaviors, not a general mixed-media input workflow.

13. **Audio/Video Transcript Editor.** Timecoded segments, speaker labels, confidence flags, source playback, search, and correction. Voice Mode has live captions; it does not provide review of longer recordings. Worth adding if transcription or meeting products are in scope.

14. **Fine-tuning Job Setup.** Choose a base model, connect validated training/validation datasets, configure provider-supported parameters, estimate cost, and submit a job. Training metrics and checkpoint selection can be a composed follow-on screen. Lower priority unless model training is a target use case.

## Extend these existing components first

- **Model Routing:** circuit-breaker state, provider health, residency constraints, route explanation, and a route test. Keep runtime behavior supplied by the application.
- **Model Settings:** capability explanations, presets, parameter descriptions, and incompatible-setting feedback. Expose only parameters supported by the supplied model; do not present hidden chain-of-thought as a configurable or inspectable output.
- **Knowledge Source Manager:** ingestion progress, stale/duplicate source warnings, sync scheduling, and a clear handoff into chunk review.
- **Retrieval Inspector:** original versus rewritten query, filters applied, keyword/vector/rerank contributions, excluded results, and source-access explanations.
- **Context Tray / Context Window:** context assembly policy, per-category budgets, truncation explanations, and preview of the application-reported assembled context.
- **Memory Panel:** source/provenance, scope, expiry, and conflicting memory resolution.
- **Chat Composer:** structured attachment previews, interruption/reconnection state, and output-format selection. Reuse the existing model and schema controls.
- **Evaluation Dataset Editor / Eval Scorecard:** dataset splits, tags, version comparison, grader linking, and regression thresholds. Add uncertainty or reviewer disagreement only where the supplied data supports it.
- **Tool Permissions:** resource scopes, network/filesystem restrictions, expiry, and explanation of inherited permissions. Reuse Gate Config for approval rules.

## Compositions worth shipping

- **AI Playground:** Instruction Editor + Model Settings + Tool Configuration + Output Schema Builder + test chat + Run Compare.
- **Knowledge Studio:** Knowledge Source Manager + Document Chunk Editor + Retrieval Settings + Retrieval Inspector.
- **Evaluation Studio:** Evaluation Dataset Editor + Grader Editor + Eval Scorecard + Run Compare.
- **AI Operations:** Production AI Health + Model Routing + Budget Guard + incident/recovery details.

These should be blocks or screens. Their reusable controls should remain individually usable, with shared value/event types and the established Standard/Clean design recipes.

## Recommended order

Start with Provider Connection, Document Chunk Editor, and AI Failure Recovery. They unlock missing setup and recovery paths across several existing components. Then add Guardrail Policy Editor and Configuration Release Control. Build Grader Editor and the operational compositions once those foundations can share coherent configuration, version, and result data.

Stabilize the recently added components' styling, accessibility, and integration behavior before expanding the catalog again.
