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
    <header className="sticky top-0 z-40 bg-[#FAF6EF]/95 backdrop-blur-md border-b border-[#D8A84E]/30 transition-colors w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 h-14 sm:h-16">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => onTabChange('home')}
            className="flex items-center gap-1.5 sm:gap-2 text-left group cursor-pointer shrink-0 min-h-[40px]"
            aria-label="Về trang chủ Hành Trình Di Sản Số"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#B8322A] flex items-center justify-center text-[#F4EBDD] shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <ChimLacIcon size={18} className="text-[#F4EBDD]" />
            </div>
            <div>
              <span className="font-serif text-xs sm:text-base lg:text-lg font-bold tracking-tight text-[#28231F] block whitespace-nowrap leading-tight">
                DI SẢN SỐ
              </span>
              <span className="text-[8px] sm:text-[9px] tracking-wider uppercase text-[#795548] hidden sm:block whitespace-nowrap">
                Khám Phá Bản Sắc Văn Hóa Việt
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 text-xs lg:text-sm font-medium text-[#28231F]" aria-label="Điều hướng chính">
            <button
              onClick={() => onTabChange('home')}
              className={`px-2 lg:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              Trang Chủ
            </button>

            <button
              onClick={() => onTabChange('map')}
              className={`px-2 lg:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              Bản Đồ Di Sản
            </button>

            <button
              onClick={() => onTabChange('places')}
              className={`px-2 lg:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === 'places'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              <Compass size={14} />
              Địa Điểm
            </button>

            <button
              onClick={() => onTabChange('culture')}
              className={`px-2 lg:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === 'culture'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              <BookOpen size={14} />
              Kho Tri Thức
            </button>

            <button
              onClick={() => onTabChange('journeys')}
              className={`px-2 lg:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === 'journeys'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              <Route size={14} />
              Hành Trình
            </button>

            <button
              onClick={() => onTabChange('community')}
              className={`px-2 lg:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === 'community'
                  ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                  : 'text-[#28231F]/80 hover:text-[#B8322A] hover:bg-[#EBDDCA]/40'
              }`}
            >
              <Users size={14} />
              Cộng Đồng
            </button>
          </nav>

          {/* Zone 3: Audio & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Audio Widget Thu Gọn (Popup hiển thị đè phía trên) */}
            <AudioPlayerWidget />

            {/* Nút Hồ Sơ */}
            <button
              onClick={() => onTabChange('profile')}
              aria-label="Xem hồ sơ cá nhân và bản đồ ký ức"
              className={`hidden md:flex p-1.5 sm:p-2 rounded-full border transition-all cursor-pointer items-center justify-center ${
                activeTab === 'profile'
                  ? 'border-[#B8322A] bg-[#B8322A] text-white'
                  : 'border-[#D8A84E]/40 bg-[#FAF6EF] text-[#28231F] hover:border-[#B8322A]'
              }`}
              title="Hồ sơ & Bản đồ ký ức cá nhân"
            >
              <User size={15} />
            </button>

            {/* Nút Quản Trị (Admin / Moderator) */}
            {currentUser && ['admin', 'moderator'].includes(currentUser.role) && (
              <button
                onClick={() => onTabChange('admin')}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-md border transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'admin' ? 'bg-[#354C68] text-white border-[#354C68]' : 'border-[#354C68]/30 text-[#354C68] hover:bg-[#354C68]/10'
                }`}
                title="Khu vực Quản trị & Kiểm duyệt"
              >
                <ShieldCheck size={14} />
                <span className="hidden sm:inline whitespace-nowrap">Quản trị</span>
              </button>
            )}

            {/* Đăng xuất / Đăng nhập */}
            {currentUser ? (
              <button 
                onClick={onSignOut} 
                aria-label="Đăng xuất" 
                title={`Đăng xuất ${currentUser.display_name}`} 
                className="flex items-center gap-1 rounded-md border border-[#D8A84E]/40 bg-[#FAF6EF] p-1.5 sm:px-2.5 sm:py-1.5 text-xs text-[#795548] hover:text-[#B8322A] shrink-0"
              >
                <LogOut size={14} />
                <span className="hidden lg:inline whitespace-nowrap">Đăng xuất</span>
              </button>
            ) : (
              <button 
                onClick={onOpenAuth} 
                className="flex items-center gap-1 rounded-md bg-[#B8322A] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#9E2A23] shrink-0"
              >
                <LogIn size={14} />
                <span className="hidden sm:inline whitespace-nowrap">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};