-- Dataclaw Initial Supabase Migration & Schema

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- 1. AGENTS
CREATE TABLE public.agent_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    name text NOT NULL,
    model text NOT NULL,
    config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name)
);

ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own agent configs" ON public.agent_configs
    FOR ALL USING (auth.uid() = user_id);

-- 2. AGENT MEMORY (pgvector)
CREATE TABLE public.agent_memory (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    agent_name text NOT NULL,
    memory_text text NOT NULL,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own agent memory" ON public.agent_memory
    FOR ALL USING (auth.uid() = user_id);

-- Search memory function
CREATE OR REPLACE FUNCTION match_agent_memory (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_agent_name text,
  p_user_id uuid
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
    agent_memory.id,
    agent_memory.memory_text,
    agent_memory.metadata,
    1 - (agent_memory.embedding <=> query_embedding) AS similarity
  FROM agent_memory
  WHERE 1 - (agent_memory.embedding <=> query_embedding) > match_threshold
    AND agent_name = p_agent_name
    AND user_id = p_user_id
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- 3. TRADE HISTORY
CREATE TABLE public.trade_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    symbol text NOT NULL,
    side text NOT NULL,
    size numeric NOT NULL,
    price numeric,
    venue text NOT NULL,
    mode text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their trade history" ON public.trade_history
    FOR ALL USING (auth.uid() = user_id);

-- 4. EXTERNAL EXCHANGES
CREATE TABLE public.exchange_connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    venue text NOT NULL,
    api_key_encrypted text NOT NULL,
    api_secret_encrypted text NOT NULL,
    is_active boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, venue)
);

ALTER TABLE public.exchange_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their exchange API keys" ON public.exchange_connections
    FOR ALL USING (auth.uid() = user_id);

-- 5. PLUGIN REGISTRY
CREATE TABLE public.plugin_registry (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    plugin_name text NOT NULL,
    state_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, plugin_name)
);

ALTER TABLE public.plugin_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage plugins" ON public.plugin_registry
    FOR ALL USING (auth.uid() = user_id);

-- 6. SYSTEM LOGS & METRICS
CREATE TABLE public.signal_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    agent_name text NOT NULL,
    symbol text NOT NULL,
    signal text NOT NULL,
    confidence float NOT NULL,
    rationale text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.signal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view signals" ON public.signal_logs FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view audit logs" ON public.audit_logs FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.model_performance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    model_name text NOT NULL,
    latency_ms int NOT NULL,
    quality_score float,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.model_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view perf" ON public.model_performance FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.strategy_mutations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    strategy_name text NOT NULL,
    mutation_details jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.strategy_mutations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view mutations" ON public.strategy_mutations FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.black_swan_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    event_type text NOT NULL,
    severity int NOT NULL,
    impact_json jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.black_swan_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view black_swans" ON public.black_swan_events FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.exchange_failures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    venue text NOT NULL,
    error_message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.exchange_failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view exchange failures" ON public.exchange_failures FOR ALL USING (auth.uid() = user_id);
