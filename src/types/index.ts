export type VerificationStatus = 'verified' | 'pending' | 'needs_revision';

export type UserRole = 'guest' | 'user' | 'moderator' | 'admin';

export interface MediaAsset {
  id: string;
  image_url: string;
  media_type?: 'image' | 'video' | 'document';
  source_url: string;
  source_name: string;
  photographer?: string;
  copyright_owner?: string;
  license_type: 'CC BY-SA 4.0' | 'CC BY-SA 3.0' | 'CC BY 3.0' | 'CC BY 2.0' | 'Public Domain' | 'Fair Use Editorial' | 'Chính quyền & Ban quản lý di tích' | 'User-provided';
  license_url?: string;
  attribution_text: string;
  caption?: string;
  date_taken?: string;
  verification_status: VerificationStatus;
}

export type HeritageCategory = 
  | 'di-tich-lich-su'
  | 'di-tich-kien-truc'
  | 'di-san-tam-linh'
  | 'di-san-phi-vat-the'
  | 'lang-nghe'
  | 'khao-co'
  | 'am-thuc-dan-gian';

export interface CategoryInfo {
  id: HeritageCategory;
  name: string;
  description: string;
  color: string;
  iconName: string;
}

export interface Region {
  id: string;
  name: string;
  code: 'dong-nam-bo' | 'khac';
  description: string;
}

export interface Province {
  id: string;
  name: string;
  historical_names: string[];
  region_id: string;
  center_coords: [number, number]; // [lat, lng]
  summary: string;
}

export interface Place {
  id: string;
  status?: 'published' | 'hidden' | 'deleted';
  slug: string;
  name: string;
  alternative_names: string[]; // Tên chữ, tên Khmer/Chăm, tên dân gian
  province_id: string;
  province_name: string;
  region_id: string;
  category_id: HeritageCategory;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  short_description: string;
  historical_background: string;
  cultural_significance: string;
  architecture_features: string;
  ethnic_context: string; // "Kinh", "Hoa", "Chăm", "Giao thoa đa tộc người"
  visitor_info: {
    opening_hours?: string;
    fee?: string;
    etiquette?: string;
    contact?: string;
    verified_source: string;
  };
  verification_status: VerificationStatus;
  media: MediaAsset[];
  stats: {
    savedCount: number;
    visitedCount: number;
    reviewCount: number;
    rating: number; // 1-5
  };
  featured?: boolean;
}

export interface CulturalArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  topic: string;
  ethnic_community: string;
  region_name: string;
  read_time: string;
  published_date: string;
  author: string;
  author_title: string;
  excerpt: string;
  sections: Array<{
    heading: string;
    body: string;
    image?: MediaAsset;
    quote?: string;
  }>;
  source_citations: Array<{
    source_name: string;
    url?: string;
    author?: string;
    type: 'sách' | 'tạp chí nghiên cứu' | 'văn bản di sản' | 'bảo tàng';
    verified: boolean;
  }>;
  tags: string[];
  cover_image: MediaAsset;
}

export interface User {
  id: string;
  email?: string;
  username: string;
  display_name: string;
  avatar: string;
  bio: string;
  role: UserRole;
  hometown: string;
  cultural_interests: string[];
  followers_count: number;
  following_count: number;
  privacy: 'public' | 'followers' | 'private';
  status?: 'active' | 'locked';
}

export interface PostComment {
  id: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar: string;
  };
  text: string;
  created_at: string;
}

export interface Post {
  id: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar: string;
    role: UserRole;
  };
  created_at: string;
  title?: string;
  content: string;
  place_id?: string;
  place_name?: string;
  cultural_topic?: string;
  images: MediaAsset[];
  is_review: boolean;
  rating?: number;
  visit_date?: string;
  verified_visit: boolean;
  likes: number;
  has_liked?: boolean;
  comments: PostComment[];
  saved?: boolean;
  moderation_status: 'approved' | 'pending' | 'rejected' | 'hidden' | 'flagged';
  moderation_note?: string;
}

export interface VisitedMemory {
  place_id: string;
  place_name: string;
  province_name: string;
  visited_at: string;
  note?: string;
  personal_photo?: string;
  rating?: number;
}

export interface HeritageBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  criteria: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface Journey {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  curator: string;
  cover_image: string;
  places: string[]; // array of place_ids
  tags: string[];
  estimated_duration: string;
  cultural_theme: string;
  is_official: boolean;
}

export type ActiveTab = 'home' | 'map' | 'places' | 'culture' | 'journeys' | 'community' | 'profile' | 'admin';