# Applications and Data Enterprise Boundary Charter

Nov 6, 2026 · Adam Z. Stavely · Draft for joint review with the Data Enterprise Technical Director

## The line in the sand

**The Applications Enterprise owns what gives data purpose; the Data Enterprise owns what gives data reach and durability. The line between them is the published data product contract.**

In practice:

- **Applications Enterprise** owns the experience, application, orchestration, and service layers, plus the *meaning, quality, and lifecycle* of the data the organization creates (destined for the Atheneum).
- **Data Enterprise** owns transport, pipelines (ETL/ELT), storage platforms, and the knowledge graph, plus the data the organization collects (the Stacks). It is also the *custodian* of created data once it crosses the contract.
- **Neither side reaches into the other's internals.** Applications never write directly to Data Enterprise stores; Data Enterprise never reads application-private databases. Everything crosses through a versioned contract.

This charter exists so that every engineer, product owner, and leader in both enterprises can answer "whose job is this?" in under a minute, and so that the two enterprises speak one vocabulary when they say front-end, back-end, data, or platform.

## Layered ownership model

Seven layers, split by one seam. Everything above the seam is Applications; everything below is Data.

| Layer | What it contains | Owner |
| --- | --- | --- |
| Experience | SuperApps, UI components, design system, in-app help, BFFs | Applications |
| Orchestration | Business workflow (Flowable), SI agents (Lumbra), THEMIS controls | Applications |
| Service | Capability platforms, domain APIs, Tyk gateway, application state | Applications |
| **The seam** | **Publication, data product, event, and knowledge contracts** | **Joint** |
| Knowledge | Knowledge graph platform, core ontology, entity resolution, graph APIs | Data |
| Storage | The Stacks (collected data), Atheneum infrastructure (created data) | Data |
| Pipeline | ETL/ELT, change data capture, lineage, quality in flight | Data |
| Transport | Event and data fabric, messaging, file transfer | Data |

Created data: Applications owns its meaning and lifecycle; Data is the custodian. Collected data: Data is owner and custodian; Applications consumes it.

Nothing crosses the seam except through one of the four contract types defined below.

## Guiding principles

Eight principles decide ownership when this charter does not name a case explicitly.

1. **Purpose versus reach.** If the work decides what data *means* or what a person or agent *does* with it, it belongs to Applications. If the work decides how data *moves, persists, connects, or scales*, it belongs to Data.
2. **Origin sets the owner.** Data the organization creates (authored, entered, decided, produced by our applications) is owned by Applications. Data the organization collects from outside sources is owned by Data.
3. **Ownership is not custody.** The data owner is accountable for meaning, quality at origin, classification, and retention policy. The custodian operates the infrastructure that stores, protects, backs up, and moves it. One enterprise can be owner while the other is custodian.
4. **One reader, one owner.** Data read and written by a single service is that service's private state and part of the application. The moment a second consumer needs it, it becomes a data product and crosses the seam through a contract.
5. **Contracts, not connections.** No shared databases across the line. Every crossing is a versioned schema, API, or event contract with a named owner on each side.
6. **Domain semantics stay with the domain.** The enterprise closest to the business meaning defines the schema and vocabulary; the platform defines the mechanics (formats, lineage, retention enforcement).
7. **Platforms are paved roads.** Each enterprise offers its layer as a self-service product (consistent with Platforma and Nitro), so the other side consumes it without filing a ticket.
8. **Default to the consumer's clarity.** When two answers are defensible, choose the one that gives a mission user or engineer a single place to go.

## Scope of each enterprise

Ownership splits cleanly across nine areas; the "does not own" statements are as binding as the "owns" columns.

| Area | Applications Enterprise owns | Data Enterprise owns |
| --- | --- | --- |
| Experience | UI, UX research and design, design system, SuperApps, in-app help, accessibility | Nothing in the experience layer; Data tools that need a UI request it from Applications or use an approved COTS console |
| Application logic | Business rules, validation, domain models, application-private state stores | Nothing; Data does not embed business rules in pipelines |
| Orchestration | Workflow (Flowable), superintelligence (SI) orchestration and agents (Lumbra), human-in-the-loop steps, SI governance at the point of use (THEMIS) | Pipeline orchestration (scheduling and running ETL/ELT jobs) |
| Services and APIs | Capability platforms, domain APIs, API gateway (Tyk), service authorization (Cerbos policy decisions) | Data product APIs (read and query interfaces over the Stacks and the knowledge graph), published through the gateway |
| Created data | Owner: meaning, schema, quality at origin, classification, retention policy, Atheneum content model | Custodian: storage, backup, replication, retention execution, movement into the knowledge graph |
| Collected data | Consumer only | Owner and custodian: ingest, the Stacks, source agreements, provenance |
| Transport and pipelines | Emits events and data to contracted endpoints | Event and data transport fabric, ETL/ELT, CDC, lineage, data quality in flight |
| Storage platforms | Chooses and runs application-private stores within platform standards | Shared storage platforms, warehouses, lakes, the Stacks and Atheneum infrastructure, vector stores at enterprise scale |
| Knowledge graph | Contributes domain ontology for created data; consumes the graph | Graph platform, core ontology, entity resolution, graph APIs |

**Applications does not own:** shared storage infrastructure, the transport fabric, pipeline code, the knowledge graph platform, or the Stacks.

**Data does not own:** user interfaces, business rules, workflow or agent logic, domain API design, or the meaning of created data.

## The seam: contracts between enterprises

Four contract types are the only sanctioned ways to cross the line. Each has an owner on both sides and a version.

| Contract | Direction | Applications is accountable for | Data is accountable for |
| --- | --- | --- | --- |
| **Publication contract** (created data into the Atheneum) | Applications to Data | Schema, semantics, classification, quality at origin, retention policy, change notice | Landing zone, durability, lineage, retention enforcement, SLA on availability |
| **Data product contract** (collected or derived data out to apps) | Data to Applications | Declaring consumption, honoring usage and classification terms | Schema, freshness, quality SLOs, deprecation notice, query API |
| **Event contract** (domain events on the transport fabric) | Either way | Event schema and meaning for events it emits | Fabric availability, delivery guarantees, retention, replay |
| **Knowledge contract** (ontology and graph access) | Either way | Domain ontology terms for created data; correct use of graph APIs | Core ontology, entity resolution, graph API, versioning |

Minimum contents of every contract: owner names on both sides, schema and version, classification and access terms, quality and freshness expectations, change and deprecation process (default: one release of overlap and 30 days' notice for breaking changes, to be confirmed jointly), and the support path when it breaks.

## Who does what (RACI)

For activities that touch both enterprises, exactly one side is Accountable, with two deliberate exceptions at the end. R = Responsible, A = Accountable, C = Consulted, I = Informed.

| Activity | Applications | Data |
| --- | --- | --- |
| Define the content model and schema for created data | A, R | C |
| Validate data quality at the point of entry | A, R | I |
| Operate Atheneum storage, backup, and replication | C | A, R |
| Set retention and disposition policy for created data | A, R | C |
| Execute retention and disposition | I | A, R |
| Ingest and curate collected data into the Stacks | I | A, R |
| Build and run ETL/ELT pipelines | C | A, R |
| Data quality in flight and at rest (pipelines, Stacks) | I | A, R |
| Maintain the core ontology and knowledge graph platform | C | A, R |
| Propose ontology extensions for created-data domains | A, R | C |
| Design domain and business APIs | A, R | I |
| Design data product APIs | C | A, R |
| Operate the API gateway | A, R | C |
| Define authorization policy for application actions | A, R | C |
| Enforce data-level access at storage and query | C | A, R |
| Build SI agents, prompts, and retrieval orchestration | A, R | C |
| Generate and maintain enterprise embeddings and vector indexes | C | A, R |
| Design and build user-facing dashboards inside applications | A, R | C |
| Provide the metrics and semantic layer those dashboards read | C | A, R |
| Approve a new cross-enterprise contract | A (for its side) | A (for its side) |
| Triage an incident at the seam | R | R |

The last two rows are deliberately joint: each side is accountable for its half of a contract, and seam incidents are triaged together under one incident commander chosen by where the fault first surfaced.

## Gray zones and how each resolves

These are the places the two enterprises will otherwise argue. Each gets a proposed ruling and the principle behind it.

| Gray zone | Proposed ruling | Principle |
| --- | --- | --- |
| Application databases | Applications owns stores used by one service. Data sets platform standards (approved engines, backup minimums) but does not operate them. | One reader, one owner |
| An app database that others start reading | It must be published as a data product through a contract; direct reads are retired. | Contracts, not connections |
| Search (Elastic) | Indexes shaped for one application's queries belong to Applications. Enterprise search across the Stacks and Atheneum belongs to Data. The Elastic cluster platform needs a single operator (open question). | Purpose versus reach |
| Event streaming | Data operates the fabric. The emitting domain owns each event's schema and meaning. Workflow choreography across events is Applications. | Domain semantics stay with the domain |
| SI retrieval (RAG) | Data owns corpus preparation, chunking, embeddings, and enterprise vector indexes. Applications owns retrieval strategy, prompts, agents, grounding checks, and THEMIS controls. | Purpose versus reach |
| Forms and documents (Tiptap) | Authored content is created data: Applications owns the content model; it lands in the Atheneum via a publication contract. | Origin sets the owner |
| Reporting and analytics | Data owns the metrics and semantic layer. Applications owns any dashboard that lives inside an application. A standalone self-service BI tool needs a decision (open question). | Default to the consumer's clarity |
| Data quality | Applications prevents bad data at entry. Data detects and quarantines bad data in flight and at rest. Both report to the owner. | Ownership is not custody |
| Derived data | Data created by a pipeline (aggregates, entity resolution, enrichments) is owned by Data. Data created by an application's logic or an SI agent's output is owned by Applications. | Origin sets the owner |
| Access control | One shared attribute and policy vocabulary. Applications decides who can *act*; Data enforces who can *see* at storage and query. | Contracts, not connections |

## Lexicon

"Front-end" and "back-end" are relative terms: to an application engineer, back-end means services; to a data engineer, it means storage; to a mission user, everything behind the screen. **Rule: in cross-enterprise conversations and documents, use the layer names below instead of bare front-end or back-end.** Inside an enterprise, the local meanings in the first table are fine.

### Front-end and back-end, defined at each level

| Term | Inside Applications | Inside Data | Across the enterprises (use instead) |
| --- | --- | --- | --- |
| Front-end | Code that renders or runs for a person: UI, client logic, and the backend-for-frontend (BFF) that serves one experience | The ingest edge: connectors and landing zones where data enters | **Experience layer** |
| Back-end | Services, capability platforms, orchestration, and application-private state | Storage, warehouse, and graph platforms | **Service layer** (Applications) or **data platform** (Data) |
| Full stack | Experience layer through service layer for one product | Not used | Avoid; name the layers |

### Layers

| Term | Definition | Owner |
| --- | --- | --- |
| Experience layer | Everything a person sees and touches: SuperApps, UI components, design system, in-app help | Applications |
| Backend-for-frontend (BFF) | A thin service shaped for one experience; counts as experience layer for ownership | Applications |
| Orchestration layer | Coordination of steps across services: business workflow and SI agent orchestration | Applications |
| Service layer | Capability platforms and domain APIs that expose business capabilities | Applications |
| The seam | The contract boundary between the enterprises | Joint |
| Data platform | Shared transport, pipeline, storage, and knowledge infrastructure | Data |
| Transport | Movement of data and events between systems (streaming, messaging, file transfer) | Data |
| Pipeline | A scheduled or streaming job that extracts, transforms, and loads data (ETL/ELT) | Data |
| Knowledge graph | Connected entities and relationships governed by an ontology | Data |

### Data terms

| Term | Definition |
| --- | --- |
| Created data | Data the organization authors or produces through its applications and agents; lands in the Atheneum; owned by Applications |
| Collected data | Data acquired from outside sources; lands in the Stacks; owned by Data |
| Derived data | Data produced by transforming other data; owner follows where it was produced (pipeline or application) |
| Application state | Data private to one service, needed for it to function; not a data product |
| Data product | A published, contracted, discoverable dataset or API with a named owner and SLOs |
| Data contract | The versioned agreement that governs a crossing of the seam |
| System of record | The single authoritative source for a given fact |
| Data owner | Accountable for meaning, quality at origin, classification, and retention policy |
| Data custodian | Operates the infrastructure that stores, protects, and moves data |
| Data steward | Named person who answers day-to-day questions about a dataset on the owner's behalf |
| Ontology | The governed vocabulary of entity types and relationships in the knowledge graph |
| Upstream / downstream | Relative position in a flow; always name the system, never use alone |

## The one-minute ownership test

Ask these in order; the first "yes" decides.

1. **Does a person or agent see, touch, or act through it?** Applications.
2. **Does it encode a business rule, workflow step, or SI behavior?** Applications.
3. **Is it data only one service reads and writes?** Applications (application state).
4. **Is it data the organization created?** Applications owns it; Data is custodian once published.
5. **Does it move, transform, store at shared scale, or connect data?** Data.
6. **Is it data the organization collected?** Data.
7. **Still unclear?** Escalate.

**Escalation path:** the two leads involved try first (target: 5 working days). Unresolved cases go to the two Technical Directors jointly, then to the AERB for a binding ruling. Every ruling is added to the gray zones table so it is decided once.

## Open questions for the working session

- [ ] Who operates the shared Elastic platform: Applications (as part of the MACH1 stack) or Data (as enterprise search)?
- [ ] Does Data register its data product APIs on the Applications-run Tyk gateway, or run its own?
- [ ] Who owns a standalone self-service BI tool, if the organization keeps one?
- [ ] Where does the shared attribute and policy vocabulary for access control live, and who maintains it?
- [ ] Do enterprise vector indexes for SI retrieval sit with Data from day one, or start with Applications and migrate?
- [ ] What is the default breaking-change notice period for contracts (30 days proposed)?
- [ ] Who funds and staffs data stewards for created-data domains?
- [ ] How is this charter reviewed: every six months, or on any AERB ruling?
