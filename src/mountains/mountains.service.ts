import { Injectable, NotFoundException } from '@nestjs/common';
import { MountainsRepository } from './mountains.repo.js';
import { CreateMountainDto } from './dto/create-mountain.dto.js';
import { UpdateMountainDto } from './dto/update-mountain.dto.js';
import { R2Service } from '../r2/r2.service.js';

export interface MountainListItem {
  id: string;
  name: string;
  elevationM: number | null;
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
        id: row.osmId as string,
        name: row.name,
        elevationM: row.elevationM,
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

  async findOneByOsmId(osmId: string) {
    const result = await this.repo.findOneByOsmId(osmId);

    if (!result) {
      throw new NotFoundException(`Mountain with OSM id #${osmId} not found`);
    }

    const { mountain, photos } = result;

    return {
      id: mountain.osmId,
      name: mountain.name,
      nameVi: mountain.nameVi,
      elevationM: mountain.elevationM,
      lat: mountain.latitude,
      lng: mountain.longitude,
      description: mountain.description,
      difficulty: mountain.difficulty,
      rangeId: mountain.rangeId,
      createdAt: mountain.createdAt,
      updatedAt: mountain.updatedAt,
      photos: photos.map(({ id, storageKey, caption, takenAt, status, createdAt, updatedAt }) => ({
          id,
          storageKey,
          caption,
          takenAt,
          status,
          createdAt,
          updatedAt,
        })),
    };
  }

  async create(createMountainDto: CreateMountainDto) {
    return this.repo.create({
      osmId: createMountainDto.osmId !== undefined ? String(createMountainDto.osmId) : null,
      name: createMountainDto.name,
      slug: createMountainDto.slug,
      nameVi: createMountainDto.nameVi ?? null,
      latitude: createMountainDto.latitude,
      longitude: createMountainDto.longitude,
      elevationM: createMountainDto.elevationM ?? null,
      description: createMountainDto.description ?? null,
    });
  }

  async update(id: string, updateMountainDto: UpdateMountainDto) {
    const existing = await this.findOne(id);

    return this.repo.update(id, {
      osmId: updateMountainDto.osmId !== undefined ? String(updateMountainDto.osmId) : existing.osmId,
      name: updateMountainDto.name ?? existing.name,
      slug: updateMountainDto.slug ?? existing.slug,
      nameVi: updateMountainDto.nameVi ?? existing.nameVi,
      latitude: updateMountainDto.latitude ?? existing.latitude,
      longitude: updateMountainDto.longitude ?? existing.longitude,
      elevationM: updateMountainDto.elevationM ?? existing.elevationM,
      description: updateMountainDto.description ?? existing.description,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.r2Service.deletePrefix(`mountains/${id}/`);

    return this.repo.remove(id);
  }
}
