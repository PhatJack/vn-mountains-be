import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import removeAccents from 'remove-accents';
import { mountains } from './schema.js';

interface OverpassNode {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

const data: OverpassNode[] = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', 'constant', 'data.json'),
    'utf-8',
  ),
);

const filtered = data.filter((el) => el.tags.name);

const rows = filtered.map((el) => ({
  osmId: el.id,
  name: el.tags.name,
  nameAscii: removeAccents(el.tags.name),
  altName: el.tags.alt_name ?? null,
  latitude: el.lat,
  longitude: el.lon,
  elevation: el.tags.ele ? Number.parseFloat(el.tags.ele) : null,
  province: null,
  description: null,
  imageUrl: null,
  createdAt: Date.now(),
  createdBy: 'admin',
  updatedAt: null,
  updatedBy: null,
}));

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log(`Seeding ${rows.length} mountains...`);

  await db.insert(mountains).values(rows).onConflictDoNothing({
    target: mountains.osmId,
  });

  console.log('Done.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
