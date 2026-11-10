import React, { useState, useEffect } from 'react';
import {
  Route,
  Plus,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Compass,
} from 'lucide-react';
import { Journey, Place } from '../types';
import { calculateRouteSummary } from '../utils/heritageLogic';
import { HeritageImage } from './HeritageImage';

interface JourneyPlannerProps {
  journeys: Journey[];
  allPlaces: Place[];
  onSelectPlace: (place: Place) => void;
  onCreateCustomJourney: (newJourney: Journey) => void;
  userCustomJourneys: Journey[];
}

export const JourneyPlanner: React.FC<JourneyPlannerProps> = ({
  journeys = [],
  allPlaces = [],
  onSelectPlace,
  onCreateCustomJourney,
  userCustomJourneys = [],
}) => {
  const allAvailableJourneys = [...journeys, ...userCustomJourneys];

  // Khởi tạo state an toàn (cho phép null nếu chưa có hành trình nào)
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(
    allAvailableJourneys.length > 0 ? allAvailableJourneys[0] : null
  );

  const [isBuildingNew, setIsBuildingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [completedStops, setCompletedStops] = useState<Record<string, boolean>>({});

  // Cập nhật selectedJourney khi danh sách hành trình thay đổi
  useEffect(() => {
    if (!selectedJourney && allAvailableJourneys.length > 0) {
      setSelectedJourney(allAvailableJourneys[0]);
    }
  }, [allAvailableJourneys, selectedJourney]);

  // Tính toán tóm tắt tuyến đi AN TOÀN (tránh crash khi selectedJourney là null)
  const currentRouteSummary = calculateRouteSummary(
    selectedJourney?.places || [],
    allPlaces
  );

  const toggleStopCompletion = (placeId: string) => {
    setCompletedStops((prev) => ({
      ...prev,
      [placeId]: !prev[placeId],
    }));
  };

  const handleSaveCustomJourney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || selectedPlaceIds.length === 0) return;

    const created: Journey = {
      id: `custom-journey-${Date.now()}`,
      slug: `custom-${Date.now()}`,
      title: newTitle.trim(),
      subtitle: 'Hành trình do người dùng thiết kế riêng',
      description: newDesc.trim() || 'Hành trình khám phá các di sản văn hóa yêu thích.',
      curator: 'Hành trình cá nhân của bạn',
      cover_image:
        allPlaces.find((p) => p.id === selectedPlaceIds[0])?.media[0]?.image_url || '',
      places: selectedPlaceIds,
      tags: ['Tự thiết kế', 'Hành trình cá nhân'],
      estimated_duration: `${Math.ceil(selectedPlaceIds.length * 0.75)} ngày`,
      cultural_theme: 'Khám phá tự chọn',
      is_official: false,
    };

    onCreateCustomJourney(created);
    setSelectedJourney(created);
    setIsBuildingNew(false);
    setNewTitle('');
    setNewDesc('');
    setSelectedPlaceIds([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header chính - LUÔN HIỂN THỊ DÙ CÓ DỮ LIỆU HAY KHÔNG */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8A84E]/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8322A] font-bold">
            <Route size={16} />
            <span>TUYẾN KHÁM PHÁ & THIẾT KẾ LỘ TRÌNH</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#28231F]">
            Hành Trình Di Sản Đông Nam Bộ
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] max-w-2xl">
            Lựa chọn những cung đường di sản được các nhà nghiên cứu gợi ý hoặc tự xây dựng lộ trình khám phá văn hóa của riêng bạn.
          </p>
        </div>

        <button
          onClick={() => setIsBuildingNew(!isBuildingNew)}
          className="px-4 py-2.5 bg-[#B8322A] text-white rounded-lg text-xs font-semibold hover:bg-[#9E2A23] transition-colors flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>{isBuildingNew ? 'Hủy Tạo Mới' : 'Tự Thiết Kế Tuyến Đi'}</span>
        </button>
      </div>

      {/* FORM TẠO HÀNH TRÌNH MỚI */}
      {isBuildingNew && (
        <form
          onSubmit={handleSaveCustomJourney}
          className="p-5 bg-[#FAF6EF] border border-[#B8322A] rounded-xl space-y-4 shadow-md"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-[#B8322A]">
            <Sparkles size={16} />
            <span>Thiết Kế Hành Trình Di Sản Cá Nhân</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#795548] block mb-1">
                Tên chuyến đi của bạn:
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Khám phá di sản gốm sứ và chùa cổ Đông Nam Bộ"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs p-2 rounded bg-[#F4EBDD] border border-[#D8A84E]/60 text-[#28231F]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#795548] block mb-1">
                Ghi chú / Mục tiêu hành trình:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Chụp ảnh tư liệu và tìm hiểu kỹ thuật làm gốm"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full text-xs p-2 rounded bg-[#F4EBDD] border border-[#D8A84E]/60 text-[#28231F]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#795548] block mb-1">
              Chọn các điểm dừng di sản (đã chọn: {selectedPlaceIds.length} địa điểm):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-[#F4EBDD] rounded border border-[#D8A84E]/30 text-xs">
              {allPlaces.map((p) => {
                const isChecked = selectedPlaceIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      isChecked ? 'bg-[#B8322A]/10 font-semibold text-[#B8322A]' : 'hover:bg-[#EBDDCA]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedPlaceIds((prev) => prev.filter((id) => id !== p.id));
                        } else {
                          setSelectedPlaceIds((prev) => [...prev, p.id]);
                        }
                      }}
                      className="accent-[#B8322A]"
                    />
                    <span className="truncate">{p.name} ({p.province_name})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBuildingNew(false)}
              className="px-3 py-1.5 text-xs text-[#795548] hover:bg-[#EBDDCA] rounded cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim() || selectedPlaceIds.length === 0}
              className="px-4 py-1.5 bg-[#B8322A] text-white text-xs font-semibold rounded hover:bg-[#9E2A23] disabled:opacity-50 cursor-pointer"
            >
              Lưu Tuyến Hành Trình
            </button>
          </div>
        </form>
      )}

      {/* HIỂN THỊ KHI KHÔNG CÓ HÀNH TRÌNH NÀO TRONG HỆ THỐNG */}
      {allAvailableJourneys.length === 0 ? (
        <div className="p-12 text-center bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl space-y-3">
          <Compass className="mx-auto text-[#795548]/50" size={40} />
          <h3 className="font-serif font-bold text-base text-[#28231F]">
            Chưa có tuyến hành trình nào
          </h3>
          <p className="text-xs text-[#795548] max-w-md mx-auto">
            Hệ thống chưa có tuyến khám phá mặc định. Bạn có thể bấm vào nút <strong className="text-[#B8322A]">"Tự Thiết Kế Tuyến Đi"</strong> ở trên để tạo lộ trình khám phá cá nhân đầu tiên.
          </p>
        </div>
      ) : selectedJourney ? (
        /* GRID KHÁM PHÁ HÀNH TRÌNH CHÍNH (KHI CÓ DỮ LIỆU) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cột trái: Danh sách hành trình */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#795548] px-1">
              Chọn Tuyến Khám Phá ({allAvailableJourneys.length})
            </span>

            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {allAvailableJourneys.map((j) => {
                const isSelected = selectedJourney?.id === j.id;
                return (
                  <div
                    key={j.id}
                    onClick={() => setSelectedJourney(j)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF6EF] border-[#B8322A] shadow-sm'
                        : 'bg-[#FAF6EF]/60 border-[#D8A84E]/30 hover:border-[#D8A84E]'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded overflow-hidden border border-[#D8A84E]/40 shrink-0">
                        <HeritageImage
                          src={j.cover_image}
                          alt={j.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[10px] text-[#795548]">
                          <span className="font-semibold text-[#397C73] uppercase">
                            {j.cultural_theme}
                          </span>
                          <span>{j.estimated_duration}</span>
                        </div>
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-[#28231F] truncate mt-0.5">
                          {j.title}
                        </h4>
                        <p className="text-[11px] text-[#795548] line-clamp-1 mt-1">
                          {j.places.length} điểm dừng · {j.curator}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột phải: Chi tiết hành trình được chọn */}
          <div className="lg:col-span-8 bg-[#FAF6EF] border border-[#D8A84E]/50 rounded-xl p-5 sm:p-6 space-y-6">
            <div className="space-y-2 border-b border-[#D8A84E]/30 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#397C73] uppercase tracking-wider">
                  {selectedJourney.cultural_theme}
                </span>
                <span className="bg-[#EBDDCA]/60 text-[#795548] px-2.5 py-0.5 rounded font-medium">
                  Thời gian ước tính: {selectedJourney.estimated_duration}
                </span>
              </div>

              <h2 className="font-serif text-2xl font-bold text-[#28231F]">
                {selectedJourney.title}
              </h2>

              <p className="font-serif italic text-xs sm:text-sm text-[#795548]">
                {selectedJourney.subtitle}
              </p>

              <p className="text-xs text-[#28231F]/90 leading-relaxed pt-1">
                {selectedJourney.description}
              </p>
            </div>

            {/* Thanh tổng quan thông số tuyến đi */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-[#F4EBDD] border border-[#D8A84E]/40 rounded-lg text-xs">
              <div>
                <span className="text-[#795548] block">Tổng số điểm dừng:</span>
                <strong className="text-sm font-bold text-[#28231F]">
                  {currentRouteSummary.stopsCount} địa điểm
                </strong>
              </div>

              <div>
                <span className="text-[#795548] block">Ước tính cung đường:</span>
                <strong className="text-sm font-bold text-[#B8322A]">
                  ~{currentRouteSummary.totalKm} km
                </strong>
              </div>

              <div>
                <span className="text-[#795548] block">Tiến độ đã ghé thăm:</span>
                <strong className="text-sm font-bold text-[#397C73]">
                  {selectedJourney.places.filter((id) => completedStops[id]).length} / {selectedJourney.places.length} điểm
                </strong>
              </div>
            </div>

            {/* Lộ trình điểm dừng */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-sm text-[#28231F] uppercase tracking-wider">
                Lộ Trình Các Điểm Dừng Di Sản
              </h3>

              <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D8A84E]/40">
                {currentRouteSummary.orderedPlaces.map((place, idx) => {
                  const isCompleted = completedStops[place.id];
                  return (
                    <div key={place.id} className="relative flex items-start gap-4 pl-8 group">
                      <button
                        onClick={() => toggleStopCompletion(place.id)}
                        className={`absolute left-0 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                          isCompleted
                            ? 'bg-[#397C73] border-[#397C73] text-white'
                            : 'bg-[#FAF6EF] border-[#D8A84E] text-[#B8322A] hover:bg-[#B8322A] hover:text-white'
                        }`}
                        title={isCompleted ? 'Đã hoàn thành điểm dừng' : 'Đánh dấu đã ghé'}
                      >
                        {isCompleted ? <CheckCircle size={15} /> : idx + 1}
                      </button>

                      <div className="flex-1 bg-[#F4EBDD]/60 border border-[#D8A84E]/30 rounded-lg p-3 hover:border-[#D8A84E] transition-all flex flex-col sm:flex-row gap-3">
                        <div className="w-full sm:w-24 h-24 rounded overflow-hidden shrink-0 border border-[#D8A84E]/30">
                          <HeritageImage
                            src={place.media[0]?.image_url}
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#795548] font-medium">
                              {place.province_name} · {place.ethnic_context}
                            </span>
                            <span className="text-[10px] text-[#397C73] font-semibold">
                              {place.stats.rating} ★ ({place.stats.reviewCount} đánh giá)
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-sm text-[#28231F]">
                            {place.name}
                          </h4>

                          <p className="text-xs text-[#28231F]/80 line-clamp-2 leading-relaxed">
                            {place.short_description}
                          </p>

                          <div className="pt-2 flex items-center justify-between">
                            <button
                              onClick={() => onSelectPlace(place)}
                              className="text-xs font-semibold text-[#B8322A] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Xem hồ sơ di sản</span>
                              <ArrowRight size={12} />
                            </button>

                            <button
                              onClick={() => toggleStopCompletion(place.id)}
                              className={`text-[11px] font-medium cursor-pointer ${
                                isCompleted ? 'text-[#397C73]' : 'text-[#795548] hover:text-[#28231F]'
                              }`}
                            >
                              {isCompleted ? '✓ Đã hoàn thành' : '○ Đánh dấu hoàn thành'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};