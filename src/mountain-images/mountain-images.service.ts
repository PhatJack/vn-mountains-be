import { Injectable, NotFoundException } from '@nestjs/common';
import { MountainImagesRepository } from './mountain-images.repo.js';
import { MountainsRepository } from '../mountains/mountains.repo.js';
import { R2Service } from '../r2/r2.service.js';

@Injectable()
export class MountainImagesService {
  constructor(
    private readonly mountainImagesRepo: MountainImagesRepository,
    private readonly mountainsRepo: MountainsRepository,
    private readonly r2Service: R2Service,
  ) {}

  async create(mountainId: string, file: Express.Multer.File) {
    const mountain = await this.mountainsRepo.findOne(mountainId);
    if (!mountain) {
      throw new NotFoundException(`Mountain #${mountainId} not found`);
    }

    const uploaded = await this.r2Service.uploadBuffer(mountainId, file);
    try {
      const image = await this.mountainImagesRepo.create({
        mountainId,
        image: uploaded.url,
        createdAt: Date.now(),
      });
      return this.toResponse(image);
    } catch (error) {
      await this.r2Service.deleteObject(uploaded.key);
      throw error;
    }
  }

  async findAll(mountainId: string) {
    await this.assertMountain(mountainId);
    const images = await this.mountainImagesRepo.findByMountainId(mountainId);
    return images.map((image) => this.toResponse(image));
  }

  async remove(mountainId: string, imageId: string) {
    const image = await this.mountainImagesRepo.findOne(imageId);
    if (!image || image.mountainId !== mountainId) {
      throw new NotFoundException(`Image #${imageId} not found`);
    }

    const removed = await this.mountainImagesRepo.remove(imageId);
    if (removed) {
      await this.r2Service.deleteByUrl(removed.image);
    }
    return { id: imageId };
  }

  private async assertMountain(mountainId: string) {
    const mountain = await this.mountainsRepo.findOne(mountainId);
    if (!mountain) {
      throw new NotFoundException(`Mountain #${mountainId} not found`);
    }
  }

  private toResponse(image: { id: string; image: string; sortOrder: number }) {
    return {
      id: image.id,
      imageUrl: image.image,
      sortOrder: image.sortOrder,
    };
  }
}
