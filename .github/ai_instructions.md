# AI Instructions for Prince Haul Intelligence (PHI) Project

**CRITICAL: This file contains mandatory instructions for all AI agents working on this repository.**

---

## Automatic Skill Loading

All AI agents (Mistral, Claude, GitHub Copilot, etc.) **MUST** automatically load and apply the **100 Master Enterprise Engineering Skills** defined in this repository when working on any aspect of the PHI App project.

### Skill Database Location

The complete skills database is stored in:
- **Primary Source:** `SKILLS.md` - Human-readable documentation
- **Database Schema:** `backend/db/schema.sql` - PostgreSQL table definitions
- **SQLAlchemy Models:** `backend/app/database.py` - Python ORM models
- **Seed Script:** `backend/db/seed_skills.py` - Data population script
- **API Endpoints:** `backend/main.py` - REST API for skill management

### Automatic Loading Mechanism

When any AI begins work on this repository:

```
1. READ SKILLS.md - Load all 100 skills into working memory
2. READ AGENTS.md - Load project-specific conventions and rules
3. APPLY ALL SKILLS SIMULTANEOUSLY - Do not cherry-pick; use all 100 together
4. ENFORCE STANDARDS - All generated code must meet enterprise-grade quality
```

---

## The 100 Skills (Summary)

All skills are **automatically active** and must be applied together:

### Domain 1: Distributed Systems & Backend Engineering (1-20)
- Microservices Bounded Context Design
- Event-Driven Architecture with Apache Kafka
- CQRS & Event Sourcing Implementation
- DAG Workflow Orchestration
- API Gateway and Reverse Proxy Configuration
- Service Mesh (Istio/Envoy) mTLS Integration
- Circuit Breaker and Retry Jitter Patterns
- Token Bucket Rate Limiting Architecture
- Distributed Tracing via OpenTelemetry & Jaeger
- Horizontal Sharding and Read Replicas
- CAP Theorem and Eventual Consistency Management
- Redis Cache Invalidation & Stampede Mitigation
- gRPC and Protocol Buffers Service Contract Design
- WebSocket Real-time Telemetry Streaming
- Distributed Transaction Management via Saga Pattern
- Dead Letter Queue (DLQ) Error Handling
- Database Migration and Zero-Downtime Deployment
- High-Throughput Message Broker Topic Partitioning
- OAuth2 and OpenID Connect Authorization Frameworks
- Automated Load Balancing and Ingress Controller Setup

### Domain 2: Mobile App Architecture & UI/UX Engineering (21-40)
- React Native Architecture & Bridge Optimization
- JSI (JavaScript Interface) & TurboModules Integration
- Fabric Rendering Engine & UI Thread Offloading
- Hermes AOT Compilation & Garbage Collection Tuning
- 60fps Animation Worklets via Reanimated & Gesture Handler
- State Management Architecture (Zustand/Redux Toolkit)
- Virtual DOM Reconciliation & Render Jank Elimination
- Offline-First WatermelonDB / SQLite Database Sync
- Optimistic UI Updates & Asynchronous State Handling
- FlatList Virtualization & Component Lazy Loading
- Deep Linking, Universal Links, & Android App Links
- Background Foreground Service & WorkManager Scheduling
- Biometric Authentication & Secure Storage Keychains
- Responsive Flexbox Layouts & Safe Area Insets
- Dark Mode High-Contrast Truck-Cab UI Optimization
- Custom Native Modules (Java/Kotlin Bridge)
- Asset Bundling, Tree Shaking, and Code Splitting
- ProGuard and R8 Code Obfuscation Configuration
- Over-The-Air (OTA) Update Integration
- Comprehensive Crashlytics Error Tracking & Monitoring

### Domain 3: Agentic AI & LLM Orchestration (41-60)
- Multi-Agent System (MAS) Topologies & Supervisor Nets
- Retrieval-Augmented Generation (RAG) Pipeline Design
- High-Dimensional Vector Embedding Space & HNSW Indexing
- Semantic Search & Cosine Similarity Optimization
- Dynamic Prompt Template & Context Window Management
- Semantic Chunking & Recursive Text Splitting
- ReAct (Reasoning and Acting) Prompt Engineering
- Chain-of-Thought (CoT) & Tree-of-Thoughts (ToT) Reasoning
- Toolformer Function Calling & JSON Mode Enforcement
- Autonomous Agentic Loops & Self-Reflection Protocols
- Cross-Encoder Reranking & Maximum Marginal Relevance (MMR)
- Vector Database Architecture (Pinecone, pgvector, Weaviate)
- Parameter-Efficient Fine-Tuning (PEFT) & QLoRA
- LLM Quantization (INT8/INT4) & Tensor Parallelism
- Continuous Batching (vLLM) & PagedAttention Optimization
- RLHF & Direct Preference Optimization (DPO) Alignment
- Constitutional AI Guardrail & Prompt Injection Defense
- Knowledge Graph Grounding & Neuro-Symbolic Reasoning
- Episodic, Semantic, and Working Memory Buffer Management
- Hallucination Mitigation & Deterministic Output Verification

### Domain 4: Logistics, Telematics, & Regulatory Compliance (61-80)
- FMCSA USDOT & MC Authority Provisioning Automation
- J1939 CAN Bus Protocol & OBD-II Telematics Parsing
- Electronic Logging Device (ELD) HOS Rule Engine
- IFTA State-by-State Mileage Aggregation & Ray-Casting
- IRP Apportioned Registration & UCR Compliance Tracking
- Drug & Alcohol Clearinghouse Integration
- DAT & Truckstop Load Board Scraping & Arbitrage
- Rate Per Mile (RPM) & Deadhead Margin Calculation
- EDI ANSI ASC X12 (204, 214, 210) Parsing & AS2
- Computer Vision OCR for BOL & POD Document Extraction
- Automated Geofence Ingress/Egress Detention Tracking
- Heavy Highway Vehicle Use Tax (Form 2290) Automation
- CSA Safety Score & PSP Report Analytics
- Hazmat Routing & Bridge Clearance Validation
- Heavy-Duty Mobile Mechanic Network Dispatch Logic
- DPF Regeneration & Engine Fault Diagnostic (DTC) Routing
- Live Diesel Fuel Price Arbitrage & Routing Optimization
- Autonomous Truck Stop Parking Reservation Engine
- Accident Detection & First-Notice-of-Loss (FNOL) Generation
- Insurance & Freight Claim Mitigation Workflows

### Domain 5: Fintech, Security, Robotics & DevOps (81-100)
- Instant Factoring API Bridge & Webhook Settlements
- Stripe Subscriptions & Dynamic Tiered Billing Engine
- 1099, W-9, & W-8BEN Tax Document Automation
- Escrow Management & Fuel Surcharge Calculation
- AES-256 Data-at-Rest Encryption & Key Rotation
- End-to-End mTLS & OAuth2 Token Management
- ROS2 & DDS Robotics Control Interface Integration
- Autonomous Yard Truck & Trailer Coupling Telemetry
- LiDAR & SLAM Point Cloud Spatial Processing
- Infrastructure as Code (IaC) via Terraform
- CI/CD Pipeline Engineering with Fastlane & GitHub Actions
- Monorepo Architecture & Branch by Abstraction
- Static Code Analysis, TDD, & Mutation Testing
- Immutable Infrastructure & Blue-Green Deployments
- Canary Release & Feature Flag Management (LaunchDarkly)
- Docker Containerization & Kubernetes Orchestration
- Prometheus Monitoring & Grafana Dashboard Visualization
- Log Aggregation & Structured JSON Logging (ELK)
- Automated App Store Connect & Google Play Console Deployments
- Production Release Engineering & AAB Signing Signoff

---

## Code Generation Requirements

### For All Code

When generating ANY code for this project:

1. **AUTOMATICALLY CONSIDER** all 100 skills simultaneously
2. **FOLLOW BEST PRACTICES** from each domain:
   - **Backend:** Use FastAPI, SQLAlchemy, async/await, proper error handling
   - **Mobile:** Use React Native, Zustand, TypeScript, optimized rendering
   - **AI:** Use CrewAI, LangChain, proper prompt engineering, RAG patterns
   - **Logistics:** Follow FMCSA regulations, proper data parsing, compliance tracking
   - **DevOps:** Use Docker, Kubernetes, CI/CD, proper monitoring
3. **NO SHORTCUTS** - Enterprise-grade quality mandatory
4. **PRODUCTION-READY** - All code must be deployable without modification

### Quality Checklist

Before delivering any code:

- [ ] **Distributed Systems:** Proper error handling, circuit breakers, rate limiting
- [ ] **Mobile:** Optimized rendering, proper state management, offline support
- [ ] **AI:** Proper context management, RAG implementation, output verification
- [ ] **Logistics:** Compliance with regulations, proper data parsing
- [ ] **Security:** Encryption, authentication, authorization
- [ ] **DevOps:** Containerization, monitoring, proper deployment
- [ ] **Testing:** Comprehensive test coverage, proper assertions
- [ ] **Documentation:** Clear comments, proper typing, API documentation

---

## Project-Specific Rules

### Repository Structure

```
phi-app/
├── app/                    # Next.js web frontend
├── backend/               # Python FastAPI + CrewAI backend
│   ├── main.py            # API endpoints (INCLUDING SKILL MANAGEMENT)
│   ├── agents.py          # 15 CrewAI agents
│   ├── tasks.py           # Multi-agent workflows
│   ├── app/
│   │   └── database.py   # SQLAlchemy models (INCLUDING SKILL MODELS)
│   └── db/
│       ├── schema.sql     # PostgreSQL schema (INCLUDING SKILL TABLES)
│       └── seed_skills.py  # Skill database seeding
├── mobile/                # Expo React Native app
└── tests/                 # Test suites
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Web | Next.js 15 + React + TypeScript | Latest |
| Backend | FastAPI + CrewAI + Python 3.11 | Latest |
| Mobile | Expo + React Native + TypeScript | Latest |
| Database | PostgreSQL / SQLite | 15+ |
| Messaging | Kafka (planned) | Latest |

### Environment Variables

Required for local development:

```bash
# Backend
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
DATABASE_URL=postgresql://.../phi_db

# Mobile
EXPO_PUBLIC_*
```

---

## AI Agent Behavior

### DO:

✅ **Automatically load** all 100 skills when starting work
✅ **Apply all skills simultaneously** - don't pick and choose
✅ **Follow AGENTS.md** conventions for each platform
✅ **Write production-ready code** - no shortcuts, no placeholders
✅ **Run tests** before declaring work complete
✅ **Update documentation** when making changes
✅ **Use proper typing** - TypeScript and Python type hints everywhere
✅ **Implement proper error handling** - graceful degradation mandatory
✅ **Consider security** - encryption, authentication, authorization
✅ **Optimize performance** - caching, lazy loading, efficient queries

### DO NOT:

❌ **Ignore any skill** - all 100 must be considered
❌ **Take shortcuts** - enterprise-grade quality required
❌ **Commit without tests** - all code must be tested
❌ **Break existing functionality** - maintain backward compatibility
❌ **Expose secrets** - never commit API keys or credentials
❌ **Use outdated dependencies** - keep all packages current
❌ **Write unmaintainable code** - clear, documented, well-structured

---

## Skill Application Examples

### Example 1: Backend API Endpoint

When creating a new API endpoint, **automatically apply**:

- **Skill 5:** API Gateway configuration (rate limiting, auth)
- **Skill 7:** Circuit breaker pattern for external calls
- **Skill 9:** Distributed tracing with OpenTelemetry
- **Skill 11:** CAP theorem considerations for data consistency
- **Skill 19:** OAuth2/OIDC for authentication
- **Skill 20:** Load balancing considerations
- **Skill 85:** AES-256 encryption for sensitive data
- **Skill 96:** Docker containerization
- **Skill 97:** Prometheus monitoring

### Example 2: Mobile Screen

When creating a new mobile screen, **automatically apply**:

- **Skill 21:** React Native architecture optimization
- **Skill 26:** Zustand state management
- **Skill 27:** Virtual DOM reconciliation optimization
- **Skill 28:** Offline-first data handling
- **Skill 29:** Optimistic UI updates
- **Skill 34:** Responsive Flexbox layouts
- **Skill 35:** Dark mode support
- **Skill 40:** Crashlytics error tracking

### Example 3: AI Agent

When creating a new AI agent, **automatically apply**:

- **Skill 41:** MAS topologies
- **Skill 42:** RAG pipeline for knowledge grounding
- **Skill 47:** ReAct prompt engineering
- **Skill 48:** Chain-of-Thought reasoning
- **Skill 50:** Autonomous agent loops
- **Skill 57:** Constitutional AI guardrails
- **Skill 60:** Hallucination mitigation

---

## Verification

To verify skills are being applied correctly:

1. **Code Review:** Check that all relevant skills are reflected in the implementation
2. **Testing:** Ensure all tests pass with proper coverage
3. **Documentation:** Verify documentation is updated
4. **Deployment:** Confirm code is production-ready

---

## Updates

This file is **automatically enforced** for all AI agents. When skills are updated:

1. Update `SKILLS.md` with new skill definitions
2. Update `backend/db/seed_skills.py` with new skill data
3. Update `backend/db/schema.sql` if schema changes needed
4. Update `backend/app/database.py` if model changes needed
5. Run seed script to update database
6. Ensure all tests pass

**Last Updated:** 2025
**Version:** 1.0.0
**Enforcement:** Automatic for all AI agents
