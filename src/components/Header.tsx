import React from 'react';
import { TabType } from '../types/physics';
import { 
  Zap, 
  Activity, 
  Wrench, 
  BookOpen, 
  Trophy, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenConceptMap: () => void;
  onOpenChallenges: () => void;
  onOpenQuiz: () => void;
  onResetAll: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  completedChallengesCount: number;
  totalChallengesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenConceptMap,
  onOpenChallenges,
  onOpenQuiz,
  onResetAll,
  soundEnabled,
  setSoundEnabled,
  completedChallengesCount,
  totalChallengesCount
}) => {
  const toggleSound = () => {
    sound.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      sound.playClick();
    }
  };

  const handleTabChange = (tab: TabType) => {
    sound.playClick();
    setActiveTab(tab);
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Brand & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 bg-clip-text text-transparent">
                  Lab Maya IPA
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                  SMP Kelas 8
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Usaha, Energi Mekanik, dan Pesawat Sederhana
              </p>
            </div>
          </div>

          {/* Action buttons (Gamification, Concept Map, Quiz, Audio) */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Peta Konsep Button */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenConceptMap();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all hover:scale-[1.02] active:scale-95"
              title="Lihat Peta Konsep Materi"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Peta Konsep</span>
            </button>

            {/* Misi Tantangan Button */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenChallenges();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              title="Misi Tantangan Fisika Berhadiah Bintang"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Tantangan</span>
              <span className="ml-1 px-1.5 py-0.2 bg-amber-200 text-amber-800 rounded-full text-[10px] font-bold">
                {completedChallengesCount}/{totalChallengesCount} ⭐
              </span>
            </button>

            {/* Kuis Interaktif */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenQuiz();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all hover:scale-[1.02] active:scale-95"
              title="Latihan Soal Kuis IPA"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kuis IPA</span>
            </button>

            {/* Reset Defaults */}
            <button
              onClick={() => {
                sound.playClick();
                onResetAll();
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
              title="Reset Semua Nilai Simulasi"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg border transition-colors ${
                soundEnabled 
                  ? 'text-blue-600 bg-blue-50 border-blue-200' 
                  : 'text-slate-400 bg-slate-50 border-slate-200'
              }`}
              title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 3 Main Navigation Tabs */}
        <div className="mt-4 flex space-x-1 sm:space-x-2 border-b border-slate-200">
          
          {/* Tab 1: Usaha & Daya */}
          <button
            onClick={() => handleTabChange('work-power')}
            className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-sm rounded-t-xl transition-all border-b-2 -mb-px ${
              activeTab === 'work-power'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 border-transparent'
            }`}
          >
            <Zap className={`w-4 h-4 ${activeTab === 'work-power' ? 'text-amber-300' : 'text-blue-500'}`} />
            <span>1. Usaha & Daya</span>
          </button>

          {/* Tab 2: Energi */}
          <button
            onClick={() => handleTabChange('energy')}
            className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-sm rounded-t-xl transition-all border-b-2 -mb-px ${
              activeTab === 'energy'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 border-transparent'
            }`}
          >
            <Activity className={`w-4 h-4 ${activeTab === 'energy' ? 'text-emerald-300' : 'text-emerald-500'}`} />
            <span>2. Energi (Ep, Ek, Em)</span>
          </button>

          {/* Tab 3: Pesawat Sederhana */}
          <button
            onClick={() => handleTabChange('machines')}
            className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-sm rounded-t-xl transition-all border-b-2 -mb-px ${
              activeTab === 'machines'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 border-transparent'
            }`}
          >
            <Wrench className={`w-4 h-4 ${activeTab === 'machines' ? 'text-orange-300' : 'text-orange-500'}`} />
            <span>3. Pesawat Sederhana</span>
          </button>
        </div>
      </div>
    </header>
  );
};
