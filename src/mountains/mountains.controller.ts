import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  Query,
} from '@nestjs/common';
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
  findAll(@Query('id') id?: string) {
    if (id !== undefined) {
      const osmId = Number(id);

      if (!Number.isSafeInteger(osmId)) {
        throw new BadRequestException('The id query parameter must be an integer');
      }

      return this.mountainsService.findOneByOsmId(osmId);
    }

    return this.mountainsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mountainsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMountainDto: UpdateMountainDto,
  ) {
    return this.mountainsService.update(id, updateMountainDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mountainsService.remove(id);
  }
}
