import React from 'react';
import { Map, Compass, BookOpen, Route, ArrowRight, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Place, Journey, CulturalArticle, ActiveTab } from '../types';
import { DongSonStar, ChimLacIcon, SongNuocPattern } from './VietnamFolkMotifs';
import { HeritageImage } from './HeritageImage';

interface HomeHeroProps {
  onNavigate: (tab: ActiveTab) => void;
  featuredPlaces: Place[];
  featuredJourneys: Journey[];
  featuredArticles: CulturalArticle[];
  onSelectPlace: (place: Place) => void;
  onSelectJourney: (journey: Journey) => void;
  onSelectArticle: (article: CulturalArticle) => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  onNavigate,
  featuredPlaces,
  featuredJourneys,
  featuredArticles,
  onSelectPlace,
  onSelectJourney,
  onSelectArticle,
}) => {
  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#FAF6EF] border-b border-[#D8A84E]/40 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Subtle folk background watermark */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-15 pointer-events-none">
          <DongSonStar size={360} className="text-[#D8A84E]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left Content (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B8322A]/10 border border-[#B8322A]/30 rounded-full text-xs font-semibold text-[#B8322A]">
              <ChimLacIcon size={18} className="text-[#B8322A]" />
              <span>NỀN TẢNG VĂN HÓA & DI SẢN SỐ VIỆT NAM</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#28231F] leading-[1.18] text-balance">
              Chạm Vào Di Sản – <br />
              <span className="text-[#B8322A]">Khám Phá Bản Sắc</span> Việt
            </h1>

            <p className="text-base sm:text-lg text-[#795548] leading-relaxed max-w-2xl">
              Hành trình kết nối bản đồ di sản, kho tri thức văn hóa có nguồn kiểm chứng, mạng lưới làng nghề truyền thống và bản đồ ký ức trải nghiệm của người Việt. Khởi đầu với vẻ đẹp sông nước Tây Nam Bộ và trầm tích Đông Nam Bộ kiên trung.
            </p>

            {/* Strict verification badge commitment */}
            <div className="flex items-center gap-2 text-xs text-[#397C73] font-medium bg-[#397C73]/10 px-3 py-2 rounded-lg max-w-fit">
              <ShieldCheck size={16} />
              <span>100% hình ảnh tư liệu lịch sử thực tế · Tuyệt đối không sử dụng ảnh AI</span>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('map')}
                className="px-5 py-2.5 bg-[#B8322A] text-white rounded-lg text-sm font-semibold hover:bg-[#9E2A23] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Map size={16} />
                <span>Mở Bản Đồ Văn Hóa</span>
              </button>

              <button
                onClick={() => onNavigate('places')}
                className="px-5 py-2.5 bg-[#F4EBDD] border border-[#D8A84E] text-[#28231F] rounded-lg text-sm font-semibold hover:bg-[#EBDDCA] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Compass size={16} />
                <span>Khám Phá Địa Điểm</span>
              </button>

              <button
                onClick={() => onNavigate('culture')}
                className="px-4 py-2.5 text-xs text-[#795548] hover:text-[#B8322A] transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>Kho Tri Thức</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Hero Right Visual (5 cols): Authentic Editorial Heritage Mosaic */}
          <div className="lg:col-span-5 relative">
            <div className="bg-[#FAF6EF] p-2 border border-[#D8A84E]/50 rounded-2xl shadow-xl space-y-2">
              {featuredPlaces[0] && (
                <div
                  onClick={() => onSelectPlace(featuredPlaces[0])}
                  className="group relative rounded-xl overflow-hidden aspect-4/3 cursor-pointer"
                >
                  <HeritageImage
                    src={featuredPlaces[0].media[0]?.image_url}
                    alt={featuredPlaces[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent p-4 flex flex-col justify-end text-white">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D8A84E]">
                      {featuredPlaces[0].province_name} · Di sản nổi bật
                    </span>
                    <h3 className="font-serif text-lg font-bold group-hover:text-[#D8A84E] transition-colors">
                      {featuredPlaces[0].name}
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                      {featuredPlaces[0].short_description}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                {featuredPlaces.slice(1, 3).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPlace(p)}
                    className="group relative rounded-lg overflow-hidden aspect-4/3 cursor-pointer border border-[#D8A84E]/30"
                  >
                    <HeritageImage
                      src={p.media[0]?.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent p-2 flex flex-col justify-end text-white">
                      <span className="text-[9px] text-[#D8A84E] truncate">{p.province_name}</span>
                      <h4 className="font-serif font-bold text-xs truncate group-hover:text-[#D8A84E] transition-colors">
                        {p.name}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave pattern */}
        <div className="absolute bottom-0 inset-x-0 opacity-20 pointer-events-none">
          <SongNuocPattern />
        </div>
      </section>

      {/* 2. REGIONAL HERITAGE SHOWCASE (Đông Nam Bộ & Đồng bằng sông Cửu Long) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#D8A84E]/30 pb-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#B8322A] font-bold">
              01. KHÔNG GIAN VĂN HÓA
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#28231F] mt-1">
              Hai Miền Đất Phương Nam
            </h2>
          </div>
          <p className="text-xs text-[#795548] max-w-md">
            Hệ sinh thái di sản phong phú nơi hội tụ và giao thoa sâu sắc của các cộng đồng Kinh, Khmer, Chăm và Hoa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Đồng bằng sông Cửu Long */}
          <div className="bg-[#FAF6EF] border border-[#D8A84E]/50 rounded-xl p-5 space-y-4 hover:border-[#B8322A] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#397C73] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#397C73]" />
                TÂY NAM BỘ
              </span>
              <span className="text-xs text-[#795548]">Châu thổ Cửu Long</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#28231F]">
              Đồng Bằng Sông Cửu Long: Sóng Nước & Chùa Tháp
            </h3>
            <p className="text-xs text-[#795548] leading-relaxed">
              Mạng lưới kênh rạch chằng chịt nuôi dưỡng văn hóa chợ nổi đặc trưng, nghệ thuật Đờn ca tài tử Nam Bộ được UNESCO ghi danh, hệ thống hơn 400 ngôi chùa tháp Phật giáo Nam tông Khmer và di chỉ khảo cổ học Óc Eo - Phù Nam cổ đại.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px] text-[#795548]">
              <span className="bg-[#EBDDCA]/60 px-2 py-0.5 rounded">Chợ nổi Cái Răng</span>
              <span className="bg-[#EBDDCA]/60 px-2 py-0.5 rounded">Chùa Chén Kiểu</span>
              <span className="bg-[#EBDDCA]/60 px-2 py-0.5 rounded">Khảo cổ Óc Eo</span>
              <span className="bg-[#EBDDCA]/60 px-2 py-0.5 rounded">Làng chiếu Định Yên</span>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="text-xs font-semibold text-[#B8322A] hover:underline flex items-center gap-1 pt-2 cursor-pointer"
            >
              <span>Xem địa điểm trên bản đồ</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Card 2: Đông Nam Bộ */}
          <div className="bg-[#FAF6EF] border border-[#D8A84E]/50 rounded-xl p-5 space-y-4 hover:border-[#B8322A] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#B8322A] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B8322A]" />
                ĐÔNG NAM BỘ
              </span>
              <span className="text-xs text-[#795548]">Miền Đất Khai Phá</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#28231F]">
              Đông Nam Bộ: Làng Nghề Cổ & Đất Thánh Kiên Trung
            </h3>
            <p className="text-xs text-[#795548] leading-relaxed">
              Vùng đất hơn 300 năm khởi nguồn xứ Đàng Trong với đô thành Sài Gòn - Gia Định, làng gốm men xanh Biên Hòa bên dòng sông Đồng Nai, kiến trúc độc bản Tòa Thánh Tây Ninh đạo Cao Đài và di sản Bánh tráng phơi sương Trảng Bàng.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px] text-[#795548]">
              <span className="bg-[#EBDDCA]/60 px-2 py-0.5 rounded">Gốm Biên Hòa 300 năm</span>
              <span className="bg-[#EBDDCA]/60 px-2 py-0.5 rounded">Tòa Thánh Tây Ninh</span>
              <span className="bg-[#EBDDCA]/60 px-2 py-0.5 rounded">Bánh tráng phơi sương</span>
              <span className="bg-[#EBDDCA]/60 px-2 py-0.5 rounded">Địa đạo Củ Chi</span>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="text-xs font-semibold text-[#B8322A] hover:underline flex items-center gap-1 pt-2 cursor-pointer"
            >
              <span>Xem địa điểm trên bản đồ</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. PROPOSED CULTURAL JOURNEYS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-[#D8A84E]/30 pb-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#B8322A] font-bold">
              02. HÀNH TRÌNH ĐỀ XUẤT
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#28231F] mt-1">
              Tuyến Đường Khám Phá Di Sản
            </h2>
          </div>
          <button
            onClick={() => onNavigate('journeys')}
            className="text-xs font-semibold text-[#B8322A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Tất cả hành trình</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredJourneys.map((j) => (
            <div
              key={j.id}
              onClick={() => onSelectJourney(j)}
              className="group bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl overflow-hidden hover:border-[#B8322A] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/10 overflow-hidden bg-[#EBDDCA]">
                  <HeritageImage
                    src={j.cover_image}
                    alt={j.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 right-2 text-[10px] font-semibold bg-[#28231F]/80 text-[#FAF6EF] px-2 py-0.5 rounded">
                    {j.estimated_duration}
                  </span>
                </div>

                <div className="p-3.5 space-y-1.5">
                  <span className="text-[10px] font-semibold text-[#397C73] uppercase tracking-wider block">
                    {j.cultural_theme}
                  </span>
                  <h4 className="font-serif font-bold text-sm text-[#28231F] group-hover:text-[#B8322A] transition-colors line-clamp-2">
                    {j.title}
                  </h4>
                  <p className="text-xs text-[#795548] line-clamp-2 leading-relaxed">
                    {j.description}
                  </p>
                </div>
              </div>

              <div className="px-3.5 pb-3 pt-2 border-t border-[#D8A84E]/20 text-[11px] text-[#795548] flex items-center justify-between">
                <span>{j.places.length} điểm dừng di sản</span>
                <span className="text-[#B8322A] font-semibold flex items-center">
                  Chi tiết <ArrowRight size={11} className="ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. KNOWLEDGE & ARTICLES SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-[#D8A84E]/30 pb-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#B8322A] font-bold">
              03. KHO TRI THỨC VĂN HÓA
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#28231F] mt-1">
              Tư Liệu & Khảo Cứu Chuyên Sâu
            </h2>
          </div>
          <button
            onClick={() => onNavigate('culture')}
            className="text-xs font-semibold text-[#B8322A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Đọc thêm bài viết</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredArticles.map((art) => (
            <article
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl overflow-hidden p-4 space-y-3 hover:border-[#B8322A] transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-[#795548]">
                  <span className="font-semibold text-[#B8322A]">{art.topic}</span>
                  <span>{art.read_time} đọc</span>
                </div>

                <h3 className="font-serif font-bold text-base text-[#28231F] hover:text-[#B8322A] transition-colors leading-snug">
                  {art.title}
                </h3>

                <p className="text-xs text-[#795548] line-clamp-3 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>

              <div className="pt-3 border-t border-[#D8A84E]/20 text-[11px] text-[#795548] flex items-center justify-between">
                <span>Tác giả: <strong>{art.author}</strong></span>
                <span className="text-[#397C73] font-medium flex items-center gap-1">
                  <ShieldCheck size={12} /> Đã kiểm chứng
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION: PARTICIPATE IN COMMUNITY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-r from-[#B8322A] to-[#9E2A23] rounded-2xl p-6 sm:p-10 text-white relative overflow-hidden shadow-lg">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none -mr-10 -mb-10">
            <DongSonStar size={300} className="text-white" />
          </div>

          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-xs uppercase tracking-widest text-[#D8A84E] font-bold">
              CÙNG GÌN GIỮ BẢN SẮC
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
              Chia Sẻ Trải Nghiệm & Đóng Góp Tư Liệu Di Sản
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              Mỗi bức ảnh thực tế, mỗi câu chuyện mộc mạc và đánh giá chân thực của bạn là một viên gạch đắp bồi cho kho tàng di sản số của đất nước. Hãy bắt đầu xây dựng Bản đồ ký ức của riêng bạn ngay hôm nay.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onNavigate('community')}
                className="px-5 py-2.5 bg-[#D8A84E] text-[#28231F] rounded-lg text-xs font-bold hover:bg-[#EBDDCA] transition-colors shadow-sm cursor-pointer"
              >
                Tham Gia Cộng Đồng Di Sản
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/30 transition-colors cursor-pointer"
              >
                Mở Bản Đồ Ký Ức Cá Nhân
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
