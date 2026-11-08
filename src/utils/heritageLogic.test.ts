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
    id: 'cho-noi-cai-rang',
    slug: 'cho-noi-cai-rang',
    name: 'Chợ Nổi Cái Răng',
    alternative_names: ['Cái Răng Floating Market'],
    province_id: 'can-tho',
    province_name: 'Cần Thơ',
    region_id: 'dong-bang-song-cuu-long',
    category_id: 'van-hoa-song-nuoc',
    coordinates: { lat: 10.005, lng: 105.746 },
    address: 'Sông Cần Thơ, Quận Cái Răng, TP. Cần Thơ',
    short_description: 'Di sản văn hóa phi vật thể quốc gia về tập quán sinh hoạt sông nước',
    historical_background: 'Hình thành từ đầu thế kỷ 20',
    cultural_significance: 'Phương thức giao thương trên sông với cây bẹo',
    architecture_features: 'Thuyền ghe gỗ truyền thống',
    ethnic_context: 'Kinh, Hoa, Khmer',
    visitor_info: { verified_source: 'Sở VHTTDL Cần Thơ' },
    verification_status: 'verified',
    media: [],
    stats: { savedCount: 120, visitedCount: 85, reviewCount: 24, rating: 4.8 },
  },
  {
    id: 'chua-chen-kieu',
    slug: 'chua-chen-kieu',
    name: 'Chùa Chén Kiểu',
    alternative_names: ['Chùa Sà Lôn', 'Wat Sro Loun'],
    province_id: 'soc-trang',
    province_name: 'Sóc Trăng',
    region_id: 'dong-bang-song-cuu-long',
    category_id: 'chua-dinh-tin-nguong',
    coordinates: { lat: 9.542, lng: 105.945 },
    address: 'Xã Đại Tâm, Huyện Mỹ Xuyên, Sóc Trăng',
    short_description: 'Ngôi chùa Khmer độc đáo ốp mảnh sứ chén đĩa cổ',
    historical_background: 'Xây dựng từ năm 1815',
    cultural_significance: 'Trung tâm tín ngưỡng Phật giáo Nam tông Khmer',
    architecture_features: 'Hoa văn Khmer kết hợp nghệ thuật khảm sành sứ',
    ethnic_context: 'Khmer Nam Bộ',
    visitor_info: { verified_source: 'Bảo tàng Khmer Sóc Trăng' },
    verification_status: 'verified',
    media: [],
    stats: { savedCount: 89, visitedCount: 42, reviewCount: 15, rating: 4.9 },
  },
  {
    id: 'chua-doi',
    slug: 'chua-doi',
    name: 'Chùa Dơi',
    alternative_names: ['Chùa Mahatup', 'Wat Mahatup'],
    province_id: 'soc-trang',
    province_name: 'Sóc Trăng',
    region_id: 'dong-bang-song-cuu-long',
    category_id: 'chua-dinh-tin-nguong',
    coordinates: { lat: 9.591, lng: 105.981 },
    address: 'Phường 3, TP. Sóc Trăng',
    short_description: 'Ngôi chùa cổ với đàn dơi quạ tự nhiên',
    historical_background: 'Khởi dựng từ thế kỷ 16',
    cultural_significance: 'Không gian văn hóa và sinh thái tâm linh Khmer',
    architecture_features: 'Mái nhiều tầng uốn cong hình rồng Nagar',
    ethnic_context: 'Khmer',
    visitor_info: { verified_source: 'BQL Di tích Sóc Trăng' },
    verification_status: 'verified',
    media: [],
    stats: { savedCount: 150, visitedCount: 95, reviewCount: 30, rating: 4.7 },
  },
  {
    id: 'khu-di-tich-oc-eo',
    slug: 'khu-di-tich-oc-eo',
    name: 'Khu Di Tích Khảo Cổ Óc Eo - Ba Thê',
    alternative_names: ['Di chỉ Óc Eo'],
    province_id: 'an-giang',
    province_name: 'An Giang',
    region_id: 'dong-bang-song-cuu-long',
    category_id: 'khao-co',
    coordinates: { lat: 10.252, lng: 105.151 },
    address: 'Thị trấn Óc Eo, Thoại Sơn, An Giang',
    short_description: 'Đô thị cảng cổ và trung tâm văn minh Phù Nam cổ đại',
    historical_background: 'Tồn tại từ thế kỷ 1 đến thế kỷ 7 sau CN',
    cultural_significance: 'Di tích quốc gia đặc biệt, trung tâm giao thương biển quốc tế',
    architecture_features: 'Dấu tích kiến trúc gạch đá đền tháp và kênh đào cổ',
    ethnic_context: 'Văn hóa cổ Phù Nam',
    visitor_info: { verified_source: 'Ban Quản lý Di tích Văn hóa Óc Eo' },
    verification_status: 'verified',
    media: [],
    stats: { savedCount: 200, visitedCount: 60, reviewCount: 18, rating: 4.9 },
  },
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
