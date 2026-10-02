import { PartialType } from '@nestjs/mapped-types';
import { CreateMountainPhotoDto } from './create-mountain-photo.dto.js';

export class UpdateMountainPhotoDto extends PartialType(CreateMountainPhotoDto) {}
