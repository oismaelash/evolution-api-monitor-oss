**Pilot Status Monitor**

Complete Technical Documentation

PRD · ADR · Architecture · Database · Worker · API · Frontend · Billing · DevEx · Roadmap

Version 1.0 · March 2026 · evolutionapi.online · cloud.evolutionapi.online

# **1\. PRD - Product Requirements Document**

**Product: Pilot Status Monitor (evolutionapi.online / cloud.evolutionapi.online)**

Version: 1.0 | Status: In Review | Date: March 2026

## **1.1 Problem Statement**

Businesses operating at scale on WhatsApp via Evolution API manage dozens or hundreds of WhatsApp instances (numbers). A disconnected instance goes unnoticed until a customer reports silence - meaning real revenue loss, broken flows, and SLA violations.

Current pain points:

- No centralized visibility into instance health across projects
- Reconnection is manual - operators must log into Evolution dashboard, find the broken instance, scan QR
- No alerting system: engineers discover failures reactively
- Multi-tenant agencies manage numbers for many clients with zero tooling
- WhatsApp sessions expire silently - no native reconnect mechanism in Evolution API

## **1.2 Ideal Customer Profile (ICP)**

| **Segment**                          | **Profile**                                                                                     | **Volume**     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------- |
| WhatsApp Automation Agencies         | Runs 20-200 instances for multiple clients; needs multi-project management, per-client alerting | Primary        |
| SaaS Platforms Built on WhatsApp     | Product teams using Evolution as infrastructure; need uptime SLAs for their own customers       | Primary        |
| Enterprise IT Teams                  | Internal bots and notifications via WhatsApp; need compliance logging and uptime reports        | Secondary      |
| Independent Developers / Freelancers | 1-5 numbers, self-hosted, want open-source with basic monitoring                                | Tertiary (OSS) |

## **1.3 Value Proposition**

"Never lose a WhatsApp session silently again."

Pilot Status Monitor gives teams full observability and auto-healing for Evolution API instances - with per-number uptime tracking, automatic restart cycles, multi-channel alerting (WhatsApp, email, webhook), and structured audit logs. The cloud version requires zero infrastructure; the open-source version is fully self-hostable.

## **1.4 Core Features**

### **F1 - Health Monitoring Engine**

- Configurable ping interval per project (default: 5 minutes)
- Dual health signal: connectionState (GET) + setPresence (POST)
- Both must succeed to mark instance HEALTHY
- Failure counter per instance, persisted in PostgreSQL
- Three consecutive failures trigger restart cycle

### **F2 - Auto-Restart Flow**

- Call POST /instance/restart/{name} on Evolution API
- Wait configurable delay (default: 60 seconds)
- Re-run health check
- If still failing: second restart attempt
- After second failure: trigger alert pipeline

### **F3 - Alert System**

- Alert payload: instance name, project, error type, QR code (base64), pairing code
- Channels: WhatsApp via Pilot Status (primary), SMTP/Gmail, platform webhook
- Alert cooldown: configurable per project (default: 30 minutes)
- Alert template customization per project
- Pilot Status is default fallback if no channel configured

### **F4 - Multi-Project & Multi-Number Management**

- Users can create multiple projects
- Each project has isolated configuration: ping interval, retries, delay, strategy, alert channels
- Numbers (instances) belong to a single project
- Import numbers from Evolution API fetchInstances endpoint
- Toggle monitoring on/off per number

### **F5 - Observability & Logs**

- Structured JSON logs per health check event
- Filterable by number, project, date range, event type
- Paginated log viewer in frontend
- Uptime percentage calculated per number (rolling 24h, 7d, 30d)
- Health check history timeline visualization

### **F6 - Configuration Parameters**

| **Parameter**  | **Scope** | **Default**   | **Description**                               |
| -------------- | --------- | ------------- | --------------------------------------------- |
| pingInterval   | Project   | 300s (5min)   | How often to run health checks                |
| maxRetries     | Project   | 2             | Max restart attempts before alerting          |
| retryDelay     | Project   | 60s           | Wait time between restart and re-check        |
| retryStrategy  | Project   | fixed         | fixed \| exponential_jitter                   |
| alertCooldown  | Project   | 1800s (30min) | Min time between alerts per number            |
| alertChannels  | Project   | pilot_status  | Comma-separated: pilot_status, email, webhook |
| alertTemplate  | Project   | Default       | Custom message template with variables        |
| pingTimeout    | Global    | 5s            | Timeout for connectionState + setPresence     |
| restartTimeout | Global    | 10s           | Timeout for restart call                      |
| monitored      | Number    | true          | Toggle monitoring for this number             |

## **1.5 UX Flows**

### **Onboarding Flow**

- User signs up via WhatsApp / Google / GitHub
- Free trial activated (14 days)
- Prompted to create first Project
- Project created → user enters Evolution API URL + API Key
- System fetches instances from Evolution API and displays list
- User selects instances to monitor → monitoring begins

### **Alert Response Flow**

- Instance fails 3 consecutive pings
- System attempts restart (up to 2 times)
- After second failure: alert sent to configured channels
- Alert contains QR code image and pairing code text
- User scans QR or uses pairing code on Evolution dashboard
- System detects reconnection on next health check cycle
- Alert resolved notification sent

## **1.6 Monetization**

### **Cloud Pricing**

| **Tier**      | **Price**          | **Included**                     | **Notes**                |
| ------------- | ------------------ | -------------------------------- | ------------------------ |
| Free Trial    | R\$ 0              | 14 days, all features            | No credit card required  |
| Pay-as-you-go | R\$ 1/number/month | All features, unlimited projects | Billed monthly, pro-rata |
| Open Source   | Free               | Self-hosted, limited features    | Community support        |

- Billing applies even when number is disconnected (monitoring slot is reserved)
- Payment via Stripe (credit/debit card) and Pague.dev (PIX)
- Subscription managed at account level, not per-project

# **2\. ADR - Architecture Decision Records**

## **ADR-001: Monorepo with npm Workspaces**

### **Status: Accepted**

**Context**

We have three distinct runtimes: Next.js app (API + Frontend), Node.js worker, and shared TypeScript utilities. They share Prisma types, DTOs, validation schemas, and constants.

**Decision**

Use npm workspaces monorepo with the following structure:

apps/

api/ ← Next.js (App Router, API routes, frontend)

worker/ ← Node.js BullMQ consumer

packages/

database/ ← Prisma client + schema

shared/ ← DTOs, types, constants, error classes

config/ ← Shared ESLint, tsconfig bases

**Consequences**

- Single repository: unified PRs, consistent tooling, atomic releases
- Type-safe sharing via packages/shared without publishing to npm
- Docker builds use --filter to build only changed apps
- Trade-off: larger initial clone; mitigated by sparse checkout in CI

## **ADR-002: PostgreSQL as Primary Database**

### **Status: Accepted**

**Context**

Data is relational: User → Project → Number → HealthCheck → Alert. We need ACID transactions (billing state, alert cooldown), complex JOINs for log filtering, and JSON columns for flexible alert metadata.

**Decision**

PostgreSQL 15+ via Prisma ORM. Use JSONB columns for alert payloads and configuration overrides. Use native pg enums for status fields.

**Consequences**

- Strong consistency for billing and monitoring state
- Prisma migrations are version-controlled in packages/database/
- Connection pooling via PgBouncer in production; Prisma connection limit set per service
- Trade-off: more operational overhead than SQLite for open-source self-hosting; mitigated by Docker Compose setup

## **ADR-003: BullMQ for Job Queue**

### **Status: Accepted**

**Context**

Health checks must run on a schedule with retry semantics, delay between retries, dead letter queue, and exactly-once execution per number. We need visibility into job state without a separate workflow engine.

**Decision**

BullMQ backed by Redis. One BullMQ Queue per concern:

- health-check - repeatable jobs per number, cron-like via repeatEvery
- restart - one-shot jobs with delay
- alert - one-shot jobs for notification dispatch
- dead-letter - failed jobs that exceeded maxAttempts

**Consequences**

- Redis is already required for locks; dual use reduces infra footprint
- BullMQ's built-in job deduplication (jobId = number:{id}:{type}) prevents double scheduling
- Dashboard: Bull Board mounted at /admin/queues in API (protected by admin session)
- Trade-off: Redis is a hard dependency even in self-hosted OSS; documented clearly in setup guide

## **ADR-004: Redis for Distributed Locks**

### **Status: Accepted**

**Context**

Multiple worker replicas could pick up health check jobs for the same number simultaneously - causing race conditions in state machine transitions and double alerts.

**Decision**

Use Redis SET NX EX (via ioredis) for distributed locks before any state-mutating operation.

Lock key pattern: number:{numberId}:lock

Lock TTL: 2 × expected job duration (health-check: 30s → TTL 60s)

Lock value: worker instance UUID (for safe unlock)

**Consequences**

- Guarantees one active job per number instance
- Lock is released in finally block; TTL handles worker crash
- Idempotency: job that fails to acquire lock is requeued with delay

## **ADR-005: Retry Strategy - Exponential Backoff with Jitter**

### **Status: Accepted**

**Context**

Fixed retries create thundering herd problems when multiple numbers fail simultaneously (e.g., Evolution API downtime). Predictable retry timing also makes the system easier to reason about.

**Decision**

Support two strategies, configurable per project:

FIXED: delay = retryDelay (ms)

EXPONENTIAL_JITTER: delay = min(retryDelay \* 2^attempt, maxDelay) + random(0, jitter)

Default: FIXED (60s) for simplicity. Cloud users can enable EXPONENTIAL_JITTER.

**Consequences**

- Jitter spreads load when hundreds of numbers enter restart cycle simultaneously
- maxDelay cap (default 300s) prevents indefinite waits
- Both strategies implemented as pure functions in packages/shared/retry.ts

## **ADR-006: Multi-Tenancy via Row-Level Isolation**

### **Status: Accepted**

**Context**

Cloud version serves multiple users. We need data isolation without running separate databases per tenant (cost-prohibitive at R\$1/number pricing).

**Decision**

Single PostgreSQL database. Every table that contains user data has a userId or projectId foreign key. All API routes query with WHERE userId = session.userId or through the project relation.

**Consequences**

- Simple to operate; one database, one schema
- API layer enforces tenant isolation - never pass userId from client, always derive from session
- Future: row-level security (RLS) in PostgreSQL can enforce at DB level if needed
- Trade-off: noisy neighbor risk at database level; mitigated by per-user connection limits and Prisma query timeouts

# **3\. System Architecture**

## **3.1 Component Overview**

| **Component**  | **Technology**          | **Responsibility**                                                           |
| -------------- | ----------------------- | ---------------------------------------------------------------------------- |
| API / Frontend | Next.js 14 (App Router) | REST API endpoints, SSR frontend, NextAuth sessions, Bull Board              |
| Worker         | Node.js + BullMQ        | Health checks, restart cycles, alert dispatch, Redis lock management         |
| Database       | PostgreSQL 15 + Prisma  | Persistent state for all entities                                            |
| Cache / Queue  | Redis 7                 | BullMQ queues, distributed locks, alert cooldown keys                        |
| Evolution API  | External (per project)  | WhatsApp session management (connectionState, setPresence, restart, connect) |
| Pilot Status   | External SaaS           | WhatsApp alert delivery                                                      |
| Stripe         | External SaaS           | Credit/debit card subscription billing                                       |
| Pague.dev      | External SaaS           | PIX payment processing                                                       |

## **3.2 Data Flow - Health Check Cycle**

_Sequence: Scheduler → Worker → Evolution API → State Machine → (optional) Alert Pipeline_

1\. BullMQ Scheduler triggers HealthCheckJob for number N every \[pingInterval\]

2\. Worker acquires Redis lock: SET number:{id}:lock {workerUUID} NX EX 60

3\. Worker calls GET /instance/connectionState/{name} (timeout: 5s)

4\. Worker parses response:

\- state = 'open' → proceed to presence check

\- state = 'close' | 'connecting' | 404 → mark failure

5\. If state='open': POST /instance/setPresence/{name} {presence:'available'} (timeout: 5s)

6\. Presence response:

\- HTTP 201 AND body does not contain 'close' → CONNECTED

\- Otherwise → failure

7\. On success: reset failureCount=0, update Number.state=CONNECTED, write HealthCheck log

8\. On failure: failureCount++

\- failureCount < maxRetries → wait retryDelay, enqueue RestartJob

\- failureCount >= maxRetries → enqueue AlertJob, set state=ERROR

9\. Worker releases Redis lock

## **3.3 Data Flow - Restart Cycle**

1\. RestartJob dequeued by Worker

2\. Worker acquires Redis lock: SET number:{id}:lock {workerUUID} NX EX 120

3\. POST /instance/restart/{name} (timeout: 10s)

4\. Set Number.state = RESTARTING

5\. Enqueue HealthCheckJob with delay = retryDelay (BullMQ delayed job)

6\. Health check runs after delay

7a. Success → CONNECTED, failureCount reset

7b. Failure → failureCount++

If failureCount < maxRetries: second RestartJob

If failureCount >= maxRetries: AlertJob enqueued

## **3.4 State Machine - Number Instance**

| **From State** | **Event**                   | **To State** | **Action**                          |
| -------------- | --------------------------- | ------------ | ----------------------------------- |
| CONNECTED      | ping failure                | DISCONNECTED | Increment failureCount, log event   |
| DISCONNECTED   | retry scheduled             | CONNECTING   | Enqueue RestartJob with delay       |
| CONNECTING     | restart success + ping ok   | CONNECTED    | Reset failureCount, log recovery    |
| CONNECTING     | restart success + ping fail | DISCONNECTED | Increment failureCount              |
| DISCONNECTED   | failureCount >= maxRetries  | ERROR        | Enqueue AlertJob                    |
| ERROR          | restart triggered           | RESTARTING   | Call Evolution restart endpoint     |
| RESTARTING     | ping ok after restart       | CONNECTED    | Reset state, clear error            |
| RESTARTING     | ping fail after restart     | ERROR        | If maxRetries exceeded: alert       |
| any            | monitoring disabled         | - (paused)   | Remove from scheduler, release lock |
| any            | monitoring enabled          | CONNECTING   | Enqueue HealthCheckJob              |

## **3.5 Failure Classification**

| **Error Type**     | **Trigger Condition**                          | **Retry?**             | **Alert Label**              |
| ------------------ | ---------------------------------------------- | ---------------------- | ---------------------------- |
| NETWORK_ERROR      | fetch() throws, ECONNREFUSED, timeout exceeded | Yes                    | Network unreachable          |
| AUTH_ERROR         | HTTP 401/403 from Evolution API                | No (config issue)      | Authentication failed        |
| INSTANCE_NOT_FOUND | HTTP 404 + body contains 'does not exist'      | No (manual fix needed) | Instance not found on server |
| RATE_LIMIT         | HTTP 429 from Evolution API                    | Yes (with backoff)     | Rate limited                 |
| UNKNOWN            | Any other non-2xx response                     | Yes                    | Unexpected error             |

## **3.6 Monorepo Directory Structure**

pilot-status-monitor/

├── apps/

│ ├── api/ # Next.js monolith (API + Frontend)

│ │ ├── app/ # App Router pages and layouts

│ │ │ ├── (auth)/ # Login, register pages

│ │ │ ├── (dashboard)/ # Protected app pages

│ │ │ │ ├── dashboard/

│ │ │ │ ├── projects/\[projectId\]/

│ │ │ │ ├── numbers/\[numberId\]/

│ │ │ │ └── settings/

│ │ │ └── api/ # API route handlers

│ │ │ ├── auth/\[...nextauth\]/

│ │ │ ├── projects/

│ │ │ ├── numbers/

│ │ │ ├── health-checks/

│ │ │ ├── alerts/

│ │ │ └── webhooks/ # Stripe + Pague.dev

│ │ └── components/

│ └── worker/ # BullMQ consumer

│ ├── src/

│ │ ├── jobs/

│ │ │ ├── health-check.job.ts

│ │ │ ├── restart.job.ts

│ │ │ └── alert.job.ts

│ │ ├── providers/

│ │ │ ├── alert/

│ │ │ └── payment/

│ │ ├── evolution/ # Evolution API client

│ │ └── state-machine.ts

├── packages/

│ ├── database/ # Prisma schema + generated client

│ ├── shared/ # Types, DTOs, constants, retry utils

│ └── config/ # tsconfig base, eslint config

├── docker-compose.yml # Dev environment

├── docker-compose.prod.yml # Production overrides

└── package.json # Workspace root

# **4\. Database Design (Prisma Schema)**

## **4.1 Entity Relationship Overview**

| **Entity**    | **Relations**                                            | **Key Fields**                                                                                   |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| User          | has many Projects, has one Subscription                  | id, email, whatsappNumber, plan                                                                  |
| Project       | belongs to User, has many Numbers, has one ProjectConfig | id, userId, name, evolutionUrl, evolutionApiKey                                                  |
| ProjectConfig | belongs to Project                                       | pingInterval, maxRetries, retryDelay, retryStrategy, alertCooldown, alertChannels, alertTemplate |
| Number        | belongs to Project, has many HealthChecks, Alerts, Logs  | id, projectId, instanceName, phoneNumber, state, failureCount, monitored                         |
| HealthCheck   | belongs to Number                                        | id, numberId, status, errorType, responseTime, checkedAt                                         |
| Alert         | belongs to Number                                        | id, numberId, channel, payload (JSONB), sentAt, acknowledged                                     |
| Log           | belongs to Number (optional Project)                     | id, numberId, projectId, level, event, errorType, meta (JSONB), createdAt                        |
| Subscription  | belongs to User                                          | id, userId, stripeCustomerId, paguePlanId, status, trialEndsAt, currentPeriodEnd                 |

## **4.2 Full Prisma Schema**

// packages/database/prisma/schema.prisma

generator client {

provider = "prisma-client-js"

}

datasource db {

provider = "postgresql"

url = env("DATABASE_URL")

}

enum UserRole { USER ADMIN }

enum Plan { FREE PAID }

enum SubscriptionStatus { TRIALING ACTIVE PAST_DUE CANCELED UNPAID }

enum NumberState { CONNECTED DISCONNECTED CONNECTING RESTARTING ERROR }

enum HealthStatus { HEALTHY UNHEALTHY }

enum ErrorType { NETWORK_ERROR AUTH_ERROR INSTANCE_NOT_FOUND RATE_LIMIT UNKNOWN }

enum AlertChannel { PILOT_STATUS EMAIL WEBHOOK }

enum RetryStrategy { FIXED EXPONENTIAL_JITTER }

enum LogLevel { DEBUG INFO WARN ERROR }

model User {

id String @id @default(cuid())

email String? @unique

emailVerified DateTime?

name String?

image String?

whatsappNumber String? @unique

role UserRole @default(USER)

plan Plan @default(FREE)

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

projects Project\[\]

subscription Subscription?

accounts Account\[\]

sessions Session\[\]

}

model Project {

id String @id @default(cuid())

userId String

name String

evolutionUrl String // <https://evolution.yourdomain.com>

evolutionApiKey String // Stored encrypted

alertPhone String? // WhatsApp number to receive alerts

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

user User @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

numbers Number\[\]

config ProjectConfig?

logs Log\[\]

@@index(\[userId\])

}

model ProjectConfig {

id String @id @default(cuid())

projectId String @unique

pingInterval Int @default(300) // seconds

maxRetries Int @default(2)

retryDelay Int @default(60) // seconds

retryStrategy RetryStrategy @default(FIXED)

alertCooldown Int @default(1800) // seconds

alertChannels AlertChannel\[\] @default(\[PILOT_STATUS\])

alertTemplate String? // Handlebars template

smtpHost String?

smtpPort Int?

smtpUser String?

smtpPass String? // Encrypted

webhookUrl String?

webhookSecret String? // HMAC signing secret

project Project @relation(fields: \[projectId\], references: \[id\], onDelete: Cascade)

}

model Number {

id String @id @default(cuid())

projectId String

instanceName String // Evolution instance name (unique per Evolution server)

phoneNumber String? // E.164 format: 5511999999999

label String? // Friendly display name

state NumberState @default(DISCONNECTED)

failureCount Int @default(0)

monitored Boolean @default(true)

lastHealthyAt DateTime?

lastCheckedAt DateTime?

lastAlertSentAt DateTime?

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

project Project @relation(fields: \[projectId\], references: \[id\], onDelete: Cascade)

healthChecks HealthCheck\[\]

alerts Alert\[\]

logs Log\[\]

@@unique(\[projectId, instanceName\])

@@index(\[projectId\])

@@index(\[state\])

}

model HealthCheck {

id String @id @default(cuid())

numberId String

status HealthStatus

errorType ErrorType?

errorMessage String?

responseTimeMs Int?

rawResponse Json? // Full Evolution API response for debugging

checkedAt DateTime @default(now())

number Number @relation(fields: \[numberId\], references: \[id\], onDelete: Cascade)

@@index(\[numberId, checkedAt\])

}

model Alert {

id String @id @default(cuid())

numberId String

channel AlertChannel

payload Json // {instanceName, projectName, errorType, qrCode, pairingCode, template}

delivered Boolean @default(false)

deliveryError String?

sentAt DateTime @default(now())

acknowledgedAt DateTime?

number Number @relation(fields: \[numberId\], references: \[id\], onDelete: Cascade)

@@index(\[numberId, sentAt\])

}

model Log {

id String @id @default(cuid())

numberId String?

projectId String?

level LogLevel

event String // e.g. 'health_check_failed', 'restart_triggered', 'alert_sent'

errorType ErrorType?

meta Json? // arbitrary structured data

createdAt DateTime @default(now())

number Number? @relation(fields: \[numberId\], references: \[id\], onDelete: SetNull)

project Project? @relation(fields: \[projectId\], references: \[id\], onDelete: SetNull)

@@index(\[numberId, createdAt\])

@@index(\[projectId, createdAt\])

}

model Subscription {

id String @id @default(cuid())

userId String @unique

stripeCustomerId String? @unique

stripeSubscriptionId String?

pagueDevCustomerId String?

status SubscriptionStatus @default(TRIALING)

trialEndsAt DateTime?

currentPeriodStart DateTime?

currentPeriodEnd DateTime?

cancelAtPeriodEnd Boolean @default(false)

activeNumbers Int @default(0)

monthlyAmountCents Int @default(0) // R\$ in centavos

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

user User @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

}

// NextAuth required models

model Account { ... } // Standard NextAuth Account model

model Session { ... } // Standard NextAuth Session model

model VerificationToken { ... }

# **5\. Worker Design**

## **5.1 Job Types**

| **Job Name** | **Queue**    | **Triggered By**                    | **Max Attempts**     | **Description**                                  |
| ------------ | ------------ | ----------------------------------- | -------------------- | ------------------------------------------------ |
| health-check | health-check | Scheduler (repeatEvery)             | 1 (handled manually) | Ping connectionState + setPresence               |
| restart      | restart      | HealthCheckJob on failure threshold | 1                    | Call Evolution restart endpoint                  |
| alert        | alert        | RestartJob on second failure        | 3                    | Dispatch alert via all configured channels       |
| sync-numbers | sync         | Manual API trigger / daily cron     | 3                    | Sync instance list from Evolution fetchInstances |

## **5.2 HealthCheckJob Implementation**

// apps/worker/src/jobs/health-check.job.ts

export async function processHealthCheck(job: Job&lt;HealthCheckJobData&gt;) {

const { numberId } = job.data;

const lock = await acquireLock(\`number:\${numberId}:lock\`, 60);

if (!lock) { await job.moveToDelayed(Date.now() + 5000); return; }

try {

const number = await prisma.number.findUniqueOrThrow({ where: { id: numberId },

include: { project: { include: { config: true } } } });

if (!number.monitored) return; // skip if disabled

const result = await checkHealth(number); // connectionState + setPresence

if (result.healthy) {

await onHealthy(number);

} else {

await onUnhealthy(number, result.errorType, number.project.config);

}

} finally {

await releaseLock(\`number:\${numberId}:lock\`, lock.value);

}

}

async function onUnhealthy(number, errorType, config) {

const newCount = number.failureCount + 1;

await prisma.number.update({ where: { id: number.id },

data: { failureCount: newCount, state: 'DISCONNECTED' } });

await writeLog(number, 'WARN', 'health_check_failed', { errorType, count: newCount });

// AUTH_ERROR and INSTANCE_NOT_FOUND: do not retry automatically

if (errorType === 'AUTH_ERROR' || errorType === 'INSTANCE_NOT_FOUND') {

await prisma.number.update({ where:{id:number.id}, data:{state:'ERROR'} });

await enqueueAlert(number, errorType);

return;

}

if (newCount >= config.maxRetries) {

await prisma.number.update({ where:{id:number.id}, data:{state:'ERROR'} });

await enqueueAlert(number, errorType);

} else {

const delay = computeDelay(config.retryStrategy, config.retryDelay, newCount);

await restartQueue.add('restart', { numberId: number.id }, { delay });

}

}

## **5.3 Dead Letter Queue**

Jobs that exceed maxAttempts are moved to the failed queue by BullMQ automatically. A separate DLQ processor runs every 15 minutes and:

- Logs each failed job to the Log table with level=ERROR
- Sends a system-level alert to the admin email
- Does NOT re-enqueue - failed jobs require manual intervention via Bull Board

## **5.4 Idempotency**

| **Mechanism**     | **Implementation**                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Job deduplication | jobId = \`number:{numberId}:health-check\` → BullMQ skips duplicate if job exists in waiting/active |
| Redis lock        | SET NX EX prevents concurrent execution of same job type per number                                 |
| State check       | Worker re-reads Number.state at job start; skips if already in target state                         |
| Alert cooldown    | Redis key alert:cooldown:{numberId} with TTL = alertCooldown; AlertJob skips if key exists          |

## **5.5 Provider Interfaces**

// packages/shared/src/providers/alert.provider.ts

export interface AlertPayload {

instanceName: string;

phoneNumber?: string;

projectName: string;

errorType: ErrorType;

qrCodeBase64?: string;

pairingCode?: string;

timestamp: Date;

}

export interface AlertProvider {

readonly channel: AlertChannel;

send(payload: AlertPayload, config: ProjectConfig): Promise&lt;void&gt;;

}

// Implementations:

// - PilotStatusAlertProvider (WhatsApp)

// - EmailAlertProvider (SMTP/Gmail)

// - WebhookAlertProvider (HTTP POST with HMAC signature)

// packages/shared/src/providers/payment.provider.ts

export interface PaymentProvider {

createCustomer(user: User): Promise&lt;string&gt;; // returns customerId

createSubscription(customerId: string, quantity: number): Promise&lt;Subscription&gt;;

updateQuantity(subscriptionId: string, quantity: number): Promise&lt;void&gt;;

cancelSubscription(subscriptionId: string): Promise&lt;void&gt;;

handleWebhook(payload: unknown, signature: string): Promise&lt;WebhookEvent&gt;;

}

// Implementations: StripePaymentProvider, PagueDevPaymentProvider

# **6\. API Design**

## **6.1 Authentication**

All API routes (except /api/auth/\* and /api/webhooks/\*) require a valid NextAuth session cookie. Server-side session is retrieved via getServerSession(authOptions). User ID is always derived from the session, never from request body.

## **6.2 Endpoint Reference**

### **Projects**

| **Method** | **Path**                 | **Description**                              | **Auth**            |
| ---------- | ------------------------ | -------------------------------------------- | ------------------- |
| GET        | /api/projects            | List all projects for authenticated user     | Session             |
| POST       | /api/projects            | Create a new project                         | Session             |
| GET        | /api/projects/:id        | Get project details + config                 | Session + ownership |
| PATCH      | /api/projects/:id        | Update project name, Evolution credentials   | Session + ownership |
| DELETE     | /api/projects/:id        | Delete project and all numbers               | Session + ownership |
| PUT        | /api/projects/:id/config | Upsert ProjectConfig (ping settings, alerts) | Session + ownership |

### **Numbers**

| **Method** | **Path**                       | **Description**                     | **Auth**            |
| ---------- | ------------------------------ | ----------------------------------- | ------------------- |
| GET        | /api/projects/:id/numbers      | List numbers in project (paginated) | Session + ownership |
| POST       | /api/projects/:id/numbers/sync | Sync from Evolution fetchInstances  | Session + ownership |
| POST       | /api/projects/:id/numbers      | Add single number manually          | Session + ownership |
| GET        | /api/numbers/:id               | Get number details + current state  | Session + ownership |
| PATCH      | /api/numbers/:id               | Update label, monitored toggle      | Session + ownership |
| DELETE     | /api/numbers/:id               | Remove number from monitoring       | Session + ownership |
| POST       | /api/numbers/:id/restart       | Manually trigger restart            | Session + ownership |

### **Health Checks & Logs**

| **Method** | **Path**                       | **Query Params**                                  | **Description**                |
| ---------- | ------------------------------ | ------------------------------------------------- | ------------------------------ |
| GET        | /api/numbers/:id/health-checks | page, limit, from, to, status                     | Paginated health check history |
| GET        | /api/logs                      | numberId, projectId, level, from, to, page, limit | Global filtered log stream     |
| GET        | /api/projects/:id/logs         | numberId, level, from, to, page, limit            | Project-scoped logs            |
| GET        | /api/numbers/:id/uptime        | period (24h\|7d\|30d)                             | Uptime % calculation           |

### **Alerts**

| **Method** | **Path**                    | **Description**            |
| ---------- | --------------------------- | -------------------------- |
| GET        | /api/numbers/:id/alerts     | Alert history for a number |
| POST       | /api/alerts/:id/acknowledge | Mark alert as acknowledged |

### **Billing**

| **Method** | **Path**                        | **Description**                                  |
| ---------- | ------------------------------- | ------------------------------------------------ |
| GET        | /api/billing/subscription       | Current subscription details                     |
| POST       | /api/billing/checkout/stripe    | Create Stripe checkout session                   |
| POST       | /api/billing/checkout/pague-dev | Create PIX payment session                       |
| POST       | /api/billing/cancel             | Cancel subscription at period end                |
| POST       | /api/webhooks/stripe            | Stripe webhook receiver (no auth, HMAC verified) |
| POST       | /api/webhooks/pague-dev         | Pague.dev webhook receiver                       |

## **6.3 Pagination Standard**

// All paginated endpoints use:

// GET /api/resource?page=1&limit=50

// Response:

{

"data": \[...\],

"meta": {

"page": 1,

"limit": 50,

"total": 243,

"totalPages": 5

}

}

## **6.4 Structured Log Response**

{

"id": "clxyz123",

"level": "ERROR",

"event": "health_check_failed",

"errorType": "NETWORK_ERROR",

"numberId": "clnum456",

"projectId": "clprj789",

"meta": {

"instanceName": "my-instance",

"evolutionUrl": "<https://evo.example.com>",

"responseCode": 0,

"failureCount": 2

},

"createdAt": "2026-03-21T10:34:14.616Z"

}

# **7\. Frontend Specification**

## **7.1 Design System**

Design inspired by resend.com: clean, developer-focused, monochromatic with accent highlights. Icons from Iconsax (<https://docs.iconsax.io/>). Font: Inter (system-ui fallback).

| **Token**               | **Value**             | **Usage**                    |
| ----------------------- | --------------------- | ---------------------------- |
| \--color-bg             | #0F172A (slate-900)   | Page background              |
| \--color-surface        | #1E293B (slate-800)   | Card, sidebar backgrounds    |
| \--color-border         | #334155 (slate-700)   | Borders, dividers            |
| \--color-text-primary   | #F8FAFC (slate-50)    | Main text                    |
| \--color-text-secondary | #94A3B8 (slate-400)   | Labels, metadata             |
| \--color-accent         | #6366F1 (indigo-500)  | CTAs, active nav, badges     |
| \--color-success        | #10B981 (emerald-500) | CONNECTED state              |
| \--color-warning        | #F59E0B (amber-500)   | CONNECTING, RESTARTING state |
| \--color-error          | #EF4444 (red-500)     | ERROR, DISCONNECTED state    |

## **7.2 Layout**

Global layout: fixed left sidebar (240px) + main content area. No top navigation bar.

┌──────────────────────────────────────────────────────────────┐

│ SIDEBAR (240px fixed) │ MAIN CONTENT │

│ ───────────────────── │ ────────────────────────── │

│ Logo │ Page Header (breadcrumb) │

│ ───────────────────── │ ────────────────────────── │

│ \[Monitoring\] │ Content area │

│ Dashboard │ │

│ Projects │ │

│ Numbers │ │

│ Logs │ │

│ Alerts │ │

│ ───────────────────── │ │

│ \[Settings\] │ │

│ Billing │ │

│ Integrations │ │

│ Team │ │

│ ───────────────────── │ │

│ User avatar + name │ │

└────────────────────────────┴────────────────────────────────┘

## **7.3 Pages**

### **/dashboard - Overview**

- Stats bar: Total Numbers, Connected, Disconnected, In Error
- Recent alerts list (last 10, with acknowledge button)
- Uptime sparklines per project (7-day rolling)
- Empty state: illustration + 'Create your first project' CTA

### **/projects - Project List**

- Table: Project Name | Numbers | Connected % | Last Check | Actions
- Create Project button (opens slide-over form)
- Row click → navigates to /projects/\[id\]

### **/projects/\[id\] - Project Detail**

- Tab navigation: Numbers | Logs | Settings
- Numbers tab: sortable table with state badge, uptime %, last checked, toggle monitoring switch
- State badge colors: CONNECTED=green, DISCONNECTED=red, CONNECTING=amber, RESTARTING=amber, ERROR=red
- Row actions: View Logs, Manual Restart, Remove
- Sync button: fetches latest instances from Evolution API

### **/numbers/\[id\] - Number Detail**

- Header: instance name, phone number, state badge, uptime (24h/7d/30d)
- Health check timeline chart (area chart, last 24h, 1-minute resolution)
- Recent health checks table with response time and error details
- Alert history tab
- Configuration overrides tab (override project-level settings for this number)

### **/logs - Global Log Viewer**

- Filter bar: Project selector, Number selector, Log Level multi-select, Date range picker
- Virtualized log table (react-virtual) for performance
- Each row: timestamp, level badge, event name, number/project links, expandable meta JSON
- Export to CSV button

### **/settings/billing - Billing**

- Current plan card: status, numbers count, next billing date, amount
- Payment method management (redirect to Stripe Customer Portal)
- PIX payment option via Pague.dev checkout
- Cancel subscription flow with confirmation dialog
- Trial countdown banner (if in trial)

### **/settings/integrations - Integrations**

- Alert channel configuration: Pilot Status (WhatsApp number), Email (SMTP), Webhook URL
- Test alert button per channel
- Template editor for WhatsApp/email alert message

## **7.4 Components**

| **Component**           | **Props / Behavior**                                                          |
| ----------------------- | ----------------------------------------------------------------------------- |
| &lt;StateBadge&gt;      | state: NumberState → renders colored pill with Iconsax icon                   |
| &lt;UptimeBar&gt;       | percent: number, period: string → visual progress bar                         |
| &lt;NumberRow&gt;       | number object → table row with state, uptime, toggle, actions                 |
| &lt;AlertCard&gt;       | alert object → card with QR code display, pairing code, acknowledge button    |
| &lt;LogRow&gt;          | log object → expandable row with JSON meta viewer                             |
| &lt;ProjectForm&gt;     | create/edit slide-over: name, Evolution URL, API key (masked input)           |
| &lt;ConfigForm&gt;      | ping settings form with real-time validation and strategy selector            |
| &lt;QRModal&gt;         | base64 image prop → displays QR code with 'or use pairing code: XXXXXX' below |
| &lt;EmptyState&gt;      | icon, title, description, action CTA → consistent empty screens               |
| &lt;LoadingSkeleton&gt; | count, variant → animated skeleton placeholders matching table/card shapes    |

## **7.5 UX States**

| **State** | **Behavior**                                                                               |
| --------- | ------------------------------------------------------------------------------------------ |
| Loading   | Skeleton loaders matching content shape; no spinner-only screens                           |
| Empty     | Illustration + primary action button; never show empty tables                              |
| Error     | Toast notification (bottom-right) with retry option; API errors show user-friendly message |
| Success   | Green toast for saves; optimistic UI updates with rollback on failure                      |
| Offline   | Banner: 'No internet connection - changes are not saved'                                   |

# **8\. Billing Architecture**

## **8.1 Subscription Lifecycle**

- User signs up → Subscription created with status=TRIALING, trialEndsAt = now + 14 days
- Trial expires → Subscription status updated to ACTIVE; payment method required
- User adds/removes numbers → Subscription quantity updated via PaymentProvider.updateQuantity()
- Monthly billing → Stripe/Pague.dev charges activeNumbers × R\$1.00
- Payment failure → status=PAST_DUE; monitoring continues for 7 days grace period
- After grace period → status=UNPAID; monitoring paused for new checks (existing data preserved)
- Cancellation → cancelAtPeriodEnd=true; monitoring continues until currentPeriodEnd

## **8.2 Number Quantity Tracking**

activeNumbers is maintained in the Subscription table. It is updated by a database trigger whenever a Number.monitored field changes or a Number is added/removed. The worker also syncs this count on startup and every hour.

// apps/api/src/lib/billing.ts

async function syncActiveNumberCount(userId: string) {

const count = await prisma.number.count({

where: { project: { userId }, monitored: true }

});

await prisma.subscription.update({

where: { userId },

data: { activeNumbers: count, monthlyAmountCents: count \* 100 }

});

// Update Stripe subscription quantity

await paymentProvider.updateQuantity(sub.stripeSubscriptionId, count);

}

## **8.3 Webhook Handlers**

| **Provider** | **Event**                     | **Action**                                       |
| ------------ | ----------------------------- | ------------------------------------------------ |
| Stripe       | customer.subscription.updated | Sync status, currentPeriodEnd, cancelAtPeriodEnd |
| Stripe       | customer.subscription.deleted | Set status=CANCELED, pause monitoring            |
| Stripe       | invoice.payment_failed        | Set status=PAST_DUE, send email warning          |
| Stripe       | invoice.payment_succeeded     | Set status=ACTIVE, clear past-due flag           |
| Pague.dev    | payment.confirmed             | Activate subscription, extend period             |
| Pague.dev    | payment.expired               | Set status=UNPAID if not renewed                 |

## **8.4 Open Source Billing Exclusion**

In self-hosted mode (CLOUD_BILLING=false env var), the billing module is completely disabled. The PaymentProvider interface is replaced by a NoOpPaymentProvider that returns success on all calls. Subscription status defaults to ACTIVE with no expiration.

# **9\. Developer Experience**

## **9.1 Prerequisites**

- Node.js 20+ (LTS)
- Docker + Docker Compose v2
- npm 10+

## **9.2 Local Setup**

\# 1. Clone repository

git clone <https://github.com/evolutionapi/pilot-status-monitor>

cd pilot-status-monitor

\# 2. Install dependencies (all workspaces)

npm install

\# 3. Copy environment files

cp apps/api/.env.example apps/api/.env

cp apps/worker/.env.example apps/worker/.env

\# 4. Start infrastructure (Postgres + Redis)

docker compose up -d postgres redis

\# 5. Run database migrations

npm run db:migrate --workspace=packages/database

\# 6. Seed development data

npm run db:seed --workspace=packages/database

\# 7. Start all apps with hot reload

npm run dev

## **9.3 Docker Compose (Dev)**

\# docker-compose.yml

services:

postgres:

image: postgres:15-alpine

ports: \['5432:5432'\]

environment:

POSTGRES_DB: pilot_dev

POSTGRES_USER: pilot

POSTGRES_PASSWORD: pilot

volumes: \[postgres_data:/var/lib/postgresql/data\]

redis:

image: redis:7-alpine

ports: \['6379:6379'\]

api:

build: { context: ., dockerfile: apps/api/Dockerfile.dev }

volumes: \['./:/app', '/app/node_modules'\]

ports: \['3000:3000'\]

environment:

DATABASE_URL: postgresql://pilot:pilot@postgres:5432/pilot_dev

REDIS_URL: redis://redis:6379

depends_on: \[postgres, redis\]

worker:

build: { context: ., dockerfile: apps/worker/Dockerfile.dev }

volumes: \['./:/app', '/app/node_modules'\]

environment:

DATABASE_URL: postgresql://pilot:pilot@postgres:5432/pilot_dev

REDIS_URL: redis://redis:6379

depends_on: \[postgres, redis\]

## **9.4 Environment Variables**

| **Variable**          | **App**     | **Required** | **Description**                                                      |
| --------------------- | ----------- | ------------ | -------------------------------------------------------------------- |
| DATABASE_URL          | api, worker | Yes          | PostgreSQL connection string                                         |
| REDIS_URL             | api, worker | Yes          | Redis connection string                                              |
| NEXTAUTH_SECRET       | api         | Yes          | 32+ char random secret for session encryption                        |
| NEXTAUTH_URL          | api         | Yes          | Public URL of API (e.g. <http://localhost:3000>)                     |
| GOOGLE_CLIENT_ID      | api         | OAuth        | Google OAuth App client ID                                           |
| GOOGLE_CLIENT_SECRET  | api         | OAuth        | Google OAuth App client secret                                       |
| GITHUB_CLIENT_ID      | api         | OAuth        | GitHub OAuth App client ID                                           |
| GITHUB_CLIENT_SECRET  | api         | OAuth        | GitHub OAuth App client secret                                       |
| ENCRYPTION_KEY        | api         | Yes          | 32-byte hex key for encrypting Evolution API keys and SMTP passwords |
| STRIPE_SECRET_KEY     | api         | Cloud        | Stripe secret key (sk*live*\*)                                       |
| STRIPE_WEBHOOK_SECRET | api         | Cloud        | Stripe webhook signing secret                                        |
| PAGUE_DEV_API_KEY     | api         | Cloud        | Pague.dev API key                                                    |
| PILOT_STATUS_API_KEY  | worker      | Yes          | Pilot Status API key for WhatsApp alerts                             |
| PILOT_STATUS_INSTANCE | worker      | Yes          | Pilot Status sending instance name                                   |
| CLOUD_BILLING         | api, worker | No           | Set to 'true' to enable billing features                             |
| ADMIN_EMAIL           | api         | No           | Email for system alerts and DLQ notifications                        |

## **9.5 Seed Script**

// packages/database/prisma/seed.ts

// Creates: 1 admin user, 2 projects, 5 numbers each, 30 days of health check history

// Run: npm run db:seed --workspace=packages/database

## **9.6 Testing**

\# Unit tests (all packages)

npm run test

\# Watch mode

npm run test:watch

\# Integration tests (requires running Postgres + Redis)

npm run test:integration

\# Worker tests with queue simulation

npm run test --workspace=apps/worker

Test utilities: packages/shared/src/test/ contains mock factories for Number, Project, HealthCheck, and a MockRedis class for lock testing.

# **10\. Open Source vs Cloud Strategy**

## **10.1 Feature Matrix**

| **Feature**                        | **Open Source**          | **Cloud**        |
| ---------------------------------- | ------------------------ | ---------------- |
| Health monitoring (5-min interval) | ✅ Yes                   | ✅ Yes           |
| Custom ping interval               | ✅ Yes                   | ✅ Yes           |
| Auto-restart cycle                 | ✅ Yes                   | ✅ Yes           |
| WhatsApp alert (Pilot Status)      | ✅ Yes (own credentials) | ✅ Yes (managed) |
| Email alert (SMTP)                 | ✅ Yes                   | ✅ Yes           |
| Webhook alert                      | ✅ Yes                   | ✅ Yes           |
| Structured logs                    | ✅ Yes                   | ✅ Yes           |
| Multiple projects                  | ✅ Yes                   | ✅ Yes           |
| Uptime tracking (30-day)           | ✅ Yes                   | ✅ Yes           |
| Exponential backoff jitter         | ❌ Fixed only            | ✅ Yes           |
| Alert template customization       | ❌ No                    | ✅ Yes           |
| Billing / subscription             | ❌ No                    | ✅ Required      |
| Multi-user / team access           | ❌ No                    | ✅ Roadmap       |
| SLA uptime guarantee               | ❌ No                    | ✅ 99.9% target  |
| Managed hosting                    | ❌ Self-hosted           | ✅ Yes           |

## **10.2 Feature Flags**

Features are gated using environment variables, not separate codebases:

CLOUD_BILLING=true # Enable Stripe + Pague.dev

CLOUD_ADVANCED_ALERTS=true # Enable template customization

CLOUD_EXPONENTIAL_RETRY=true # Enable jitter strategy

This means the same Docker image runs both versions. Cloud-specific code paths check process.env.CLOUD_BILLING before executing.

## **10.3 Monetization Boundaries**

- Open source is a genuine free product - not a crippled demo
- Cloud value is: zero infrastructure to manage, multi-number billing, managed upgrades
- Advanced features (jitter, templates) are cloud-only to incentivize upgrade
- Contributing to OSS features also benefits the cloud version - virtuous cycle

# **11\. Future Roadmap**

## **Phase 1 - Post-Launch (Q2 2026)**

| **Feature**                          | **Priority** | **Notes**                                                              |
| ------------------------------------ | ------------ | ---------------------------------------------------------------------- |
| Public REST API with API key auth    | High         | Allow programmatic access to number status and logs                    |
| Platform webhooks (outbound)         | High         | POST to user URL on state changes: connected, disconnected, alert_sent |
| Multi-user team access (per project) | High         | Invite team members with role-based permissions                        |
| n8n integration node                 | Medium       | Native n8n community node for trigger-based workflows                  |
| Slack / Discord alert channels       | Medium       | Additional AlertProvider implementations                               |

## **Phase 2 - Scale (Q3 2026)**

| **Feature**                         | **Priority** | **Notes**                                            |
| ----------------------------------- | ------------ | ---------------------------------------------------- |
| Mobile app (React Native)           | Medium       | Push notifications for alerts, QR scan from mobile   |
| Status page (public)                | Medium       | Per-project public uptime page (Statuspage.io-style) |
| Grafana integration                 | Low          | Export metrics via Prometheus endpoint               |
| Make / Zapier integration           | Low          | Trigger automations from number state changes        |
| Annual billing discount             | Medium       | 2 months free on annual plan                         |
| Usage-based alerts (message volume) | Low          | Alert when instance message count drops unexpectedly |

## **Phase 3 - Platform (Q4 2026)**

| **Feature**                                | **Priority** | **Notes**                                             |
| ------------------------------------------ | ------------ | ----------------------------------------------------- |
| White-label for agencies                   | High         | Custom domain, logo, branding per account             |
| Marketplace of alert templates             | Low          | Community-shared alert message templates              |
| AI-powered anomaly detection               | Low          | ML model to detect unusual disconnection patterns     |
| Multi-Evolution-server support per project | Medium       | One project spanning multiple Evolution installations |