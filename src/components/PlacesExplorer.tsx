import React, { useState } from 'react';
import { Search, Filter, Star, MapPin, Bookmark, CheckCircle, Eye, Compass, ShieldCheck } from 'lucide-react';
import { Place, HeritageCategory, Region, Province } from '../types';
import { CATEGORIES } from '../data/heritageData';
import { filterPlaces } from '../utils/heritageLogic';
import { DongSonStar, HoaSenMotif } from './VietnamFolkMotifs';
import { HeritageImage } from './HeritageImage';

interface PlacesExplorerProps {
  places: Place[];
  regions: Region[];
  provinces: Province[];
  savedPlaceIds: string[];
  visitedPlaceIds: string[];
  onToggleSave: (placeId: string) => void;
  onToggleVisited: (placeId: string) => void;
  onSelectPlace: (place: Place) => void;
}

export const PlacesExplorer: React.FC<PlacesExplorerProps> = ({
  places,
  regions,
  provinces,
  savedPlaceIds,
  visitedPlaceIds,
  onToggleSave,
  onToggleVisited,
  onSelectPlace,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<HeritageCategory | 'all'>('all');
  const [onlyVerified, setOnlyVerified] = useState(false);

  const filteredPlaces = filterPlaces(places, {
    searchQuery,
    regionId: selectedRegion,
    provinceId: selectedProvince,
    category: selectedCategory,
    onlyVerified,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-[#D8A84E]/30 pb-4 space-y-1">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8322A] font-bold">
          <HoaSenMotif size={16} />
          <span>DANH MỤC DI SẢN VÀ ĐIỂM ĐẾN VĂN HÓA</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#28231F]">
          Khám Phá Các Địa Điểm Di Sản
        </h1>
        <p className="text-xs sm:text-sm text-[#795548] max-w-2xl">
          Hồ sơ chi tiết về các di tích quốc gia, di sản phi vật thể, chùa tháp và làng nghề truyền thống phương Nam với tư liệu đã qua kiểm định.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#D8A84E]/40 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#795548]" />
            <input
              type="text"
              placeholder="Tìm kiếm địa điểm, dân tộc, nghề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded-lg text-[#28231F] focus:outline-none focus:ring-1 focus:ring-[#B8322A]"
            />
          </div>

          {/* Region selector */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedProvince('all');
            }}
            className="p-1.5 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded-lg text-[#28231F]"
            aria-label="Chọn khu vực"
          >
            <option value="all">Toàn bộ khu vực</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Province selector */}
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="p-1.5 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded-lg text-[#28231F]"
            aria-label="Chọn tỉnh thành"
          >
            <option value="all">Tất cả tỉnh thành</option>
            {provinces
              .filter((p) => selectedRegion === 'all' || p.region_id === selectedRegion)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.historical_names.length ? `(${p.historical_names[0]})` : ''}
                </option>
              ))}
          </select>

          {/* Category selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as HeritageCategory | 'all')}
            className="p-1.5 bg-[#F4EBDD] border border-[#D8A84E]/50 rounded-lg text-[#28231F]"
            aria-label="Chọn loại hình di sản"
          >
            <option value="all">Tất cả loại hình di sản</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Categories Pill Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#D8A84E]/20 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#B8322A] text-white'
                : 'bg-[#F4EBDD] text-[#795548] hover:text-[#28231F]'
            }`}
          >
            Tất Cả
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-[#B8322A] text-white'
                  : 'bg-[#F4EBDD] text-[#795548] hover:text-[#28231F]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Places Count and Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#795548]">
          <span>Hiển thị {filteredPlaces.length} địa điểm di sản</span>
          <span className="text-[#397C73] font-medium flex items-center gap-1">
            <ShieldCheck size={13} /> 100% tư liệu xác minh
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => {
            const isSaved = savedPlaceIds.includes(place.id);
            const isVisited = visitedPlaceIds.includes(place.id);

            return (
              <div
                key={place.id}
                className="group bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl overflow-hidden hover:border-[#B8322A] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    onClick={() => onSelectPlace(place)}
                    className="relative aspect-16/10 overflow-hidden bg-[#EBDDCA] cursor-pointer"
                  >
                    <HeritageImage
                      src={place.media[0]?.image_url}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {isVisited && (
                        <span className="bg-[#397C73] text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">
                          Đã ghé thăm
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/80 to-transparent p-2.5 text-white flex items-end justify-between">
                      <span className="text-[11px] font-medium">
                        {place.province_name}
                      </span>
                      <span className="text-xs font-bold text-[#D8A84E] flex items-center">
                        <Star size={11} className="fill-[#D8A84E] mr-0.5" />
                        {place.stats.rating}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1 text-[10px] text-[#795548] uppercase tracking-wider">
                      <span>{place.ethnic_context}</span>
                    </div>

                    <h3
                      onClick={() => onSelectPlace(place)}
                      className="font-serif font-bold text-base text-[#28231F] group-hover:text-[#B8322A] transition-colors cursor-pointer line-clamp-1"
                    >
                      {place.name}
                    </h3>

                    <p className="text-xs text-[#795548] line-clamp-2 leading-relaxed">
                      {place.short_description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-[#D8A84E]/20 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleSave(place.id)}
                      className={`p-1.5 rounded border transition-colors cursor-pointer ${
                        isSaved ? 'bg-[#B8322A]/10 border-[#B8322A] text-[#B8322A]' : 'border-[#D8A84E]/40 text-[#795548] hover:text-[#B8322A]'
                      }`}
                      title={isSaved ? 'Bỏ lưu' : 'Lưu vào danh sách'}
                      aria-label="Lưu địa điểm"
                    >
                      <Bookmark size={13} className={isSaved ? 'fill-[#B8322A]' : ''} />
                    </button>

                    <button
                      onClick={() => onToggleVisited(place.id)}
                      className={`px-2 py-1 rounded border text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                        isVisited ? 'bg-[#397C73] border-[#397C73] text-white' : 'border-[#397C73]/40 text-[#397C73] hover:bg-[#397C73]/10'
                      }`}
                    >
                      <CheckCircle size={11} />
                      <span>{isVisited ? 'Đã ghé' : 'Chưa ghé'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectPlace(place)}
                    className="text-xs font-semibold text-[#B8322A] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Xem Hồ Sơ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
