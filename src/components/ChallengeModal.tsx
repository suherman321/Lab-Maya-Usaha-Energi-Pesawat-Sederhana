import React from 'react';
import { TabType, MachineSubtype } from '../types/physics';
import { X, Trophy, Star, CheckCircle, ArrowRight, Sparkles, Award } from 'lucide-react';
import { sound } from '../utils/audio';

export interface ChallengeItem {
  id: string;
  tab: TabType;
  subMachine?: MachineSubtype;
  title: string;
  description: string;
  rewardStars: number;
  isCompleted: boolean;
  hint: string;
}

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: ChallengeItem[];
  onNavigateToTab: (tab: TabType, sub?: MachineSubtype) => void;
  totalScore: number;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  challenges,
  onNavigateToTab,
  totalScore
}) => {
  if (!isOpen) return null;

  const completedCount = challenges.filter(c => c.isCompleted).length;
  const progressPercent = Math.round((completedCount / challenges.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
        role="dialog"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Misi Tantangan Lab Fisika</span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                  {completedCount}/{challenges.length} Selesai
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Selesaikan eksperimen langsung di lab maya untuk mendapatkan Bintang Peneliti Cilik!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Badge bar */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-100 font-bold">PENCAPAIAN SAINS</div>
            <div className="text-xl font-extrabold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-200" />
              <span>{completedCount === challenges.length ? 'Master Fisika SMP! 🎓' : 'Peneliti Fisika Muda 🔬'}</span>
            </div>
            <div className="text-xs text-amber-100 mt-0.5">
              Total Skor: <strong>{totalScore} XP</strong> | {completedCount} dari {challenges.length} Bintang
            </div>
          </div>

          {/* Progress ring / bar */}
          <div className="w-full sm:w-48">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Kemajuan Misi</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-3 bg-amber-700/40 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mission List */}
        <div className="p-6 space-y-3.5">
          {challenges.map((ch, idx) => (
            <div
              key={ch.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                ch.isCompleted
                  ? 'bg-emerald-50/70 border-emerald-200 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  ch.isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {ch.isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{ch.title}</h4>
                    <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-400 mr-1 text-amber-400" />
                      +{ch.rewardStars} ⭐
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{ch.description}</p>
                  <p className="text-[11px] text-indigo-600 font-medium mt-1">💡 Petunjuk: {ch.hint}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="self-end sm:self-center shrink-0">
                {ch.isCompleted ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Tercapai</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onNavigateToTab(ch.tab, ch.subMachine);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs active:scale-95"
                  >
                    <span>Coba Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
