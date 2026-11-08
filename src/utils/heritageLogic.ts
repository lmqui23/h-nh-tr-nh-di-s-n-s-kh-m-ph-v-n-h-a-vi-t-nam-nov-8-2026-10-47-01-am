import { Place, HeritageCategory, HeritageBadge, CulturalArticle } from '../types';

/**
 * Calculates geographic distance in kilometers between two coordinates using the Haversine formula.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Normalizes Vietnamese text by removing diacritics for flexible fuzzy searching.
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim();
}

export interface PlaceFilterOptions {
  searchQuery?: string;
  regionId?: string;
  provinceId?: string;
  category?: HeritageCategory | 'all';
  ethnicContext?: string;
  onlyVerified?: boolean;
}

/**
 * Pure filter function for cultural heritage places.
 */
export function filterPlaces(places: Place[], filters: PlaceFilterOptions): Place[] {
  return places.filter((place) => {
    // Category filter
    if (filters.category && filters.category !== 'all' && place.category_id !== filters.category) {
      return false;
    }

    // Region filter
    if (filters.regionId && filters.regionId !== 'all' && place.region_id !== filters.regionId) {
      return false;
    }

    // Province filter
    if (filters.provinceId && filters.provinceId !== 'all' && place.province_id !== filters.provinceId) {
      return false;
    }

    // Ethnic context filter
    if (
      filters.ethnicContext &&
      filters.ethnicContext !== 'all' &&
      !place.ethnic_context.toLowerCase().includes(filters.ethnicContext.toLowerCase())
    ) {
      return false;
    }

    // Verification filter
    if (filters.onlyVerified && place.verification_status !== 'verified') {
      return false;
    }

    // Text search filter
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = normalizeVietnamese(filters.searchQuery);
      const name = normalizeVietnamese(place.name);
      const altNames = place.alternative_names.map(normalizeVietnamese).join(' ');
      const desc = normalizeVietnamese(place.short_description);
      const hist = normalizeVietnamese(place.historical_background);
      const prov = normalizeVietnamese(place.province_name);
      const ethnic = normalizeVietnamese(place.ethnic_context);

      const matches =
        name.includes(q) ||
        altNames.includes(q) ||
        desc.includes(q) ||
        hist.includes(q) ||
        prov.includes(q) ||
        ethnic.includes(q);

      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Evaluates and awards digital heritage badges based on user's visited places.
 */
export function evaluateHeritageBadges(visitedPlaceIds: string[], allPlaces: Place[]): HeritageBadge[] {
  const visitedSet = new Set(visitedPlaceIds);
  const visitedPlaces = allPlaces.filter((p) => visitedSet.has(p.id));

  // Count by categories and regions
  const waterCount = visitedPlaces.filter(
    (p) => p.category_id === 'van-hoa-song-nuoc' || p.category_id === 'di-san-phi-vat-the'
  ).length;
  const khmerCount = visitedPlaces.filter((p) => p.ethnic_context.toLowerCase().includes('khmer')).length;
  const craftCount = visitedPlaces.filter((p) => p.category_id === 'lang-nghe').length;
  const ocEoCount = visitedPlaces.filter(
    (p) => p.category_id === 'khao-co' || p.name.includes('Óc Eo') || p.historical_background.includes('Phù Nam')
  ).length;
  const dongNamBoCount = visitedPlaces.filter((p) => p.region_id === 'dong-nam-bo').length;
  const mienTayCount = visitedPlaces.filter((p) => p.region_id === 'dong-bang-song-cuu-long').length;
  const totalVisited = visitedPlaces.length;

  return [
    {
      id: 'dau-chan-dau-tien',
      title: 'Bước Chân Đầu Tiên',
      description: 'Ghé thăm và lưu lại kỷ niệm tại ít nhất 1 địa điểm di sản văn hóa',
      icon: 'Flag',
      criteria: 'Ghé thăm 1 địa điểm',
      unlocked: totalVisited >= 1,
    },
    {
      id: 'kham-pha-song-nuoc',
      title: 'Sóng Nước Cửu Long',
      description: 'Khám phá ít nhất 2 không gian di sản văn hóa sông nước miền Tây',
      icon: 'Waves',
      criteria: 'Ghé thăm 2 địa điểm văn hóa sông nước',
      unlocked: waterCount >= 2,
    },
    {
      id: 'dau-an-chua-thap',
      title: 'Dấu Ấn Chùa Tháp Khmer',
      description: 'Trải nghiệm không gian văn hóa & kiến trúc Phật giáo Nam tông Khmer',
      icon: 'Building2',
      criteria: 'Ghé thăm 2 di tích văn hóa Khmer',
      unlocked: khmerCount >= 2,
    },
    {
      id: 'hon-lang-nghe',
      title: 'Hồn Làng Nghề Nam Bộ',
      description: 'Tìm hiểu và gìn giữ tinh hoa từ các làng nghề thủ công truyền thống',
      icon: 'Hammer',
      criteria: 'Ghé thăm 2 làng nghề truyền thống',
      unlocked: craftCount >= 2,
    },
    {
      id: 'bi-an-phu-nam',
      title: 'Huyền Bí Óc Eo - Phù Nam',
      description: 'Chạm vào dấu tích của nền văn minh cổ xưa rực rỡ vùng châu thổ',
      icon: 'Compass',
      criteria: 'Ghé thăm di tích khảo cổ Óc Eo',
      unlocked: ocEoCount >= 1,
    },
    {
      id: 'su-gia-di-san',
      title: 'Đại Sứ Di Sản Số',
      description: 'Ghé thăm và xây dựng bản đồ ký ức với 5 địa điểm văn hóa khác nhau',
      icon: 'Crown',
      criteria: 'Ghé thăm 5 địa điểm bất kỳ',
      unlocked: totalVisited >= 5,
    },
    {
      id: 'ket-noi-hai-mien',
      title: 'Giao Thoa Đông - Tây',
      description: 'Khám phá di sản ở cả 2 vùng Đông Nam Bộ và Đồng bằng sông Cửu Long',
      icon: 'Sparkles',
      criteria: 'Ghé thăm di sản ở cả 2 miền Nam Bộ',
      unlocked: dongNamBoCount >= 1 && mienTayCount >= 1,
    },
  ];
}

/**
 * Calculates total route travel distance along an ordered sequence of places.
 */
export function calculateRouteSummary(placeIds: string[], allPlaces: Place[]): {
  totalKm: number;
  stopsCount: number;
  orderedPlaces: Place[];
} {
  const placeMap = new Map(allPlaces.map((p) => [p.id, p]));
  const orderedPlaces = placeIds.map((id) => placeMap.get(id)).filter(Boolean) as Place[];

  if (orderedPlaces.length <= 1) {
    return {
      totalKm: 0,
      stopsCount: orderedPlaces.length,
      orderedPlaces,
    };
  }

  let totalKm = 0;
  for (let i = 0; i < orderedPlaces.length - 1; i++) {
    const p1 = orderedPlaces[i];
    const p2 = orderedPlaces[i + 1];
    totalKm += calculateDistanceKm(p1.coordinates.lat, p1.coordinates.lng, p2.coordinates.lat, p2.coordinates.lng);
  }

  return {
    totalKm: Math.round(totalKm * 10) / 10,
    stopsCount: orderedPlaces.length,
    orderedPlaces,
  };
}

/**
 * Calculates aggregate review rating from an array of ratings (1-5).
 */
export function calculateReviewStats(ratings: number[]): { averageRating: number; count: number } {
  if (!ratings || ratings.length === 0) {
    return { averageRating: 0, count: 0 };
  }
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const avg = Math.round((sum / ratings.length) * 10) / 10;
  return { averageRating: avg, count: ratings.length };
}

/**
 * Global search across places and cultural knowledge articles.
 */
export function performGlobalSearch(
  query: string,
  places: Place[],
  articles: CulturalArticle[]
): {
  places: Place[];
  articles: CulturalArticle[];
  totalMatches: number;
} {
  if (!query || query.trim() === '') {
    return { places: [], articles: [], totalMatches: 0 };
  }
  const q = normalizeVietnamese(query);

  const matchedPlaces = places.filter((p) => {
    return (
      normalizeVietnamese(p.name).includes(q) ||
      p.alternative_names.some((alt) => normalizeVietnamese(alt).includes(q)) ||
      normalizeVietnamese(p.province_name).includes(q) ||
      normalizeVietnamese(p.ethnic_context).includes(q) ||
      normalizeVietnamese(p.short_description).includes(q)
    );
  });

  const matchedArticles = articles.filter((a) => {
    return (
      normalizeVietnamese(a.title).includes(q) ||
      normalizeVietnamese(a.topic).includes(q) ||
      normalizeVietnamese(a.ethnic_community).includes(q) ||
      normalizeVietnamese(a.excerpt).includes(q) ||
      a.tags.some((t) => normalizeVietnamese(t).includes(q))
    );
  });

  return {
    places: matchedPlaces,
    articles: matchedArticles,
    totalMatches: matchedPlaces.length + matchedArticles.length,
  };
}
