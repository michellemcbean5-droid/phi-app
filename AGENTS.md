# AI Agents Configuration

This file documents the AI agents (workers) used in the Prince Haul Intelligence (PHI) platform.

## 🎯 Overview

PHI uses a **15-worker AI command center** to automate and optimize trucking operations. Each worker is a specialized AI agent that handles specific tasks within the freight matching, dispatch, and operations workflow.

## 🏗️ Worker Architecture

### Base Worker Interface
```typescript
interface WorkerBase {
  id: string;              // Unique identifier
  name: string;           // Worker name/type
  status: WorkerStatus;   // 'active' | 'idle' | 'error'
  tasksToday: number;     // Tasks completed today
  revenueImpact: number;  // Revenue impact in dollars
  lastHeartbeat: string;  // Last activity timestamp
}
```

### Worker Status
- **active**: Worker is currently processing tasks
- **idle**: Worker is available but not processing
- **error**: Worker encountered an error

## 🤖 Worker Definitions

### 1. LoadFinderWorker
- **ID:** `load-finder`
- **Purpose:** Discovers available loads from DAT, Truckstop, and other load boards
- **Key Features:**
  - Real-time load board monitoring
  - Filtering by equipment type, location, rate
  - Load aggregation and deduplication
  - Rate trend analysis
- **Revenue Impact:** High - Directly affects load acquisition

### 2. NegotiationStrategyWorker
- **ID:** `negotiation-strategy`
- **Purpose:** Optimizes negotiation strategies for better rates
- **Key Features:**
  - Market rate analysis
  - Broker rating consideration
  - Historical rate comparison
  - Counter-offer generation
- **Revenue Impact:** High - Improves profit margins

### 3. RouteAnalysisWorker
- **ID:** `route-analysis`
- **Purpose:** Analyzes and optimizes routes for efficiency
- **Key Features:**
  - Multi-stop route optimization
  - Fuel cost calculation
  - Traffic and weather consideration
  - Dead mile minimization
- **Revenue Impact:** Medium - Reduces operational costs

### 4. FuelOptimizerWorker
- **ID:** `fuel-optimizer`
- **Purpose:** Optimizes fuel consumption and costs
- **Key Features:**
  - Fuel price comparison
  - Optimal fuel stop recommendations
  - Fuel efficiency monitoring
  - Tax-optimized fuel purchasing
- **Revenue Impact:** Medium - Reduces fuel expenses

### 5. ComplianceAuditWorker
- **ID:** `compliance-audit`
- **Purpose:** Ensures compliance with transportation regulations
- **Key Features:**
  - Hours of Service (HOS) tracking
  - DOT regulation compliance
  - IFTA fuel tax reporting
  - Safety score monitoring
- **Revenue Impact:** Low - Prevents fines and violations

### 6. AutoBookingEngine
- **ID:** `auto-booking`
- **Purpose:** Automates the load booking process
- **Key Features:**
  - Instant booking for high-priority loads
  - Rate confirmation automation
  - Broker communication templates
  - Booking confirmation tracking
- **Revenue Impact:** Very High - Accelerates revenue generation

### 7. LoadScoringWorker
- **ID:** `load-scoring`
- **Purpose:** Scores and ranks loads for optimal selection
- **Key Features:**
  - RPM (Rate Per Mile) analysis
  - Broker reliability scoring
  - Route profitability calculation
  - Risk assessment
- **Revenue Impact:** High - Ensures best load selection

### 8. ProfitAnalystWorker
- **ID:** `profit-analyst`
- **Purpose:** Analyzes profitability metrics and trends
- **Key Features:**
  - Net profit calculation
  - Cost per mile analysis
  - Revenue forecasting
  - Profitability recommendations
- **Revenue Impact:** High - Maximizes profitability

### 9. DriverAvailabilityWorker
- **ID:** `driver-availability`
- **Purpose:** Manages and tracks driver availability
- **Key Features:**
  - Driver schedule management
  - HOS compliance tracking
  - Availability forecasting
  - Driver assignment optimization
- **Revenue Impact:** Medium - Ensures optimal driver utilization

### 10. MarketAnalysisWorker
- **ID:** `market-analysis`
- **Purpose:** Analyzes freight market trends and patterns
- **Key Features:**
  - Lane rate analysis
  - Seasonal trend identification
  - Market demand forecasting
  - Competitive intelligence
- **Revenue Impact:** Medium - Informs strategic decisions

### 11. DocumentProcessingWorker
- **ID:** `document-processing`
- **Purpose:** Automates document processing and management
- **Key Features:**
  - BOL (Bill of Lading) generation
  - Rate confirmation automation
  - Proof of Delivery processing
  - Compliance document management
- **Revenue Impact:** Medium - Reduces administrative overhead

### 12. SocialSchedulerWorker
- **ID:** `social-scheduler`
- **Purpose:** Manages social media and marketing activities
- **Key Features:**
  - Load posting automation
  - Social media scheduling
  - Reputation management
  - Marketing campaign tracking
- **Revenue Impact:** Low - Enhances brand visibility

### 13. CustomerSupportWorker
- **ID:** `customer-support`
- **Purpose:** Handles customer support and communication
- **Key Features:**
  - Automated responses to common inquiries
  - Load tracking updates
  - Issue escalation
  - Customer satisfaction monitoring
- **Revenue Impact:** Medium - Improves customer retention

### 14. AnalyticsWorker
- **ID:** `analytics`
- **Purpose:** Collects and analyzes operational data
- **Key Features:**
  - KPI tracking and reporting
  - Performance metrics analysis
  - Usage pattern identification
  - Predictive analytics
- **Revenue Impact:** Medium - Provides actionable insights

### 15. NotificationWorker
- **ID:** `notification`
- **Purpose:** Manages notifications and alerts
- **Key Features:**
  - Load assignment notifications
  - Status update alerts
  - Reminder notifications
  - Emergency alerts
- **Revenue Impact:** Low - Improves user engagement

## 📊 Worker Performance Metrics

Each worker tracks the following metrics:

### Core Metrics
- **Tasks Today:** Number of tasks completed in the current day
- **Revenue Impact:** Estimated revenue impact in dollars
- **Status:** Current operational status
- **Last Heartbeat:** Timestamp of last activity

### Performance Indicators
- **Response Time:** Average time to complete a task
- **Success Rate:** Percentage of successful task completions
- **Error Rate:** Percentage of failed task attempts
- **Uptime:** Percentage of time worker is available

## 🔄 Worker Orchestration

The `WorkerOrchestrator` class manages the coordination between workers:

### Key Features
- **Task Distribution:** Intelligently distributes tasks to appropriate workers
- **Load Balancing:** Ensures even distribution of work across workers
- **Dependency Management:** Handles worker dependencies and sequencing
- **Error Handling:** Manages worker failures and retries
- **Monitoring:** Tracks worker health and performance

### Orchestration Patterns

#### 1. Sequential Processing
```
LoadFinderWorker → LoadScoringWorker → AutoBookingEngine
```

#### 2. Parallel Processing
```
RouteAnalysisWorker
    ↓
FuelOptimizerWorker
    ↓
ProfitAnalystWorker
```

#### 3. Conditional Processing
```
If (load.rpm > 3.5)
    → AutoBookingEngine
Else
    → NegotiationStrategyWorker
```

## 🛠️ Worker Development

### Creating a New Worker

1. **Define the Worker Interface:**
```typescript
// src/workers/NewWorker.ts
export interface NewWorker extends NamedWorker<'NewWorker'> {
  // Custom properties
  customProperty: string;
}
```

2. **Implement Worker Logic:**
```typescript
// src/workers/NewWorker.ts
export class NewWorkerImpl {
  private config: NewWorkerConfig;
  
  constructor(config: NewWorkerConfig) {
    this.config = config;
  }
  
  async processTask(task: Task): Promise<TaskResult> {
    // Worker logic here
    return { success: true, data: {} };
  }
}
```

3. **Add to Worker Definitions:**
```typescript
// src/workers/workers-15x.ts
export interface NewWorker extends NamedWorker<'NewWorker'> {}

export type WorkerDefinition = 
  | LoadFinderWorker
  | NegotiationStrategyWorker
  | NewWorker
  // ... other workers
;

const WORKER_DEFINITIONS: WorkerDefinition[] = [
  // ... existing workers
  buildWorker({ 
    id: 'new-worker', 
    name: 'NewWorker', 
    status: 'active', 
    tasksToday: 0, 
    revenueImpact: 0, 
    lastHeartbeat: new Date().toISOString() 
  }),
];
```

4. **Register in Store:**
```typescript
// src/store/workerStore.ts
// Worker will be automatically included via WORKER_DEFINITIONS
```

### Worker Configuration

Each worker can be configured with:

```typescript
interface WorkerConfig {
  // Performance settings
  maxConcurrentTasks: number;
  taskTimeout: number; // in milliseconds
  retryAttempts: number;
  
  // Resource limits
  maxMemoryUsage: number; // in MB
  maxCPUUsage: number; // percentage
  
  // Monitoring settings
  heartbeatInterval: number; // in milliseconds
  metricsCollectionInterval: number; // in milliseconds
  
  // Error handling
  errorThreshold: number; // max errors before marking as error
  recoveryTimeout: number; // in milliseconds
}
```

## 📈 Worker Performance Optimization

### Caching
- **Rate Data Cache:** Caches lane rates for 1 hour
- **Location Cache:** Caches geolocation data for 5 minutes
- **Broker Cache:** Caches broker information for 24 hours

### Rate Limiting
- **API Rate Limiting:** Respects API rate limits
- **Task Throttling:** Limits concurrent tasks per worker
- **Backpressure Handling:** Manages system load

### Error Handling
- **Automatic Retries:** Retries failed tasks up to 3 times
- **Circuit Breakers:** Temporarily disables workers with high error rates
- **Fallback Mechanisms:** Uses alternative data sources when primary fails

## 🔍 Monitoring and Observability

### Metrics Collection
- **Task Metrics:** Count, duration, success rate
- **Resource Metrics:** CPU, memory, network usage
- **Performance Metrics:** Response time, throughput
- **Error Metrics:** Error count, error rate, error types

### Alerting
- **Worker Down:** Alert when worker status is 'error' for >5 minutes
- **High Error Rate:** Alert when error rate >10%
- **Performance Degradation:** Alert when response time >2x baseline
- **Resource Exhaustion:** Alert when CPU/memory usage >80%

### Logging
- **Debug Logs:** Detailed logs for development
- **Info Logs:** Important operational events
- **Warning Logs:** Potential issues
- **Error Logs:** Errors and exceptions

## 🚀 Deployment and Scaling

### Scaling Strategies
- **Horizontal Scaling:** Add more instances of the same worker
- **Vertical Scaling:** Increase resources for high-demand workers
- **Auto-scaling:** Automatically scale based on workload

### Deployment Patterns
- **Blue-Green Deployment:** Zero-downtime worker updates
- **Canary Deployment:** Gradual rollout of new worker versions
- **Feature Flags:** Enable/disable workers dynamically

## 📚 Best Practices

### Worker Design
1. **Single Responsibility:** Each worker should have one clear purpose
2. **Stateless:** Workers should be stateless where possible
3. **Idempotent:** Tasks should be idempotent (safe to retry)
4. **Isolated:** Workers should not depend on each other's internal state
5. **Observable:** Workers should emit metrics and logs

### Error Handling
1. **Graceful Degradation:** Workers should fail gracefully
2. **Circuit Breakers:** Implement circuit breakers for external dependencies
3. **Retries:** Implement intelligent retry logic
4. **Fallbacks:** Provide fallback mechanisms when possible
5. **Alerting:** Alert on critical failures

### Performance
1. **Caching:** Cache frequently accessed data
2. **Batching:** Batch similar tasks when possible
3. **Parallelization:** Process independent tasks in parallel
4. **Optimization:** Optimize algorithms and data structures
5. **Monitoring:** Monitor performance metrics

## 🔧 Troubleshooting

### Common Issues

#### Worker Not Starting
- **Check:** Worker configuration
- **Check:** Dependencies are installed
- **Check:** No syntax errors in worker code
- **Check:** Worker is registered in WORKER_DEFINITIONS

#### Worker Stuck in 'error' Status
- **Check:** Error logs for the worker
- **Check:** External dependencies (APIs, databases)
- **Check:** Resource limits (memory, CPU)
- **Action:** Restart the worker

#### High Error Rate
- **Check:** Input data quality
- **Check:** External API availability
- **Check:** Network connectivity
- **Action:** Implement better error handling

#### Performance Degradation
- **Check:** Resource usage (CPU, memory)
- **Check:** Task queue length
- **Check:** External API response times
- **Action:** Optimize worker code or scale resources

## 📖 API Reference

### WorkerOrchestrator

```typescript
class WorkerOrchestrator {
  constructor(workers: WorkerDefinition[] = WORKER_DEFINITIONS);
  
  // Worker management
  startWorker(workerId: string): void;
  stopWorker(workerId: string): void;
  startAllWorkers(): void;
  stopAllWorkers(): void;
  restartWorker(workerId: string): void;
  
  // Task management
  assignTask(workerId: string, task: Task): Promise<TaskResult>;
  assignTaskToBestWorker(task: Task): Promise<TaskResult>;
  getWorkerTasks(workerId: string): Task[];
  
  // Monitoring
  getWorkerStatus(workerId: string): WorkerStatus;
  getWorkerMetrics(workerId: string): WorkerMetrics;
  getAllWorkerStatuses(): Record<string, WorkerStatus>;
  getSystemHealth(): SystemHealth;
  
  // Configuration
  configureWorker(workerId: string, config: WorkerConfig): void;
  updateWorkerPriority(workerId: string, priority: number): void;
}
```

### Worker Interface

```typescript
interface Worker<T extends WorkerDefinition> {
  id: string;
  name: T['name'];
  status: WorkerStatus;
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  
  // Task processing
  processTask(task: Task): Promise<TaskResult>;
  canHandleTask(task: Task): boolean;
  
  // Monitoring
  getStatus(): WorkerStatus;
  getMetrics(): WorkerMetrics;
  getHealth(): WorkerHealth;
  
  // Configuration
  configure(config: WorkerConfig): void;
  setPriority(priority: number): void;
}
```

## 🎯 Future Enhancements

### Planned Workers
- **PredictiveMaintenanceWorker** - Predicts vehicle maintenance needs
- **FuelTaxOptimizerWorker** - Optimizes fuel tax reporting
- **LoadMatchingWorker** - Advanced load matching algorithms
- **RateForecastingWorker** - Predicts future freight rates
- **CarbonFootprintWorker** - Tracks and optimizes carbon emissions

### Enhanced Features
- **Machine Learning:** Integrate ML models for better predictions
- **Real-time Collaboration:** Enable real-time collaboration between workers
- **Adaptive Learning:** Workers learn from past experiences
- **Self-Optimization:** Workers optimize their own performance
- **Auto-scaling:** Automatic scaling based on workload

## 📞 Support

For worker-related issues, questions, or feedback:
- **Email:** workers@princehaulintelligence.com
- **Slack:** #workers channel
- **Documentation:** https://docs.princehaulintelligence.com/workers

## 📄 License

All worker code is licensed under the MIT License. See [LICENSE](../LICENSE) for details.
