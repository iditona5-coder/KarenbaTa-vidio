/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Camera,
  User,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { KarebataProvider, useKarebata } from './context/KarebataContext';
import { ViewportMode } from './types/news';
import {
  BerandaView,
  CariView,
  BuatKabarView,
  TersimpanView,
  AkunView
} from './components/Views';
import { NewsDetailSheet } from './components/NewsDetailSheet';
import { FlutterCodeModal } from './components/FlutterCodeModal';
import { KarebataBrandLogo } from './components/KarebataBrandLogo';

const VIEWPORT_PRESETS: {
  id: ViewportMode;
  label: string;
  icon: React.FC<{ className?: string }>;
  containerClass: string;
}[] = [
  {
    id: 'responsive',
    label: 'Layar Penuh',
    icon: Monitor,
    containerClass: 'w-full h-full'
  },
  {
    id: 'android-phone',
    label: 'Android 390×844',
    icon: Smartphone,
    containerClass:
      'w-full max-w-[400px] h-[92%] max-h-[844px] rounded-[28px] border border-stone-300 shadow-2xl overflow-hidden'
  },
  {
    id: 'android-phablet',
    label: 'Android 430×932',
    icon: Smartphone,
    containerClass:
      'w-full max-w-[440px] h-[94%] max-h-[932px] rounded-[28px] border border-stone-300 shadow-2xl overflow-hidden'
  },
  {
    id: 'android-tablet',
    label: 'Tablet 820×1180',
    icon: Tablet,
    containerClass:
      'w-full max-w-[840px] h-[94%] max-h-[1080px] rounded-[24px] border border-stone-300 shadow-2xl overflow-hidden'
  }
];

const KarebataShell: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    viewportMode,
    toastMessage
  } = useKarebata();

  const [isFlutterCodeOpen, setIsFlutterCodeOpen] = useState(false);

  const activeViewportPreset =
    VIEWPORT_PRESETS.find((v) => v.id === viewportMode) || VIEWPORT_PRESETS[0];

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex flex-col bg-stone-950 text-stone-900">
      {/* Main Responsive Canvas */}
      <div className="flex-1 w-full min-h-0 overflow-hidden flex items-center justify-center">
        <div
          className={`bg-white flex flex-col overflow-hidden transition-all duration-200 ${activeViewportPreset.containerClass}`}
        >
          {/* Header Atas Hitam Solid untuk Halaman Cari, Tersimpan, dan Akun */}
          {activeTab !== 'beranda' && activeTab !== 'buat' && (
            <header className="h-[60px] w-full bg-black border-b border-white/10 text-white px-5 flex items-center justify-between shrink-0 z-50 select-none">
              <button
                type="button"
                onClick={() => setActiveTab('beranda')}
                className="inline-flex items-center gap-2 text-white hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-white/80 shrink-0" />
                <KarebataBrandLogo pinSize={24} showTagline={true} />
              </button>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('cari')}
                  aria-label="Cari Berita"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    activeTab === 'cari'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  <Search className="w-[22px] h-[22px]" strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('buat')}
                  aria-label="Buat Kabar"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer bg-white/15 hover:bg-white/25 text-white"
                >
                  <Camera className="w-[22px] h-[22px]" strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('akun')}
                  aria-label="Akun & Profil"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    activeTab === 'akun' || activeTab === 'tersimpan'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  <User className="w-[22px] h-[22px]" strokeWidth={2.2} />
                </button>
              </div>
            </header>
          )}

          {/* Active Screen Body (Full Layar Tanpa Bar Putih Bawah) */}
          <main className="flex-1 w-full min-h-0 overflow-hidden relative">
            <div className={`absolute inset-0 w-full h-full ${activeTab === 'beranda' ? 'block' : 'hidden'}`}>
              <BerandaView />
            </div>
            <div className={`absolute inset-0 w-full h-full ${activeTab === 'cari' ? 'block' : 'hidden'}`}>
              <CariView />
            </div>
            <div className={`absolute inset-0 w-full h-full ${activeTab === 'buat' ? 'block' : 'hidden'}`}>
              <BuatKabarView />
            </div>
            <div className={`absolute inset-0 w-full h-full ${activeTab === 'tersimpan' ? 'block' : 'hidden'}`}>
              <TersimpanView />
            </div>
            <div className={`absolute inset-0 w-full h-full ${activeTab === 'akun' ? 'block' : 'hidden'}`}>
              <AkunView onOpenFlutterCode={() => setIsFlutterCodeOpen(true)} />
            </div>

            {/* Toast Feedback Notification */}
            {toastMessage && (
              <div
                role="status"
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-stone-900/95 text-white text-xs font-medium shadow-lg whitespace-nowrap pointer-events-none"
              >
                {toastMessage}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal Detail Berita ("Baca Selengkapnya") */}
      <NewsDetailSheet />

      {/* Modal Kode Sumber Flutter (Dart + Material 3 + Provider + Firebase) */}
      <FlutterCodeModal
        isOpen={isFlutterCodeOpen}
        onClose={() => setIsFlutterCodeOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <KarebataProvider>
      <KarebataShell />
    </KarebataProvider>
  );
}
