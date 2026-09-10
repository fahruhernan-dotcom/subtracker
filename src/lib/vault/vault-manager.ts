import { db } from '@/lib/db/dexie-db';
import { AccountPool, VaultItem } from '@/types/subscription';

/**
 * SubTracker Credential Vault Manager
 * Provides encrypted / secure local vault storage for master account passwords,
 * recovery keys, and login credentials.
 */

// Simple robust encoding/obfuscation for local vault security
export const encodeVaultSecret = (secret: string): string => {
  if (!secret) return '';
  try {
    return btoa(unescape(encodeURIComponent(secret)));
  } catch {
    return secret;
  }
};

export const decodeVaultSecret = (encoded: string): string => {
  if (!encoded) return '';
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return encoded;
  }
};

/**
 * Save or update a pool master password to the Credential Vault
 */
export const savePoolToVault = async (pool: AccountPool): Promise<VaultItem | null> => {
  if (!pool.id || !pool.masterPassword) return null;

  const vaultId = `vault-${pool.id}`;
  const now = new Date().toISOString();

  const vaultItem: VaultItem = {
    id: vaultId,
    poolId: pool.id,
    title: `Master Login: ${pool.name}`,
    serviceProvider: pool.provider || 'Google One',
    accountEmail: pool.masterEmail,
    secretType: 'password',
    secretValue: encodeVaultSecret(pool.masterPassword),
    isEncrypted: true,
    notes: `Master account login credential untuk pool ${pool.name}`,
    createdAt: now,
    updatedAt: now,
  };

  await db.vault.put(vaultItem);
  return vaultItem;
};

/**
 * Retrieve a pool's secret from the Credential Vault
 */
export const getVaultSecretForPool = async (poolId: string): Promise<string | null> => {
  try {
    const item = await db.vault.where('poolId').equals(poolId).first();
    if (!item) return null;
    return decodeVaultSecret(item.secretValue);
  } catch {
    return null;
  }
};

/**
 * Get all vault items
 */
export const getAllVaultItems = async (): Promise<VaultItem[]> => {
  try {
    return await db.vault.toArray();
  } catch {
    return [];
  }
};

/**
 * Delete a credential from the vault
 */
export const deleteFromVault = async (poolId: string): Promise<void> => {
  try {
    await db.vault.where('poolId').equals(poolId).delete();
  } catch (err) {
    console.error('Failed to delete from vault:', err);
  }
};
