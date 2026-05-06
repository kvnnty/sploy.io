import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

const ALLOWED_IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

export type UploadScope =
  | { type: 'user-avatar'; userId: string }
  | { type: 'team-avatar'; teamId: string }
  | { type: 'team-asset'; teamId: string };

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client!: MinioClient;
  private bucket!: string;
  private publicUrl!: string;
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const endpoint = this.config.get<string>('MINIO_ENDPOINT');
    if (!endpoint) {
      this.logger.warn(
        'MINIO_ENDPOINT not configured — file uploads are disabled',
      );
      return;
    }

    const port = this.config.get<number>('MINIO_PORT') ?? 9000;
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY') ?? '';
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY') ?? '';
    const useSSL = this.config.get<string>('MINIO_USE_SSL') === 'true';

    this.bucket = this.config.get<string>('MINIO_BUCKET') ?? 'sploy';
    this.publicUrl =
      this.config.get<string>('MINIO_PUBLIC_URL') ??
      `${useSSL ? 'https' : 'http'}://${endpoint}:${port}/${this.bucket}`;

    this.client = new MinioClient({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created bucket "${this.bucket}"`);
      }
      await this.ensurePublicReadPolicy();
      this.enabled = true;
      this.logger.log(`MinIO connected → ${endpoint}:${port}/${this.bucket}`);
    } catch (err) {
      this.logger.error(`MinIO init failed: ${err}`);
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  async uploadAvatar(
    scope: UploadScope,
    file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    if (!this.enabled) {
      throw new BadRequestException('File uploads are not configured');
    }

    if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: png, jpg, webp',
      );
    }
    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException('File too large. Max 5 MB');
    }

    const ext = extname(file.originalname).toLowerCase() || '.png';
    const fileId = randomUUID();
    const key = this.buildKey(scope, `${fileId}${ext}`);

    await this.client.putObject(this.bucket, key, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const url = `${this.publicUrl}/${key}`;
    return { url, key };
  }

  async deleteObject(key: string): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.client.removeObject(this.bucket, key);
    } catch (err) {
      this.logger.warn(`Failed to delete ${key}: ${err}`);
    }
  }

  private buildKey(scope: UploadScope, filename: string): string {
    switch (scope.type) {
      case 'user-avatar':
        return `users/${scope.userId}/avatar/${filename}`;
      case 'team-avatar':
        return `teams/${scope.teamId}/avatar/${filename}`;
      case 'team-asset':
        return `teams/${scope.teamId}/assets/${filename}`;
    }
  }

  private async ensurePublicReadPolicy(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };

    try {
      await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
      this.logger.log(`Applied public-read policy on bucket "${this.bucket}"`);
    } catch (err) {
      this.logger.warn(
        `Could not apply public-read bucket policy for "${this.bucket}": ${err}`,
      );
    }
  }
}
