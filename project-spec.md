AI-Enhanced Mobile FinTech App: Project Overview
1. Executive Summary
   An enterprise-grade, mobile-first personal finance application designed for smartphones. The application serves as a modern FinTech showcase, featuring secure JSON Web Token (JWT) user authentication, scalable transaction ledgering, a batch CSV statement processor, and an integrated Large Language Model (LLM) engine that automatically categorizes raw transaction strings and delivers personalized budgeting insights directly to the mobile UI.

2. Decoupled System Architecture
   The Backend (The Core Brain): A unified, centralized Java Spring Boot REST API that processes database calculations, security authorization, and AI prompting.

The Database: A secure, relational PostgreSQL instance mapping system transactions with precision data mapping (BigDecimal).

The Frontend (The Client App): A cross-platform React Native application, built using TypeScript and the Expo ecosystem, optimized for high performance on both iOS and Android.

3. Core Mobile Application Modules
   Module A: User Authentication & Mobile Security
   JWT Security: Secure user onboarding and login. The React Native client securely handles and stores JWT tokens locally to maintain state sessions.

Data Isolation: Strict user-level architecture. Users can access, edit, or upload data strictly associated with their personal user_id.

Module B: The Transaction Engine & CSV Ingestion
Precise Bookkeeping: Full CRUD endpoints tracking user transactions (amount, type, timestamps, and details).

Bulk CSV Upload: A specialized backend processing service. The user can import raw .csv bank files via the app, parsing row records into batch inserts for PostgreSQL.

Module C: AI Processing Core
Automated Categorization: Translates vague, raw billing descriptions into clean tags (e.g., parsing a vendor name to tag it under "Utilities" or "Groceries").

Fintech AI Advising: Aggregates a user's monthly metadata to dynamically prompt an LLM API, feeding tailored cost-saving insights back to the mobile client.

Module D: High-Fidelity Mobile UI
Finance Dashboard: Dynamic interactive charts (built via recharts on web view or react-native-wagmi-charts / react-native-gifted-charts) tracking income vs. spending.

Real-time Budget Alerts: Indicators displaying when a category's spending trends dangerously close to preset budget thresholds.

4. Database Schema Blueprint (PostgreSQL)
1. AppUser Entity

id (UUID, Primary Key)

email (String, Unique Index)

passwordHash (String)

createdAt (Timestamp)

2. Transaction Entity

id (UUID, Primary Key)

userId (UUID, Foreign Key)

amount (BigDecimal)

transactionDate (Date)

rawDescription (String)

category (String)

type (Enum: INCOME, EXPENSE)

isAiCategorized (Boolean)

3. BudgetGoal Entity

id (UUID, Primary Key)

userId (UUID, Foreign Key)

category (String)

targetAmount (BigDecimal)

monthYear (String)