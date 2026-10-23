# Project Mission Control Charter

Oct 23, 2026 · @Adam

## Mission

**One office that plans together, delivers in small steps, and steers on live evidence.**

Project Mission Control changes how the office works. It moves the converged organization to agile ways of working: one prioritized portfolio, work that flows in small batches, long-lived teams that own outcomes, and a steady cadence of inspecting and adapting. A live program dashboard is the instrument panel, replacing manual status reporting and hand-built review slides.

**Scope.** Mission Control owns the operating model: portfolio prioritization, team structure, delivery cadence, and program measurement. The architecture belongs to MACH1. The user experience belongs to Stratos.

**Timeline.** New ways of working stand up alongside MACH1's foundation window, October to December 2026, so the first user-facing deployments in January 2027 run under the new model.

## Tenets

These are the red lines Mission Control will not cross, whatever the schedule pressure.

1. **No side-door priorities.** We will not start work that has not come through Requirements Management and the single portfolio backlog.
2. **Agile is not a ceremony.** We will not adopt rituals for their own sake. Every practice must shorten the path from idea to user.
3. **Teams are not resource pools.** We will not break up long-lived teams or reassign people project by project.
4. **No reporting tax.** We will not ask teams to build status slides by hand. If the instrument panel cannot show it, we fix the panel.
5. **Evidence over opinion.** We will not make a portfolio decision without the live data to support it.

## Pillars

Each pillar is defined by the outcome the office will feel, not the process behind it.

| Pillar | Outcome | What it covers |
| --- | --- | --- |
| **Align the Work** | Every team works on what matters most to the mission | One prioritized portfolio backlog; a clear line from mission goals to team backlogs; Requirements Management as the single front door |
| **Accelerate the Flow** | Value reaches users sooner and more often | Value streams; small batches and work-in-progress limits; fewer handoffs; continuous delivery through Nitro |
| **Amplify the Teams** | Long-lived teams own outcomes, not tasks | Team Topologies structure in place of the legacy hierarchy; stream-aligned and platform teams; coaching in agile practice |
| **Adapt the Course** | Leadership steers on live evidence, not status slides | A regular inspect-and-adapt cadence; the live program dashboard; program reviews built from real-time data |

## How Mission Control interlocks with the other efforts

MACH1 changes what we build on and Stratos changes what users experience. Mission Control changes how the office does both, and closes the loop back to leadership.

| Partner | Mission Control gives | Mission Control gets |
| --- | --- | --- |
| **Requirements Management** | A single portfolio backlog that requirements feed into | Requirements turned into prioritized, mission-traced work |
| **MACH1** | Priorities, long-lived platform teams, and a delivery cadence | Delivery and platform health data |
| **Stratos** | Priorities, stream-aligned teams, and a delivery cadence | Adoption, confidence, and task-time outcomes |
| **Leadership** | Live evidence on where to invest, adjust, or accelerate | Portfolio decisions and funding |

- **Shared timeline.** New ways of working stand up during the October to December 2026 foundation window, so January deployments run under the new model.
- **Instrument panel.** The dashboard pulls from Elastic, Jira, ServiceNow, and the CI/CD pipelines, measured against the Metrics that Matter strategy.

## Mission engineering measures

Metrics that Matter treats delivery as orthogonal to mission engineering: it measures the organization's capacity to change the mission system, and how fast a falling measure is restored once it is named. The measures below apply the four levels to that delivery system. Thresholds are per-organization baselines, never cross-team rankings.

| Level | Mission Control measure | Instrumented by | Threshold |
| --- | --- | --- | --- |
| **Measure of Success** | Delivered change tracks what mission owners prioritized, as they assess it | Informed by portfolio review records and work traced to mission goals; never generated from telemetry | Mission owners' expectation |
| **Measure of Effectiveness** | Every unit of work traces to a mission need | Proposed: share of active work traced to a mission task (requires a mission field in Jira); classification fill rate | Required: all active work traced |
| **Measure of Capability** | The organization has enough capacity to change the mission system | New-capability share of the work ratio (L3-10) against its baseline band; work in progress and throughput (L3-9) | Baseline band per organization |
| **Measure of Performance** | The delivery system performs as expected, including how fast a falling Measure of Effectiveness, Capability, or Performance is restored | DORA: lead time, deployment frequency, change failure rate, failed deployment recovery time (L3-1 to L3-4); PR cycle time (L3-5) | Per-organization baselines |

## Key milestones

1. **December 2026:** One portfolio backlog in place, with Requirements Management as the single front door.
2. **December 2026:** Leadership decision on the Team Topologies structure; first long-lived stream-aligned and platform teams formed.
3. **January 2027:** First deployments delivered under the new cadence; the four DORA metrics computing from pipeline events.
4. **Metrics that Matter Phase 1:** Per-organization baselines captured; instrument panel and measurement integrity signals live.
5. **Phase 2:** First developer experience survey as a baseline; export freshness monitored.
6. **Phase 3:** Flow metrics live; decision-rights thresholds activated per organization; manual status reporting retired.

Open question: which calendar quarter does Metrics that Matter Phase 1 start?

## Measuring success

Mission Control owns **Layer 3 (programmatic delivery)** of Metrics that Matter, including the four DORA delivery metrics, plus the measurement integrity signals and the developer experience survey. Every measure below belongs to Mission Control alone. Mission Control also runs the instrument panel and the operating rhythm in Section 13 of Metrics that Matter, where each trigger names the decision it forces and who owns it. Per that strategy, no measure ranks individuals or teams, and each converged organization is baselined separately before any target is set. Ref is the layer and item number in Metrics that Matter; Phase is its rollout phase.

| Pillar | Metric | Ref | Phase |
| --- | --- | --- | --- |
| Align the Work | Work ratio | L3-10 | 3 |
| Align the Work | Code churn and rework | L3-8 | 3 |
| Align the Work | Classification fill rate | Integrity | 3 |
| Accelerate the Flow | Deployment frequency (DORA) | L3-1 | 1 |
| Accelerate the Flow | Lead time for changes (DORA) | L3-2 | 1 |
| Accelerate the Flow | Change failure rate (DORA) | L3-3 | 1 |
| Accelerate the Flow | Failed deployment recovery time (DORA) | L3-4 | 1 |
| Accelerate the Flow | PR cycle time | L3-5 | 3 |
| Accelerate the Flow | Build and pipeline health | L3-6 | 3 |
| Accelerate the Flow | Test coverage and escape rate | L3-7 | 3 |
| Accelerate the Flow | Work in progress and throughput | L3-9 | 3 |
| Amplify the Teams | Developer experience survey | Perceptual | 2 |
| Adapt the Course | Event volume anomaly | Integrity | 1 |
| Adapt the Course | Schema validation failure rate | Integrity | 1 |
| Adapt the Course | Export freshness | Integrity | 2 |
| Adapt the Course | Change-record linkage rate | Integrity | 1 |

Gaps to add to Metrics that Matter:

- **Amplify the Teams has only the survey.** Proposed addition: team stability over time, from org data and Jira.
- **Measure of Success.** Metrics that Matter declares mission success a gap by design. It should be an explicit mission-owner assessment that the instrument panel informs but never generates.
