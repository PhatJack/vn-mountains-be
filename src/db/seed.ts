// scripts/seed-mountains.ts
//
// Chạy:  pnpm tsx --env-file=.env scripts/seed-mountains.ts
// (đường dẫn import bên dưới giả định cấu trúc src/db/index.ts, src/db/schema.ts, src/lib/overpass.ts;
//  hãy chỉnh lại cho khớp với dự án của bạn)
//
// An toàn khi chạy lại nhiều lần: núi đã có (khớp theo osm_id) chỉ được cập nhật toạ độ / độ cao,
// KHÔNG ghi đè tên, mô tả, độ khó... mà bạn hoặc admin đã chỉnh tay.
//
// Bộ lọc: chỉ lấy núi có TÊN TIẾNG VIỆT và KHÔNG TRÙNG TÊN (xem 2 hằng số bên dưới).

import { sql } from 'drizzle-orm';
import {
  fetchOsmPeaks,
  isVietnameseName,
  slugify,
  type OsmPeak,
} from './overpass.js';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { mountains } from './schema.js';

// Mỗi dòng insert dùng ~8 tham số, PostgreSQL giới hạn 65535 tham số mỗi câu lệnh,
// nên chia nhỏ thành từng lô để không bị vượt giới hạn.
const CHUNK_SIZE = 500;

// true  = tên bắt buộc có ít nhất một chữ có dấu tiếng Việt (chặt hơn, nhưng sẽ loại cả
//         các tên dân tộc viết không dấu như "Pu Ta Leng").
// false = chỉ cần tên gồm toàn chữ cái tiếng Việt (không chứa f, j, w, z, chữ Hán, Thái...).
const REQUIRE_DIACRITICS = false;

// "drop-all"     = tên xuất hiện từ 2 lần trở lên thì BỎ TẤT CẢ các núi mang tên đó.
// "keep-highest" = giữ lại một núi cao nhất trong số các núi trùng tên, bỏ phần còn lại.
type DuplicatePolicy = 'drop-all' | 'keep-highest';
const DUPLICATE_POLICY: DuplicatePolicy = 'drop-all';

async function main() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:Admin@123@localhost:5432/vn-mountains',
  });

  const db = drizzle(pool);

  const peaks = await fetchOsmPeaks();
  console.log(`Lấy được ${peaks.length} đỉnh từ OpenStreetMap`);

  // Đỉnh cao hơn xếp trước. Cần thứ tự này cho chính sách "keep-highest" (giữ phần tử đầu tiên).
  peaks.sort((a, b) => (b.elevationM ?? 0) - (a.elevationM ?? 0));

  // Bước 1: chỉ giữ tên tiếng Việt.
  const vietnamese = peaks.filter((p) =>
    isVietnameseName(p.name, REQUIRE_DIACRITICS),
  );
  console.log(
    `Bỏ ${peaks.length - vietnamese.length} đỉnh có tên không phải tiếng Việt`,
  );

  // Dữ liệu đã có trong DB: để tái sử dụng slug cũ và phát hiện trùng tên với núi đã có.
  const existing = await db
    .select({ slug: mountains.slug, osmId: mountains.osmId })
    .from(mountains);
  const slugByOsmId = new Map(
    existing.filter((r) => r.osmId).map((r) => [r.osmId as string, r.slug]),
  );
  const slugsInDb = new Set(existing.map((r) => r.slug));

  // Bước 2: so sánh tên bằng slug thay vì so chuỗi thô, nên "Núi Bà", "núi bà" và "Nui Ba"
  // đều được coi là MỘT tên (không phân biệt hoa/thường và dấu).
  const nameCount = new Map<string, number>();
  for (const p of vietnamese) {
    const key = slugify(p.name);
    nameCount.set(key, (nameCount.get(key) ?? 0) + 1);
  }

  const seenNames = new Set<string>();
  const usedWikidata = new Set<string>(); // wikidata_id là UNIQUE nên không được lặp trong cùng một lần seed
  const rows: (OsmPeak & { slug: string })[] = [];
  let skippedDuplicate = 0;

  for (const p of vietnamese) {
    const key = slugify(p.name);

    const duplicateInBatch =
      DUPLICATE_POLICY === 'drop-all'
        ? (nameCount.get(key) ?? 0) > 1
        : seenNames.has(key);
    seenNames.add(key);

    // Núi mới (chưa có osm_id trong DB) mà tên trùng với một núi khác đã có trong DB thì cũng bỏ.
    const existingSlug = slugByOsmId.get(p.osmId);
    const duplicateInDb = !existingSlug && slugsInDb.has(key);

    if (duplicateInBatch || duplicateInDb) {
      skippedDuplicate++;
      continue;
    }

    // Một số node OSM cùng trỏ về một mục Wikidata: chỉ giữ ở node đầu tiên.
    let wikidataId = p.wikidataId;
    if (wikidataId) {
      if (usedWikidata.has(wikidataId)) wikidataId = null;
      else usedWikidata.add(wikidataId);
    }

    // Vì mọi tên còn lại đều duy nhất nên slug = key luôn duy nhất, không cần hậu tố nữa.
    rows.push({ ...p, slug: existingSlug ?? key, wikidataId });
  }

  console.log(`Bỏ ${skippedDuplicate} đỉnh trùng tên`);
  console.log(`Còn lại ${rows.length} đỉnh để ghi vào DB`);

  let done = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);

    await db
      .insert(mountains)
      .values(chunk) // id (UUID v7), createdAt, updatedAt được điền tự động
      .onConflictDoUpdate({
        target: mountains.osmId, // đã có núi với osm_id này thì UPDATE thay vì lỗi
        set: {
          // `excluded` là dòng mới định insert. Chỉ cập nhật các trường có nguồn gốc từ OSM.
          latitude: sql`excluded.latitude`,
          longitude: sql`excluded.longitude`,
          // coalesce: nếu OSM không có độ cao thì giữ giá trị hiện có thay vì ghi đè bằng null.
          elevationM: sql`coalesce(excluded.elevation_m, ${mountains.elevationM})`,
          wikidataId: sql`coalesce(excluded.wikidata_id, ${mountains.wikidataId})`,
          // $onUpdate của Drizzle không chạy với onConflictDoUpdate nên phải gán tay.
          updatedAt: Date.now(),
        },
      });

    done += chunk.length;
    console.log(`Đã xử lý ${done}/${rows.length}`);
  }

  console.log('Xong.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
