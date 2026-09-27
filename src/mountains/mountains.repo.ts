import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';
import type { DrizzleDB, Mountain } from '../db/type.js';
import { DATABASE } from '../db/database.provider.js';
import { mountainImages, mountains } from '../db/schema.js';

export interface MountainListRow {
  osmId: number | null;
  name: string;
  elevation: number | null;
  latitude: number;
  longitude: number;
}

export type MountainInsertValues = InferInsertModel<typeof mountains>;
export type MountainUpdateValues = Partial<MountainInsertValues>;

@Injectable()
export class MountainsRepository {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  findAll(): Promise<MountainListRow[]> {
    return this.db
      .select({
        osmId: mountains.osmId,
        name: mountains.name,
        elevation: mountains.elevation,
        latitude: mountains.latitude,
        longitude: mountains.longitude,
      })
      .from(mountains)
      .orderBy(sql`elevation desc nulls last`);
  }

  async findOne(id: string): Promise<Mountain | null> {
    const [row] = await this.db
      .select()
      .from(mountains)
      .where(eq(mountains.id, id));
    return row ?? null;
  }

  async findOneByOsmId(osmId: number) {
    const rows = await this.db
      .select({ mountain: mountains, image: mountainImages })
      .from(mountains)
      .leftJoin(mountainImages, eq(mountainImages.mountainId, mountains.id))
      .where(eq(mountains.osmId, osmId));

    if (!rows.length) return null;

    return {
      mountain: rows[0].mountain,
      images: rows.flatMap(({ image }) => (image ? [image] : [])),
    };
  }

  create(values: MountainInsertValues): Promise<Mountain> {
    return this.db.insert(mountains).values(values).returning().then(([row]) => row);
  }

  async update(
    id: string,
    values: MountainUpdateValues,
  ): Promise<Mountain | null> {
    const [row] = await this.db
      .update(mountains)
      .set(values)
      .where(eq(mountains.id, id))
      .returning();
    return row ?? null;
  }

  async remove(id: string): Promise<Mountain | null> {
    const [row] = await this.db
      .delete(mountains)
      .where(eq(mountains.id, id))
      .returning();
    return row ?? null;
  }
}
