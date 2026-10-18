import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Activity, ArrowDown, Gauge, Flame, Sparkles, CheckCircle2, Zap, Info } from 'lucide-react';
import { sound } from '../utils/audio';

interface EnergyTabProps {
  onNotifySuccess?: (msg: string) => void;
  onStateUpdate?: (data: {
    mass: number;
    initialHeight: number;
    initialVelocity: number;
    currentHeight: number;
    currentVelocity: number;
    ep: number;
    ek: number;
    em: number;
  }) => void;
}

export const EnergyTab: React.FC<EnergyTabProps> = ({ onNotifySuccess, onStateUpdate }) => {
  // Constant gravity for SMP Kelas 8
  const g = 10; // m/s^2

  // Mode Perhitungan: 'em-total' (Energi Mekanik), 'ep-only' (Ep Saja), 'ek-only' (Ek Saja)
  const [energyMode, setEnergyMode] = useState<'em-total' | 'ep-only' | 'ek-only'>('em-total');

  // Sliders
  const [mass, setMass] = useState<number>(2); // 1 - 10 kg
  const [initialHeight, setInitialHeight] = useState<number>(6); // 1 - 10 m
  const [initialVelocity, setInitialVelocity] = useState<number>(0); // 0 - 10 m/s

  // Track Type: 'curved' (seluncuran) or 'freefall' (jatuh bebas)
  const [trackType, setTrackType] = useState<'curved' | 'freefall'>('curved');

  // Dynamic state during animation
  const [currentHeight, setCurrentHeight] = useState<number>(6);
  const [currentVelocity, setCurrentVelocity] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);

  // Simulation time tracker
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simProgressRef = useRef<number>(0); // 0 (top) to 1 (bottom)
  const lastTimeRef = useRef<number | null>(null);

  // Computed Mechanical Energy (Total energy remains constant throughout ideal motion)
  // At start: Em_initial = m*g*h0 + 0.5*m*v0^2
  const initialEp = mass * g * initialHeight;
  const initialEk = 0.5 * mass * (initialVelocity * initialVelocity);
  const totalEm = initialEp + initialEk;

  // Real-time calculated Ep, Ek, Em based on currentHeight
  const currentEp = mass * g * Math.max(0, currentHeight);
  // By conservation of energy: Ek = Em - Ep
  const currentEk = Math.max(0, totalEm - currentEp);
  // Velocity derived: v = sqrt(2 * Ek / m)
  const calculatedVelocity = Math.sqrt((2 * currentEk) / mass);

  const onStateUpdateRef = useRef(onStateUpdate);

  useEffect(() => {
    onStateUpdateRef.current = onStateUpdate;
  }, [onStateUpdate]);

  // Sync state update with parent safely
  useEffect(() => {
    onStateUpdateRef.current?.({
      mass,
      initialHeight,
      initialVelocity,
      currentHeight,
      currentVelocity: calculatedVelocity,
      ep: currentEp,
      ek: currentEk,
      em: totalEm
    });
  }, [mass, initialHeight, initialVelocity, currentHeight, calculatedVelocity, currentEp, currentEk, totalEm]);

  // When initial sliders change while stopped, reset ball to top
  const handleMassChange = (val: number) => {
    setMass(val);
    sound.playSlide();
  };

  const handleHeightChange = (val: number) => {
    setInitialHeight(val);
    if (!isPlaying) {
      setCurrentHeight(val);
      setCurrentVelocity(initialVelocity);
      simProgressRef.current = 0;
    }
    sound.playSlide();
  };

  const handleVelocityChange = (val: number) => {
    setInitialVelocity(val);
    if (!isPlaying) {
      setCurrentVelocity(val);
    }
    sound.playSlide();
  };

  const handleModeChange = (mode: 'em-total' | 'ep-only' | 'ek-only') => {
    sound.playClick();
    setEnergyMode(mode);
    setIsPlaying(false);
    simProgressRef.current = 0;
    if (mode === 'ep-only') {
      setInitialVelocity(0);
      setCurrentVelocity(0);
      setCurrentHeight(initialHeight > 0 ? initialHeight : 6);
    } else if (mode === 'ek-only') {
      setCurrentHeight(0);
      const vel = initialVelocity > 0 ? initialVelocity : 6;
      setInitialVelocity(vel);
      setCurrentVelocity(vel);
    } else {
      const h = initialHeight > 0 ? initialHeight : 6;
      setInitialHeight(h);
      setCurrentHeight(h);
      setCurrentVelocity(initialVelocity);
    }
  };

  // Start dropping the ball
  const handleStart = () => {
    sound.playWhoosh();
    if (currentHeight <= 0.05) {
      // If already at bottom, restart from top
      simProgressRef.current = 0;
      setCurrentHeight(initialHeight);
    }
    setIsPlaying(true);
    lastTimeRef.current = performance.now();
  };

  const handlePause = () => {
    sound.playClick();
    setIsPlaying(false);
  };

  const handleReset = () => {
    sound.playClick();
    setIsPlaying(false);
    simProgressRef.current = 0;
    setCurrentHeight(initialHeight);
    setCurrentVelocity(initialVelocity);
  };

  // Physics animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    // Physical free fall duration: t = sqrt(2*h / g) with speed scaling
    const baseDuration = Math.max(1.2, Math.sqrt((2 * initialHeight) / g) * 1.8);
    const durationSeconds = isSlowMo ? baseDuration * 2 : baseDuration;
    const durationMs = durationSeconds * 1000;

    const animate = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Increment progress smoothly
      simProgressRef.current = Math.min(1, simProgressRef.current + delta / durationMs);
      const p = simProgressRef.current;

      // In gravity acceleration, displacement ~ p^2 (smooth physics acceleration)
      const heightDropRatio = Math.min(1, p * p);
      const newHeight = Math.max(0, initialHeight * (1 - heightDropRatio));

      setCurrentHeight(newHeight);
      const instantEk = Math.max(0, totalEm - (mass * g * newHeight));
      const instantVel = Math.sqrt((2 * instantEk) / mass);
      setCurrentVelocity(instantVel);

      if (p >= 1) {
        setIsPlaying(false);
        sound.playSuccess();
        onNotifySuccess?.(`Bola mendarat! Seluruh Ep telah berubah menjadi Ek sebesar ${totalEm.toFixed(0)} Joule! Kecepatan = ${instantVel.toFixed(1)} m/s.`);
      } else {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, initialHeight, isSlowMo, totalEm, mass, onNotifySuccess]);

  // Canvas Drawing
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Sky / Studio gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#f1f5f9');
    skyGrad.addColorStop(0.8, '#e2e8f0');
    skyGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Ground line at bottom
    const groundY = height - 40;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, groundY, width, 40);

    // Ground grass/accent
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, groundY - 4, width, 4);

    // Height Grid / Ruler (0 to 10 m on the left)
    const rulerX = 50;
    const usableHeight = groundY - 60; // 0m to 10m range
    const pxPerMeter = usableHeight / 10;

    // Draw vertical height ruler
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rulerX, groundY);
    ctx.lineTo(rulerX, groundY - usableHeight);
    ctx.stroke();

    ctx.font = '10px Poppins, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'right';

    for (let m = 0; m <= 10; m += 2) {
      const yPos = groundY - m * pxPerMeter;
      ctx.beginPath();
      ctx.moveTo(rulerX - 6, yPos);
      ctx.lineTo(rulerX + 6, yPos);
      ctx.stroke();
      ctx.fillText(`${m}m`, rulerX - 10, yPos + 3);

      // Faint horizontal guide line
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.beginPath();
      ctx.moveTo(rulerX + 6, yPos);
      ctx.lineTo(width - 40, yPos);
      ctx.stroke();
      ctx.restore();
    }

    // Coordinates for the track
    let ballX = 0;
    let ballY = 0;

    if (trackType === 'curved') {
      // Draw smooth coaster ramp / slide
      const startX = 120;
      const endX = width - 80;
      const initialBallY = groundY - initialHeight * pxPerMeter;

      // Draw curved slide structure
      ctx.beginPath();
      ctx.moveTo(startX, initialBallY);
      // Bezier curve from start height smoothly flattening at ground level
      ctx.bezierCurveTo(
        startX + (endX - startX) * 0.4,
        groundY,
        startX + (endX - startX) * 0.7,
        groundY,
        endX,
        groundY
      );
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Slide metallic rails inner line
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Slide Support Pilars
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, initialBallY);
      ctx.lineTo(startX, groundY);
      ctx.stroke();

      // Ball position along curve based on current height
      const tProgress = 1 - currentHeight / (initialHeight || 1);
      // Parametric bezier approx
      const u = 1 - tProgress;
      const tt = tProgress * tProgress;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * tProgress;

      const p0x = startX;
      const p0y = initialBallY;
      const p1x = startX + (endX - startX) * 0.4;
      const p1y = groundY;
      const p2x = startX + (endX - startX) * 0.7;
      const p2y = groundY;
      const p3x = endX;
      const p3y = groundY;

      ballX = uuu * p0x + 3 * uu * tProgress * p1x + 3 * u * tt * p2x + ttt * p3x;
      ballY = groundY - currentHeight * pxPerMeter;

    } else {
      // Free Fall: Vertical drop tower
      const towerX = width / 2 - 40;
      ballX = towerX;
      ballY = groundY - currentHeight * pxPerMeter;

      // Draw Tower structure
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.fillRect(towerX - 25, groundY - usableHeight, 50, usableHeight);
      ctx.strokeRect(towerX - 25, groundY - usableHeight, 50, usableHeight);

      // Tower cross trusses
      ctx.beginPath();
      for (let y = groundY - usableHeight; y < groundY; y += 30) {
        ctx.moveTo(towerX - 25, y);
        ctx.lineTo(towerX + 25, y + 30);
        ctx.moveTo(towerX + 25, y);
        ctx.lineTo(towerX - 25, y + 30);
      }
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Ball sizing based on mass (radius 12 to 24 px)
    const ballRadius = 12 + (mass / 10) * 12;

    // Ball motion trail particles if moving fast
    if (calculatedVelocity > 2 && isPlaying) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.beginPath();
      ctx.arc(ballX - calculatedVelocity * 1.5, ballY - 4, ballRadius * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw the Ball with glowing 3D gradient
    const ballGrad = ctx.createRadialGradient(
      ballX - ballRadius * 0.3,
      ballY - ballRadius * 0.3,
      ballRadius * 0.1,
      ballX,
      ballY,
      ballRadius
    );
    ballGrad.addColorStop(0, '#f87171');
    ballGrad.addColorStop(0.6, '#ef4444');
    ballGrad.addColorStop(1, '#991b1b');

    ctx.save();
    ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Mass text on ball
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${mass}kg`, ballX, ballY + 3.5);

    // Height indicator horizontal dashed line to ruler
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rulerX, ballY);
    ctx.lineTo(ballX - ballRadius, ballY);
    ctx.stroke();
    ctx.restore();

    // Height tag next to ball
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(ballX + ballRadius + 8, ballY - 12, 65, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`h = ${currentHeight.toFixed(1)}m`, ballX + ballRadius + 40, ballY + 3);

    // Velocity arrow vector when moving
    if (calculatedVelocity > 0.5) {
      const arrowLength = Math.min(60, calculatedVelocity * 5);
      const angle = trackType === 'curved' && currentHeight > 0.5 ? Math.PI / 4 : Math.PI / 2;
      const vEndX = ballX + Math.cos(angle) * arrowLength;
      const vEndY = ballY + Math.sin(angle) * arrowLength;

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(ballX, ballY);
      ctx.lineTo(vEndX, vEndY);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(vEndX, vEndY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [trackType, initialHeight, currentHeight, mass, calculatedVelocity, isPlaying]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Compute percentages for the live bar chart
  const epPercent = totalEm > 0 ? (currentEp / totalEm) * 100 : 0;
  const ekPercent = totalEm > 0 ? (currentEk / totalEm) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* Concept Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
              Materi 2
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Energi Potensial, Kinetik, & Kekekalan Energi Mekanik
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Saat bola meluncur turun, <strong>Energi Potensial (Ep)</strong> berkurang dan berubah menjadi <strong>Energi Kinetik (Ek)</strong>.
            Jumlah total <strong>Energi Mekanik (Em = Ep + Ek)</strong> bernilai tetap (konstan)!
          </p>
        </div>

        {/* Track Type Toggle */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-emerald-200 shadow-2xs self-stretch md:self-auto">
          <button
            onClick={() => {
              sound.playClick();
              setTrackType('curved');
              handleReset();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              trackType === 'curved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎢 Seluncuran Melengkung
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setTrackType('freefall');
              handleReset();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              trackType === 'freefall'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗼 Jatuh Bebas Tegak
          </button>
        </div>
      </div>

      {/* Main Simulation Section: Canvas & Live Energy Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Canvas Visualizer (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="relative w-full aspect-[16/9] min-h-[300px] max-h-[420px] bg-slate-100">
            <canvas
              ref={canvasRef}
              width={850}
              height={420}
              className="w-full h-full block"
            />

            {/* Floating Telemetry Badge */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
              <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                Gravitasi bumi g = 10 m/s²
              </span>
              <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm border border-slate-200">
                Kecepatan saat ini: <span className="text-cyan-700 font-mono">{calculatedVelocity.toFixed(1)} m/s</span>
              </span>
            </div>

            {/* Animation Action Controls */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-md">
              {!isPlaying ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Jatuhkan Bola</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all shadow-sm"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Jeda</span>
                </button>
              )}

              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Reset ke titik awal"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-300 mx-1"></div>

              <button
                onClick={() => {
                  sound.playClick();
                  setIsSlowMo(!isSlowMo);
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                  isSlowMo ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Gerak Lambat untuk Mengamati Transformasi Energi"
              >
                🐢 {isSlowMo ? 'Slow-Mo Aktif' : 'Normal'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Energy Conservation Bar Chart & Live Metrics (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>
                  {energyMode === 'ep-only' && 'Grafik Energi Potensial (Ep)'}
                  {energyMode === 'ek-only' && 'Grafik Energi Kinetik (Ek)'}
                  {energyMode === 'em-total' && 'Grafik Batang Energi Real-time'}
                </span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {energyMode === 'em-total' ? 'Em Konstan' : energyMode === 'ep-only' ? 'Ep = mgh' : 'Ek = ½mv²'}
              </span>
            </div>

            {/* Live Stacked Bar Demonstration */}
            <div className="mt-4 space-y-3">
              {energyMode !== 'ek-only' && (
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Energi Potensial (Ep)
                    </span>
                    <span className="font-mono font-bold text-amber-600">
                      {currentEp.toFixed(0)} J ({energyMode === 'ep-only' ? '100%' : `${epPercent.toFixed(0)}%`})
                    </span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-75"
                      style={{ width: `${energyMode === 'ep-only' ? 100 : Math.max(2, epPercent)}%` }}
                    />
                  </div>
                </div>
              )}

              {energyMode !== 'ep-only' && (
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                      Energi Kinetik (Ek)
                    </span>
                    <span className="font-mono font-bold text-cyan-600">
                      {currentEk.toFixed(0)} J ({energyMode === 'ek-only' ? '100%' : `${ekPercent.toFixed(0)}%`})
                    </span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-75"
                      style={{ width: `${energyMode === 'ek-only' ? 100 : Math.max(2, ekPercent)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Total Mechanical Energy (The constant bar) - Only in em-total */}
              {energyMode === 'em-total' && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      Energi Mekanik (Em = Ep + Ek)
                    </span>
                    <span className="font-mono text-emerald-700">
                      {totalEm.toFixed(0)} Joule
                    </span>
                  </div>
                  <div className="h-5 bg-slate-100 rounded-full overflow-hidden p-0.5 flex">
                    <div
                      className="h-full bg-amber-500 transition-all duration-75"
                      style={{ width: `${epPercent}%` }}
                      title={`Ep: ${currentEp.toFixed(0)} J`}
                    />
                    <div
                      className="h-full bg-cyan-500 transition-all duration-75"
                      style={{ width: `${ekPercent}%` }}
                      title={`Ek: ${currentEk.toFixed(0)} J`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                    <span>🟡 Ep: {epPercent.toFixed(0)}%</span>
                    <span className="text-emerald-700 font-bold">Total Em: 100% Selalu Sama</span>
                    <span>🔵 Ek: {ekPercent.toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Mathematical Breakdown Card */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {energyMode === 'em-total' ? 'Bukti Kekekalan Energi:' : 'Perhitungan Rumus Real-Time:'}
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px] text-slate-600">
              {energyMode !== 'ek-only' && (
                <div className="flex justify-between">
                  <span>Ep = m × g × h:</span>
                  <span className="text-amber-700 font-semibold">{mass} × 10 × {currentHeight.toFixed(1)} = {currentEp.toFixed(0)} J</span>
                </div>
              )}
              {energyMode !== 'ep-only' && (
                <div className="flex justify-between">
                  <span>Ek = ½ × m × v²:</span>
                  <span className="text-cyan-700 font-semibold">½ × {mass} × {calculatedVelocity.toFixed(1)}² = {currentEk.toFixed(0)} J</span>
                </div>
              )}
              {energyMode === 'em-total' && (
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-emerald-800">
                  <span>Em = Ep + Ek:</span>
                  <span>{currentEp.toFixed(0)} + {currentEk.toFixed(0)} = {totalEm.toFixed(0)} J</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sliders Container with Mode Perhitungan & Real-Time Output Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        
        {/* Header Panel & Mode Perhitungan Toggle Group */}
        <div className="space-y-3 pb-3 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>🎛️ Kontrol Parameter Energi</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Pilih Mode Perhitungan:
            </span>
          </div>

          {/* Toggle Buttons: Ep Saja | Ek Saja | Energi Mekanik */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleModeChange('ep-only')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                energyMode === 'ep-only'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${energyMode === 'ep-only' ? 'fill-amber-300 text-amber-300' : 'text-amber-500'}`} />
              <span>Hitung Ep Saja</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('ek-only')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                energyMode === 'ek-only'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Gauge className={`w-3.5 h-3.5 ${energyMode === 'ek-only' ? 'text-cyan-300' : 'text-cyan-600'}`} />
              <span>Hitung Ek Saja</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('em-total')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                energyMode === 'em-total'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${energyMode === 'em-total' ? 'text-emerald-200' : 'text-emerald-600'}`} />
              <span>Hitung Energi Mekanik</span>
            </button>
          </div>
        </div>

        {/* Sliders Grid (Responsive to mode) */}
        <div className={`grid gap-6 ${energyMode === 'em-total' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          
          {/* Slider 1: Massa (m) - Always Visible */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                Massa Benda (m)
              </label>
              <span className="font-mono font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
                {mass} kg
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={mass}
              onChange={(e) => handleMassChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>1 kg</span>
              <span>5 kg</span>
              <span>10 kg</span>
            </div>
          </div>

          {/* Slider 2: Ketinggian Awal (h) - Hidden in 'ek-only' */}
          {energyMode !== 'ek-only' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-sm">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  Ketinggian Awal (h)
                </label>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  {initialHeight} meter
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={initialHeight}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>1 m (Rendah)</span>
                <span>5 m</span>
                <span>10 m (Puncak)</span>
              </div>
            </div>
          )}

          {/* Slider 3: Kecepatan Awal (v0) - Hidden in 'ep-only' */}
          {energyMode !== 'ep-only' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-sm">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block"></span>
                  Kecepatan Awal (v₀)
                </label>
                <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-md border border-cyan-200">
                  {initialVelocity} m/s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={initialVelocity}
                onChange={(e) => handleVelocityChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-cyan-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 m/s (Diam dilepas)</span>
                <span>5 m/s</span>
                <span>10 m/s (Didorong)</span>
              </div>
            </div>
          )}
        </div>

        {/* Informative helper banner when a slider is hidden */}
        {energyMode === 'ep-only' && (
          <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-900 flex items-center gap-2 animate-in fade-in duration-200">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Slider Kecepatan (v) disembunyikan dalam mode <strong>Hitung Ep Saja</strong> karena energi potensial gravitasi dihitung saat benda berada pada ketinggian tertentu sebelum meluncur.</span>
          </div>
        )}

        {energyMode === 'ek-only' && (
          <div className="p-3 bg-cyan-50/80 border border-cyan-200/70 rounded-xl text-xs text-cyan-900 flex items-center gap-2 animate-in fade-in duration-200">
            <Info className="w-4 h-4 text-cyan-600 shrink-0" />
            <span>Slider Ketinggian (h) disembunyikan dalam mode <strong>Hitung Ek Saja</strong> karena energi kinetik murni berasal dari massa dan kecepatan gerak benda tanpa dipengaruhi ketinggian.</span>
          </div>
        )}

        {/* Kotak Hasil Perhitungan (Output Real-Time) Di Bawah Slider */}
        <div className="pt-4 border-t-2 border-dashed border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                Kotak Hasil Perhitungan Real-Time:{' '}
                <span className="text-emerald-700 font-extrabold">
                  {energyMode === 'ep-only' && 'Energi Potensial Saja (Ep = m × g × h)'}
                  {energyMode === 'ek-only' && 'Energi Kinetik Saja (Ek = ½ × m × v²)'}
                  {energyMode === 'em-total' && 'Energi Mekanik Total (Em = Ep + Ek)'}
                </span>
              </span>
            </h4>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ⚡ Otomatis Terhitung
            </span>
          </div>

          <div className={`grid gap-3.5 ${energyMode === 'em-total' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
            
            {/* Kartu Ep (Ditampilkan jika 'ep-only' atau 'em-total') */}
            {energyMode !== 'ek-only' && (
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-amber-950 to-orange-950 rounded-2xl p-4 sm:p-5 text-white border border-amber-500/30 shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                      <Zap className="w-4 h-4 fill-amber-300" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-amber-200 font-bold block">
                        Energi Potensial (Ep)
                      </span>
                      <span className="font-mono text-[11px] text-amber-300 font-semibold">
                        Ep = m × g × h
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400/20">
                    Joule
                  </span>
                </div>

                {/* Angka Utama */}
                <div className="mt-3.5 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight font-mono">
                    {initialEp.toFixed(0)}
                  </span>
                  <span className="text-sm font-bold text-slate-300">
                    Joule (J)
                  </span>
                </div>

                {/* Substitusi Nilai Lengkap */}
                <div className="mt-2.5 pt-2.5 border-t border-amber-800/60 font-mono text-xs text-amber-200 flex flex-wrap items-center justify-between gap-1">
                  <span>Substitusi Nilai:</span>
                  <span className="font-bold text-white bg-amber-900/60 px-2.5 py-0.5 rounded">
                    {mass} kg × 10 m/s² × {initialHeight} m = {initialEp.toFixed(0)} J
                  </span>
                </div>
              </div>
            )}

            {/* Kartu Ek (Ditampilkan jika 'ek-only' atau 'em-total') */}
            {energyMode !== 'ep-only' && (
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950 to-teal-950 rounded-2xl p-4 sm:p-5 text-white border border-cyan-500/30 shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-400/20 text-cyan-300 flex items-center justify-center font-bold">
                      <Gauge className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-cyan-200 font-bold block">
                        Energi Kinetik (Ek)
                      </span>
                      <span className="font-mono text-[11px] text-cyan-300 font-semibold">
                        Ek = ½ × m × v²
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/30 text-cyan-200 border border-cyan-400/20">
                    Joule
                  </span>
                </div>

                {/* Angka Utama */}
                <div className="mt-3.5 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-cyan-300 tracking-tight font-mono">
                    {initialEk.toFixed(0)}
                  </span>
                  <span className="text-sm font-bold text-slate-300">
                    Joule (J)
                  </span>
                </div>

                {/* Substitusi Nilai Lengkap */}
                <div className="mt-2.5 pt-2.5 border-t border-cyan-800/60 font-mono text-xs text-cyan-200 flex flex-wrap items-center justify-between gap-1">
                  <span>Substitusi Nilai:</span>
                  <span className="font-bold text-white bg-cyan-900/60 px-2.5 py-0.5 rounded">
                    ½ × {mass} kg × ({initialVelocity} m/s)² = {initialEk.toFixed(0)} J
                  </span>
                </div>
              </div>
            )}

            {/* Kartu Em (Hanya ditampilkan jika 'em-total') */}
            {energyMode === 'em-total' && (
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 rounded-2xl p-4 sm:p-5 text-white border border-emerald-500/30 shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-emerald-200 font-bold block">
                        Energi Mekanik (Em)
                      </span>
                      <span className="font-mono text-[11px] text-emerald-300 font-semibold">
                        Em = Ep + Ek
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/20">
                    Konstan
                  </span>
                </div>

                {/* Angka Utama */}
                <div className="mt-3.5 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-300 tracking-tight font-mono">
                    {totalEm.toFixed(0)}
                  </span>
                  <span className="text-sm font-bold text-slate-300">
                    Joule (J)
                  </span>
                </div>

                {/* Substitusi Nilai Lengkap */}
                <div className="mt-2.5 pt-2.5 border-t border-emerald-800/60 font-mono text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-1">
                  <span>Penjumlahan:</span>
                  <span className="font-bold text-white bg-emerald-900/60 px-2.5 py-0.5 rounded">
                    {initialEp.toFixed(0)} J + {initialEk.toFixed(0)} J = {totalEm.toFixed(0)} J
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
