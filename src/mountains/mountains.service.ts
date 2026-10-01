import { Injectable, NotFoundException } from '@nestjs/common';
import { MountainsRepository } from './mountains.repo.js';
import { CreateMountainDto } from './dto/create-mountain.dto.js';
import { UpdateMountainDto } from './dto/update-mountain.dto.js';
import { R2Service } from '../r2/r2.service.js';

export interface MountainListItem {
  id: number;
  name: string;
  elevation: number | null;
  lat: number;
  lng: number;
}

@Injectable()
export class MountainsService {
  constructor(
    private readonly repo: MountainsRepository,
    private readonly r2Service: R2Service,
  ) {}

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

  async findOneByOsmId(osmId: number) {
    const result = await this.repo.findOneByOsmId(osmId);

    if (!result) {
      throw new NotFoundException(`Mountain with OSM id #${osmId} not found`);
    }

    const { mountain, images } = result;

    return {
      id: mountain.osmId,
      name: mountain.name,
      nameAscii: mountain.nameAscii,
      altName: mountain.altName,
      elevation: mountain.elevation,
      lat: mountain.latitude,
      lng: mountain.longitude,
      province: mountain.province,
      description: mountain.description,
      imageUrl: mountain.imageUrl,
      tags: mountain.tags,
      createdAt: mountain.createdAt,
      updatedAt: mountain.updatedAt,
      images: images
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ id, image, sortOrder }) => ({
          id,
          imageUrl: image,
          sortOrder,
        })),
    };
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
    await this.r2Service.deletePrefix(`mountains/${id}/`);

    return this.repo.remove(id);
  }
}
