import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

@Injectable()
export class CredentialCryptoService {
  constructor(private readonly config: ConfigService) {}

  private encryptionKey(): Buffer {
    const b64 = this.config.get<string>('DATASOURCE_ENCRYPTION_KEY');
    if (!b64) {
      throw new ServiceUnavailableException(
        'DATASOURCE_ENCRYPTION_KEY is not configured',
      );
    }
    const key = Buffer.from(b64, 'base64');
    if (key.length !== 32) {
      throw new ServiceUnavailableException(
        'DATASOURCE_ENCRYPTION_KEY must be 32 bytes (base64-encoded)',
      );
    }
    return key;
  }

  encrypt(plain: string): string {
    const key = this.encryptionKey();
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGO, key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  decrypt(payload: string): string {
    const key = this.encryptionKey();
    const buf = Buffer.from(payload, 'base64');
    if (buf.length < IV_LEN + TAG_LEN + 1) {
      throw new ServiceUnavailableException('Invalid credential payload');
    }
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString(
      'utf8',
    );
  }
}
