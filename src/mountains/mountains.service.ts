import { Injectable, NotFoundException } from '@nestjs/common';
import { MountainsRepository } from './mountains.repo.js';
import { CreateMountainDto } from './dto/create-mountain.dto.js';
import { UpdateMountainDto } from './dto/update-mountain.dto.js';

export interface MountainListItem {
  id: number;
  name: string;
  elevation: number | null;
  lat: number;
  lng: number;
}

@Injectable()
export class MountainsService {
  constructor(private readonly repo: MountainsRepository) {}

  async findAll(): Promise<MountainListItem[]> {
    const rows = await this.repo.findAll();

    return rows
      .filter((row) => row.osmId !== null)
      .map((row) => ({
        id: row.osmId as number,
        name: row.name,
        elevation: row.elevation,
        lat: row.latitude,
        lng: row.longitude,
      }));
  }

  async findOne(id: string) {
    const row = await this.repo.findOne(id);

    if (!row) {
      throw new NotFoundException(`Mountain #${id} not found`);
    }

    return row;
  }

  async create(createMountainDto: CreateMountainDto) {
    return this.repo.create({
      osmId: createMountainDto.osmId ?? null,
      name: createMountainDto.name,
      nameAscii: createMountainDto.nameAscii ?? null,
      altName: createMountainDto.altName ?? null,
      latitude: createMountainDto.latitude,
      longitude: createMountainDto.longitude,
      elevation: createMountainDto.elevation ?? null,
      province: createMountainDto.province ?? null,
      description: createMountainDto.description ?? null,
      imageUrl: createMountainDto.imageUrl ?? null,
      createdAt: Date.now(),
      updatedAt: null,
    });
  }

  async update(id: string, updateMountainDto: UpdateMountainDto) {
    const existing = await this.findOne(id);

    return this.repo.update(id, {
      osmId: updateMountainDto.osmId ?? existing.osmId,
      name: updateMountainDto.name ?? existing.name,
      nameAscii: updateMountainDto.nameAscii ?? existing.nameAscii,
      altName: updateMountainDto.altName ?? existing.altName,
      latitude: updateMountainDto.latitude ?? existing.latitude,
      longitude: updateMountainDto.longitude ?? existing.longitude,
      elevation: updateMountainDto.elevation ?? existing.elevation,
      province: updateMountainDto.province ?? existing.province,
      description: updateMountainDto.description ?? existing.description,
      imageUrl: updateMountainDto.imageUrl ?? existing.imageUrl,
      updatedAt: Date.now(),
      updatedBy: 'admin',
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.repo.remove(id);
  }
}