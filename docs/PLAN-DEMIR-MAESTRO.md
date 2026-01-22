# PLAN-DEMIR-MAESTRO: Demir AI Orchestration Upgrade

> **Status:** Draft
> **Owner:** Demir AI Command Center
> **Goal:** Transform the Admin Assistant into a central "Maestro" that can delegate tasks to specialized agents (Miner, Content, etc.).

## 1. Overview

Currently, the `DemirAICommandCenter` connects to the `admin_assistant` agent, which has limited tools (SQL, Navigation, Basic Search). The user wants this agent to act as an "Orchestra Conductor", delegating complex tasks to specialized sub-agents.

**New Capabilities:**

- **Delegation:** Admin Assistant can assign tasks to `Miner Agent` (Market Research) and `Content Agent` (Social Media).
- **Research:** Admin Assistant can perform deep web research using `search_web` capabilities (via specific tool).
- **Parallelism:** The architecture should support requesting multiple sub-tasks (conceptually).

## 2. Architecture Changes

### A. `src/lib/ai/tools.ts` (AdminTools)

Add new tools:

1.  **`delegate_to_agent(agent: "miner" | "content", task: string, context: any)`**:
    - Invokes the specific sub-agent with a task.
    - Returns the sub-agent's detailed report.
2.  **`web_research(query: string)`**:
    - Performs a web search (Tavily/Brave) to get real-time info.
    - Useful for "Dollar rate", "New housing regulations", etc.

### B. `src/lib/ai/orchestrator.ts` (AgentOrchestrator)

1.  **Update `admin_assistant` Prompt:**
    - Explicitly list "Team Members" (Miner Agent, Content Agent).
    - Instruct on when to delegate vs. do it yourself.
2.  **Implement `delegate_to_agent` Logic:**
    - Connect the tool call to `this.generateContent` or `this.analyzeMarket` or generic chat.

## 3. Implementation Steps

- [ ] **Step 1: Update AdminTools Interface**
  - Add `delegate_to_agent` to `AdminToolType`.
  - Implement the method stubs (actual logic might need to reside in Orchestrator or be passed in). _Refinement: Since Tools are separate from Orchestrator class, we might need to inject the Orchestrator into Tools or handle the delegation in the `adminAssistantChat` loop directly._ -> **Decision: Handle delegation in the Orchestrator's tool execution switch case to avoid circular dependencies.**

- [ ] **Step 2: Update Orchestrator Logic**
  - In `adminAssistantChat`, add `case "delegate_to_agent":`.
  - Call `this.chat("miner_agent", ...)` or specific methods.

- [ ] **Step 3: Update System Prompts**
  - Teach Admin Assistant about `Miner Agent` (Data analyst) and `Content Agent` (Social Media Manager).

- [ ] **Step 4: Add Web Research**
  - Add `web_research` tool that uses `Tavily` or `Brave` (simulated or actual API if available). _Note: We have Tavily MCP._

## 4. Example User Flow

**User:** "Hendek'teki arsa fiyatlarını analiz et ve buna uygun bir Instagram postu hazırla."

**Admin Assistant (Maestro):**

1.  Thought: "I need market data first."
2.  Action: `delegate_to_agent("miner", "Analyze land prices in Hendek")`
3.  **Miner Agent:** Returns JSON with price trends.
4.  Thought: "Now I have data. I need to create content."
5.  Action: `delegate_to_agent("content", "Create Instagram post for Hendek lands based on: [Miner Data]")`
6.  **Content Agent:** Returns text + hashtags.
7.  **Admin Assistant:** "İşte Hendek analizi ve hazırladığım Instagram postu: ..."

## 5. Verification

- Test delegation flow in `DemirAICommandCenter`.
- Verify JSON handling between agents.
