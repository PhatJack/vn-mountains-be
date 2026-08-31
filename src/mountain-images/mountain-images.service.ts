import { Injectable } from '@nestjs/common';
import { CreateMountainImageDto } from './dto/create-mountain-image.dto.js';
import { UpdateMountainImageDto } from './dto/update-mountain-image.dto.js';

@Injectable()
export class MountainImagesService {
  create(createMountainImageDto: CreateMountainImageDto) {
    return 'This action adds a new mountainImage';
  }

  findAll() {
    return `This action returns all mountainImages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mountainImage`;
  }

  update(id: number, updateMountainImageDto: UpdateMountainImageDto) {
    return `This action updates a #${id} mountainImage`;
  }

  remove(id: number) {
    return `This action removes a #${id} mountainImage`;
  }
}
