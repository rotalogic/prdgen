import React, { useState } from 'react';
import { Star, X, Check } from 'lucide-react';

interface ReviewPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => Promise<void>;
}

export const ReviewPrompt: React.FC<ReviewPromptProps> = ({ isOpen, onClose, onSubmit }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!rating || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(rating);
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setRating(0);
      }, 1400);
    } catch {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0E1526] border border-slate-700/90 rounded-2xl shadow-2xl p-6 text-center relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-4 space-y-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 mb-1">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-white">Terima kasih atas penilaianmu!</p>
          </div>
        ) : (
          <>
            <h3 className="text-base font-bold font-display text-white mb-1">Dokumen sudah diunduh</h3>
            <p className="text-xs text-slate-400 mb-5">Seberapa membantu PRD Generator untuk kamu?</p>

            <div className="flex items-center justify-center gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Beri ${star} bintang`}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= activeRating ? 'fill-[#F2542D] text-[#F2542D]' : 'fill-transparent text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!rating || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F2542D] hover:bg-[#ff6742] text-white font-bold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Penilaian'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
