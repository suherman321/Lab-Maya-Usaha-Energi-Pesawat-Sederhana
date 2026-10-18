import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, Gauge, MoveRight, Clock, Award, Info, Lightbulb, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface WorkPowerTabProps {
  onNotifySuccess?: (msg: string) => void;
  onStateUpdate?: (data: { force: number; distance: number; time: number; work: number; power: number }) => void;
}

export const WorkPowerTab: React.FC<WorkPowerTabProps> = ({ onNotifySuccess, onStateUpdate }) => {
  // Mode Perhitungan: 'both' (Usaha & Daya), 'work-only' (Usaha Saja), 'power-only' (Daya Saja)
  const [calcMode, setCalcMode] = useState<'both' | 'work-only' | 'power-only'>('both');

  // Primary Sliders (Initialized to 30N, 4m so it doesn't trigger c1 prematurely)
  const [force, setForce] = useState<number>(30); // 0 - 100 N
  const [distance, setDistance] = useState<number>(4); // 0 - 10 m
  const [time, setTime] = useState<number>(4); // 1 - 10 s

  // Animation States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(1); // 0 to 1
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x or 0.5x

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const onStateUpdateRef = useRef(onStateUpdate);

  useEffect(() => {
    onStateUpdateRef.current = onStateUpdate;
  }, [onStateUpdate]);

  // Computed Real-time Physics (Logika: Jika F=0 atau s=0, maka hasilnya 0)
  const isZeroWork = force === 0 || distance === 0;
  const work = isZeroWork ? 0 : force * distance; // W = F * s (Joule)
  const power = isZeroWork || time <= 0 ? 0 : work / time; // P = W / t = (F * s) / t (Watt)

  // Report to parent for challenge checks safely
  useEffect(() => {
    onStateUpdateRef.current?.({ force, distance, time, work, power });
  }, [force, distance, time, work, power]);

  // When sliders change manually while not playing, update progress to reflect end position or stay at 1
  const handleForceChange = (val: number) => {
    setForce(val);
    sound.playSlide();
  };

  const handleDistanceChange = (val: number) => {
    setDistance(val);
    setProgress(1); // Show block at new target distance
    sound.playSlide();
  };

  const handleTimeChange = (val: number) => {
    setTime(val);
    sound.playSlide();
  };

  const startSimulation = () => {
    sound.playWhoosh();
    setProgress(0);
    setIsPlaying(true);
    lastTimeRef.current = performance.now();
  };

  const pauseSimulation = () => {
    sound.playClick();
    setIsPlaying(false);
  };

  const resetSimulation = () => {
    sound.playClick();
    setIsPlaying(false);
    setProgress(0);
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const durationMs = (time * 1000) / playbackSpeed;

    const animate = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const elapsed = now - lastTimeRef.current;

      const newProgress = Math.min(1, elapsed / durationMs);
      setProgress(newProgress);

      if (newProgress >= 1) {
        setIsPlaying(false);
        sound.playSuccess();
        onNotifySuccess?.(`Hebat! Usaha sebesar ${work} Joule selesai dalam waktu ${time} detik (Daya = ${power.toFixed(1)} W)!`);
      } else {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, time, playbackSpeed, force, distance, work, power, onNotifySuccess]);

  // Canvas Drawing
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const width = canvas.width;
    const height = canvas.height;

    // Background gradient (laboratory wall & floor)
    ctx.clearRect(0, 0, width, height);

    // Wall (top 65%)
    const wallGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
    wallGrad.addColorStop(0, '#f8fafc');
    wallGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, height * 0.65);

    // Floor (bottom 35%)
    const floorY = height * 0.65;
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, height);
    floorGrad.addColorStop(0, '#cbd5e1');
    floorGrad.addColorStop(0.1, '#94a3b8');
    floorGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, width, height - floorY);

    // Floor Baseboard line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(width, floorY);
    ctx.stroke();

    // Floor perspective tiles/lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x - 40, height);
      ctx.stroke();
    }

    // Ruler Scale (0 to 10 meters)
    const marginX = 80;
    const trackWidth = width - marginX * 2;
    const meterStepPx = trackWidth / 10;
    const rulerY = floorY + 45;

    // Ruler bar
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.fillRect(marginX, rulerY - 12, trackWidth, 24);
    ctx.strokeRect(marginX, rulerY - 12, trackWidth, 24);

    // Ruler ticks
    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 10px Poppins, sans-serif';
    ctx.textAlign = 'center';

    for (let m = 0; m <= 10; m++) {
      const rx = marginX + m * meterStepPx;
      ctx.beginPath();
      ctx.moveTo(rx, rulerY - 12);
      ctx.lineTo(rx, rulerY + (m % 5 === 0 ? 12 : 4));
      ctx.stroke();

      ctx.fillText(`${m}m`, rx, rulerY + 22);
    }

    // Current position of the block
    const currentDistance = distance * progress;
    const blockX = marginX + currentDistance * meterStepPx;
    const blockWidth = 60;
    const blockHeight = 60;
    const blockY = floorY - blockHeight;

    // Displacement trajectory line (from start x to current x)
    if (currentDistance > 0) {
      ctx.save();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(marginX + blockWidth / 2, floorY - 5);
      ctx.lineTo(blockX + blockWidth / 2, floorY - 5);
      ctx.stroke();
      ctx.restore();

      // Measurement tag
      const midX = marginX + (currentDistance * meterStepPx) / 2 + blockWidth / 2;
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.roundRect(midX - 35, floorY - 26, 70, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`s = ${currentDistance.toFixed(1)} m`, midX, floorY - 13);
    }

    // Shadow under block
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(blockX + blockWidth / 2, floorY, blockWidth * 0.55, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Box (Balok Kayu)
    const boxGrad = ctx.createLinearGradient(blockX, blockY, blockX + blockWidth, blockY + blockHeight);
    boxGrad.addColorStop(0, '#f59e0b');
    boxGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = boxGrad;
    ctx.beginPath();
    ctx.roundRect(blockX, blockY, blockWidth, blockHeight, 6);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Wooden crate slats texture
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Diagonal braces
    ctx.moveTo(blockX + 4, blockY + 4);
    ctx.lineTo(blockX + blockWidth - 4, blockY + blockHeight - 4);
    ctx.moveTo(blockX + blockWidth - 4, blockY + 4);
    ctx.lineTo(blockX + 4, blockY + blockHeight - 4);
    // Inner border
    ctx.rect(blockX + 4, blockY + 4, blockWidth - 8, blockHeight - 8);
    ctx.stroke();

    // Block text label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BEBAN', blockX + blockWidth / 2, blockY + blockHeight / 2 - 2);
    ctx.font = '9px Poppins, sans-serif';
    ctx.fillText('BALOK', blockX + blockWidth / 2, blockY + blockHeight / 2 + 10);

    // Pusher Character (Stick figure student with helmet/cap pushing the box)
    const pusherX = blockX - 35;
    const pusherY = floorY;

    // Pusher shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.ellipse(pusherX, floorY, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pusher Body & Limbs
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Leaning angle increases with force
    const lean = Math.min(20, (force / 100) * 18);
    const bodyStartX = pusherX;
    const bodyStartY = pusherY - 26;
    const bodyEndX = pusherX + lean;
    const bodyEndY = pusherY - 60;

    // Legs
    ctx.beginPath();
    ctx.moveTo(pusherX - 15, pusherY); // Back foot
    ctx.lineTo(bodyStartX, bodyStartY);
    ctx.lineTo(pusherX + 12, pusherY); // Front foot
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(bodyStartX, bodyStartY);
    ctx.lineTo(bodyEndX, bodyEndY);
    ctx.stroke();

    // Arms pushing against the block
    ctx.beginPath();
    ctx.moveTo(bodyEndX - 2, bodyEndY + 12);
    ctx.lineTo(blockX, blockY + 30);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(bodyEndX + 4, bodyEndY - 12, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Student cap/hair
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(bodyEndX + 4, bodyEndY - 16, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    // Force Vector Arrow (Gaya F)
    if (force > 0) {
      const arrowStartX = blockX + blockWidth;
      const arrowLength = Math.max(30, (force / 100) * 110);
      const arrowEndX = arrowStartX + arrowLength;
      const arrowY = blockY + blockHeight / 2;

      // Glow effect
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;

      // Arrow line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(arrowStartX, arrowY);
      ctx.lineTo(arrowEndX, arrowY);
      ctx.stroke();

      // Arrow head
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(arrowEndX + 10, arrowY);
      ctx.lineTo(arrowEndX - 6, arrowY - 8);
      ctx.lineTo(arrowEndX - 6, arrowY + 8);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0; // Reset shadow

      // Force Label Tag
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(arrowStartX + arrowLength / 2 - 30, arrowY - 28, 60, 20, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`F = ${force} N`, arrowStartX + arrowLength / 2, arrowY - 14);
    } else {
      // Force is zero indicator
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('F = 0 N (Tidak ada dorongan)', blockX + blockWidth / 2, blockY - 12);
    }

  }, [force, distance, progress]);

  // Redraw when states change
  useEffect(() => {
    drawScene();
  }, [drawScene]);

  // Set preset scenarios
  const applyPreset = (fVal: number, dVal: number, tVal: number, name: string) => {
    sound.playClick();
    setForce(fVal);
    setDistance(dVal);
    setTime(tVal);
    setProgress(0);
    setIsPlaying(false);
    onNotifySuccess?.(`Mode ${name} dimuat! Klik "Jalankan Simulasi".`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Description & Concept Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 rounded-2xl p-4 sm:p-5 border border-blue-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
              Materi 1
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Konsep Usaha (W) & Daya (P)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            <strong>Usaha</strong> terjadi saat gaya <span className="font-mono text-blue-700">(F)</span> menyebabkan benda berpindah sejauh <span className="font-mono text-blue-700">(s)</span>. 
            <strong> Daya</strong> adalah seberapa cepat usaha tersebut diselesaikan dalam satuan waktu <span className="font-mono text-blue-700">(t)</span>.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center flex-wrap gap-1.5 self-stretch md:self-auto">
          <span className="text-xs font-semibold text-slate-500 mr-1 hidden lg:inline">Skenario Contoh:</span>
          <button
            onClick={() => applyPreset(60, 5, 2, "Dorong Cepat")}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 transition-colors shadow-xs"
          >
            🏃 Dorong Cepat
          </button>
          <button
            onClick={() => applyPreset(30, 8, 8, "Dorong Santai")}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 transition-colors shadow-xs"
          >
            🚶 Dorong Santai
          </button>
          <button
            onClick={() => applyPreset(100, 0, 5, "Mendorong Tembok (W=0)")}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs"
            title="Miskonsepsi SMP: s=0 menghasilkan Usaha = 0!"
          >
            🧱 Tembok (W = 0 J)
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport (Canvas + Live Overlay) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Canvas Area */}
        <div className="relative w-full aspect-[16/8] min-h-[260px] max-h-[380px] bg-slate-100">
          <canvas
            ref={canvasRef}
            width={900}
            height={380}
            className="w-full h-full block"
          />

          {/* Floating Badges on Canvas */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Lantai Lab Fisika
            </span>
            {distance === 0 && (
              <span className="bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md animate-bounce shadow-sm">
                ⚠️ Benda Diam (s = 0m) ➔ Usaha = 0 Joule!
              </span>
            )}
          </div>

          {/* Animation Controls overlay (Bottom Left) */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md">
            {!isPlaying ? (
              <button
                onClick={startSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Jalankan</span>
              </button>
            ) : (
              <button
                onClick={pauseSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all shadow-sm"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Jeda</span>
              </button>
            )}

            <button
              onClick={resetSimulation}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Kembali ke awal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1"></div>

            <button
              onClick={() => setPlaybackSpeed(s => (s === 1 ? 0.5 : 1))}
              className={`text-[11px] font-bold px-2 py-1 rounded-md transition-colors ${
                playbackSpeed === 0.5 ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Kecepatan Gerak"
            >
              {playbackSpeed}x
            </button>
          </div>

          {/* Live Progress Bar on top of floor */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200">
            <div
              className="h-full bg-blue-600 transition-all duration-75"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Real-time Math Cards Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${calcMode === 'both' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 p-4 sm:p-6 bg-slate-50/70 border-t border-slate-200 transition-all`}>
          
          {/* Card 1: Gaya F */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Gaya Dorong (F)</span>
              <MoveRight className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{force}</span>
              <span className="text-xs font-bold text-red-600">Newton (N)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Kekuatan dorongan yang diberikan</p>
          </div>

          {/* Card 2: Perpindahan s */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Perpindahan (s)</span>
              <span className="font-mono text-xs font-bold text-blue-600">Jarak</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{distance}</span>
              <span className="text-xs font-bold text-blue-600">meter (m)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Perubahan posisi balok beban</p>
          </div>

          {/* Card 3: Usaha (W = F × s) - Hidden in power-only mode */}
          {calcMode !== 'power-only' && (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-xl text-white shadow-md shadow-blue-500/10 animate-in fade-in">
              <div className="flex items-center justify-between text-blue-200 text-xs font-medium">
                <span className="font-semibold">Usaha (W = F × s)</span>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">{work}</span>
                <span className="text-xs font-bold text-amber-300">Joule (J)</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-blue-100 bg-blue-800/40 px-2 py-0.5 rounded inline-block">
                W = {force} N × {distance} m
              </div>
            </div>
          )}

          {/* Card 4: Daya (P = W / t) - Hidden in work-only mode */}
          {calcMode !== 'work-only' && (
            <div className="bg-gradient-to-br from-cyan-600 to-teal-700 p-4 rounded-xl text-white shadow-md shadow-cyan-500/10 animate-in fade-in">
              <div className="flex items-center justify-between text-cyan-200 text-xs font-medium">
                <span className="font-semibold">Daya (P = W / t)</span>
                <Gauge className="w-4 h-4 text-cyan-200" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">{power.toFixed(1)}</span>
                <span className="text-xs font-bold text-cyan-200">Watt (W)</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-teal-100 bg-teal-800/40 px-2 py-0.5 rounded inline-block">
                P = {work} J ÷ {time} s
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Sliders & Educational Explanation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sliders Container (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          
          {/* Header Panel & Mode Perhitungan Toggle Group */}
          <div className="space-y-3 pb-3 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>🎛️ Kontrol Parameter Simulasi</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Pilih Mode Perhitungan:
              </span>
            </div>

            {/* Toggle Buttons: Usaha Saja | Daya Saja | Usaha & Daya */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCalcMode('work-only');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  calcMode === 'work-only'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${calcMode === 'work-only' ? 'fill-amber-300 text-amber-300' : 'text-blue-500'}`} />
                <span>Hitung Usaha Saja</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCalcMode('power-only');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  calcMode === 'power-only'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Gauge className={`w-3.5 h-3.5 ${calcMode === 'power-only' ? 'text-cyan-300' : 'text-teal-500'}`} />
                <span>Hitung Daya Saja</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCalcMode('both');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  calcMode === 'both'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${calcMode === 'both' ? 'text-amber-300' : 'text-indigo-500'}`} />
                <span>Hitung Usaha & Daya</span>
              </button>
            </div>
          </div>

          {/* Slider 1: Gaya F */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                Gaya Dorong (F)
              </label>
              <span className="font-mono font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
                {force} Newton
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={force}
              onChange={(e) => handleForceChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0 N (Diam)</span>
              <span>50 N</span>
              <span>100 N (Maksimal)</span>
            </div>
          </div>

          {/* Slider 2: Perpindahan s */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                Perpindahan Balok (s)
              </label>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                {distance} meter
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={distance}
              onChange={(e) => handleDistanceChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0 m</span>
              <span>5 m</span>
              <span>10 m</span>
            </div>
          </div>

          {/* Slider 3: Waktu t (Disembunyikan jika mode 'work-only') */}
          {calcMode !== 'work-only' ? (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-sm">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block"></span>
                  Waktu Tempuh (t)
                </label>
                <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-md border border-cyan-200">
                  {time} detik
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={time}
                onChange={(e) => handleTimeChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-cyan-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>1 detik (Cepat)</span>
                <span>5 detik</span>
                <span>10 detik (Lambat)</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-800 flex items-center gap-2 animate-in fade-in duration-200">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Slider Waktu (t) disembunyikan dalam mode <strong>Hitung Usaha Saja</strong> karena rumus usaha <span className="font-mono font-bold">W = F × s</span> tidak dipengaruhi oleh waktu.</span>
            </div>
          )}

          {/* Kotak Hasil Perhitungan (Output Real-Time) Di Bawah Slider */}
          <div className="pt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  Kotak Hasil Perhitungan:{' '}
                  <span className="text-blue-700 font-extrabold">
                    {calcMode === 'work-only' && 'Usaha Saja (W = F × s)'}
                    {calcMode === 'power-only' && 'Daya Saja (P = (F × s) / t)'}
                    {calcMode === 'both' && 'Usaha & Daya'}
                  </span>
                </span>
              </h4>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                ⚡ Otomatis Terhitung
              </span>
            </div>

            <div className={`grid gap-3.5 ${calcMode === 'both' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Kartu Hasil Usaha (W) - Ditampilkan jika 'work-only' atau 'both' */}
              {calcMode !== 'power-only' && (
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-4 sm:p-5 text-white border border-indigo-500/30 shadow-lg animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                        <Zap className="w-4 h-4 fill-amber-300" />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-indigo-200 font-bold block">
                          Besar Usaha (W)
                        </span>
                        <span className="font-mono text-[11px] text-amber-300 font-semibold">
                          W = F × s
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/20">
                      Joule
                    </span>
                  </div>

                  {/* Angka Utama Usaha */}
                  <div className="mt-3.5 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight font-mono">
                      {work}
                    </span>
                    <span className="text-sm font-bold text-slate-300">
                      Joule (J)
                    </span>
                  </div>

                  {/* Rumus Substitusi Lengkap */}
                  <div className="mt-2.5 pt-2.5 border-t border-indigo-800/60 font-mono text-xs text-indigo-200 flex flex-wrap items-center justify-between gap-1">
                    <span>Substitusi Nilai:</span>
                    <span className="font-bold text-white bg-indigo-900/60 px-2.5 py-0.5 rounded">
                      {force === 0 ? (
                        'F = 0 N ➔ W = 0 Joule'
                      ) : distance === 0 ? (
                        's = 0 m (Diam) ➔ W = 0 Joule'
                      ) : (
                        `${force} N × ${distance} m = ${work} J`
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Kartu Hasil Daya (P) - Ditampilkan jika 'power-only' atau 'both' */}
              {calcMode !== 'work-only' && (
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-cyan-950 rounded-2xl p-4 sm:p-5 text-white border border-teal-500/30 shadow-lg animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-400/20 text-cyan-300 flex items-center justify-center font-bold">
                        <Gauge className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-teal-200 font-bold block">
                          Besar Daya (P)
                        </span>
                        <span className="font-mono text-[11px] text-cyan-300 font-semibold">
                          {calcMode === 'power-only' ? 'P = (F × s) / t' : 'P = W / t'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/30 text-teal-200 border border-teal-400/20">
                      Watt
                    </span>
                  </div>

                  {/* Angka Utama Daya */}
                  <div className="mt-3.5 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-cyan-300 tracking-tight font-mono">
                      {power.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-slate-300">
                      Watt (W)
                    </span>
                  </div>

                  {/* Rumus Substitusi Lengkap */}
                  <div className="mt-2.5 pt-2.5 border-t border-teal-800/60 font-mono text-xs text-teal-200 flex flex-wrap items-center justify-between gap-1">
                    <span>Substitusi Nilai:</span>
                    <span className="font-bold text-white bg-teal-900/60 px-2.5 py-0.5 rounded">
                      {isZeroWork ? (
                        `(${force} N × ${distance} m) / ${time} s = 0 Watt`
                      ) : calcMode === 'power-only' ? (
                        `(${force} N × ${distance} m) / ${time} s = ${power.toFixed(1)} W`
                      ) : (
                        `${work} J ÷ ${time} s = ${power.toFixed(1)} W`
                      )}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Insight & Misconception Buster Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Tahukah Kamu? (Konsep IPA SMP)</span>
            </div>
            
            <div className="mt-3 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                💡 <strong>Syarat Terjadinya Usaha:</strong>
                <br />
                Dalam fisika, usaha hanya bernilai jika benda <em>berpindah</em> searah dengan gaya dorong. Jika kamu mendorong tembok sekuat tenaga tapi tembok tidak bergerak (<span className="font-mono">s = 0</span>), usahamu adalah <strong>0 Joule</strong>!
              </p>
              
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <strong className="block font-semibold mb-1">⚡ Hubungan Daya & Waktu:</strong>
                Semakin singkat waktu (<span className="font-mono">t</span>) untuk melakukan usaha yang sama, maka semakin <strong>besar Daya</strong> yang dikeluarkan.
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Satuan Usaha: <strong>Joule (J)</strong></span>
            <span>Satuan Daya: <strong>Watt (W)</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
