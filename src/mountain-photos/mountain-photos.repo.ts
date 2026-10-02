import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';
import type { DrizzleDB, MountainPhoto } from '../db/type.js';
import { DATABASE } from '../db/database.provider.js';
import { mountainPhotos } from '../db/schema.js';

export type MountainPhotoInsertValues = InferInsertModel<typeof mountainPhotos>;

@Injectable()
export class MountainPhotosRepository {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async findByMountainId(mountainId: string): Promise<MountainPhoto[]> {
    return this.db
      .select()
      .from(mountainPhotos)
      .where(eq(mountainPhotos.mountainId, mountainId));
  }

  async findOne(id: string): Promise<MountainPhoto | null> {
    return this.db
      .select()
      .from(mountainPhotos)
      .where(eq(mountainPhotos.id, id))
      .then(([row]) => row ?? null);
  }

  async create(values: MountainPhotoInsertValues): Promise<MountainPhoto> {
    return this.db
      .insert(mountainPhotos)
      .values(values)
      .returning()
      .then(([row]) => row);
  }

  async remove(id: string): Promise<MountainPhoto | null> {
    return this.db
      .delete(mountainPhotos)
      .where(eq(mountainPhotos.id, id))
      .returning()
      .then(([row]) => row ?? null);
  }
}
