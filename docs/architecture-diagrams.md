# Architecture Diagrams

Visual reference for LawMitran. Diagrams are [Mermaid](https://mermaid.js.org/) — they render on
GitHub and in most Markdown viewers. Prose reference: [03-system-architecture.md](./03-system-architecture.md).

---

## 1. System context

Who talks to what. LawMitran is a lead-generation marketplace: clients submit a legal requirement,
it routes to verified + subscribed lawyers as a lead, and the lawyer contacts the client directly.

```mermaid
graph TB
    Client([Client<br/>browser])
    Lawyer([Lawyer<br/>browser])
    Admin([Admin<br/>browser])

    subgraph LawMitran
        FE[Next.js frontend<br/>App Router / RSC]
        API[NestJS API<br/>/api]
        DB[(PostgreSQL)]
        Cache[(Redis)]
        Store[(MinIO / S3<br/>uploads)]
    end

    WA[[WhatsApp / SMS<br/>OTP]]
    Pay[[Razorpay]]

    Client --> FE
    Lawyer --> FE
    Admin --> FE
    FE -->|REST + JWT| API
    API --> DB
    API --> Cache
    API --> Store
    API -->|send OTP| WA
    API -->|checkout / verify| Pay
```

---

## 2. Module map (backend)

NestJS feature modules. `auth`, `prisma`, `users`, `seo`, `lawyers` are implemented; the rest are
being filled in. Global `JwtAuthGuard` + `RolesGuard` wrap every route by default (opt out with
`@Public()`, gate with `@Roles()`).

```mermaid
graph LR
    App[AppModule<br/>global guards]

    App --> Auth[auth<br/>register/login/refresh]
    App --> Users[users<br/>profile/settings/reports]
    App --> Lawyers[lawyers<br/>search/profile/verify]
    App --> Leads[leads<br/>routing/lifecycle]
    App --> Subs[subscriptions<br/>Razorpay/plans]
    App --> Seo[seo<br/>sitemap/landing]
    App --> Docs[documents<br/>marketplace • stub]
    App --> Intake[ai-intake<br/>stub]
    App --> AdminM[admin<br/>reports/users]

    Auth --> Prisma[(prisma)]
    Users --> Prisma
    Lawyers --> Prisma
    Leads --> Prisma
    Subs --> Prisma
    Seo --> Prisma

    Users --> Otp[OtpService]
    Users --> Storage[StorageService<br/>S3/MinIO]
    Lawyers --> Storage
```

---

## 3. Lead flow (the core loop)

```mermaid
sequenceDiagram
    actor C as Client
    participant FE as Frontend
    participant API as NestJS API
    participant DB as PostgreSQL
    actor L as Lawyer

    C->>FE: Submit legal requirement
    FE->>API: POST /leads
    API->>DB: create Lead (status NEW)
    API->>DB: match verified + subscribed lawyers
    Note over API,DB: exclude verificationStatus != APPROVED<br/>exclude subscriptionStatus = EXPIRED
    API-->>DB: route Lead to eligible lawyer
    L->>FE: Open lead inbox
    FE->>API: GET /leads (lawyer)
    L->>FE: Reveal contact
    FE->>API: POST /leads/:id/reveal
    API->>API: gate on TRIAL / ACTIVE subscription
    API-->>L: client phone + email
    L->>C: Contacts client directly (off-platform)
    L->>API: PATCH status → CONTACTED → CLOSED
    C->>API: Confirm contact / withdraw
```

---

## 4. Auth + signup OTP flow

Registration is WhatsApp-first OTP (cost-driven). OTP verification issues **no session** — the user
signs in with a password afterward. Access + refresh tokens are separate JWTs; refresh tokens are
stored SHA-256-hashed and single-use.

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant API as NestJS API
    participant WA as WhatsApp/SMS

    U->>FE: Sign up (role, mobile, password)
    FE->>API: POST /auth/register
    API-->>FE: created (no session)
    API->>WA: send OTP (hashed, cooldown/lockout)
    U->>FE: Enter 6-digit code
    FE->>API: POST /auth/verify-otp
    API-->>FE: verified ✓ (still no session)
    FE->>U: Redirect to /login
    U->>FE: Log in (password only)
    FE->>API: POST /auth/login
    API-->>FE: access + refresh JWT
    Note over FE: tokens in localStorage today;<br/>httpOnly-cookie hardening is a follow-up
```

---

## 5. Data model (core relationships)

```mermaid
erDiagram
    User ||--o| Lawyer : "extends (role=LAWYER)"
    User ||--o{ Lead : "submits (client)"
    Lawyer ||--o{ Lead : "receives"
    Lawyer ||--o{ Verification : "review trail"
    Lawyer ||--o{ Subscription : "billing history"
    User ||--o{ Report : "reportsMade"
    User ||--o{ Report : "reportsAgainst"
    Lead ||--o{ Report : "context"
    User ||--o{ RefreshToken : "hashed, single-use"

    User {
        string id
        enum role "CLIENT|LAWYER|ADMIN"
        enum status "ACTIVE|SUSPENDED|DELETED"
        string pendingMobile
        string avatarUrl
    }
    Lawyer {
        string slug UK
        enum verificationStatus "PENDING..APPROVED"
        enum subscriptionStatus "TRIAL..EXPIRED"
        datetime trialEndDate
    }
    Lead {
        enum status "NEW|CONTACTED|CLOSED"
    }
    Report {
        enum status "OPEN|REVIEWING|ACTIONED|DISMISSED"
        string reason
    }
```

---

## 6. Deployment

```mermaid
graph TB
    User([Users])
    User --> Nginx[nginx<br/>reverse proxy / TLS]

    subgraph docker-compose
        Nginx --> FEc[frontend<br/>Next.js]
        Nginx --> APIc[backend<br/>NestJS]
        APIc --> PG[(postgres)]
        APIc --> RD[(redis)]
        APIc --> MinIO[(minio<br/>S3 in prod)]
    end

    APIc -. prod .-> S3[(AWS S3)]
```

`docker compose up -d` brings up postgres, redis, minio, backend, frontend, and nginx. In production,
object storage moves from MinIO to S3 (`S3_FORCE_PATH_STYLE=false`).

---

**Related:** [03-system-architecture.md](./03-system-architecture.md) ·
[05-api-design.md](./05-api-design.md) · [26-frontend-implementation.md](./26-frontend-implementation.md) ·
[../STATUS.md](../STATUS.md) · [../ROADMAP.md](../ROADMAP.md)
