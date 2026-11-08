import React from 'react';

/**
 * Authentic Vietnamese Folk decorative vector elements:
 * Dong Son bronze drum sun star, Chim Lac (Lac bird), Lotus petal, and Mekong water waves.
 */

export const DongSonStar: React.FC<{ className?: string; size?: number }> = ({ className = 'text-[#D8A84E]', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* 14-pointed central sun of Dong Son drum */}
    <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="50" cy="50" r="5" fill="currentColor" />
    {Array.from({ length: 14 }).map((_, i) => {
      const angle = (i * 360) / 14;
      return (
        <path
          key={i}
          d="M 50 18 L 47 40 L 53 40 Z"
          transform={`rotate(${angle} 50 50)`}
          fill="currentColor"
        />
      );
    })}
    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const ChimLacIcon: React.FC<{ className?: string; size?: number }> = ({ className = 'text-[#B8322A]', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 80"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* Stylized flying Lac bird from Dong Son bronze drum */}
    <path
      d="M 10 40 Q 30 35 45 42 Q 65 30 95 15 Q 115 5 110 20 Q 95 30 75 45 Q 90 50 115 55 Q 85 62 60 52 Q 40 55 25 65 Q 20 60 10 40 Z"
      fill="currentColor"
    />
    <circle cx="102" cy="18" r="2.5" fill="#FAF6EF" />
  </svg>
);

export const HoaSenMotif: React.FC<{ className?: string; size?: number }> = ({ className = 'text-[#B8322A]', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* Stylized Vietnamese lotus flower */}
    <path d="M 32 8 C 24 24 26 40 32 52 C 38 40 40 24 32 8 Z" fill="currentColor" />
    <path d="M 32 20 C 18 28 12 42 22 52 C 26 42 28 32 32 20 Z" fill="currentColor" opacity="0.85" />
    <path d="M 32 20 C 46 28 52 42 42 52 C 38 42 36 32 32 20 Z" fill="currentColor" opacity="0.85" />
    <path d="M 22 52 C 10 48 4 56 12 60 C 22 62 26 56 22 52 Z" fill="currentColor" opacity="0.7" />
    <path d="M 42 52 C 54 48 60 56 52 60 C 42 62 38 56 42 52 Z" fill="currentColor" opacity="0.7" />
  </svg>
);

export const SongNuocPattern: React.FC<{ className?: string }> = ({ className = 'text-[#397C73]/25' }) => (
  <svg
    className={`w-full h-4 ${className}`}
    preserveAspectRatio="none"
    viewBox="0 0 600 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="M 0 10 Q 25 2 50 10 T 100 10 T 150 10 T 200 10 T 250 10 T 300 10 T 350 10 T 400 10 T 450 10 T 500 10 T 550 10 T 600 10" />
    <path d="M 0 16 Q 25 8 50 16 T 100 16 T 150 16 T 200 16 T 250 16 T 300 16 T 350 16 T 400 16 T 450 16 T 500 16 T 550 16 T 600 16" opacity="0.6" />
  </svg>
);
