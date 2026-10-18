/**
 * Physics Types and Data Structures for Lab Maya IPA Kelas 8
 */

export type TabType = 'work-power' | 'energy' | 'machines';

export type MachineSubtype = 'inclined-plane' | 'pulley' | 'lever' | 'wheel-axle';

export interface Challenge {
  id: string;
  tab: TabType;
  subType?: MachineSubtype;
  title: string;
  description: string;
  targetDescription: string;
  hint: string;
  points: number;
  isCompleted: boolean;
  check: (state: any) => boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Seseorang mendorong dinding tembok sekuat tenaga dengan gaya 200 N selama 10 menit, namun tembok tidak bergeser sama sekali. Berapakah usaha yang dilakukan orang tersebut?",
    options: ["2000 Joule", "200 Joule", "0 Joule", "20 Joule"],
    correctIndex: 2,
    explanation: "Dalam fisika, Usaha (W) = Gaya (F) × Perpindahan (s). Karena perpindahan s = 0 meter, maka W = 200 N × 0 m = 0 Joule. Meskipun merasa lelah, secara konsep fisika tidak ada usaha yang dilakukan!"
  },
  {
    id: 2,
    question: "Sebuah kelapa bermassa 2 kg berada di pohon pada ketinggian 5 meter. Jika percepatan gravitasi bumi g = 10 m/s², berapakah energi potensialnya?",
    options: ["10 Joule", "50 Joule", "100 Joule", "200 Joule"],
    correctIndex: 2,
    explanation: "Energi Potensial gravitasi dihitung dengan rumus Ep = m × g × h. Ep = 2 kg × 10 m/s² × 5 m = 100 Joule."
  },
  {
    id: 3,
    question: "Saat sebuah bola dijatuhkan bebas dari puncak gedung tanpa gesekan udara, bagaimanakah perubahan energi potensial (Ep) dan energi kinetik (Ek) selama jatuh?",
    options: [
      "Ep bertambah, Ek berkurang, Em berkurang",
      "Ep berkurang, Ek bertambah, Em tetap",
      "Ep dan Ek sama-sama bertambah",
      "Ep dan Ek sama-sama berkurang"
    ],
    correctIndex: 1,
    explanation: "Sesuai Hukum Kekekalan Energi Mekanik, saat benda bergerak ke bawah, ketinggian berkurang sehingga Ep berkurang. Energi tersebut berubah menjadi Ek karena kecepatan bertambah. Jumlah keduanya (Energi Mekanik Em = Ep + Ek) selalu tetap konstan!"
  },
  {
    id: 4,
    question: "Sebuah drum berbobot 600 N akan dinaikkan ke bak truk setinggi 1,5 meter menggunakan papan bidang miring sepanjang 6 meter. Berapakah gaya kuasa minimum yang diperlukan?",
    options: ["150 N", "300 N", "450 N", "600 N"],
    correctIndex: 0,
    explanation: "Keuntungan mekanis bidang miring KM = s / h = 6 m / 1,5 m = 4. Maka Gaya Kuasa F = W / KM = 600 N / 4 = 150 N. Bidang miring meringankan gaya kuasa menjadi seperempatnya!"
  },
  {
    id: 5,
    question: "Di antara contoh alat sehari-hari berikut, manakah yang merupakan tuas jenis ke-1 (titik tumpu berada di antara titik beban dan titik kuasa)?",
    options: ["Gunting dan Jungkat-jungkit", "Gerobak dorong roda satu", "Pinset dan Sekop", "Pemecah biji kemiri"],
    correctIndex: 0,
    explanation: "Gunting dan jungkat-jungkit memiliki titik tumpu di bagian tengah antara beban dan kuasa (Tuas Golongan I). Gerobak roda satu adalah Golongan II (beban di tengah), sedangkan pinset adalah Golongan III (kuasa di tengah)."
  }
];
