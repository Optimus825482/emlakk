-- AI Memory System Tables
-- Created: 2026-01-21
-- Purpose: Demir-AI Command Center layered memory system

-- Enable pgvector extension (if available)
DO $$ 
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION 
    WHEN OTHERS THEN 
        RAISE NOTICE 'pgvector extension not available, skipping vector column';
END $$;

-- 1. AI Memory (Long-term memory with optional vector embeddings)
CREATE TABLE IF NOT EXISTS ai_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_type VARCHAR(50) NOT NULL, -- 'conversation', 'task', 'insight', 'fact'
    category VARCHAR(100) NOT NULL, -- 'admin_interaction', 'listing_analysis', etc.
    content TEXT NOT NULL,
    summary TEXT,
    context JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    -- embedding VECTOR(1536), -- OpenAI text-embedding-3-small (optional, requires pgvector)
    importance_score INTEGER DEFAULT 50 CHECK (importance_score >= 0 AND importance_score <= 100),
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    related_memory_ids UUID[] DEFAULT '{}',
    source_type VARCHAR(50), -- 'chat', 'tool', 'system'
    source_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- 2. AI Conversations (Working memory - session-based)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID,
    messages JSONB DEFAULT '[]',
    context JSONB DEFAULT '{}',
    agent_type VARCHAR(50) DEFAULT 'command_center',
    total_messages INTEGER DEFAULT 0,
    last_message_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. AI Tasks (Task execution tracking)
CREATE TABLE IF NOT EXISTS ai_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(50) NOT NULL, -- 'sql_query', 'python_exec', 'analysis', etc.
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    input JSONB NOT NULL,
    output JSONB,
    error TEXT,
    execution_time_ms INTEGER,
    user_id UUID,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 4. AI Agent Logs (Audit trail)
CREATE TABLE IF NOT EXISTS ai_agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    input JSONB,
    output JSONB,
    duration_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error TEXT,
    user_id UUID,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Command History (User command history)
CREATE TABLE IF NOT EXISTS command_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id VARCHAR(255),
    command TEXT NOT NULL,
    command_type VARCHAR(50), -- 'voice', 'text', 'quick_action'
    response TEXT,
    success BOOLEAN DEFAULT true,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. AI Insights Cache (Performance cache)
CREATE TABLE IF NOT EXISTS ai_insights_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_type VARCHAR(50) NOT NULL, -- 'listing_analysis', 'market_trend', etc.
    data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_memory_category ON ai_memory(category);
CREATE INDEX IF NOT EXISTS idx_ai_memory_importance ON ai_memory(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_created ON ai_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_tags ON ai_memory USING GIN(tags);
-- CREATE INDEX IF NOT EXISTS idx_ai_memory_embedding ON ai_memory USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100); -- Requires pgvector

CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON ai_conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_session ON ai_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_created ON ai_tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_agent ON ai_agent_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_session ON ai_agent_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_created ON ai_agent_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_command_history_user ON command_history(user_id);
CREATE INDEX IF NOT EXISTS idx_command_history_session ON command_history(session_id);
CREATE INDEX IF NOT EXISTS idx_command_history_created ON command_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_insights_cache_key ON ai_insights_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_insights_cache_expires ON ai_insights_cache(expires_at);

-- Comments
COMMENT ON TABLE ai_memory IS 'Long-term memory storage with optional vector embeddings for semantic search';
COMMENT ON TABLE ai_conversations IS 'Working memory for active chat sessions';
COMMENT ON TABLE ai_tasks IS 'Task execution tracking and results';
COMMENT ON TABLE ai_agent_logs IS 'Audit trail for all agent actions';
COMMENT ON TABLE command_history IS 'User command history for analytics';
COMMENT ON TABLE ai_insights_cache IS 'Performance cache for expensive computations';
