# SI Architect Job Description

Oct 24, 2026 · @Adam

## Position summary

The SI Architect is the organization's senior technical authority on superintelligence (SI) and partners with the Technical Director to build it into an organization-wide capability. The role authors the SI technical strategy, the common SI contract every program builds on, and the governance that takes SI from isolated pilots to production, all within the enterprise architecture the Technical Director owns.

The application portfolio is the first adopter and proving ground. The SI contract, reference architecture, and standards are built for adoption across every program in the organization.

This is a senior individual contributor position with enterprise-wide scope. The SI Architect leads the Scale the Intelligence pillar of Project MACH1, shapes the organization's SI architecture and enablement program, is the technical owner of the SI orchestration layer and the enterprise model service, and is accountable to the Technical Director and senior leadership for SI technical outcomes across the organization. Every SI capability delivered under this program is verifiable, composable, connected, and resilient. The role reports to the Technical Director and sets SI technical direction for 200+ engineers, product owners, and the user experience team.

## Authority and partnership

The Technical Director owns the enterprise architecture and holds final authority over it, including its SI components. The SI Architect is the designated technical lead for the SI domain within that architecture: the recommending authority on SI reference architecture and patterns, model selection and build-versus-adopt decisions, the enterprise model service, and the readiness of SI workloads for production. Decisions with cost or platform impact go to the Technical Director for approval.

The SI Architect co-authors the SI strategy, roadmap, and investment priorities with the Technical Director, and chairs the change board for the SI contract. The SI Architect authors and maintains the contract; the Technical Director approves each major version. SI Technical Directives are drafted by the SI Architect and issued under the Technical Director's authority through the Architecture and Engineering Review Board (AERB), at which point they are binding on SI workloads.

The SI Architect has no direct reports. SI engineering teams are led by their own managers; the SI Architect sets their technical standards and patterns and works through them to deliver.

## Key responsibilities

**SI domain leadership and the SI contract**

- Serve as technical lead for the SI domain across the organization, under the Technical Director's architectural authority.
- Author and maintain the SI contract: one standard covering inference, data and retrieval, actions, tools, identity, evaluation and releases, controls and audit, and operations.
- Define deployment profiles for the contract across cloud, enclave, workstation, and disconnected device.
- Lead adoption of the contract across the organization, starting with the application portfolio.

**SI strategy and roadmap**

- Co-author the SI strategy with the Technical Director, translating the Scale the Intelligence pillar into a sequenced, funded roadmap with MACH1 milestones.
- Assess programs for SI opportunity, readiness, and risk; maintain a prioritized backlog of SI use cases ranked by mission value and feasibility.
- Define SI readiness criteria for capability platforms and serve as the SI readiness gate for workloads entering production, with final approval resting with the Technical Director.
- Advise executive leadership on SI investment, build-versus-adopt decisions, and model and tooling options for connected and disconnected environments.

**Reference architecture, orchestration, and the model service**

- Develop and maintain the reference architecture for the SI orchestration layer on behalf of the Technical Director, covering agentic orchestration, retrieval over organizational knowledge, model serving, evaluation, and observability.
- Serve as technical owner of the enterprise model service that provides governed model access, quota, and metering for SI workloads, setting its design and standards; the service is operated by its platform team.
- Design how SI agents consume capability platforms through governed APIs (gateway, workflow, documents, search, and authorization services).
- Design for portability across classified environments, with abstraction layers that keep provider choices reversible.
- Extend SI capabilities to disconnected and edge operational environments, including degraded-network and on-device inference.
- Establish the knowledge substrate and data contracts that SI capabilities depend on, in partnership with platform and data owners.
- Draft SI Architecture Decision Records and Technical Directives for the Technical Director's approval; lead the SI track of the AERB.

**SI governance, assurance, and trust**

- Define the SI governance architecture: policy enforcement, human oversight points, audit trails, model and prompt versioning, and continuous evaluation.
- Set standards for verifiability of SI outputs, including provenance, confidence reporting, and calibrated trust cues in user-facing experiences.
- Define security and resiliency requirements for SI workloads, including data handling boundaries, access control integration with the authorization service, and failure modes when models are unavailable.
- Run threat and risk reviews for SI capabilities before production deployment.

**Delivery enablement**

- Set the technical direction for the SI architecture and enablement teams, working through their managers.
- Build and maintain reusable SI building blocks (agent templates, evaluation harnesses, retrieval pipelines, guardrail libraries) that product teams adopt through the internal developer platform and CI/CD pipeline.
- Embed with product teams during their first SI deliveries, pairing on design and reviewing implementations until the team can deliver independently.
- Partner with the user experience team to design human-machine teaming patterns, including how users supervise, correct, and calibrate trust in SI features.
- Define SI-specific evaluation gates in the CI/CD pipeline so quality and safety are measured before release, not after.

**Technical leadership and accountability**

- Lead the technical side of the organization's SI program end to end: strategy, standards, delivery patterns, and measured mission outcomes, with resourcing and staffing decided by the Technical Director.
- Serve as the organization's senior technical authority on SI and, as delegated by the Technical Director, its principal SI representative to partner agencies, the Intelligence Community, auditors, and oversight bodies.
- Shape organizational and Community SI policy, translating federal mandates and national guidance into enforceable engineering standards.
- Brief the Technical Director and senior leadership on SI risk, investment, and landscape developments that change the roadmap.
- Build the organization's SI workforce: develop the SI architect bench, run the SI community of practice, and set SI skills standards for engineers.
- Report SI adoption, cost, and mission outcomes to the Technical Director and senior leadership each quarter.

## Required qualifications

- Demonstrated technical leadership of enterprise-wide programs, including setting strategy and delivering measurable mission outcomes through teams the candidate did not directly manage.
- Demonstrated ability to represent the organization at senior levels with partner agencies, oversight bodies, and executive leadership.
- Demonstrated experience architecting composable, API-first, cloud-native platforms (microservices, event-driven integration, API gateways, Kubernetes) portable across classified environments.
- Hands-on depth in model serving and inference infrastructure, vector and hybrid search, prompt and context engineering, evaluation and observability of model behavior, and the failure modes of generative systems.
- Experience defining and enforcing technical governance: architecture review, decision records, policy-as-code, or equivalent mechanisms across a large engineering organization.
- Working knowledge of SI risk and assurance frameworks (for example NIST AI RMF, ISO/IEC 42001) and the ability to translate them into engineering controls.
- Strong written communication; able to produce architecture documents, decision records, and executive briefings that technical and non-technical audiences act on.
- Ability to obtain and maintain the security clearance required for the position.

## Preferred qualifications

- Experience with agentic orchestration frameworks and workflow engines deployed on a Kubernetes-based internal developer platform.
- Background in human-centered design or human-machine teaming, including trust calibration, explainability, and human oversight design.
- Experience with domain-driven design and decomposing COTS platforms into bounded contexts.
- Experience with attribute-based or policy-based authorization and its integration into SI agent permissions.
- Prior work in defense, intelligence, or other regulated mission environments.
- Track record of building internal communities of practice or enablement programs at organizational scale.
- Experience deploying inference in disconnected, edge, or resource-constrained environments.
- Track record of authoring standards adopted beyond the author's own organization.

## Core competencies

- **Enterprise technical leadership.** Holds accountability for SI technical outcomes across the organization and leads through vision, standards, and measured results rather than headcount.
- **Systems thinking.** Treats SI as one layer of the organization's architecture and designs it once for every program to build on.
- **Partnership.** Works inside the Technical Director's architectural authority, brings recommendations with the evidence to decide them, and makes joint decisions visible in writing.
- **Judgment under uncertainty.** Separates durable architectural choices from those that should stay reversible as the SI landscape shifts.
- **Influence at scale.** Moves 200+ engineers across formerly separate organizations toward shared patterns through clarity, evidence, and enablement, backed by AERB-issued directives where needed.
- **Governance as enablement.** Treats guardrails as what makes rapid SI delivery safe, and designs them to be adopted rather than worked around.
- **Human-centered.** Starts from the analyst's or operator's workflow and designs SI to earn calibrated trust.
- **Bias for shipping.** Moves from foundation work to user-facing deliveries on a fixed timeline, and is candid about what that timeline can absorb.
