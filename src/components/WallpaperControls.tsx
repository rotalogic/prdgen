import React, { useRef, useState } from 'react';
import { BackgroundMode } from './CosmicBackground';
import { Image, ShieldCheck, Upload, Sliders, X, Mountain, Check } from 'lucide-react';

interface WallpaperControlsProps {
  mode: BackgroundMode;
  onSetMode: (mode: BackgroundMode) => void;
  customImageUrl?: string | null;
  onUploadCustomImage: (dataUrl: string) => void;
  onResetToOriginal: () => void;
  dimOpacity: number;
  onChangeDim: (dim: number) => void;
}

export const WallpaperControls: React.FC<WallpaperControlsProps> = ({
  mode,
  onSetMode,
  customImageUrl,
  onUploadCustomImage,
  onResetToOriginal,
  dimOpacity,
  onChangeDim,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUploadCustomImage(result);
        onSetMode('custom_upload');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Floating trigger widget at the bottom left */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2">
        <button
          id="wallpaper-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0F1320] hover:bg-[#161C2E] border border-white/10 hover:border-[#F2542D]/50 text-xs text-slate-200 shadow-xl transition-all duration-200 cursor-pointer"
          title="Atur Latar Belakang & Cadangan"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F2542D] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F2542D]"></span>
          </span>
          <Image className="w-3.5 h-3.5 text-[#F2542D]" />
          <span className="font-medium text-slate-300 group-hover:text-white">
            {mode === 'cosmic_lava' && 'Tema: Lanskap Kosmik'}
            {mode === 'custom_upload' && 'Tema: Gambar Kustom'}
            {mode === 'default_minimal' && 'Tema: Gelap Standar'}
          </span>
        </button>

        {/* Quick 1-click restore backup button if user doesn't like the new background */}
        {mode !== 'default_minimal' && (
          <button
            id="quick-restore-backup-btn"
            onClick={onResetToOriginal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#0F1320] hover:bg-amber-950/40 border border-amber-500/30 hover:border-amber-500/60 text-xs text-amber-300 shadow-lg transition-all duration-200 cursor-pointer"
            title="Kembali ke tampilan awal sebelum latar belakang diubah"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Pulihkan Tampilan Standar</span>
          </button>
        )}
      </div>

      {/* Control Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0F1320] border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#F2542D]/20 border border-[#F2542D]/30 flex items-center justify-center">
                <Image className="w-4 h-4 text-[#F2542D]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-display">Pengaturan Latar Belakang &amp; Cadangan</h3>
                <p className="text-xs text-slate-400">Pilih tema visual atau pulihkan tampilan standar</p>
              </div>
            </div>

            {/* Backup status notice */}
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block font-mono text-[11px]">CADANGAN SISTEM TERSEDIA</span>
                <span className="text-emerald-400/80 text-[11px]">
                  File cadangan tersimpan di <code className="bg-black/40 px-1 py-0.5 rounded text-emerald-200 font-mono">src/App.backup.tsx</code> dan <code className="bg-black/40 px-1 py-0.5 rounded text-emerald-200 font-mono">src/index.backup.css</code>. Anda dapat memulihkannya kapan saja.
                </span>
              </div>
            </div>

            {/* Theme options */}
            <div className="space-y-2.5 mb-5">
              {/* Option 1: Cosmic Lava Mountain */}
              <button
                type="button"
                onClick={() => onSetMode('cosmic_lava')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'cosmic_lava'
                    ? 'bg-[#F2542D]/10 border-[#F2542D] text-white shadow-lg shadow-[#F2542D]/10'
                    : 'bg-[#161C2E] border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#2A1512] border border-[#F2542D]/40 flex items-center justify-center text-[#F2542D]">
                    <Mountain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-xs text-white flex items-center gap-1.5">
                      <span>Lanskap Kosmik Vulkanik</span>
                      {mode === 'cosmic_lava' && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          ● Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Visual panorama pegunungan dengan aksen gerhana matahari oranye
                    </div>
                  </div>
                </div>
                {mode === 'cosmic_lava' && <Check className="w-4 h-4 text-[#F2542D] shrink-0" />}
              </button>

              {/* Option 2: Default Minimalist (The requested backup state) */}
              <button
                type="button"
                onClick={() => onSetMode('default_minimal')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'default_minimal'
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-[#161C2E] border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#111625] border border-slate-600 flex items-center justify-center text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-xs text-white flex items-center gap-1.5">
                      <span>Tampilan Gelap Standar (Cadangan)</span>
                      {mode === 'default_minimal' && (
                        <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                          ● Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Gaya gelap minimalis orisinal dengan pencahayaan horizon halus
                    </div>
                  </div>
                </div>
                {mode === 'default_minimal' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>

              {/* Option 3: Custom file upload */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  mode === 'custom_upload'
                    ? 'bg-[#F2542D]/10 border-[#F2542D] text-white'
                    : 'bg-[#161C2E] border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-xs text-white flex items-center gap-1.5">
                        <span>Unggah Gambar Kustom</span>
                        {mode === 'custom_upload' && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            ● Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">Gunakan file gambar dari penyimpanan lokal</div>
                    </div>
                  </div>
                  {mode === 'custom_upload' && <Check className="w-4 h-4 text-[#F2542D] shrink-0" />}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors cursor-pointer text-center border border-slate-700"
                  >
                    {customImageUrl ? 'Pilih Gambar Lain...' : 'Pilih File Gambar (.PNG, .JPG, .WEBP)'}
                  </button>
                  {customImageUrl && (
                    <button
                      type="button"
                      onClick={() => onSetMode('custom_upload')}
                      className="py-1.5 px-3 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      Terapkan
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dimming Slider */}
            {mode !== 'default_minimal' && (
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 mb-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kepekatan Lapisan Gelap (Readability)</span>
                  </span>
                  <span className="font-mono text-[#F2542D] font-bold">{Math.round(dimOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.6"
                  step="0.05"
                  value={dimOpacity}
                  onChange={(e) => onChangeDim(parseFloat(e.target.value))}
                  className="w-full accent-[#F2542D] h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Lebih Terang</span>
                  <span>Lebih Redup (Teks sangat jelas)</span>
                </div>
              </div>
            )}

            {/* Actions footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onResetToOriginal}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Reset ke Tampilan Awal</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F2542D] hover:bg-[#ff6742] text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Terapkan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
