import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../encryption';

describe('Encryption Service', () => {
  const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const secretData = 'my-super-secret-token-123';

  it('should encrypt and decrypt data correctly', async () => {
    const encrypted = await encrypt(secretData, testKey);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(secretData);
    expect(typeof encrypted).toBe('string');

    const decrypted = await decrypt(encrypted, testKey);
    expect(decrypted).toBe(secretData);
  });

  it('should throw error with incorrect key', async () => {
    const encrypted = await encrypt(secretData, testKey);
    const wrongKey = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
    
    await expect(decrypt(encrypted, wrongKey)).rejects.toThrow();
  });

  it('should produce different ciphertexts for same data (IV randomness)', async () => {
    const encrypted1 = await encrypt(secretData, testKey);
    const encrypted2 = await encrypt(secretData, testKey);
    
    expect(encrypted1).not.toBe(encrypted2);
  });
});
