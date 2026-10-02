import { Injectable, NotFoundException } from '@nestjs/common';
import { MountainPhotosRepository } from './mountain-photos.repo.js';
import { MountainsRepository } from '../mountains/mountains.repo.js';
import { R2Service } from '../r2/r2.service.js';
import { CreateMountainPhotoDto } from './dto/create-mountain-photo.dto.js';

@Injectable()
export class MountainPhotosService {
  constructor(
    private readonly mountainPhotosRepo: MountainPhotosRepository,
    private readonly mountainsRepo: MountainsRepository,
    private readonly r2Service: R2Service,
  ) {}

  async create(
    mountainId: string,
    file: Express.Multer.File,
    dto: CreateMountainPhotoDto = {},
  ) {
    const mountain = await this.mountainsRepo.findOne(mountainId);
    if (!mountain) {
      throw new NotFoundException(`Mountain #${mountainId} not found`);
    }

    const uploaded = await this.r2Service.uploadBuffer(mountainId, file);
    try {
      const photo = await this.mountainPhotosRepo.create({
        mountainId,
        storageKey: uploaded.key,
        caption: this.normalizeCaption(dto.caption),
        takenAt: dto.takenAt ? new Date(dto.takenAt) : null,
        status: 'approved',
      });
      return this.toResponse(photo);
    } catch (error) {
      await this.r2Service.deleteObject(uploaded.key);
      throw error;
    }
  }

  async findAll(mountainId: string) {
    await this.assertMountain(mountainId);
    const photos = await this.mountainPhotosRepo.findByMountainId(mountainId);
    return photos.map((photo) => this.toResponse(photo));
  }

  async remove(mountainId: string, imageId: string) {
    const photo = await this.mountainPhotosRepo.findOne(imageId);
    if (!photo || photo.mountainId !== mountainId) {
      throw new NotFoundException(`Image #${imageId} not found`);
    }

    const removed = await this.mountainPhotosRepo.remove(imageId);
    if (removed) {
      await this.r2Service.deleteObject(removed.storageKey);
    }
    return { id: imageId };
  }

  private async assertMountain(mountainId: string) {
    const mountain = await this.mountainsRepo.findOne(mountainId);
    if (!mountain) {
      throw new NotFoundException(`Mountain #${mountainId} not found`);
    }
  }

  private toResponse(photo: {
    id: string;
    storageKey: string;
    caption: string | null;
    takenAt: Date | null;
    status: string;
    createdAt: number;
    updatedAt: number;
  }) {
    return {
      id: photo.id,
      storageKey: photo.storageKey,
      caption: photo.caption,
      takenAt: photo.takenAt,
      status: photo.status,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
    };
  }

  private normalizeCaption(caption?: string) {
    const normalized = caption?.trim();
    return normalized || null;
  }
}
