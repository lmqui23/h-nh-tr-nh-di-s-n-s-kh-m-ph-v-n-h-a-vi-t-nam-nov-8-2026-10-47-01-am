import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  normalizeVietnamese,
  filterPlaces,
  evaluateHeritageBadges,
  calculateRouteSummary,
  calculateReviewStats,
  performGlobalSearch,
} from './heritageLogic';
import { Place, CulturalArticle } from '../types';

const mockPlaces: Place[] = [
  {
    id: 'lang-gom-bien-hoa',
    slug: 'lang-gom-bien-hoa',
    name: 'Làng Gốm Biên Hòa',
    alternative_names: ['Gốm mỹ nghệ Đồng Nai'],
    province_id: 'dong-nai',
    province_name: 'Đồng Nai',
    region_id: 'dong-nam-bo',
    category_id: 'lang-nghe',
    coordinates: { lat: 10.957, lng: 106.824 },
    address: 'Phường Bửu Long & Hóa An, TP. Biên Hòa, Đồng Nai',
    short_description: 'Dòng gốm men xanh trứ danh của vùng đất Đồng Nai xứ sở',
    historical_background: 'Kế thừa từ cuối thế kỷ 19 với Trường Mỹ nghệ Biên Hòa',
    cultural_significance: 'Men xanh đồng trổ hoa văn khắc chìm đặc sắc',
    architecture_features: 'Lò gốm bầu truyền thống bên sông Đồng Nai',
    ethnic_context: 'Kinh, Hoa',
    visitor_info: { verified_source: 'Sở Văn hóa Thể thao Đồng Nai' },
    verification_status: 'verified',
    media: [],
    stats: { savedCount: 78, visitedCount: 35, reviewCount: 10, rating: 4.6 },
  },
];

const mockArticles: CulturalArticle[] = [
  {
    id: 'nghe-thuat-don-ca-tai-tu',
    slug: 'nghe-thuat-don-ca-tai-tu',
    title: 'Đờn Ca Tài Tử Nam Bộ: Hồn Phách Âm Nhạc Miệt Vườn',
    subtitle: 'Di sản văn hóa phi vật thể đại diện của nhân loại',
    topic: 'Âm nhạc & Di sản',
    ethnic_community: 'Kinh & Nam Bộ',
    region_name: 'Đồng bằng sông Cửu Long',
    read_time: '6 phút',
    published_date: '15/10/2026',
    author: 'TS. Nguyễn Văn Hầu',
    author_title: 'Nhà nghiên cứu văn hóa Nam Bộ',
    excerpt: 'Đờn ca tài tử là loại hình nghệ thuật dân gian đặc trưng gắn liền với đời sống sông nước...',
    sections: [],
    source_citations: [
      {
        source_name: 'Hồ sơ UNESCO công nhận Đờn ca tài tử Nam Bộ (2013)',
        type: 'văn bản di sản',
        verified: true,
      },
    ],
    tags: ['Đờn ca tài tử', 'UNESCO', 'Nam Bộ', 'Âm nhạc dân gian'],
    cover_image: {
      id: 'img-1',
      image_url: '',
      source_url: 'https://vi.wikipedia.org',
      source_name: 'UNESCO Archives',
      license_type: 'Public Domain',
      attribution_text: 'UNESCO Cultural Heritage Documentation',
      verification_status: 'verified',
    },
  },
];

test('calculateDistanceKm calculates approximate distance correctly', () => {
  // Can Tho to Soc Trang (~55-60km)
  const dist = calculateDistanceKm(10.005, 105.746, 9.542, 105.945);
  assert.ok(dist > 50 && dist < 70, `Expected distance ~55-65km, got ${dist}`);
});

test('normalizeVietnamese removes diacritics and handles uppercase', () => {
  assert.equal(normalizeVietnamese('Chợ Nổi Cái Răng'), 'cho noi cai rang');
  assert.equal(normalizeVietnamese('Đồng Bằng Sông Cửu Long'), 'dong bang song cuu long');
  assert.equal(normalizeVietnamese('Óc Eo - Ba Thê'), 'oc eo - ba the');
});

test('filterPlaces filters correctly by region and search query', () => {
  const filteredRegion = filterPlaces(mockPlaces, { regionId: 'dong-nam-bo' });
  assert.equal(filteredRegion.length, 1);
  assert.equal(filteredRegion[0].id, 'lang-gom-bien-hoa');

  const filteredSearch = filterPlaces(mockPlaces, { searchQuery: 'khmer' });
  assert.equal(filteredSearch.length, 3); // Chợ Nổi Cái Răng, Chùa Chén Kiểu and Chùa Dơi (all have Khmer context)
});

test('evaluateHeritageBadges awards badges based on visited places', () => {
  // Empty visited gives 0 badges
  const noBadges = evaluateHeritageBadges([], mockPlaces);
  assert.equal(noBadges.filter((b) => b.unlocked).length, 0);

  // Visited 2 Khmer pagodas + 1 Dong Nam Bo place
  const visitedIds = ['chua-chen-kieu', 'chua-doi', 'lang-gom-bien-hoa'];
  const badges = evaluateHeritageBadges(visitedIds, mockPlaces);
  const unlockedIds = badges.filter((b) => b.unlocked).map((b) => b.id);

  assert.ok(unlockedIds.includes('dau-chan-dau-tien'));
  assert.ok(unlockedIds.includes('dau-an-chua-thap'));
  assert.ok(unlockedIds.includes('ket-noi-hai-mien'));
});

test('calculateRouteSummary computes route distance accurately', () => {
  const route = calculateRouteSummary(['cho-noi-cai-rang', 'chua-chen-kieu', 'chua-doi'], mockPlaces);
  assert.equal(route.stopsCount, 3);
  assert.ok(route.totalKm > 55, `Route km should be > 55km, got ${route.totalKm}`);
});

test('calculateReviewStats computes average rating accurately', () => {
  const stats = calculateReviewStats([5, 4, 5, 4, 5]);
  assert.equal(stats.count, 5);
  assert.equal(stats.averageRating, 4.6);
});

test('performGlobalSearch finds matching places and articles', () => {
  const result = performGlobalSearch('tài tử', mockPlaces, mockArticles);
  assert.ok(result.articles.length >= 1);
  assert.equal(result.articles[0].slug, 'nghe-thuat-don-ca-tai-tu');
});
