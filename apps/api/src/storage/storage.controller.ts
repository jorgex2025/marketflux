import {
  Controller, Post, Delete, Get, Param,
  UploadedFile, UseInterceptors, HttpCode, HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StorageService } from './storage.service';
import { join } from 'path';
import { promises as fs } from 'fs';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.storageService.upload({
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    });
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('key') key: string) {
    return this.storageService.delete(key);
  }

  @Get('files/:key')
  async serveFile(@Param('key') key: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', key);
    try {
      const buffer = await fs.readFile(filePath);
      const ext = key.split('.').pop();
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };
      res.set({ 'Content-Type': mimeTypes[ext ?? ''] ?? 'application/octet-stream' });
      res.send(buffer);
    } catch {
      res.status(404).json({ error: 'File not found' });
    }
  }
}
