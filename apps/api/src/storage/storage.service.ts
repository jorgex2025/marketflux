import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID ?? '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  bucket: process.env.R2_BUCKET_NAME ?? 'marketplace-uploads',
  publicUrl: process.env.R2_PUBLIC_URL ?? '',
  region: 'auto',
};

const USE_R2 = !!(R2_CONFIG.accessKeyId && R2_CONFIG.bucket);

type UploadResult = {
  url: string;
  thumbnailUrl: string;
  key: string;
};

@Injectable()
export class StorageService {
  private s3Client: S3Client | null;

  constructor() {
    this.s3Client = USE_R2
      ? new S3Client({
          region: R2_CONFIG.region,
          endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: R2_CONFIG.accessKeyId,
            secretAccessKey: R2_CONFIG.secretAccessKey,
          },
        })
      : null;
  }

  async upload(
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ): Promise<UploadResult> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 5MB`,
      );
    }

    // Optimizar imagen con Sharp
    const optimizedBuffer = await sharp(file.buffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const key = `${createId()}.webp`;
    const thumbKey = `thumbs/${createId()}.webp`;

    // Generar thumbnail
    const thumbBuffer = await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    if (USE_R2 && this.s3Client) {
      // Upload a R2
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: R2_CONFIG.bucket,
          Key: key,
          Body: optimizedBuffer,
          ContentType: 'image/webp',
          CacheControl: 'max-age=31536000',
        }),
      );

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: R2_CONFIG.bucket,
          Key: thumbKey,
          Body: thumbBuffer,
          ContentType: 'image/webp',
          CacheControl: 'max-age=31536000',
        }),
      );

      const baseUrl = R2_CONFIG.publicUrl || `https://pub-${R2_CONFIG.accountId}.r2.dev`;

      return {
        url: `${baseUrl}/${key}`,
        thumbnailUrl: `${baseUrl}/${thumbKey}`,
        key,
      };
    }

    // Fallback: filesystem local (dev)
    const { promises: fs } = await import('fs');
    const { join } = await import('path');
    const uploadDir = join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(join(uploadDir, 'thumbs'), { recursive: true });

    await fs.writeFile(join(uploadDir, key), optimizedBuffer);
    await fs.writeFile(join(uploadDir, thumbKey), thumbBuffer);

    return {
      url: `/api/storage/files/${key}`,
      thumbnailUrl: `/api/storage/files/${thumbKey}`,
      key,
    };
  }

  async delete(key: string): Promise<void> {
    if (USE_R2 && this.s3Client) {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: R2_CONFIG.bucket,
          Key: key,
        }),
      );
      return;
    }

    const { promises: fs } = await import('fs');
    const { join } = await import('path');
    const filePath = join(process.cwd(), 'uploads', key);
    try {
      await fs.unlink(filePath);
    } catch {
      throw new NotFoundException(`Archivo '${key}' no encontrado`);
    }
  }

  async getSignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    if (!USE_R2 || !this.s3Client) {
      throw new BadRequestException('R2 no configurado');
    }

    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!USE_R2 || !this.s3Client) {
      throw new BadRequestException('R2 no configurado');
    }

    const command = new GetObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
