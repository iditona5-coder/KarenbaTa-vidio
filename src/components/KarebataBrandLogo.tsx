import React from 'react';

export interface KarebataBrandLogoProps {
  className?: string;
  pinSize?: number;
  showTagline?: boolean;
  variant?: 'badge' | 'transparent';
  onClick?: () => void;
}

/**
 * Logo Resmi Kareba'Ta sesuai foto referensi IMG-20260927-WA7383.jpg:
 * 1. Pin Lokasi: Kuning Emas (#EAA000 / #E5A800), bentuk pin tetesan air presisi.
 *    Huruf "K" di dalam pin menggunakan FONT YANG SAMA PERSIS dengan teks logo (Poppins / Montserrat 900 Black).
 * 2. Tulisan "Kareba": Hijau tua botol (#006837) font Poppins 900 Black.
 * 3. Tanda Petik "'": Hijau tua botol (#006837) dari font yang sama.
 * 4. Tulisan "Ta": Kuning Emas (#EAA000) font Poppins 900 Black.
 * 5. Tagline: "beritamu suaramu" huruf kecil warna Kuning Emas (#EAA000) font Poppins 700.
 */
export const KarebataBrandLogo: React.FC<KarebataBrandLogoProps> = ({
  className = '',
  pinSize = 28,
  showTagline = true,
  variant = 'transparent',
  onClick
}) => {
  // Warna Resmi Identitas Brand Sesuai Foto
  const BRAND_YELLOW = '#EAA000'; // Kuning Emas Pin, Ta & Tagline
  // Gunakan hijau cerah berkontras tinggi di background gelap jika transparan (tanpa bar putih)
  const isBadge = variant === 'badge';
  const BRAND_GREEN = isBadge ? '#006837' : '#00A859';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none transition-transform active:scale-[0.98] ${
        isBadge
          ? 'bg-white px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl shadow-xs border border-stone-100'
          : 'bg-transparent'
      } ${
        onClick ? 'cursor-pointer hover:opacity-95' : 'pointer-events-none'
      } ${className}`}
      style={{ fontFamily: "'Poppins', 'Montserrat', system-ui, -apple-system, sans-serif" }}
    >
      {/* 1. PIN LOKASI KUNING EMAS DENGAN HURUF 'K' DARI FONT YANG SAMA */}
      <div
        style={{
          width: `${pinSize}px`,
          height: `${Math.round((pinSize * 135) / 100)}px`
        }}
        className="shrink-0 flex items-center justify-center relative drop-shadow-xs"
      >
        <svg
          viewBox="0 0 100 135"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>
            {`
              .karebata-pin-k {
                font-family: 'Poppins', 'Montserrat', system-ui, -apple-system, sans-serif;
                font-weight: 900;
                font-size: 46px;
                fill: #FFFFFF;
                user-select: none;
              }
            `}
          </style>

          {/* Bentuk Pin Lokasi Presisi Tetesan Air / Pin GPS */}
          <path
            d="M 50 6 C 72.5 6 90 23.5 90 46 C 90 68 76 94 52 126 C 51.1 127.2 48.9 127.2 48 126 C 24 94 10 68 10 46 C 10 23.5 27.5 6 50 6 Z"
            fill={BRAND_YELLOW}
          />

          {/* Huruf K Putih di Dalam Pin - Menggunakan Font Tipografi yang Sama Persis dengan Teks Kareba'Ta */}
          <text
            x="50"
            y="49"
            textAnchor="middle"
            dominantBaseline="central"
            className="karebata-pin-k"
          >
            K
          </text>
        </svg>
      </div>

      {/* 2. TEKS KAREBA'TA & TAGLINE BERITAMU SUARAMU */}
      <div className="flex flex-col justify-center leading-none">
        {/* Teks Utama: Kareba'Ta */}
        <div className="flex items-center leading-none font-[900] tracking-[-0.02em] text-[18px] sm:text-[20.5px]">
          {/* Kareba */}
          <span
            style={{ color: BRAND_GREEN }}
            className="font-[900]"
          >
            Kareba
          </span>

          {/* Tanda Petik "'" Hijau Senada */}
          <span
            style={{ color: BRAND_GREEN }}
            className="font-[900] mx-[0.5px]"
          >
            '
          </span>

          {/* Ta */}
          <span
            style={{ color: BRAND_YELLOW }}
            className="font-[900]"
          >
            Ta
          </span>
        </div>

        {/* Tagline: beritamu suaramu */}
        {showTagline && (
          <div
            style={{ color: BRAND_YELLOW }}
            className="font-[700] text-[8.5px] sm:text-[9.5px] tracking-[0.05em] lowercase mt-[2px] leading-none"
          >
            beritamu suaramu
          </div>
        )}
      </div>
    </div>
  );
};
