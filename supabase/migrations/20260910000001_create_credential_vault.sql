-- ==============================================================================
-- SubTracker Pro Migration: Credential Vault & Master Account Password Storage
-- ==============================================================================

-- 1. Add master_password column to pools table if not exists
DO $$ BEGIN 
IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pools' AND column_name = 'master_password'
) THEN
    ALTER TABLE public.pools ADD COLUMN master_password TEXT;
END IF;
END $$;

-- 2. Create Credential Vault Table (Encrypted Master Account Passwords, Recovery Keys, 2FA, PINs)
CREATE TABLE IF NOT EXISTS public.credential_vault (
    id TEXT PRIMARY KEY,
    pool_id TEXT REFERENCES public.pools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    service_provider VARCHAR(255) NOT NULL DEFAULT 'Google One',
    account_email VARCHAR(255) NOT NULL,
    secret_type VARCHAR(50) NOT NULL DEFAULT 'password', -- 'password', 'recovery_code', 'pin', 'notes'
    secret_value TEXT NOT NULL,
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.credential_vault ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy
DROP POLICY IF EXISTS "Enable all operations for anon on credential_vault" ON public.credential_vault;
CREATE POLICY "Enable all operations for anon on credential_vault" 
ON public.credential_vault 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. Indexes for Fast Credential Lookup
CREATE INDEX IF NOT EXISTS idx_credential_vault_pool_id ON public.credential_vault(pool_id);
CREATE INDEX IF NOT EXISTS idx_credential_vault_account_email ON public.credential_vault(account_email);
CREATE INDEX IF NOT EXISTS idx_credential_vault_secret_type ON public.credential_vault(secret_type);
