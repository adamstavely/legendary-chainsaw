# Project Stratos Charter

Oct 11, 2026 · @Adam

## Mission

**Every user, confident and capable, in one cohesive experience built around the mission.**

Project MACH1 fixes the architecture from the bottom up. Project Stratos fixes the experience from the top down: it starts with the user's mission and works back to the tools. The goal is a portfolio that feels like one system, follows how work actually gets done, and is easy to learn and get help with.

**Scope.** Stratos owns how the portfolio looks, flows, is learned, and is supported. Platform architecture, delivery pipelines, and the AI orchestration layer belong to MACH1.

## Tenets

These are the red lines Stratos will not cross, whatever the schedule pressure.

1. **No user left stranded.** We will not retire or migrate a tool until its replacement supports the mission workflow end to end, validated by the people who do that work.
2. **Nothing ships without the user in the room.** We will not build or release a capability that hasn't been researched and tested with real operators. Assumptions are not requirements.
3. **No surprises on day one.** We will not deliver a change without advance notice, clear release notes, and training ready the day it lands.
4. **The human stays in command.** We will not introduce AI that hides its reasoning, its sources, or its confidence, or that removes the user's ability to question and override it.
5. **We measure outcomes, not activity.** We will not report training seats filled or tickets closed as success. Success is time saved, confidence gained, and missions supported.

## Pillars

Each pillar is defined by the outcome users will feel, not the activity behind it.

| Pillar | Outcome | What it covers |
| --- | --- | --- |
| **Engage the Workforce** | Users are confident and capable in the tools they rely on | Role-based learning paths; dedicated training environments; instructor-led and video training; AI literacy through AI Lingo; user summits and change communications |
| **Empower the Users** | Users find help the moment they need it | In-app help and guided tours; release notes and roadmap communications; a unified Tier 1/2/3 help desk |
| **Evolve the Capabilities** | Tools follow how the mission gets done and feel like one portfolio | Mapping end-to-end workflows with users; consolidating redundant applications; designing SuperApp journeys around whole tasks |
| **Enable the Developers** | Teams build consistent experiences quickly, without guesswork | Shared design system and component library; specs and acceptance criteria at handoff; UX standardization Phases 1 to 3 |

Empower the Users supports people at the point of need. Engage the Workforce builds their capability ahead of it.

## How Stratos interlocks with MACH1

MACH1 builds what the portfolio runs on; Stratos defines what using it should feel like. They meet in the SuperApps.

&#91;embedded content: Stratos and MACH1 · two directions, one meeting point\]

- **Shared timeline.** MACH1 spends October to December 2026 on foundation work. Stratos uses the same window for workflow research, the design system, and training environments, so January's user-facing deployments ship with the experience already designed.
- **Consolidation.** When MACH1 retires a duplicated capability, Stratos owns the user side: workflow migration, decommission communications, and retraining.
- **Joint decisions.** Any new SuperApp or major capability change is reviewed by both architecture and UX leads before build starts.

## Mission engineering measures

Stratos is measured at all four mission engineering levels for its own contribution. The portfolio-wide Measures of Capability and Performance in Metrics that Matter belong to MACH1; the ones below measure the experience layer. Thresholds follow Metrics that Matter: baseline first, then required values set by mission analysis.

| Level | Stratos measure | Instrumented by | Threshold |
| --- | --- | --- | --- |
| **Measure of Success** | Mission objectives are met using the portfolio, as assessed by mission owners | Informed by task success, user satisfaction, and the user perception panel; never generated from telemetry | Mission owners' expectation |
| **Measure of Effectiveness** | Users complete core mission tasks, defined by the triad from the mission's functional decomposition | Task success rate (L1-5), diagnosed by time to complete (L1-6) and friction (L1-7) | Required rate per task, set from the Phase 1 baseline |
| **Measure of Capability** | The workforce can use the capabilities its mission tasks require | Activation rate (L1-1) and feature adoption (L1-2) per role, against the capabilities each role requires | Required coverage per role, set from baseline |
| **Measure of Performance** | The experience performs as expected at the point of work | Time to complete key tasks (L1-6), error and friction rate (L1-7), support contact rate (L1-8) | Expected values set from Phase 1 and 2 baselines |

## Key milestones

1. **December 2026:** Core mission workflows defined by the triad from the functional decomposition of mission tasks. This gates the Measure of Effectiveness.
2. **December 2026:** Activation and workflow events defined and emitted on flagship applications through the shared client event library.
3. **January 2027:** First SuperApp deployments land with in-app help, release notes, and training ready on day one.
4. **Metrics that Matter Phase 1:** Baselines captured for activation, retention, and task success.
5. **Phase 2:** Support integration, friction, satisfaction, and dormancy measures live; unified Tier 1/2/3 help desk reporting in ServiceNow.
6. **Phase 3:** User perception panel standing; required thresholds for the Measure of Effectiveness set from baselines.

Open question: which calendar quarter does Metrics that Matter Phase 1 start?

## Measuring success

Stratos owns **Layer 1 (product analytics)** of Metrics that Matter and the **support operations view**. Every measure below belongs to Stratos alone. In Mission Engineering terms, task success rate is the Measure of Effectiveness, so core workflows should be defined from the mission task decomposition with tradecraft experts. Ref is the layer and item number in Metrics that Matter; Phase is its rollout phase.

| Pillar | Metric | Ref | Phase |
| --- | --- | --- | --- |
| Engage the Workforce | Activation rate | L1-1 | 1 |
| Engage the Workforce | Feature adoption and time to first use | L1-2 | 2 |
| Engage the Workforce | Retention (D1/D7/D30) | L1-3 | 1 |
| Engage the Workforce | Stickiness (DAU/MAU) | L1-4 | 2 |
| Engage the Workforce | Session depth and breadth | L1-9 | 2 |
| Engage the Workforce | Churn signals and dormancy | L1-11 | 2 |
| Empower the Users | Support contact rate | L1-8 | 2 |
| Empower the Users | User satisfaction (in-app and support CSAT, reported separately) | L1-10 | 2 |
| Empower the Users | First response time | Support view | 2 |
| Empower the Users | Resolution time | Support view | 2 |
| Empower the Users | Backlog and aging | Support view | 2 |
| Empower the Users | First-contact resolution | Support view | 2 |
| Empower the Users | Escalation rate | Support view | 2 |
| Empower the Users | Deflection rate | Support view | 3 |
| Evolve the Capabilities | Task success rate (MOE) | L1-5 | 1 |
| Evolve the Capabilities | Time to complete key tasks | L1-6 | 2 |
| Evolve the Capabilities | User perception panel | Perceptual | 3 |
| Enable the Developers | Error and friction rate | L1-7 | 2 |
| Enable the Developers | Event library adoption | Integrity | 1 |

Gaps to add to Metrics that Matter:

- **Confidence.** Engage the Workforce promises confident users, but no measure asks them. The in-app survey component (L1-10) can carry a confidence item.
- **Design system adoption.** Enable the Developers has no measure of shared design system use, such as the share of screens built from it.
