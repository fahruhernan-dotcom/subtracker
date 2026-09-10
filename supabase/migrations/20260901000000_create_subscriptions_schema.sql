-- ==============================================================================
-- SubTracker Pro - Supabase PostgreSQL Schema & RLS Policies
-- ==============================================================================

-- 1. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    account_email VARCHAR(255) NOT NULL,
    invited_by VARCHAR(255),
    inviter_contact TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
    auto_renews BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
    reminder_offsets JSONB NOT NULL DEFAULT '[-7, -3, -1, 0, 1]'::jsonb,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    service_url TEXT,
    avatar_color VARCHAR(50) DEFAULT 'bg-blue-600',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    terminated_at TIMESTAMPTZ,
    last_renewed_at TIMESTAMPTZ
);

-- 2. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    subscription_name VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
ON public.subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Indexes for high performance queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp ON public.activity_logs(user_id, timestamp DESC);

-- 5. Create Pools & Credential Vault Tables
CREATE TABLE IF NOT EXISTS public.pools (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    master_email VARCHAR(255) NOT NULL,
    total_capacity INT NOT NULL DEFAULT 5,
    master_end_date DATE NOT NULL,
    master_cost NUMERIC(12, 2) DEFAULT 0,
    master_password TEXT,
    notes TEXT,
    avatar_color VARCHAR(50) DEFAULT 'bg-blue-600',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credential_vault (
    id TEXT PRIMARY KEY,
    pool_id TEXT REFERENCES public.pools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    service_provider VARCHAR(255) NOT NULL DEFAULT 'Google One',
    account_email VARCHAR(255) NOT NULL,
    secret_type VARCHAR(50) NOT NULL DEFAULT 'password',
    secret_value TEXT NOT NULL,
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for anon on pools" ON public.pools;
CREATE POLICY "Enable all operations for anon on pools" ON public.pools FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all operations for anon on credential_vault" ON public.credential_vault;
CREATE POLICY "Enable all operations for anon on credential_vault" ON public.credential_vault FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pools_master_end_date ON public.pools(master_end_date);
CREATE INDEX IF NOT EXISTS idx_credential_vault_pool_id ON public.credential_vault(pool_id);
