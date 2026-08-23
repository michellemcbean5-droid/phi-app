"""
seed_skills.py - Seed the PHI database with 100 enterprise engineering skills
across 5 domains as specified in the Master Mistral Activation Prompt.

Usage:
    python seed_skills.py

Requirements:
    - DATABASE_URL environment variable must be set
    - Run after schema.sql has been applied to the database
"""

import os
from datetime import timezone, datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database import Base, SkillDomain, Skill, _uuid, _now

# Domain definitions with their skills
DOMAINS = {
    "Distributed Systems & Backend Engineering": {
        "description": "Enterprise-grade distributed systems architecture, microservices, event-driven systems, and backend infrastructure",
        "display_order": 1,
        "skills": [
            {"name": "Microservices Bounded Context Design", "skill_number": 1, "description": "Design microservices with clear bounded contexts using Domain-Driven Design principles", "tags": ["DDD", "microservices", "architecture"]},
            {"name": "Event-Driven Architecture with Apache Kafka", "skill_number": 2, "description": "Implement scalable event-driven systems using Apache Kafka for message streaming and event sourcing", "tags": ["Kafka", "event-driven", "messaging"]},
            {"name": "CQRS & Event Sourcing Implementation", "skill_number": 3, "description": "Separate read and write models with Command Query Responsibility Segregation and event sourcing patterns", "tags": ["CQRS", "event-sourcing", "pattern"]},
            {"name": "Directed Acyclic Graph (DAG) Workflow Orchestration", "skill_number": 4, "description": "Design and implement workflow orchestration using DAGs for complex task dependencies", "tags": ["DAG", "workflow", "orchestration"]},
            {"name": "API Gateway and Reverse Proxy Configuration", "skill_number": 5, "description": "Configure API gateways and reverse proxies for routing, load balancing, and security", "tags": ["API Gateway", "reverse proxy", "NGINX"]},
            {"name": "Service Mesh (Istio/Envoy) mTLS Integration", "skill_number": 6, "description": "Implement service mesh architecture with mutual TLS for secure service-to-service communication", "tags": ["Istio", "Envoy", "mTLS", "service mesh"]},
            {"name": "Circuit Breaker and Retry Jitter Patterns", "skill_number": 7, "description": "Implement resilience patterns including circuit breakers and retry with jitter for fault tolerance", "tags": ["resilience", "circuit breaker", "retry"]},
            {"name": "Token Bucket Rate Limiting Architecture", "skill_number": 8, "description": "Design and implement rate limiting using token bucket algorithm for API protection", "tags": ["rate limiting", "token bucket", "API protection"]},
            {"name": "Distributed Tracing via OpenTelemetry & Jaeger", "skill_number": 9, "description": "Implement distributed tracing across microservices using OpenTelemetry and Jaeger", "tags": ["tracing", "OpenTelemetry", "Jaeger", "observability"]},
            {"name": "Horizontal Sharding and Read Replicas", "skill_number": 10, "description": "Design database horizontal sharding and read replica strategies for scalability", "tags": ["sharding", "read replicas", "scalability"]},
            {"name": "CAP Theorem and Eventual Consistency Management", "skill_number": 11, "description": "Apply CAP theorem principles and manage eventual consistency in distributed systems", "tags": ["CAP theorem", "consistency", "distributed systems"]},
            {"name": "Redis Cache Invalidation & Stampede Mitigation", "skill_number": 12, "description": "Implement Redis caching with invalidation strategies and stampede protection", "tags": ["Redis", "caching", "cache invalidation"]},
            {"name": "gRPC and Protocol Buffers Service Contract Design", "skill_number": 13, "description": "Design service contracts using gRPC and Protocol Buffers for efficient inter-service communication", "tags": ["gRPC", "Protocol Buffers", "RPC"]},
            {"name": "WebSocket Real-time Telemetry Streaming", "skill_number": 14, "description": "Implement real-time telemetry streaming using WebSockets for live data feeds", "tags": ["WebSocket", "real-time", "telemetry"]},
            {"name": "Distributed Transaction Management via Saga Pattern", "skill_number": 15, "description": "Manage distributed transactions using the Saga pattern for long-running business processes", "tags": ["Saga pattern", "distributed transactions"]},
            {"name": "Dead Letter Queue (DLQ) Error Handling", "skill_number": 16, "description": "Implement Dead Letter Queue patterns for handling failed messages and retries", "tags": ["DLQ", "error handling", "message queue"]},
            {"name": "Database Migration and Zero-Downtime Deployment", "skill_number": 17, "description": "Execute database migrations with zero-downtime deployment strategies", "tags": ["migration", "zero-downtime", "deployment"]},
            {"name": "High-Throughput Message Broker Topic Partitioning", "skill_number": 18, "description": "Design and implement topic partitioning strategies for high-throughput message brokers", "tags": ["message broker", "partitioning", "Kafka"]},
            {"name": "OAuth2 and OpenID Connect Authorization Frameworks", "skill_number": 19, "description": "Implement OAuth2 and OpenID Connect for authentication and authorization", "tags": ["OAuth2", "OpenID Connect", "authentication"]},
            {"name": "Automated Load Balancing and Ingress Controller Setup", "skill_number": 20, "description": "Configure automated load balancing and ingress controllers for Kubernetes and cloud environments", "tags": ["load balancing", "ingress", "Kubernetes"]},
        ]
    },
    "Mobile App Architecture & UI/UX Engineering": {
        "description": "React Native mobile application development with focus on performance, UX, and offline capabilities",
        "display_order": 2,
        "skills": [
            {"name": "React Native Architecture & Bridge Optimization", "skill_number": 21, "description": "Design optimized React Native architecture with efficient native bridge communication", "tags": ["React Native", "bridge", "architecture"]},
            {"name": "JSI (JavaScript Interface) & TurboModules Integration", "skill_number": 22, "description": "Implement JavaScript Interface and TurboModules for high-performance native module integration", "tags": ["JSI", "TurboModules", "React Native"]},
            {"name": "Fabric Rendering Engine & UI Thread Offloading", "skill_number": 23, "description": "Utilize Fabric rendering engine and offload UI rendering to dedicated threads", "tags": ["Fabric", "rendering", "UI thread"]},
            {"name": "Hermes AOT Compilation & Garbage Collection Tuning", "skill_number": 24, "description": "Configure Hermes engine with AOT compilation and GC tuning for optimal performance", "tags": ["Hermes", "AOT", "garbage collection"]},
            {"name": "60fps Animation Worklets via Reanimated & Gesture Handler", "skill_number": 25, "description": "Create smooth 60fps animations using Reanimated worklets and gesture handlers", "tags": ["Reanimated", "animation", "60fps"]},
            {"name": "State Management Architecture (Zustand/Redux Toolkit)", "skill_number": 26, "description": "Design scalable state management using Zustand or Redux Toolkit", "tags": ["state management", "Zustand", "Redux"]},
            {"name": "Virtual DOM Reconciliation & Render Jank Elimination", "skill_number": 27, "description": "Optimize virtual DOM reconciliation to eliminate render jank and improve performance", "tags": ["Virtual DOM", "reconciliation", "performance"]},
            {"name": "Offline-First WatermelonDB / SQLite Database Sync", "skill_number": 28, "description": "Implement offline-first data synchronization with WatermelonDB or SQLite", "tags": ["offline-first", "WatermelonDB", "SQLite"]},
            {"name": "Optimistic UI Updates & Asynchronous State Handling", "skill_number": 29, "description": "Implement optimistic UI updates for responsive user experience during async operations", "tags": ["optimistic updates", "async", "UI"]},
            {"name": "FlatList Virtualization & Component Lazy Loading", "skill_number": 30, "description": "Optimize FlatList performance with virtualization and lazy loading of components", "tags": ["FlatList", "virtualization", "lazy loading"]},
            {"name": "Deep Linking, Universal Links, & Android App Links", "skill_number": 31, "description": "Implement deep linking across platforms using Universal Links and Android App Links", "tags": ["deep linking", "Universal Links", "Android App Links"]},
            {"name": "Background Foreground Service & WorkManager Scheduling", "skill_number": 32, "description": "Create background services and schedule tasks using WorkManager on Android", "tags": ["background service", "WorkManager", "scheduling"]},
            {"name": "Biometric Authentication & Secure Storage Keychains", "skill_number": 33, "description": "Implement biometric authentication and secure storage using platform keychains", "tags": ["biometric", "authentication", "keychain"]},
            {"name": "Responsive Flexbox Layouts & Safe Area Insets", "skill_number": 34, "description": "Design responsive layouts using Flexbox with proper safe area insets", "tags": ["Flexbox", "responsive", "safe area"]},
            {"name": "Dark Mode High-Contrast Truck-Cab UI Optimization", "skill_number": 35, "description": "Optimize UI for dark mode and high-contrast environments like truck cabs", "tags": ["dark mode", "UI", "accessibility"]},
            {"name": "Custom Native Modules (Java/Kotlin Bridge)", "skill_number": 36, "description": "Develop custom native modules with Java/Kotlin bridge for React Native", "tags": ["native modules", "Java", "Kotlin"]},
            {"name": "Asset Bundling, Tree Shaking, and Code Splitting", "skill_number": 37, "description": "Optimize build process with asset bundling, tree shaking, and code splitting", "tags": ["bundling", "tree shaking", "code splitting"]},
            {"name": "ProGuard and R8 Code Obfuscation Configuration", "skill_number": 38, "description": "Configure ProGuard and R8 for code obfuscation and optimization", "tags": ["ProGuard", "R8", "obfuscation"]},
            {"name": "Over-The-Air (OTA) Update Integration", "skill_number": 39, "description": "Implement OTA updates for mobile applications without app store submission", "tags": ["OTA", "updates", "Expo"]},
            {"name": "Comprehensive Crashlytics Error Tracking & Monitoring", "skill_number": 40, "description": "Integrate Crashlytics for comprehensive error tracking and monitoring", "tags": ["Crashlytics", "error tracking", "monitoring"]},
        ]
    },
    "Agentic AI & LLM Orchestration": {
        "description": "Multi-agent systems, LLM orchestration, RAG pipelines, and AI reasoning patterns",
        "display_order": 3,
        "skills": [
            {"name": "Multi-Agent System (MAS) Topologies & Supervisor Nets", "skill_number": 41, "description": "Design multi-agent system architectures with supervisor networks for coordination", "tags": ["MAS", "multi-agent", "supervisor"]},
            {"name": "Retrieval-Augmented Generation (RAG) Pipeline Design", "skill_number": 42, "description": "Design and implement RAG pipelines for grounding LLM responses in external knowledge", "tags": ["RAG", "retrieval", "generation"]},
            {"name": "High-Dimensional Vector Embedding Space & HNSW Indexing", "skill_number": 43, "description": "Work with high-dimensional vector embeddings and implement HNSW indexing for efficient similarity search", "tags": ["embeddings", "HNSW", "vector search"]},
            {"name": "Semantic Search & Cosine Similarity Optimization", "skill_number": 44, "description": "Implement semantic search with optimized cosine similarity calculations", "tags": ["semantic search", "cosine similarity", "similarity"]},
            {"name": "Dynamic Prompt Template & Context Window Management", "skill_number": 45, "description": "Design dynamic prompt templates and manage context windows for LLM interactions", "tags": ["prompt engineering", "context window"]},
            {"name": "Semantic Chunking & Recursive Text Splitting", "skill_number": 46, "description": "Implement semantic chunking and recursive text splitting for document processing", "tags": ["chunking", "text splitting", "NLP"]},
            {"name": "ReAct (Reasoning and Acting) Prompt Engineering", "skill_number": 47, "description": "Design ReAct prompts that combine reasoning and action taking", "tags": ["ReAct", "reasoning", "prompt engineering"]},
            {"name": "Chain-of-Thought (CoT) & Tree-of-Thoughts (ToT) Reasoning", "skill_number": 48, "description": "Implement CoT and ToT reasoning patterns for complex problem solving", "tags": ["CoT", "ToT", "reasoning"]},
            {"name": "Toolformer Function Calling & JSON Mode Enforcement", "skill_number": 49, "description": "Implement function calling with Toolformer and enforce JSON mode for structured outputs", "tags": ["function calling", "Toolformer", "JSON mode"]},
            {"name": "Autonomous Agentic Loops & Self-Reflection Protocols", "skill_number": 50, "description": "Design autonomous agent loops with self-reflection capabilities", "tags": ["autonomous agents", "self-reflection", "AI"]},
            {"name": "Cross-Encoder Reranking & Maximum Marginal Relevance (MMR)", "skill_number": 51, "description": "Implement cross-encoder reranking with MMR for improved search relevance", "tags": ["reranking", "MMR", "cross-encoder"]},
            {"name": "Vector Database Architecture (Pinecone, pgvector, Weaviate)", "skill_number": 52, "description": "Design and implement vector database architectures using Pinecone, pgvector, or Weaviate", "tags": ["vector database", "Pinecone", "pgvector", "Weaviate"]},
            {"name": "Parameter-Efficient Fine-Tuning (PEFT) & QLoRA", "skill_number": 53, "description": "Implement parameter-efficient fine-tuning with QLoRA for LLM customization", "tags": ["PEFT", "QLoRA", "fine-tuning"]},
            {"name": "LLM Quantization (INT8/INT4) & Tensor Parallelism", "skill_number": 54, "description": "Apply quantization techniques and tensor parallelism for efficient LLM inference", "tags": ["quantization", "INT8", "INT4", "tensor parallelism"]},
            {"name": "Continuous Batching (vLLM) & PagedAttention Optimization", "skill_number": 55, "description": "Implement continuous batching and PagedAttention for optimized LLM serving", "tags": ["vLLM", "PagedAttention", "batching"]},
            {"name": "RLHF & Direct Preference Optimization (DPO) Alignment", "skill_number": 56, "description": "Apply RLHF and DPO techniques for LLM alignment with human preferences", "tags": ["RLHF", "DPO", "alignment"]},
            {"name": "Constitutional AI Guardrail & Prompt Injection Defense", "skill_number": 57, "description": "Implement Constitutional AI guardrails and defenses against prompt injection attacks", "tags": ["Constitutional AI", "guardrails", "prompt injection"]},
            {"name": "Knowledge Graph Grounding & Neuro-Symbolic Reasoning", "skill_number": 58, "description": "Ground LLM responses in knowledge graphs using neuro-symbolic reasoning approaches", "tags": ["knowledge graph", "neuro-symbolic", "reasoning"]},
            {"name": "Episodic, Semantic, and Working Memory Buffer Management", "skill_number": 59, "description": "Manage episodic, semantic, and working memory buffers for agent context", "tags": ["memory", "episodic", "semantic", "working memory"]},
            {"name": "Hallucination Mitigation & Deterministic Output Verification", "skill_number": 60, "description": "Implement techniques to mitigate hallucinations and verify deterministic outputs", "tags": ["hallucination", "verification", "deterministic"]},
        ]
    },
    "Logistics, Telematics, & Regulatory Compliance": {
        "description": "Trucking logistics, telematics integration, and US regulatory compliance automation",
        "display_order": 4,
        "skills": [
            {"name": "FMCSA USDOT & MC Authority Provisioning Automation", "skill_number": 61, "description": "Automate FMCSA USDOT and MC authority provisioning processes", "tags": ["FMCSA", "USDOT", "MC Authority", "compliance"]},
            {"name": "J1939 CAN Bus Protocol & OBD-II Telematics Parsing", "skill_number": 62, "description": "Parse J1939 CAN bus and OBD-II telematics data from heavy-duty vehicles", "tags": ["J1939", "CAN bus", "OBD-II", "telematics"]},
            {"name": "Electronic Logging Device (ELD) HOS Rule Engine", "skill_number": 63, "description": "Implement ELD systems with Hours of Service rule engine for compliance", "tags": ["ELD", "HOS", "compliance"]},
            {"name": "IFTA State-by-State Mileage Aggregation & Ray-Casting", "skill_number": 64, "description": "Calculate IFTA fuel tax reporting with state-by-state mileage aggregation", "tags": ["IFTA", "mileage", "tax"]},
            {"name": "IRP Apportioned Registration & UCR Compliance Tracking", "skill_number": 65, "description": "Manage IRP apportioned registration and UCR compliance tracking", "tags": ["IRP", "UCR", "registration", "compliance"]},
            {"name": "Drug & Alcohol Clearinghouse Integration", "skill_number": 66, "description": "Integrate with FMCSA Drug and Alcohol Clearinghouse for driver compliance", "tags": ["Clearinghouse", "drug testing", "compliance"]},
            {"name": "DAT & Truckstop Load Board Scraping & Arbitrage", "skill_number": 67, "description": "Scrape and analyze load boards for arbitrage opportunities", "tags": ["DAT", "Truckstop", "load board", "arbitrage"]},
            {"name": "Rate Per Mile (RPM) & Deadhead Margin Calculation", "skill_number": 68, "description": "Calculate rate per mile and deadhead margins for load profitability analysis", "tags": ["RPM", "deadhead", "profitability"]},
            {"name": "EDI ANSI ASC X12 (204, 214, 210) Parsing & AS2", "skill_number": 69, "description": "Parse EDI ANSI ASC X12 documents (204, 214, 210) with AS2 protocol support", "tags": ["EDI", "X12", "AS2", "204", "214", "210"]},
            {"name": "Computer Vision OCR for BOL & POD Document Extraction", "skill_number": 70, "description": "Use computer vision and OCR to extract data from BOL and POD documents", "tags": ["OCR", "computer vision", "BOL", "POD"]},
            {"name": "Automated Geofence Ingress/Egress Detention Tracking", "skill_number": 71, "description": "Track geofence ingress and egress for detention time calculation", "tags": ["geofence", "detention", "tracking"]},
            {"name": "Heavy Highway Vehicle Use Tax (Form 2290) Automation", "skill_number": 72, "description": "Automate Form 2290 Heavy Highway Vehicle Use Tax filing", "tags": ["Form 2290", "HVUT", "tax"]},
            {"name": "CSA Safety Score & PSP Report Analytics", "skill_number": 73, "description": "Analyze CSA safety scores and PSP reports for fleet management", "tags": ["CSA", "PSP", "safety", "analytics"]},
            {"name": "Hazmat Routing & Bridge Clearance Validation", "skill_number": 74, "description": "Validate routes for hazmat compliance and bridge clearance requirements", "tags": ["hazmat", "routing", "bridge clearance"]},
            {"name": "Heavy-Duty Mobile Mechanic Network Dispatch Logic", "skill_number": 75, "description": "Implement dispatch logic for heavy-duty mobile mechanic networks", "tags": ["dispatch", "mobile mechanic", "heavy-duty"]},
            {"name": "DPF Regeneration & Engine Fault Diagnostic (DTC) Routing", "skill_number": 76, "description": "Route DPF regeneration and engine fault diagnostics based on DTC codes", "tags": ["DPF", "DTC", "diagnostics", "regeneration"]},
            {"name": "Live Diesel Fuel Price Arbitrage & Routing Optimization", "skill_number": 77, "description": "Optimize routing based on live diesel fuel price arbitrage opportunities", "tags": ["fuel price", "arbitrage", "routing"]},
            {"name": "Autonomous Truck Stop Parking Reservation Engine", "skill_number": 78, "description": "Build autonomous system for truck stop parking reservation and management", "tags": ["parking", "reservation", "autonomous"]},
            {"name": "Accident Detection & First-Notice-of-Loss (FNOL) Generation", "skill_number": 79, "description": "Detect accidents and generate First Notice of Loss for insurance claims", "tags": ["accident detection", "FNOL", "insurance"]},
            {"name": "Insurance & Freight Claim Mitigation Workflows", "skill_number": 80, "description": "Implement workflows for insurance and freight claim mitigation", "tags": ["insurance", "claims", "mitigation"]},
        ]
    },
    "Fintech, Security, Robotics & DevOps": {
        "description": "Financial technology, security, robotics integration, and DevOps practices",
        "display_order": 5,
        "skills": [
            {"name": "Instant Factoring API Bridge & Webhook Settlements", "skill_number": 81, "description": "Build API bridges for instant factoring with webhook-based settlements", "tags": ["factoring", "API", "webhooks", "settlements"]},
            {"name": "Stripe Subscriptions & Dynamic Tiered Billing Engine", "skill_number": 82, "description": "Implement Stripe subscriptions with dynamic tiered billing models", "tags": ["Stripe", "subscriptions", "billing"]},
            {"name": "1099, W-9, & W-8BEN Tax Document Automation", "skill_number": 83, "description": "Automate generation and management of 1099, W-9, and W-8BEN tax documents", "tags": ["tax", "1099", "W-9", "W-8BEN"]},
            {"name": "Escrow Management & Fuel Surcharge Calculation", "skill_number": 84, "description": "Manage escrow accounts and calculate fuel surcharges for freight billing", "tags": ["escrow", "fuel surcharge", "billing"]},
            {"name": "AES-256 Data-at-Rest Encryption & Key Rotation", "skill_number": 85, "description": "Implement AES-256 encryption for data at rest with automated key rotation", "tags": ["AES-256", "encryption", "key rotation"]},
            {"name": "End-to-End mTLS & OAuth2 Token Management", "skill_number": 86, "description": "Implement end-to-end mutual TLS with OAuth2 token management", "tags": ["mTLS", "OAuth2", "security"]},
            {"name": "ROS2 & DDS Robotics Control Interface Integration", "skill_number": 87, "description": "Integrate ROS2 and DDS for robotics control interface", "tags": ["ROS2", "DDS", "robotics"]},
            {"name": "Autonomous Yard Truck & Trailer Coupling Telemetry", "skill_number": 88, "description": "Implement telemetry for autonomous yard truck and trailer coupling operations", "tags": ["autonomous", "yard truck", "telemetry"]},
            {"name": "LiDAR & SLAM Point Cloud Spatial Processing", "skill_number": 89, "description": "Process LiDAR point clouds and implement SLAM for spatial mapping", "tags": ["LiDAR", "SLAM", "point cloud"]},
            {"name": "Infrastructure as Code (IaC) via Terraform", "skill_number": 90, "description": "Define infrastructure as code using Terraform for reproducible deployments", "tags": ["IaC", "Terraform", "infrastructure"]},
            {"name": "CI/CD Pipeline Engineering with Fastlane & GitHub Actions", "skill_number": 91, "description": "Engineer CI/CD pipelines using Fastlane and GitHub Actions", "tags": ["CI/CD", "Fastlane", "GitHub Actions"]},
            {"name": "Monorepo Architecture & Branch by Abstraction", "skill_number": 92, "description": "Design monorepo architectures with branch by abstraction strategies", "tags": ["monorepo", "branch by abstraction"]},
            {"name": "Static Code Analysis, TDD, & Mutation Testing", "skill_number": 93, "description": "Implement static code analysis, test-driven development, and mutation testing", "tags": ["static analysis", "TDD", "mutation testing"]},
            {"name": "Immutable Infrastructure & Blue-Green Deployments", "skill_number": 94, "description": "Deploy immutable infrastructure with blue-green deployment strategies", "tags": ["immutable", "blue-green", "deployment"]},
            {"name": "Canary Release & Feature Flag Management (LaunchDarkly)", "skill_number": 95, "description": "Implement canary releases and feature flag management using LaunchDarkly", "tags": ["canary", "feature flags", "LaunchDarkly"]},
            {"name": "Docker Containerization & Kubernetes Orchestration", "skill_number": 96, "description": "Containerize applications with Docker and orchestrate with Kubernetes", "tags": ["Docker", "Kubernetes", "containerization"]},
            {"name": "Prometheus Monitoring & Grafana Dashboard Visualization", "skill_number": 97, "description": "Implement monitoring with Prometheus and create dashboards in Grafana", "tags": ["Prometheus", "Grafana", "monitoring"]},
            {"name": "Log Aggregation & Structured JSON Logging (ELK)", "skill_number": 98, "description": "Aggregate logs and implement structured JSON logging with ELK stack", "tags": ["ELK", "logging", "aggregation"]},
            {"name": "Automated App Store Connect & Google Play Console Deployments", "skill_number": 99, "description": "Automate deployments to App Store Connect and Google Play Console", "tags": ["App Store", "Google Play", "deployment"]},
            {"name": "Production Release Engineering & AAB Signing Signoff", "skill_number": 100, "description": "Manage production release engineering with AAB signing and signoff processes", "tags": ["release engineering", "AAB", "signing"]},
        ]
    }
}


def create_domains_and_skills(session):
    """Create all skill domains and their associated skills."""
    print("Creating skill domains and skills...")
    
    for domain_name, domain_data in DOMAINS.items():
        # Check if domain already exists
        domain_exists = session.execute(
            text("SELECT 1 FROM skill_domains WHERE name = :name"),
            {"name": domain_name}
        ).fetchone()
        
        if domain_exists:
            print(f"  Domain '{domain_name}' already exists, skipping...")
            # Get the existing domain
            domain = session.execute(
                text("SELECT id FROM skill_domains WHERE name = :name"),
                {"name": domain_name}
            ).fetchone()
            domain_id = domain[0]
        else:
            # Create new domain
            domain = SkillDomain(
                id=_uuid(),
                name=domain_name,
                description=domain_data["description"],
                display_order=domain_data["display_order"],
                is_active=True,
                created_at=_now(),
                updated_at=_now()
            )
            session.add(domain)
            session.commit()
            session.refresh(domain)
            domain_id = domain.id
            print(f"  Created domain: {domain_name}")
        
        # Create skills for this domain
        for skill_data in domain_data["skills"]:
            skill_exists = session.execute(
                text("SELECT 1 FROM skills WHERE skill_number = :number"),
                {"number": skill_data["skill_number"]}
            ).fetchone()
            
            if skill_exists:
                print(f"    Skill #{skill_data['skill_number']} already exists, skipping...")
                continue
            
            skill = Skill(
                id=_uuid(),
                domain_id=domain_id,
                name=skill_data["name"],
                description=skill_data["description"],
                display_order=skill_data["skill_number"],
                skill_number=skill_data["skill_number"],
                is_active=True,
                tags=skill_data["tags"],
                created_at=_now(),
                updated_at=_now()
            )
            session.add(skill)
            print(f"    Created skill #{skill_data['skill_number']}: {skill_data['name']}")
        
        session.commit()
    
    print(f"\nSuccessfully created all domains and skills!")


def main():
    """Main seed function."""
    database_url = os.getenv("DATABASE_URL", "sqlite:///./phi.db")
    
    print(f"Connecting to database: {database_url}")
    
    # Create engine
    if database_url.startswith("sqlite"):
        engine = create_engine(database_url, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(
            database_url,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables if they don't exist
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    # Seed the data
    session = SessionLocal()
    try:
        create_domains_and_skills(session)
        print("\nSkill seeding completed successfully!")
    except Exception as e:
        print(f"\nError during seeding: {e}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
