# IMPLEMENTATION PLAN: DEMIR-AI COMMAND CENTER

## 1. Overview

**DEMIR-AI** is the sophisticated "Command Center" for the Demir Gayrimenkul Admin Panel. It functions as a high-level assistant designed to support **Mustafa Demir** in managing real estate operations with professional precision and deep legal awareness.

### Persona: The "Core-Bred" Professional

- **Experience**: 15+ years in the Turkish Real Estate sector.
- **Knowledge**: Expert-level mastery of Turkish Real Estate Laws (Medeni Kanun, Borçlar Kanunu, Tapu ve Kadastro) and local market dynamics in **Sakarya/Hendek**.
- **Tone**: Professional, loyal, highly competent, and proactive.
- **Relationship**: Acts as the "right hand" to Mustafa Demir, understanding his business legacy and preferences intimately.

---

## 2. Architecture

### A. Database Schema (Drizzle ORM & Postgres)

The AI system requires persistent memory and an audit trail.

```typescript
// Proposed schema for src/db/schema/ai.ts

export const aiMemories = pgTable("ai_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }), // For RAG/Semantic Search
  memoryType: varchar("memory_type", { length: 50 }), // 'long_term', 'short_term', 'law_reference'
  metadata: jsonb("metadata"), // Source page, Law article number, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiLogs = pgTable("ai_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: varchar("action", { length: 255 }),
  details: text("details"),
  performedBy: uuid("performed_by"),
  timestamp: timestamp("timestamp").defaultNow(),
});
```

### B. Backend API Layer (`/api/ai/command-center`)

- **LLM**: GPT-4o or DeepSeek, configured with a system prompt defining the "Core-bred Professional" persona.
- **Tool Calling System**:
  - `query_stats(metric: string, period: string)`: Fetches real-time sales/listing data via Drizzle.
  - `search_laws(query: string)`: High-precision RAG search focused on the Knowledge Base.
  - `navigate_admin(path: string)`: Returns routing instructions for the UI.
  - `client_history(clientId: string)`: Retrieves Mustafa's previous notes about specific clients.

### C. UI/UX: The Command Center Interface

- **Component**: `src/components/admin/DemirAIWidget.tsx` (Global but conditionally rendered)
- **Aesthetic**: Premium **Dark & Gold** theme using **Tailwind v4**. Glassmorphism and animations to signify high-end technology.
- **Interaction**:
  - **Draggable Chat Interface**: Uses `framer-motion` to allow movement across any admin page without obstructing content.
  - **Voice Interface**: Web Speech API integration for hands-free "Command Center" control.
  - **Visual Cues**: Pulsing gold border when the AI is "listening" or "thinking."

---

## 3. Knowledge Base Architecture

To ensure legal mastery, the system will ingest and vectorize:

- **Türk Medeni Kanunu** (Property & Possession rights)
- **Türk Borçlar Kanunu** (Rental agreements & obligations)
- **Taşınmaz Ticareti Hakkında Yönetmelik** (Brokerage standards)
- **Kat Mülkiyeti Kanunu** (Condominium management)
- **Local Context**: Mustafa Demir's specific business procedures and Sakarya/Hendek regional data.

---

## 4. Step-by-Step Implementation Plan

### Phase 1: Foundation (DB & Knowledge) - ✅ COMPLETED

1.  **DB Migration**: Apply the `ai_memories` and `ai_logs` tables. [x] (Implemented as `ai-memory.ts`)
2.  **RAG Pipeline**: Create a script to parse Turkish Real Estate Law PDFs and store them as embeddings. [ ] (Using keyword search fallback for now)
3.  **Base Endpoint**: Design the `/api/ai/command-center` with basic system prompt. [x]

### Phase 2: Intelligence & Tools - ✅ COMPLETED

1.  **Tool Implementation**: Connect the AI to Drizzle ORM functions for stats (`query_stats`). [x] (`src/lib/ai/tools.ts`)
2.  **Memory Layer**: Implement logic to store and retrieve "Mustafa's Preferences" from previous sessions. [x] (`add_memory`, `search_memories`)
3.  **Search Logic**: Optimize `search_laws` to prioritize specific articles. [x] (Keyword optimized)
4.  **Data Analysis**: Implement `run_sql_query` for deep data analysis with safety checks. [x] (Added Schema Context Injection)

### Phase 3: Enhanced UI/UX - ✅ COMPLETED

1.  **Draggable Core**: Build the floating widget component with Tailwind v4 + Framer Motion. [x] (`DemirAIWidget.tsx`)
2.  **Voice Layer**: Add microphone input for commands and high-quality TTS. [x] (Fixed permission errors)
3.  **Proactive Mode**: Enable the AI to suggest actions based on the active route. [x]

---

## 5. Verification Steps

- [ ] **Persona Validation**: Ask a complex question about "Taşınmaz Ticareti Yönetmeliği" and verify the accuracy.
- [ ] **Tool Integration**: Confirm `query_stats` returns accurate numbers from the production database.
- [ ] **UI Persistence**: Verify the widget maintains its position and chat state across page navigations.
- [ ] **Memory Test**: Tell the AI a specific fact about a client and confirm it recalls this fact in a new session.
