import React from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const MyFimesLogo: React.FC<Props> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs'
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* SVG Emblem representing the exact uploaded logo */}
      <div className={`relative shrink-0 ${iconSizes[size]} rounded-2xl bg-white/90 p-1 shadow-xs border border-purple-100 flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          {/* Leaves in green (#5C9450) */}
          <path
            d="M 28 58 C 22 52 24 44 32 44 C 34 50 32 58 28 58 Z"
            fill="#5C9450"
          />
          <path
            d="M 38 64 C 32 58 35 48 44 48 C 45 56 42 64 38 64 Z"
            fill="#6BA65E"
          />

          {/* Woman profile in Deep Purple (#582C7B) */}
          <path
            d="M 52 22 C 46 22 40 26 38 33 C 36 40 40 46 44 50 C 46 47 48 43 49 39 C 50 35 55 35 56 32 C 58 29 57 26 55 24 C 54 23 53 22 52 22 Z"
            fill="#582C7B"
          />
          {/* Face and hair sweep */}
          <path
            d="M 50 25 C 53 25 56 27 57 30 C 56 31 54 32 52 32 C 50 32 49 30 50 25 Z"
            fill="#FFF"
          />

          {/* Shopping bag held in hands in Purple (#6B308D) */}
          <path
            d="M 52 38 L 65 34 C 67 34 68 36 68 38 L 63 53 C 63 55 61 56 59 56 L 49 53 C 48 53 47 51 48 49 Z"
            fill="#6B308D"
          />
          {/* Bag handle */}
          <path
            d="M 56 37 C 56 32 63 31 64 35"
            stroke="#582C7B"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Swirling ribbon wrap in Magenta / Rose (#D94680 / #C2185B) */}
          <path
            d="M 36 52 C 30 45 35 36 44 38 C 54 40 60 52 69 46 C 72 44 73 39 71 36 C 68 33 60 38 58 45 C 55 54 48 68 38 64 C 42 66 52 62 58 54 C 64 46 72 44 71 52 C 70 58 60 63 50 67 C 44 70 38 68 36 52 Z"
            fill="url(#ribbonGrad)"
          />

          {/* Digital cursor pointer in Purple (#582C7B) */}
          <path
            d="M 67 52 L 74 64 L 71 65 L 75 73 L 72 74 L 68 66 L 64 68 Z"
            fill="#582C7B"
          />

          <defs>
            <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333EA" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#FB7185" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Name & Slogan */}
      <div className="flex flex-col">
        <div className="flex items-center leading-none">
          <span className={`font-black tracking-tight text-[#4A1D6E] ${textSizes[size]}`}>
            My
          </span>
          <span className={`font-black tracking-tight text-[#D94680] ${textSizes[size]} relative flex items-center`}>
            F
            {/* The "i" with a heart as the dot */}
            <span className="inline-flex flex-col items-center">
              <span className="text-[9px] -mb-1 text-[#D94680]">♥</span>
              <span>ı</span>
            </span>
            mes
          </span>
          <span className="text-[10px] font-extrabold uppercase ml-1.5 px-1.5 py-0.5 rounded-md bg-purple-100 text-[#582C7B]">
            MiFyMEs
          </span>
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-[1px] w-3 bg-purple-200 hidden sm:block" />
            <span className={`font-cursive text-[#8A3A6A] text-sm sm:text-base tracking-wide leading-none`}>
              Más que compras, impulsamos sus sueños
            </span>
            <span className="h-[1px] w-3 bg-purple-200 hidden sm:block" />
          </div>
        )}
      </div>
    </div>
  );
};
