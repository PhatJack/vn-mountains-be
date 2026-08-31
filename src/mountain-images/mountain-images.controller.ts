import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MountainImagesService } from './mountain-images.service.js';
import { CreateMountainImageDto } from './dto/create-mountain-image.dto.js';
import { UpdateMountainImageDto } from './dto/update-mountain-image.dto.js';

@Controller('mountain-images')
export class MountainImagesController {
  constructor(private readonly mountainImagesService: MountainImagesService) {}

  @Post()
  create(@Body() createMountainImageDto: CreateMountainImageDto) {
    return this.mountainImagesService.create(createMountainImageDto);
  }

  @Get()
  findAll() {
    return this.mountainImagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mountainImagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMountainImageDto: UpdateMountainImageDto) {
    return this.mountainImagesService.update(+id, updateMountainImageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mountainImagesService.remove(+id);
  }
}
