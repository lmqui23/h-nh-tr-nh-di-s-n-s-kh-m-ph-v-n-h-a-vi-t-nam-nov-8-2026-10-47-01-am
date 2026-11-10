import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Plus,
  FileCheck,
  Eye,
  Building,
  Pencil,
  Trash2,
  EyeOff,
  Image as ImageIcon,
  BookOpen,
  Compass,
} from 'lucide-react';
import { CulturalArticle, Journey, Place, Post, UserRole, HeritageCategory } from '../types';
import { CATEGORIES } from '../data/heritageData';
import { HeritageImage } from './HeritageImage';
import { api } from '../utils/api';

interface AdminDashboardProps {
  currentUserRole: UserRole;
  places: Place[];
  posts: Post[];
  onApprovePost: (postId: string) => void;
  onRejectPost: (postId: string) => void;
  onAddNewPlace: (newPlace: Place) => Promise<Place>;
  currentUserId: string;
  onRefresh: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUserRole,
  places,
  posts,
  onApprovePost,
  onRejectPost,
  onAddNewPlace,
  currentUserId,
  onRefresh,
}) => {
  const [adminTab, setAdminTab] = useState<'moderation' | 'places' | 'users' | 'comments' | 'articles' | 'journeys' | 'uploads'>('moderation');
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; email: string; username: string; display_name: string; role: UserRole; status: 'active' | 'locked' }>>([]);
  const [adminComments, setAdminComments] = useState<Array<{ id: string; content: string; status: string; display_name: string; username: string; created_at: string }>>([]);
  const [adminMedia, setAdminMedia] = useState<Array<{ id: string; post_id: string | null; place_id: string | null; image_url: string; original_name: string; mime_type: string; size_bytes: number; username: string; display_name: string; moderation_status: string | null; place_name: string | null }>>([]);
  
  // State quản lý bài viết & hành trình độc lập
  const [articleItems, setArticleItems] = useState<CulturalArticle[]>([]);
  const [journeyItems, setJourneyItems] = useState<Journey[]>([]);
  
  const [selectedArticle, setSelectedArticle] = useState<CulturalArticle | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);

  // Form State cho Bài Viết
  const [artTitle, setArtTitle] = useState('');
  const [artSlug, setArtSlug] = useState('');
  const [artSummary, setArtSummary] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artCoverImage, setArtCoverImage] = useState('');
  const [artCategory, setArtCategory] = useState(CATEGORIES[0]?.name || 'Di Tích Lịch Sử');
  const [artCustomCategory, setArtCustomCategory] = useState('');
  const [artAuthor, setArtAuthor] = useState('');
  const [artReadTime, setArtReadTime] = useState('');
  const [artStatus, setArtStatus] = useState<'published' | 'hidden'>('published');

  // Form State cho Hành Trình
  const [jrnTitle, setJrnTitle] = useState('');
  const [jrnSlug, setJrnSlug] = useState('');
  const [jrnSubtitle, setJrnSubtitle] = useState('');
  const [jrnDescription, setJrnDescription] = useState('');
  const [jrnCoverImage, setJrnCoverImage] = useState('');
  const [jrnCulturalTheme, setJrnCulturalTheme] = useState('Lịch sử & Kiến trúc');
  const [jrnCustomTheme, setJrnCustomTheme] = useState('');
  const [jrnCurator, setJrnCurator] = useState('');
  const [jrnDuration, setJrnDuration] = useState('');
  const [jrnSelectedPlaces, setJrnSelectedPlaces] = useState<string[]>([]);
  const [jrnStatus, setJrnStatus] = useState<'published' | 'hidden'>('published');

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [adminError, setAdminError] = useState('');
  const [dashboardStats, setDashboardStats] = useState<{ users: number; pendingPosts: number; pendingComments: number; places: number; media: number } | null>(null);
  const [postDraft, setPostDraft] = useState<{ id: string; title: string; content: string; topic: string } | null>(null);

  // Place form state (Đầy đủ tất cả các trường hiển thị)
  const [name, setName] = useState('');
  const [altNames, setAltNames] = useState('');
  const [provinceName, setProvinceName] = useState('Bình Dương');
  const [regionId, setRegionId] = useState('dong-nam-bo');
  const [categoryId, setCategoryId] = useState<HeritageCategory>('di-tich-lich-su');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('10.98');
  const [lng, setLng] = useState('106.65');
  const [shortDesc, setShortDesc] = useState('');
  const [history, setHistory] = useState('');
  const [culturalSignificance, setCulturalSignificance] = useState('');
  const [architectureFeatures, setArchitectureFeatures] = useState('');
  const [ethnicContext, setEthnicContext] = useState('Kinh, Hoa');
  const [verifiedSource, setVerifiedSource] = useState('');
  const [openingHours, setOpeningHours] = useState('07:30 - 17:00');
  const [ticketPrice, setTicketPrice] = useState('Miễn phí');

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState('');

  // Hàm sinh slug từ tiêu đề
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Reset form địa điểm
  const resetPlaceForm = () => {
    setName('');
    setAltNames('');
    setProvinceName('Bình Dương');
    setRegionId('dong-nam-bo');
    setCategoryId('di-tich-lich-su');
    setAddress('');
    setLat('10.98');
    setLng('106.65');
    setShortDesc('');
    setHistory('');
    setCulturalSignificance('');
    setArchitectureFeatures('');
    setEthnicContext('Kinh, Hoa');
    setVerifiedSource('');
    setOpeningHours('07:30 - 17:00');
    setTicketPrice('Miễn phí');

    setMediaFile(null);
    setMediaPreview('');
    setEditImageFile(null);
    setEditImagePreview('');

    setSelectedPlace(null);
    setShowAddPlaceModal(false);
    setAdminError('');
  };

  // Reset form Bài viết
  const resetArticleForm = () => {
    setSelectedArticle(null);
    setArtTitle('');
    setArtSlug('');
    setArtSummary('');
    setArtContent('');
    setArtCoverImage('');
    setArtCategory(CATEGORIES[0]?.name || 'Di Tích Lịch Sử');
    setArtCustomCategory('');
    setArtAuthor('');
    setArtReadTime('');
    setArtStatus('published');
    setAdminError('');
  };

  // Reset form Hành trình
  const resetJourneyForm = () => {
    setSelectedJourney(null);
    setJrnTitle('');
    setJrnSlug('');
    setJrnSubtitle('');
    setJrnDescription('');
    setJrnCoverImage('');
    setJrnCulturalTheme('Lịch sử & Kiến trúc');
    setJrnCustomTheme('');
    setJrnCurator('');
    setJrnDuration('');
    setJrnSelectedPlaces([]);
    setJrnStatus('published');
    setAdminError('');
  };

  // Chọn Bài viết để sửa
  const handleSelectArticle = (art: CulturalArticle) => {
    setSelectedArticle(art);
    setArtTitle(art.title || '');
    setArtSlug(art.slug || slugify(art.title || ''));
    setArtSummary((art as any).summary || art.excerpt || '');
    const rawContent = (art as any).content || '';
    setArtContent(
      typeof rawContent === 'string'
        ? rawContent
        : rawContent
        ? JSON.stringify(rawContent, null, 2)
        : ''
    );
    const imgUrl = typeof art.cover_image === 'string' ? art.cover_image : art.cover_image?.image_url || '';
    setArtCoverImage(imgUrl);

    const existingCat = (art as any).category || art.topic || '';
    if (CATEGORIES.some(c => c.name === existingCat)) {
      setArtCategory(existingCat);
      setArtCustomCategory('');
    } else {
      setArtCategory('NEW_CUSTOM');
      setArtCustomCategory(existingCat);
    }

    setArtAuthor((art as any).author || '');
    setArtReadTime(art.read_time || '');
    setArtStatus((art as any).status === 'hidden' ? 'hidden' : 'published');
    setAdminError('');
  };

  // Chọn Hành trình để sửa
  const handleSelectJourney = (jrn: Journey) => {
    setSelectedJourney(jrn);
    setJrnTitle(jrn.title || '');
    setJrnSlug(jrn.slug || slugify(jrn.title || ''));
    setJrnSubtitle(jrn.subtitle || '');
    setJrnDescription(jrn.description || '');
    setJrnCoverImage(jrn.cover_image || '');

    const existingTheme = jrn.cultural_theme || '';
    const defaultThemes = ['Lịch sử & Kiến trúc', 'Thủ công truyền thống', 'Khảo cổ học & Tín ngưỡng', 'Tập quán sông nước'];
    if (defaultThemes.includes(existingTheme)) {
      setJrnCulturalTheme(existingTheme);
      setJrnCustomTheme('');
    } else {
      setJrnCulturalTheme('NEW_CUSTOM');
      setJrnCustomTheme(existingTheme);
    }

    setJrnCurator(jrn.curator || '');
    setJrnDuration(jrn.estimated_duration || '');
    setJrnSelectedPlaces(jrn.places || []);
    setJrnStatus((jrn as any).status === 'hidden' ? 'hidden' : 'published');
    setAdminError('');
  };

  useEffect(() => {
    let active = true;
    const loadTabData = async () => {
      try {
        if (adminTab === 'users' && currentUserRole === 'admin') {
          const result = await api.adminUsers();
          if (active) setAdminUsers(result.users as typeof adminUsers);
        } else if (adminTab === 'comments') {
          const result = await api.adminComments();
          if (active) setAdminComments(result.comments);
        } else if (adminTab === 'uploads') {
          const result = await api.adminMedia();
          if (active) setAdminMedia(result.items);
        } else if (adminTab === 'articles') {
          const result = await api.adminEditorial('article');
          if (active) setArticleItems(result.items as CulturalArticle[]);
        } else if (adminTab === 'journeys') {
          const result = await api.adminEditorial('journey');
          if (active) setJourneyItems(result.items as Journey[]);
        }
        if (currentUserRole === 'admin') {
          const result = await api.dashboard();
          if (active) setDashboardStats(result);
        }
      } catch (error) {
        if (active) setAdminError(error instanceof Error ? error.message : 'Không thể tải dữ liệu quản trị.');
      }
    };
    void loadTabData();
    return () => { active = false; };
  }, [adminTab, currentUserRole]);

  const handleUserUpdate = async (userId: string, changes: { role?: UserRole; status?: 'active' | 'locked' }) => {
    try {
      await api.updateUser(userId, changes);
      const result = await api.adminUsers();
      setAdminUsers(result.users as typeof adminUsers);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể cập nhật tài khoản.');
    }
  };

  // Lưu BÀI VIẾT
  const handleArticleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle.trim()) {
      setAdminError('Tiêu đề bài viết không được để trống.');
      return;
    }

    const finalCategory = artCategory === 'NEW_CUSTOM' ? artCustomCategory.trim() : artCategory;
    if (!finalCategory) {
      setAdminError('Vui lòng chọn hoặc nhập danh mục cho bài viết.');
      return;
    }

    try {
      const payload: Record<string, any> = {
        kind: 'article',
        title: artTitle.trim(),
        slug: artSlug.trim() || slugify(artTitle.trim()),
        subtitle: artSummary.trim(),
        excerpt: artSummary.trim(),
        summary: artSummary.trim(),
        topic: finalCategory,
        category: finalCategory,
        author: artAuthor.trim() || 'Ban Quản Trị Di Sản',
        author_title: 'Tác giả di sản',
        read_time: artReadTime.trim() || '5 phút',
        published_date: new Date().toLocaleDateString('vi-VN'),
        region_name: 'Đông Nam Bộ',
        status: artStatus,
        cover_image: artCoverImage ? {
          image_url: artCoverImage,
          caption: artTitle.trim(),
          source_name: 'Tư liệu tự tải lên',
          license_type: 'Bản quyền hệ thống'
        } : null,
        sections: [
          {
            heading: 'Nội dung chính',
            body: artContent.trim()
          }
        ],
        tags: [finalCategory],
        source_citations: [
          {
            source_name: 'Tư liệu tổng hợp',
            type: 'Kiểm chứng nội bộ'
          }
        ]
      };

      const result = await api.saveEditorial(
        payload as Partial<CulturalArticle> & { kind: 'article' },
        selectedArticle?.id
      );

      handleSelectArticle(result.item as CulturalArticle);
      const refreshed = await api.adminEditorial('article');
      setArticleItems(refreshed.items as CulturalArticle[]);
      await onRefresh(); // Tự động làm mới dữ liệu toàn hệ thống
      setAdminError('');
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể lưu bài viết.');
    }
  };

  // Lưu HÀNH TRÌNH
  const handleJourneySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jrnTitle.trim()) {
      setAdminError('Tiêu đề hành trình không được để trống.');
      return;
    }

    const finalTheme = jrnCulturalTheme === 'NEW_CUSTOM' ? jrnCustomTheme.trim() : jrnCulturalTheme;

    try {
      const payload: Record<string, any> = {
        kind: 'journey',
        title: jrnTitle.trim(),
        slug: jrnSlug.trim() || slugify(jrnTitle.trim()),
        subtitle: jrnSubtitle.trim(),
        description: jrnDescription.trim(),
        image_url: jrnCoverImage,
        estimated_duration: jrnDuration.trim(),
        cultural_theme: finalTheme,
        curator: jrnCurator.trim(),
        places: jrnSelectedPlaces,
        status: jrnStatus,
      };

      const result = await api.saveEditorial(
        payload as Partial<Journey> & { kind: 'journey' },
        selectedJourney?.id
      );

      handleSelectJourney(result.item as Journey);
      const refreshed = await api.adminEditorial('journey');
      setJourneyItems(refreshed.items as Journey[]);
      await onRefresh(); // Tự động làm mới dữ liệu toàn hệ thống
      setAdminError('');
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể lưu hành trình.');
    }
  };

  const handleEditorialDelete = async (itemId: string, kind: 'article' | 'journey') => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nội dung này?')) return;
    try {
      await api.deleteEditorial(itemId);
      if (kind === 'article') {
        resetArticleForm();
        setArticleItems((items) => items.filter((item) => item.id !== itemId));
      } else {
        resetJourneyForm();
        setJourneyItems((items) => items.filter((item) => item.id !== itemId));
      }
      await onRefresh(); // Tự động làm mới sau khi xóa
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể xóa nội dung.');
    }
  };

  const handleOpenPlaceEdit = (place: Place) => {
    setSelectedPlace(place);

    setName(place.name || '');
    setAltNames((place.alternative_names || []).join(', '));
    setProvinceName(place.province_name || '');
    setRegionId(place.region_id || 'dong-nam-bo');
    setCategoryId(place.category_id);
    setAddress(place.address || '');

    setLat(String(place.coordinates?.lat ?? 10.98));
    setLng(String(place.coordinates?.lng ?? 106.65));

    setShortDesc(place.short_description || '');
    setHistory(place.historical_background || '');
    setCulturalSignificance(place.cultural_significance || '');
    setArchitectureFeatures(place.architecture_features || '');
    setEthnicContext(place.ethnic_context || '');
    setVerifiedSource(place.visitor_info?.verified_source || '');
    setOpeningHours(place.visitor_info?.opening_hours || '07:30 - 17:00');
    setTicketPrice(place.visitor_info?.fee || 'Miễn phí');

    setEditImageFile(null);
    setEditImagePreview('');
    setAdminError('');
  };

  const handlePlaceSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    if (!name.trim()) {
      setAdminError('Tên địa điểm không được để trống.');
      return;
    }

    try {
      const updatedPlace: Partial<Place> = {
        name: name.trim(),
        alternative_names: altNames
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        province_name: provinceName.trim(),
        region_id: regionId,
        category_id: categoryId,
        coordinates: {
          lat: Number(lat),
          lng: Number(lng),
        },
        address: address.trim(),
        short_description: shortDesc.trim(),
        historical_background: history.trim(),
        cultural_significance: culturalSignificance.trim(),
        architecture_features: architectureFeatures.trim(),
        ethnic_context: ethnicContext.trim(),
        visitor_info: {
          ...selectedPlace.visitor_info,
          verified_source: verifiedSource.trim(),
          opening_hours: openingHours.trim(),
          fee: ticketPrice.trim(),
        },
      };

      await api.updatePlace(selectedPlace.id, updatedPlace);

      if (editImageFile) {
        await api.replacePlaceImage(selectedPlace.id, editImageFile);
      }

      await onRefresh();
      resetPlaceForm();

    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : 'Không thể cập nhật hồ sơ địa điểm.'
      );
    }
  };

  const handlePlaceDelete = async (placeId: string) => {
    if (!window.confirm('Ẩn địa điểm này khỏi website?')) return;
    try {
      await api.deletePlace(placeId);
      await onRefresh();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể ẩn địa điểm.');
    }
  };

  const handlePlaceStatus = async (place: Place) => {
    try {
      await api.setPlaceStatus(place.id, place.status === 'published' ? 'hidden' : 'published');
      await onRefresh();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái địa điểm.');
    }
  };

  const handleCommentUpdate = async (commentId: string, status: 'approved' | 'rejected' | 'hidden') => {
    try {
      await api.moderateComment(commentId, status);
      const result = await api.adminComments();
      setAdminComments(result.comments);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể kiểm duyệt bình luận.');
    }
  };

  const handleMediaDelete = async (mediaId: string) => {
    if (!window.confirm('Gỡ tệp này? Bài cộng đồng có ảnh này sẽ bị ẩn.')) return;
    try {
      await api.deleteMedia(mediaId);
      const result = await api.adminMedia();
      setAdminMedia(result.items);
      await onRefresh();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể gỡ tệp media.');
    }
  };

  const handlePostSave = async () => {
    if (!postDraft) return;
    try {
      await api.editPost(postDraft.id, { title: postDraft.title, content: postDraft.content, cultural_topic: postDraft.topic });
      setPostDraft(null);
      await onRefresh();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể cập nhật bài viết.');
    }
  };

  const handlePostImageReplace = async (postId: string, file?: File) => {
    if (!file) return;
    try {
      await api.replacePostImage(postId, file);
      await onRefresh();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể thay ảnh bài viết.');
    }
  };

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mediaFile) return;

    const newPlace: Place = {
      id: `place-${Date.now()}`,
      slug: slugify(name.trim()),
      name: name.trim(),
      alternative_names: altNames ? altNames.split(',').map((s) => s.trim()) : [],
      province_id: slugify(provinceName),
      province_name: provinceName,
      region_id: regionId,
      category_id: categoryId,
      coordinates: {
        lat: parseFloat(lat) || 10.98,
        lng: parseFloat(lng) || 106.65,
      },
      address: address.trim(),
      short_description: shortDesc.trim(),
      historical_background: history.trim(),
      cultural_significance: culturalSignificance.trim() || 'Giá trị di sản văn hóa đặc sắc của địa phương',
      architecture_features: architectureFeatures.trim() || 'Kiến trúc truyền thống mang đậm bản sắc Nam Bộ',
      ethnic_context: ethnicContext.trim(),
      visitor_info: {
        verified_source: verifiedSource.trim(),
        opening_hours: openingHours.trim(),
        fee: ticketPrice.trim(),
      },
      status: 'published',
      verification_status: 'verified',
      media: [],
      stats: {
        savedCount: 0,
        visitedCount: 0,
        reviewCount: 0,
        rating: 0,
      },
    };

    try {
      const createdPlace = await onAddNewPlace(newPlace);
      await api.replacePlaceImage(createdPlace.id, mediaFile);
      await onRefresh();
      resetPlaceForm();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể tạo địa điểm.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FAF6EF] border border-[#354C68]/40 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#354C68] font-bold">
            <ShieldCheck size={16} />
            <span>HỆ THỐNG QUẢN TRỊ & KIỂM DUYỆT TƯ LIỆU VĂN HÓA</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#28231F] mt-1">
            Trung Tâm Kiểm Soát Tính Xác Thực Di Sản
          </h1>
          <p className="text-xs text-[#795548] mt-0.5">
            Vai trò hiện tại: <strong className="text-[#354C68] uppercase">{currentUserRole}</strong>. Giám sát dữ liệu địa điểm, ảnh tư liệu và bài đăng cộng đồng theo đúng quy chuẩn di sản.
          </p>
        </div>

        {currentUserRole === 'admin' && (
          <button
            onClick={() => {
              resetPlaceForm();
              setShowAddPlaceModal(true);
            }}
            className="px-4 py-2 bg-[#B8322A] text-white rounded-lg text-xs font-semibold hover:bg-[#9E2A23] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>Thêm Địa Điểm Di Sản Mới</span>
          </button>
        )}
      </div>

      {/* Admin Tabs Navigation */}
      <div className="flex items-center overflow-x-auto border-b border-[#D8A84E]/30 text-xs gap-1">
        <button
          onClick={() => setAdminTab('moderation')}
          className={`py-2 px-3.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'moderation'
              ? 'border-[#354C68] text-[#354C68]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <FileCheck size={14} />
          <span>Kiểm duyệt ({posts.filter((post) => post.moderation_status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setAdminTab('places')}
          className={`py-2 px-3.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'places'
              ? 'border-[#354C68] text-[#354C68]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <Building size={14} />
          <span>Quản Lý Địa Điểm ({places.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('articles')}
          className={`py-2 px-3.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'articles'
              ? 'border-[#354C68] text-[#354C68]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <BookOpen size={14} />
          <span>Quản Lý Bài Viết</span>
        </button>

        <button
          onClick={() => setAdminTab('journeys')}
          className={`py-2 px-3.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'journeys'
              ? 'border-[#354C68] text-[#354C68]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <Compass size={14} />
          <span>Quản Lý Hành Trình</span>
        </button>

        <button onClick={() => setAdminTab('comments')} className={`py-2 px-3.5 font-semibold border-b-2 cursor-pointer whitespace-nowrap ${adminTab === 'comments' ? 'border-[#354C68] text-[#354C68]' : 'border-transparent text-[#795548]'}`}>
          Bình luận ({adminComments.filter((comment) => comment.status === 'pending').length})
        </button>
        <button onClick={() => setAdminTab('uploads')} className={`py-2 px-3.5 font-semibold border-b-2 cursor-pointer whitespace-nowrap ${adminTab === 'uploads' ? 'border-[#354C68] text-[#354C68]' : 'border-transparent text-[#795548]'}`}>
          Media
        </button>
        {currentUserRole === 'admin' && (
          <button onClick={() => setAdminTab('users')} className={`py-2 px-3.5 font-semibold border-b-2 cursor-pointer whitespace-nowrap ${adminTab === 'users' ? 'border-[#354C68] text-[#354C68]' : 'border-transparent text-[#795548]'}`}>
            Người dùng
          </button>
        )}
      </div>

      {dashboardStats && currentUserRole === 'admin' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Tài khoản', dashboardStats.users],
            ['Bài chờ duyệt', dashboardStats.pendingPosts],
            ['Bình luận chờ', dashboardStats.pendingComments],
            ['Địa điểm', dashboardStats.places],
            ['Tệp media', dashboardStats.media],
          ].map(([label, count]) => (
            <div key={label} className="border-b border-[#D8A84E]/40 px-2 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[#795548]">{label}</p>
              <p className="mt-1 font-serif text-xl font-bold text-[#28231F]">{count}</p>
            </div>
          ))}
        </div>
      )}
      {adminError && <p role="alert" className="rounded border border-[#B8322A]/30 bg-[#B8322A]/5 p-3 text-xs text-[#B8322A]">{adminError}</p>}

      {/* TAB MODERATION QUEUE */}
      {adminTab === 'moderation' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between text-[#795548]">
            <span>Quy trình kiểm duyệt bắt buộc: Kiểm tra tính đúng đắn về văn hóa và cam kết không dùng ảnh AI</span>
            <span className="text-[#397C73] font-semibold">Tự động gắn cờ vi phạm</span>
          </div>

          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {post.user.avatar ? (
                      <img src={post.user.avatar} alt={post.user.display_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div aria-label={post.user.display_name} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBDDCA] font-semibold text-[#795548]">
                        {post.user.display_name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-[#28231F] block">{post.user.display_name}</span>
                      <span className="text-[10px] text-[#795548]">@{post.user.username} · {post.created_at}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      post.moderation_status === 'approved'
                        ? 'bg-[#397C73]/15 text-[#397C73]'
                        : 'bg-[#D8A84E]/20 text-[#795548]'
                    }`}
                  >
                    {post.moderation_status === 'approved' ? '✓ Đã Phê Duyệt' : post.moderation_status === 'hidden' ? 'Đã ẩn' : post.moderation_status === 'rejected' ? 'Đã từ chối' : 'Chờ Xem Xét'}
                  </span>
                </div>

                {postDraft?.id === post.id ? (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-[#795548]">Tiêu đề bài viết
                      <input value={postDraft.title} onChange={(event) => setPostDraft({ ...postDraft, title: event.target.value })} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-2 text-xs text-[#28231F]" />
                    </label>
                    <label className="block text-[10px] font-semibold text-[#795548]">Nội dung bài viết
                      <textarea rows={4} value={postDraft.content} onChange={(event) => setPostDraft({ ...postDraft, content: event.target.value })} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-2 text-xs text-[#28231F]" />
                    </label>
                    <label className="block text-[10px] font-semibold text-[#795548]">Chủ đề / danh mục
                      <input value={postDraft.topic} onChange={(event) => setPostDraft({ ...postDraft, topic: event.target.value })} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-2 text-xs text-[#28231F]" />
                    </label>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setPostDraft(null)} className="rounded border border-[#D8A84E]/40 px-3 py-1 text-[10px] text-[#795548]">Hủy</button>
                      <button onClick={handlePostSave} className="rounded bg-[#354C68] px-3 py-1 text-[10px] font-semibold text-white">Lưu nội dung</button>
                    </div>
                  </div>
                ) : <p className="text-[#28231F]/90 leading-relaxed">{post.content}</p>}

                {post.place_name && (
                  <div className="text-[11px] text-[#795548]">
                    Gắn thẻ địa điểm: <strong className="text-[#28231F]">{post.place_name}</strong>
                  </div>
                )}

                {post.images && post.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {post.images.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 rounded overflow-hidden border border-[#D8A84E]/30 shrink-0">
                        <HeritageImage
                          src={img.image_url}
                          alt="Ảnh người dùng gửi duyệt"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D8A84E]/20">
                  {currentUserRole === 'admin' && (
                    <>
                      <button onClick={() => setPostDraft({ id: post.id, title: post.title || '', content: post.content, topic: post.cultural_topic || '' })} className="inline-flex items-center gap-1 rounded border border-[#354C68]/30 px-3 py-1 text-[#354C68]"><Pencil size={12} />Sửa bài</button>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#397C73]/30 px-3 py-1 text-[#397C73]"><ImageIcon size={12} />Thay ảnh<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => handlePostImageReplace(post.id, event.target.files?.[0])} /></label>
                    </>
                  )}
                  {post.moderation_status === 'pending' && (
                    <>
                      <button onClick={() => onRejectPost(post.id)} className="px-3 py-1 rounded border border-[#B8322A]/40 text-[#B8322A] hover:bg-[#B8322A]/10 cursor-pointer flex items-center gap-1">
                        <XCircle size={12} /> <span>Từ chối</span>
                      </button>
                      <button onClick={() => onApprovePost(post.id)} className="px-3 py-1 bg-[#397C73] text-white rounded hover:bg-[#2F665E] cursor-pointer flex items-center gap-1 font-medium">
                        <CheckCircle size={12} /> <span>Duyệt</span>
                      </button>
                      <button onClick={() => { const note = window.prompt('Nhập nội dung cần tác giả chỉnh sửa:'); if (note?.trim()) api.moderatePost(post.id, 'pending', note.trim()).then(onRefresh).catch((error) => setAdminError(error.message)); }} className="rounded border border-[#D8A84E]/50 px-3 py-1 text-[#795548]">Yêu cầu sửa</button>
                    </>
                  )}
                  {post.moderation_status === 'approved' && (
                    <button onClick={() => api.moderatePost(post.id, 'hidden').then(onRefresh).catch((error) => setAdminError(error.message))} className="px-3 py-1 rounded border border-[#B8322A]/40 text-[#B8322A] flex items-center gap-1">
                      <EyeOff size={12} /> Ẩn bài
                    </button>
                  )}
                  {post.moderation_status === 'hidden' && (
                    <button onClick={() => api.moderatePost(post.id, 'approved').then(onRefresh).catch((error) => setAdminError(error.message))} className="px-3 py-1 rounded border border-[#397C73]/40 text-[#397C73] flex items-center gap-1">
                      <Eye size={12} /> Khôi phục
                    </button>
                  )}
                  {post.moderation_status === 'rejected' && (
                    <>
                      <button onClick={() => api.moderatePost(post.id, 'pending').then(onRefresh).catch((error) => setAdminError(error.message))} className="rounded border border-[#397C73]/40 px-3 py-1 text-[#397C73]">Khôi phục vào hàng chờ</button>
                      {currentUserRole === 'admin' && <button onClick={() => { if (window.confirm('Xóa vĩnh viễn bài viết và tệp đính kèm?')) api.deleteAdminPost(post.id).then(onRefresh).catch((error) => setAdminError(error.message)); }} className="rounded border border-[#B8322A]/40 px-3 py-1 text-[#B8322A]">Xóa vĩnh viễn</button>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB PLACES MANAGEMENT */}
      {adminTab === 'places' && (
        <div className="bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl shadow-xs text-xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#F4EBDD] text-[#795548] uppercase tracking-wider text-[10px] border-b border-[#D8A84E]/30">
                <tr>
                  <th className="p-3">Tên Địa Điểm</th>
                  <th className="p-3">Tỉnh Thành</th>
                  <th className="p-3">Loại Hình</th>
                  <th className="p-3">Chủ Thể Dân Tộc</th>
                  <th className="p-3">Nguồn Xác Minh</th>
                  <th className="p-3 text-right">Thao tác & media</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8A84E]/20">
                {places.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F4EBDD]/40">
                    <td className="p-3 font-semibold text-[#28231F]">
                      {p.name}
                      {p.alternative_names.length > 0 && (
                        <span className="text-[10px] text-[#795548] block font-normal">
                          {p.alternative_names[0]}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[#795548]">{p.province_name}</td>
                    <td className="p-3">
                      <span className="bg-[#EBDDCA]/60 px-2 py-0.5 rounded text-[10px] text-[#28231F]">
                        {p.category_id}
                      </span>
                    </td>
                    <td className="p-3 text-[#795548]">{p.ethnic_context}</td>
                    <td className="p-3 text-[11px] text-[#795548] max-w-xs truncate">
                      {p.visitor_info.verified_source}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenPlaceEdit(p)}
                          className="inline-flex items-center gap-1 rounded border border-[#354C68]/30 px-2 py-1 text-[10px] text-[#354C68]">
                          <Pencil size={11} />
                          Sửa hồ sơ
                        </button>              
                        <span className={`text-[10px] ${p.status === 'published' ? 'text-[#397C73]' : 'text-[#B8322A]'}`}>{p.status === 'published' ? 'Đang công khai' : 'Đang ẩn'}</span>
                        {currentUserRole === 'admin' && <>
                          <button onClick={() => handlePlaceStatus(p)} className="inline-flex items-center gap-1 rounded border border-[#354C68]/30 px-2 py-1 text-[10px] text-[#354C68]">{p.status === 'published' ? <><EyeOff size={11} /> Ẩn</> : <><Eye size={11} /> Công khai</>}</button>
                          <button onClick={() => handlePlaceDelete(p.id)} className="inline-flex items-center gap-1 rounded border border-[#B8322A]/30 px-2 py-1 text-[10px] text-[#B8322A]"><Trash2 size={11} /> Xóa</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB ARTICLES */}
      {adminTab === 'articles' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          {/* Danh sách Bài Viết */}
          <section className="space-y-3 rounded-xl border border-[#D8A84E]/40 bg-[#FAF6EF] p-4">
            <div className="flex items-center justify-between border-b border-[#D8A84E]/30 pb-3">
              <h2 className="font-serif font-bold text-sm text-[#28231F] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={16} className="text-[#354C68]" />
                <span>Danh sách Bài Viết ({articleItems.length})</span>
              </h2>
              <button
                onClick={resetArticleForm}
                className="rounded-lg bg-[#B8322A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#9E2A23] cursor-pointer flex items-center gap-1"
              >
                <Plus size={14} />
                Tạo Bài Viết Mới
              </button>
            </div>

            <div className="divide-y divide-[#D8A84E]/20 max-h-[600px] overflow-y-auto">
              {articleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectArticle(item)}
                  className={`block w-full py-2.5 px-2 text-left text-xs transition-colors rounded-lg ${
                    selectedArticle?.id === item.id ? 'bg-[#F4EBDD] font-bold text-[#B8322A]' : 'text-[#28231F] hover:bg-[#F4EBDD]/50'
                  }`}
                >
                  <span className="block text-sm font-semibold truncate">{item.title}</span>
                  <span className="text-[10px] text-[#795548] font-normal">
                    {(item as any).category || item.topic || 'Di Sản'} · {(item as any).status === 'hidden' ? 'Đã ẩn' : 'Công khai'}
                  </span>
                </button>
              ))}
              {articleItems.length === 0 && (
                <p className="py-8 text-center text-xs text-[#795548]">Chưa có bài viết nào trong hệ thống.</p>
              )}
            </div>
          </section>

          {/* Form Quản lý Bài Viết */}
          <section className="space-y-4 rounded-xl border border-[#D8A84E]/40 bg-[#FAF6EF] p-5">
            <div className="flex items-center justify-between border-b border-[#D8A84E]/30 pb-3">
              <h2 className="font-serif font-bold text-base text-[#28231F]">
                {selectedArticle ? 'Chỉnh sửa Bài Viết' : 'Tạo Bài Viết Mới'}
              </h2>
              {selectedArticle && (
                <button
                  onClick={() => handleEditorialDelete(selectedArticle.id, 'article')}
                  className="rounded-lg p-1.5 text-[#B8322A] hover:bg-[#B8322A]/10 cursor-pointer flex items-center gap-1 text-xs"
                >
                  <Trash2 size={15} /> Xóa Bài
                </button>
              )}
            </div>

            <form onSubmit={handleArticleSave} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Tiêu đề bài viết <span className="text-[#B8322A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={artTitle}
                  onChange={(e) => {
                    setArtTitle(e.target.value);
                    if (!selectedArticle) setArtSlug(slugify(e.target.value));
                  }}
                  placeholder="Nhập tiêu đề bài viết di sản..."
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Slug (Đường dẫn tĩnh tự động)</label>
                  <input
                    type="text"
                    value={artSlug}
                    onChange={(e) => setArtSlug(e.target.value)}
                    placeholder="duong-dan-tinh"
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-[#F4EBDD]/40 text-[#28231F]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Trạng thái hiển thị</label>
                  <select
                    value={artStatus}
                    onChange={(e) => setArtStatus(e.target.value as 'published' | 'hidden')}
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  >
                    <option value="published">Công khai</option>
                    <option value="hidden">Ẩn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#795548]">Tóm tắt nội dung</label>
                <textarea
                  rows={3}
                  value={artSummary}
                  onChange={(e) => setArtSummary(e.target.value)}
                  placeholder="Viết tóm tắt cho bài viết..."
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#795548]">Nội dung bài viết</label>
                <textarea
                  rows={8}
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  placeholder="Nội dung chi tiết của bài viết..."
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#795548]">Ảnh đại diện bài viết</label>
                <div className="rounded-lg border border-[#D8A84E]/50 bg-white p-3 space-y-3">
                  {artCoverImage ? (
                    <img
                      src={artCoverImage}
                      alt="Xem trước ảnh"
                      className="w-full max-h-48 object-cover rounded-lg border border-[#D8A84E]/30"
                    />
                  ) : (
                    <div className="h-28 w-full border border-dashed border-[#D8A84E]/60 rounded-lg flex flex-col items-center justify-center text-[#795548] bg-[#F4EBDD]/30">
                      <ImageIcon size={24} className="mb-1 opacity-60" />
                      <span>Chưa chọn ảnh bài viết</span>
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#354C68]/30 p-2.5 text-xs text-[#354C68] hover:bg-[#F4EBDD] transition-colors">
                    <ImageIcon size={15} />
                    <span>Chọn tệp ảnh từ máy tính</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setArtCoverImage(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Chủ đề / Danh mục</label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="NEW_CUSTOM">＋ Thêm danh mục mới...</option>
                  </select>
                  {artCategory === 'NEW_CUSTOM' && (
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên danh mục mới..."
                      value={artCustomCategory}
                      onChange={(e) => setArtCustomCategory(e.target.value)}
                      className="mt-2 w-full min-w-0 rounded-lg border border-[#B8322A]/60 p-2.5 bg-white text-[#28231F]"
                    />
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Tác giả (Tự do)</label>
                  <input
                    type="text"
                    value={artAuthor}
                    onChange={(e) => setArtAuthor(e.target.value)}
                    placeholder="Ví dụ: TS. Nguyễn Văn A..."
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Thời gian đọc (Tự do)</label>
                  <input
                    type="text"
                    value={artReadTime}
                    onChange={(e) => setArtReadTime(e.target.value)}
                    placeholder="Ví dụ: 5 phút, 10 phút..."
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#D8A84E]/20">
                <button
                  type="button"
                  onClick={resetArticleForm}
                  className="px-4 py-2 text-[#795548] hover:bg-[#EBDDCA] rounded-lg cursor-pointer"
                >
                  Hủy / Làm mới
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#354C68] text-white font-semibold rounded-lg hover:bg-[#2A3D54] cursor-pointer"
                >
                  {selectedArticle ? 'Lưu cập nhật' : 'Tạo mới bài viết'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* TAB JOURNEYS */}
      {adminTab === 'journeys' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          {/* Danh sách Hành Trình */}
          <section className="space-y-3 rounded-xl border border-[#D8A84E]/40 bg-[#FAF6EF] p-4">
            <div className="flex items-center justify-between border-b border-[#D8A84E]/30 pb-3">
              <h2 className="font-serif font-bold text-sm text-[#28231F] uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={16} className="text-[#354C68]" />
                <span>Danh sách Hành Trình ({journeyItems.length})</span>
              </h2>
              <button
                onClick={resetJourneyForm}
                className="rounded-lg bg-[#B8322A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#9E2A23] cursor-pointer flex items-center gap-1"
              >
                <Plus size={14} />
                Tạo Hành Trình Mới
              </button>
            </div>

            <div className="divide-y divide-[#D8A84E]/20 max-h-[600px] overflow-y-auto">
              {journeyItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectJourney(item)}
                  className={`block w-full py-2.5 px-2 text-left text-xs transition-colors rounded-lg ${
                    selectedJourney?.id === item.id ? 'bg-[#F4EBDD] font-bold text-[#B8322A]' : 'text-[#28231F] hover:bg-[#F4EBDD]/50'
                  }`}
                >
                  <span className="block text-sm font-semibold truncate">{item.title}</span>
                  <span className="text-[10px] text-[#795548] font-normal">
                    {item.cultural_theme} · {item.places?.length || 0} điểm dừng
                  </span>
                </button>
              ))}
              {journeyItems.length === 0 && (
                <p className="py-8 text-center text-xs text-[#795548]">Chưa có hành trình nào trong hệ thống.</p>
              )}
            </div>
          </section>

          {/* Form Quản lý Hành Trình */}
          <section className="space-y-4 rounded-xl border border-[#D8A84E]/40 bg-[#FAF6EF] p-5">
            <div className="flex items-center justify-between border-b border-[#D8A84E]/30 pb-3">
              <h2 className="font-serif font-bold text-base text-[#28231F]">
                {selectedJourney ? 'Chỉnh sửa Hành Trình' : 'Tạo Hành Trình Mới'}
              </h2>
              {selectedJourney && (
                <button
                  onClick={() => handleEditorialDelete(selectedJourney.id, 'journey')}
                  className="rounded-lg p-1.5 text-[#B8322A] hover:bg-[#B8322A]/10 cursor-pointer flex items-center gap-1 text-xs"
                >
                  <Trash2 size={15} /> Xóa Hành Trình
                </button>
              )}
            </div>

            <form onSubmit={handleJourneySave} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Tiêu đề hành trình <span className="text-[#B8322A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={jrnTitle}
                  onChange={(e) => {
                    setJrnTitle(e.target.value);
                    if (!selectedJourney) setJrnSlug(slugify(e.target.value));
                  }}
                  placeholder="Nhập tiêu đề chuyến đi khám phá di sản..."
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Slug (Đường dẫn tĩnh tự động)</label>
                  <input
                    type="text"
                    value={jrnSlug}
                    onChange={(e) => setJrnSlug(e.target.value)}
                    placeholder="duong-dan-hanh-trinh"
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-[#F4EBDD]/40 text-[#28231F]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Trạng thái hiển thị</label>
                  <select
                    value={jrnStatus}
                    onChange={(e) => setJrnStatus(e.target.value as 'published' | 'hidden')}
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  >
                    <option value="published">Công khai</option>
                    <option value="hidden">Ẩn</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Tiêu đề phụ / Khẩu hiệu</label>
                  <input
                    type="text"
                    value={jrnSubtitle}
                    onChange={(e) => setJrnSubtitle(e.target.value)}
                    placeholder="Ví dụ: Ngược dòng lịch sử mở cõi..."
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Người / Tổ chức gợi ý (Curator)</label>
                  <input
                    type="text"
                    value={jrnCurator}
                    onChange={(e) => setJrnCurator(e.target.value)}
                    placeholder="Ví dụ: Ban Di Sản Đông Nam Bộ..."
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#795548]">Mô tả tổng quan lộ trình</label>
                <textarea
                  rows={3}
                  value={jrnDescription}
                  onChange={(e) => setJrnDescription(e.target.value)}
                  placeholder="Mô tả các điểm nhấn nổi bật trên cung đường..."
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#795548]">Ảnh đại diện tuyến đi</label>
                <div className="rounded-lg border border-[#D8A84E]/50 bg-white p-3 space-y-3">
                  {jrnCoverImage ? (
                    <img
                      src={jrnCoverImage}
                      alt="Xem trước ảnh tuyến đi"
                      className="w-full max-h-48 object-cover rounded-lg border border-[#D8A84E]/30"
                    />
                  ) : (
                    <div className="h-28 w-full border border-dashed border-[#D8A84E]/60 rounded-lg flex flex-col items-center justify-center text-[#795548] bg-[#F4EBDD]/30">
                      <ImageIcon size={24} className="mb-1 opacity-60" />
                      <span>Chưa chọn ảnh hành trình</span>
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#354C68]/30 p-2.5 text-xs text-[#354C68] hover:bg-[#F4EBDD] transition-colors">
                    <ImageIcon size={15} />
                    <span>Chọn tệp ảnh từ máy tính</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setJrnCoverImage(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Chủ đề văn hóa</label>
                  <select
                    value={jrnCulturalTheme}
                    onChange={(e) => setJrnCulturalTheme(e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  >
                    <option value="Lịch sử & Kiến trúc">Lịch sử & Kiến trúc</option>
                    <option value="Thủ công truyền thống">Thủ công truyền thống</option>
                    <option value="Khảo cổ học & Tín ngưỡng">Khảo cổ học & Tín ngưỡng</option>
                    <option value="Tập quán sông nước">Tập quán sông nước</option>
                    <option value="NEW_CUSTOM">＋ Thêm chủ đề mới...</option>
                  </select>
                  {jrnCulturalTheme === 'NEW_CUSTOM' && (
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên chủ đề văn hóa mới..."
                      value={jrnCustomTheme}
                      onChange={(e) => setJrnCustomTheme(e.target.value)}
                      className="mt-2 w-full min-w-0 rounded-lg border border-[#B8322A]/60 p-2.5 bg-white text-[#28231F]"
                    />
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Thời lượng hành trình (Tự do)</label>
                  <input
                    type="text"
                    value={jrnDuration}
                    onChange={(e) => setJrnDuration(e.target.value)}
                    placeholder="Ví dụ: 1 ngày, 2 ngày 1 đêm, 3 ngày..."
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Chọn các điểm dừng di sản (Đã chọn: {jrnSelectedPlaces.length} điểm)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 bg-white border border-[#D8A84E]/50 rounded-lg">
                  {places.map((place) => {
                    const isChecked = jrnSelectedPlaces.includes(place.id);
                    return (
                      <label
                        key={place.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          isChecked ? 'bg-[#354C68]/10 font-semibold text-[#354C68]' : 'hover:bg-[#F4EBDD]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setJrnSelectedPlaces((prev) => prev.filter((id) => id !== place.id));
                            } else {
                              setJrnSelectedPlaces((prev) => [...prev, place.id]);
                            }
                          }}
                          className="accent-[#354C68]"
                        />
                        <span className="truncate">{place.name} ({place.province_name})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#D8A84E]/20">
                <button
                  type="button"
                  onClick={resetJourneyForm}
                  className="px-4 py-2 text-[#795548] hover:bg-[#EBDDCA] rounded-lg cursor-pointer"
                >
                  Hủy / Làm mới
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#354C68] text-white font-semibold rounded-lg hover:bg-[#2A3D54] cursor-pointer"
                >
                  {selectedJourney ? 'Lưu cập nhật' : 'Tạo mới hành trình'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* TAB USERS */}
      {adminTab === 'users' && currentUserRole === 'admin' && (
        <div className="overflow-x-auto rounded-lg border border-[#D8A84E]/40 bg-[#FAF6EF]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#D8A84E]/30 bg-[#F4EBDD] text-[10px] uppercase text-[#795548]">
              <tr><th className="p-3">Tài khoản</th><th className="p-3">Email</th><th className="p-3">Vai trò</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-[#D8A84E]/20">
              {adminUsers.map((user) => (
                <tr key={user.id}>
                  <td className="p-3 font-semibold text-[#28231F]">{user.display_name}<span className="block text-[10px] font-normal text-[#795548]">@{user.username}</span></td>
                  <td className="p-3 text-[#795548]">{user.email}</td>
                  <td className="p-3"><select value={user.role} disabled={user.id === currentUserId} onChange={(event) => handleUserUpdate(user.id, { role: event.target.value as UserRole })} className="rounded border border-[#D8A84E]/40 bg-white p-1"><option value="user">User</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></td>
                  <td className="p-3">{user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}</td>
                  <td className="p-3"><button disabled={user.id === currentUserId} onClick={() => handleUserUpdate(user.id, { status: user.status === 'active' ? 'locked' : 'active' })} className="rounded border border-[#354C68]/30 px-2 py-1 text-[#354C68] disabled:opacity-40">{user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {adminUsers.length === 0 && <p className="p-6 text-center text-xs text-[#795548]">Chưa có tài khoản.</p>}
        </div>
      )}

      {/* TAB COMMENTS */}
      {adminTab === 'comments' && (
        <div className="space-y-3">
          {adminComments.map((comment) => (
            <article key={comment.id} className="rounded-lg border border-[#D8A84E]/40 bg-[#FAF6EF] p-4">
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-semibold text-[#28231F]">{comment.display_name} <span className="font-normal text-[#795548]">@{comment.username}</span></p><p className="mt-2 text-sm text-[#28231F]">{comment.content}</p><p className="mt-1 text-[10px] text-[#795548]">{comment.created_at} · {comment.status}</p></div>
                <div className="flex shrink-0 gap-2">
                  {comment.status === 'pending' && <button onClick={() => handleCommentUpdate(comment.id, 'approved')} className="rounded bg-[#397C73] px-2 py-1 text-[10px] font-semibold text-white">Duyệt</button>}
                  {comment.status !== 'hidden' && <button onClick={() => handleCommentUpdate(comment.id, 'hidden')} className="rounded border border-[#B8322A]/40 px-2 py-1 text-[10px] text-[#B8322A]">Ẩn</button>}
                  {comment.status === 'hidden' && <button onClick={() => handleCommentUpdate(comment.id, 'approved')} className="rounded border border-[#397C73]/40 px-2 py-1 text-[10px] text-[#397C73]">Khôi phục</button>}
                </div>
              </div>
            </article>
          ))}
          {adminComments.length === 0 && <p className="py-10 text-center text-xs text-[#795548]">Chưa có bình luận.</p>}
        </div>
      )}

      {/* TAB UPLOADS */}
      {adminTab === 'uploads' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {adminMedia.map((media) => (
            <article key={media.id} className="flex gap-3 rounded-lg border border-[#D8A84E]/40 bg-[#FAF6EF] p-3">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded border border-[#D8A84E]/30"><HeritageImage src={media.image_url} alt={media.original_name} className="h-full w-full object-cover" /></div>
              <div className="min-w-0 flex-1 text-[11px]">
                <p className="truncate font-semibold text-[#28231F]">{media.original_name}</p>
                <p className="text-[#795548]">{media.mime_type} · {media.place_name || (media.post_id ? `Bài ${media.moderation_status || 'chưa rõ trạng thái'}` : 'Chưa gắn nội dung')}</p>
                <p className="text-[#795548]">{media.display_name} · {(media.size_bytes / 1024).toFixed(0)} KB</p>
                <button onClick={() => handleMediaDelete(media.id)} className="mt-2 inline-flex items-center gap-1 rounded border border-[#B8322A]/40 px-2 py-1 text-[#B8322A]"><Trash2 size={11} />Gỡ tệp</button>
              </div>
            </article>
          ))}
          {adminMedia.length === 0 && <p className="col-span-full py-10 text-center text-xs text-[#795548]">Chưa có tệp tải lên.</p>}
        </div>
      )}

      {/* POPUP MODAL DÙNG CHUNG CHO ĐỊA ĐIỂM */}
      {(showAddPlaceModal || selectedPlace) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#28231F]/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="flex flex-col w-full max-w-3xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden rounded-xl border border-[#B8322A] bg-[#FAF6EF] shadow-2xl text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#D8A84E]/30 p-4 sm:p-5 shrink-0">
              <h3 className="font-serif font-bold text-base text-[#28231F]">
                {selectedPlace ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm mới'}
              </h3>
              <button
                type="button"
                onClick={resetPlaceForm}
                className="text-[#795548] hover:text-[#28231F] cursor-pointer font-semibold"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Form & Modal Content */}
            <form
              onSubmit={selectedPlace ? handlePlaceSave : handleCreatePlace}
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4"
            >
              {adminError && (
                <p role="alert" className="rounded border border-[#B8322A]/30 bg-[#B8322A]/5 p-3 text-xs text-[#B8322A]">
                  {adminError}
                </p>
              )}

              {/* Tên địa điểm */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Tên địa điểm <span className="text-[#B8322A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Làng Gốm Lái Thiêu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              {/* Tên gọi khác */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Tên gọi khác
                </label>
                <input
                  type="text"
                  value={altNames}
                  onChange={(e) => setAltNames(e.target.value)}
                  placeholder="Tên gọi khác, phân cách bằng dấu phẩy"
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              {/* Tỉnh thành & Loại hình */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">
                    Tỉnh / Thành phố <span className="text-[#B8322A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={provinceName}
                    onChange={(e) => setProvinceName(e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">
                    Loại hình di sản <span className="text-[#B8322A]">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value as HeritageCategory)}
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Khu vực */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Khu vực (Region ID)
                </label>
                <input
                  type="text"
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  placeholder="dong-nam-bo"
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">Địa chỉ</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Địa chỉ chi tiết của địa điểm"
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              {/* Tọa độ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  />
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Mô tả ngắn gọn <span className="text-[#B8322A]">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              {/* Lịch sử */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">Bối cảnh lịch sử</label>
                <textarea
                  rows={4}
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  placeholder="Lịch sử hình thành và phát triển..."
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              {/* Giá trị văn hóa & Ý nghĩa di sản */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Giá trị văn hóa & Ý nghĩa di sản
                </label>
                <textarea
                  rows={3}
                  value={culturalSignificance}
                  onChange={(e) => setCulturalSignificance(e.target.value)}
                  placeholder="Ý nghĩa văn hóa, giá trị tâm linh, nghi lễ..."
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              {/* Đặc điểm kiến trúc */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Đặc điểm kiến trúc & Nghệ thuật
                </label>
                <textarea
                  rows={3}
                  value={architectureFeatures}
                  onChange={(e) => setArchitectureFeatures(e.target.value)}
                  placeholder="Phong cách kiến trúc, hoa văn trang trí, vật liệu xây dựng..."
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              {/* Bối cảnh dân tộc */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">Bối cảnh dân tộc</label>
                <input
                  type="text"
                  value={ethnicContext}
                  onChange={(e) => setEthnicContext(e.target.value)}
                  placeholder="Kinh, Hoa..."
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              {/* Nguồn xác minh */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Nguồn xác minh tư liệu <span className="text-[#B8322A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={verifiedSource}
                  onChange={(e) => setVerifiedSource(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                />
              </div>

              {/* Thông tin tham quan (Giờ mở cửa & Giá vé) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Giờ mở cửa</label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="Ví dụ: 07:30 - 17:00"
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#795548]">Giá vé tham quan</label>
                  <input
                    type="text"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="Ví dụ: Miễn phí / 30.000 VNĐ"
                    className="w-full min-w-0 rounded-lg border border-[#D8A84E]/50 p-3 bg-white text-[#28231F]"
                  />
                </div>
              </div>

              {/* Ảnh địa điểm */}
              <div>
                <label className="block mb-1 font-semibold text-[#795548]">
                  Ảnh đại diện địa điểm {!selectedPlace && <span className="text-[#B8322A]">*</span>}
                </label>
                
                {selectedPlace ? (
                  <div className="rounded-lg border border-[#D8A84E]/40 bg-white p-3 space-y-3">
                    <img
                      src={
                        editImagePreview ||
                        selectedPlace.media?.[0]?.image_url ||
                        ''
                      }
                      alt={selectedPlace.name}
                      className="w-full max-h-48 object-cover rounded-lg"
                    />
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#354C68]/30 p-2.5 text-xs text-[#354C68] hover:bg-[#F4EBDD]">
                      <ImageIcon size={16} />
                      Thay ảnh hiện tại
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            setAdminError('Ảnh không được vượt quá 5MB.');
                            e.target.value = '';
                            return;
                          }
                          setEditImageFile(file);
                          setEditImagePreview(URL.createObjectURL(file));
                          setAdminError('');
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      required
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setMediaFile(file);
                        setMediaPreview(file ? URL.createObjectURL(file) : '');
                      }}
                      className="w-full min-w-0 p-2 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded text-[#28231F]"
                    />
                    {mediaPreview && (
                      <img
                        src={mediaPreview}
                        alt="Xem trước ảnh địa điểm"
                        className="mt-2 max-h-40 w-full rounded object-contain bg-[#EBDDCA]"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-[#D8A84E]/20">
                <button
                  type="button"
                  onClick={resetPlaceForm}
                  className="px-4 py-2 text-[#795548] hover:bg-[#EBDDCA] rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B8322A] text-white font-semibold rounded-lg hover:bg-[#9E2A23] cursor-pointer"
                >
                  {selectedPlace ? 'Lưu thay đổi' : 'Tạo hồ sơ địa điểm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};