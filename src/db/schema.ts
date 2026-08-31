import {
  bigint,
  doublePrecision,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const mountains = pgTable('mountains', {
  id: uuid().defaultRandom().primaryKey(),
  osmId: bigint('osm_id', {
    mode: 'number',
  }).unique(),
  name: varchar('name', {
    length: 250,
  }).notNull(),
  nameAscii: varchar('name_ascii', {
    length: 250,
  }),
  altName: varchar('alt_name', {
    length: 250,
  }),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  elevation: doublePrecision('elevation'),
  province: varchar('province', {
    length: 100,
  }),
  description: text('description'),
  imageUrl: text('image_url'),
  createdAt: bigint('created_at', {
    mode: 'number',
  }).notNull(),
  createdBy: text('created_by').notNull().default('admin'),
  updatedAt: bigint('created_at', {
    mode: 'number',
  }),
  updatedBy: text('updated_by'),
});

export const mountainImages = pgTable('mountain_images', {
  id: uuid().defaultRandom().primaryKey(),
  mountainId: uuid('mountain_id')
    .notNull()
    .references(() => mountains.id, {
      onDelete: 'cascade',
    }),
  imageUrl: text('image_url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: bigint('created_at', {
    mode: 'number',
  }).notNull(),
  createdBy: text('created_by').notNull().default('admin'),
  updatedAt: bigint('created_at', {
    mode: 'number',
  }),
  updatedBy: text('updated_by'),
});
