# Project MACH1 Charter

Oct 23, 2026 · @Adam

## Mission

**A secure, resilient foundation where every capability is a product the whole office can build on.**

Project MACH1 fixes the architecture from the bottom up. It moves the portfolio to a MACH architecture: capability platforms run as products, an SI orchestration layer above them, and a few SuperApps that consolidate the user experience. The goals are agility, global resiliency, deduplication, innovation, and SI readiness.

**Scope.** MACH1 owns platform architecture, shared services, delivery pipelines, and the SI orchestration layer. How the experience looks, flows, and is learned belongs to Stratos. How the office plans and works belongs to Mission Control.

**Timeline.** October to December 2026 is foundation work: onboarding the remaining portfolio onto Nitro and Platforma. From January 2027, leadership expects user-facing deployments.

## Principles

These govern how every MACH1 capability is built. A design that breaks one does not pass architecture review.

1. **Verifiable.** Every interface is documented, every component is inspectable, and every change is traceable. We do not adopt black boxes we cannot audit.
2. **Composable.** Capabilities are small, bounded, and reusable. We do not build monoliths or one-off integrations that only one application can use.
3. **Connected.** Services talk through governed APIs and shared events. We do not create point-to-point links or data silos.
4. **Resilient.** Services are built to survive failure and run anywhere on the self-hosted IDP. Cloud native here never means locked into one hyperscaler's managed services.

## Pillars

Each pillar is defined by the outcome it delivers. The principles describe how MACH1 builds; the pillars describe what it delivers.

| Pillar | Outcome | What it covers |
| --- | --- | --- |
| **Strengthen the Foundation** | A secure, resilient base for everything above it | Zero-trust access and fine-grained authorization with Cerbos; no end-of-life dependencies; every team on Nitro CI/CD and the Platforma IDP; failover without a single-hyperscaler dependency |
| **Standardize the Platforms** | Capabilities run as products on one self-hosted stack | Capability platforms with product owners and roadmaps; bounded contexts through domain-driven design; a common stack of Tyk, Tiptap, Flowable, Elastic, and Cerbos |
| **Streamline the Portfolio** | No duplicate services, so a few SuperApps sit on shared capabilities | Retiring duplicated services; migrating applications onto shared platforms; supplying the services the SuperApps are built from |
| **Scale the Intelligence** | SI is available to every application, governed and reusable | The SI orchestration layer on Lumbra; shared agent and workflow services; governance through THEMIS |

## How MACH1 interlocks with Stratos and Mission Control

MACH1 builds what the portfolio runs on. Stratos defines what using it should feel like, and Mission Control sets how the work is planned and steered.

| Partner | MACH1 gives | MACH1 gets |
| --- | --- | --- |
| **Stratos** | Platforms, data, and SI services that SuperApps are built from | Workflow research and journeys that decide which capabilities matter first; the design system the SuperApps use |
| **Mission Control** | Delivery and platform health data from Nitro, Platforma, and Elastic | One prioritized portfolio backlog; long-lived platform teams; a cadence to inspect and adapt |

- **Shared timeline.** MACH1's foundation window (October to December 2026) is when Stratos designs the experience and Mission Control stands up the new ways of working, so January deployments land on all three at once.
- **Consolidation.** When MACH1 retires a duplicated service, Stratos owns the user side of the change and Mission Control tracks it to completion.
- **Joint decisions.** Any new SuperApp or major capability change is reviewed by both architecture and UX leads before build starts.

## Mission engineering measures

MACH1 carries the portfolio's Measures of Capability and Performance as defined in Metrics that Matter: Layer 2 is the Measure of Performance, and SLO attainment rolled up per capability is the Measure of Capability. Thresholds follow Metrics that Matter: baseline first, then required values set by mission analysis.

| Level | MACH1 measure | Instrumented by | Threshold |
| --- | --- | --- | --- |
| **Measure of Success** | No mission objective is missed because a capability was unavailable or failed, as assessed by mission owners | Informed by SLO attainment, incident history, and MTTD and MTTR (L2-8); never generated from telemetry | Mission owners' expectation |
| **Measure of Effectiveness** | Mission threads run end to end on shared capability platforms without a service-caused failure | Cross-layer join of service errors and latency (Layer 2) to task abandonment (Layer 1), segmented by mission thread | Required per mission thread |
| **Measure of Capability** | Each capability platform is sufficient for the mission tasks that depend on it | SLO attainment and workflow health rolled up per capability platform, once "capability" joins the shared dimension schema | Required per capability, set by mission analysis |
| **Measure of Performance** | Services perform as expected in production | Availability (L2-1), 5xx rate (L2-2), latency p95/p99 (L2-5), saturation (L2-9), job success and data freshness (L2 async) | Published SLOs and error budgets |

## Key milestones

1. **December 2026:** Non-adopting portfolio onboarded to Nitro and Platforma, with no end-of-life dependencies. Foundation complete.
2. **December 2026:** APM and Elastic Agent in base images; SLOs with burn-rate alerting on critical services.
3. **January 2027:** First capability platforms serving user-facing SuperApp deployments.
4. **Metrics that Matter Phase 1:** "Capability" added to the shared dimension schema; first Measure of Capability rollups per capability platform.
5. **Phase 2:** Async workload, alert quality, client-side, and dependency health signals live.
6. **Phase 3:** Cost per service and utilization reviews; error budget triggers active per the Metrics that Matter decision rights.

Open questions: when does the SI orchestration layer reach its first applications, and which calendar quarter does Phase 1 start?

## Measuring success

MACH1 owns **Layer 2 (technical telemetry)** of Metrics that Matter, including its async workload, alert quality, and cost signals. Every measure below belongs to MACH1 alone. DORA's fifth metric, reliability, lives here as SLO attainment. In Mission Engineering terms, Layer 2 is the Measure of Performance, and SLO attainment rolled up per capability platform is the Measure of Capability. Ref is the layer and item number in Metrics that Matter; Phase is its rollout phase.

| Pillar | Metric | Ref | Phase |
| --- | --- | --- | --- |
| Strengthen the Foundation | Availability and uptime against SLOs | L2-1 | 1 |
| Strengthen the Foundation | 5xx server error rate | L2-2 | 1 |
| Strengthen the Foundation | Crash rate | L2-4 | 2 |
| Strengthen the Foundation | MTTD and MTTR | L2-8 | 1 |
| Strengthen the Foundation | Saturation and resource utilization | L2-9 | 1 |
| Strengthen the Foundation | Dependency health | L2-12 | 2 |
| Strengthen the Foundation | Job success rate | L2 async-1 | 2 |
| Strengthen the Foundation | Run duration drift | L2 async-2 | 2 |
| Strengthen the Foundation | Queue age and depth | L2 async-3 | 2 |
| Strengthen the Foundation | Dead-letter volume | L2 async-4 | 2 |
| Strengthen the Foundation | Data freshness | L2 async-5 | 2 |
| Strengthen the Foundation | Pages per on-call week | L2 alert-1 | 2 |
| Strengthen the Foundation | Actionable alert rate | L2 alert-2 | 2 |
| Strengthen the Foundation | Auto-resolved alert rate | L2 alert-3 | 2 |
| Strengthen the Foundation | Time to acknowledge | L2 alert-4 | 2 |
| Strengthen the Foundation | Support-detected vs. monitoring-detected incidents | Support view | 2 |
| Strengthen the Foundation | Golden pipeline adoption | Integrity | 1 |
| Standardize the Platforms | Latency (p50/p95/p99) | L2-5 | 1 |
| Standardize the Platforms | Throughput | L2-7 | 1 |
| Standardize the Platforms | API health per endpoint | L2-10 | 1 |
| Standardize the Platforms | 4xx client error anomaly rate | L2-3 | 2 |
| Standardize the Platforms | Frontend performance | L2-6 | 2 |
| Standardize the Platforms | Client-side telemetry | L2-11 | 2 |
| Standardize the Platforms | Observability footprint | Cost-3 | 2 |
| Streamline the Portfolio | Cost per service | Cost-1 | 3 |
| Streamline the Portfolio | Utilization efficiency | Cost-2 | 3 |

Gaps to add to Metrics that Matter:

- **Scale the Intelligence has no measure.** SI services inherit every Layer 2 signal when segmented by service. Proposed additions: applications calling the SI orchestration layer, and SLO attainment for SI services.
- **Streamline the Portfolio has cost but not consolidation.** Proposed addition: duplicate services retired.
