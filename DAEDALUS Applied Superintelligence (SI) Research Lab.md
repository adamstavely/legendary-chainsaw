# DAEDALUS: Applied Superintelligence (SI) Research Lab

Nov 3, 2026 · @Adam

## Executive summary

Charter DAEDALUS, a staff-only applied SI research lab of 12 permanent employees by the end of year one, to turn frontier superintelligence (SI) into governed workplace capability and to break our own SI systems before an adversary does.

The lab has three jobs:

- **Apply.** Find, prototype and prove high-value uses of frontier SI in our workflows, then hand them to capability platform owners under MACH1.
- **Assure.** Mature THEMIS and its successors as the organization's SI governance and trust calibration architecture.
- **Attack.** Run a standing SI red team against our models, agents, MCP tools and the people who rely on them.

Staff only, by design. Red team findings about our own systems are among the most sensitive material we will hold, and applied SI knowledge compounds only if the people who earn it stay. The immediate ask is the charter, four founding positions and a sandbox on Platforma.

*Working name: Daedalus built practical inventions for the court, and his son Icarus is the oldest lesson about operating past safe limits. The lab does both.*

## Why now

MACH1 builds an SI orchestration layer into the architecture, but no one owns finding what belongs on it or proving it is safe to run.

- **Capability outruns acquisition.** Frontier models turn over faster than a contract cycle. By the time an external study is awarded, the model it studied is two generations old.
- **Experimentation is scattered.** Teams are trying SI on their own, duplicating effort and producing shadow SI that no one governs. This is the same duplication problem our capability platform strategy argues makes agentic workflows ungovernable.
- **The attack surface is new.** Agents that read collected content, call MCP tools and act through Lumbra open paths that traditional security testing does not cover: prompt injection through ingested data, tool poisoning in the registry, exfiltration through tool calls, and manipulation of the model router.
- **The human is part of the system.** The most likely failure is not a dramatic exploit but analysts trusting SI output more, or less, than it deserves. Continuous trust calibration is a research problem we cannot buy off the shelf.
- **Knowledge leaves with contractors.** Every rotation resets what we learned about our own systems. A lab of staff employees keeps it.

## Mission and charter

**Mission:** Discover where frontier SI measurably improves mission work, prove it is safe and trustworthy under attack, and transition it to the teams that will run it.

**In scope**

- Applied research on SI in our workflows, from intake through a proven prototype
- Evaluation of frontier and open-weight models available inside our environment
- SI governance architecture, starting with THEMIS and its services
- Red teaming of any SI system in the organization, before and after production
- Human-SI teaming studies, including reliance and trust calibration
- Transition packages: prototype, evaluation results, red team report, THEMIS conformance

**Out of scope**

- Running production services. Capability platform teams own those.
- Procurement decisions. The lab advises; it does not buy.
- Workforce SI literacy. User enablement and AI Lingo own it; the lab contributes material.

**Authorities the lab needs**

- Standing authority to red team any SI system under signed rules of engagement
- Access to non-production replicas of platforms, Lumbra and the Tyk MCP gateway
- An advisory seat on the AERB for SI-related decisions

## Research thrusts

Four thrusts share one pipeline, and the red team tests the output of the other three.

| Thrust | Question it answers | Candidate first projects | Transitions to |
| --- | --- | --- | --- |
| Applied SI | Where does frontier SI measurably improve mission work? | Agentic triage of tier 1 tickets in Resolve; drafting user stories from UX research; retrieval over the Stacks and sales branch knowledge | Capability platforms and stream-aligned teams |
| SI Assurance and Governance | How do we bound, monitor and prove what SI did? | MOIRAI session bounding on Lumbra; ARBOR chain of custody; the proposed METIS self-evaluation service | AI Governance (THEMIS) platform |
| Adversarial SI | How does our SI fail under attack or misuse? | Prompt injection through collected content; MCP tool poisoning through the registry; model router manipulation | System owners, security, AERB |
| Human-SI Teaming | Do people rely on SI the right amount? | Reliance-Accuracy Index in a live workflow; ATHENA intervention trials; MIMIR baselining of approved models | Trust Calibration platform, Stratos |

Red teaming covers people as well as code. An analyst who rubber-stamps SI output is a vulnerability, so Adversarial SI and Human-SI Teaming run joint campaigns.

## Operating model

Every idea runs one timeboxed pipeline, and a single gate of evaluation plus red team stands between a prototype and production.

&#91;embedded content: DAEDALUS pipeline · 5 stages, 1 gate\]

Most ideas should die at Explore; a high kill rate means the lab is working. A failed gate sends findings back to Prototype.

- **Intake.** Problems come from mission sponsors and the fellows, not from the lab's own enthusiasm.
- **Transition package.** Prototype, evaluation results, red team report and THEMIS conformance check, accepted in writing by the platform owner.
- **After transition.** The lab stays on call for one release cycle, then the red team retests on a schedule.

## Organization and staffing

The lab starts with 4 founders and grows to 12 permanent staff in year one, all employees, plus a rotating cohort of fellows.

| Role | Founders | Year 1 total | What they do |
| --- | --- | --- | --- |
| Lab director | 1 | 1 | Owns the portfolio, the gates and relationships with platform owners |
| Applied SI engineer | 1 | 3 | Builds prototypes on Lumbra and the MCP gateway; runs evaluations |
| SI assurance architect | 1 | 2 | Specifies and builds THEMIS services; writes conformance checks |
| Red team operator | 1 (lead) | 3 | Plans and runs adversarial campaigns; at least one with offensive security background |
| Human factors researcher | 0 | 2 | Runs teaming and calibration studies; drawn from or paired with the UX team |
| Evaluation engineer | 0 | 1 | Maintains the evaluation harness, benchmarks and model baselines |

**Fellows.** Two engineers per six-month rotation from stream-aligned teams. They bring real problems in and carry SI skill back out, which spreads capability without adding headcount.

**Placement.** In Team Topologies terms the lab is an enabling team, with THEMIS run as a complicated-subsystem team inside it. It reports to the Technical Director, or to the AI Architect role if that role is created.

**Red team independence.** Red team findings go to the system owner, security and the Technical Director at the same time, so no single owner can bury a result.

## Governance, safety and rules of engagement

The lab is held to a higher standard than the systems it tests, and it runs its own work through THEMIS.

- **AERB oversight.** Transition decisions are recorded as ADRs. The lab director holds an advisory AERB seat for SI matters.
- **Rules of engagement.** Every red team campaign has written ROE signed by the system owner and security: scope, targets, allowed techniques, stop conditions and contacts. No testing in production without explicit approval.
- **Findings handling.** Findings are marked sensitive, disclosed to owners with a remediation window, tracked to closure and retested. They are framed as system weaknesses, never as blame.
- **Data handling.** The sandbox uses synthetic data or approved replicas. Collected content from the Stacks enters only through approved pipelines.
- **Human subjects.** Teaming studies with employees require informed consent and review by an appointed body. Study data is never used for performance evaluation.
- **Dogfooding.** Lab agents run under MOIRAI bounds with ARBOR custody and ARGUS monitoring, so the lab is THEMIS's first customer.

## Infrastructure

Everything is self-hosted inside our environment and mirrors the production stack, so a proven prototype transitions without rearchitecting.

- **Sandbox enclave.** An isolated namespace on Platforma, deployed through Nitro, walled off from production data and networks.
- **Models.** Self-hosted open-weight frontier models plus any frontier models approved for the environment, behind a model router for per-subtask selection.
- **Harness.** Non-production replicas of Lumbra (Nebula orchestration, Astrolabe monitoring), the Tyk MCP gateway and the MCP registry.
- **Evaluation and red team tooling.** Open-source candidates to evaluate first: Inspect for evaluations, garak for model vulnerability scanning and PyRIT for automated red team campaigns.
- **Compute.** A dedicated GPU quota on the Platforma cluster. Size is an open question for the platform team.

## Measures of success

The lab is judged on transitions and measured mission impact, not on demos. Proposed year one targets:

| Measure | Year 1 target |
| --- | --- |
| Experiments started | 12 or more, with kill rate reported, not penalized |
| Transitions accepted by a platform owner | 3 |
| Mission impact per transition | Baseline and post-transition measure (cycle time, hours returned) in the Metrics that Matter framework |
| Red team coverage | Every SI system entering production assessed; 4 standing campaigns |
| Time to remediate critical SI findings | Baseline set in Q2, then reduced |
| THEMIS services running in the sandbox | MOIRAI, ARBOR and ARGUS |
| Trust calibration in the field | Reliance-Accuracy Index measured in at least one live workflow |

## Phased roadmap

The lab charters this quarter, stands up alongside MACH1's January shift to user-facing delivery, and lands its first transitions by mid 2027.

&#91;embedded content: DAEDALUS roadmap · 4 phases, 3 gates\]

Each phase is funded only when its gate is met, so leadership can stop the lab at any gate with little sunk cost.

## Risks and mitigations

The biggest risk is a lab that produces impressive demos nobody adopts; the gates and sponsorship rules exist to prevent it.

| Risk | Mitigation |
| --- | --- |
| Lab becomes an ivory tower | Every experiment needs a named mission sponsor; transition requires a platform owner to accept it |
| Shadow SI continues outside the lab | A fast intake lane, and AERB policy that routes new SI experiments through it |
| Red team findings are unwelcome | ROE signed before testing; findings go to the Technical Director as well as the owner |
| Talent leaves for industry | A staff career path, the fellows rotation and internal publication of results |
| Compute is scarce in a restricted environment | A protected quota on Platforma; favor open-weight models sized to available GPUs |
| Overlap with platform teams or an AI Architect role | Charter boundaries above: the lab proves, platforms run, the architect sets standards |
| THEMIS ownership is unclear | Settle the boundary between doctoral research and organizational IP before the lab adopts it |

## Decisions requested

Five decisions start the lab this quarter:

1. Approve the DAEDALUS charter and working name.
2. Approve four founding positions now (director, applied SI engineer, assurance architect, red team lead) and eight more through 2027.
3. Confirm the reporting line: Technical Director, or the AI Architect role if created.
4. Grant standing red team authority over all SI systems under signed ROE.
5. Allocate a sandbox namespace and GPU quota on Platforma.

**Open questions**

- Year one budget and GPU quantity
- Which body reviews human-subjects studies with employees
- The IP boundary between THEMIS as doctoral research and as an organizational platform
