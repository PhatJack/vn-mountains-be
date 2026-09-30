import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';

type Area = Feature<Polygon | MultiPolygon>;

function loadAreas(filename: string): Area[] {
  const raw = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', 'constant', filename), 'utf-8'),
  ) as Feature | FeatureCollection | Geometry;

  const features: Feature[] =
    raw.type === 'FeatureCollection'
      ? raw.features
      : raw.type === 'Feature'
        ? [raw]
        : [{ type: 'Feature', properties: {}, geometry: raw }];

  return features.filter(
    (f): f is Area =>
      f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon',
  );
}

const areas = loadAreas('vietnam.geojson');
if (areas.length === 0) {
  throw new Error('vietnam.geojson contains no Polygon/MultiPolygon features');
}

const BBOX = { minLat: 8.0, maxLat: 23.6, minLon: 102.0, maxLon: 109.6 };

export function isInVietnam(lat: number, lon: number): boolean {
  if (lat < BBOX.minLat || lat > BBOX.maxLat || lon < BBOX.minLon || lon > BBOX.maxLon) {
    return false;
  }
  const pt = point([lon, lat]); // GeoJSON order is [lon, lat]
  return areas.some((area) => booleanPointInPolygon(pt, area));
}