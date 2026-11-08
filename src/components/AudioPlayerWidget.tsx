import React, { useEffect, useRef, useState } from 'react';
import { Disc, ExternalLink, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';

// Danh sách các bản nhạc dân ca / di sản không lời
const HERITAGE_PLAYLIST = [
  {
    id: 'ly-con-sao-go-cong',
    title: 'Lý con sáo Gò Công (Không lời)',
    artist: 'Đàn tranh & Nhạc cụ dân tộc Nam Bộ',
    src: 'https://archive.org/download/RainbowQuest3005/30_05_Stephen-Addiss_Ly-con-sao.mp3',
    sourceUrl: 'https://archive.org/details/RainbowQuest3005',
  },
  {
    id: 'da-co-hoai-lang',
    title: 'Dạ cổ hoài lang (Không lời)',
    artist: 'Hòa tấu Đàn kìm & Đàn tranh',
    src: 'https://archive.org/download/VietnameseTraditionalMusic/DaCoHoaiLang_Instrumental.mp3',
    sourceUrl: 'https://nhacdanca.net/da-co-hoai-lang-6.html',
  },
  {
    id: 'ly-bong-dua',
    title: 'Lý bông dừa (Không lời)',
    artist: 'Hòa tấu dân ca Bến Tre',
    src: 'https://archive.org/download/VietnameseTraditionalMusic/LyBongDua_Instrumental.mp3',
    sourceUrl: 'https://nhacdanca.net/ly-bong-dua-2.html',
  },
  {
    id: 'tieng-dan-bau',
    title: 'Tiếng đàn bầu (Không lời)',
    artist: 'Độc tấu Đàn bầu',
    src: 'https://archive.org/download/VietnameseTraditionalMusic/DanBau_Traditional.mp3',
    sourceUrl: 'https://archive.org/details/VietnameseTraditionalMusic',
  },
];

export const AudioPlayerWidget: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [hasError, setHasError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const currentTrack = HERITAGE_PLAYLIST[currentIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tự động phát khi đổi bài nếu đang ở trạng thái Playing
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setHasError(true));
    }
  }, [currentIndex]);

  const handleToggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setHasError(false);
      } catch {
        setHasError(true);
      }
    } else {
      audio.pause();
    }
  };

  const handleNext = () => {
    setHasError(false);
    setCurrentIndex((prev) => (prev + 1) % HERITAGE_PLAYLIST.length);
  };

  const handlePrev = () => {
    setHasError(false);
    setCurrentIndex((prev) => (prev - 1 + HERITAGE_PLAYLIST.length) % HERITAGE_PLAYLIST.length);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);
    if (audioRef.current) audioRef.current.volume = nextVolume;
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Thẻ Audio ẩn */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleNext}
        onError={() => {
          setIsPlaying(false);
          setHasError(true);
        }}
      />

      {/* Nút đĩa nhạc nhỏ gọn trên thanh Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs transition-all cursor-pointer ${
          isPlaying
            ? 'border-[#B8322A] bg-[#B8322A]/10 text-[#B8322A]'
            : 'border-[#D8A84E]/40 bg-[#FAF6EF] text-[#795548] hover:border-[#B8322A]'
        }`}
        title="Bật/Tắt âm thanh di sản"
      >
        <Disc size={16} className={isPlaying ? 'animate-spin [animation-duration:4s]' : ''} />
        <span className="hidden xl:inline text-[11px] font-medium max-w-[95px] truncate">
          {isPlaying ? currentTrack.title : 'Âm thanh'}
        </span>
      </button>

      {/* Popup Bảng điều khiển chi tiết */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-[#D8A84E]/40 bg-[#FAF6EF] p-3 shadow-2xl z-[100] text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Thông tin bài hát */}
          <div className="flex items-center justify-between border-b border-[#D8A84E]/20 pb-2">
            <div className="min-w-0 flex-1 pr-2">
              <p className="truncate font-semibold text-[#28231F] text-xs">{currentTrack.title}</p>
              {hasError ? (
                <p className="truncate text-[10px] text-[#B8322A]" role="status">Không tải được bản thu này</p>
              ) : (
                <p className="truncate text-[10px] text-[#795548]">{currentTrack.artist}</p>
              )}
            </div>

            <a
              href={currentTrack.sourceUrl}
              target="_blank"
              rel="noreferrer"
              title="Xem nguồn tư liệu nhạc"
              className="shrink-0 text-[#795548] hover:text-[#B8322A] p-1"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Bộ điều khiển Playback (Prev - Play/Pause - Next) */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="text-[#795548] hover:text-[#28231F] p-1 cursor-pointer"
              title="Bài trước"
            >
              <SkipBack size={16} />
            </button>

            <button
              type="button"
              onClick={handleToggle}
              aria-label={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B8322A] text-white hover:bg-[#9E2A23] transition-colors cursor-pointer shadow-xs"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="text-[#795548] hover:text-[#28231F] p-1 cursor-pointer"
              title="Bài tiếp theo"
            >
              <SkipForward size={16} />
            </button>
          </div>

          {/* Thanh điều chỉnh âm lượng */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#D8A84E]/15">
            <button
              type="button"
              onClick={() => handleVolumeChange({ target: { value: volume === 0 ? '0.45' : '0' } } as any)}
              className="text-[#795548] hover:text-[#B8322A] cursor-pointer"
            >
              {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Điều chỉnh âm lượng"
              className="w-full h-1 cursor-pointer rounded-lg accent-[#B8322A] bg-[#EBDDCA]"
            />
          </div>

          {/* Danh sách bài hát thu gọn trong Popup */}
          <div className="space-y-1 pt-1">
            <p className="text-[10px] uppercase font-bold text-[#795548] tracking-wider flex items-center gap-1">
              <Music size={10} /> Danh sách bài phát
            </p>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {HERITAGE_PLAYLIST.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] truncate flex items-center justify-between cursor-pointer ${
                    currentIndex === idx
                      ? 'bg-[#B8322A]/10 text-[#B8322A] font-semibold'
                      : 'text-[#28231F]/80 hover:bg-[#EBDDCA]/40'
                  }`}
                >
                  <span className="truncate">{track.title}</span>
                  {currentIndex === idx && isPlaying && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8322A] shrink-0 ml-1"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};