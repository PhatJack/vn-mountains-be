import { InferSelectModel } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { mountainPhotos, mountains } from './schema.js';
import * as schema from './schema.js';

export type Mountain = InferSelectModel<typeof mountains>;
export type MountainPhoto = InferSelectModel<typeof mountainPhotos>;
export type DrizzleDB = NodePgDatabase<typeof schema>;
