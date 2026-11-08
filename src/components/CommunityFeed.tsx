import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  Star,
  MapPin,
  Image as ImageIcon,
  Send,
  Plus,
  ShieldCheck,
  CheckCircle,
  Filter,
} from 'lucide-react';
import { Post, Place, User } from '../types';
import { HoaSenMotif } from './VietnamFolkMotifs';
import { HeritageImage } from './HeritageImage';

interface CommunityFeedProps {
  posts: Post[];
  places: Place[];
  currentUser: User;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onSavePost: (postId: string) => void;
  onCreatePost: (newPostData: {
    title: string;
    content: string;
    place_id?: string;
    cultural_topic?: string;
    is_review: boolean;
    rating?: number;
    visit_date?: string;
    image: File;
  }) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onSelectPlace: (place: Place) => void;
  openCreateModalTrigger?: number;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  posts,
  places,
  currentUser,
  onLikePost,
  onAddComment,
  onSavePost,
  onCreatePost,
  onDeletePost,
  onSelectPlace,
  openCreateModalTrigger = 0,
}) => {
  const [feedFilter, setFeedFilter] = useState<'all' | 'reviews' | 'stories'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (openCreateModalTrigger > 0) {
      setShowCreateModal(true);
    }
  }, [openCreateModalTrigger]);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Create Post Form States
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [culturalTopic, setCulturalTopic] = useState('Văn hóa sông nước');
  const [isReview, setIsReview] = useState(true);
  const [rating, setRating] = useState(5);
  const [visitDate, setVisitDate] = useState('2026-11-05');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const filteredPosts = posts.filter((p) => {
    if (feedFilter === 'reviews') return p.is_review;
    if (feedFilter === 'stories') return !p.is_review;
    return true;
  });

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim() || !imageFile || !imageLoaded) return;

    setSubmitError('');
    try {
      await onCreatePost({
        title: postTitle.trim(),
        content: postContent.trim(),
        place_id: selectedPlaceId || undefined,
        cultural_topic: culturalTopic,
        is_review: isReview,
        rating: isReview ? rating : undefined,
        visit_date: isReview ? visitDate : undefined,
        image: imageFile,
      });

      setPostContent('');
      setPostTitle('');
      setSelectedPlaceId('');
      setImageFile(null);
      setImagePreview('');
      setImageLoaded(false);
      setImageError(false);
      setShowCreateModal(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể gửi bài viết.');
    }
  };

  const handleSendComment = (postId: string) => {
    if (!commentInput.trim()) return;
    onAddComment(postId, commentInput.trim());
    setCommentInput('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Community Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8A84E]/30 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8322A] font-bold">
            <HoaSenMotif size={16} />
            <span>MẠNG XÃ HỘI DI SẢN CỘNG ĐỒNG</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#28231F] mt-1">
            Góc Kể Chuyện & Đánh Giá Thực Tế
          </h1>
          <p className="text-xs text-[#795548] mt-1">
            Chia sẻ cảm nhận, góc nhìn và hình ảnh chân thực về các di tích, lễ hội và làng nghề quê hương.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#B8322A] text-white rounded-lg text-xs font-semibold hover:bg-[#9E2A23] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Đăng Bài / Đánh Giá</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D8A84E]/20 pb-2 text-xs">
        <button
          onClick={() => setFeedFilter('all')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            feedFilter === 'all'
              ? 'bg-[#B8322A] text-white font-medium'
              : 'text-[#795548] hover:text-[#28231F] bg-[#FAF6EF]'
          }`}
        >
          Tất Cả Bài Viết ({posts.length})
        </button>

        <button
          onClick={() => setFeedFilter('reviews')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            feedFilter === 'reviews'
              ? 'bg-[#B8322A] text-white font-medium'
              : 'text-[#795548] hover:text-[#28231F] bg-[#FAF6EF]'
          }`}
        >
          Đánh Giá Địa Điểm
        </button>

        <button
          onClick={() => setFeedFilter('stories')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            feedFilter === 'stories'
              ? 'bg-[#B8322A] text-white font-medium'
              : 'text-[#795548] hover:text-[#28231F] bg-[#FAF6EF]'
          }`}
        >
          Ghi Chép Văn Hóa
        </button>
      </div>

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#28231F]/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-[#FAF6EF] border border-[#D8A84E] rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D8A84E]/30 pb-2">
              <h3 className="font-serif font-bold text-base text-[#28231F]">
                Đăng Trải Nghiệm & Đánh Giá Di Sản
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-[#795548] hover:text-[#28231F] cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="space-y-4 text-xs">
              {/* Select Place to tag */}
              <div>
                <label className="font-semibold text-[#795548] block mb-1">
                  Gắn thẻ Địa điểm di sản (Place ID):
                </label>
                <select
                  value={selectedPlaceId}
                  onChange={(e) => setSelectedPlaceId(e.target.value)}
                  className="w-full p-2 rounded bg-[#F4EBDD] border border-[#D8A84E]/50 text-[#28231F]"
                >
                  <option value="">-- Không gắn thẻ địa điểm cụ thể --</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.province_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Review Mode */}
              <div className="flex items-center gap-4 p-2.5 bg-[#F4EBDD] rounded border border-[#D8A84E]/30">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#28231F]">
                  <input
                    type="checkbox"
                    checked={isReview}
                    onChange={(e) => setIsReview(e.target.checked)}
                    className="accent-[#B8322A]"
                  />
                  <span>Đây là bài đánh giá địa điểm (kèm số sao & ngày ghé thăm)</span>
                </label>
              </div>

              {/* If review mode, show rating and visit date */}
              {isReview && (
                <div className="grid grid-cols-2 gap-3 p-2.5 bg-[#FAF6EF] border border-[#D8A84E]/40 rounded">
                  <div>
                    <label className="font-semibold text-[#795548] block mb-1">Đánh giá sao:</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="cursor-pointer text-[#B8322A]"
                        >
                          <Star
                            size={18}
                            className={s <= rating ? 'fill-[#B8322A]' : 'stroke-[#D8A84E]'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-[#795548] block mb-1">Ngày ghé thăm:</label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full p-1.5 rounded bg-[#F4EBDD] border border-[#D8A84E]/40 text-[#28231F]"
                    />
                  </div>
                </div>
              )}

              {/* Content textarea */}
              <div>
                <label className="font-semibold text-[#795548] block mb-1">Tiêu đề bài viết:</label>
                <input required minLength={2} maxLength={160} value={postTitle} onChange={(event) => setPostTitle(event.target.value)} className="mb-3 w-full rounded border border-[#D8A84E]/50 bg-[#F4EBDD] p-2.5 text-[#28231F]" />
                <label className="font-semibold text-[#795548] block mb-1">
                  Nội dung chia sẻ hoặc cảm nhận:
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Kể về trải nghiệm thực tế, nét đẹp văn hóa hoặc điều bạn ấn tượng nhất..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full p-2.5 rounded bg-[#F4EBDD] border border-[#D8A84E]/50 text-[#28231F] leading-relaxed"
                />
              </div>

              {/* Require a selected image that decodes before allowing a post. */}
              <div>
                <label htmlFor="post-image-file" className="font-semibold text-[#795548] block mb-1">
                  Ảnh trải nghiệm (bắt buộc, tối đa 8 MB):
                </label>
                <input
                  id="post-image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  required
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] || null;
                    setImageFile(selectedFile);
                    setImagePreview(selectedFile ? URL.createObjectURL(selectedFile) : '');
                    setImageLoaded(false);
                    setImageError(false);
                  }}
                  className="w-full p-2 rounded bg-[#F4EBDD] border border-[#D8A84E]/50 text-[#28231F]"
                />
                {imagePreview && (
                  <div className="mt-2 overflow-hidden rounded border border-[#D8A84E]/40">
                    <img
                      src={imagePreview}
                      alt="Xem trước ảnh bài đăng"
                      className="max-h-52 w-full object-contain bg-[#EBDDCA]"
                      onLoad={() => {
                        setImageLoaded(true);
                        setImageError(false);
                      }}
                      onError={() => {
                        setImageLoaded(false);
                        setImageError(true);
                      }}
                    />
                    {imageError && (
                      <p className="px-2 py-1 text-[11px] text-[#B8322A]" role="alert">
                        Không tải được ảnh này. Hãy nhập URL ảnh khác.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#D8A84E]/20">
                {submitError && <p role="alert" className="mr-auto self-center text-[11px] text-[#B8322A]">{submitError}</p>}
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-[#795548] hover:bg-[#EBDDCA] rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!postTitle.trim() || !postContent.trim() || !imageFile || !imageLoaded}
                  className="px-4 py-1.5 bg-[#B8322A] text-white font-semibold rounded hover:bg-[#9E2A23] disabled:opacity-50 cursor-pointer"
                >
                  Đăng Lên Cộng Đồng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-5">
        {filteredPosts.map((post) => {
          const linkedPlace = places.find((p) => p.id === post.place_id);

          return (
            <article
              key={post.id}
              className="bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs"
            >
              {/* Post Author Strip */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {post.user.avatar ? (
                    <img src={post.user.avatar} alt={post.user.display_name} className="w-9 h-9 rounded-full object-cover border border-[#D8A84E]/40" />
                  ) : (
                    <div aria-label={post.user.display_name} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8A84E]/40 bg-[#EBDDCA] font-semibold text-[#795548]">
                      {post.user.display_name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-[#28231F]">
                        {post.user.display_name}
                      </span>
                      {post.user.role === 'moderator' && (
                        <span className="text-[10px] text-[#397C73] font-semibold bg-[#397C73]/10 px-1.5 py-0.2 rounded">
                          Kiểm duyệt viên
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#795548] flex items-center gap-1">
                      <span>{post.created_at}</span>
                      {post.cultural_topic && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#B8322A]">{post.cultural_topic}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating Badge if Review */}
                {post.is_review && post.rating && (
                  <div className="flex items-center gap-1 bg-[#B8322A]/10 border border-[#B8322A]/30 px-2 py-0.5 rounded text-xs font-bold text-[#B8322A]">
                    <Star size={12} className="fill-[#B8322A]" />
                    <span>{post.rating}.0 / 5</span>
                  </div>
                )}
              </div>

              {post.user.id === currentUser.id && post.moderation_status !== 'approved' && (
                <p role="status" className="rounded border border-[#D8A84E]/30 bg-[#F4EBDD] p-2 text-[11px] text-[#795548]">
                  Trạng thái: {post.moderation_status === 'pending' ? 'Chờ kiểm duyệt' : post.moderation_status === 'rejected' ? 'Bị từ chối' : 'Đang ẩn'}
                  {post.moderation_note && <span className="block mt-1">Ghi chú: {post.moderation_note}</span>}
                </p>
              )}

              {post.title && <h2 className="font-serif text-base font-bold text-[#28231F]">{post.title}</h2>}

              {/* Tagged Place Link */}
              {linkedPlace && (
                <div
                  onClick={() => onSelectPlace(linkedPlace)}
                  className="flex items-center gap-2 p-2 bg-[#F4EBDD] border border-[#D8A84E]/30 rounded-lg cursor-pointer hover:border-[#B8322A] transition-colors"
                >
                  <MapPin size={14} className="text-[#B8322A] shrink-0" />
                  <div className="text-xs truncate">
                    <span className="font-bold text-[#28231F]">{linkedPlace.name}</span>
                    <span className="text-[#795548] ml-1">({linkedPlace.province_name})</span>
                  </div>
                  {post.verified_visit && (
                    <span className="ml-auto text-[10px] text-[#397C73] font-medium flex items-center gap-0.5 shrink-0">
                      <CheckCircle size={11} /> Đã ghé thăm thực tế
                    </span>
                  )}
                </div>
              )}

              {/* Post Content */}
              <p className="text-xs sm:text-sm text-[#28231F]/90 leading-relaxed whitespace-pre-line">
                {post.content}
              </p>

              {/* Post Images */}
              {post.images.length > 0 && (
                <div className="rounded-lg overflow-hidden border border-[#D8A84E]/30 bg-[#EBDDCA]">
                  {post.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-16/10">
                      <HeritageImage
                        src={img.image_url}
                        alt="Ảnh tư liệu đóng góp"
                        className="w-full h-full object-cover"
                      />
                      {img.attribution_text && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white p-2 text-[10px]">
                          {img.attribution_text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Interaction Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#D8A84E]/20 text-xs text-[#795548]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onLikePost(post.id)}
                    className={`flex items-center gap-1 transition-colors cursor-pointer ${
                      post.has_liked ? 'text-[#B8322A] font-bold' : 'hover:text-[#B8322A]'
                    }`}
                  >
                    <Heart size={15} className={post.has_liked ? 'fill-[#B8322A]' : ''} />
                    <span>{post.likes}</span>
                  </button>

                  <button
                    onClick={() =>
                      setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)
                    }
                    className="flex items-center gap-1 hover:text-[#28231F] transition-colors cursor-pointer"
                  >
                    <MessageSquare size={15} />
                    <span>{post.comments.length} bình luận</span>
                  </button>
                </div>

                <button
                  onClick={() => onSavePost(post.id)}
                  className={`flex items-center gap-1 cursor-pointer transition-colors ${
                    post.saved ? 'text-[#B8322A]' : 'hover:text-[#28231F]'
                  }`}
                  title={post.saved ? 'Đã lưu' : 'Lưu bài viết'}
                >
                  <Bookmark size={15} className={post.saved ? 'fill-[#B8322A]' : ''} />
                </button>
                {post.user.id === currentUser.id && (
                  <button onClick={() => onDeletePost(post.id)} className="flex items-center gap-1 text-[#B8322A] hover:underline" title="Gỡ bài viết của bạn">
                    Gỡ bài
                  </button>
                )}
              </div>

              {/* Comments Section */}
              {activeCommentPostId === post.id && (
                <div className="pt-3 border-t border-[#D8A84E]/20 space-y-3">
                  {post.comments.length > 0 && (
                    <div className="space-y-2">
                      {post.comments.map((cmt) => (
                        <div key={cmt.id} className="p-2.5 bg-[#F4EBDD] rounded-lg text-xs space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#28231F]">{cmt.user.display_name}</span>
                            <span className="text-[10px] text-[#795548]">{cmt.created_at}</span>
                          </div>
                          <p className="text-[#28231F]/90">{cmt.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Viết cảm nghĩ của bạn..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                      className="flex-1 text-xs p-2 bg-[#F4EBDD] border border-[#D8A84E]/40 rounded-lg text-[#28231F]"
                    />
                    <button
                      onClick={() => handleSendComment(post.id)}
                      className="p-2 bg-[#B8322A] text-white rounded-lg hover:bg-[#9E2A23] cursor-pointer"
                      aria-label="Gửi bình luận"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
