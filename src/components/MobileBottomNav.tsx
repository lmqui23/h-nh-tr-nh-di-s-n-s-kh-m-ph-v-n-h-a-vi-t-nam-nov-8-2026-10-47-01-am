import React from 'react';
import { Home, Map, PlusCircle, Users, User, Compass, Route } from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenCreatePost: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenCreatePost,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF6EF]/98 backdrop-blur-md border-t border-[#D8A84E]/40 pb-[env(safe-area-inset-bottom)] shadow-lg"
      aria-label="Thanh điều hướng di động"
    >
      <div className="flex items-center justify-around h-15 px-2">
        {/* 1. Trang Chủ */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] cursor-pointer transition-colors ${
            activeTab === 'home' ? 'text-[#B8322A] font-bold' : 'text-[#795548] hover:text-[#28231F]'
          }`}
          aria-label="Trang Chủ"
        >
          <Home size={19} className={activeTab === 'home' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5">Trang Chủ</span>
        </button>

        {/* 2. Bản Đồ Di Sản */}
        <button
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] cursor-pointer transition-colors ${
            activeTab === 'map' ? 'text-[#B8322A] font-bold' : 'text-[#795548] hover:text-[#28231F]'
          }`}
          aria-label="Bản Đồ Di Sản"
        >
          <Map size={19} className={activeTab === 'map' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5">Bản Đồ</span>
        </button>

        {/* 3. Nút Đăng Bài Nổi Bật (Center Action) */}
        <button
          onClick={onOpenCreatePost}
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
          aria-label="Đăng bài hoặc đánh giá địa điểm"
          title="Đăng bài hoặc đánh giá địa điểm"
        >
          <div className="w-12 h-12 rounded-full bg-[#B8322A] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border-2 border-[#FAF6EF]">
            <PlusCircle size={26} />
          </div>
          <span className="text-[10px] font-bold text-[#B8322A] mt-0.5">Đăng Bài</span>
        </button>

        {/* 4. Cộng Đồng */}
        <button
          onClick={() => onTabChange('community')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] cursor-pointer transition-colors ${
            activeTab === 'community' ? 'text-[#B8322A] font-bold' : 'text-[#795548] hover:text-[#28231F]'
          }`}
          aria-label="Cộng Đồng"
        >
          <Users size={19} className={activeTab === 'community' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5">Cộng Đồng</span>
        </button>

        {/* 5. Hồ Sơ Cá Nhân */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] cursor-pointer transition-colors ${
            activeTab === 'profile' ? 'text-[#B8322A] font-bold' : 'text-[#795548] hover:text-[#28231F]'
          }`}
          aria-label="Hồ Sơ & Ký Ức"
        >
          <User size={19} className={activeTab === 'profile' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5">Hồ Sơ</span>
        </button>
      </div>
    </nav>
  );
};
