import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import removeAccents from 'remove-accents';
import { sql } from 'drizzle-orm';
import { mountains } from './schema.js';

interface OverpassNode {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

function loadData(filename: string): OverpassNode[] {
  return JSON.parse(
    readFileSync(
      join(import.meta.dirname, '..', 'constant', filename),
      'utf-8',
    ),
  );
}

const data1 = loadData('data.json');
const data2 = loadData('data2.json');

const data = [...data1, ...data2];
const uniqueData = Array.from(
  new Map(data.map((el) => [el.id, el])).values(),
);

const filtered = uniqueData.filter((el) => el.tags?.name || el.tags?.ele);

const rows = filtered.map((el) => ({
  osmId: el.id,
  name: el.tags.name ?? 'Unknown Peak',
  nameAscii: el.tags.name ? removeAccents(el.tags.name) : null,
  altName: el.tags.alt_name ?? null,
  latitude: el.lat,
  longitude: el.lon,
  elevation: el.tags.ele
    ? Number.parseFloat(el.tags.ele)
    : null,
  province: null,
  description: null,
  imageUrl: null,
  tags: el.tags,
  createdAt: Date.now(),
  createdBy: 'admin',
  updatedAt: null,
  updatedBy: null,
}));

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log(`Seeding ${rows.length} mountains...`);

  await db
    .insert(mountains)
    .values(rows)
    .onConflictDoUpdate({
      target: mountains.osmId,
      set: {
        tags: sql`excluded.tags`,
        updatedAt: Date.now(),
        updatedBy: 'admin',
      },
    });

  console.log('Done.');

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});