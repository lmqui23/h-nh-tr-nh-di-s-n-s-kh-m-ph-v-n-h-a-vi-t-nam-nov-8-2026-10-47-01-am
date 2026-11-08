import React from 'react';
import { LogIn, LogOut, Map, Compass, BookOpen, Route, Users, User, ShieldCheck } from 'lucide-react';
import { ActiveTab, User as AppUser } from '../types';
import { AudioPlayerWidget } from './AudioPlayerWidget';
import { ChimLacIcon } from './VietnamFolkMotifs';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onOpenAuth,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF6EF]/95 backdrop-blur-md border-b border-[#D8A84E]/30 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-14 sm:h-16">
          {/* Zone 1: Single element Brand Wordmark */}
          <button
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2 text-left group cursor-pointer shrink-0 min-h-[44px]"
            aria-label="Về trang chủ Hành Trình Di Sản Số"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#B8322A] flex items-center justify-center text-[#F4EBDD] shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <ChimLacIcon size={20} className="text-[#F4EBDD]" />
            </div>
            <div>
              <span className="font-serif text-sm sm:text-lg font-bold tracking-tight text-[#28231F] block whitespace-nowrap leading-tight">
                DI SẢN SỐ
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-wider uppercase text-[#795548] hidden sm:block whitespace-nowrap">
                Khám Phá Bản Sắc Văn Hóa Việt
              </span>
            </div>
          </button>

          {/* Zone 2: Desktop 5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium text-[#28231F]" aria-label="Điều hướng chính">
            <button
              onClick={() => onTabChange('home')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              Trang Chủ
            </button>

            <button
              onClick={() => onTabChange('map')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              <Map size={15} />
              Bản Đồ Di Sản
            </button>

            <button
              onClick={() => onTabChange('places')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'places'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              <Compass size={15} />
              Địa Điểm
            </button>

            <button
              onClick={() => onTabChange('culture')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'culture'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              <BookOpen size={15} />
              Kho Tri Thức
            </button>

            <button
              onClick={() => onTabChange('journeys')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'journeys'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              <Route size={15} />
              Hành Trình
            </button>

            <button
              onClick={() => onTabChange('community')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'community'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              <Users size={15} />
              Cộng Đồng
            </button>
          </nav>

          {/* Zone 3: Audio Soundscape & User Profile Action */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Cultural Ambient Audio Controller */}
            <AudioPlayerWidget />

            {/* Profile Tab Button (Desktop) */}
            <button
              onClick={() => onTabChange('profile')}
              aria-label="Xem hồ sơ cá nhân và bản đồ ký ức"
              className={`hidden md:flex p-2 rounded-full border transition-all cursor-pointer min-h-[38px] min-w-[38px] items-center justify-center ${
                activeTab === 'profile'
                  ? 'border-[#B8322A] bg-[#B8322A] text-white'
                  : 'border-[#D8A84E]/40 bg-[#FAF6EF] text-[#28231F] hover:border-[#B8322A]'
              }`}
              title="Hồ sơ & Bản đồ ký ức cá nhân"
            >
              <User size={16} />
            </button>

            {currentUser && ['admin', 'moderator'].includes(currentUser.role) && (
              <button
                onClick={() => onTabChange('admin')}
                className={`flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 text-xs rounded-md border transition-colors cursor-pointer min-h-[36px] ${
                  activeTab === 'admin' ? 'bg-[#354C68] text-white border-[#354C68]' : 'border-[#354C68]/30 text-[#354C68] hover:bg-[#354C68]/10'
                }`}
                title="Khu vực Quản trị & Kiểm duyệt"
              >
                <ShieldCheck size={14} />
                <span className="hidden sm:inline">Quản trị</span>
              </button>
            )}
            {currentUser ? (
              <button onClick={onSignOut} aria-label="Đăng xuất" title={`Đăng xuất ${currentUser.display_name}`} className="flex min-h-[36px] items-center gap-1 rounded-md border border-[#D8A84E]/40 bg-[#FAF6EF] p-2 text-xs text-[#795548] hover:text-[#B8322A]">
                <LogOut size={15} />
                <span className="hidden lg:inline">Đăng xuất</span>
              </button>
            ) : (
              <button onClick={onOpenAuth} className="flex min-h-[36px] items-center gap-1 rounded-md bg-[#B8322A] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#9E2A23]">
                <LogIn size={15} />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
