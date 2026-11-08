import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Pause, Play, Volume2, VolumeX } from 'lucide-react';

export const AudioPlayerWidget: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

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

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);
    if (audioRef.current) audioRef.current.volume = nextVolume;
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-[#D8A84E]/40 bg-[#FAF6EF] px-3 py-1.5 shadow-xs">
      <audio
        ref={audioRef}
        src="https://archive.org/download/RainbowQuest3005/30_05_Stephen-Addiss_Ly-con-sao.mp3"
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
          setHasError(true);
        }}
      />
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isPlaying ? 'Tạm dừng Lý con sáo' : 'Phát Lý con sáo'}
        title={isPlaying ? 'Tạm dừng' : 'Phát bản thu Lý con sáo'}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EBDDCA] text-[#795548] transition-colors hover:bg-[#D8A84E] hover:text-[#28231F]"
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
      </button>
      <div className="min-w-0 text-xs leading-tight">
        <p className="truncate font-semibold text-[#28231F]">Lý con sáo</p>
        {hasError ? (
          <p className="truncate text-[10px] text-[#B8322A]" role="status">Không tải được bản thu</p>
        ) : (
          <p className="truncate text-[10px] text-[#795548]">Stephen Addiss · 1966</p>
        )}
      </div>
      <div className="hidden items-center gap-1.5 border-l border-[#D8A84E]/30 pl-2 sm:flex">
        {volume === 0 ? (
          <VolumeX size={13} className="text-[#795548]" aria-hidden="true" />
        ) : (
          <Volume2 size={13} className="text-[#795548]" aria-hidden="true" />
        )}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Điều chỉnh âm lượng"
          className="h-1 w-14 cursor-pointer rounded-lg accent-[#B8322A]"
        />
      </div>
      <a
        href="https://archive.org/details/RainbowQuest3005"
        target="_blank"
        rel="noreferrer"
        aria-label="Nguồn bản thu trên Internet Archive"
        title="Nghe và xem thông tin bản thu trên Internet Archive"
        className="shrink-0 text-[#795548] hover:text-[#B8322A]"
      >
        <ExternalLink size={13} />
      </a>
    </div>
  );
};
