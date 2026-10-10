import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Camera,
  User,
  Trash2,
  Bookmark,
  ChevronUp,
  ChevronDown,
  LogOut,
  CheckCircle2,
  ImagePlus,
  Video,
  Volume2,
  VolumeX,
  Star,
  Code2,
  ArrowUpRight,
  X,
  Cloud,
  Database,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  FolderCheck
} from 'lucide-react';
import { useKarebata } from '../context/KarebataContext';
import { NewsArticle, NewsPhoto } from '../types/news';
import { SmartImage, isVideoSource } from './SmartImage';
import { KarebataBrandLogo } from './KarebataBrandLogo';

const formatDurationSeconds = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Ekstraksi Thumbnail Video Instan (Menggunakan File Blob / Canvas HTML5)
 * Menghasilkan gambar statis format JPEG berkualitas tinggi untuk sampul video
 */
export const captureVideoThumbnail = (
  source: string | File,
  targetTime?: number
): Promise<string> => {
  return new Promise((resolve) => {
    let objectUrl = '';
    let isCreatedUrl = false;

    if (source instanceof File) {
      try {
        objectUrl = URL.createObjectURL(source);
        isCreatedUrl = true;
      } catch {
        objectUrl = '';
      }
    } else {
      objectUrl = source;
    }

    if (!objectUrl) {
      resolve('');
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    (video as any).playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('muted', 'true');
    video.preload = 'auto';

    let finished = false;
    let timerId: any = null;

    const cleanup = () => {
      if (timerId) clearTimeout(timerId);
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch {
        // ignore
      }
      if (isCreatedUrl && objectUrl.startsWith('blob:')) {
        setTimeout(() => {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {
            // ignore
          }
        }, 5000);
      }
    };

    const done = (data: string) => {
      if (!finished) {
        finished = true;
        cleanup();
        resolve(data);
      }
    };

    const drawFrame = (): boolean => {
      try {
        const w = video.videoWidth || 480;
        const h = video.videoHeight || 854;
        if (w > 0 && h > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            if (dataUrl && dataUrl.length > 200) {
              done(dataUrl);
              return true;
            }
          }
        }
      } catch (e) {
        console.warn('Gagal render canvas frame thumbnail:', e);
      }
      return false;
    };

    video.onloadedmetadata = () => {
      const dur = video.duration || 1;
      let seekTo = 0.15;
      if (typeof targetTime === 'number' && targetTime >= 0) {
        seekTo = Math.min(targetTime, Math.max(0, dur - 0.1));
      } else {
        seekTo = Math.min(0.2, dur > 0.5 ? dur * 0.1 : 0.1);
      }
      try {
        video.currentTime = seekTo;
      } catch {
        // fallback
      }
    };

    video.onseeked = () => {
      drawFrame();
    };

    video.onloadeddata = () => {
      setTimeout(() => {
        if (!finished) drawFrame();
      }, 80);
    };

    video.oncanplay = () => {
      setTimeout(() => {
        if (!finished) drawFrame();
      }, 100);
    };

    video.onerror = () => done('');

    // Safety timeout
    timerId = setTimeout(() => {
      if (!drawFrame()) {
        done('');
      }
    }, 3500);

    video.src = objectUrl;
    video.load();
  });
};

/* ============================================================================
 * CUSTOM SCROLL ENGINE (100% Non-Browser Scroll — translate3d + Custom Inertia)
 * Menggantikan semua scroll bawaan browser (overflow-y-auto / overflow-x-auto)
 * ========================================================================== */
export const CustomScrollView: React.FC<{
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  fadeEdges?: boolean;
}> = ({ children, className = '', contentClassName = '', fadeEdges = false }) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const offsetYRef = useRef(0);
  const velocityYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const totalMovedRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const applyEdgeMask = useCallback(
    (currentOffset: number) => {
      if (!fadeEdges) return;
      const vp = viewportRef.current;
      const ct = contentRef.current;
      if (!vp || !ct) return;

      const minOffset = Math.min(0, vp.clientHeight - ct.scrollHeight);
      const canScroll = minOffset < -2;

      if (!canScroll) {
        vp.style.webkitMaskImage = 'none';
        vp.style.maskImage = 'none';
        return;
      }

      const showTopFade = currentOffset < -2;
      const showBottomFade = currentOffset > minOffset + 2;

      const maskValue =
        showTopFade && showBottomFade
          ? 'linear-gradient(to bottom, transparent 0px, black 36px, black calc(100% - 36px), transparent 100%)'
          : showTopFade
          ? 'linear-gradient(to bottom, transparent 0px, black 36px, black 100%)'
          : showBottomFade
          ? 'linear-gradient(to bottom, black 0px, black calc(100% - 36px), transparent 100%)'
          : 'none';

      vp.style.webkitMaskImage = maskValue;
      vp.style.maskImage = maskValue;
    },
    [fadeEdges]
  );

  const clampOffset = useCallback((nextY: number) => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return 0;
    const minOffset = Math.min(0, vp.clientHeight - ct.scrollHeight);
    return Math.max(minOffset, Math.min(0, nextY));
  }, []);

  const renderOffset = useCallback(
    (nextY: number) => {
      const clamped = clampOffset(nextY);
      offsetYRef.current = clamped;
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${clamped}px, 0)`;
      }
      if (fadeEdges) {
        applyEdgeMask(clamped);
      }
    },
    [clampOffset, fadeEdges, applyEdgeMask]
  );

  const stopMomentum = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startMomentum = useCallback(() => {
    stopMomentum();
    const step = () => {
      velocityYRef.current *= 0.93;
      if (Math.abs(velocityYRef.current) < 0.35) {
        velocityYRef.current = 0;
        return;
      }
      const prev = offsetYRef.current;
      renderOffset(prev + velocityYRef.current);
      if (offsetYRef.current === prev) {
        velocityYRef.current = 0;
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [renderOffset, stopMomentum]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const isInteractiveInput = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest('input, textarea, label'));
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.stopPropagation();
      stopMomentum();
      isDraggingRef.current = true;
      startYRef.current = e.touches[0].clientY;
      lastYRef.current = e.touches[0].clientY;
      lastTimeRef.current = performance.now();
      totalMovedRef.current = 0;
      velocityYRef.current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - lastYRef.current;
      totalMovedRef.current += Math.abs(deltaY);
      const dt = Math.max(1, now - lastTimeRef.current);
      velocityYRef.current = (deltaY / dt) * 16;
      lastYRef.current = currentY;
      lastTimeRef.current = now;
      renderOffset(offsetYRef.current + deltaY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.stopPropagation();
      isDraggingRef.current = false;
      startMomentum();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stopMomentum();
      renderOffset(offsetYRef.current - e.deltaY);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (isInteractiveInput(e.target) || (e.target as HTMLElement).closest('button')) return;
      e.stopPropagation();
      stopMomentum();
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      lastYRef.current = e.clientY;
      lastTimeRef.current = performance.now();
      totalMovedRef.current = 0;
      velocityYRef.current = 0;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const now = performance.now();
      const deltaY = e.clientY - lastYRef.current;
      totalMovedRef.current += Math.abs(deltaY);
      const dt = Math.max(1, now - lastTimeRef.current);
      velocityYRef.current = (deltaY / dt) * 16;
      lastYRef.current = e.clientY;
      lastTimeRef.current = now;
      renderOffset(offsetYRef.current + deltaY);
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      startMomentum();
    };

    vp.addEventListener('touchstart', onTouchStart, { passive: true });
    vp.addEventListener('touchmove', onTouchMove, { passive: false });
    vp.addEventListener('touchend', onTouchEnd, { passive: true });
    vp.addEventListener('touchcancel', onTouchEnd, { passive: true });
    vp.addEventListener('wheel', onWheel, { passive: false });
    vp.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      stopMomentum();
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchmove', onTouchMove);
      vp.removeEventListener('touchend', onTouchEnd);
      vp.removeEventListener('touchcancel', onTouchEnd);
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [renderOffset, startMomentum, stopMomentum]);

  useEffect(() => {
    renderOffset(offsetYRef.current);
  });

  return (
    <div
      ref={viewportRef}
      onClickCapture={(e) => {
        // Jika pengguna habis menggeser/scroll teks, jangan picu klik yang menutup deskripsi
        if (totalMovedRef.current > 6) {
          e.stopPropagation();
          e.preventDefault();
          totalMovedRef.current = 0;
        }
      }}
      className={`relative overflow-hidden touch-none select-none ${className}`}
    >
      <div ref={contentRef} className={`will-change-transform ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

const CustomHorizontalScroll: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const offsetXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);

  const renderX = useCallback((nextX: number) => {
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (!vp || !tr) return;
    const minX = Math.min(0, vp.clientWidth - tr.scrollWidth);
    const clamped = Math.max(minX, Math.min(0, nextX));
    offsetXRef.current = clamped;
    tr.style.transform = `translate3d(${clamped}px, 0, 0)`;
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      isDraggingRef.current = true;
      startXRef.current = e.touches[0].clientX - offsetXRef.current;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      renderX(e.touches[0].clientX - startXRef.current);
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      renderX(offsetXRef.current - delta);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      startXRef.current = e.clientX - offsetXRef.current;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      renderX(e.clientX - startXRef.current);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    vp.addEventListener('touchstart', onTouchStart, { passive: true });
    vp.addEventListener('touchmove', onTouchMove, { passive: false });
    vp.addEventListener('touchend', onTouchEnd, { passive: true });
    vp.addEventListener('wheel', onWheel, { passive: false });
    vp.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchmove', onTouchMove);
      vp.removeEventListener('touchend', onTouchEnd);
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [renderX]);

  return (
    <div ref={viewportRef} className={`overflow-hidden touch-none ${className}`}>
      <div ref={trackRef} className="inline-flex items-center gap-1.5 will-change-transform">
        {children}
      </div>
    </div>
  );
};

/* ============================================================================
 * 1. BERANDA VIEW — Instagram Reels Tight Vertical Snap (.container & .card-berita)
 *    - Setiap berita 1 layar penuh, rapat kanan-kiri, tidak pernah berhenti setengah-setengah
 *    - Anti-los & anti-kebablasan: tarikan terasa kencang (taut resistance)
 *    - Begitu jari/kursor dilepas, langsung narik kencang (instant high-tension snap) tepat 1 berita
 *    - Navigasi atas: Icon Kaca Pembesar, Icon Plus, dan Icon Profil
 * ========================================================================== */
export const BerandaView: React.FC = () => {
  const {
    articles,
    openArticleDetail,
    activeFeedIndex,
    setActiveFeedIndex,
    setActiveTab,
    activeTab,
    setPendingMedia,
    setIsMediaLoading,
    uploadMediaToImageKit,
    user
  } = useKarebata();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isFeedMuted, setIsFeedMuted] = useState(true);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  // Pelacak tarikan langsung ke DOM (60fps tanpa re-render berat) & anti-kebablasan (1 swipe = 1 berita)
  const isTransitioningRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef<number | null>(null);
  const dragCurrentOffsetYRef = useRef<number>(0);
  const dragStartTimeRef = useRef<number>(0);
  const wheelAccumulatorRef = useRef<number>(0);
  const wheelResetTimerRef = useRef<number | null>(null);

  // Durasi snap cepat & ringan begitu jari dilepas (210ms)
  const SNAP_DURATION_MS = 210;
  const SWIPE_DISTANCE_THRESHOLD_PX = 18;
  const SWIPE_VELOCITY_THRESHOLD = 0.12; // px/ms

  const applyTrackTransform = (index: number, offsetPx: number, animate: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transitionDuration = animate ? `${SNAP_DURATION_MS}ms` : '0ms';
    track.style.transitionTimingFunction = 'cubic-bezier(0.16, 1, 0.3, 1)';
    track.style.transform = `translate3d(0, calc(-${index * 100}% + ${offsetPx}px), 0)`;
  };

  // Pastikan activeFeedIndex selalu valid jika jumlah berita berubah
  useEffect(() => {
    if (activeFeedIndex >= articles.length && articles.length > 0) {
      setActiveFeedIndex(articles.length - 1);
    }
  }, [articles.length, activeFeedIndex, setActiveFeedIndex]);

  useEffect(() => {
    setExpandedArticleId(null);
    applyTrackTransform(activeFeedIndex, 0, true);
  }, [activeFeedIndex]);

  // Fungsi inti: langsung narik kencang tepat 1 berita (tidak bisa lompat > 1 berita)
  const snapTightToCard = (targetIndex: number) => {
    if (articles.length === 0) return;

    const singleStepIndex =
      targetIndex > activeFeedIndex
        ? Math.min(articles.length - 1, activeFeedIndex + 1)
        : targetIndex < activeFeedIndex
        ? Math.max(0, activeFeedIndex - 1)
        : activeFeedIndex;

    isDraggingRef.current = false;
    dragCurrentOffsetYRef.current = 0;

    if (singleStepIndex === activeFeedIndex) {
      applyTrackTransform(activeFeedIndex, 0, true);
      return;
    }

    isTransitioningRef.current = true;
    applyTrackTransform(singleStepIndex, 0, true);
    setActiveFeedIndex(singleStepIndex);

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = window.setTimeout(() => {
      isTransitioningRef.current = false;
      wheelAccumulatorRef.current = 0;
    }, SNAP_DURATION_MS);
  };

  // Handler Keyboard (ArrowDown / ArrowUp langsung narik kencang 1 berita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        snapTightToCard(activeFeedIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        snapTightToCard(activeFeedIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFeedIndex, articles.length]);

  // Handler Wheel / Trackpad: non-passive e.preventDefault() agar browser tidak ikut scroll
  const handleWheelNative = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isTransitioningRef.current || isDraggingRef.current) {
        return;
      }

      wheelAccumulatorRef.current += e.deltaY;

      if (wheelResetTimerRef.current) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
      wheelResetTimerRef.current = window.setTimeout(() => {
        wheelAccumulatorRef.current = 0;
      }, 100);

      const WHEEL_STEP_THRESHOLD = 16;
      if (wheelAccumulatorRef.current >= WHEEL_STEP_THRESHOLD) {
        wheelAccumulatorRef.current = 0;
        snapTightToCard(activeFeedIndex + 1);
      } else if (wheelAccumulatorRef.current <= -WHEEL_STEP_THRESHOLD) {
        wheelAccumulatorRef.current = 0;
        snapTightToCard(activeFeedIndex - 1);
      }
    },
    [activeFeedIndex, articles.length]
  );

  // Mulai tarikan jari / mouse (enteng & langsung merespons tanpa jeda)
  const beginPull = useCallback(
    (clientY: number) => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
        isTransitioningRef.current = false;
      }
      dragStartYRef.current = clientY;
      dragCurrentOffsetYRef.current = 0;
      dragStartTimeRef.current = performance.now();
      isDraggingRef.current = true;
      applyTrackTransform(activeFeedIndex, 0, false);
    },
    [activeFeedIndex]
  );

  // Saat ditarik: enteng mengikuti jari 1:1, dan begitu ditarik setengah layar video langsung berhenti berjalan seperti di Reels
  const syncActiveVideoDuringDrag = useCallback(
    (absDeltaY: number, forceResumeIfNotUserPaused = false) => {
      const track = trackRef.current;
      const container = containerRef.current;
      if (!track || !container) return;

      const activeSection = track.children[activeFeedIndex] as HTMLElement | undefined;
      if (!activeSection) return;
      const videoEl = activeSection.querySelector('video') as HTMLVideoElement | null;
      if (!videoEl) return;

      const halfScreenThreshold = (container.clientHeight || window.innerHeight) * 0.35;

      if (!forceResumeIfNotUserPaused && absDeltaY >= halfScreenThreshold) {
        if (!videoEl.paused) {
          videoEl.pause();
        }
      } else if (videoEl.dataset.userPaused !== 'true' && videoEl.paused) {
        videoEl.play().catch(() => {});
      }
    },
    [activeFeedIndex]
  );

  const updatePull = useCallback(
    (clientY: number) => {
      if (!isDraggingRef.current || dragStartYRef.current === null) return;
      const rawDeltaY = clientY - dragStartYRef.current;

      const isAtTopEdge = activeFeedIndex === 0 && rawDeltaY > 0;
      const isAtBottomEdge = activeFeedIndex === articles.length - 1 && rawDeltaY < 0;

      const offsetPx = isAtTopEdge || isAtBottomEdge ? 0 : rawDeltaY;
      dragCurrentOffsetYRef.current = offsetPx;
      applyTrackTransform(activeFeedIndex, offsetPx, false);

      // Begitu video ter-scroll setengah, langsung hentikan putaran videonya
      syncActiveVideoDuringDrag(Math.abs(offsetPx), false);
    },
    [activeFeedIndex, articles.length, syncActiveVideoDuringDrag]
  );

  // Begitu dilepas: langsung narik kencang tepat 1 berita berikutnya/sebelumnya
  const releasePull = useCallback(
    (clientY?: number) => {
      if (!isDraggingRef.current || dragStartYRef.current === null) return;

      const totalDeltaY =
        clientY !== undefined ? clientY - dragStartYRef.current : dragCurrentOffsetYRef.current;
      const elapsedMs = Math.max(1, performance.now() - dragStartTimeRef.current);
      const velocity = Math.abs(totalDeltaY) / elapsedMs;

      dragStartYRef.current = null;
      isDraggingRef.current = false;

      const shouldSnapNextOrPrev =
        Math.abs(totalDeltaY) >= SWIPE_DISTANCE_THRESHOLD_PX ||
        (velocity >= SWIPE_VELOCITY_THRESHOLD && Math.abs(totalDeltaY) >= 8);

      if (shouldSnapNextOrPrev) {
        if (totalDeltaY < 0 && activeFeedIndex < articles.length - 1) {
          snapTightToCard(activeFeedIndex + 1);
          return;
        }
        if (totalDeltaY > 0 && activeFeedIndex > 0) {
          snapTightToCard(activeFeedIndex - 1);
          return;
        }
      }

      // Jika batal pindah halaman dan kembali ke kartu aktif, lanjutkan putar video
      dragCurrentOffsetYRef.current = 0;
      applyTrackTransform(activeFeedIndex, 0, true);
      syncActiveVideoDuringDrag(0, true);
    },
    [activeFeedIndex, articles.length, syncActiveVideoDuringDrag]
  );

  // Pasang native event listener { passive: false } agar 100% mematikan scroll bawaan browser
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('[data-expanded-scroll="true"]') ||
        target.closest('[data-video-control="true"]')
      ) {
        return;
      }
      if (e.touches.length === 1) {
        beginPull(e.touches[0].clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('[data-expanded-scroll="true"]') ||
        target.closest('[data-video-control="true"]')
      ) {
        return;
      }
      e.preventDefault();
      if (e.touches.length === 1) {
        updatePull(e.touches[0].clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      releasePull(touch ? touch.clientY : undefined);
    };

    const onTouchCancel = () => {
      releasePull();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });
    el.addEventListener('wheel', handleWheelNative, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
      el.removeEventListener('wheel', handleWheelNative);
    };
  }, [beginPull, updatePull, releasePull, handleWheelNative]);

  const handleFeedGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Langsung pindah ke halaman posting agar Feed tidak pernah muncul/berkedip saat membaca file
    setActiveTab('buat');
    setIsMediaLoading(true);

    const isVid = file.type.startsWith('video/');
    let initialThumb = '';
    if (isVid) {
      try {
        initialThumb = await captureVideoThumbnail(file, 0.2);
      } catch (err) {
        console.warn('Gagal ekstrak thumbnail awal:', err);
      }
    }

    // 1. Tampilkan pratinjau lokal seketika (tanpa delay base64)
    const localUrl = URL.createObjectURL(file);
    const initialItem: NewsPhoto = {
      url: localUrl,
      caption: file.name.replace(/\.[^/.]+$/, ''),
      photographer: user.displayName,
      mediaType: isVid ? 'video' : 'image',
      thumbnailUrl: initialThumb || undefined
    };
    setPendingMedia(initialItem);
    setIsMediaLoading(false);

    // 2. Unggah otomatis di latar belakang ke ImageKit CDN pribadi
    uploadMediaToImageKit(file, {
      folder: isVid ? '/karebata/videos' : '/karebata/photos',
      tags: ['karebata', 'warga_feed', isVid ? 'video' : 'foto']
    })
      .then((res) => {
        setPendingMedia({
          ...initialItem,
          url: res.url,
          fileId: res.fileId,
          thumbnailUrl: initialThumb || res.thumbnailUrl
        });
      })
      .catch((err) => {
        console.warn('Upload ImageKit di latar belakang:', err);
      });

    e.target.value = '';
  };

  if (articles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <p className="text-stone-500 text-sm">Belum ada kabar berita yang diterbitkan.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden p-0 m-0">
      {/* INPUT GALERI GLOBAL - ANTI KEDIP */}
      <input
        type="file"
        id="gallery"
        ref={galleryInputRef}
        accept="image/*,video/*"
        hidden
        onChange={handleFeedGallerySelect}
      />

      {/* BAR HITAM SOLID DI ATAS (Fixed di bagian paling atas Beranda, tidak ikut ter-scroll) */}
      <header className="absolute top-0 left-0 right-0 h-[60px] bg-black border-b border-white/10 z-30 px-4 sm:px-5 flex items-center justify-between text-white select-none">
        <KarebataBrandLogo pinSize={26} showTagline={true} />

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Icon Kaca Pembesar (Cari) */}
          <button
            type="button"
            onClick={() => setActiveTab('cari')}
            aria-label="Cari Berita"
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Search className="w-[22px] h-[22px]" strokeWidth={2.2} />
          </button>

          {/* Icon Kamera (Buat Kabar - Langsung Pindah ke Posting & Buka Galeri Tanpa Muncul Feed) */}
          <button
            type="button"
            id="camBtn"
            onClick={() => {
              setActiveTab('buat');
              galleryInputRef.current?.click();
            }}
            aria-label="Buat Kabar Baru"
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Camera className="w-[22px] h-[22px]" strokeWidth={2.2} />
          </button>

          {/* Icon Profil (Akun) */}
          <button
            type="button"
            onClick={() => setActiveTab('akun')}
            aria-label="Profil & Akun"
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <User className="w-[22px] h-[22px]" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* .container: 100vw rapat kanan-kiri 0 padding, non-browser custom scroll */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('[data-video-control="true"]') ||
            target.closest('[data-expanded-scroll="true"]')
          ) {
            return;
          }
          beginPull(e.clientY);
        }}
        onMouseMove={(e) => {
          if (isDraggingRef.current) {
            updatePull(e.clientY);
          }
        }}
        onMouseUp={(e) => {
          if (isDraggingRef.current) {
            releasePull(e.clientY);
          }
        }}
        onMouseLeave={() => {
          if (isDraggingRef.current) {
            releasePull();
          }
        }}
        className="container no-scrollbar relative h-full w-screen bg-black overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing p-0 m-0"
      >
        {/* Track Ringan 60fps: mengikuti jari 1:1 saat ditarik, langsung narik cepat saat dilepas */}
        <div
          ref={trackRef}
          style={{
            transform: `translate3d(0, -${activeFeedIndex * 100}%, 0)`,
            transitionProperty: 'transform',
            transitionDuration: `${SNAP_DURATION_MS}ms`,
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="h-full w-full will-change-transform"
        >
          {articles.map((article, index) => {
            const coverPhoto = article.photos[0];
            const isCurrentPage = index === activeFeedIndex;
            const isCoverVideo = coverPhoto
              ? isVideoSource(coverPhoto.url, coverPhoto.mediaType)
              : false;

            const fullDescription =
              article.content &&
              article.content.length > 0 &&
              article.content.join('\n\n').length > article.summary.length
                ? article.content.join('\n\n')
                : article.summary;

            const hasMoreContent = Boolean(
              article.content &&
                article.content.length > 0 &&
                article.content.join('\n\n').trim().length > article.summary.trim().length
            );

            // Hanya deskripsi yang benar-benar panjang (>175 karakter, ada isi lanjutan, atau >=3 baris baru) yang memakai "... selengkapnya"
            const lineBreaks = (fullDescription.match(/\n/g) || []).length;
            const isLongDescription =
              hasMoreContent || fullDescription.length > 175 || lineBreaks >= 3;
            const isExpanded = expandedArticleId === article.id;

            return (
              <section
                key={article.id}
                aria-label={article.title}
                aria-hidden={!isCurrentPage}
                className="card-berita relative h-full w-screen bg-black overflow-hidden p-0 m-0"
              >
                {/* 1. FOTO/VIDEO: Di bawah bar hitam atas (top: 60px) sampai bawah (bottom: 0) */}
                <div
                  onClick={() => {
                    if (isExpanded) setExpandedArticleId(null);
                  }}
                  className="card-berita-media p-0 m-0"
                >
                  <SmartImage
                    src={coverPhoto?.url || ''}
                    alt={article.title}
                    mediaType={coverPhoto?.mediaType}
                    isActive={isCurrentPage && activeTab === 'beranda'}
                    isMuted={isFeedMuted}
                    preserveHorizontalRatio={false}
                    poster={coverPhoto?.thumbnailUrl}
                    className="w-full h-auto max-h-full object-cover object-center pointer-events-none"
                  />
                  {/* Lapisan transparan halus agar video/foto di balik deskripsi tetap terlihat jelas */}
                  <div
                    className={`absolute inset-x-0 bottom-0 pointer-events-none transition-all duration-200 ${
                      isExpanded
                        ? 'h-full bg-black/30'
                        : 'h-56 bg-gradient-to-t from-black/55 via-black/20 to-transparent'
                    }`}
                  />
                </div>

                {/* Tombol Suara jika media berupa Video (muncul tepat di bawah bar hitam atas) */}
                {isCoverVideo && (
                  <div className="absolute top-[72px] right-5 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFeedMuted((prev) => !prev);
                      }}
                      className="min-h-[34px] px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isFeedMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-white" />
                          <span>Suara Mati</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Suara Aktif</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 3 & 4. TEKS DI ATAS FOTO: Posisi di bawah seperti semula, tanpa bayangan teks (shadow) */}
                <div
                  style={{
                    bottom: isCoverVideo ? '42px' : '24px'
                  }}
                  className="absolute left-0 right-0 z-20 w-full px-4 sm:px-6 flex flex-col items-start pointer-events-none"
                >
                  {/* Blok Teks Deskripsi */}
                  <div
                    onClick={(e) => {
                      if (isLongDescription) {
                        e.stopPropagation();
                        setExpandedArticleId((prev) =>
                          prev === article.id ? null : article.id
                        );
                      }
                    }}
                    className={`w-full pointer-events-auto ${
                      isLongDescription ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Lokasi & Waktu warna biru muda + Penulis warna putih di atas foto */}
                    <div className="w-full flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-semibold tracking-wide">
                      <span className="text-sky-300">
                        {article.location} · {article.relativeTime}
                      </span>
                      <span className="text-white/80" aria-hidden="true">·</span>
                      <span className="text-white font-semibold">
                        Oleh {article.authorName}
                      </span>
                    </div>

                    {/* Deskripsi Berita: Jika pendek tampil penuh, jika panjang terpotong 3 baris dan ketika diklik muncul semua & memudar halus di pinggir atas-bawah saat di-scroll seperti Reels */}
                    {isExpanded ? (
                      <div
                        data-expanded-scroll="true"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 w-full"
                      >
                        <CustomScrollView
                          fadeEdges={true}
                          className="w-full max-h-[48vh] cursor-grab active:cursor-grabbing"
                          contentClassName="py-1"
                        >
                          <p
                            onClick={() => setExpandedArticleId(null)}
                            className="w-full font-editorial text-xl sm:text-2xl font-bold text-white leading-[1.35] tracking-tight whitespace-pre-line break-words"
                          >
                            {fullDescription}
                          </p>
                        </CustomScrollView>
                      </div>
                    ) : (
                      <div className="mt-2 w-full">
                        <p
                          className={`w-full font-editorial text-xl sm:text-2xl font-bold text-white leading-[1.3] tracking-tight whitespace-pre-line break-words ${
                            isLongDescription ? 'line-clamp-3' : ''
                          }`}
                        >
                          {article.summary}
                        </p>

                        {isLongDescription && (
                          <span className="inline-block mt-1 text-xs sm:text-sm font-semibold text-white/80">
                            ... selengkapnya
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. CARI VIEW — Pencarian & Eksplorasi Berita Lokal
 * ========================================================================== */
const REGIONS = [
  'Semua Daerah',
  'Makassar',
  'Toraja',
  'Maros',
  'Wajo'
];

const CATEGORIES = [
  'Semua Topik',
  'Budaya & Warisan',
  'Ekonomi Lokal',
  'Alam & Lingkungan',
  'Kuliner Nusantara',
  'Inovasi Daerah'
];

export const CariView: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedRegion,
    setSelectedRegion,
    selectedCategory,
    setSelectedCategory,
    filteredArticles,
    openArticleDetail
  } = useKarebata();

  return (
    <CustomScrollView className="h-full bg-white" contentClassName="pb-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-7">
        {/* Editorial Section Header */}
        <header className="pb-6 border-b border-stone-200">
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900">
            Eksplorasi &amp; Arsip Kabar Lokal
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Telusuri liputan mendalam berdasarkan kata kunci, kota/kabupaten, atau rubrik majalah.
          </p>

          {/* Search Input (Tanpa Tombol X Bawaan Browser) */}
          <div className="mt-5 relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul berita, lokasi (mis. Makassar, Toraja, Maros), atau nama penulis..."
              className="w-full min-h-[46px] pl-11 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-700 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Bersihkan pencarian"
                className="w-7 h-7 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Filter Controls — Daerah (Custom Horizontal Scroll) */}
          <CustomHorizontalScroll className="mt-4 pb-1">
            {REGIONS.map((region) => {
              const active = selectedRegion === region;
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegion(region)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-emerald-800 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </CustomHorizontalScroll>

          {/* Interactive Filter Controls — Rubrik (Custom Horizontal Scroll) */}
          <CustomHorizontalScroll className="mt-2 pb-1">
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </CustomHorizontalScroll>
        </header>

        {/* Hasil Pencarian */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-stone-500 pb-3">
            <span>Menampilkan liputan terpilih</span>
            <span className="tabular-nums font-medium text-stone-800">
              {filteredArticles.length} artikel ditemukan
            </span>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="py-14 text-center border border-dashed border-stone-200 rounded-2xl">
              <p className="font-editorial text-lg text-stone-800">
                Tidak ada berita yang cocok dengan filter pencarian Anda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('Semua Daerah');
                  setSelectedCategory('Semua Topik');
                }}
                className="mt-3 min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                Atur Ulang Filter
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {filteredArticles.map((article) => {
                const firstMedia = article.photos[0];
                const isVid = firstMedia
                  ? isVideoSource(firstMedia.url, firstMedia.mediaType)
                  : false;

                return (
                  <article
                    key={article.id}
                    onClick={() => openArticleDetail(article)}
                    className="py-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between group cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Unboxed Metadata */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-emerald-800 font-medium">
                        {isVid && (
                          <>
                            <span className="font-semibold text-emerald-900">Video</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span>{article.location}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-stone-500">{article.relativeTime}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-stone-500">{article.authorName}</span>
                      </div>

                      <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-stone-900 group-hover:text-emerald-800 transition-colors mt-1.5 leading-snug line-clamp-3">
                        {article.summary}
                      </h2>
                    </div>

                    <div className="w-full sm:w-32 h-40 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-stone-100">
                      <SmartImage
                        src={firstMedia?.url || ''}
                        alt={article.title}
                        mediaType={firstMedia?.mediaType}
                        isThumbnail={isVid}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CustomScrollView>
  );
};

/* ============================================================================
 * 3. BUAT KABAR VIEW — Form Publikasi Kabar Berita (Foto & Video)
 * ========================================================================== */
/* ============================================================================
 * MODAL PILIH SAMPUL VIDEO (SEPERTI INSTAGRAM REELS & TIKTOK)
 * ========================================================================== */
interface VideoCoverPickerModalProps {
  isOpen: boolean;
  videoUrl: string;
  currentThumb: string | null;
  onSelectThumb: (thumb: string) => void;
  onClose: () => void;
}

const VideoCoverPickerModal: React.FC<VideoCoverPickerModalProps> = ({
  isOpen,
  videoUrl,
  currentThumb,
  onSelectThumb,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [previewThumb, setPreviewThumb] = useState<string | null>(currentThumb);
  const [isLoadingFrame, setIsLoadingFrame] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPreviewThumb(currentThumb);
      setCurrentTime(0);
    }
  }, [isOpen, currentThumb]);

  const captureFrameFromVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || !canvasRef.current) return;
    try {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 854;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreviewThumb(dataUrl);
      }
    } catch (e) {
      console.warn('Gagal render canvas frame:', e);
    } finally {
      setIsLoadingFrame(false);
    }
  }, []);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    setIsLoadingFrame(true);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleCustomCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewThumb(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApply = () => {
    if (previewThumb) {
      onSelectThumb(previewThumb);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between text-white animate-fadeIn select-none">
      {/* Header Modal */}
      <div className="h-14 px-4 border-b border-stone-800 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="text-stone-300 hover:text-white flex items-center gap-1.5 text-sm font-semibold p-1.5 cursor-pointer"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>close</span>
          Batal
        </button>
        <span className="font-bold text-base tracking-wide">Pilih Sampul Video</span>
        <button
          type="button"
          onClick={handleApply}
          className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm px-4 py-1.5 rounded-full shadow transition-colors cursor-pointer"
        >
          Selesai
        </button>
      </div>

      {/* Pratinjau Frame Video Beresolusi Penuh */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-black">
        {/* Hidden Video & Canvas untuk capture frame */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="hidden"
          playsInline
          muted
          preload="auto"
          onLoadedMetadata={(e) => {
            const dur = e.currentTarget.duration || 1;
            setDuration(dur);
            if (!previewThumb) {
              e.currentTarget.currentTime = Math.min(0.2, dur / 2);
            }
          }}
          onSeeked={captureFrameFromVideo}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Card Frame Preview */}
        <div className="relative max-h-[62vh] h-full w-auto aspect-[9/16] bg-stone-950 rounded-2xl overflow-hidden shadow-2xl border border-stone-800 flex items-center justify-center">
          {previewThumb ? (
            <img
              src={previewThumb}
              alt="Pratinjau Sampul"
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <div className="text-center p-4 text-stone-400 flex flex-col items-center">
              <span className="material-icons text-4xl mb-2 animate-pulse">image</span>
              <span className="text-xs">Memuat cuplikan frame...</span>
            </div>
          )}

          {isLoadingFrame && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Badge Indikator Sampul */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 shadow flex items-center gap-1 pointer-events-none">
            <span className="material-icons" style={{ fontSize: '13px' }}>crop_original</span>
            Cuplikan Sampul
          </div>
        </div>
      </div>

      {/* Kontrol Scrubber Garis Waktu */}
      <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-stone-400 px-1">
          <span className="flex items-center gap-1 font-medium">
            <span className="material-icons text-sm text-sky-400">touch_app</span>
            Geser timeline untuk memilih thumbnail video
          </span>
          <span className="font-mono text-stone-300 font-semibold">
            {currentTime.toFixed(1)}s / {duration ? `${duration.toFixed(1)}s` : '--'}
          </span>
        </div>

        {/* Slider Timeline */}
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 10}
            step={0.05}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        {/* Tombol Preset & Unggah Sampul Kustom */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSeek(0.1)}
              className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-medium text-stone-300 transition-colors cursor-pointer"
            >
              Awal
            </button>
            {duration > 1 && (
              <button
                type="button"
                onClick={() => handleSeek(duration / 2)}
                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-medium text-stone-300 transition-colors cursor-pointer"
              >
                Tengah
              </button>
            )}
            {duration > 1 && (
              <button
                type="button"
                onClick={() => handleSeek(Math.max(0, duration - 0.5))}
                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-medium text-stone-300 transition-colors cursor-pointer"
              >
                Akhir
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <span className="material-icons" style={{ fontSize: '15px' }}>add_photo_alternate</span>
            Dari Galeri
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleCustomCoverFile}
          />
        </div>
      </div>
    </div>
  );
};

export const BuatKabarView: React.FC = () => {
  const {
    createArticle,
    setActiveTab,
    user,
    showToast,
    pendingMedia,
    setPendingMedia,
    isMediaLoading,
    setIsMediaLoading,
    uploadMediaToImageKit,
    imagekitEndpoint
  } = useKarebata();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<NewsPhoto | null>(pendingMedia || null);
  const [videoThumb, setVideoThumb] = useState<string | null>(
    pendingMedia?.thumbnailUrl || null
  );
  const [showCoverPicker, setShowCoverPicker] = useState<boolean>(false);
  const [desc, setDesc] = useState('');
  const [loc, setLoc] = useState(user.homeLocation ? user.homeLocation.slice(0, 25) : '');
  const [isUploadingImageKit, setIsUploadingImageKit] = useState<boolean>(false);
  const [localUploadPercent, setLocalUploadPercent] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Ekstrak thumbnail otomatis jika media adalah video dan belum memiliki thumbnail
  useEffect(() => {
    if (media && isVideoSource(media.url, media.mediaType)) {
      if (media.thumbnailUrl) {
        setVideoThumb(media.thumbnailUrl);
      } else if (!videoThumb) {
        captureVideoThumbnail(media.url, 0.2).then((thumb) => {
          if (thumb) {
            setVideoThumb(thumb);
            setMedia((prev) => (prev ? { ...prev, thumbnailUrl: thumb } : null));
          }
        });
      }
    } else {
      setVideoThumb(null);
    }
  }, [media]);

  // Sinkronisasi jika media dikirimkan langsung dari tombol kamera di Feed
  useEffect(() => {
    if (pendingMedia) {
      setMedia(pendingMedia);
      if (pendingMedia.thumbnailUrl) {
        setVideoThumb(pendingMedia.thumbnailUrl);
      }
    }
  }, [pendingMedia]);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsMediaLoading(true);
    const isVid = file.type.startsWith('video/');

    let capturedThumb = '';
    if (isVid) {
      try {
        capturedThumb = await captureVideoThumbnail(file, 0.2);
        if (capturedThumb) {
          setVideoThumb(capturedThumb);
        }
      } catch (err) {
        console.warn('Gagal ekstrak thumbnail video:', err);
      }
    } else {
      setVideoThumb(null);
    }

    // 1. Tampilkan pratinjau lokal instan (tanpa delay base64)
    const localBlobUrl = URL.createObjectURL(file);
    const initialItem: NewsPhoto = {
      url: localBlobUrl,
      caption: file.name.replace(/\.[^/.]+$/, ''),
      photographer: user.displayName,
      mediaType: isVid ? 'video' : 'image',
      thumbnailUrl: capturedThumb || undefined
    };
    setMedia(initialItem);
    setPendingMedia(initialItem);
    setIsMediaLoading(false);

    // 2. Unggah otomatis langsung ke ImageKit.io CDN pribadi
    setIsUploadingImageKit(true);
    setLocalUploadPercent(0);
    try {
      const uploadRes = await uploadMediaToImageKit(file, {
        folder: isVid ? '/karebata/videos' : '/karebata/photos',
        tags: ['karebata', 'warga_feed', isVid ? 'video' : 'foto'],
        onProgress: (pct) => setLocalUploadPercent(pct)
      });

      const updatedMedia: NewsPhoto = {
        ...initialItem,
        url: uploadRes.url,
        fileId: uploadRes.fileId,
        thumbnailUrl: capturedThumb || uploadRes.thumbnailUrl
      };
      setMedia(updatedMedia);
      setPendingMedia(updatedMedia);
      showToast('Media berhasil disimpan di ImageKit.io CDN!');
    } catch (uploadErr) {
      console.warn('Upload ImageKit di latar belakang:', uploadErr);
    } finally {
      setIsUploadingImageKit(false);
    }

    e.target.value = '';
  };

  const isDescValid = desc.trim().length >= 99;
  // Posting aktif jika deskripsi minimal 99 huruf dan ada media
  const isReadyToShare = isDescValid && media !== null;

  const handleShare = async () => {
    if (!isReadyToShare || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const cleanText = desc.trim();
      const cleanLocation = loc.trim() || 'Sulawesi';
      const paragraphs = cleanText.split(/\n+/).filter(Boolean);

      let finalMediaThumb = videoThumb || media.thumbnailUrl;

      // Jika thumbnail kustom berupa dataURL dari canvas scrubber
      if (finalMediaThumb && finalMediaThumb.startsWith('data:')) {
        try {
          const thumbRes = await uploadMediaToImageKit(finalMediaThumb, {
            folder: '/karebata/thumbs',
            tags: ['karebata', 'thumbnail']
          });
          finalMediaThumb = thumbRes.url;
        } catch (e) {
          console.warn('Gagal upload thumbnail kustom ke ImageKit:', e);
        }
      }

      const mediaWithThumb: NewsPhoto = {
        ...media,
        thumbnailUrl: finalMediaThumb || undefined
      };

      await createArticle({
        title: paragraphs[0] || cleanText,
        summary: cleanText,
        contentParagraphs: paragraphs.length > 0 ? paragraphs : [cleanText],
        location: cleanLocation.slice(0, 25),
        category: 'Budaya & Warisan',
        photos: [mediaWithThumb]
      });

      setPendingMedia(null);
      setIsMediaLoading(false);
      showToast('Kabar berita berhasil diterbitkan ke Firebase & ImageKit!');
      setActiveTab('beranda');
    } catch (err) {
      console.error('Error saat menerbitkan kabar:', err);
      showToast('Terjadi kendala saat menerbitkan kabar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vpPost">
      {/* Top Header Posting — Judul Aplikasi Berita */}
      <div className="topPost select-none">
        <button
          type="button"
          onClick={() => {
            setPendingMedia(null);
            setIsMediaLoading(false);
            setActiveTab('beranda');
          }}
          className="cursor-pointer text-stone-900 hover:text-stone-700 transition-colors flex items-center gap-2.5 bg-transparent border-none p-0 outline-none"
        >
          <span className="material-icons" style={{ fontSize: '24px' }}>
            arrow_back
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700 }}>Kabar Baru</span>
        </button>
      </div>

      {/* Konten Scrollable: Thumbnail & Deskripsi & Lokasi */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Row Posting: Thumbnail Foto/Video + Textarea Deskripsi */}
        <div className="rowPost">
          {/* Kolom Kiri: Thumbnail Media (Presisi Seperti Instagram Reels / TikTok) */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className="thumbPost group"
              onClick={() => {
                if (media && isVideoSource(media.url, media.mediaType)) {
                  setShowCoverPicker(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              title={
                media && isVideoSource(media.url, media.mediaType)
                  ? 'Klik untuk memilih atau mengubah sampul video'
                  : 'Klik untuk memilih foto atau video berita dari galeri'
              }
            >
              {isMediaLoading ? (
                <div className="relative w-full h-full bg-stone-900 flex flex-col items-center justify-center p-2 text-center text-white">
                  <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-1.5" />
                  <span className="text-[10px] text-stone-300 font-medium leading-tight">Memuat...</span>
                </div>
              ) : media ? (
                isVideoSource(media.url, media.mediaType) ? (
                  /* THUMBNAIL VIDEO STATIS (SEPERTI APLIKASI LAIN) */
                  <div className="relative w-full h-full bg-black flex items-center justify-center select-none overflow-hidden">
                    {videoThumb ? (
                      <img
                        id="thumbImg"
                        src={videoThumb}
                        alt="Thumbnail Sampul Video Berita"
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : (
                      /* Fallback tampilan thumbnail saat memproses frame */
                      <div className="relative w-full h-full bg-stone-900 flex flex-col items-center justify-center p-2 text-center text-white">
                        <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-1.5" />
                        <span className="text-[9px] text-stone-300 font-semibold leading-tight">
                          Membuat Sampul...
                        </span>
                      </div>
                    )}

                    {/* Badge Indikator Video di Sudut Kanan Atas */}
                    <div className="absolute top-1.5 right-1.5 bg-black/65 backdrop-blur-md text-white rounded-full p-1 shadow-md flex items-center justify-center pointer-events-none z-10">
                      <span className="material-icons" style={{ fontSize: '13px', lineHeight: 1 }}>videocam</span>
                    </div>

                    {/* Badge Sampul di Bawah Tengah (Khas Instagram Reels) */}
                    <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none z-10">
                      <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20 shadow-md flex items-center gap-1">
                        <span className="material-icons" style={{ fontSize: '11px', lineHeight: 1 }}>crop_original</span>
                        Sampul
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <img
                      id="thumbImg"
                      src={media.url}
                      alt="Pratinjau Kabar Berita"
                      className="w-full h-full object-contain bg-black"
                    />
                  </div>
                )
              ) : (
                <div
                  id="thumbIcon"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span
                    className="material-icons text-stone-900"
                    style={{
                      background: '#fff',
                      borderRadius: '6px',
                      padding: '6px',
                      fontSize: '22px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                    }}
                  >
                    image
                  </span>
                  <span style={{ fontSize: '10px', color: '#888', fontWeight: 600 }}>Foto/Video</span>
                </div>
              )}
            </div>

            {/* Tombol Aksi di Bawah Kotak Thumbnail */}
            {media && isVideoSource(media.url, media.mediaType) ? (
              <div className="flex flex-col items-center mt-1.5 gap-1 w-full">
                <button
                  type="button"
                  onClick={() => setShowCoverPicker(true)}
                  className="w-full text-[10px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-md border border-sky-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Pilih frame cuplikan terbaik untuk thumbnail"
                >
                  <span className="material-icons" style={{ fontSize: '12px' }}>tune</span>
                  Pilih Sampul
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[9px] text-stone-500 hover:text-stone-800 hover:underline cursor-pointer"
                >
                  Ganti Video
                </button>
              </div>
            ) : media ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-stone-500 hover:text-stone-800 mt-1 hover:underline cursor-pointer"
              >
                Ganti Foto
              </button>
            ) : null}
          </div>

          <div className="textPost">
            <textarea
              id="desc"
              placeholder="Tuliskan ringkasan kabar atau liputan berita Anda (minimal 99 huruf)..."
              maxLength={1000}
              value={desc}
              onChange={(e) => setDesc(e.target.value.slice(0, 1000))}
            />
            <div
              style={{
                fontSize: '11px',
                color: '#8e8e8e',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                userSelect: 'none',
                marginTop: '4px'
              }}
            >
              <span
                id="sDesc"
                className={isDescValid ? 'text-emerald-600 font-semibold' : ''}
              >
                {isDescValid ? 'Min 99 huruf ✓' : 'Min 99 huruf'}
              </span>
              <span id="cDesc">{desc.length}/1000</span>
            </div>
          </div>
        </div>

        {/* Box Lokasi Manual (Maksimal 25 Karakter - Lega, Tidak Terpotong) */}
        <div className="boxPost">
          <div className="flex items-center justify-between w-full">
            <label htmlFor="loc" className="flex items-center gap-1.5 text-xs font-bold text-stone-700 select-none">
              <span
                className="material-icons text-sky-600"
                style={{ fontSize: '18px', verticalAlign: 'middle' }}
              >
                location_on
              </span>
              Lokasi Berita (maks. 25 karakter)
            </label>
            <span
              id="cLoc"
              className={`text-xs font-semibold ${
                loc.length === 25 ? 'text-amber-600' : 'text-stone-400'
              }`}
            >
              {loc.length}/25
            </span>
          </div>

          <div className="w-full bg-stone-100/90 border border-stone-200 focus-within:border-sky-500 focus-within:bg-white rounded-xl px-3.5 py-2.5 flex items-center transition-all mt-1">
            <input
              id="loc"
              type="text"
              placeholder="contoh Sengkang, Sulawesi Selatan"
              maxLength={25}
              value={loc}
              onChange={(e) => setLoc(e.target.value.slice(0, 25))}
              className="w-full bg-transparent text-stone-900 text-sm font-medium outline-none border-none placeholder:text-stone-400"
            />
            {loc && (
              <button
                type="button"
                onClick={() => setLoc('')}
                className="text-stone-400 hover:text-stone-600 p-0.5 ml-1"
                title="Hapus lokasi"
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Penyimpanan Media ImageKit.io CDN */}
        <div className="mx-4 mt-3 mb-4 p-3 rounded-xl border border-sky-200/80 bg-sky-50/70 text-xs select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-icons text-sky-600" style={{ fontSize: '18px' }}>
                cloud_upload
              </span>
              <div>
                <span className="font-bold text-sky-950 block text-xs">
                  ImageKit.io Media CDN Pribadi
                </span>
                <span className="text-[10px] text-sky-700 font-mono">
                  ik.imagekit.io/rdyi1j1sg
                </span>
              </div>
            </div>
            {isUploadingImageKit ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                <span className="w-2.5 h-2.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                {localUploadPercent}%
              </span>
            ) : media?.url?.includes('ik.imagekit.io') ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                <span className="material-icons text-[13px]">check_circle</span>
                Tersimpan di CDN
              </span>
            ) : media ? (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Pratinjau Siap
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                Folder /karebata
              </span>
            )}
          </div>

          {isUploadingImageKit && (
            <div className="mt-2.5">
              <div className="w-full bg-sky-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-600 h-1.5 rounded-full transition-all duration-150"
                  style={{ width: `${localUploadPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-sky-700 block mt-1 font-medium">
                Mengunggah {media?.mediaType === 'video' ? 'video' : 'foto'} berita ke CDN ImageKit...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pindah Tombol Posting di Bawah */}
      <div className="bottomPost">
        <button
          id="btnShare"
          type="button"
          onClick={handleShare}
          disabled={!isReadyToShare || isSubmitting}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all select-none shadow-sm ${
            isReadyToShare && !isSubmitting
              ? 'bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white cursor-pointer shadow-sky-100'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Menerbitkan ke Firebase & ImageKit...</span>
            </>
          ) : (
            <>
              <span className="material-icons" style={{ fontSize: '20px' }}>send</span>
              <span>Posting Kabar Berita</span>
            </>
          )}
        </button>
        {!isReadyToShare && (
          <p className="text-[11px] text-stone-400 text-center mt-2 font-medium select-none">
            {!media
              ? 'Pilih foto atau video berita terlebih dahulu'
              : !isDescValid
              ? `Tulis deskripsi berita minimal ${Math.max(0, 99 - desc.trim().length)} huruf lagi`
              : ''}
          </p>
        )}
      </div>

      {/* Input Galeri Lokal / Global untuk Pemilihan Foto/Video */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        hidden
        onChange={handleGalleryUpload}
      />

      {/* Modal Pilih Sampul Video (Scrubber Frame & Galeri Kustom) */}
      {media && isVideoSource(media.url, media.mediaType) && (
        <VideoCoverPickerModal
          isOpen={showCoverPicker}
          videoUrl={media.url}
          currentThumb={videoThumb}
          onSelectThumb={(newThumb) => {
            setVideoThumb(newThumb);
            setMedia((prev) => (prev ? { ...prev, thumbnailUrl: newThumb } : null));
          }}
          onClose={() => setShowCoverPicker(false)}
        />
      )}
    </div>
  );
};

/* ============================================================================
 * 4. TERSIMPAN VIEW — Koleksi Berita yang Disimpan Pembaca
 * ========================================================================== */
export const TersimpanView: React.FC = () => {
  const {
    savedArticles,
    openArticleDetail,
    toggleSaveArticle,
    setActiveTab
  } = useKarebata();

  return (
    <CustomScrollView className="h-full bg-white" contentClassName="pb-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-7">
        <header className="pb-6 border-b border-stone-200 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900">
              Kabar Tersimpan
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Arsip bacaan pilihan Anda untuk dibaca kembali kapan saja.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 tabular-nums">
            {savedArticles.length} berita
          </span>
        </header>

        {savedArticles.length === 0 ? (
          <div className="my-12 p-10 text-center border border-dashed border-stone-200 rounded-2xl">
            <Bookmark className="w-8 h-8 text-stone-400 mx-auto mb-3" />
            <h2 className="font-editorial text-xl text-stone-900 font-semibold">
              Belum Ada Berita yang Disimpan
            </h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-1">
              Tekan tombol &ldquo;Baca Selengkapnya&rdquo; pada Beranda lalu pilih tombol &ldquo;Simpan&rdquo; untuk mengarsipkan liputan favorit Anda.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('beranda')}
              className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              Jelajahi Beranda Majalah
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-200 mt-2">
            {savedArticles.map((article) => (
              <article
                key={article.id}
                className="py-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
              >
                <div
                  onClick={() => openArticleDetail(article)}
                  className="flex-1 min-w-0 cursor-pointer group"
                >
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-emerald-800 font-medium">
                    <span>{article.location}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-stone-500">{article.formattedDate}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-stone-500">{article.authorName}</span>
                  </div>

                  <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-stone-900 group-hover:text-emerald-800 transition-colors mt-1.5 leading-snug line-clamp-3">
                    {article.summary}
                  </h2>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openArticleDetail(article)}
                    className="min-h-[40px] px-3.5 py-2 rounded-lg bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Baca Lengkap</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSaveArticle(article.id)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Hapus dari Tersimpan
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </CustomScrollView>
  );
};

/* ============================================================================
 * 5. AKUN VIEW — Profil Google Sign-In, Statistik & Akses Kode Flutter
 * ========================================================================== */
interface AkunViewProps {
  onOpenFlutterCode: () => void;
}

export const AkunView: React.FC<AkunViewProps> = ({ onOpenFlutterCode }) => {
  const {
    user,
    signInWithGoogle,
    signOutUser,
    updateUserProfile,
    articles,
    savedArticles,
    openArticleDetail,
    firebaseStatus,
    firebaseProjectId,
    imagekitStatus,
    imagekitEndpoint,
    imagekitPublicKey
  } = useKarebata();

  const [nameInput, setNameInput] = useState(user.displayName);
  const [locationInput, setLocationInput] = useState(user.homeLocation);
  const [isEditing, setIsEditing] = useState(false);

  const authoredArticles = articles.filter(
    (a) => a.authorName.toLowerCase() === user.displayName.toLowerCase()
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      displayName: nameInput.trim() || user.displayName,
      homeLocation: locationInput.trim() || user.homeLocation
    });
    setIsEditing(false);
  };

  return (
    <CustomScrollView className="h-full bg-white" contentClassName="pb-24">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-7 space-y-8">
        {/* Kartu Profil Google Sign-In */}
        <section className="p-6 rounded-2xl border border-stone-200 bg-stone-50/60">
          {user.isSignedIn ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-800 text-white font-editorial text-2xl font-semibold flex items-center justify-center shrink-0">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terhubung dengan Google Sign-In</span>
                  </div>
                  <h1 className="font-editorial text-2xl font-semibold text-stone-900 mt-0.5">
                    {user.displayName}
                  </h1>
                  <p className="text-xs text-stone-500">
                    {user.email} · {user.homeLocation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(user.displayName);
                    setLocationInput(user.homeLocation);
                    setIsEditing(!isEditing);
                  }}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isEditing ? 'Batal' : 'Ubah Profil'}
                </button>
                <button
                  type="button"
                  onClick={signOutUser}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:text-red-700 hover:border-red-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <h1 className="font-editorial text-2xl font-semibold text-stone-900">
                Masuk ke Akun Kareba&apos;Ta
              </h1>
              <p className="text-sm text-stone-600 max-w-md mx-auto mt-1">
                Gunakan akun Google Anda untuk menerbitkan kabar berita lokal, mengelola arsip tersimpan, dan menyinkronkan profil penulis.
              </p>
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="mt-5 min-h-[46px] px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold inline-flex items-center gap-2.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Masuk dengan Google (puasa2768@gmail.com)</span>
              </button>
            </div>
          )}

          {isEditing && user.isSignedIn && (
            <form noValidate onSubmit={handleSaveProfile} className="mt-5 pt-5 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Penulis / Tampilan
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 bg-white border border-stone-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Domisili Daerah
                </label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 bg-white border border-stone-200 rounded-lg text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Ringkasan Aktivitas (Tabular Numerals) */}
        <section className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-stone-200">
            <div className="text-xs text-stone-500">Edisi Majalah</div>
            <div className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900 mt-1 tabular-nums">
              {articles.length}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-stone-200">
            <div className="text-xs text-stone-500">Karya Anda</div>
            <div className="font-editorial text-2xl sm:text-3xl font-semibold text-emerald-800 mt-1 tabular-nums">
              {authoredArticles.length}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-stone-200">
            <div className="text-xs text-stone-500">Tersimpan</div>
            <div className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900 mt-1 tabular-nums">
              {savedArticles.length}
            </div>
          </div>
        </section>

        {/* Status Integrasi Firebase Cloud Pribadi */}
        <section className="p-6 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-editorial text-lg font-semibold text-stone-900">
                    Firebase Cloud Database Pribadi
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    {firebaseStatus === 'connected' ? 'Terhubung (Aktif)' : 'Menghubungkan...'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  Project ID: {firebaseProjectId}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-white rounded-xl border border-stone-200">
              <div className="text-stone-500 flex items-center gap-1.5 font-medium mb-1">
                <Database className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cloud Firestore</span>
              </div>
              <div className="font-semibold text-stone-800">Koleksi: articles, users</div>
              <div className="text-[11px] text-stone-400 mt-0.5">Real-time sync aktif</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-stone-200">
              <div className="text-stone-500 flex items-center gap-1.5 font-medium mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Autentikasi</span>
              </div>
              <div className="font-semibold text-stone-800">Firebase Auth + Google</div>
              <div className="text-[11px] text-stone-400 mt-0.5">kareba-ta-728d0.firebaseapp.com</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-stone-200">
              <div className="text-stone-500 flex items-center gap-1.5 font-medium mb-1">
                <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cloud Storage</span>
              </div>
              <div className="font-semibold text-stone-800">kareba-ta-728d0.firebasestorage.app</div>
              <div className="text-[11px] text-stone-400 mt-0.5">Media & Video Berita</div>
            </div>
          </div>
        </section>

        {/* Status Integrasi ImageKit.io Media CDN Pribadi */}
        <section className="p-6 rounded-2xl border border-sky-200 bg-sky-50/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-editorial text-lg font-semibold text-stone-900">
                    ImageKit.io Media CDN Pribadi
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    {imagekitStatus === 'uploading' ? 'Mengunggah...' : 'Terhubung (Aktif)'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  Endpoint: {imagekitEndpoint}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-xs">
              <div className="text-stone-500 flex items-center gap-1.5 font-medium mb-1">
                <Video className="w-3.5 h-3.5 text-sky-600" />
                <span>Video Berita Warga</span>
              </div>
              <div className="font-semibold text-stone-800">Folder: /karebata/videos</div>
              <div className="text-[11px] text-stone-400 mt-0.5">Streaming H.264 & Auto-Thumbnails</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-xs">
              <div className="text-stone-500 flex items-center gap-1.5 font-medium mb-1">
                <ImagePlus className="w-3.5 h-3.5 text-sky-600" />
                <span>Foto & Sampul Liputan</span>
              </div>
              <div className="font-semibold text-stone-800">Folder: /karebata/photos</div>
              <div className="text-[11px] text-stone-400 mt-0.5">Auto WebP, AVIF & Rasio Asli</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-xs">
              <div className="text-stone-500 flex items-center gap-1.5 font-medium mb-1">
                <FolderCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Kredensial & Autentikasi</span>
              </div>
              <div className="font-semibold text-stone-800 font-mono text-[11px] truncate">
                ID: rdyi1j1sg
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 font-mono truncate">
                Public: {imagekitPublicKey.slice(0, 16)}...
              </div>
            </div>
          </div>
        </section>

        {/* Akses Kode Sumber Flutter Android */}
        <section className="p-6 rounded-2xl border border-emerald-800/25 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-editorial text-xl font-semibold text-stone-900">
              Kode Sumber Flutter Android (Material 3 + Provider + Firebase)
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Lihat dan unduh struktur kode modular Flutter lengkap (<code className="font-mono">pubspec.yaml</code>, <code className="font-mono">PageView.builder</code>, <code className="font-mono">create_news_screen.dart</code> untuk unggah video galeri, dan <code className="font-mono">detail_screen.dart</code>).
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFlutterCode}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-2 shrink-0 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Code2 className="w-4 h-4" />
            <span>Buka Kode Flutter</span>
          </button>
        </section>

        {/* Daftar Kabar yang Diterbitkan Penulis */}
        <section>
          <h2 className="font-editorial text-xl font-semibold text-stone-900 pb-3 border-b border-stone-200">
            Kabar yang Diterbitkan oleh {user.displayName}
          </h2>
          {authoredArticles.length === 0 ? (
            <p className="text-sm text-stone-500 py-6">
              Anda belum menerbitkan kabar di sesi ini. Gunakan menu <strong>Buat Kabar</strong> di navigasi bawah untuk menulis berita baru.
            </p>
          ) : (
            <div className="divide-y divide-stone-200">
              {authoredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => openArticleDetail(article)}
                  className="py-4 flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div>
                    <div className="text-xs text-emerald-800 font-medium">
                      {article.location} · {article.formattedDate}
                    </div>
                    <h3 className="font-editorial text-lg sm:text-xl font-semibold text-stone-900 group-hover:text-emerald-800 transition-colors mt-1 line-clamp-2">
                      {article.summary}
                    </h3>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </CustomScrollView>
  );
};
