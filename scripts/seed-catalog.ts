import { ARTICLES, JOURNEYS, PLACES } from '../src/data/heritageData';

process.env.NODE_ENV = 'test';
const { database } = await import('../server/index.js');

const seedCatalog = database.transaction(() => {
  const insertPlace = database.prepare(`
    INSERT OR IGNORE INTO places (id, slug, name, province_name, category_id, data_json)
    VALUES (@id, @slug, @name, @province_name, @category_id, @data_json)
  `);
  for (const place of PLACES) {
    const data = {
      ...place,
      stats: { savedCount: 0, visitedCount: 0, reviewCount: 0, rating: 0 },
    };
    insertPlace.run({
      id: place.id,
      slug: place.slug,
      name: place.name,
      province_name: place.province_name,
      category_id: place.category_id,
      data_json: JSON.stringify(data),
    });
  }

  const insertEditorial = database.prepare(`
    INSERT OR IGNORE INTO editorial_content (id, kind, slug, title, data_json)
    VALUES (@id, @kind, @slug, @title, @data_json)
  `);
  for (const article of ARTICLES) {
    insertEditorial.run({
      id: article.id,
      kind: 'article',
      slug: article.slug,
      title: article.title,
      data_json: JSON.stringify(article),
    });
  }
  for (const journey of JOURNEYS) {
    insertEditorial.run({
      id: journey.id,
      kind: 'journey',
      slug: journey.slug,
      title: journey.title,
      data_json: JSON.stringify(journey),
    });
  }
});

seedCatalog();
console.log(`Imported curated catalog: ${PLACES.length} places, ${ARTICLES.length} articles, ${JOURNEYS.length} journeys. No demo accounts or posts were created.`);
database.close();