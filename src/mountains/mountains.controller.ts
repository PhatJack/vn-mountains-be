import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MountainsService } from './mountains.service.js';
import { CreateMountainDto } from './dto/create-mountain.dto.js';
import { UpdateMountainDto } from './dto/update-mountain.dto.js';

@Controller('mountains')
export class MountainsController {
  constructor(private readonly mountainsService: MountainsService) {}

  @Post()
  create(@Body() createMountainDto: CreateMountainDto) {
    return this.mountainsService.create(createMountainDto);
  }

  @Get()
  findAll() {
    return this.mountainsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mountainsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMountainDto: UpdateMountainDto) {
    return this.mountainsService.update(+id, updateMountainDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mountainsService.remove(+id);
  }
}
