import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';

export interface UploadResult {
  url: string;
  key: string;
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env['R2_ACCESS_KEY_ID'] ?? '',
        secretAccessKey: process.env['R2_SECRET_ACCESS_KEY'] ?? '',
      },
    });
    this.bucket = process.env['R2_BUCKET_NAME'] ?? 'marketplace-uploads';
    this.publicUrl = process.env['R2_PUBLIC_URL'] ?? '';
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    const ext = path.extname(originalName).toLowerCase();
    const key = `uploads/${randomUUID()}${ext}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        `Storage upload failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    return { url: `${this.publicUrl}/${key}`, key };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        `Storage delete failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
