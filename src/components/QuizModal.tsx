import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../types/physics';
import { X, HelpCircle, CheckCircle, AlertCircle, RotateCcw, Award, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddScore?: (pts: number) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, onAddScore }) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);

  if (!isOpen) return null;

  const q = QUIZ_QUESTIONS[currentIdx];
  const hasAnswered = selectedAnswers[currentIdx] !== undefined;
  const isCorrect = selectedAnswers[currentIdx] === q.correctIndex;

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    const newAnswers = { ...selectedAnswers, [currentIdx]: idx };
    setSelectedAnswers(newAnswers);

    if (idx === q.correctIndex) {
      sound.playSuccess();
      onAddScore?.(20);
    } else {
      sound.playClick();
    }
  };

  const nextQuestion = () => {
    sound.playClick();
    if (currentIdx + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsFinished(true);
      sound.playBadge();
    }
  };

  const restartQuiz = () => {
    sound.playClick();
    setSelectedAnswers({});
    setCurrentIdx(0);
    setIsFinished(false);
  };

  const totalCorrect = Object.entries(selectedAnswers).filter(
    ([qIndex, ans]) => QUIZ_QUESTIONS[Number(qIndex)].correctIndex === ans
  ).length;

  const score = Math.round((totalCorrect / QUIZ_QUESTIONS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
        role="dialog"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Kuis Evaluasi Fisika SMP
              </h3>
              <p className="text-xs text-slate-500">
                Uji pemahaman konsep Usaha, Energi, dan Pesawat Sederhana
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

        {/* Content */}
        {!isFinished ? (
          <div className="p-6 space-y-5">
            {/* Progress counter */}
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Soal {currentIdx + 1} dari {QUIZ_QUESTIONS.length}</span>
              <span className="text-emerald-700 font-mono">Skor Sementara: {totalCorrect * 20}</span>
            </div>

            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                {q.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {q.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentIdx] === optIdx;
                const isCorrectOption = optIdx === q.correctIndex;
                let optionStyle = 'bg-white border-slate-200 hover:border-blue-400 text-slate-800';

                if (hasAnswered) {
                  if (isCorrectOption) {
                    optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                  } else if (isSelected) {
                    optionStyle = 'bg-rose-50 border-rose-500 text-rose-900';
                  } else {
                    optionStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${optionStyle}`}
                  >
                    <span>{opt}</span>
                    {hasAnswered && isCorrectOption && (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                    )}
                    {hasAnswered && isSelected && !isCorrectOption && (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation card after answering */}
            {hasAnswered && (
              <div className={`p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in ${
                isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {isCorrect ? '🎉 Jawaban Tepat!' : '💡 Pembahasan:'}
                </div>
                {q.explanation}
              </div>
            )}

            {/* Next button */}
            {hasAnswered && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={nextQuestion}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {currentIdx + 1 < QUIZ_QUESTIONS.length ? 'Soal Berikutnya ➔' : 'Lihat Hasil Akhir'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Finished State */
          <div className="p-8 text-center space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-lg shadow-amber-500/10">
              <Award className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-2xl font-black text-slate-900">
                Nilai Kamu: <span className="text-blue-600">{score}</span> / 100
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Kamu menjawab benar <strong>{totalCorrect}</strong> dari <strong>{QUIZ_QUESTIONS.length}</strong> pertanyaan.
              </p>
              <div className="mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2 px-4 rounded-xl inline-block border border-emerald-200">
                {score >= 80 ? '🌟 Luar biasa! Pemahaman konsep fisika kamu sudah sangat matang!' : '👍 Bagus! Coba uji kembali menggunakan eksperimen lab maya untuk memperdalam pemahaman.'}
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={restartQuiz}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ulangi Kuis</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              >
                Kembali ke Lab
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
