import React, { useState } from 'react';
import {
  User as UserIcon,
  MapPin,
  Calendar,
  CheckCircle,
  Bookmark,
  Award,
  Lock,
  Globe,
  Star,
  Map,
  Compass,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { User, Place, Post, VisitedMemory, HeritageBadge } from '../types';
import { evaluateHeritageBadges } from '../utils/heritageLogic';
import { DongSonStar, HoaSenMotif } from './VietnamFolkMotifs';
import { HeritageImage } from './HeritageImage';
import { api } from '../utils/api';

interface UserProfileViewProps {
  user: User;
  allPlaces: Place[];
  visitedPlaceIds: string[];
  savedPlaceIds: string[];
  userPosts: Post[];
  visitedMemories: VisitedMemory[];
  onSelectPlace: (place: Place) => void;
  onUpdatePrivacy: (privacy: 'public' | 'private') => void;
  onUpdateProfile: (profile: Pick<User, 'display_name' | 'bio' | 'hometown' | 'cultural_interests'>) => Promise<void>;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  allPlaces,
  visitedPlaceIds,
  savedPlaceIds,
  userPosts,
  visitedMemories,
  onSelectPlace,
  onUpdatePrivacy,
  onUpdateProfile,
}) => {
  const [profileTab, setProfileTab] = useState<'memory-map' | 'visited' | 'saved' | 'posts' | 'badges'>('memory-map');
  const [selectedMemory, setSelectedMemory] = useState<VisitedMemory | null>(
    visitedMemories[0] || null
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user.display_name);
  const [bio, setBio] = useState(user.bio);
  const [hometown, setHometown] = useState(user.hometown);
  const [interests, setInterests] = useState(user.cultural_interests.join(', '));
  const [profileError, setProfileError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await onUpdateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        hometown: hometown.trim(),
        cultural_interests: interests.split(',').map((interest) => interest.trim()).filter(Boolean),
      });
      setProfileError('');
      setIsEditingProfile(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ.');
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Mật khẩu xác nhận không khớp.');
      return;
    }
    try {
      await api.updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      setPasswordMessage('Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất.');
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Không thể đổi mật khẩu.');
    }
  };

  const visitedPlaces = allPlaces.filter((p) => visitedPlaceIds.includes(p.id));
  const savedPlaces = allPlaces.filter((p) => savedPlaceIds.includes(p.id));
  const badges: HeritageBadge[] = evaluateHeritageBadges(visitedPlaceIds, allPlaces);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Profile Header Card */}
      <div className="bg-[#FAF6EF] border border-[#D8A84E]/50 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none -mr-16 -mt-16">
          <DongSonStar size={240} className="text-[#D8A84E]" />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            {user.avatar ? (
              <img src={user.avatar} alt={user.display_name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-[#B8322A] shadow-sm shrink-0" />
            ) : (
              <div aria-label={user.display_name} className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[#B8322A] bg-[#EBDDCA] font-serif text-3xl font-bold text-[#795548] sm:h-24 sm:w-24">
                {user.display_name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#28231F]">
                  {user.display_name}
                </h1>
                <span className="text-xs text-[#795548]">@{user.username}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#795548]">
                <MapPin size={13} className="text-[#B8322A]" />
                <span>Quê hương: {user.hometown}</span>
                <span aria-hidden="true">·</span>
                <span>{user.followers_count} người theo dõi</span>
              </div>

              <p className="text-xs text-[#28231F]/90 max-w-xl leading-relaxed pt-1">
                {user.bio}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button onClick={() => setIsEditingProfile((editing) => !editing)} className="text-xs font-semibold text-[#B8322A]">
                  {isEditingProfile ? 'Đóng chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
                </button>
                <button onClick={() => setIsChangingPassword((changing) => !changing)} className="text-xs font-semibold text-[#354C68]">
                  {isChangingPassword ? 'Đóng đổi mật khẩu' : 'Đổi mật khẩu'}
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Switcher */}
          <div className="flex items-center gap-2 bg-[#F4EBDD] border border-[#D8A84E]/40 px-3 py-1.5 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => onUpdatePrivacy('public')}
              className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer ${
                user.privacy === 'public'
                  ? 'bg-[#B8322A] text-white font-medium'
                  : 'text-[#795548] hover:text-[#28231F]'
              }`}
            >
              <Globe size={13} />
              <span>Bản Đồ Công Khai</span>
            </button>
            <button
              onClick={() => onUpdatePrivacy('private')}
              className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer ${
                user.privacy === 'private'
                  ? 'bg-[#28231F] text-white font-medium'
                  : 'text-[#795548] hover:text-[#28231F]'
              }`}
            >
              <Lock size={13} />
              <span>Riêng Tư</span>
            </button>
          </div>
        </div>

        {isEditingProfile && (
          <form onSubmit={handleProfileSubmit} className="relative z-10 grid gap-3 border-t border-[#D8A84E]/20 pt-4 text-xs sm:grid-cols-2">
            <label className="font-semibold text-[#795548]">Tên hiển thị
              <input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-2 text-[#28231F]" />
            </label>
            <label className="font-semibold text-[#795548]">Quê quán
              <input maxLength={120} value={hometown} onChange={(event) => setHometown(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-2 text-[#28231F]" />
            </label>
            <label className="font-semibold text-[#795548] sm:col-span-2">Giới thiệu
              <textarea maxLength={500} rows={3} value={bio} onChange={(event) => setBio(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-2 text-[#28231F]" />
            </label>
            <label className="font-semibold text-[#795548] sm:col-span-2">Sở thích văn hóa, cách nhau bằng dấu phẩy
              <input value={interests} onChange={(event) => setInterests(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-2 text-[#28231F]" />
            </label>
            {profileError && <p role="alert" className="text-[#B8322A] sm:col-span-2">{profileError}</p>}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setIsEditingProfile(false)} className="rounded border border-[#D8A84E]/40 px-3 py-2 text-[#795548]">Hủy</button>
              <button className="rounded bg-[#B8322A] px-4 py-2 font-semibold text-white">Lưu hồ sơ</button>
            </div>
          </form>
        )}

        {isChangingPassword && (
          <form onSubmit={handlePasswordSubmit} className="relative z-10 grid gap-3 border-t border-[#D8A84E]/20 pt-4 text-xs sm:grid-cols-3">
            <label className="font-semibold text-[#795548]">Mật khẩu hiện tại
              <input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-2 text-[#28231F]" />
            </label>
            <label className="font-semibold text-[#795548]">Mật khẩu mới (tối thiểu 12 ký tự)
              <input required minLength={12} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-2 text-[#28231F]" />
            </label>
            <label className="font-semibold text-[#795548]">Xác nhận mật khẩu mới
              <input required minLength={12} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/40 bg-white p-2 text-[#28231F]" />
            </label>
            {passwordMessage && <p role="status" className="text-[#795548] sm:col-span-3">{passwordMessage}</p>}
            <div className="flex justify-end sm:col-span-3">
              <button className="rounded bg-[#354C68] px-4 py-2 font-semibold text-white">Lưu mật khẩu mới</button>
            </div>
          </form>
        )}

        {/* Cultural Interests Pill List */}
        <div className="pt-2 border-t border-[#D8A84E]/20 flex flex-wrap items-center gap-2 text-xs text-[#795548]">
          <span className="font-semibold text-[#28231F]">Lĩnh vực văn hóa quan tâm:</span>
          {user.cultural_interests.map((interest, i) => (
            <span key={i} className="bg-[#EBDDCA]/60 text-[#28231F] px-2.5 py-0.5 rounded">
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center border-b border-[#D8A84E]/30 overflow-x-auto text-xs gap-1">
        <button
          onClick={() => setProfileTab('memory-map')}
          className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            profileTab === 'memory-map'
              ? 'border-[#B8322A] text-[#B8322A]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <Map size={14} />
          <span>Bản Đồ Ký Ức Cá Nhân ({visitedPlaces.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('visited')}
          className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            profileTab === 'visited'
              ? 'border-[#B8322A] text-[#B8322A]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <CheckCircle size={14} />
          <span>Địa Điểm Đã Ghé Thăm</span>
        </button>

        <button
          onClick={() => setProfileTab('saved')}
          className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            profileTab === 'saved'
              ? 'border-[#B8322A] text-[#B8322A]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <Bookmark size={14} />
          <span>Bộ Sưu Tập Đã Lưu ({savedPlaces.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('badges')}
          className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            profileTab === 'badges'
              ? 'border-[#B8322A] text-[#B8322A]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <Award size={14} />
          <span>Huy Hiệu Di Sản ({badges.filter((b) => b.unlocked).length}/{badges.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('posts')}
          className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            profileTab === 'posts'
              ? 'border-[#B8322A] text-[#B8322A]'
              : 'border-transparent text-[#795548] hover:text-[#28231F]'
          }`}
        >
          <FileText size={14} />
          <span>Bài Viết & Đánh Giá ({userPosts.length})</span>
        </button>
      </div>

      {/* TAB 1: PERSONAL MEMORY MAP */}
      {profileTab === 'memory-map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map canvas with personal pins (8 cols) */}
          <div className="lg:col-span-8 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded-xl overflow-hidden relative shadow-xs p-4 min-h-[480px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B8322A] flex items-center gap-1">
                <HoaSenMotif size={14} />
                Dấu Chân Di Sản Của Bạn Trên Đất Nam Bộ
              </span>
              <span className="text-xs text-[#795548]">
                {visitedPlaces.length} địa điểm đã ghi dấu
              </span>
            </div>

            {/* Visual Heritage Map Canvas */}
            <div className="relative w-full h-[380px] bg-[#FAF6EF] rounded-lg border border-[#D8A84E]/30 overflow-hidden">
              <svg viewBox="0 0 800 600" className="w-full h-full">
                {/* River water lines */}
                <path
                  d="M 320,120 Q 380,240 460,320 T 560,430"
                  stroke="#397C73"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.4"
                />
                <path
                  d="M 280,160 Q 360,300 420,410 T 490,520"
                  stroke="#397C73"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.4"
                />

                {/* Personal visited pins */}
                {visitedPlaces.map((place) => {
                  const minLat = 8.5;
                  const maxLat = 12.0;
                  const minLng = 104.2;
                  const maxLng = 107.8;
                  const x = ((place.coordinates.lng - minLng) / (maxLng - minLng)) * 800;
                  const y = ((maxLat - place.coordinates.lat) / (maxLat - minLat)) * 600;

                  return (
                    <g
                      key={place.id}
                      transform={`translate(${x}, ${y})`}
                      className="cursor-pointer group"
                      onClick={() => {
                        const mem = visitedMemories.find((m) => m.place_id === place.id);
                        if (mem) setSelectedMemory(mem);
                      }}
                    >
                      <circle r="16" fill="#397C73" fillOpacity="0.2" className="animate-ping" />
                      <circle r="9" fill="#B8322A" stroke="#FAF6EF" strokeWidth="2.5" />
                      <circle r="3" fill="#FAF6EF" />
                      <text
                        x="0"
                        y="18"
                        fontSize="10"
                        fontWeight="bold"
                        fill="#28231F"
                        textAnchor="middle"
                      >
                        {place.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="text-[11px] text-[#795548] italic mt-2 text-center">
              * Nhấn vào từng điểm đỏ trên bản đồ để mở lại nhật ký kỷ niệm và ngày bạn đã ghé thăm.
            </p>
          </div>

          {/* Right: Selected Memory Journal Card (4 cols) */}
          <div className="lg:col-span-4 bg-[#FAF6EF] border border-[#D8A84E]/50 rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-sm text-[#28231F] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#D8A84E]/30 pb-2">
              <Calendar size={15} className="text-[#B8322A]" />
              Kỷ Niệm Từng Địa Điểm
            </h3>

            {selectedMemory ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#28231F]">{selectedMemory.place_name}</span>
                  <span className="text-[#795548] font-medium">{selectedMemory.visited_at}</span>
                </div>

                <div className="text-[11px] text-[#795548]">
                  Tỉnh thành: <strong>{selectedMemory.province_name}</strong>
                </div>

                {selectedMemory.note && (
                  <div className="p-3 bg-[#F4EBDD] rounded-lg italic text-[#28231F]/90 leading-relaxed border border-[#D8A84E]/20">
                    "{selectedMemory.note}"
                  </div>
                )}

                <button
                  onClick={() => {
                    const place = allPlaces.find((p) => p.id === selectedMemory.place_id);
                    if (place) onSelectPlace(place);
                  }}
                  className="w-full py-2 bg-[#B8322A] text-white font-medium rounded hover:bg-[#9E2A23] transition-colors cursor-pointer text-center"
                >
                  Mở Lại Hồ Sơ Di Sản Này
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-[#795548] text-xs">
                <Compass className="mx-auto mb-2 opacity-50" size={24} />
                <p>Chọn một địa điểm trên bản đồ ký ức để xem nhật ký hành trình của bạn.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VISITED PLACES LIST */}
      {profileTab === 'visited' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {visitedPlaces.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectPlace(p)}
              className="bg-[#FAF6EF] border border-[#397C73]/40 rounded-xl p-4 space-y-2 hover:border-[#397C73] transition-all cursor-pointer flex gap-3 items-center"
            >
              <div className="w-16 h-16 rounded overflow-hidden border border-[#D8A84E]/30 shrink-0">
                <HeritageImage
                  src={p.media[0]?.image_url}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#397C73] font-semibold flex items-center gap-1">
                  <CheckCircle size={11} /> Đã ghé thăm
                </span>
                <h4 className="font-serif font-bold text-xs sm:text-sm text-[#28231F] truncate mt-0.5">
                  {p.name}
                </h4>
                <p className="text-[11px] text-[#795548]">{p.province_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: SAVED PLACES (BUCKET LIST) */}
      {profileTab === 'saved' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {savedPlaces.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectPlace(p)}
              className="bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl p-4 space-y-2 hover:border-[#B8322A] transition-all cursor-pointer flex gap-3 items-center"
            >
              <div className="w-16 h-16 rounded overflow-hidden border border-[#D8A84E]/30 shrink-0">
                <HeritageImage
                  src={p.media[0]?.image_url}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#B8322A] font-semibold flex items-center gap-1">
                  <Bookmark size={11} className="fill-[#B8322A]" /> Đã lưu muốn khám phá
                </span>
                <h4 className="font-serif font-bold text-xs sm:text-sm text-[#28231F] truncate mt-0.5">
                  {p.name}
                </h4>
                <p className="text-[11px] text-[#795548]">{p.province_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: HERITAGE BADGES */}
      {profileTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#795548]">
            <span>Huy hiệu được trao dựa trên hành trình và địa điểm đã ghé thăm thực tế:</span>
            <span className="font-bold text-[#B8322A]">
              Mở khóa {badges.filter((b) => b.unlocked).length} / {badges.length} huy hiệu
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  b.unlocked
                    ? 'bg-[#FAF6EF] border-[#D8A84E] shadow-sm'
                    : 'bg-[#FAF6EF]/40 border-[#D8A84E]/20 opacity-60'
                }`}
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mx-auto bg-[#EBDDCA] text-[#B8322A]">
                    {b.unlocked ? <Award size={20} className="text-[#D8A84E]" /> : '🔒'}
                  </div>

                  <h4 className="font-serif font-bold text-sm text-center text-[#28231F]">
                    {b.title}
                  </h4>

                  <p className="text-[11px] text-[#795548] text-center leading-relaxed">
                    {b.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#D8A84E]/20 text-[10px] text-center">
                  <span className={b.unlocked ? 'text-[#397C73] font-bold' : 'text-[#795548]'}>
                    {b.unlocked ? '✓ Đã đạt được' : b.criteria}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: USER POSTS */}
      {profileTab === 'posts' && (
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <p className="text-xs text-[#795548] text-center py-8">Bạn chưa đăng bài viết nào.</p>
          ) : (
            userPosts.map((p) => (
              <div key={p.id} className="p-4 bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl space-y-2 text-xs">
                <span className="text-[#795548] text-[10px]">{p.created_at}</span>
                <p className="text-[#28231F]/90 leading-relaxed">{p.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
