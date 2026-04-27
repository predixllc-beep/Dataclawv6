-- Migration 3: User Settings and Exchange States

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id uuid REFERENCES auth.users PRIMARY KEY,
    mode text DEFAULT 'paper',
    active_exchange text DEFAULT 'binance',
    agents_config jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.exchange_states (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    venue text NOT NULL,
    state_data jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, venue)
);

ALTER TABLE public.exchange_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own exchange states" ON public.exchange_states FOR ALL USING (auth.uid() = user_id);
