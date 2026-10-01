import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';
import type { DrizzleDB, MountainImage } from '../db/type.js';
import { DATABASE } from '../db/database.provider.js';
import { mountainImages } from '../db/schema.js';

export type MountainImageInsertValues = InferInsertModel<typeof mountainImages>;

@Injectable()
export class MountainImagesRepository {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async findByMountainId(mountainId: string): Promise<MountainImage[]> {
    return this.db
      .select()
      .from(mountainImages)
      .where(eq(mountainImages.mountainId, mountainId));
  }

  async findOne(id: string): Promise<MountainImage | null> {
    return this.db
      .select()
      .from(mountainImages)
      .where(eq(mountainImages.id, id))
      .then(([row]) => row ?? null);
  }

  async create(values: MountainImageInsertValues): Promise<MountainImage> {
    return this.db
      .insert(mountainImages)
      .values(values)
      .returning()
      .then(([row]) => row);
  }

  async remove(id: string): Promise<MountainImage | null> {
    return this.db
      .delete(mountainImages)
      .where(eq(mountainImages.id, id))
      .returning()
      .then(([row]) => row ?? null);
  }
}
