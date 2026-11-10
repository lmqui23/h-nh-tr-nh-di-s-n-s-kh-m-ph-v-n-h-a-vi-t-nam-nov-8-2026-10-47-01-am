import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Layers,
  Star,
  Bookmark,
  CheckCircle,
  Eye,
  Compass,
  List,
  Map as MapIcon,
} from 'lucide-react';
import { Place, HeritageCategory, Province } from '../types';
import { CATEGORIES } from '../data/heritageData';
import { filterPlaces } from '../utils/heritageLogic';
import { DongSonStar, SongNuocPattern } from './VietnamFolkMotifs';
import { HeritageImage } from './HeritageImage';

interface InteractiveMapProps {
  places: Place[];
  provinces: Province[];
  onSelectPlace: (place: Place) => void;
  savedPlaceIds: string[];
  visitedPlaceIds: string[];
  onToggleSave: (placeId: string) => void;
  onToggleVisited: (placeId: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  places = [],
  provinces = [],
  onSelectPlace,
  savedPlaceIds = [],
  visitedPlaceIds = [],
  onToggleSave,
  onToggleVisited,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<HeritageCategory | 'all'>('all');
  const [onlyVerified] = useState(false);
  const [activePlace, setActivePlace] = useState<Place | null>(places[0] || null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showCommunityLayer, setShowCommunityLayer] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapEngine, setMapEngine] = useState<'vector' | 'leaflet'>('vector');

  const leafletContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapInstance = useRef<unknown>(null);

  // Lọc danh sách địa điểm di sản (Đã bỏ lọc theo khu vực)
  const filteredPlaces = useMemo(() => {
    return filterPlaces(places, {
      searchQuery,
      provinceId: selectedProvince,
      category: selectedCategory,
      onlyVerified,
    });
  }, [places, searchQuery, selectedProvince, selectedCategory, onlyVerified]);

  // Cập nhật địa điểm active nếu địa điểm hiện tại bị lọc mất khỏi danh sách
  useEffect(() => {
    if (filteredPlaces.length > 0) {
      if (!activePlace || !filteredPlaces.some((p) => p.id === activePlace.id)) {
        setActivePlace(filteredPlaces[0]);
      }
    } else {
      setActivePlace(null);
    }
  }, [filteredPlaces, activePlace]);

  // Leaflet map setup
  useEffect(() => {
    let isCancelled = false;
    if (mapEngine === 'leaflet' && leafletContainerRef.current) {
      import('leaflet').then((L) => {
        if (isCancelled || !leafletContainerRef.current) return;
        if (leafletMapInstance.current) {
          (leafletMapInstance.current as { remove: () => void }).remove();
        }

        const map = L.map(leafletContainerRef.current).setView([10.85, 106.8], 9);
        leafletMapInstance.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        filteredPlaces.forEach((p) => {
          const marker = L.circleMarker([p.coordinates.lat, p.coordinates.lng], {
            radius: 8,
            fillColor: p.category_id === 'khao-co' ? '#354C68' : p.category_id === 'lang-nghe' ? '#397C73' : '#B8322A',
            color: '#FFFFFF',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          }).addTo(map);

          const popupContent = document.createElement('div');
          popupContent.className = 'p-3 text-xs';
          popupContent.innerHTML = `
            <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px; color: #B8322A;">${p.name}</div>
            <div style="color: #795548; margin-bottom: 4px;">${p.province_name} • ${p.ethnic_context}</div>
            <p style="margin-bottom: 6px; line-height: 1.4;">${p.short_description}</p>
          `;
          const btn = document.createElement('button');
          btn.innerText = 'Xem chi tiết tư liệu';
          btn.style.cssText = 'background: #B8322A; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; border: none; font-size: 11px;';
          btn.onclick = () => onSelectPlace(p);
          popupContent.appendChild(btn);

          marker.bindPopup(popupContent);
        });
      });
    }

    return () => {
      isCancelled = true;
      if (leafletMapInstance.current) {
        (leafletMapInstance.current as { remove: () => void }).remove();
        leafletMapInstance.current = null;
      }
    };
  }, [mapEngine, filteredPlaces, onSelectPlace]);

  // Tọa độ Vector chiếu
  const projectCoords = (lat: number, lng: number) => {
    const minLat = 10.2;
    const maxLat = 11.8;
    const minLng = 106.0;
    const maxLng = 107.6;

    const x = ((lng - minLng) / (maxLng - minLng)) * 800;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 600;
    return { x, y };
  };

  return (
    <div className="bg-[#FAF6EF] min-h-[calc(100vh-4rem)] flex flex-col pb-20 md:pb-4">
      {/* Search & Filter Header Strip */}
      <div className="bg-[#FAF6EF] border-b border-[#D8A84E]/30 px-3 sm:px-4 py-2.5 sticky top-14 sm:top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-[#795548]" size={15} />
            <input
              type="text"
              placeholder="Tìm địa điểm, tên cổ, dân tộc (Kinh, Hoa, Chăm)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F4EBDD] border border-[#D8A84E]/50 rounded-lg text-[#28231F] placeholder:text-[#795548]/70 focus:outline-none focus:ring-1 focus:ring-[#B8322A]"
            />
          </div>

          {/* Filter Dropdowns & Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            {/* Province selector - Lọc trực tiếp theo danh sách tỉnh thành */}
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="bg-[#F4EBDD] border border-[#D8A84E]/50 rounded-md px-2 py-1.5 text-xs text-[#28231F] min-h-[36px]"
              aria-label="Lọc theo tỉnh thành"
            >
              <option value="all">Tất Cả Tỉnh Thành</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as HeritageCategory | 'all')}
              className="bg-[#F4EBDD] border border-[#D8A84E]/50 rounded-md px-2 py-1.5 text-xs text-[#28231F] min-h-[36px]"
              aria-label="Lọc theo loại hình di sản"
            >
              <option value="all">Tất Cả Loại Hình</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Community Layer Toggle */}
            <button
              onClick={() => setShowCommunityLayer(!showCommunityLayer)}
              className={`px-2.5 py-1.5 rounded-md border text-xs flex items-center gap-1 cursor-pointer transition-colors min-h-[36px] ${
                showCommunityLayer
                  ? 'bg-[#397C73]/15 text-[#397C73] border-[#397C73]/40 font-medium'
                  : 'bg-[#F4EBDD] text-[#795548] border-[#D8A84E]/40'
              }`}
              title="Bật/tắt lớp dữ liệu bài viết và trải nghiệm cộng đồng"
            >
              <Layers size={13} />
              <span className="hidden sm:inline">Cộng Đồng</span>
            </button>

            {/* View Mode Toggle (Map vs List) */}
            <div className="flex items-center border border-[#D8A84E]/40 rounded-md overflow-hidden bg-[#F4EBDD] min-h-[36px]">
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 cursor-pointer ${viewMode === 'map' ? 'bg-[#B8322A] text-white' : 'text-[#795548] hover:text-[#28231F]'}`}
                title="Chế độ xem bản đồ"
                aria-label="Xem bản đồ"
              >
                <MapIcon size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 cursor-pointer ${viewMode === 'list' ? 'bg-[#B8322A] text-white' : 'text-[#795548] hover:text-[#28231F]'}`}
                title="Chế độ xem danh sách"
                aria-label="Xem danh sách"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map & Sidebar Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 min-h-[560px] p-2 sm:p-4 gap-4">
        {/* Map Viewport Area */}
        <div
          className={`${
            viewMode === 'list' ? 'hidden lg:block' : 'block'
          } lg:col-span-8 bg-[#F4EBDD] border border-[#D8A84E]/40 rounded-xl overflow-hidden relative shadow-sm flex flex-col h-[520px] sm:h-[600px]`}
        >
          {/* Map Top Bar Controls */}
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
            <div className="bg-[#FAF6EF]/90 backdrop-blur-xs border border-[#D8A84E]/50 rounded-lg p-1 flex items-center gap-1 shadow-xs text-xs">
              <button
                onClick={() => setMapEngine('vector')}
                className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                  mapEngine === 'vector' ? 'bg-[#B8322A] text-white' : 'text-[#795548] hover:text-[#28231F]'
                }`}
              >
                Bản Đồ Cổ Điển
              </button>
              <button
                onClick={() => setMapEngine('leaflet')}
                className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                  mapEngine === 'leaflet' ? 'bg-[#B8322A] text-white' : 'text-[#795548] hover:text-[#28231F]'
                }`}
              >
                Vệ Tinh (OSM)
              </button>
            </div>
          </div>

          {/* Zoom controls for vector map */}
          {mapEngine === 'vector' && (
            <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1 bg-[#FAF6EF]/90 backdrop-blur-xs border border-[#D8A84E]/50 rounded-lg p-1 shadow-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                className="w-8 h-8 flex items-center justify-center font-bold text-sm text-[#28231F] hover:bg-[#EBDDCA] rounded cursor-pointer"
                title="Phóng to"
                aria-label="Phóng to bản đồ"
              >
                +
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="w-8 h-8 flex items-center justify-center text-[10px] text-[#795548] hover:bg-[#EBDDCA] rounded cursor-pointer"
                title="Đặt lại góc nhìn"
                aria-label="Đặt lại góc nhìn"
              >
                1x
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                className="w-8 h-8 flex items-center justify-center font-bold text-sm text-[#28231F] hover:bg-[#EBDDCA] rounded cursor-pointer"
                title="Thu nhỏ"
                aria-label="Thu nhỏ bản đồ"
              >
                -
              </button>
            </div>
          )}

          {/* Leaflet Container */}
          {mapEngine === 'leaflet' && (
            <div ref={leafletContainerRef} className="w-full h-full min-h-[460px]" />
          )}

          {/* Vector Cartographic Map Canvas */}
          {mapEngine === 'vector' && (
            <div className="relative w-full h-full bg-[#F4EBDD] overflow-hidden select-none">
              <svg
                viewBox="0 0 800 600"
                className="w-full h-full transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                }}
              >
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D8A84E" strokeWidth="0.5" strokeOpacity="0.2" />
                  </pattern>
                </defs>

                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Ocean / River background styling */}
                <path d="M 600,0 Q 650,200 800,400 L 800,0 Z" fill="#354C68" fillOpacity="0.08" />

                {/* Compass */}
                <g transform="translate(710, 80) scale(0.65)" opacity="0.6">
                  <DongSonStar size={80} />
                  <text x="38" y="15" fill="#B8322A" fontSize="14" fontWeight="bold" textAnchor="middle">
                    BẮC
                  </text>
                </g>

                {/* Tên các Tỉnh */}
                {provinces.map((prov) => {
                  const coords = projectCoords(prov.center_coords[0], prov.center_coords[1]);
                  return (
                    <g key={prov.id} className="cursor-default pointer-events-none">
                      <circle cx={coords.x} cy={coords.y} r="28" fill="#D8A84E" fillOpacity="0.06" />
                      <text
                        x={coords.x}
                        y={coords.y - 14}
                        fill="#795548"
                        fontSize="10"
                        fontWeight="600"
                        textAnchor="middle"
                        letterSpacing="1"
                        opacity="0.8"
                      >
                        {prov.name.toUpperCase()}
                      </text>
                    </g>
                  );
                })}

                {/* Cultural Markers */}
                {filteredPlaces.map((place) => {
                  const { x, y } = projectCoords(place.coordinates.lat, place.coordinates.lng);
                  const isSelected = activePlace?.id === place.id;
                  const isVisited = visitedPlaceIds.includes(place.id);

                  const markerColor =
                    place.category_id === 'khao-co'
                      ? '#354C68'
                      : place.category_id === 'lang-nghe'
                      ? '#397C73'
                      : '#B8322A';

                  return (
                    <g
                      key={place.id}
                      transform={`translate(${x}, ${y})`}
                      onClick={() => setActivePlace(place)}
                      className="cursor-pointer group"
                      role="button"
                      aria-label={`Địa điểm: ${place.name}`}
                    >
                      {isSelected && (
                        <circle
                          r="20"
                          fill="none"
                          stroke={markerColor}
                          strokeWidth="2"
                          className="animate-ping opacity-40"
                        />
                      )}

                      {isVisited && (
                        <circle r="14" fill="none" stroke="#397C73" strokeWidth="2.5" strokeDasharray="2,2" />
                      )}

                      <circle
                        r={isSelected ? '11' : '8.5'}
                        fill={isSelected ? '#FAF6EF' : markerColor}
                        stroke={isSelected ? markerColor : '#FAF6EF'}
                        strokeWidth={isSelected ? '3' : '2'}
                        className="transition-all duration-200 shadow-md group-hover:scale-125"
                      />

                      <circle r="3.5" fill={isSelected ? markerColor : '#FAF6EF'} />

                      <text
                        x="0"
                        y="18"
                        fill="#28231F"
                        fontSize={isSelected ? '11' : '9.5'}
                        fontWeight={isSelected ? 'bold' : '500'}
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow-xs"
                      >
                        {place.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-20">
                <SongNuocPattern />
              </div>
            </div>
          )}

          {/* Active Place Popup Card overlay on map */}
          {activePlace && (
            <div className="p-3 bg-[#FAF6EF]/98 border-t border-[#D8A84E]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-20 w-full overflow-hidden">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 w-full overflow-hidden">
                <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 border border-[#D8A84E]/40">
                  <HeritageImage
                    src={activePlace.media[0]?.image_url}
                    alt={activePlace.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-serif font-bold text-xs sm:text-sm text-[#28231F] truncate">
                      {activePlace.name}
                    </span>
                    {activePlace.verification_status === 'verified' && (
                      <span className="text-[10px] text-[#397C73] flex items-center gap-0.5 font-medium shrink-0">
                        <CheckCircle size={10} /> Đã kiểm chứng
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#795548] flex items-center gap-1.5 mt-0.5 overflow-hidden flex-wrap">
                    <span>{activePlace.province_name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate max-w-[140px] sm:max-w-none">{activePlace.ethnic_context}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center text-[#B8322A] font-semibold shrink-0">
                      <Star size={10} className="fill-[#B8322A] mr-0.5" />
                      {activePlace.stats.rating}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#28231F]/80 line-clamp-1 mt-0.5 max-w-full">
                    {activePlace.short_description}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0">
                <button
                  onClick={() => onToggleSave(activePlace.id)}
                  className={`p-2 rounded-md border text-xs cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors ${
                    savedPlaceIds.includes(activePlace.id)
                      ? 'bg-[#B8322A]/10 border-[#B8322A] text-[#B8322A]'
                      : 'border-[#D8A84E]/50 text-[#795548] hover:text-[#B8322A]'
                  }`}
                  title={savedPlaceIds.includes(activePlace.id) ? 'Bỏ lưu' : 'Lưu địa điểm'}
                  aria-label="Lưu địa điểm"
                >
                  <Bookmark
                    size={14}
                    className={savedPlaceIds.includes(activePlace.id) ? 'fill-[#B8322A]' : ''}
                  />
                </button>

                <button
                  onClick={() => onToggleVisited(activePlace.id)}
                  className={`px-3 py-1.5 rounded-md border text-xs cursor-pointer min-h-[38px] transition-colors flex items-center gap-1 ${
                    visitedPlaceIds.includes(activePlace.id)
                      ? 'bg-[#397C73] border-[#397C73] text-white'
                      : 'border-[#397C73]/50 text-[#397C73] hover:bg-[#397C73]/10'
                  }`}
                  title="Đánh dấu đã ghé thăm"
                >
                  <CheckCircle size={13} />
                  <span>{visitedPlaceIds.includes(activePlace.id) ? 'Đã Ghé' : 'Chưa Ghé'}</span>
                </button>

                <button
                  onClick={() => onSelectPlace(activePlace)}
                  className="px-3.5 py-1.5 bg-[#B8322A] text-white rounded-md text-xs font-semibold hover:bg-[#9E2A23] min-h-[38px] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye size={13} />
                  <span>Hồ Sơ Di Sản</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Places List Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#795548] px-1">
            <span>Danh Sách Di Sản ({filteredPlaces.length})</span>
            <span className="text-[11px] font-normal lowercase">chạm để định vị</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-1">
            {filteredPlaces.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF6EF] border border-[#D8A84E]/30 rounded-xl">
                <Compass className="mx-auto text-[#795548]/50 mb-2" size={32} />
                <p className="text-xs font-medium text-[#795548]">Không tìm thấy địa điểm phù hợp</p>
                <p className="text-[11px] text-[#795548]/70 mt-1">
                  Hãy thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.
                </p>
              </div>
            ) : (
              filteredPlaces.map((place) => {
                const isSelected = activePlace?.id === place.id;

                return (
                  <div
                    key={place.id}
                    onClick={() => {
                      setActivePlace(place);
                      setViewMode('map');
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF6EF] border-[#B8322A] shadow-xs'
                        : 'bg-[#FAF6EF]/70 border-[#D8A84E]/30 hover:border-[#D8A84E] hover:bg-[#FAF6EF]'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded overflow-hidden border border-[#D8A84E]/30 shrink-0">
                        <HeritageImage
                          src={place.media[0]?.image_url}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-serif font-bold text-xs sm:text-sm text-[#28231F] truncate">
                            {place.name}
                          </h4>
                          <span className="text-[11px] text-[#B8322A] font-semibold flex items-center shrink-0">
                            <Star size={10} className="fill-[#B8322A] mr-0.5" />
                            {place.stats.rating}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#795548] flex items-center gap-1 mt-0.5 truncate">
                          <span>{place.province_name}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{place.ethnic_context}</span>
                        </div>

                        <p className="text-[11px] text-[#28231F]/70 line-clamp-1 mt-1">
                          {place.short_description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};