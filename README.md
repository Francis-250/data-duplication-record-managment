# University of Kigali (UoK) — Data Deduplication & Record Matching System

An enterprise-grade, AI-assisted institutional record deduplication, entity resolution, and student identity matching platform engineered for the **University of Kigali (UoK)**. The system identifies, standardizes, compares, and consolidates duplicate and conflicting student records across admissions, registrar datasets, faculty rosters, and legacy databases.

---

## 🏛️ System Purpose & Real-World Challenges Solved

Student records accumulated across disparate intake periods, faculties (Kigali and Musanze campuses), and legacy spreadsheets frequently contain real-world discrepancies:

- **Name Spelling & Token Permutations**: Swapped given and family names (e.g., Kinyarwanda naming customs where surname precedes European given name: `Habimana Jean Paul` vs. `Jean-Paul Habimana`).
- **Missing Middle Names**: Inconsistent inclusion of middle or baptismal names (`Uwase Marie Claire` vs. `Marie Uwase`).
- **Capitalization & Whitespace**: Varying casing, irregular spacing, and stray hyphens.
- **Rwandan Phone Number Formats**: Local numbers (`0788123456`, `079...`, `072...`), international prefix (`+250788123456`), or unformatted digits.
- **Date of Birth Variances**: Inconsistent formats (`DD/MM/YYYY`, `MM/DD/YYYY`, and ISO `YYYY-MM-DD`).
- **Registration Number Variations**: Discrepancies in separators (`2023/BIT/042` vs. `2023-BIT-042` vs. `2023.bit.42`).
- **Rwandan National ID Slips**: 16-digit National Identification numbers entered with spaces or single-digit typographical slips.
- **Multi-System Imports**: Data ingested from legacy spreadsheets, admissions portals, and faculty rosters.

---

## ⚡ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack, React 19, Server Components, Server Actions)
- **Middleware / Proxy**: Next.js 16 root [`proxy.ts`](./proxy.ts) for session validation, header forwarding, and role routing
- **Authentication**: [Better Auth](https://better-auth.com/) (strict preservation of core auth models: `User`, `Session`, `Account`, `Verification`, `TwoFactor`)
- **Database & ORM**: PostgreSQL with [Prisma ORM 7](https://www.prisma.io/)
- **AI / LLM Engine**: [Groq](https://groq.com/) running **`openai/gpt-oss-120b`** via `@langchain/groq` for deep entity resolution, discrepancy explainability, and intelligent merge recommendations
- **UI & Styling**: Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/), Lucide Icons, Sonner toasts, and `next-themes`

---

## 🧠 Core Deduplication & Matching Pipeline

```mermaid
flowchart TD
    subgraph Ingestion
        A1[CSV Ingestion with In-File Deduplication]
        A2[Student Self-Submission]
        A3[Legacy System Records]
    end

    subgraph Phase 1: Standardization
        B[Standardization Engine\nNames | Phone (+250) | Email | Reg No | National ID | Dates]
    end

    subgraph Phase 2: Multi-Pass Blocking
        C[Multi-Pass Blocking Engine\nPass 1: Metaphone + Initial\nPass 2: 16-Digit National ID\nPass 3: RegNo Prefix + Programme\nPass 4: Soundex + Campus + DOB Year]
    end

    subgraph Phase 3 & 4: Comparison & Scoring
        D[Similarity Algorithms\nJaro-Winkler | Levenshtein | Token-Sort JW | Phone Suffix | Date Agreement]
        E[Fellegi-Sunter Weighted Scoring & Classification]
        E1[MATCH: >= 0.85]
        E2[POSSIBLE MATCH: 0.65 - 0.84]
        E3[NON MATCH: < 0.65]
    end

    subgraph Phase 5 & 6: Review & Governance
        F[Registry Review Queue]
        G[Side-by-Side Review & Diff Table]
        H[AI Deep Analysis\nopenai/gpt-oss-120b via Groq]
        I[Non-Destructive Consolidation Merge\nInteractive Field Value Picker]
        J[Immutable Audit Log & Historical Ledger]
    end

    A1 --> B
    A2 --> B
    A3 --> B
    B --> C
    C --> D
    D --> E
    E --> E1 & E2 & E3
    E1 --> F
    E2 --> F
    F --> G
    G --> H
    H --> I
    I --> J
```

### 1. Data Cleaning & Standardization (`lib/deduplication/standardization.ts`)
- **Names**: Strips academic honorifics, trims whitespace, standardizes casing, handles hyphens, and computes token-sorted keys.
- **Phones**: Converts local Rwandan numbers (`0788...`) into canonical E.164 (`+250788...`).
- **Registration Numbers**: Normalizes separators to standard slashes (`2023/BIT/042`).
- **National IDs**: Cleans and validates 16-digit Rwandan National Identification numbers.
- **Dates**: Standardizes disparate formats into canonical ISO dates.

### 2. Multi-Pass Candidate Blocking (`lib/deduplication/blocking.ts`)
Avoids $O(N^2)$ pairwise explosion by partitioning datasets into candidate pairs via 4 orthogonal blocking passes:
- **Pass 1**: Double Metaphone of Last Name + First Initial
- **Pass 2**: Standardized Rwandan National ID exact match
- **Pass 3**: Registration Number prefix / year + programme
- **Pass 4**: Soundex of First Name + Campus + Birth Year

### 3. Field Similarity Metrics (`lib/deduplication/similarity.ts`)
- **Jaro-Winkler**: Tuned for typographical errors in names.
- **Token-Sort Jaro-Winkler**: Invariant to swapped first/last name tokens.
- **Normalized Levenshtein**: Exact edit distance for registration numbers and IDs.
- **Phone Suffix Agreement**: Detects local vs. international prefix matching.
- **Date Agreement**: Exact match (1.0), year+month match (0.8), or year-only match (0.4).

### 4. Fellegi-Sunter Classification
- **MATCH** ($\ge 0.85$): High-confidence duplicate flagged for priority registry review.
- **POSSIBLE_MATCH** ($0.65 - 0.84$): Ambiguous pair requiring manual registry evaluation.
- **NON_MATCH** ($< 0.65$): Distinct records archived without cluttering review queues.

### 5. AI Entity Resolution (`lib/ai.ts` powered by `openai/gpt-oss-120b`)
Groq's 120B reasoning model provides:
- **Linguistic Analysis**: Evaluates Rwandan naming customs and typographical slips.
- **Verdict & Confidence**: Outputs `DEFINITE_DUPLICATE`, `PROBABLE_DUPLICATE`, or `DISTINCT_INDIVIDUALS`.
- **Field Recommendation**: Automatically recommends which record values to preserve in the consolidated master record.

### 6. Non-Destructive Consolidation Merging
- Records are **never deleted**.
- Merging consolidates chosen field values into the primary master record.
- The duplicate record is marked as `MERGED`, linking to `mergedIntoId`.
- An immutable snapshot of previous values and preserved fields is saved in `RecordMerge` and `DeduplicationAuditLog`.

---

## 👥 Test Accounts & Role-Based Workflows

The database is pre-seeded with dedicated demonstration accounts for testing every role workflow:

| Role | Email | Password | Default Portal |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@uok.ac.rw` | `University123!` | `/admin` |
| **Registry Staff** | `registry@uok.ac.rw` | `University123!` | `/registry` |
| **Enrolled Student** | `student@uok.ac.rw` | `University123!` | `/student` |

---

### 1. Student Portal Flow (`STUDENT`)

**Login at [`/auth/login`](http://localhost:3000/auth/login) with `student@uok.ac.rw` / `University123!`**

1. **Dashboard Overview (`/student`)**:
   - Displays student identity banner, registration status (`ACTIVE`), enrolled programme, campus, and student ID.
2. **Submit / Update Profile (`/student/submit`)**:
   - Enter student demographic and academic details.
   - Client-side validation validates Rwandan National ID (16 digits) and Registration Number formatting in real time.
3. **Check for Potential Duplicates (`/student/check-duplicate`)**:
   - Self-service duplicate verification before official registration or semester admission.
   - Enter name, phone, registration number, or National ID.
   - System standardizes input and checks against active database records, alerting if a duplicate profile already exists.
4. **Institutional Directory Search (`/student/search`)**:
   - Search authorized public directory records across Kigali and Musanze campuses.

---

### 2. Registry Staff Portal Flow (`REGISTRY_STAFF`)

**Login at [`/auth/login`](http://localhost:3000/auth/login) with `registry@uok.ac.rw` / `University123!`**

1. **Operations Dashboard (`/registry`)**:
   - Displays real-time operational statistics: Total Records, Active Students, Potential Duplicates Flagged, and Resolved Merges.
2. **Institutional Records Catalog (`/registry/records`)**:
   - Search and filter student records by campus (Kigali Campus / Musanze Campus), enrollment status (`ACTIVE`, `MERGED`, `PENDING_REVIEW`), and programme.
3. **CSV Dataset Ingestion (`/registry/import`)**:
   - Download a sample CSV template pre-formatted with official university headers.
   - Upload CSV batches from admissions or faculties.
   - Real-time pre-validation checks for missing fields, invalid phone formats, and **in-file duplicates** (e.g. duplicate National IDs or Reg Numbers within the same file).
   - Click **"Commit Valid Records"** to ingest data into the database with automatic standardization.
4. **Deduplication Engine (`/registry/deduplication`)**:
   - Run the multi-pass blocking and Fellegi-Sunter matching pipeline on active records.
   - View execution logs, candidate pairs generated, matches found, and processing latency.
5. **Match Review Queue (`/registry/reviews`)**:
   - Filter candidate duplicate pairs by `MATCH` or `POSSIBLE_MATCH`.
   - Inspect composite similarity percentage badges and matched attributes.
   - Click **"Review Pair"** to enter the side-by-side comparison screen.
6. **Side-by-Side Review Tool (`/registry/review/[id]`)**:
   - Compare Record A and Record B attributes side-by-side with color-coded diff indicators (emerald for match, amber for differences).
   - **AI Match Analysis Button**: Click **"Run AI Deep Analysis"** to invoke `openai/gpt-oss-120b` via Groq. The model returns duplicate verdict, confidence percentage, key agreements, discrepancy breakdown, and merge recommendations.
   - Actions: Click **"Reject Match"** (dismiss as non-match) or **"Confirm Match"** (verifies duplicate pair and unlocks the consolidation merge tool).
7. **Consolidation Merge Tool (`/registry/merge/[candidateId]`)**:
   - **Step 1**: Choose Master Record (Record A or Record B).
   - **Step 2**: Interactive field picker—click on Record A or Record B values to choose which value is preserved in the master record.
   - **AI Auto-Select**: Click **"AI Auto-Select Best Values (120B)"** to let `openai/gpt-oss-120b` evaluate both records and automatically pre-select the cleanest, most standardized field values.
   - **Step 3**: Review or customize the formal merge justification note.
   - Click **"Confirm & Execute Non-Destructive Merge"**.
8. **Merged Records Registry (`/registry/merged`)**:
   - Inspect historical ledger of all consolidated records, viewing source records, master records, timestamp, actor, and merge notes.

---

### 3. Administrator Console Flow (`ADMIN`)

**Login at [`/auth/login`](http://localhost:3000/auth/login) with `admin@uok.ac.rw` / `University123!`**

1. **Executive KPI Dashboard (`/admin`)**:
   - High-level institutional hygiene metrics: Total Records, Deduplication Rate, Pending Match Queue, Active Imports, and Campus Distribution charts.
2. **Machine Learning Model Evaluation (`/admin/model-evaluation`)**:
   - Precision, Recall (Sensitivity), F1-Score, and Overall Accuracy cards.
   - Classification Confusion Matrix: True Positives (TP), False Positives (FP), True Negatives (TN), False Negatives (FN).
   - Algorithm benchmark table comparing Fellegi-Sunter vs. Random Forest vs. Logistic Regression vs. Rule-based baselines.
   - **AI Strategic Model Audit**: Live executive report generated by `openai/gpt-oss-120b` analyzing pipeline health, high-risk ambiguity patterns, and threshold calibration guidance.
3. **Deduplication Threshold Settings (`/admin/settings`)**:
   - Adjust Match Threshold (default: `0.85`) and Possible Match Threshold (default: `0.65`).
   - Configure individual field weights (National ID, Reg No, Names, Phone, Date of Birth).
   - Saved configurations dynamically update the matching engine.
4. **System Audit Logs (`/admin/audit`)**:
   - Immutable audit trail tracking every dataset import, deduplication run, review decision, consolidation merge, role change, and user suspension.
   - Filterable by Action, Entity Type, and User ID.
5. **User & Access Management (`/admin/users`)**:
   - View all registered users.
   - Change user roles (`STUDENT`, `REGISTRY_STAFF`, `ADMIN`).
   - Suspend or restore user accounts with audit reason tracking.

---

## 🛠️ Installation & Getting Started

### 1. Prerequisites
- **Node.js**: v20 or later (v24 recommended)
- **Package Manager**: `pnpm` (v10+ recommended)
- **PostgreSQL**: Running instance with a database created (e.g. `data_duplication`)

### 2. Clone and Install Dependencies
```bash
git clone <repository-url>
cd data-duplication
pnpm install
```

### 3. Configure Environment Variables
Create or verify `.env.local` and `.env`:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/data_duplication?schema=public"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-better-auth-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Groq AI Model Configuration
GROQ_API_KEY="gsk_your_groq_api_key_here"
GROQ_MODEL="openai/gpt-oss-120b"
```

### 4. Database Setup & Seed
```bash
# Push schema to PostgreSQL database
pnpm db:push

# Generate Prisma Client
pnpm prisma generate

# Populate University of Kigali demonstration data & accounts
pnpm db:seed
```

### 5. Run Verification Tests
```bash
# Execute end-to-end verification test suite
npx tsx scripts/test-e2e.ts

# Run TypeScript type check
pnpm tsc --noEmit

# Run ESLint
pnpm lint
```

### 6. Start the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Production Build
```bash
pnpm build
pnpm start
```

---

## 📁 Repository Directory Structure

```
data-duplication/
├── actions/                         # Next.js Server Actions
│   ├── admin/operations.ts          # Admin reports, metrics, settings, user management, AI audit
│   ├── registry/deduplication.ts    # Deduplication pipeline, review decisions, merges, AI match insights
│   ├── registry/import.ts           # CSV upload, validation, batch ingestion
│   ├── registry/records.ts          # Institutional record queries & filtering
│   └── student/records.ts           # Student self-submission, duplicate checks, directory search
├── app/                             # Next.js 16 App Router
│   ├── (dashbords)/
│   │   ├── admin/                   # Admin Portal (KPIs, Users, Audit, Settings, ML Evaluation)
│   │   ├── registry/                # Registry Staff Portal (Records, Import, Reviews, Merge Tool)
│   │   └── student/                 # Student Portal (Dashboard, Submit, Check Duplicate, Search)
│   ├── api/auth/                    # Better Auth API endpoints
│   ├── auth/                        # Authentication Pages (Login, Register, OTP, Password Reset)
│   ├── icon.svg                     # Primary SVG Favicon (Institutional Crest & Match Badge)
│   ├── favicon.ico                  # Multi-resolution ICO (48x48, 32x32, 16x16)
│   ├── apple-icon.png               # High-res 180x180 Apple Touch Icon
│   ├── layout.tsx                   # Root Layout & UoK Metadata Configuration
│   └── page.tsx                     # Institutional Landing Page
├── components/                      # UI Components
│   ├── layout/                      # Sidebars (Admin, Registry, Student) and Header
│   ├── registry-side-by-side-review.tsx # Side-by-side comparison & AI analysis card
│   ├── registry-merge-tool.tsx      # Field preservation selector with AI auto-select
│   ├── registry-import-client.tsx   # CSV upload with in-file duplicate diagnostics
│   ├── registry-reviews-client.tsx  # Review queue table
│   ├── admin-users-client.tsx       # User role & suspension manager
│   ├── admin-settings-client.tsx    # Matching threshold settings
│   └── admin-audit-client.tsx       # Searchable system audit log
├── lib/                             # Core Libraries & Deduplication Engine
│   ├── ai.ts                        # Groq openai/gpt-oss-120b AI Entity Resolution Engine
│   ├── auth.ts                      # Better Auth instance & email OTP configuration
│   ├── auth-routing.ts              # Role-based redirection logic
│   ├── prisma.ts                    # Prisma Client singleton
│   ├── admin-auth.ts                # Admin session & role guards
│   ├── registry-auth.ts             # Registry Staff session & role guards
│   ├── student-auth.ts              # Student session & role guards
│   └── deduplication/               # Deduplication Algorithms
│       ├── standardization.ts       # Normalization (Names, Phones, Dates, Reg Nos, National IDs)
│       ├── similarity.ts            # Jaro-Winkler, Levenshtein, Token-Sort, Phone/Date Agreement
│       ├── blocking.ts              # Multi-pass candidate blocking
│       ├── matching-engine.ts       # Fellegi-Sunter scoring, classification, explainability
│       ├── csv-importer.ts          # CSV parser, column alias mapping, in-file duplicate detection
│       └── audit.ts                 # Audit logging helper
├── prisma/
│   ├── schema.prisma                # Clean Prisma schema (Better Auth + UoK Deduplication models)
│   └── seed.ts                      # Demonstration seed data with real-world discrepancies
├── proxy.ts                         # Next.js 16 Root Proxy (Session handling & role guards)
├── scripts/
│   └── test-e2e.ts                  # Comprehensive end-to-end test suite
└── README.md                        # Documentation
```

---

## 🔒 Security & Governance

1. **Role Enforcement**: Every server action and page route enforces strict server-side authentication (`requireAdminAction`, `requireRegistryAction`, `requireStudentAction`).
2. **Better Auth Integrity**: Better Auth core tables remain strictly untouched; all institutional models reference scalar user IDs (`uploadedById`, `reviewedById`, `mergedById`, `studentUserId`).
3. **Data Loss Prevention**: Record deletion is restricted. Merging operates via non-destructive state consolidation into verified master records.
4. **Auditability**: Every merge, import, review decision, and threshold update is recorded in `DeduplicationAuditLog` with actor ID, timestamp, and metadata.

---

## 📄 License

This system is developed for the **University of Kigali (UoK)**. Internal academic and administrative use only.
