import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts text using AES-256-GCM
 * Output format: iv:authTag:encryptedData (all in hex)
 */
export async function encrypt(text: string, hexKey: string): Promise<string> {
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== 32) {
    throw new Error('Invalid key length. Key must be 32 bytes (64 hex characters).');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts text using AES-256-GCM
 * Input format: iv:authTag:encryptedData (all in hex)
 */
export async function decrypt(encryptedData: string, hexKey: string): Promise<string> {
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== 32) {
    throw new Error('Invalid key length. Key must be 32 bytes (64 hex characters).');
  }

  const [ivHex, authTagHex, dataHex] = encryptedData.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Invalid encrypted data format.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(dataHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
