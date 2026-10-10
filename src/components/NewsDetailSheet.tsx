import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  Check,
  Film
} from 'lucide-react';
import { useKarebata } from '../context/KarebataContext';
import { SmartImage, isVideoSource } from './SmartImage';
import { CustomScrollView } from './Views';

export const NewsDetailSheet: React.FC = () => {
  const {
    selectedArticle,
    closeArticleDetail,
    isArticleSaved,
    toggleSaveArticle,
    showToast
  } = useKarebata();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isDetailVideoMuted, setIsDetailVideoMuted] = useState(false);

  useEffect(() => {
    setActivePhotoIndex(0);
    setCopiedShare(false);
    setIsDetailVideoMuted(false);
  }, [selectedArticle?.id]);

  if (!selectedArticle) return null;

  const saved = isArticleSaved(selectedArticle.id);
  const photos = selectedArticle.photos;
  const currentPhoto = photos[activePhotoIndex] || photos[0];
  const currentIsVideo = currentPhoto
    ? isVideoSource(currentPhoto.url, currentPhoto.mediaType)
    : false;

  const videoCount = photos.filter((p) => isVideoSource(p.url, p.mediaType)).length;
  const imageCount = photos.length - videoCount;

  const handleShare = async () => {
    const shareText = `${selectedArticle.title}\n(${selectedArticle.location} · Oleh ${selectedArticle.authorName})\n\n${selectedArticle.summary}`;
    const shareUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(`${shareText}\n\nBaca di Kareba'Ta: ${shareUrl}`);
      setCopiedShare(true);
      showToast('Ringkasan & tautan berita disalin ke papan klip');
      window.setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      setCopiedShare(true);
      showToast('Tautan berita siap dibagikan');
      window.setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex justify-center items-end sm:items-center select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-article-title"
    >
      <div className="bg-white w-full max-w-3xl h-[94vh] sm:h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in duration-150">
        {/* Sticky Editorial Top App Bar */}
        <header className="h-14 px-4 sm:px-6 border-b border-stone-200 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={closeArticleDetail}
            className="min-h-[44px] px-2 -ml-2 inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali ke Majalah</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Tombol Simpan */}
            <button
              type="button"
              onClick={() => toggleSaveArticle(selectedArticle.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                saved
                  ? 'bg-emerald-800 text-white'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
              <span>{saved ? 'Tersimpan' : 'Simpan'}</span>
            </button>

            {/* Tombol Bagikan */}
            <button
              type="button"
              onClick={handleShare}
              className="min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedShare ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Bagikan</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Custom Non-Browser Scrollable Magazine Reader */}
        <CustomScrollView className="flex-1 min-h-0" contentClassName="pb-10">
          {/* Galeri Semua Foto & Video Jernih Tanpa Kontrol Bawaan Browser */}
          <div className="bg-white relative select-none">
            <div
              onClick={() => {
                if (currentIsVideo) setIsDetailVideoMuted((prev) => !prev);
              }}
              className="aspect-16/10 sm:aspect-16/9 w-full relative overflow-hidden bg-stone-100"
            >
              <SmartImage
                src={currentPhoto?.url || ''}
                alt={currentPhoto?.caption || selectedArticle.title}
                mediaType={currentPhoto?.mediaType}
                isActive={true}
                isMuted={isDetailVideoMuted}
                showControls={false}
                className="w-full h-full object-cover transition-opacity duration-200"
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
                    }
                    aria-label="Media sebelumnya"
                    className="absolute left-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-full bg-white/85 hover:bg-white text-stone-900 shadow-md flex items-center justify-center transition-colors cursor-pointer z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((prev) => (prev + 1) % photos.length)
                    }
                    aria-label="Media berikutnya"
                    className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-full bg-white/85 hover:bg-white text-stone-900 shadow-md flex items-center justify-center transition-colors cursor-pointer z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Caption & Thumbnail Strip Bersih Terang (Tanpa Blok Hitam di Bawah Media) */}
            <div className="px-5 sm:px-8 py-3.5 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs font-editorial italic text-stone-600 leading-relaxed">
                {currentIsVideo && (
                  <span className="not-italic font-sans font-semibold text-emerald-800 mr-2">
                    [Video Liputan{currentPhoto?.durationLabel ? ` · ${currentPhoto.durationLabel}` : ''}]
                  </span>
                )}
                {currentPhoto?.caption}
                {currentPhoto?.photographer ? ` — Dokumentasi: ${currentPhoto.photographer}` : ''}
              </p>

              {photos.length > 1 && (
                <div className="flex items-center gap-2 shrink-0">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`w-12 h-9 rounded overflow-hidden border-2 transition-all cursor-pointer ${
                        idx === activePhotoIndex
                          ? 'border-emerald-700 opacity-100 scale-105'
                          : 'border-transparent opacity-60 hover:opacity-95'
                      }`}
                    >
                      <SmartImage
                        src={photo.url}
                        alt={`Media ${idx + 1}`}
                        mediaType={photo.mediaType}
                        isThumbnail={true}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editorial Content Column */}
          <article className="max-w-2xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
            {/* Unboxed Metadata: Kategori · Lokasi · WaktuBaca */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-800 tracking-wide">
              <span>{selectedArticle.category}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedArticle.location}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{selectedArticle.readTimeMinutes} menit baca</span>
            </div>

            {/* Deskripsi Berita dengan Ukuran Sebesar Judul */}
            <h1
              id="detail-article-title"
              className="font-editorial text-2xl sm:text-4xl font-semibold text-stone-900 leading-tight mt-3"
            >
              {selectedArticle.summary}
            </h1>

            {/* Penulis & Tanggal Lengkap */}
            <div className="mt-6 pt-5 pb-5 border-y border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-stone-500">
              <div>
                <span className="text-stone-900 font-semibold">{selectedArticle.authorName}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{selectedArticle.authorRole}</span>
              </div>
              <time className="tabular-nums text-stone-500">{selectedArticle.formattedDate}</time>
            </div>

            {/* Isi Berita Lengkap */}
            <div className="mt-7 space-y-5 text-[16px] leading-[1.8] text-stone-800">
              {selectedArticle.content.map((paragraph, index) => (
                <React.Fragment key={index}>
                  <p
                    className={
                      index === 0
                        ? 'first-letter:float-left first-letter:font-editorial first-letter:text-5xl first-letter:font-semibold first-letter:pr-3 first-letter:leading-none first-letter:text-emerald-900'
                        : ''
                    }
                  >
                    {paragraph}
                  </p>

                  {index === 1 && selectedArticle.pullQuote && (
                    <blockquote className="my-8 pl-5 border-l-2 border-emerald-800 py-1">
                      <p className="font-editorial italic text-xl sm:text-2xl text-stone-900 leading-snug">
                        “{selectedArticle.pullQuote}”
                      </p>
                    </blockquote>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Semua Dokumentasi Foto & Video Tambahan (Jika > 1 Media) */}
            {photos.length > 1 && (
              <section className="mt-10 pt-8 border-t border-stone-200">
                <h2 className="font-editorial text-xl font-semibold text-stone-900 mb-4">
                  Dokumentasi Lengkap (
                  {videoCount > 0 ? `${videoCount} Video` : ''}
                  {videoCount > 0 && imageCount > 0 ? ', ' : ''}
                  {imageCount > 0 ? `${imageCount} Foto` : ''})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {photos.map((photo, index) => {
                    const isVid = isVideoSource(photo.url, photo.mediaType);
                    return (
                      <figure
                        key={index}
                        onClick={() => setActivePhotoIndex(index)}
                        className="group cursor-pointer border border-stone-200 rounded-xl overflow-hidden bg-stone-50"
                      >
                        <div className="aspect-4/3 overflow-hidden relative">
                          <SmartImage
                            src={photo.url}
                            alt={photo.caption}
                            mediaType={photo.mediaType}
                            isThumbnail={isVid}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {isVid && (
                            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/75 text-white text-[11px] font-medium inline-flex items-center gap-1">
                              <Film className="w-3 h-3 text-emerald-400" />
                              <span>Video{photo.durationLabel ? ` · ${photo.durationLabel}` : ''}</span>
                            </div>
                          )}
                        </div>
                        <figcaption className="p-3 text-xs text-stone-600 font-editorial italic leading-relaxed">
                          {photo.caption}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Bottom Action Bar inside Article */}
            <div className="mt-10 pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-stone-500">
                Diterbitkan di <span className="font-semibold text-stone-800">Kareba&apos;Ta</span> · {selectedArticle.location}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleSaveArticle(selectedArticle.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                    saved
                      ? 'bg-emerald-800 text-white'
                      : 'border border-stone-300 text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                  <span>{saved ? 'Tersimpan di Koleksi' : 'Simpan Berita'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-800 text-white hover:bg-emerald-900 inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Bagikan Kabar</span>
                </button>
              </div>
            </div>
          </article>
        </CustomScrollView>
      </div>
    </div>
  );
};
