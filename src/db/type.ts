import { InferSelectModel } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { mountainImages, mountains } from './schema.js';
import * as schema from './schema.js';

export type Mountain = InferSelectModel<typeof mountains>;
export type MountainImage = InferSelectModel<typeof mountainImages>;
export type DrizzleDB = NodePgDatabase<typeof schema>;