import {
	BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { R2Service } from './r2.service.js';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('images')
export class ImageController {
  constructor(private readonly r2Service: R2Service) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // Keep file in memory, do not write to disk
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    const url = await this.r2Service.uploadBuffer(file);
    return {
      url,
    };
  }
}
