-- ==============================================================================
-- SubTracker Pro - Supabase Database Schema (Idempotent & Migration Safe)
-- Jalankan query ini di Supabase SQL Editor: https://supabase.com/dashboard/project/dwphczucsxfekbulbnpv/sql
-- ==============================================================================
-- 1. Table Pools / Master Accounts / Family Groups
CREATE TABLE IF NOT EXISTS public.pools (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    master_email VARCHAR(255) NOT NULL,
    total_capacity INT NOT NULL DEFAULT 5,
    master_end_date DATE NOT NULL,
    master_cost NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    avatar_color VARCHAR(50) DEFAULT 'bg-blue-600',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 2. Table Subscriptions / Member Slots
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    account_email VARCHAR(255) NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    pool_id TEXT REFERENCES public.pools(id) ON DELETE
    SET NULL,
        pool_name VARCHAR(255),
        slot_number INT,
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
        tags TEXT [] DEFAULT '{}',
        service_url TEXT,
        avatar_color VARCHAR(50) DEFAULT 'bg-blue-600',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        terminated_at TIMESTAMPTZ,
        last_renewed_at TIMESTAMPTZ
);
-- Migration safety for existing subscriptions table
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'subscriptions'
        AND column_name = 'pool_id'
) THEN
ALTER TABLE public.subscriptions
ADD COLUMN pool_id TEXT REFERENCES public.pools(id) ON DELETE
SET NULL;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'subscriptions'
        AND column_name = 'pool_name'
) THEN
ALTER TABLE public.subscriptions
ADD COLUMN pool_name VARCHAR(255);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'subscriptions'
        AND column_name = 'slot_number'
) THEN
ALTER TABLE public.subscriptions
ADD COLUMN slot_number INT;
END IF;
END $$;
-- 3. Table Activity & Audit Logs (Error, Pergantian Member, WA, Renewal)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    subscription_id TEXT,
    subscription_name VARCHAR(255),
    member_name VARCHAR(255),
    pool_id TEXT REFERENCES public.pools(id) ON DELETE
    SET NULL,
        pool_name VARCHAR(255),
        action_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'info',
        old_value TEXT,
        new_value TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        description TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Migration safety for existing activity_logs table
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'activity_logs'
        AND column_name = 'severity'
) THEN
ALTER TABLE public.activity_logs
ADD COLUMN severity VARCHAR(20) NOT NULL DEFAULT 'info';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'activity_logs'
        AND column_name = 'pool_id'
) THEN
ALTER TABLE public.activity_logs
ADD COLUMN pool_id TEXT REFERENCES public.pools(id) ON DELETE
SET NULL;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'activity_logs'
        AND column_name = 'pool_name'
) THEN
ALTER TABLE public.activity_logs
ADD COLUMN pool_name VARCHAR(255);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'activity_logs'
        AND column_name = 'old_value'
) THEN
ALTER TABLE public.activity_logs
ADD COLUMN old_value TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'activity_logs'
        AND column_name = 'new_value'
) THEN
ALTER TABLE public.activity_logs
ADD COLUMN new_value TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'activity_logs'
        AND column_name = 'metadata'
) THEN
ALTER TABLE public.activity_logs
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
END IF;
END $$;
-- 4. Table Pricing Packages
CREATE TABLE IF NOT EXISTS public.pricing_packages (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL DEFAULT 'PRIMARY_EMAIL',
    duration_months INT NOT NULL DEFAULT 3,
    billing_cycle VARCHAR(50) NOT NULL DEFAULT 'quarterly',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    badge VARCHAR(100),
    badge_color VARCHAR(100),
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable Row Level Security
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;

-- 6. Safe Policy Creation (Drop first if exists to prevent 42710 error)
DROP POLICY IF EXISTS "Enable all operations for anon on pools" ON public.pools;
CREATE POLICY "Enable all operations for anon on pools" ON public.pools FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all operations for anon on subscriptions" ON public.subscriptions;
CREATE POLICY "Enable all operations for anon on subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all operations for anon on logs" ON public.activity_logs;
CREATE POLICY "Enable all operations for anon on logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all operations for anon on packages" ON public.pricing_packages;
CREATE POLICY "Enable all operations for anon on packages" ON public.pricing_packages FOR ALL USING (true) WITH CHECK (true);

-- 7. Fast Indexes
CREATE INDEX IF NOT EXISTS idx_pools_master_end_date ON public.pools(master_end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_pool_id ON public.subscriptions(pool_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_severity ON public.activity_logs(severity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_packages_account_type ON public.pricing_packages(account_type);
CREATE INDEX IF NOT EXISTS idx_pricing_packages_sort_order ON public.pricing_packages(sort_order ASC);