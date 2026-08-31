import { PartialType } from '@nestjs/mapped-types';
import { CreateMountainImageDto } from './create-mountain-image.dto.js';

export class UpdateMountainImageDto extends PartialType(CreateMountainImageDto) {}
