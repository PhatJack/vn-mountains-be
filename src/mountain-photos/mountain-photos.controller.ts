import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MountainPhotosService } from './mountain-photos.service.js';
import { CreateMountainPhotoDto } from './dto/create-mountain-photo.dto.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

@Controller('mountains/:mountainId/images')
export class MountainPhotosController {
  constructor(private readonly mountainPhotosService: MountainPhotosService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        const accepted = ALLOWED_MIME_TYPES.has(file.mimetype);
        cb(
          accepted ? null : new BadRequestException('Only image files are allowed'),
          accepted,
        );
      },
    }),
  )
  create(
    @Param('mountainId', new ParseUUIDPipe()) mountainId: string,
    @Body() dto: CreateMountainPhotoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('An image file is required');
    }
    return this.mountainPhotosService.create(mountainId, file, dto);
  }

  @Get()
  findAll(@Param('mountainId', new ParseUUIDPipe()) mountainId: string) {
    return this.mountainPhotosService.findAll(mountainId);
  }

  @Delete(':id')
  remove(
    @Param('mountainId', new ParseUUIDPipe()) mountainId: string,
    @Param('id', new ParseUUIDPipe()) imageId: string,
  ) {
    return this.mountainPhotosService.remove(mountainId, imageId);
  }
}
