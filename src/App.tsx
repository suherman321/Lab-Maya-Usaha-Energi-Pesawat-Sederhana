import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TabType, MachineSubtype } from './types/physics';
import { Header } from './components/Header';
import { WorkPowerTab } from './components/WorkPowerTab';
import { EnergyTab } from './components/EnergyTab';
import { SimpleMachinesTab } from './components/SimpleMachinesTab';
import { ConceptMapModal } from './components/ConceptMapModal';
import { ChallengeModal, ChallengeItem } from './components/ChallengeModal';
import { QuizModal } from './components/QuizModal';
import { sound } from './utils/audio';
import { CheckCircle2, Sparkles, BookOpen, Trophy } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('work-power');
  const [subMachineType, setSubMachineType] = useState<MachineSubtype>('inclined-plane');

  // Modals state
  const [isConceptMapOpen, setIsConceptMapOpen] = useState<boolean>(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState<boolean>(false);
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);

  // Audio State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gamification: Challenges List
  const [challenges, setChallenges] = useState<ChallengeItem[]>([
    {
      id: 'c1',
      tab: 'work-power',
      title: 'Misi 1: Cetak Usaha Tepat 200 Joule',
      description: 'Atur kombinasi Gaya (F) dan Perpindahan (s) hingga Usaha (W = F × s) bernilai tepat 200 Joule.',
      rewardStars: 1,
      isCompleted: false,
      hint: 'Contoh: Gaya 40 N dengan perpindahan 5 m (40 × 5 = 200 J) atau 20 N × 10 m.'
    },
    {
      id: 'c2',
      tab: 'work-power',
      title: 'Misi 2: Dorong Balok dengan Daya Tinggi',
      description: 'Hasilkan daya dorong (P) minimal 100 Watt dalam percobaan Usaha & Daya.',
      rewardStars: 1,
      isCompleted: false,
      hint: 'Gunakan gaya dorong besar (misal 100 N) dan jarak tempuh cukup jauh dalam waktu singkat.'
    },
    {
      id: 'c3',
      tab: 'energy',
      title: 'Misi 3: Energi Potensial Raksasa (≥ 400 J)',
      description: 'Di Tab Energi, atur massa bola dan ketinggian awal hingga Energi Potensial (Ep) mencapai minimal 400 Joule.',
      rewardStars: 1,
      isCompleted: false,
      hint: 'Rumus Ep = m × 10 × h. Gunakan massa 8 kg di ketinggian 5 meter atau sejenisnya.'
    },
    {
      id: 'c4',
      tab: 'energy',
      title: 'Misi 4: Kecepatan Akhir 10 m/s',
      description: 'Luncurkan bola hingga kecepatannya saat mencapai dasar lintasan bernilai tepat atau mendekati 10 m/s.',
      rewardStars: 2,
      isCompleted: false,
      hint: 'Dari rumus v = √(2 × g × h), ketinggian h = 5 meter akan menghasilkan v = √(2 × 10 × 5) = 10 m/s!'
    },
    {
      id: 'c5',
      tab: 'machines',
      subMachine: 'lever',
      title: 'Misi 5: Tuas Berkekuatan Tinggi (KM ≥ 3)',
      description: 'Di Tab Pesawat Sederhana (Tuas), geser titik tumpu agar Keuntungan Mekanis (KM = lk / lb) mencapai 3 atau lebih.',
      rewardStars: 1,
      isCompleted: false,
      hint: 'Geser titik tumpu mendekati beban (sehingga lb pendek dan lk panjang).'
    },
    {
      id: 'c6',
      tab: 'machines',
      subMachine: 'pulley',
      title: 'Misi 6: Katrol Majemuk / Takal Ringan',
      description: 'Pilih sistem Katrol Majemuk (KM = 4) untuk meringankan beban menjadi seperempatnya.',
      rewardStars: 1,
      isCompleted: false,
      hint: 'Buka Tab Pesawat Sederhana, pilih submenu Katrol, lalu klik tombol Katrol Majemuk.'
    }
  ]);

  const [totalScore, setTotalScore] = useState<number>(0);
  const completedIdsRef = useRef<Set<string>>(new Set());

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  const markChallengeCompleted = useCallback((id: string) => {
    if (completedIdsRef.current.has(id)) return;
    completedIdsRef.current.add(id);

    setChallenges(prev => {
      const target = prev.find(c => c.id === id);
      if (!target || target.isCompleted) return prev;
      sound.playBadge();
      setTotalScore(s => s + target.rewardStars * 50);
      showToast(`🏆 Selamat! Kamu menyelesaikan "${target.title}" (+${target.rewardStars} ⭐)!`);
      return prev.map(c => c.id === id ? { ...c, isCompleted: true } : c);
    });
  }, [showToast]);

  // State update handlers from each Tab for challenge verifications
  const handleWorkPowerUpdate = useCallback((data: { force: number; distance: number; time: number; work: number; power: number }) => {
    if (Math.abs(data.work - 200) < 0.1) {
      markChallengeCompleted('c1');
    }
    if (data.power >= 100) {
      markChallengeCompleted('c2');
    }
  }, [markChallengeCompleted]);

  const handleEnergyUpdate = useCallback((data: { ep: number; em: number; currentVelocity: number; currentHeight: number }) => {
    if (data.ep >= 400) {
      markChallengeCompleted('c3');
    }
    // When ball is near ground and speed is ~10 m/s
    if (data.currentHeight < 0.2 && Math.abs(data.currentVelocity - 10) < 0.3) {
      markChallengeCompleted('c4');
    }
  }, [markChallengeCompleted]);

  const handleMachinesUpdate = useCallback((data: any) => {
    if (data.subMachine === 'lever' && data.lever && data.lever.km >= 3) {
      markChallengeCompleted('c5');
    }
    if (data.subMachine === 'pulley' && data.pulley && data.pulley.km === 4) {
      markChallengeCompleted('c6');
    }
  }, [markChallengeCompleted]);

  const handleNavigateToTab = useCallback((tab: TabType, sub?: MachineSubtype) => {
    setActiveTab(tab);
    if (sub) {
      setSubMachineType(sub);
    }
  }, []);

  const handleResetAll = useCallback(() => {
    setActiveTab('work-power');
    showToast('Nilai simulasi telah disetel ulang.');
  }, [showToast]);

  const completedCount = challenges.filter(c => c.isCompleted).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConceptMap={() => setIsConceptMapOpen(true)}
        onOpenChallenges={() => setIsChallengesOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onResetAll={handleResetAll}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        completedChallengesCount={completedCount}
        totalChallengesCount={challenges.length}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'work-power' && (
          <div className="animate-in fade-in duration-200">
            <WorkPowerTab
              onNotifySuccess={showToast}
              onStateUpdate={handleWorkPowerUpdate}
            />
          </div>
        )}

        {activeTab === 'energy' && (
          <div className="animate-in fade-in duration-200">
            <EnergyTab
              onNotifySuccess={showToast}
              onStateUpdate={handleEnergyUpdate}
            />
          </div>
        )}

        {activeTab === 'machines' && (
          <div className="animate-in fade-in duration-200">
            <SimpleMachinesTab
              onNotifySuccess={showToast}
              onStateUpdate={handleMachinesUpdate}
            />
          </div>
        )}
      </main>

      {/* Modern Classroom Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="font-semibold text-slate-700">Lab Maya IPA SMP Kelas 8</span>
            <span>— Media Pembelajaran Interaktif Fisika</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsConceptMapOpen(true)}
              className="hover:text-blue-600 transition-colors font-medium flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Rangkuman Konsep</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsChallengesOpen(true)}
              className="hover:text-amber-600 transition-colors font-medium flex items-center gap-1"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Misi Tantangan ({completedCount}/{challenges.length})</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ConceptMapModal
        isOpen={isConceptMapOpen}
        onClose={() => setIsConceptMapOpen(false)}
      />

      <ChallengeModal
        isOpen={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
        challenges={challenges}
        onNavigateToTab={handleNavigateToTab}
        totalScore={totalScore}
      />

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onAddScore={(pts) => setTotalScore(s => s + pts)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
}
