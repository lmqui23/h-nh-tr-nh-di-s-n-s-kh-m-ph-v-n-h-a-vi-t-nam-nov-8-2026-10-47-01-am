/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ActiveTab,
  Place,
  CulturalArticle,
  Journey,
  Post,
  User,
  UserRole,
  VisitedMemory,
} from './types';
import {
  REGIONS,
  PROVINCES,
} from './data/heritageData';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { InteractiveMap } from './components/InteractiveMap';
import { PlacesExplorer } from './components/PlacesExplorer';
import { KnowledgeRepo } from './components/KnowledgeRepo';
import { JourneyPlanner } from './components/JourneyPlanner';
import { CommunityFeed } from './components/CommunityFeed';
import { UserProfileView } from './components/UserProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthDialog } from './components/AuthDialog';
import { DongSonStar, ChimLacIcon, SongNuocPattern } from './components/VietnamFolkMotifs';
import { evaluateHeritageBadges } from './utils/heritageLogic';
import { api } from './utils/api';

const GUEST_USER: User = {
  id: 'guest',
  username: 'guest',
  display_name: 'Khách tham quan',
  avatar: '',
  bio: '',
  role: 'guest',
  hometown: '',
  cultural_interests: [],
  followers_count: 0,
  following_count: 0,
  privacy: 'private',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [places, setPlaces] = useState<Place[]>([]);
  const [articles, setArticles] = useState<CulturalArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<CulturalArticle | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [userCustomJourneys, setUserCustomJourneys] = useState<Journey[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [visitedPlaceIds, setVisitedPlaceIds] = useState<string[]>([]);
  const [visitedMemories, setVisitedMemories] = useState<VisitedMemory[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [dataError, setDataError] = useState('');

  // Selected place for detailed modal sheet
  const [selectedPlaceForModal, setSelectedPlaceForModal] = useState<Place | null>(null);
  const [openCreateModalTrigger, setOpenCreateModalTrigger] = useState<number>(0);

  // Check badges count to trigger confetti when a new one is unlocked
  const [prevBadgeCount, setPrevBadgeCount] = useState<number>(0);

  const loadBackendData = async () => {
    const [session, placeResult, postResult, articleResult, journeyResult] = await Promise.all([
      api.me(),
      api.listPlaces(),
      api.listPosts(),
      api.listArticles(),
      api.listJourneys(),
    ]);
    setCurrentUser(session.user);
    setPlaces(placeResult.places);
    setPosts(postResult.posts);
    setArticles(articleResult.items);
    setJourneys(journeyResult.items);
    if (session.user) {
      const library = await api.visitedPlaces();
      setSavedPlaceIds(library.savedPlaceIds);
      setVisitedPlaceIds(library.visitedPlaceIds);
      setVisitedMemories(library.visitedMemories);
    } else {
      setSavedPlaceIds([]);
      setVisitedPlaceIds([]);
      setVisitedMemories([]);
    }
  };

  useEffect(() => {
    loadBackendData().catch((error: unknown) => {
      setDataError(error instanceof Error ? error.message : 'Không kết nối được máy chủ.');
    });
  }, []);

  useEffect(() => {
    const badges = evaluateHeritageBadges(visitedPlaceIds, places);
    const unlockedCount = badges.filter((b) => b.unlocked).length;
    if (prevBadgeCount > 0 && unlockedCount > prevBadgeCount) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#B8322A', '#D8A84E', '#397C73'],
        });
      } catch {
        // ignore if canvas-confetti is unavailable
      }
    }
    setPrevBadgeCount(unlockedCount);
  }, [visitedPlaceIds, places, prevBadgeCount]);

  // Handlers for Save and Visited
  const handleToggleSave = async (placeId: string) => {
    if (!currentUser) {
      setIsAuthDialogOpen(true);
      return;
    }
    const isSaved = savedPlaceIds.includes(placeId);
    try {
      await api.savePlace(placeId, !isSaved);
      setSavedPlaceIds((prev) => isSaved ? prev.filter((id) => id !== placeId) : [...prev, placeId]);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Không thể lưu địa điểm.');
    }
  };

  const handleToggleVisited = async (placeId: string) => {
    if (!currentUser) {
      setIsAuthDialogOpen(true);
      return;
    }
    const isVisited = visitedPlaceIds.includes(placeId);
    try {
      await api.visitPlace(placeId, !isVisited);
      setVisitedPlaceIds((prev) => isVisited ? prev.filter((id) => id !== placeId) : [...prev, placeId]);
      setVisitedMemories((prev) => isVisited
        ? prev.filter((memory) => memory.place_id !== placeId)
        : [{
            place_id: placeId,
            place_name: places.find((place) => place.id === placeId)?.name || '',
            province_name: places.find((place) => place.id === placeId)?.province_name || '',
            visited_at: new Date().toLocaleDateString('vi-VN'),
          }, ...prev]);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Không thể cập nhật lịch sử ghé thăm.');
    }
  };

  // Community actions
  const handleLikePost = async (postId: string) => {
    if (!currentUser) {
      setIsAuthDialogOpen(true);
      return;
    }
    try {
      const result = await api.like(postId);
      setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, has_liked: result.liked, likes: result.likes } : post));
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Không thể thích bài viết.');
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!currentUser) {
      setIsAuthDialogOpen(true);
      return;
    }
    try {
      await api.comment(postId, text);
      setDataError('Bình luận đã gửi, đang chờ kiểm duyệt.');
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Không thể gửi bình luận.');
    }
  };

  const handleSavePost = async (postId: string) => {
    if (!currentUser) {
      setIsAuthDialogOpen(true);
      return;
    }
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    try {
      await api.savePost(postId, !post.saved);
      setPosts((prev) => prev.map((item) => item.id === postId ? { ...item, saved: !post.saved } : item));
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Không thể lưu bài viết.');
    }
  };

  const handleCreatePost = async (newPostData: {
    title: string;
    content: string;
    place_id?: string;
    cultural_topic?: string;
    is_review: boolean;
    rating?: number;
    visit_date?: string;
    image: File;
  }) => {
    if (!currentUser) {
      setIsAuthDialogOpen(true);
      throw new Error('Đăng nhập để gửi bài viết.');
    }
    const formData = new FormData();
    formData.set('title', newPostData.title);
    formData.set('content', newPostData.content);
    formData.set('image', newPostData.image);
    if (newPostData.place_id) formData.set('place_id', newPostData.place_id);
    formData.set('cultural_topic', newPostData.cultural_topic || '');
    formData.set('is_review', String(newPostData.is_review));
    if (newPostData.rating) formData.set('rating', String(newPostData.rating));
    if (newPostData.visit_date) formData.set('visit_date', newPostData.visit_date);
    try {
      await api.createPost(formData);
      setDataError('Bài viết đã gửi và đang chờ Admin kiểm duyệt.');
      await loadBackendData();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Không thể đăng bài.');
      throw error;
    }
  };

  const handleApprovePost = async (postId: string) => {
    await api.moderatePost(postId, 'approved');
    await loadBackendData();
  };

  const handleRejectPost = async (postId: string) => {
    await api.moderatePost(postId, 'rejected');
    await loadBackendData();
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Gỡ bài viết này khỏi cộng đồng?')) return;
    try {
      await api.deleteOwnPost(postId);
      await loadBackendData();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Không thể gỡ bài viết.');
    }
  };

  const handleAddNewPlace = async (newPlace: Place) => {
    const result = await api.createPlace(newPlace);
    await loadBackendData();
    return result.place;
  };

  return (
    <div className="min-h-screen bg-[#F4EBDD] text-[#28231F] flex flex-col font-sans selection:bg-[#B8322A]/20 selection:text-[#B8322A] overflow-x-hidden w-full max-w-full">
      {/* 1. Universal Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'culture') {
            setSelectedArticle(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthDialogOpen(true)}
        onSignOut={async () => {
          await api.logout();
          setCurrentUser(null);
          setSavedPlaceIds([]);
          setVisitedPlaceIds([]);
          setActiveTab('home');
          await loadBackendData();
        }}
        savedCount={savedPlaceIds.length}
      />

      {dataError && (
        <div role="status" className="mx-auto mt-2 max-w-7xl px-4 text-xs text-[#795548]">
          {dataError}
          <button onClick={() => setDataError('')} className="ml-2 font-semibold text-[#B8322A]">Đóng</button>
        </div>
      )}

      {/* 2. Main Tab View Switcher */}
      <main className="flex-1 pb-20 md:pb-0">
        {activeTab === 'home' && (
          <HomeHero
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            featuredPlaces={places.slice(0, 4)}
            featuredJourneys={journeys}
            featuredArticles={articles}
            onSelectPlace={(place) => setSelectedPlaceForModal(place)}
            onSelectJourney={(journey) => {
              setActiveTab('journeys');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectArticle={(article) => {
              setSelectedArticle(article);
              setActiveTab('culture');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'map' && (
          <InteractiveMap
            places={places}
            regions={REGIONS}
            provinces={PROVINCES}
            onSelectPlace={(place) => setSelectedPlaceForModal(place)}
            savedPlaceIds={savedPlaceIds}
            visitedPlaceIds={visitedPlaceIds}
            onToggleSave={handleToggleSave}
            onToggleVisited={handleToggleVisited}
          />
        )}

        {activeTab === 'places' && (
          <PlacesExplorer
            places={places}
            regions={REGIONS}
            provinces={PROVINCES}
            savedPlaceIds={savedPlaceIds}
            visitedPlaceIds={visitedPlaceIds}
            onToggleSave={handleToggleSave}
            onToggleVisited={handleToggleVisited}
            onSelectPlace={(place) => setSelectedPlaceForModal(place)}
          />
        )}

        {activeTab === 'culture' && (
          <KnowledgeRepo
            articles={articles}
            selectedArticle={selectedArticle}
            onSelectArticle={(article) => setSelectedArticle(article)}
          />
        )}

        {activeTab === 'journeys' && (
          <JourneyPlanner
            journeys={journeys}
            allPlaces={places}
            onSelectPlace={(place) => setSelectedPlaceForModal(place)}
            onCreateCustomJourney={(newJourney) => {
              setUserCustomJourneys((prev) => [newJourney, ...prev]);
            }}
            userCustomJourneys={userCustomJourneys}
          />
        )}

        {activeTab === 'community' && (
          <CommunityFeed
            posts={posts}
            places={places}
            currentUser={currentUser || GUEST_USER}
            onLikePost={handleLikePost}
            onAddComment={handleAddComment}
            onSavePost={handleSavePost}
            onCreatePost={handleCreatePost}
            onDeletePost={handleDeletePost}
            onSelectPlace={(place) => setSelectedPlaceForModal(place)}
            openCreateModalTrigger={openCreateModalTrigger}
          />
        )}

        {activeTab === 'profile' && currentUser && (
          <UserProfileView
            user={currentUser}
            allPlaces={places}
            visitedPlaceIds={visitedPlaceIds}
            savedPlaceIds={savedPlaceIds}
            userPosts={posts.filter((p) => p.user.username === currentUser.username)}
            visitedMemories={visitedMemories}
            onSelectPlace={(place) => setSelectedPlaceForModal(place)}
            onUpdatePrivacy={async (privacy) => {
              if (!currentUser) return;
              try {
                const result = await api.updateProfile({
                  display_name: currentUser.display_name,
                  bio: currentUser.bio,
                  hometown: currentUser.hometown,
                  cultural_interests: currentUser.cultural_interests,
                  privacy,
                });
                setCurrentUser(result.user);
              } catch (error) {
                setDataError(error instanceof Error ? error.message : 'Không thể cập nhật quyền riêng tư.');
              }
            }}
            onUpdateProfile={async (profile) => {
              if (!currentUser) return;
              const result = await api.updateProfile({ ...profile, privacy: currentUser.privacy });
              setCurrentUser(result.user);
            }}
          />
        )}

        {activeTab === 'profile' && !currentUser && (
          <section className="mx-auto max-w-xl px-4 py-16 text-center">
            <h1 className="font-serif text-2xl font-bold text-[#28231F]">Hồ sơ cá nhân</h1>
            <p className="mt-2 text-sm text-[#795548]">Đăng nhập để xem địa điểm đã lưu và các bài viết của bạn.</p>
            <button onClick={() => setIsAuthDialogOpen(true)} className="mt-5 rounded bg-[#B8322A] px-4 py-2 text-sm font-semibold text-white">Đăng nhập</button>
          </section>
        )}

        {activeTab === 'admin' && currentUser && ['admin', 'moderator'].includes(currentUser.role) && (
          <AdminDashboard
            currentUserRole={currentUser.role}
            places={places}
            posts={posts}
            onApprovePost={handleApprovePost}
            onRejectPost={handleRejectPost}
            onAddNewPlace={handleAddNewPlace}
            currentUserId={currentUser.id}
            onRefresh={loadBackendData}
          />
        )}

        {activeTab === 'admin' && (!currentUser || !['admin', 'moderator'].includes(currentUser.role)) && (
          <section className="mx-auto max-w-xl px-4 py-16 text-center">
            <h1 className="font-serif text-2xl font-bold text-[#28231F]">Không có quyền truy cập</h1>
            <p className="mt-2 text-sm text-[#795548]">Khu vực quản trị chỉ dành cho tài khoản được cấp quyền.</p>
            {!currentUser && <button onClick={() => setIsAuthDialogOpen(true)} className="mt-5 rounded bg-[#354C68] px-4 py-2 text-sm font-semibold text-white">Đăng nhập</button>}
          </section>
        )}
      </main>

      {/* 3. Detailed Place Modal */}
      <PlaceDetailModal
        place={selectedPlaceForModal}
        onClose={() => setSelectedPlaceForModal(null)}
        isSaved={selectedPlaceForModal ? savedPlaceIds.includes(selectedPlaceForModal.id) : false}
        isVisited={selectedPlaceForModal ? visitedPlaceIds.includes(selectedPlaceForModal.id) : false}
        onToggleSave={handleToggleSave}
        onToggleVisited={handleToggleVisited}
        relatedPosts={
          selectedPlaceForModal
            ? posts.filter((p) => p.place_id === selectedPlaceForModal.id)
            : []
        }
        onCreateReview={(place) => {
          setSelectedPlaceForModal(null);
          setActiveTab('community');
        }}
        onAddToJourney={(place) => {
          setSelectedPlaceForModal(null);
          setActiveTab('journeys');
        }}
      />

      {/* 4. Cultural Editorial Footer */}
      <footer className="bg-[#FAF6EF] border-t border-[#D8A84E]/40 pt-12 pb-24 md:pb-8 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-[#795548]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#D8A84E]/30 pb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#B8322A] flex items-center justify-center text-white shrink-0">
                <ChimLacIcon size={24} className="text-white" />
              </div>
              <div>
                <span className="font-serif font-bold text-base text-[#28231F] block">
                  HÀNH TRÌNH DI SẢN SỐ
                </span>
                <span className="text-[11px] text-[#795548]">
                  Chạm vào di sản – Khám phá bản sắc – Kết nối cộng đồng
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-medium text-[#28231F]">
              <button onClick={() => setActiveTab('home')} className="hover:text-[#B8322A] cursor-pointer">
                Trang Chủ
              </button>
              <button onClick={() => setActiveTab('map')} className="hover:text-[#B8322A] cursor-pointer">
                Bản Đồ Di Sản
              </button>
              <button onClick={() => setActiveTab('places')} className="hover:text-[#B8322A] cursor-pointer">
                Danh Sách Địa Điểm
              </button>
              <button onClick={() => setActiveTab('culture')} className="hover:text-[#B8322A] cursor-pointer">
                Kho Tri Thức
              </button>
              <button onClick={() => setActiveTab('journeys')} className="hover:text-[#B8322A] cursor-pointer">
                Hành Trình
              </button>
              <button onClick={() => setActiveTab('community')} className="hover:text-[#B8322A] cursor-pointer">
                Cộng Đồng
              </button>
              <button onClick={() => setActiveTab('admin')} className="hover:text-[#354C68] text-[#354C68] cursor-pointer font-bold">
                Quản Trị & Kiểm Duyệt
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#795548]/80">
            <p>
              © 2026 Hành Trình Di Sản Số Việt Nam. Tư liệu được biên soạn và kiểm chứng theo nguồn chính thống của Cục Di sản Văn hóa, UNESCO và các Bảo tàng Lịch sử địa phương.
            </p>
            <p className="shrink-0 text-[#397C73] font-medium">
              Cam kết 100% hình ảnh tư liệu thực tế · Không sử dụng ảnh AI
            </p>
          </div>
        </div>
      </footer>

      {/* 5. Mobile Bottom Navigation Bar (md:hidden) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'culture') {
            setSelectedArticle(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCreatePost={() => {
          setActiveTab('community');
          setOpenCreateModalTrigger((prev) => prev + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      {isAuthDialogOpen && (
        <AuthDialog
          onClose={() => setIsAuthDialogOpen(false)}
          onAuthenticated={async () => {
            setDataError('');
            await loadBackendData();
          }}
        />
      )}
    </div>
  );
}
