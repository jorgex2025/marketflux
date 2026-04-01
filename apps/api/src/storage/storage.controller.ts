import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ data: { url: string; key: string } }> {
    if (!file) throw new BadRequestException('No file provided');
    const result = await this.storage.upload(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return { data: result };
  }

  @Delete(':key(*)')
  async remove(@Param('key') key: string): Promise<{ data: { deleted: true } }> {
    await this.storage.delete(key);
    return { data: { deleted: true } };
  }
}
