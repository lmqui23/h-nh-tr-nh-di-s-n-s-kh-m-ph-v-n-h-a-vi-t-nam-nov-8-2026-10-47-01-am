import fs from 'fs';
import path from 'path';
import { ARTICLES, JOURNEYS, PLACES } from '../src/data/heritageData.js';

let sql = '-- SEED DATA FOR SUPABASE POSTGRESQL\n\n';

// 1. Places
for (const place of PLACES) {
  const data = JSON.stringify({
    ...place,
    stats: { savedCount: 0, visitedCount: 0, reviewCount: 0, rating: 0 },
  }).replace(/'/g, "''");

  const name = place.name.replace(/'/g, "''");
  const province = place.province_name.replace(/'/g, "''");

  sql += `INSERT INTO places (id, slug, name, province_name, category_id, data_json)\nVALUES ('${place.id}', '${place.slug}', '${name}', '${province}', '${place.category_id}', '${data}')\nON CONFLICT (id) DO NOTHING;\n\n`;
}

// 2. Articles
for (const article of ARTICLES) {
  const data = JSON.stringify(article).replace(/'/g, "''");
  const title = article.title.replace(/'/g, "''");
  sql += `INSERT INTO editorial_content (id, kind, slug, title, data_json)\nVALUES ('${article.id}', 'article', '${article.slug}', '${title}', '${data}')\nON CONFLICT (kind, slug) DO NOTHING;\n\n`;
}

// 3. Journeys
for (const journey of JOURNEYS) {
  const data = JSON.stringify(journey).replace(/'/g, "''");
  const title = journey.title.replace(/'/g, "''");
  sql += `INSERT INTO editorial_content (id, kind, slug, title, data_json)\nVALUES ('${journey.id}', 'journey', '${journey.slug}', '${title}', '${data}')\nON CONFLICT (kind, slug) DO NOTHING;\n\n`;
}

fs.writeFileSync(path.join(process.cwd(), 'seed-data.sql'), sql, 'utf-8');
console.log('✅ Đã tạo file seed-data.sql thành công!');