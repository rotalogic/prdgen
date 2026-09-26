import React, { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import { FileText, Database, CheckSquare, ArrowRight, Users, Star } from 'lucide-react';

interface HomepageStats {
  totalUsers: number;
  totalGenerated: number;
  reviewCount: number;
  averageRating: number;
}

interface HeroViewProps {
  onStart: (initialIdea?: string) => void;
  userEmail?: string;
  userName?: string;
  isLoggedIn?: boolean;
  onOpenAuthModal?: () => void;
}

// 3D Spline scene sitting behind the hero content. Public placeholder scene -
// a custom RotaLogic-branded one would need to be designed in Spline.design.
function HeroSplineBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <Spline
        style={{ width: '100%', height: '100%' }}
        scene="https://prod.spline.design/dJqTIQ-tE3ULUPMi/scene.splinecode"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, rgba(7,10,18,0.6), transparent 35%, transparent 70%, rgba(7,10,18,0.6)),
            linear-gradient(to bottom, transparent 55%, rgba(7,10,18,0.95))
          `,
        }}
      />
    </div>
  );
}

export const HeroView: React.FC<HeroViewProps> = ({
  onStart,
  isLoggedIn = false,
  onOpenAuthModal
}) => {
  const [quickIdea, setQuickIdea] = useState('');
  const [stats, setStats] = useState<HomepageStats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, []);

  const startOrGate = (idea?: string) => {
    if (!isLoggedIn) {
      onOpenAuthModal?.();
      return;
    }
    onStart(idea);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startOrGate(quickIdea);
  };

  return (
    <div className="relative">
      {/* 3D HERO */}
      <div className="relative min-h-[92vh] flex items-center">
        <HeroSplineBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 w-full pointer-events-none">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">

            {/* LEFT: Headline */}
            <div className="w-full lg:w-5/12 pointer-events-auto">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.12] tracking-tight text-white mb-4">
                Dari ide 1 kalimat jadi{' '}
                <span className="text-[#F2542D] drop-shadow-[0_0_20px_rgba(242,84,45,0.4)]">
                  PRD matang
                </span>
                , lewat wawancara.
              </h1>

            </div>

            {/* RIGHT: Pitch, quick-start */}
            <div className="w-full lg:w-7/12 flex flex-col items-start pointer-events-auto">
              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-6 max-w-xl">
                Jawab pertanyaan seperti diinterview CTO, lalu dapatkan dokumen PRD lengkap termasuk ERD, SQL, dan task list.
              </p>

              <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={quickIdea}
                    onChange={(e) => setQuickIdea(e.target.value)}
                    placeholder="Punya ide? Ketik di sini (cth: Airbnb untuk sewa alat camping)..."
                    className="w-full bg-[#0E1424]/90 border border-slate-700/80 rounded-xl px-4 py-3.5 pr-28 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] focus:ring-1 focus:ring-[#F2542D] shadow-lg backdrop-blur-sm transition"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(242,84,45,0.4)] hover:shadow-[0_0_20px_rgba(242,84,45,0.6)] transition-all"
                  >
                    <span>Mulai</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* BELOW THE FOLD: what you actually get, in real terms */}
      <div className="relative z-10 bg-[#070A12]" style={{ marginTop: '-8vh' }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 pb-16">
          {/* Asymmetric feature bento - one featured artifact, two supporting ones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="md:row-span-2 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#121A2E] to-[#0A0E1A] p-6 sm:p-8 flex flex-col justify-between min-h-[240px] relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#F2542D]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="w-11 h-11 rounded-xl bg-[#F2542D]/15 border border-[#F2542D]/30 flex items-center justify-center text-[#F2542D] mb-5 relative">
                <FileText className="w-5 h-5" />
              </div>
              <div className="relative">
                <h3 className="font-display text-xl font-bold text-white mb-2">Dokumen PRD lengkap</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                  54 bab mengikuti struktur Master PRD RotaLogic, terisi dari jawaban wawancaramu sendiri. Bagian yang belum ada datanya ditandai jujur, bukan dikarang.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0E1424]/70 p-5 sm:p-6 flex flex-col justify-between min-h-[110px]">
              <Database className="w-5 h-5 text-slate-400" />
              <div className="mt-4">
                <h3 className="font-display text-sm font-bold text-white mb-1">ERD &amp; SQL Schema</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Relasi antar tabel terdeteksi otomatis dari entitas yang kamu definisikan sendiri.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0E1424]/70 p-5 sm:p-6 flex flex-col justify-between min-h-[110px]">
              <CheckSquare className="w-5 h-5 text-slate-400" />
              <div className="mt-4">
                <h3 className="font-display text-sm font-bold text-white mb-1">Roadmap &amp; task sprint</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Fitur dipecah jadi sub-fitur dan task per sprint, siap masuk backlog developer.</p>
              </div>
            </div>
          </div>

          {/* Real usage stats */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-10 mt-2 border-t border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-[#F2542D] shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-white">{stats.totalUsers.toLocaleString('id-ID')}</p>
                  <p className="text-xs text-slate-400">Pengguna terdaftar</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-[#F2542D] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-white">{stats.totalGenerated.toLocaleString('id-ID')}</p>
                  <p className="text-xs text-slate-400">PRD berhasil dibuat</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-[#F2542D] shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-white">
                    {stats.reviewCount > 0 ? `${stats.averageRating.toFixed(1)} / 5` : '-'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {stats.reviewCount > 0 ? `Dari ${stats.reviewCount.toLocaleString('id-ID')} ulasan` : 'Belum ada ulasan'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
