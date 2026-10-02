// src/db/schema.ts

import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from "uuid";
/* -------------------------------------------------------------------------- */
/*  Helpers dùng lại                                                          */
/* -------------------------------------------------------------------------- */

// Khoá chính UUID v7.
// Khác UUID v4 (hoàn toàn ngẫu nhiên), UUID v7 bắt đầu bằng timestamp (mili-giây)
// nên các id sinh ra sau luôn "lớn hơn" id sinh ra trước. Lợi ích:
//   - Insert vào index B-tree gần như nối đuôi, không bị phân mảnh như v4.
//   - Có thể sắp xếp / phân trang cursor theo id (id < lastId) mà vẫn đúng thứ tự thời gian.
// $defaultFn chạy ở phía app mỗi khi insert mà bạn không truyền id.
const pk = () =>
  uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7());

// Thời gian lưu dưới dạng EPOCH MILLISECONDS (số mili-giây tính từ 1970-01-01 UTC),
// ví dụ 1790908091000, giống kết quả của Date.now() trong JavaScript.
//
// Dùng bigint vì số mili-giây hiện tại (13 chữ số) vượt giới hạn của integer 32-bit.
// mode: "number" => Drizzle trả về kiểu number của JS thay vì bigint/string.
// Cách này an toàn vì giá trị còn rất xa giới hạn số nguyên an toàn của JS (~9e15).
const epochMs = (name: string) => bigint(name, { mode: 'number' });

// Giá trị mặc định do chính PostgreSQL tính: giờ hiện tại * 1000, ép về bigint.
// Đặt ở phía DB nên insert bằng SQL thô hay từ service khác cũng tự có createdAt.
const nowMs = sql`(extract(epoch from now()) * 1000)::bigint`;

// createdAt / updatedAt dùng chung cho nhiều bảng.
// $onUpdate: Drizzle tự gán lại updatedAt = Date.now() khi bạn gọi db.update()
// (chạy ở phía app, không phải trigger trong DB, nên update bằng SQL thô sẽ không tự cập nhật).
const timestamps = {
  createdAt: epochMs('created_at').default(nowMs).notNull(),
  updatedAt: epochMs('updated_at')
    .default(nowMs)
    .$onUpdate(() => Date.now())
    .notNull(),
};

/* -------------------------------------------------------------------------- */
/*  Enums                                                                     */
/* -------------------------------------------------------------------------- */

export const difficultyEnum = pgEnum('difficulty', [
  'easy',
  'moderate',
  'hard',
  'extreme',
]);

// Trạng thái kiểm duyệt ảnh người dùng upload.
// Chỉ hiển thị công khai những ảnh "approved".
export const photoStatusEnum = pgEnum('photo_status', [
  'pending',
  'approved',
  'rejected',
]);

// Trạng thái xử lý yêu cầu thêm núi mới.
// "duplicate" = núi đã có sẵn trong DB (lúc đó mountainId trỏ tới núi đã tồn tại).
export const requestStatusEnum = pgEnum('request_status', [
  'pending',
  'approved',
  'rejected',
  'duplicate',
]);

/* -------------------------------------------------------------------------- */
/*  Dãy núi & tỉnh                                                            */
/* -------------------------------------------------------------------------- */
export const mountainRanges = pgTable('mountain_ranges', {
  id: pk(),
  name: text('name').notNull().unique(), // "Hoàng Liên Sơn", "Trường Sơn"...
});

// Tỉnh là bảng riêng (không lưu chuỗi trong bảng núi) vì danh sách đơn vị hành chính
// có thể thay đổi (sáp nhập, đổi tên): chỉ cần sửa một chỗ.
export const provinces = pgTable('provinces', {
  id: pk(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: text('name').notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Núi                                                                       */
/* -------------------------------------------------------------------------- */

export const mountains = pgTable(
  'mountains',
  {
    id: pk(),

    // slug dùng cho URL thân thiện: /mountains/fansipan
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    nameVi: text('name_vi'), // tên tiếng Việt nếu khác tên chính, ví dụ "Phan Xi Păng"

    elevationM: integer('elevation_m'), // độ cao, đơn vị mét; null nếu chưa rõ

    // Toạ độ WGS84 (chuẩn GPS, cũng là chuẩn MapLibre dùng).
    // Lưu ý thứ tự: MapLibre/GeoJSON dùng [longitude, latitude], còn người ta hay nói "lat, lng".
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),

    description: text('description'),
    difficulty: difficultyEnum('difficulty'),

    // Nếu xoá dãy núi thì chỉ gỡ liên kết (set null), không xoá núi.
    rangeId: uuid('range_id').references(() => mountainRanges.id, {
      onDelete: 'set null',
    }),

    // Id ở nguồn dữ liệu bên ngoài, để đối chiếu / cập nhật lại sau này mà không tạo trùng.
    // OSM id là số rất lớn nên lưu dạng text cho an toàn (tránh tràn số trong JS).
    osmId: text('osm_id').unique(),
    wikidataId: text('wikidata_id').unique(), // dạng "Q12345"

    ...timestamps,
  },
  (t) => [
    // Index cho truy vấn theo vùng bản đồ (lọc theo khung lat/lng đang hiển thị).
    index('mountains_coords_idx').on(t.latitude, t.longitude),
    index('mountains_elevation_idx').on(t.elevationM),

    // Index trigram để tìm tên gần giống / gõ sai chính tả (dùng với similarity() hoặc ILIKE '%...%').
    // YÊU CẦU: migration phải chạy trước dòng:  CREATE EXTENSION IF NOT EXISTS pg_trgm;
    index('mountains_name_trgm_idx').using('gin', t.name.op('gin_trgm_ops')),

    // Ràng buộc ở tầng DB: chặn dữ liệu rác ngay cả khi code app có lỗi.
    check('mountains_lat_check', sql`${t.latitude} BETWEEN -90 AND 90`),
    check('mountains_lng_check', sql`${t.longitude} BETWEEN -180 AND 180`),
    check(
      'mountains_elevation_check',
      sql`${t.elevationM} IS NULL OR ${t.elevationM} > 0`,
    ),
  ],
);

// Bảng nối nhiều-nhiều: một ngọn núi có thể nằm giữa ranh giới nhiều tỉnh,
// và một tỉnh dĩ nhiên có nhiều núi.
export const mountainProvinces = pgTable(
  'mountain_provinces',
  {
    mountainId: uuid('mountain_id')
      .notNull()
      .references(() => mountains.id, { onDelete: 'cascade' }), // xoá núi => xoá liên kết
    provinceId: uuid('province_id')
      .notNull()
      .references(() => provinces.id, { onDelete: 'restrict' }), // không cho xoá tỉnh còn núi
  },
  // Khoá chính kép: mỗi cặp (núi, tỉnh) chỉ xuất hiện một lần.
  (t) => [primaryKey({ columns: [t.mountainId, t.provinceId] })],
);

/* -------------------------------------------------------------------------- */
/*  Ảnh do người dùng upload                                                  */
/* -------------------------------------------------------------------------- */

export const mountainPhotos = pgTable(
  'mountain_photos',
  {
    id: pk(),

    mountainId: uuid('mountain_id')
      .notNull()
      .references(() => mountains.id, { onDelete: 'cascade' }),

    // Id người dùng từ hệ thống auth của bạn.
    // Đang để text vì nhiều thư viện auth (Better Auth, Auth.js...) dùng id dạng chuỗi.
    // Khi đã có bảng users, đổi thành: uuid("user_id").references(() => users.id)
    // * userId: uuid('user_id').notNull(),

    // Chỉ lưu KEY của file trong bucket (vd "photos/2026/10/0198...webp"), KHÔNG lưu URL đầy đủ.
    // URL được dựng lúc đọc: `${STORAGE_PUBLIC_URL}/${storageKey}`.
    storageKey: text('storage_key').notNull().unique(),

    caption: text('caption'),
    takenAt: timestamp('taken_at', { withTimezone: true }), // ngày chụp (nếu biết)

    status: photoStatusEnum('status').default('pending').notNull(),

    ...timestamps,
  },
  (t) => [
    // Truy vấn chính: "lấy ảnh đã duyệt của núi X, mới nhất trước".
    index('photos_mountain_status_idx').on(t.mountainId, t.status),
    // * index('photos_user_idx').on(t.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Yêu cầu thêm núi mới                                                      */
/* -------------------------------------------------------------------------- */

export const mountainRequests = pgTable(
  'mountain_requests',
  {
    id: pk(),
    // * userId: uuid('user_id').notNull(), // người gửi yêu cầu

    // Các trường dưới đây chỉ là GỢI Ý từ người dùng, admin sẽ chỉnh lại khi duyệt.
    name: text('name').notNull(),
    latitude: doublePrecision('latitude'), // nullable: không phải ai cũng biết toạ độ
    longitude: doublePrecision('longitude'),
    elevationM: integer('elevation_m'),
    provinceId: uuid('province_id').references(() => provinces.id, {
      onDelete: 'set null',
    }),
    note: text('note'), // mô tả, link nguồn tham khảo

    status: requestStatusEnum('status').default('pending').notNull(),
    rejectReason: text('reject_reason'),

    // Khi duyệt: trỏ tới núi vừa tạo (approved) hoặc núi đã có sẵn (duplicate).
    // Dùng set null để xoá núi không làm mất lịch sử yêu cầu.
    mountainId: uuid('mountain_id').references(() => mountains.id, {
      onDelete: 'set null',
    }),
    // * reviewedBy: uuid('reviewed_by'), // id admin duyệt
    // * reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

    ...timestamps,
  },
  (t) => [
    // Trang admin: "danh sách yêu cầu đang chờ, cũ nhất trước".
    index('requests_status_idx').on(t.status, t.createdAt),
    // * index('requests_user_idx').on(t.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Relations (chỉ dùng cho db.query.* với `with: {...}`; không tạo FK trong DB) */
/* -------------------------------------------------------------------------- */

export const mountainRangesRelations = relations(
  mountainRanges,
  ({ many }) => ({
    mountains: many(mountains),
  }),
);

export const provincesRelations = relations(provinces, ({ many }) => ({
  mountains: many(mountainProvinces),
}));

export const mountainsRelations = relations(mountains, ({ one, many }) => ({
  range: one(mountainRanges, {
    fields: [mountains.rangeId],
    references: [mountainRanges.id],
  }),
  provinces: many(mountainProvinces),
  photos: many(mountainPhotos),
  requests: many(mountainRequests),
}));

export const mountainProvincesRelations = relations(
  mountainProvinces,
  ({ one }) => ({
    mountain: one(mountains, {
      fields: [mountainProvinces.mountainId],
      references: [mountains.id],
    }),
    province: one(provinces, {
      fields: [mountainProvinces.provinceId],
      references: [provinces.id],
    }),
  }),
);

export const mountainPhotosRelations = relations(mountainPhotos, ({ one }) => ({
  mountain: one(mountains, {
    fields: [mountainPhotos.mountainId],
    references: [mountains.id],
  }),
}));

export const mountainRequestsRelations = relations(
  mountainRequests,
  ({ one }) => ({
    mountain: one(mountains, {
      fields: [mountainRequests.mountainId],
      references: [mountains.id],
    }),
    province: one(provinces, {
      fields: [mountainRequests.provinceId],
      references: [provinces.id],
    }),
  }),
);

/* -------------------------------------------------------------------------- */
/*  Types suy ra từ schema                                                    */
/* -------------------------------------------------------------------------- */

export type Mountain = typeof mountains.$inferSelect; // dữ liệu đọc từ DB
export type NewMountain = typeof mountains.$inferInsert; // dữ liệu khi insert (id, timestamps tuỳ chọn)
export type MountainPhoto = typeof mountainPhotos.$inferSelect;
export type NewMountainPhoto = typeof mountainPhotos.$inferInsert;
export type MountainRequest = typeof mountainRequests.$inferSelect;
export type NewMountainRequest = typeof mountainRequests.$inferInsert;
