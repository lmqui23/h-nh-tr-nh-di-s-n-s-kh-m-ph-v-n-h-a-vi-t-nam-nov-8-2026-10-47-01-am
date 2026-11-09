import dotenv from 'dotenv';
dotenv.config();

import { ARTICLES, JOURNEYS, PLACES } from '../src/data/heritageData.js';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Chưa cấu hình biến môi trường DATABASE_URL trong file .env');
}

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000, // Tăng thời gian chờ kết nối lên 30 giây
});

async function seedCatalog() {
  console.log('🔄 Đang kết nối tới Supabase PostgreSQL...');
  try {
    await client.connect();
    console.log('⚡ Đã kết nối thành công! Đang chèn dữ liệu...');

    await client.query('BEGIN');

    // 1. Seed Places
    for (const place of PLACES) {
      const data = {
        ...place,
        stats: { savedCount: 0, visitedCount: 0, reviewCount: 0, rating: 0 },
      };
      await client.query(`
        INSERT INTO places (id, slug, name, province_name, category_id, data_json)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [place.id, place.slug, place.name, place.province_name, place.category_id, JSON.stringify(data)]);
    }

    // 2. Seed Articles
    for (const article of ARTICLES) {
      await client.query(`
        INSERT INTO editorial_content (id, kind, slug, title, data_json)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (kind, slug) DO NOTHING
      `, [article.id, 'article', article.slug, article.title, JSON.stringify(article)]);
    }

    // 3. Seed Journeys
    for (const journey of JOURNEYS) {
      await client.query(`
        INSERT INTO editorial_content (id, kind, slug, title, data_json)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (kind, slug) DO NOTHING
      `, [journey.id, 'journey', journey.slug, journey.title, JSON.stringify(journey)]);
    }

    await client.query('COMMIT');
    console.log(`✅ Nạp dữ liệu di sản thành công: ${PLACES.length} địa điểm, ${ARTICLES.length} bài viết, ${JOURNEYS.length} hành trình.`);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    console.error('❌ Lỗi nạp CSDL:', error);
  } finally {
    await client.end();
  }
}

seedCatalog();