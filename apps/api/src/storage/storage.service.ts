import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { promises as fs } from 'fs';
import { join } from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = join(process.cwd(), 'uploads');

type UploadResult = {
  url: string;
  thumbnailUrl: string;
  key: string;
};

@Injectable()
export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = UPLOAD_DIR;
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      // Directorio ya existe
    }
  }

  async upload(
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ): Promise<UploadResult> {
    // Validar tipo
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 5MB`,
      );
    }

    const ext = this.getExtension(file.mimetype);
    const key = `${createId()}.${ext}`;
    const filePath = join(this.uploadDir, key);

    // Guardar archivo
    await fs.writeFile(filePath, file.buffer);

    // Thumbnail (mismo archivo hasta que sharp esté disponible)
    const thumbKey = `thumb_${key}`;
    const thumbPath = join(this.uploadDir, thumbKey);
    await fs.writeFile(thumbPath, file.buffer);

    const baseUrl = `/api/storage/files`;

    return {
      url: `${baseUrl}/${key}`,
      thumbnailUrl: `${baseUrl}/${thumbKey}`,
      key,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    } catch {
      throw new NotFoundException(`Archivo '${key}' no encontrado`);
    }
  }

  async getUrl(key: string): Promise<string> {
    const filePath = join(this.uploadDir, key);
    try {
      await fs.access(filePath);
      return `/api/storage/files/${key}`;
    } catch {
      throw new NotFoundException(`Archivo '${key}' no encontrado`);
    }
  }

  private getExtension(mimetype: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return map[mimetype] ?? 'bin';
  }
}
