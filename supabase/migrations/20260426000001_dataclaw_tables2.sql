-- Dataclaw Additional Supabase Migration & Schema

-- 7. PORTFOLIO & RISK
CREATE TABLE public.risk_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    max_drawdown_pct numeric NOT NULL DEFAULT 20.0,
    max_position_size_usd numeric NOT NULL DEFAULT 1000.0,
    daily_loss_limit_usd numeric NOT NULL DEFAULT 500.0,
    leverage_limit numeric NOT NULL DEFAULT 1.0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);
ALTER TABLE public.risk_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their risk profile" ON public.risk_profiles FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.portfolio_state (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    total_value_usd numeric NOT NULL,
    available_cash_usd numeric NOT NULL,
    positions_json jsonb DEFAULT '[]'::jsonb,
    recorded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.portfolio_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their portfolio state" ON public.portfolio_state FOR ALL USING (auth.uid() = user_id);

-- 8. EXTENDED LOGS & EVENTS
CREATE TABLE public.system_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    event_type text NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view system events" ON public.system_events FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.model_routing (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    task_type text NOT NULL,
    selected_model text NOT NULL,
    routing_rationale text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.model_routing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view model routing" ON public.model_routing FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.onchain_signals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    network text NOT NULL,
    contract_address text,
    signal_type text NOT NULL,
    severity int,
    details jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.onchain_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view onchain signals" ON public.onchain_signals FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.strategy_versions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    strategy_name text NOT NULL,
    version_tag text NOT NULL,
    logic_code text,
    parameters jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.strategy_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view strategy versions" ON public.strategy_versions FOR ALL USING (auth.uid() = user_id);
