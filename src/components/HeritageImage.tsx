import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

const DEFAULT_FALLBACK_IMAGE = '/assets/heritage/cho-noi-cai-rang.jpg';

interface HeritageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  aspectRatioClass?: string;
}

export const HeritageImage: React.FC<HeritageImageProps> = ({
  src,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  alt,
  className = 'w-full h-full object-cover',
  aspectRatioClass,
  ...props
}) => {
  const getInitialSrc = () => {
    if (src && typeof src === 'string' && src.trim().length > 0) {
      return src.trim();
    }
    return fallbackSrc;
  };

  const [currentSrc, setCurrentSrc] = useState<string>(getInitialSrc);

  useEffect(() => {
    if (src && typeof src === 'string' && src.trim().length > 0) {
      setCurrentSrc(src.trim());
    } else {
      setCurrentSrc(fallbackSrc);
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  const mediaPath = currentSrc.split(/[?#]/, 1)[0].toLowerCase();
  const isVideo = /\.(mp4|webm)$/.test(mediaPath);
  const isDocument = /\.pdf$/.test(mediaPath);

  return (
    <div className={`relative overflow-hidden bg-[#EBDDCA] ${aspectRatioClass || ''}`}>
      {isVideo ? (
        <video src={currentSrc} aria-label={alt} controls playsInline preload="metadata" className={className} onError={handleError} />
      ) : isDocument ? (
        <a href={currentSrc} target="_blank" rel="noreferrer" aria-label={`Mở tài liệu: ${alt}`} className="flex h-full min-h-20 w-full flex-col items-center justify-center gap-2 bg-[#F4EBDD] p-3 text-center text-xs font-semibold text-[#354C68] hover:text-[#B8322A]">
          <FileText size={24} />
          <span className="line-clamp-2">{alt || 'Mở tài liệu PDF'}</span>
        </a>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          className={className}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
};
