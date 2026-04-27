-- Migration 4: Infrastructure, Routing, and Expanded Agents

CREATE EXTENSION IF NOT EXISTS vector;

-- Infra Config Table
CREATE TABLE IF NOT EXISTS public.infra_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    redis_url text,
    redis_enabled boolean DEFAULT false,
    model_routing jsonb DEFAULT '{"primary": "mistral", "fallback": "deepseek", "local_only": true}'::jsonb,
    exchanges jsonb DEFAULT '{"binance": {"enabled": true, "priority": 1}, "mexc": {"enabled": true, "priority": 2}, "bybit": {"enabled": false, "priority": 3}, "okx": {"enabled": false, "priority": 4}}'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.infra_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own infra config" ON public.infra_config FOR ALL USING (auth.uid() = user_id);

-- Expanded Agent Memory
CREATE TABLE IF NOT EXISTS public.agent_memory (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    agent_name text NOT NULL,
    memory_text text NOT NULL,
    embedding vector(1536), -- Assuming 1536 dimensions for embeddings, adjust based on actual model
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own agent memory" ON public.agent_memory FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION match_agent_memory(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_agent_name text DEFAULT 'all',
    p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    memory_text text,
    metadata jsonb,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        am.id,
        am.memory_text,
        am.metadata,
        1 - (am.embedding <=> query_embedding) AS similarity
    FROM
        public.agent_memory am
    WHERE
        1 - (am.embedding <=> query_embedding) > match_threshold
        AND (p_agent_name = 'all' OR am.agent_name = p_agent_name)
        AND (p_user_id IS NULL OR am.user_id = p_user_id)
    ORDER BY
        am.embedding <=> query_embedding
    LIMIT match_count;
$$;
