import React, { useState } from 'react';
import { X, Copy, Check, Download, Code2 } from 'lucide-react';
import { FLUTTER_PROJECT_FILES } from '../data/flutterSourceCode';
import { CustomScrollView } from './Views';

interface FlutterCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlutterCodeModal: React.FC<FlutterCodeModalProps> = ({ isOpen, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeFile = FLUTTER_PROJECT_FILES[selectedIndex];

  const handleCopy = async (code: string, path: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedPath(path);
      window.setTimeout(() => setCopiedPath(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadAll = () => {
    const bundle = FLUTTER_PROJECT_FILES.map(
      (f) =>
        `====================================================================\nFILE: ${f.path}\nDESKRIPSI: ${f.description}\n====================================================================\n\n${f.code}\n\n`
    ).join('\n');

    const blob = new Blob([bundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'karebata_flutter_source_code.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Kode Sumber Flutter Kareba'Ta"
    >
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl border border-stone-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-4 bg-stone-50">
          <div className="flex items-center gap-3 min-w-0">
            <Code2 className="w-5 h-5 text-emerald-800 shrink-0" />
            <div className="truncate">
              <h2 className="font-editorial text-lg font-semibold text-stone-900 truncate">
                Arsitektur Kode Flutter Android — Kareba&apos;Ta
              </h2>
              <p className="text-xs text-stone-500 truncate">
                Material 3 · PageView.vertical · Provider · Firebase Auth · Cloud Firestore · Firebase Storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadAll}
              className="min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-800 text-white hover:bg-emerald-900 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Semua Berkas</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup jendela kode"
              className="min-w-[40px] min-h-[40px] rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Tree Sidebar */}
          <CustomScrollView className="w-full md:w-72 border-b md:border-b-0 md:border-r border-stone-200 bg-stone-50/70 shrink-0" contentClassName="p-3">
            <div className="text-xs font-semibold text-stone-500 px-2.5 py-1.5">
              Struktur Modul Flutter
            </div>
            <div className="mt-1 space-y-1">
              {FLUTTER_PROJECT_FILES.map((file, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white'
                        : 'text-stone-700 hover:bg-stone-200/70'
                    }`}
                  >
                    <div className="font-mono text-xs font-medium truncate">{file.path}</div>
                    <div
                      className={`text-[11px] mt-0.5 truncate ${
                        isSelected ? 'text-emerald-100' : 'text-stone-500'
                      }`}
                    >
                      {file.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </CustomScrollView>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden bg-stone-950 text-stone-100">
            <div className="px-5 py-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="font-mono text-xs text-emerald-400 font-medium">
                  {activeFile.path}
                </div>
                <p className="text-xs text-stone-400 mt-0.5 truncate">{activeFile.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(activeFile.code, activeFile.path)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                {copiedPath === activeFile.path ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>
            </div>

            <CustomScrollView className="flex-1 min-h-0" contentClassName="p-5">
              <pre className="font-mono text-xs leading-relaxed text-stone-200 whitespace-pre-wrap break-words">
                <code>{activeFile.code}</code>
              </pre>
            </CustomScrollView>
          </div>
        </div>
      </div>
    </div>
  );
};
