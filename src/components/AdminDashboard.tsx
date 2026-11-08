import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Compass,
  FileCheck,
  Eye,
  ExternalLink,
  Users,
  Building,
  Pencil,
  Trash2,
  EyeOff,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { CulturalArticle, Journey, Place, Post, UserRole, HeritageCategory } from '../types';
import { CATEGORIES } from '../data/heritageData';
import { DongSonStar, HoaSenMotif } from './VietnamFolkMotifs';
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
  const [adminTab, setAdminTab] = useState<'moderation' | 'places' | 'media-audit' | 'users' | 'comments' | 'editorial' | 'uploads'>('moderation');
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; email: string; username: string; display_name: string; role: UserRole; status: 'active' | 'locked' }>>([]);
  const [adminComments, setAdminComments] = useState<Array<{ id: string; content: string; status: string; display_name: string; username: string; created_at: string }>>([]);
  const [adminMedia, setAdminMedia] = useState<Array<{ id: string; post_id: string | null; place_id: string | null; image_url: string; original_name: string; mime_type: string; size_bytes: number; username: string; display_name: string; moderation_status: string | null; place_name: string | null }>>([]);
  const [editorialKind, setEditorialKind] = useState<'article' | 'journey'>('article');
  const [editorialItems, setEditorialItems] = useState<Array<CulturalArticle | Journey>>([]);
  const [selectedEditorial, setSelectedEditorial] = useState<CulturalArticle | Journey | null>(null);
  const [editorialJson, setEditorialJson] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [placeJson, setPlaceJson] = useState('');
  const [adminError, setAdminError] = useState('');
  const [dashboardStats, setDashboardStats] = useState<{ users: number; pendingPosts: number; pendingComments: number; places: number; media: number } | null>(null);
  const [postDraft, setPostDraft] = useState<{ id: string; title: string; content: string; topic: string } | null>(null);

  // New place form state
  const [name, setName] = useState('');
  const [altNames, setAltNames] = useState('');
  const [provinceName, setProvinceName] = useState('Cần Thơ');
  const [regionId, setRegionId] = useState('dong-bang-song-cuu-long');
  const [categoryId, setCategoryId] = useState<HeritageCategory>('di-tich-lich-su');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('10.0');
  const [lng, setLng] = useState('105.7');
  const [shortDesc, setShortDesc] = useState('');
  const [history, setHistory] = useState('');
  const [ethnicContext, setEthnicContext] = useState('Kinh, Khmer');
  const [verifiedSource, setVerifiedSource] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState('');

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
        } else if (adminTab === 'editorial') {
          const result = await api.adminEditorial(editorialKind);
          if (active) setEditorialItems(result.items);
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
  }, [adminTab, currentUserRole, editorialKind]);

  const handleUserUpdate = async (userId: string, changes: { role?: UserRole; status?: 'active' | 'locked' }) => {
    try {
      await api.updateUser(userId, changes);
      const result = await api.adminUsers();
      setAdminUsers(result.users as typeof adminUsers);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể cập nhật tài khoản.');
    }
  };

  const handleEditorialSave = async () => {
    try {
      const item = JSON.parse(editorialJson) as Partial<CulturalArticle | Journey>;
      const result = await api.saveEditorial({ ...item, kind: editorialKind } as Partial<CulturalArticle | Journey> & { kind: 'article' | 'journey' }, selectedEditorial?.id);
      setSelectedEditorial(result.item);
      setEditorialJson(JSON.stringify(result.item, null, 2));
      const refreshed = await api.adminEditorial(editorialKind);
      setEditorialItems(refreshed.items);
      setAdminError('');
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'JSON nội dung không hợp lệ.');
    }
  };

  const handleEditorialDelete = async (itemId: string) => {
    try {
      await api.deleteEditorial(itemId);
      setSelectedEditorial(null);
      setEditorialJson('');
      setEditorialItems((items) => items.filter((item) => item.id !== itemId));
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể xóa nội dung.');
    }
  };

  const handlePlaceSave = async () => {
    if (!selectedPlace) return;
    try {
      const editedPlace = JSON.parse(placeJson) as Place;
      await api.updatePlace(selectedPlace.id, editedPlace);
      await onRefresh();
      setSelectedPlace(null);
      setPlaceJson('');
      setAdminError('');
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'JSON địa điểm không hợp lệ.');
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

  const handlePlaceImageUpload = async (placeId: string, file?: File) => {
    if (!file) return;
    try {
      await api.uploadPlaceMedia(placeId, file);
      await onRefresh();
      const result = await api.adminMedia();
      setAdminMedia(result.items);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
    }
  };

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mediaFile) return;

    const newPlace: Place = {
      id: `place-${Date.now()}`,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      alternative_names: altNames ? altNames.split(',').map((s) => s.trim()) : [],
      province_id: provinceName.toLowerCase().replace(/\s+/g, '-'),
      province_name: provinceName,
      region_id: regionId,
      category_id: categoryId,
      coordinates: {
        lat: parseFloat(lat) || 10.0,
        lng: parseFloat(lng) || 105.7,
      },
      address: address.trim(),
      short_description: shortDesc.trim(),
      historical_background: history.trim(),
      cultural_significance: 'Giá trị di sản văn hóa đặc sắc của địa phương',
      architecture_features: 'Kiến trúc truyền thống mang đậm bản sắc Nam Bộ',
      ethnic_context: ethnicContext.trim(),
      visitor_info: {
        verified_source: verifiedSource.trim(),
      },
      verification_status: 'pending',
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
      await api.uploadPlaceMedia(createdPlace.id, mediaFile);
      await onRefresh();
      setShowAddPlaceModal(false);
      setName('');
      setAltNames('');
      setShortDesc('');
      setMediaFile(null);
      setMediaPreview('');
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
            onClick={() => setShowAddPlaceModal(true)}
            className="px-4 py-2 bg-[#B8322A] text-white rounded-lg text-xs font-semibold hover:bg-[#9E2A23] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>Thêm Địa Điểm Di Sản Mới</span>
          </button>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center overflow-x-auto border-b border-[#D8A84E]/30 text-xs gap-1">
        <button
          onClick={() => setAdminTab('moderation')}
          className={`py-2 px-3.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
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
          className={`py-2 px-3.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            adminTab === 'places'
              ? 'border-[#354C68] text-[#354C68]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <Building size={14} />
          <span>Quản Lý Địa Điểm ({places.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('media-audit')}
          className={`py-2 px-3.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            adminTab === 'media-audit'
              ? 'border-[#354C68] text-[#354C68]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Kiểm Tra Bản Quyền & Nguồn Media</span>
        </button>

        <button onClick={() => setAdminTab('comments')} className={`py-2 px-3.5 font-semibold border-b-2 cursor-pointer whitespace-nowrap ${adminTab === 'comments' ? 'border-[#354C68] text-[#354C68]' : 'border-transparent text-[#795548]'}`}>
          Bình luận ({adminComments.filter((comment) => comment.status === 'pending').length})
        </button>
        <button onClick={() => setAdminTab('uploads')} className={`py-2 px-3.5 font-semibold border-b-2 cursor-pointer whitespace-nowrap ${adminTab === 'uploads' ? 'border-[#354C68] text-[#354C68]' : 'border-transparent text-[#795548]'}`}>
          Media
        </button>
        <button onClick={() => setAdminTab('editorial')} className={`py-2 px-3.5 font-semibold border-b-2 cursor-pointer whitespace-nowrap ${adminTab === 'editorial' ? 'border-[#354C68] text-[#354C68]' : 'border-transparent text-[#795548]'}`}>
          Bài viết & hành trình
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

      {/* TAB 1: MODERATION QUEUE */}
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

      {/* TAB 2: PLACES MANAGEMENT TABLE */}
      {adminTab === 'places' && (
        <div className="bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl overflow-hidden shadow-xs text-xs">
          <table className="w-full text-left">
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
                      <button onClick={() => { setSelectedPlace(p); setPlaceJson(JSON.stringify(p, null, 2)); }} className="inline-flex items-center gap-1 rounded border border-[#354C68]/30 px-2 py-1 text-[10px] text-[#354C68]">
                        <Pencil size={11} /> Sửa hồ sơ
                      </button>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#397C73]/30 px-2 py-1 text-[10px] text-[#397C73]">
                        <ImageIcon size={11} /> Thêm media
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf" className="sr-only" onChange={(event) => handlePlaceImageUpload(p.id, event.target.files?.[0])} />
                      </label>
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
      )}

      {adminTab === 'places' && selectedPlace && (
        <section className="space-y-3 rounded-lg border border-[#D8A84E]/40 bg-[#FAF6EF] p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-[#28231F]">Chỉnh sửa: {selectedPlace.name}</h2>
            <button onClick={() => setSelectedPlace(null)} aria-label="Đóng bộ sửa" className="p-2 text-[#795548]"><XCircle size={16} /></button>
          </div>
          <label className="block text-[11px] font-semibold text-[#795548]">Hồ sơ JSON
            <textarea value={placeJson} onChange={(event) => setPlaceJson(event.target.value)} rows={16} spellCheck={false} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-3 font-mono text-[11px] text-[#28231F]" />
          </label>
          <button onClick={handlePlaceSave} className="rounded bg-[#354C68] px-4 py-2 text-xs font-semibold text-white">Lưu thay đổi</button>
        </section>
      )}

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

      {adminTab === 'editorial' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
          <section className="space-y-3 rounded-lg border border-[#D8A84E]/40 bg-[#FAF6EF] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1">
                <button onClick={() => { setEditorialKind('article'); setSelectedEditorial(null); setEditorialJson(''); }} className={`rounded px-2 py-1 text-[11px] ${editorialKind === 'article' ? 'bg-[#354C68] text-white' : 'text-[#795548]'}`}>Bài viết</button>
                <button onClick={() => { setEditorialKind('journey'); setSelectedEditorial(null); setEditorialJson(''); }} className={`rounded px-2 py-1 text-[11px] ${editorialKind === 'journey' ? 'bg-[#354C68] text-white' : 'text-[#795548]'}`}>Hành trình</button>
              </div>
              <button onClick={() => { setSelectedEditorial(null); setEditorialJson(JSON.stringify({ slug: '', title: '', status: 'hidden' }, null, 2)); }} className="rounded bg-[#B8322A] px-2 py-1 text-[10px] font-semibold text-white"><Plus size={12} className="mr-1 inline" />Mới</button>
            </div>
            <div className="divide-y divide-[#D8A84E]/20">
              {editorialItems.map((item) => (
                <button key={item.id} onClick={() => { setSelectedEditorial(item); setEditorialJson(JSON.stringify(item, null, 2)); }} className={`block w-full py-2 text-left text-xs ${selectedEditorial?.id === item.id ? 'font-semibold text-[#B8322A]' : 'text-[#28231F]'}`}>
                  {item.title}<span className="block text-[10px] font-normal text-[#795548]">{(item as CulturalArticle & { status?: string }).status || 'published'}</span>
                </button>
              ))}
              {editorialItems.length === 0 && <p className="py-5 text-xs text-[#795548]">Chưa có nội dung trong DB.</p>}
            </div>
          </section>
          <section className="space-y-3 rounded-lg border border-[#D8A84E]/40 bg-[#FAF6EF] p-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif font-bold text-[#28231F]">{selectedEditorial?.title || 'Nội dung mới'}</h2>
              {selectedEditorial && <button onClick={() => handleEditorialDelete(selectedEditorial.id)} aria-label="Xóa nội dung" className="rounded p-2 text-[#B8322A]"><Trash2 size={15} /></button>}
            </div>
            <label className="block text-[11px] font-semibold text-[#795548]">Nội dung JSON
              <textarea value={editorialJson} onChange={(event) => setEditorialJson(event.target.value)} rows={22} spellCheck={false} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-3 font-mono text-[11px] text-[#28231F]" />
            </label>
            <button disabled={!editorialJson.trim()} onClick={handleEditorialSave} className="rounded bg-[#354C68] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Lưu nội dung</button>
          </section>
        </div>
      )}

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

      {/* TAB 3: MEDIA LICENSE AUDIT TABLE */}
      {adminTab === 'media-audit' && (
        <div className="bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl p-5 space-y-4 text-xs">
          <div className="p-3.5 bg-[#397C73]/10 border border-[#397C73]/30 rounded-lg text-xs leading-relaxed text-[#28231F]">
            <strong>Quy Định Kiểm Soát Bản Quyền (§XV Master Prompt):</strong> Mọi hình ảnh hiển thị trên nền tảng bắt buộc phải có nguồn tư liệu thực tế (Wikimedia Commons, Flickr Commons, Viện khảo cổ, Cục Di sản hoặc ảnh chụp thực địa). Tuyệt đối cấm sử dụng ảnh tạo bởi các mô hình AI generative.
          </div>

          <div className="space-y-3">
            {places.map((place) => (
              <div key={place.id} className="p-3 border border-[#D8A84E]/30 rounded-lg bg-[#F4EBDD]/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-sm text-[#28231F]">
                  <span>{place.name} ({place.province_name})</span>
                  <span className="text-[11px] text-[#397C73] font-normal">{place.media.length} tư liệu hình ảnh</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {place.media.map((med, i) => (
                    <div key={i} className="flex gap-2.5 p-2 bg-[#FAF6EF] rounded border border-[#D8A84E]/30 items-center">
                      <div className="w-14 h-14 rounded overflow-hidden shrink-0 border border-[#D8A84E]/20">
                        <HeritageImage src={med.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[11px] min-w-0">
                        <p className="font-semibold text-[#28231F] truncate">{med.caption || place.name}</p>
                        <p className="text-[#795548]">Tác giả: {med.photographer || 'Cơ quan quản lý'}</p>
                        <p className="text-[#397C73] font-medium">Giấy phép: {med.license_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD PLACE MODAL */}
      {showAddPlaceModal && (
        <div className="fixed inset-0 z-50 bg-[#28231F]/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-[#FAF6EF] border border-[#B8322A] rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8A84E]/30 pb-2">
              <h3 className="font-serif font-bold text-base text-[#28231F]">
                Nhập Hồ Sơ Địa Điểm Di Sản Mới
              </h3>
              <button
                onClick={() => setShowAddPlaceModal(false)}
                className="text-[#795548] hover:text-[#28231F] cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <form onSubmit={handleCreatePlace} className="space-y-3">
              <div>
                <label className="font-semibold text-[#795548] block mb-1">Tên địa điểm:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Làng Gốm Lái Thiêu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded text-[#28231F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#795548] block mb-1">Tỉnh thành:</label>
                  <input
                    type="text"
                    value={provinceName}
                    onChange={(e) => setProvinceName(e.target.value)}
                    className="w-full p-2 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded text-[#28231F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#795548] block mb-1">Loại hình:</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value as HeritageCategory)}
                    className="w-full p-2 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded text-[#28231F]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#795548] block mb-1">Mô tả ngắn gọn:</label>
                <textarea
                  rows={2}
                  required
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full p-2 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded text-[#28231F]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#795548] block mb-1">Nguồn xác minh tư liệu:</label>
                <input
                  type="text"
                  required
                  value={verifiedSource}
                  onChange={(e) => setVerifiedSource(e.target.value)}
                  className="w-full p-2 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded text-[#28231F]"
                />
              </div>

              <div>
                <label htmlFor="new-place-image" className="font-semibold text-[#795548] block mb-1">Ảnh địa điểm (bắt buộc):</label>
                <input
                  id="new-place-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  required
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setMediaFile(file);
                    setMediaPreview(file ? URL.createObjectURL(file) : '');
                  }}
                  className="w-full p-2 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded text-[#28231F]"
                />
                {mediaPreview && <img src={mediaPreview} alt="Xem trước ảnh địa điểm" className="mt-2 max-h-40 w-full rounded object-contain bg-[#EBDDCA]" />}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#D8A84E]/20">
                <button
                  type="button"
                  onClick={() => setShowAddPlaceModal(false)}
                  className="px-3 py-1.5 text-[#795548] hover:bg-[#EBDDCA] rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#B8322A] text-white font-semibold rounded hover:bg-[#9E2A23] cursor-pointer"
                >
                  Lưu Vào Cơ Sở Dữ Liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
