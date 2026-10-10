import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Newspaper, Play, Pause } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  mediaType?: 'image' | 'video';
  isActive?: boolean;
  isMuted?: boolean;
  showControls?: boolean;
  isThumbnail?: boolean;
  preserveHorizontalRatio?: boolean;
  poster?: string;
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const isVideoSource = (src: string, mediaType?: 'image' | 'video'): boolean => {
  if (mediaType === 'video') return true;
  if (mediaType === 'image') return false;
  if (!src) return false;
  const lower = src.toLowerCase();
  return (
    lower.startsWith('data:video/') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.ogg')
  );
};

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = '',
  mediaType,
  isActive = true,
  isMuted = true,
  isThumbnail = false,
  preserveHorizontalRatio = false,
  poster
}) => {
  const [hasError, setHasError] = useState(false);
  const [isVerticalMedia, setIsVerticalMedia] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const isScrubbingRef = useRef(false);
  const wasPlayingBeforeScrubRef = useRef(false);
  const tapStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const isVideo = isVideoSource(src, mediaType);

  useEffect(() => {
    setHasError(false);
    setIsVerticalMedia(false);
    setIsUserPaused(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  useEffect(() => {
    if (!isVideo || !videoRef.current || isThumbnail) return;
    const videoEl = videoRef.current;

    if (isActive) {
      setIsUserPaused(false);
      videoEl.dataset.userPaused = 'false';
      videoEl.currentTime = 0;
      setCurrentTime(0);
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            videoEl.muted = true;
            videoEl
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          });
      }
    } else {
      videoEl.pause();
      videoEl.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      setIsUserPaused(false);
      videoEl.dataset.userPaused = 'false';
    }
  }, [isVideo, isActive, isThumbnail, src]);

  const togglePlayPause = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (videoEl.paused) {
      setIsUserPaused(false);
      videoEl.dataset.userPaused = 'false';
      videoEl
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      setIsUserPaused(true);
      videoEl.dataset.userPaused = 'true';
      videoEl.pause();
      setIsPlaying(false);
    }
  }, []);

  const seekToClientX = useCallback(
    (clientX: number) => {
      const bar = progressBarRef.current;
      const videoEl = videoRef.current;
      if (!bar || !videoEl) return;

      const rect = bar.getBoundingClientRect();
      if (rect.width <= 0) return;

      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const videoDur =
        Number.isFinite(videoEl.duration) && videoEl.duration > 0
          ? videoEl.duration
          : duration;

      if (videoDur > 0) {
        const nextTime = ratio * videoDur;
        videoEl.currentTime = nextTime;
        setCurrentTime(nextTime);
      }
    },
    [duration]
  );

  // Pasang event listener non-browser untuk geser batang durasi (touch & mouse)
  useEffect(() => {
    if (!isVideo || isThumbnail) return;
    const bar = progressBarRef.current;
    if (!bar) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.stopPropagation();
      isScrubbingRef.current = true;
      const videoEl = videoRef.current;
      if (videoEl) {
        wasPlayingBeforeScrubRef.current = !videoEl.paused;
      }
      seekToClientX(e.touches[0].clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isScrubbingRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      seekToClientX(e.touches[0].clientX);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isScrubbingRef.current) return;
      e.stopPropagation();
      isScrubbingRef.current = false;
      const videoEl = videoRef.current;
      if (videoEl && wasPlayingBeforeScrubRef.current) {
        videoEl.play().catch(() => {});
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isScrubbingRef.current = true;
      const videoEl = videoRef.current;
      if (videoEl) {
        wasPlayingBeforeScrubRef.current = !videoEl.paused;
      }
      seekToClientX(e.clientX);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isScrubbingRef.current) return;
      e.preventDefault();
      seekToClientX(e.clientX);
    };

    const onMouseUp = () => {
      if (!isScrubbingRef.current) return;
      isScrubbingRef.current = false;
      const videoEl = videoRef.current;
      if (videoEl && wasPlayingBeforeScrubRef.current) {
        videoEl.play().catch(() => {});
      }
    };

    bar.addEventListener('touchstart', onTouchStart, { passive: true });
    bar.addEventListener('touchmove', onTouchMove, { passive: false });
    bar.addEventListener('touchend', onTouchEnd, { passive: true });
    bar.addEventListener('touchcancel', onTouchEnd, { passive: true });
    bar.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      bar.removeEventListener('touchstart', onTouchStart);
      bar.removeEventListener('touchmove', onTouchMove);
      bar.removeEventListener('touchend', onTouchEnd);
      bar.removeEventListener('touchcancel', onTouchEnd);
      bar.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isVideo, isThumbnail, seekToClientX]);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 text-stone-300 p-6 text-center ${className}`}
      >
        <Newspaper className="w-10 h-10 text-emerald-500/70 mb-3" />
        <p className="font-editorial text-sm text-stone-200 max-w-xs line-clamp-2">{alt}</p>
      </div>
    );
  }

  if (isVideo) {
    if (isThumbnail) {
      return (
        <div className={`relative overflow-hidden bg-stone-200 select-none ${className}`}>
          <video
            src={src}
            muted
            playsInline
            draggable={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            preload="metadata"
            onContextMenu={(e) => e.preventDefault()}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
            <div className="w-7 h-7 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-sm">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </div>
        </div>
      );
    }

    const progressPercent =
      duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;

    return (
      <>
        <video
          ref={videoRef}
          src={src}
          muted={isMuted}
          loop
          playsInline
          draggable={false}
          disablePictureInPicture
          controls={false}
          poster={poster}
          onContextMenu={(e) => e.preventDefault()}
          autoPlay={isActive}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => {
            if (!isScrubbingRef.current) {
              setCurrentTime(e.currentTarget.currentTime);
            }
          }}
          onDurationChange={(e) => {
            if (Number.isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
              setDuration(e.currentTarget.duration);
            }
          }}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.videoWidth > 0 && v.videoHeight > 0) {
              setIsVerticalMedia(v.videoHeight > v.videoWidth);
            }
            if (Number.isFinite(v.duration) && v.duration > 0) {
              setDuration(v.duration);
            }
          }}
          onError={() => setHasError(true)}
          className={`${
            preserveHorizontalRatio
              ? 'w-full h-auto max-h-full object-contain'
              : isVerticalMedia
              ? 'media-vertical'
              : 'media-horizontal'
          } ${className}`}
        />

        {/* AREA SENTUH VIDEO & ICON PLAY DI TENGAH (Hanya muncul saat dijeda/pause, otomatis hilang saat video berputar) */}
        <div
          onPointerDown={(e) => {
            tapStartPosRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            if (!tapStartPosRef.current) return;
            const dx = Math.abs(e.clientX - tapStartPosRef.current.x);
            const dy = Math.abs(e.clientY - tapStartPosRef.current.y);
            tapStartPosRef.current = null;
            if (dx < 8 && dy < 8) {
              togglePlayPause();
            }
          }}
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto"
        >
          {isUserPaused && !isPlaying && (
            <div
              aria-label="Putar video"
              className="w-16 h-16 rounded-full bg-black/55 backdrop-blur-xs border border-white/30 text-white flex items-center justify-center shadow-2xl transition-opacity duration-150 pointer-events-none"
            >
              <Play className="w-8 h-8 fill-white text-white ml-1" />
            </div>
          )}
        </div>

        {/* BATANG DURASI VIDEO YANG BISA DIGESER-GESER (Non-Browser Custom Scrubber) */}
        <div
          data-video-control="true"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-1.5 left-0 right-0 z-20 px-4 sm:px-6 pointer-events-auto select-none touch-none"
        >
          <div className="flex items-center gap-3">
            {/* Area Sentuh & Geser Batang Durasi */}
            <div
              ref={progressBarRef}
              data-video-control="true"
              className="flex-1 h-7 flex items-center cursor-pointer touch-none"
            >
              <div className="w-full h-1.5 bg-white/30 rounded-full relative">
                {/* Batang Terisi */}
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-emerald-400 rounded-full"
                />
                {/* Titik Geser (Thumb) */}
                <div
                  style={{ left: `${progressPercent}%` }}
                  className="w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-md absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                />
              </div>
            </div>

            {/* Indikator Waktu Durasi */}
            <span className="text-[11px] font-mono font-semibold text-white/90 tabular-nums shrink-0 drop-shadow">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </>
    );
  }

  // Mode Feed Beranda untuk Foto:
  // Mengikuti lebar penuh (w-full) dan tinggi proporsional asli (h-auto max-h-full object-contain),
  // sehingga TIDAK PERNAH gepeng, tidak terpotong atas-bawah, dan bar hanya di atas-bawah.
  if (preserveHorizontalRatio) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center overflow-hidden bg-stone-950 select-none">
        <img
          src={src}
          alt={alt}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-auto max-h-full object-contain pointer-events-none"
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      referrerPolicy="no-referrer"
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          setIsVerticalMedia(img.naturalHeight > img.naturalWidth);
        }
      }}
      onError={() => setHasError(true)}
      className={`${isVerticalMedia ? 'media-vertical' : 'media-horizontal'} ${className}`}
    />
  );
};
