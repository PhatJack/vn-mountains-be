import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
// src/lib/overpass.ts
//
// Lấy các đỉnh núi của Việt Nam từ OpenStreetMap (qua Overpass API) và chuẩn hoá
// thành dạng gần với bảng `mountains`. File này CHỈ gọi API, không đụng tới DB.
// Dữ liệu OSM theo giấy phép ODbL: nhớ ghi nguồn "© OpenStreetMap contributors" trên bản đồ.

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

// Lọc theo RANH GIỚI QUỐC GIA thay vì bounding box:
//  - `area["ISO3166-1"="VN"]` chọn vùng lãnh thổ Việt Nam.
//  - Bounding box là hình chữ nhật nên sẽ lẫn cả núi của Lào, Trung Quốc, Campuchia,
//    đồng thời bỏ sót nhiều vùng (Ngọc Linh, Bạch Mã, Đông Bắc, Pù Luông...).
//  - `["name"]` bỏ các đỉnh không có tên: cột `name` bắt buộc có và `slug` sinh từ tên.
const QUERY = `[out:json][timeout:180];
area["ISO3166-1"="VN"][admin_level=2]->.vn;
node["natural"="peak"]["name"](area.vn);
out body;`;

interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Một đỉnh núi sau khi chuẩn hoá. Chưa có `slug` (slug cần biết dữ liệu đã có trong DB nên sinh ở bước seed).
export interface OsmPeak {
  osmId: string; // id của node OSM, lưu dạng text (khớp cột mountains.osm_id)
  name: string;
  nameVi: string | null;
  elevationM: number | null;
  latitude: number;
  longitude: number;
  wikidataId: string | null;
}

// Độ cao trong OSM là chuỗi tự do ("3143", "3143.1", "3143 m"...).
// Cột DB là integer và có check > 0, nên làm tròn và loại giá trị vô lý.
// Đỉnh cao nhất Việt Nam là Fansipan (3143 m), chặn trên 3500 để bắt lỗi gõ nhầm như "31430".
function parseElevation(ele?: string): number | null {
  if (!ele) return null;
  const n = Math.round(parseFloat(ele)); // parseFloat tự bỏ phần đuôi như " m"
  return Number.isFinite(n) && n > 0 && n <= 3500 ? n : null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchOsmPeaks(maxAttempts = 3): Promise<OsmPeak[]> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Overpass khuyến khích khai báo User-Agent để họ biết ai đang gọi.
        'User-Agent': 'vn-mountains-seed/1.0',
      },
      body: `data=${encodeURIComponent(QUERY)}`,
    });

    if (response.ok) {
      const data: OverpassResponse = await response.json();

      // Lưu raw response để dùng lại khi seed/debug mà không cần gọi Overpass lần nữa.
      const outputDir = path.resolve(process.cwd(), 'src/constants/overpass');

      await mkdir(outputDir, { recursive: true });

      const now = new Date();
      const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join('-');

      const filePath = path.join(outputDir, `data-${timestamp}.json`);

      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

      return data.elements
        .filter(
          (el) => el.lat !== undefined && el.lon !== undefined && el.tags?.name,
        )
        .map((el) => ({
          osmId: String(el.id),

          // Ưu tiên tag name:vi (tên tiếng Việt do cộng đồng OSM ghi rõ),
          // không có thì dùng name.
          // normalize("NFC") đưa chữ có dấu về một dạng chuẩn duy nhất,
          // vì OSM đôi khi lưu dấu ở dạng tách rời.
          name: (el.tags!['name:vi'] ?? el.tags!.name).normalize('NFC').trim(),

          nameVi: el.tags?.['name:vi']?.normalize('NFC').trim() ?? null,

          elevationM: parseElevation(el.tags?.ele),

          latitude: el.lat,
          longitude: el.lon,

          wikidataId: el.tags?.wikidata ?? null,
        }));
    }

    // Overpass công cộng hay trả 429 (quá tải) / 504 (hết thời gian):
    // thử lại có chờ.
    const retryable = [429, 502, 503, 504].includes(response.status);

    if (!retryable || attempt >= maxAttempts) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    await sleep(attempt * 10_000);
  }
}

// "Phan Xi Păng" -> "phan-xi-pang". Dùng cho cột mountains.slug.
export function slugify(input: string): string {
  return input
    .normalize('NFD') // tách dấu ra khỏi chữ cái
    .replace(/[\u0300-\u036f]/g, '') // bỏ các dấu
    .replace(/đ/gi, 'd') // đ/Đ không tách được bằng NFD nên xử lý riêng
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* -------------------------------------------------------------------------- */
/*  Kiểm tra "tên tiếng Việt"                                                 */
/* -------------------------------------------------------------------------- */

// Bảng chữ cái tiếng Việt (chữ thường, đã gồm các chữ có dấu).
// Cố ý KHÔNG có f, j, w, z: tiếng Việt không dùng các chữ này, nên tên chứa chúng (Fansipan, Jungle...)
// thường là tên phiên âm / tiếng nước ngoài. Chữ Hán, Thái, Lào, Cyrillic... cũng bị loại vì không nằm trong tập này.
const VI_LETTERS =
  'aàáảãạăằắẳẵặâầấẩẫậbcdđeèéẻẽẹêềếểễệghiìíỉĩịklmnoòóỏõọôồốổỗộơờớởỡợpqrstuùúủũụưừứửữựvxyỳýỷỹỵ';

// Chỉ cho phép: chữ cái tiếng Việt, khoảng trắng, dấu chấm, nháy đơn, gạch nối.
// Cờ `i` bỏ qua hoa/thường, cờ `u` bật chế độ Unicode.
const VI_NAME_RE = new RegExp(`^[${VI_LETTERS}\\s.'’-]+$`, 'iu');

// Các chữ có dấu đặc trưng của tiếng Việt (ă â đ ê ô ơ ư và các dấu thanh).
const VI_DIACRITIC_RE =
  /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/iu;

// Từ tiếng Anh hay gặp trong tên núi. Chúng chỉ gồm chữ cái hợp lệ nên regex trên không bắt được.
const ENGLISH_WORDS_RE =
  /\b(mount|mountain|mt|peak|hill|ridge|cliff|rock|summit)\b/i;

// requireDiacritics = true: bắt buộc tên có ít nhất một chữ có dấu tiếng Việt.
//   Chặt hơn (loại thêm các tên không dấu như "Big Hill"), nhưng cũng loại luôn các tên dân tộc
//   thật sự của Việt Nam viết không dấu như "Pu Ta Leng", "Pu Si Lung".
export function isVietnameseName(
  name: string,
  requireDiacritics = false,
): boolean {
  const n = name.normalize('NFC').trim();
  if (n.length < 2) return false;
  if (!VI_NAME_RE.test(n)) return false;
  if (!slugify(n)) return false; // tên chỉ toàn dấu câu
  if (ENGLISH_WORDS_RE.test(n)) return false;
  if (requireDiacritics && !VI_DIACRITIC_RE.test(n)) return false;
  return true;
}
