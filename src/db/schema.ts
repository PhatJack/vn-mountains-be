import {
  bigint,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const mountains = pgTable(
  'mountains',
  {
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
    tags: jsonb('tags'),
    createdAt: bigint('created_at', {
      mode: 'number',
    }).notNull(),
    createdBy: text('created_by').notNull().default('admin'),
    updatedAt: bigint('updated_at', {
      mode: 'number',
    }),
    updatedBy: text('updated_by'),
  },
  (table) => [
    index('mountains_latitude_longitude_idx').on(
      table.latitude,
      table.longitude,
    ),
  ],
);

export const mountainImageStatus = pgEnum('mountain_image_status', [
  'pending',
  'approved',
  'rejected',
]);

export const mountainImageSubmitterRole = pgEnum(
  'mountain_image_submitter_role',
  ['anonymous', 'user', 'admin'],
);

export const mountainImages = pgTable('mountain_images', {
  id: uuid().defaultRandom().primaryKey(),

  mountainId: uuid('mountain_id')
    .notNull()
    .references(() => mountains.id, {
      onDelete: 'cascade',
    }),

  image: text('image').notNull(),

  status: mountainImageStatus('status').notNull().default('approved'),

  rejectionReason: text('rejection_reason'),

  // Information about the person submitting the image
  submittedName: text('submitted_name'),

  submittedAt: bigint('submitted_at', {
    mode: 'number',
  }).notNull(),

  // Audit information
  createdAt: bigint('created_at', {
    mode: 'number',
  }).notNull(),

  createdBy: text('created_by').notNull().default('admin'),

  updatedAt: bigint('updated_at', {
    mode: 'number',
  }),

  updatedBy: text('updated_by'),

  sortOrder: integer('sort_order').notNull().default(0),
});
