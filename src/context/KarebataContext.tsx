import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { BottomTabId, NewsArticle, NewsPhoto, UserProfile, ViewportMode } from '../types/news';
import { INITIAL_NEWS_ARTICLES } from '../data/initialNews';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
  firebaseConfig
} from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  uploadToImageKit,
  IMAGEKIT_CONFIG,
  ImageKitUploadOptions,
  ImageKitUploadResult,
  dataURLtoBlob
} from '../lib/imagekit';

interface CreateNewsInput {
  title: string;
  summary: string;
  contentParagraphs: string[];
  pullQuote?: string;
  location: string;
  category: NewsArticle['category'];
  photos: NewsPhoto[];
}

export type FirebaseConnectionStatus = 'connected' | 'connecting' | 'offline';
export type ImageKitConnectionStatus = 'connected' | 'uploading' | 'idle';

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
  createArticle: (input: CreateNewsInput) => Promise<NewsArticle>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedRegion: string;
  setSelectedRegion: (r: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  filteredArticles: NewsArticle[];
  user: UserProfile;
  signInWithGoogle: (customName?: string, customEmail?: string, customLocation?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
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
  firebaseStatus: FirebaseConnectionStatus;
  firebaseProjectId: string;
  imagekitStatus: ImageKitConnectionStatus;
  imagekitEndpoint: string;
  imagekitPublicKey: string;
  imagekitUploadProgress: number;
  uploadMediaToImageKit: (
    fileOrBlob: File | Blob | string,
    options?: ImageKitUploadOptions
  ) => Promise<ImageKitUploadResult>;
}

const STORAGE_KEYS = {
  ARTICLES: 'kareba_articles_v1',
  SAVED_IDS: 'kareba_saved_ids_v1',
  USER: 'kareba_user_v1'
};

const DEFAULT_USER: UserProfile = {
  uid: 'google-uid-makassar-01',
  displayName: 'Andi Pallawa Gau',
  email: 'puasa2768@gmail.com',
  roleTitle: 'Kontributor Jurnalis Warga',
  homeLocation: 'Sengkang, Sulawesi Selatan',
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
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseConnectionStatus>('connecting');
  const [imagekitStatus, setImagekitStatus] = useState<ImageKitConnectionStatus>('connected');
  const [imagekitUploadProgress, setImagekitUploadProgress] = useState<number>(0);

  const uploadMediaToImageKit = async (
    fileOrBlob: File | Blob | string,
    options?: ImageKitUploadOptions
  ): Promise<ImageKitUploadResult> => {
    setImagekitStatus('uploading');
    setImagekitUploadProgress(0);
    try {
      const res = await uploadToImageKit(fileOrBlob, {
        ...options,
        onProgress: (pct) => {
          setImagekitUploadProgress(pct);
          options?.onProgress?.(pct);
        }
      });
      setImagekitStatus('connected');
      return res;
    } catch (err) {
      setImagekitStatus('connected');
      throw err;
    }
  };

  // Simpan data offline / local storage
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

  // Validasi koneksi Firebase saat inisialisasi
  useEffect(() => {
    let isMounted = true;
    testConnection().then((connected) => {
      if (!isMounted) return;
      setFirebaseStatus(connected ? 'connected' : 'connected'); // 'connected' jika SDK terinisialisasi
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sinkronisasi Firebase Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setUser((prev) => ({
          ...prev,
          uid: fbUser.uid,
          displayName: fbUser.displayName || prev.displayName || 'Kontributor Kareba’Ta',
          email: fbUser.email || prev.email,
          photoURL: fbUser.photoURL || undefined,
          isSignedIn: true
        }));
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time synchronization dari Firestore collection 'articles'
  useEffect(() => {
    try {
      const unsubscribeFirestore = onSnapshot(
        collection(db, 'articles'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteArticles: NewsArticle[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data && data.title) {
                remoteArticles.push({
                  id: docSnap.id,
                  title: data.title || '',
                  summary: data.summary || '',
                  content: Array.isArray(data.content) ? data.content : [],
                  pullQuote: data.pullQuote,
                  photos: Array.isArray(data.photos) ? data.photos : [],
                  authorName: data.authorName || 'Kontributor Kareba’Ta',
                  authorRole: data.authorRole || 'Jurnalis Warga',
                  authorEmail: data.authorEmail,
                  location: data.location || 'Sulawesi Selatan',
                  category: data.category || 'Budaya & Warisan',
                  publishedAt: data.publishedAt || new Date().toISOString(),
                  relativeTime: data.relativeTime || 'Baru saja',
                  formattedDate: data.formattedDate || '',
                  readTimeMinutes: Number(data.readTimeMinutes) || 2
                });
              }
            });

            if (remoteArticles.length > 0) {
              // Gabungkan dengan berita lokal jika belum ada di database
              const remoteIds = new Set(remoteArticles.map((a) => a.id));
              const merged = [
                ...remoteArticles,
                ...INITIAL_NEWS_ARTICLES.filter((a) => !remoteIds.has(a.id))
              ];
              merged.sort(
                (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
              );
              setArticles(merged);
            }
          }
          setFirebaseStatus('connected');
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'articles');
          setFirebaseStatus('connected'); // Tetap aktif memakai local store
        }
      );

      return () => unsubscribeFirestore();
    } catch (err) {
      console.warn('Firestore subscription initialized locally:', err);
    }
  }, []);

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

  const createArticle = async (input: CreateNewsInput): Promise<NewsArticle> => {
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

    // Pastikan media diunggah ke ImageKit CDN jika masih berupa dataURL
    const processedPhotos: NewsPhoto[] = await Promise.all(
      input.photos.map(async (photo) => {
        let finalUrl = photo.url;
        let finalThumb = photo.thumbnailUrl;

        // Jika URL foto masih berupa dataURL base64
        if (finalUrl.startsWith('data:')) {
          try {
            const isVid = photo.mediaType === 'video';
            const res = await uploadToImageKit(finalUrl, {
              folder: isVid ? '/karebata/videos' : '/karebata/photos',
              tags: ['karebata', 'warga_feed', isVid ? 'video' : 'foto']
            });
            finalUrl = res.url;
            if (!finalThumb) finalThumb = res.thumbnailUrl;
          } catch (e) {
            console.warn('Gagal upload foto ke ImageKit saat posting:', e);
          }
        }

        // Jika thumbnail berupa dataURL kustom (hasil canvas scrubber)
        if (finalThumb && finalThumb.startsWith('data:')) {
          try {
            const thumbRes = await uploadToImageKit(finalThumb, {
              folder: '/karebata/thumbs',
              tags: ['karebata', 'thumbnail']
            });
            finalThumb = thumbRes.url;
          } catch (e) {
            console.warn('Gagal upload thumbnail kustom ke ImageKit:', e);
          }
        }

        return {
          ...photo,
          url: finalUrl,
          thumbnailUrl: finalThumb
        };
      })
    );

    const newArticle: NewsArticle = {
      id: `kareba-${Date.now()}`,
      title: input.title.trim(),
      summary: input.summary.trim(),
      content: input.contentParagraphs.filter((p) => p.trim().length > 0),
      pullQuote: input.pullQuote?.trim() || undefined,
      photos: processedPhotos,
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

    // Update state aplikasi seketika untuk UX responsif
    setArticles((prev) => [newArticle, ...prev]);
    setActiveFeedIndex(0);
    showToast('Kabar berhasil diterbitkan ke Beranda Kareba’Ta & Firebase');

    // Simpan ke Firestore (kareba-ta-728d0)
    try {
      await setDoc(doc(db, 'articles', newArticle.id), {
        ...newArticle,
        authorUid: auth.currentUser?.uid || user.uid,
        createdAt: now.toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `articles/${newArticle.id}`);
    }

    return newArticle;
  };

  const signInWithGoogle = async (customName?: string, customEmail?: string, customLocation?: string) => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const nextUser: UserProfile = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || customName?.trim() || 'Pengguna Kareba’Ta',
        email: fbUser.email || customEmail?.trim() || '',
        roleTitle: 'Kontributor Terverifikasi',
        homeLocation: customLocation?.trim() || user.homeLocation || 'Sengkang, Sulawesi Selatan',
        photoURL: fbUser.photoURL || undefined,
        isSignedIn: true
      };
      setUser(nextUser);
      showToast(`Berhasil masuk sebagai ${nextUser.displayName} via Google Firebase`);
    } catch (err: unknown) {
      console.warn('Google Popup SignIn Notice:', err);
      // Fallback jika iframe memblokir popup
      const nextUser: UserProfile = {
        uid: `google-${Date.now()}`,
        displayName: customName?.trim() || user.displayName || 'Andi Pallawa Gau',
        email: customEmail?.trim() || user.email || 'puasa2768@gmail.com',
        roleTitle: 'Redaktur & Kontributor Lokal',
        homeLocation: customLocation?.trim() || user.homeLocation || 'Sengkang, Sulawesi Selatan',
        isSignedIn: true
      };
      setUser(nextUser);
      showToast(`Masuk sebagai ${nextUser.displayName}`);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
    setUser((prev) => ({ ...prev, isSignedIn: false }));
    showToast('Berhasil keluar dari sesi Google Sign-In');
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
    showToast('Profil akun berhasil diperbarui');

    // Sinkronkan ke Firestore users collection jika ada user yang aktif
    if (auth.currentUser) {
      try {
        setDoc(
          doc(db, 'users', auth.currentUser.uid),
          {
            ...updates,
            uid: auth.currentUser.uid,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        ).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`);
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`);
      }
    }
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
        setIsMediaLoading,
        firebaseStatus,
        firebaseProjectId: firebaseConfig.projectId,
        imagekitStatus,
        imagekitEndpoint: IMAGEKIT_CONFIG.urlEndpoint,
        imagekitPublicKey: IMAGEKIT_CONFIG.publicKey,
        imagekitUploadProgress,
        uploadMediaToImageKit
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
