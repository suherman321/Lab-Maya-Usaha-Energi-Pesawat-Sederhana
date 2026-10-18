import React from 'react';
import { X, BookOpen, Zap, Activity, Wrench, ArrowRight, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface ConceptMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConceptMapModal: React.FC<ConceptMapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Peta Konsep Materi IPA Kelas 8
              </h3>
              <p className="text-xs text-slate-500">
                Usaha, Energi Mekanik, dan Pesawat Sederhana (Kurikulum Merdeka)
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

        {/* Modal Body: Interactive Mind Map Diagram */}
        <div className="p-6 space-y-6">
          
          {/* Main Root Concept */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white px-6 py-3 rounded-2xl shadow-md text-center max-w-md">
              <div className="text-xs uppercase tracking-wider text-blue-200 font-bold">PETA KONSEP UTAMA</div>
              <div className="text-base font-extrabold mt-0.5">Usaha, Energi, & Pesawat Sederhana</div>
              <div className="text-[11px] text-blue-100 mt-1">Kemampuan melakukan kerja dan alat bantu manusia</div>
            </div>
          </div>

          {/* Three Major Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            {/* Branch 1: Usaha & Daya */}
            <div className="bg-blue-50/80 rounded-2xl p-5 border border-blue-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-3">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>1. USAHA & DAYA</span>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <strong className="text-blue-900 block mb-1">Usaha (W):</strong>
                    Energi yang disalurkan gaya untuk memindahkan benda.
                    <div className="font-mono text-blue-700 font-bold mt-1.5 p-1 bg-blue-50 rounded text-center">
                      W = F × s
                    </div>
                    <span className="text-[10px] text-slate-500 block text-center mt-0.5">Satuan: Joule (J)</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <strong className="text-blue-900 block mb-1">Daya (P):</strong>
                    Laju usaha yang dilakukan per satuan waktu.
                    <div className="font-mono text-cyan-700 font-bold mt-1.5 p-1 bg-cyan-50 rounded text-center">
                      P = W / t
                    </div>
                    <span className="text-[10px] text-slate-500 block text-center mt-0.5">Satuan: Watt (W)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-200/60 text-[11px] text-blue-900 font-medium">
                ⚠️ Catatan: Jika benda tidak berpindah (s = 0), maka W = 0 Joule!
              </div>
            </div>

            {/* Branch 2: Energi */}
            <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-3">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>2. ENERGI MEKANIK</span>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <strong className="text-emerald-900 block mb-1">Energi Potensial (Ep):</strong>
                    Energi karena ketinggian posisi benda.
                    <div className="font-mono text-amber-700 font-bold mt-1.5 p-1 bg-amber-50 rounded text-center">
                      Ep = m × g × h
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <strong className="text-emerald-900 block mb-1">Energi Kinetik (Ek):</strong>
                    Energi yang dimiliki benda karena gerak (kecepatan).
                    <div className="font-mono text-cyan-700 font-bold mt-1.5 p-1 bg-cyan-50 rounded text-center">
                      Ek = ½ × m × v²
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <strong className="text-emerald-900 block mb-1">Kekekalan Energi (Em):</strong>
                    <div className="font-mono text-emerald-800 font-bold mt-1 p-1 bg-emerald-50 rounded text-center">
                      Em = Ep + Ek = Konstan
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-200/60 text-[11px] text-emerald-900 font-medium">
                🔄 Ep dan Ek saling bertransformasi saat meluncur atau jatuh bebas.
              </div>
            </div>

            {/* Branch 3: Pesawat Sederhana */}
            <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-3">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>3. PESAWAT SEDERHANA</span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                    <div className="font-bold text-slate-800">1. Bidang Miring</div>
                    <span className="font-mono text-[11px] text-blue-700">KM = s / h | F = w / KM</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                    <div className="font-bold text-slate-800">2. Katrol</div>
                    <span className="font-mono text-[11px] text-emerald-700">Tetap (KM=1), Bebas (KM=2), Majemuk (KM=n)</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                    <div className="font-bold text-slate-800">3. Pengungkit / Tuas</div>
                    <span className="font-mono text-[11px] text-amber-700">KM = lk / lb | F × lk = w × lb</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                    <div className="font-bold text-slate-800">4. Roda & Poros</div>
                    <span className="font-mono text-[11px] text-indigo-700">KM = R / r | Mengurangi gesekan luncur</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200/60 text-[11px] text-amber-900 font-medium">
                🎯 Prinsip: Mengurangi gaya kuasa atau mempermudah arah kerja!
              </div>
            </div>

          </div>

          {/* Quick Summary Table for SMP Exams */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Tabel Rangkuman Rumus Cepat Ujian IPA SMP
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-200/70 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2 rounded-l-lg">Konsep Fisika</th>
                    <th className="p-2">Rumus Utama</th>
                    <th className="p-2">Satuan SI</th>
                    <th className="p-2 rounded-r-lg">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  <tr>
                    <td className="p-2 font-sans font-semibold text-slate-900">Usaha (Work)</td>
                    <td className="p-2 text-blue-700 font-bold">W = F × s</td>
                    <td className="p-2">Joule (J)</td>
                    <td className="p-2 font-sans text-slate-600">F = Gaya (N), s = Perpindahan (m)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-semibold text-slate-900">Daya (Power)</td>
                    <td className="p-2 text-blue-700 font-bold">P = W / t</td>
                    <td className="p-2">Watt (W)</td>
                    <td className="p-2 font-sans text-slate-600">t = Waktu tempuh (sekon)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-semibold text-slate-900">Energi Potensial</td>
                    <td className="p-2 text-emerald-700 font-bold">Ep = m × g × h</td>
                    <td className="p-2">Joule (J)</td>
                    <td className="p-2 font-sans text-slate-600">m = Massa (kg), g = 10 m/s², h = Ketinggian (m)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-semibold text-slate-900">Energi Kinetik</td>
                    <td className="p-2 text-emerald-700 font-bold">Ek = ½ × m × v²</td>
                    <td className="p-2">Joule (J)</td>
                    <td className="p-2 font-sans text-slate-600">v = Kecepatan gerak (m/s)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-semibold text-slate-900">Keuntungan Mekanis</td>
                    <td className="p-2 text-amber-700 font-bold">KM = w / F</td>
                    <td className="p-2">- (Rasio)</td>
                    <td className="p-2 font-sans text-slate-600">w = Beban (N), F = Gaya Kuasa (N)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            Tutup Peta Konsep
          </button>
        </div>
      </div>
    </div>
  );
};
