import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { BottomTabId, NewsArticle, NewsPhoto, UserProfile, ViewportMode } from '../types/news';
import { INITIAL_NEWS_ARTICLES } from '../data/initialNews';

interface CreateNewsInput {
  title: string;
  summary: string;
  contentParagraphs: string[];
  pullQuote?: string;
  location: string;
  category: NewsArticle['category'];
  photos: NewsPhoto[];
}

interface KarebataContextType {
  articles: NewsArticle[];
  savedIds: string[];
  savedArticles: NewsArticle[];
  activeTab: BottomTabId;
  setActiveTab: (tab: BottomTabId) => void;
  selectedArticle: NewsArticle | null;
  openArticleDetail: (article: NewsArticle) => void;
  closeArticleDetail: () => void;
  toggleSaveArticle: (articleId: string) => void;
  isArticleSaved: (articleId: string) => boolean;
  createArticle: (input: CreateNewsInput) => NewsArticle;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedRegion: string;
  setSelectedRegion: (r: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  filteredArticles: NewsArticle[];
  user: UserProfile;
  signInWithGoogle: (customName?: string, customEmail?: string, customLocation?: string) => void;
  signOutUser: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  activeFeedIndex: number;
  setActiveFeedIndex: (idx: number) => void;
  viewportMode: ViewportMode;
  setViewportMode: (mode: ViewportMode) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  pendingMedia: NewsPhoto | null;
  setPendingMedia: (media: NewsPhoto | null) => void;
  isMediaLoading: boolean;
  setIsMediaLoading: (loading: boolean) => void;
}

const STORAGE_KEYS = {
  ARTICLES: 'karebata_articles_v1',
  SAVED_IDS: 'karebata_saved_ids_v1',
  USER: 'karebata_user_v1'
};

const DEFAULT_USER: UserProfile = {
  uid: 'google-uid-makassar-01',
  displayName: 'Andi Pallawa Gau',
  email: 'puasa2768@gmail.com',
  roleTitle: 'Kontributor Jurnalis Warga',
  homeLocation: 'Makassar, Sulawesi Selatan',
  isSignedIn: true
};

const KarebataContext = createContext<KarebataContextType | undefined>(undefined);

export const KarebataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<NewsArticle[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ARTICLES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_NEWS_ARTICLES;
  });

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVED_IDS);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return ['kareba-01', 'kareba-04'];
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  });

  const [activeTab, setActiveTab] = useState<BottomTabId>('beranda');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Semua Daerah');
  const [selectedCategory, setSelectedCategory] = useState('Semua Topik');
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('responsive');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingMedia, setPendingMedia] = useState<NewsPhoto | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    } catch {
      // ignore
    }
  }, [articles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_IDS, JSON.stringify(savedIds));
    } catch {
      // ignore
    }
  }, [savedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const toggleSaveArticle = (articleId: string) => {
    setSavedIds((prev) => {
      const exists = prev.includes(articleId);
      const next = exists ? prev.filter((id) => id !== articleId) : [articleId, ...prev];
      showToast(exists ? 'Dihapus dari daftar Tersimpan' : 'Berita disimpan ke koleksi bacaan');
      return next;
    });
  };

  const isArticleSaved = (articleId: string) => savedIds.includes(articleId);

  const openArticleDetail = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  const closeArticleDetail = () => {
    setSelectedArticle(null);
  };

  const createArticle = (input: CreateNewsInput): NewsArticle => {
    const now = new Date();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} · ${hours}:${mins} WITA`;

    const wordCount = input.contentParagraphs.join(' ').split(/\s+/).length;
    const readTimeMinutes = Math.max(2, Math.ceil(wordCount / 160));

    const newArticle: NewsArticle = {
      id: `kareba-${Date.now()}`,
      title: input.title.trim(),
      summary: input.summary.trim(),
      content: input.contentParagraphs.filter((p) => p.trim().length > 0),
      pullQuote: input.pullQuote?.trim() || undefined,
      photos: input.photos,
      authorName: user.isSignedIn ? user.displayName : 'Kontributor Tamu Kareba’Ta',
      authorRole: user.isSignedIn ? user.roleTitle : 'Jurnalis Warga Sulawesi Selatan',
      authorEmail: user.isSignedIn ? user.email : undefined,
      location: input.location.trim(),
      category: input.category,
      publishedAt: now.toISOString(),
      relativeTime: 'Baru saja',
      formattedDate,
      readTimeMinutes
    };

    setArticles((prev) => [newArticle, ...prev]);
    setActiveFeedIndex(0);
    showToast('Kabar berhasil diterbitkan ke Beranda Kareba’Ta');
    return newArticle;
  };

  const signInWithGoogle = (customName?: string, customEmail?: string, customLocation?: string) => {
    const nextUser: UserProfile = {
      uid: `google-${Date.now()}`,
      displayName: customName?.trim() || 'Andi Pallawa Gau',
      email: customEmail?.trim() || 'puasa2768@gmail.com',
      roleTitle: 'Redaktur & Kontributor Lokal',
      homeLocation: customLocation?.trim() || 'Makassar, Sulawesi Selatan',
      isSignedIn: true
    };
    setUser(nextUser);
    showToast(`Masuk sebagai ${nextUser.displayName}`);
  };

  const signOutUser = () => {
    setUser((prev) => ({ ...prev, isSignedIn: false }));
    showToast('Berhasil keluar dari sesi Google Sign-In');
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
    showToast('Profil akun berhasil diperbarui');
  };

  const savedArticles = useMemo(
    () => articles.filter((a) => savedIds.includes(a.id)),
    [articles, savedIds]
  );

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesRegion =
        selectedRegion === 'Semua Daerah' ||
        article.location.toLowerCase().includes(selectedRegion.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Semua Topik' || article.category === selectedCategory;

      if (!matchesRegion || !matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.location.toLowerCase().includes(q) ||
        article.authorName.toLowerCase().includes(q) ||
        article.content.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [articles, searchQuery, selectedRegion, selectedCategory]);

  return (
    <KarebataContext.Provider
      value={{
        articles,
        savedIds,
        savedArticles,
        activeTab,
        setActiveTab,
        selectedArticle,
        openArticleDetail,
        closeArticleDetail,
        toggleSaveArticle,
        isArticleSaved,
        createArticle,
        searchQuery,
        setSearchQuery,
        selectedRegion,
        setSelectedRegion,
        selectedCategory,
        setSelectedCategory,
        filteredArticles,
        user,
        signInWithGoogle,
        signOutUser,
        updateUserProfile,
        activeFeedIndex,
        setActiveFeedIndex,
        viewportMode,
        setViewportMode,
        toastMessage,
        showToast,
        pendingMedia,
        setPendingMedia,
        isMediaLoading,
        setIsMediaLoading
      }}
    >
      {children}
    </KarebataContext.Provider>
  );
};

export const useKarebata = () => {
  const ctx = useContext(KarebataContext);
  if (!ctx) throw new Error('useKarebata must be used inside KarebataProvider');
  return ctx;
};
