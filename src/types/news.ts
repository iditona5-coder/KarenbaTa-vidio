export type BottomTabId = 'beranda' | 'cari' | 'buat' | 'tersimpan' | 'akun';

export type ViewportMode = 'responsive' | 'android-phone' | 'android-phablet' | 'android-tablet';

export interface NewsPhoto {
  url: string;
  caption: string;
  photographer?: string;
  mediaType?: 'image' | 'video';
  durationLabel?: string;
  thumbnailUrl?: string;
  fileId?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string; // Ditampilkan maksimal 3 baris di kartu Beranda
  content: string[]; // Paragraf isi berita lengkap
  pullQuote?: string;
  photos: NewsPhoto[]; // Mendukung kombinasi foto & video dari galeri
  authorName: string;
  authorRole: string;
  authorEmail?: string;
  location: string;
  category: 'Budaya & Warisan' | 'Ekonomi Lokal' | 'Alam & Lingkungan' | 'Kuliner Nusantara' | 'Inovasi Daerah';
  publishedAt: string; // ISO string
  relativeTime: string; // contoh: "2 jam lalu"
  formattedDate: string; // contoh: "29 September 2026 · 14:15 WITA"
  readTimeMinutes: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  roleTitle: string;
  homeLocation: string;
  isSignedIn: boolean;
  photoURL?: string;
}
