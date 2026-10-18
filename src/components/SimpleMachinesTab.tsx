import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MachineSubtype } from '../types/physics';
import { 
  Maximize2, 
  Layers, 
  RotateCw, 
  Scale, 
  ArrowRight, 
  Check, 
  Play, 
  RotateCcw, 
  Info,
  ShieldCheck,
  Zap,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { sound } from '../utils/audio';

interface SimpleMachinesTabProps {
  onNotifySuccess?: (msg: string) => void;
  onStateUpdate?: (data: any) => void;
}

export const SimpleMachinesTab: React.FC<SimpleMachinesTabProps> = ({ onNotifySuccess, onStateUpdate }) => {
  // Selected sub-machine: 'inclined-plane' | 'pulley' | 'lever' | 'wheel-axle'
  const [subMachine, setSubMachine] = useState<MachineSubtype>('inclined-plane');

  // Shared Animation Play State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [animProgress, setAnimProgress] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // -------------------------------------------------------------
  // 1. BIDANG MIRING STATE
  // -------------------------------------------------------------
  const [rampLoad, setRampLoad] = useState<number>(600); // Newton (w)
  const [rampHeight, setRampHeight] = useState<number>(2); // meter (h)
  const [rampLength, setRampLength] = useState<number>(6); // meter (s)
  
  // Formulas for Inclined Plane:
  // KM = s / h
  // F = (w * h) / s = w / KM
  const rampKM = rampHeight > 0 ? rampLength / rampHeight : 1;
  const rampEffortForce = rampLength > 0 ? (rampLoad * rampHeight) / rampLength : rampLoad;

  // -------------------------------------------------------------
  // 2. KATROL STATE
  // -------------------------------------------------------------
  // Type: 'fixed' (Tetap, KM=1), 'movable' (Bebas, KM=2), 'compound' (Majemuk 4 tali, KM=4)
  const [pulleyType, setPulleyType] = useState<'fixed' | 'movable' | 'compound'>('fixed');
  const [pulleyLoad, setPulleyLoad] = useState<number>(400); // Newton (w)

  const pulleyKM = pulleyType === 'fixed' ? 1 : pulleyType === 'movable' ? 2 : 4;
  const pulleyEffortForce = pulleyLoad / pulleyKM;

  // -------------------------------------------------------------
  // 3. PENGUNGKIT / TUAS STATE
  // -------------------------------------------------------------
  // Fulcrum position from left of 10-meter plank (meter 1 to 9)
  const [fulcrumPos, setFulcrumPos] = useState<number>(3); // 3m from left
  const plankLength = 10; // Total 10m
  const [leverLoad, setLeverLoad] = useState<number>(300); // Newton at load side
  const [leverClass, setLeverClass] = useState<'type1' | 'type2' | 'type3'>('type1');

  // For Type 1: Fulcrum in middle.
  // Left arm = load arm lb = fulcrumPos
  // Right arm = effort arm lk = plankLength - fulcrumPos
  const leverLb = leverClass === 'type1' ? fulcrumPos : leverClass === 'type2' ? fulcrumPos : 7;
  const leverLk = leverClass === 'type1' ? plankLength - fulcrumPos : leverClass === 'type2' ? plankLength : fulcrumPos;
  const leverKM = leverLb > 0 ? leverLk / leverLb : 1;
  const leverEffortForce = leverLk > 0 ? (leverLoad * leverLb) / leverLk : leverLoad;

  // -------------------------------------------------------------
  // 4. RODA & POROS STATE
  // -------------------------------------------------------------
  const [wheelMode, setWheelMode] = useState<'axle' | 'friction'>('axle');
  // Axle parameters
  const [wheelRadius, setWheelRadius] = useState<number>(50); // cm (R)
  const [axleRadius, setAxleRadius] = useState<number>(10); // cm (r)
  const [wheelLoad, setWheelLoad] = useState<number>(500); // N (w)

  const wheelKM = axleRadius > 0 ? wheelRadius / axleRadius : 1;
  const wheelEffortForce = (wheelLoad * axleRadius) / wheelRadius;

  // Friction comparison parameters
  const [boxWeight, setBoxWeight] = useState<number>(400); // N
  const frictionWithoutWheel = boxWeight * 0.55; // Sliding friction (mu = 0.55) -> 220 N
  const frictionWithWheel = boxWeight * 0.05; // Rolling friction (mu = 0.05) -> 20 N

  const onStateUpdateRef = useRef(onStateUpdate);

  useEffect(() => {
    onStateUpdateRef.current = onStateUpdate;
  }, [onStateUpdate]);

  // Notify parent of updates safely
  useEffect(() => {
    onStateUpdateRef.current?.({
      subMachine,
      ramp: { load: rampLoad, height: rampHeight, length: rampLength, km: rampKM, force: rampEffortForce },
      pulley: { type: pulleyType, load: pulleyLoad, km: pulleyKM, force: pulleyEffortForce },
      lever: { fulcrum: fulcrumPos, lb: leverLb, lk: leverLk, km: leverKM, force: leverEffortForce },
      wheel: { R: wheelRadius, r: axleRadius, km: wheelKM, force: wheelEffortForce }
    });
  }, [subMachine, rampLoad, rampHeight, rampLength, rampKM, rampEffortForce, pulleyType, pulleyLoad, pulleyKM, pulleyEffortForce, fulcrumPos, leverLb, leverLk, leverKM, leverEffortForce, wheelRadius, axleRadius, wheelKM, wheelEffortForce]);

  // Handle Sub-Machine Change
  const selectSubMachine = (machine: MachineSubtype) => {
    sound.playClick();
    setSubMachine(machine);
    setIsSimulating(false);
    setAnimProgress(0);
  };

  // Run Simulation Action
  const runSim = () => {
    sound.playWhoosh();
    setAnimProgress(0);
    setIsSimulating(true);
  };

  const resetSim = () => {
    sound.playClick();
    setIsSimulating(false);
    setAnimProgress(0);
  };

  // Animation Loop for Sub-machines
  useEffect(() => {
    if (!isSimulating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const duration = 2200; // 2.2 seconds
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      setAnimProgress(progress);

      if (progress >= 1) {
        setIsSimulating(false);
        sound.playSuccess();
        onNotifySuccess?.('Simulasi selesai! Amati bagaimana gaya kuasa berkurang signifikan berkat keuntungan mekanis.');
      } else {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimulating, onNotifySuccess]);

  // -------------------------------------------------------------
  // CANVAS RENDERING
  // -------------------------------------------------------------
  const drawMachineCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Studio Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const groundY = height - 45;
    // Ground line
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, groundY, width, 45);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, groundY - 4, width, 4);

    // SUBMACHINE 1: BIDANG MIRING
    if (subMachine === 'inclined-plane') {
      const originX = 100;
      const rampBaseWidth = 550;
      // Height scaled visually
      const visualHeight = (rampHeight / 5) * 180;
      const rampTopX = originX + rampBaseWidth;
      const rampTopY = groundY - visualHeight;

      // Draw Triangular Wedge
      ctx.beginPath();
      ctx.moveTo(originX, groundY);
      ctx.lineTo(rampTopX, groundY);
      ctx.lineTo(rampTopX, rampTopY);
      ctx.closePath();
      
      const wedgeGrad = ctx.createLinearGradient(originX, groundY, rampTopX, rampTopY);
      wedgeGrad.addColorStop(0, '#e0f2fe');
      wedgeGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = wedgeGrad;
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dimension labels
      // Height (h) on the right
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rampTopX + 25, groundY);
      ctx.lineTo(rampTopX + 25, rampTopY);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Poppins, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Tinggi (h) = ${rampHeight} m`, rampTopX + 35, groundY - visualHeight / 2);

      // Incline Slope length (s)
      const midHypotX = originX + rampBaseWidth / 2 - 25;
      const midHypotY = groundY - visualHeight / 2 - 25;
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 12px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Panjang Lintasan (s) = ${rampLength} m`, midHypotX, midHypotY);

      // Block position along hypotenuse
      const p = animProgress;
      const blockCurrentX = originX + (rampTopX - originX) * p;
      const blockCurrentY = groundY - (groundY - rampTopY) * p;

      const angle = Math.atan2(groundY - rampTopY, rampTopX - originX);

      ctx.save();
      ctx.translate(blockCurrentX, blockCurrentY);
      ctx.rotate(-angle);

      // Draw Block
      const bW = 60;
      const bH = 45;
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-bW / 2, -bH, bW, bH, 5);
      ctx.fill();
      ctx.stroke();

      // Weight label on block
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`w = ${rampLoad}N`, 0, -bH / 2 + 3);

      // Pulling rope & spring scale (dinamometer)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bW / 2, -bH / 2);
      ctx.lineTo(bW / 2 + 70, -bH / 2);
      ctx.stroke();

      // Dinamometer tube
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.fillRect(bW / 2 + 20, -bH / 2 - 8, 45, 16);
      ctx.strokeRect(bW / 2 + 20, -bH / 2 - 8, 45, 16);

      // Reading text
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 9px Poppins, sans-serif';
      ctx.fillText(`${rampEffortForce.toFixed(0)}N`, bW / 2 + 42, -bH / 2 + 4);

      ctx.restore();
    }

    // SUBMACHINE 2: KATROL
    else if (subMachine === 'pulley') {
      const centerX = width / 2;
      const ceilingY = 50;

      // Draw Ceiling Beam
      ctx.fillStyle = '#475569';
      ctx.fillRect(centerX - 180, ceilingY - 15, 360, 15);

      const p = animProgress;
      const liftAmount = p * 90;

      if (pulleyType === 'fixed') {
        // KATROL TETAP
        const pulleyX = centerX;
        const pulleyY = ceilingY + 40;
        const radius = 28;

        // Pulley mount
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(pulleyX, ceilingY);
        ctx.lineTo(pulleyX, pulleyY);
        ctx.stroke();

        // Pulley wheel
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(pulleyX, pulleyY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner axle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pulleyX, pulleyY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Rope: Left side holds load, right side pulled down
        const loadY = groundY - 70 - liftAmount;
        const pullY = ceilingY + 120 + liftAmount;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Left rope down to load
        ctx.moveTo(pulleyX - radius, loadY);
        ctx.lineTo(pulleyX - radius, pulleyY);
        // Over pulley
        ctx.arc(pulleyX, pulleyY, radius, Math.PI, 0, false);
        // Right rope down to effort
        ctx.lineTo(pulleyX + radius, pullY);
        ctx.stroke();

        // Load Box
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(pulleyX - radius - 25, loadY, 50, 40, 5);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`w = ${pulleyLoad}N`, pulleyX - radius, loadY + 24);

        // Effort Pull handle & Arrow
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pulleyX + radius, pullY, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 11px Poppins, sans-serif';
        ctx.fillText(`F = ${pulleyEffortForce.toFixed(0)} N ↓`, pulleyX + radius + 45, pullY + 4);

      } else if (pulleyType === 'movable') {
        // KATROL BEBAS
        const fixedRopeX = centerX - 60;
        const movablePulleyX = centerX;
        const movablePulleyY = groundY - 110 - liftAmount;
        const radius = 28;

        // Fixed anchor at ceiling
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fixedRopeX, ceilingY);
        ctx.lineTo(fixedRopeX, ceilingY + 15);
        ctx.stroke();

        // Pulley wheel
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(movablePulleyX, movablePulleyY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Load hanging under movable pulley
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(movablePulleyX, movablePulleyY);
        ctx.lineTo(movablePulleyX, movablePulleyY + 35);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(movablePulleyX - 25, movablePulleyY + 35, 50, 40, 5);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`w = ${pulleyLoad}N`, movablePulleyX, movablePulleyY + 58);

        // Rope: Anchor -> Loop under movable pulley -> Up to hand
        const pullY = ceilingY + 40 - liftAmount * 1.5;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fixedRopeX, ceilingY + 15);
        ctx.lineTo(movablePulleyX - radius, movablePulleyY);
        ctx.arc(movablePulleyX, movablePulleyY, radius, Math.PI, 0, true);
        ctx.lineTo(movablePulleyX + radius, pullY);
        ctx.stroke();

        // Effort arrow pulling UP
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`F = ${pulleyEffortForce.toFixed(0)} N ↑ (KM = 2)`, movablePulleyX + radius + 75, pullY + 4);

      } else {
        // KATROL MAJEMUK / TAKAL (4 ropes supporting)
        const topY = ceilingY + 35;
        const botY = groundY - 120 - liftAmount;

        // Top Fixed block
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(centerX - 20, topY, 22, 0, Math.PI * 2);
        ctx.arc(centerX + 20, topY, 22, 0, Math.PI * 2);
        ctx.fill();

        // Bottom Movable block
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(centerX - 18, botY, 20, 0, Math.PI * 2);
        ctx.arc(centerX + 18, botY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Load below
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(centerX - 30, botY + 25, 60, 40, 5);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`w = ${pulleyLoad}N`, centerX, botY + 48);

        // Strings
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(centerX - 35, botY);
        ctx.lineTo(centerX - 38, topY);
        ctx.lineTo(centerX - 5, botY);
        ctx.lineTo(centerX + 5, topY);
        ctx.lineTo(centerX + 35, botY);
        ctx.lineTo(centerX + 65, ceilingY + 100);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px Poppins, sans-serif';
        ctx.fillText(`F = ${pulleyEffortForce.toFixed(0)} N (KM = 4)`, centerX + 110, ceilingY + 100);
      }
    }

    // SUBMACHINE 3: PENGUNGKIT / TUAS
    else if (subMachine === 'lever') {
      const plankStartX = 120;
      const plankEndX = width - 120;
      const totalSpanPx = plankEndX - plankStartX;
      const pxPerMeter = totalSpanPx / 10;

      const fulcrumX = plankStartX + fulcrumPos * pxPerMeter;
      const fulcrumY = groundY - 30;

      // Lever angle based on simulation progress
      // If simulated, effort side pushes down, load side rises
      const maxTilt = 0.12; // radians
      const tiltAngle = isSimulating ? animProgress * maxTilt : 0;

      ctx.save();
      ctx.translate(fulcrumX, fulcrumY);
      ctx.rotate(tiltAngle);

      // Plank (Papan Tuas)
      const leftPlankLength = fulcrumPos * pxPerMeter;
      const rightPlankLength = (10 - fulcrumPos) * pxPerMeter;

      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-leftPlankLength, -8, leftPlankLength + rightPlankLength, 16, 4);
      ctx.fill();
      ctx.stroke();

      // Load box on the left end
      const bW = 50;
      const bH = 45;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(-leftPlankLength + 5, -8 - bH, bW, bH, 5);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`w = ${leverLoad}N`, -leftPlankLength + 30, -8 - bH / 2 + 4);

      // Effort Force arrow on right end
      const effortArrowY = isSimulating ? 15 : -35;
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;

      // Downward effort arrow
      ctx.beginPath();
      ctx.moveTo(rightPlankLength - 20, -8);
      ctx.lineTo(rightPlankLength - 20, effortArrowY);
      ctx.stroke();

      ctx.font = 'bold 11px Poppins, sans-serif';
      ctx.fillText(`F = ${leverEffortForce.toFixed(0)} N ↓`, rightPlankLength - 20, effortArrowY - 8);

      ctx.restore();

      // Fulcrum Triangle (Titik Tumpu)
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(fulcrumX, fulcrumY);
      ctx.lineTo(fulcrumX - 25, groundY);
      ctx.lineTo(fulcrumX + 25, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pivot dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fulcrumX, fulcrumY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Arm Length indicator brackets below plank
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;

      // Lengan Beban (lb)
      ctx.beginPath();
      ctx.moveTo(plankStartX, groundY + 12);
      ctx.lineTo(fulcrumX, groundY + 12);
      ctx.stroke();
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 11px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`lb = ${leverLb} m`, (plankStartX + fulcrumX) / 2, groundY + 28);

      // Lengan Kuasa (lk)
      ctx.beginPath();
      ctx.moveTo(fulcrumX, groundY + 12);
      ctx.lineTo(plankEndX, groundY + 12);
      ctx.stroke();
      ctx.fillStyle = '#2563eb';
      ctx.fillText(`lk = ${leverLk} m`, (fulcrumX + plankEndX) / 2, groundY + 28);
    }

    // SUBMACHINE 4: RODA & POROS
    else {
      if (wheelMode === 'axle') {
        // MODE 1: RODA BERPOROS (Winch / Steer wheel)
        const centerWX = width / 2;
        const centerWY = groundY - 140;

        const R_px = wheelRadius * 1.8; // Big wheel
        const r_px = axleRadius * 1.8;  // Small axle

        // Draw Support Rig
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerWX, centerWY);
        ctx.lineTo(centerWX - 80, groundY);
        ctx.moveTo(centerWX, centerWY);
        ctx.lineTo(centerWX + 80, groundY);
        ctx.stroke();

        // Big Outer Wheel
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.beginPath();
        ctx.arc(centerWX, centerWY, R_px, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Outer wheel spokes
        const rot = animProgress * Math.PI * 2;
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 2.5;
        for (let a = 0; a < 6; a++) {
          const ang = rot + (a * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(centerWX, centerWY);
          ctx.lineTo(centerWX + Math.cos(ang) * R_px, centerWY + Math.sin(ang) * R_px);
          ctx.stroke();
        }

        // Inner Axle (Poros Kecil)
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(centerWX, centerWY, r_px, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Rope on Axle lifting the load
        const loadY = groundY - 50 - animProgress * 60;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerWX - r_px, centerWY);
        ctx.lineTo(centerWX - r_px, loadY);
        ctx.stroke();

        // Load
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(centerWX - r_px - 25, loadY, 50, 40, 5);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`w = ${wheelLoad}N`, centerWX - r_px, loadY + 24);

        // Effort arrow on outer wheel rim
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerWX + R_px, centerWY);
        ctx.lineTo(centerWX + R_px, centerWY + 50);
        ctx.stroke();

        ctx.font = 'bold 11px Poppins, sans-serif';
        ctx.fillText(`Gaya Kuasa F = ${wheelEffortForce.toFixed(0)} N ↓`, centerWX + R_px + 75, centerWY + 25);

        // Radius markers
        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 11px Poppins, sans-serif';
        ctx.fillText(`Roda Besar R = ${wheelRadius} cm`, centerWX, centerWY - R_px - 10);
        ctx.fillStyle = '#b45309';
        ctx.fillText(`Poros r = ${axleRadius} cm`, centerWX, centerWY - r_px - 6);

      } else {
        // MODE 2: MENGURANGI GESEKAN (Roda vs Tanpa Roda)
        const leftBoxX = 140 + animProgress * 80;
        const rightBoxX = 480 + animProgress * 180; // Wheels roll much farther!

        // Left Side: Ditarik Tanpa Roda (Gesekan Luncur Besar)
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.roundRect(leftBoxX, groundY - 60, 70, 60, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('KOTAK SERET', leftBoxX + 35, groundY - 35);
        ctx.fillText(`${boxWeight} N`, leftBoxX + 35, groundY - 20);

        // High friction sparks/scuff under left box
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftBoxX, groundY - 2);
        ctx.lineTo(leftBoxX + 70, groundY - 2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px Poppins, sans-serif';
        ctx.fillText(`Gesekan Luncur: ${frictionWithoutWheel.toFixed(0)} N!`, leftBoxX + 35, groundY - 75);
        ctx.fillText('❌ Berat & Melelahkan', leftBoxX + 35, groundY - 90);

        // Right Side: Menggunakan Roda / Troli (Gesekan Gelinding Sangat Ringan)
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(rightBoxX, groundY - 75, 80, 50, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Poppins, sans-serif';
        ctx.fillText('TROLI RODA', rightBoxX + 40, groundY - 50);
        ctx.fillText(`${boxWeight} N`, rightBoxX + 40, groundY - 35);

        // Two rolling wheels under right trolley
        const w1X = rightBoxX + 18;
        const w2X = rightBoxX + 62;
        const wY = groundY - 12;
        const wR = 12;

        [w1X, w2X].forEach(wx => {
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(wx, wY, wR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(wx, wY, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px Poppins, sans-serif';
        ctx.fillText(`Gesekan Gelinding: Hanya ${frictionWithWheel.toFixed(0)} N!`, rightBoxX + 40, groundY - 90);
        ctx.fillText('✅ Sangat Ringan & Efisien', rightBoxX + 40, groundY - 105);
      }
    }

  }, [subMachine, rampLoad, rampHeight, rampLength, rampEffortForce, animProgress, pulleyType, pulleyLoad, pulleyEffortForce, fulcrumPos, leverLb, leverLk, leverLoad, leverEffortForce, isSimulating, wheelMode, wheelRadius, axleRadius, wheelLoad, wheelEffortForce, boxWeight, frictionWithoutWheel, frictionWithWheel]);

  useEffect(() => {
    drawMachineCanvas();
  }, [drawMachineCanvas]);

  return (
    <div className="space-y-6">
      
      {/* 4 Sub-buttons Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          
          {/* Sub 1: Bidang Miring */}
          <button
            onClick={() => selectSubMachine('inclined-plane')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
              subMachine === 'inclined-plane'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
            <span>1. Bidang Miring</span>
          </button>

          {/* Sub 2: Katrol */}
          <button
            onClick={() => selectSubMachine('pulley')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
              subMachine === 'pulley'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Katrol</span>
          </button>

          {/* Sub 3: Pengungkit (Tuas) */}
          <button
            onClick={() => selectSubMachine('lever')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
              subMachine === 'lever'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>3. Pengungkit (Tuas)</span>
          </button>

          {/* Sub 4: Roda */}
          <button
            onClick={() => selectSubMachine('wheel-axle')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
              subMachine === 'wheel-axle'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>4. Roda & Poros</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Canvas & Telemetry */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Canvas Area */}
        <div className="relative w-full aspect-[16/8] min-h-[280px] max-h-[380px] bg-slate-100">
          <canvas
            ref={canvasRef}
            width={850}
            height={380}
            className="w-full h-full block"
          />

          {/* Canvas Floating Top Info */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm">
              Pesawat Sederhana:{' '}
              {subMachine === 'inclined-plane' && 'Bidang Miring'}
              {subMachine === 'pulley' && `Katrol (${pulleyType === 'fixed' ? 'Tetap' : pulleyType === 'movable' ? 'Bebas' : 'Majemuk'})`}
              {subMachine === 'lever' && `Tuas (${leverClass === 'type1' ? 'Golongan I (Tumpu di Tengah)' : leverClass === 'type2' ? 'Golongan II (Beban di Tengah)' : 'Golongan III'})`}
              {subMachine === 'wheel-axle' && (wheelMode === 'axle' ? 'Roda Berporos' : 'Eksperimen Mengurangi Gesekan')}
            </span>
          </div>

          {/* Canvas Bottom Action Controls */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md">
            <button
              onClick={runSim}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Tarik / Jalankan</span>
            </button>
            <button
              onClick={resetSim}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Reset ke posisi awal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Result Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-5 bg-slate-50 border-t border-slate-200">
          
          {/* Metric 1: Beban (w) */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Berat Beban (w)</span>
            <div className="mt-1 text-2xl font-extrabold text-slate-800">
              {subMachine === 'inclined-plane' && rampLoad}
              {subMachine === 'pulley' && pulleyLoad}
              {subMachine === 'lever' && leverLoad}
              {subMachine === 'wheel-axle' && (wheelMode === 'axle' ? wheelLoad : boxWeight)}{' '}
              <span className="text-xs font-bold text-slate-400">Newton</span>
            </div>
          </div>

          {/* Metric 2: Gaya Kuasa (F) */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3.5 rounded-xl text-white shadow-xs">
            <span className="text-xs font-medium text-blue-200">Gaya Kuasa Diperlukan (F)</span>
            <div className="mt-1 text-2xl font-extrabold text-white">
              {subMachine === 'inclined-plane' && rampEffortForce.toFixed(0)}
              {subMachine === 'pulley' && pulleyEffortForce.toFixed(0)}
              {subMachine === 'lever' && leverEffortForce.toFixed(0)}
              {subMachine === 'wheel-axle' && (wheelMode === 'axle' ? wheelEffortForce.toFixed(0) : frictionWithWheel.toFixed(0))}{' '}
              <span className="text-xs font-bold text-amber-300">Newton</span>
            </div>
            <p className="text-[10px] text-blue-100 mt-0.5">
              Tenaga yang harus dikeluarkan oleh otot manusia
            </p>
          </div>

          {/* Metric 3: Keuntungan Mekanis (KM) */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-3.5 rounded-xl text-white shadow-xs">
            <span className="text-xs font-medium text-emerald-200">Keuntungan Mekanis (KM)</span>
            <div className="mt-1 text-2xl font-extrabold text-white">
              {subMachine === 'inclined-plane' && `${rampKM.toFixed(1)}x`}
              {subMachine === 'pulley' && `${pulleyKM}x`}
              {subMachine === 'lever' && `${leverKM.toFixed(2)}x`}
              {subMachine === 'wheel-axle' && (wheelMode === 'axle' ? `${wheelKM.toFixed(1)}x` : '11x Lebih Ringan!')}
            </div>
            <p className="text-[10px] text-emerald-100 mt-0.5">
              Gaya diringankan sebanyak nilai KM kali!
            </p>
          </div>
        </div>
      </div>

      {/* Sub-machine Dedicated Controls & Educational Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Controls specific to chosen sub-machine */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          
          {/* ======================================================= */}
          {/* SUB 1: CONTROLS FOR BIDANG MIRING */}
          {/* ======================================================= */}
          {subMachine === 'inclined-plane' && (
            <>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>📐 Pengaturan Bidang Miring</span>
              </h3>

              {/* Slider Beban */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Berat Beban (w)</span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{rampLoad} N</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={rampLoad}
                  onChange={(e) => {
                    sound.playSlide();
                    setRampLoad(Number(e.target.value));
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider Tinggi (h) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Tinggi Bidang (h)</span>
                  <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">{rampHeight} meter</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.5"
                  value={rampHeight}
                  onChange={(e) => {
                    sound.playSlide();
                    const val = Number(e.target.value);
                    setRampHeight(val);
                    if (rampLength < val + 1) setRampLength(val + 1);
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider Panjang Lintasan (s) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Panjang Lintasan (s)</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{rampLength} meter</span>
                </div>
                <input
                  type="range"
                  min={rampHeight + 0.5}
                  max="10"
                  step="0.5"
                  value={rampLength}
                  onChange={(e) => {
                    sound.playSlide();
                    setRampLength(Number(e.target.value));
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-slate-400">Panjang lintasan (s) selalu lebih besar dari tinggi bidang (h).</span>
              </div>
            </>
          )}

          {/* ======================================================= */}
          {/* SUB 2: CONTROLS FOR KATROL */}
          {/* ======================================================= */}
          {subMachine === 'pulley' && (
            <>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>🪢 Pilihan Sistem Katrol</span>
              </h3>

              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setPulleyType('fixed');
                  }}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    pulleyType === 'fixed'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="text-sm mb-1">Katrol Tetap</div>
                  <span className="text-[11px] opacity-80">KM = 1 (Arah Gaya)</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setPulleyType('movable');
                  }}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    pulleyType === 'movable'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="text-sm mb-1">Katrol Bebas</div>
                  <span className="text-[11px] opacity-80">KM = 2 (Gaya ½ Beban)</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setPulleyType('compound');
                  }}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    pulleyType === 'compound'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="text-sm mb-1">Katrol Majemuk</div>
                  <span className="text-[11px] opacity-80">KM = 4 (Takal 4 Tali)</span>
                </button>
              </div>

              {/* Slider Beban */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Berat Beban Katrol (w)</span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{pulleyLoad} Newton</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={pulleyLoad}
                  onChange={(e) => {
                    sound.playSlide();
                    setPulleyLoad(Number(e.target.value));
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </>
          )}

          {/* ======================================================= */}
          {/* SUB 3: CONTROLS FOR PENGUNGKIT / TUAS */}
          {/* ======================================================= */}
          {subMachine === 'lever' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>⚖️ Posisi Titik Tumpu & Beban Tuas</span>
                </h3>

                {/* Lever Type selector */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setLeverClass('type1');
                    }}
                    className={`px-2 py-1 rounded ${leverClass === 'type1' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}
                  >
                    Golongan I
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setLeverClass('type2');
                    }}
                    className={`px-2 py-1 rounded ${leverClass === 'type2' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}
                  >
                    Golongan II
                  </button>
                </div>
              </div>

              {/* Fulcrum Slider (Menggeser Titik Tumpu) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Geser Posisi Titik Tumpu</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    lb = {leverLb}m | lk = {leverLk}m
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={fulcrumPos}
                  onChange={(e) => {
                    sound.playSlide();
                    setFulcrumPos(Number(e.target.value));
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Tumpu Dekat Beban (KM Sangat Besar!)</span>
                  <span>Tumpu di Tengah (lb = lk)</span>
                  <span>Tumpu Dekat Kuasa</span>
                </div>
              </div>

              {/* Slider Beban */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Beban Tuas (w)</span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{leverLoad} N</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="25"
                  value={leverLoad}
                  onChange={(e) => {
                    sound.playSlide();
                    setLeverLoad(Number(e.target.value));
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </>
          )}

          {/* ======================================================= */}
          {/* SUB 4: CONTROLS FOR RODA & POROS */}
          {/* ======================================================= */}
          {subMachine === 'wheel-axle' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>🚜 Roda Berporos & Mengurangi Gesekan</span>
                </h3>

                {/* Mode toggle */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setWheelMode('axle');
                    }}
                    className={`px-2.5 py-1 rounded ${wheelMode === 'axle' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}
                  >
                    Roda Berporos (Winch)
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setWheelMode('friction');
                    }}
                    className={`px-2.5 py-1 rounded ${wheelMode === 'friction' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}
                  >
                    Roda vs Seret (Gesekan)
                  </button>
                </div>
              </div>

              {wheelMode === 'axle' ? (
                <div className="space-y-4">
                  {/* Slider Roda Besar R */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">Jari-Jari Roda Besar (R)</span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{wheelRadius} cm</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="70"
                      step="5"
                      value={wheelRadius}
                      onChange={(e) => {
                        sound.playSlide();
                        setWheelRadius(Number(e.target.value));
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Slider Poros Kecil r */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">Jari-Jari Poros Drum (r)</span>
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{axleRadius} cm</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      step="1"
                      value={axleRadius}
                      onChange={(e) => {
                        sound.playSlide();
                        setAxleRadius(Number(e.target.value));
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Slider Berat Peti */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">Berat Peti Yang Dipindahkan</span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{boxWeight} N</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="800"
                      step="50"
                      value={boxWeight}
                      onChange={(e) => {
                        sound.playSlide();
                        setBoxWeight(Number(e.target.value));
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
                    <strong>Mengapa Roda Sangat Merevolusi Peradaban?</strong>
                    <br />
                    Gesekan gelinding antara roda dan jalan memiliki koefisien gesek (<span className="font-mono">μ ≈ 0.05</span>) yang <strong>10x hingga 15x lebih kecil</strong> daripada gesekan luncur menggeser peti kayu di atas lantai (<span className="font-mono">μ ≈ 0.55</span>).
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Right 1 Col: Educational Theory & Formula Guide */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Rumus & Konsep SMP</span>
            </h4>

            {/* Formula explanation dynamically tuned to current submachine */}
            {subMachine === 'inclined-plane' && (
              <div className="mt-3 space-y-2.5 text-xs text-slate-600">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 font-mono text-[11px] text-blue-900">
                  <div>KM = s / h</div>
                  <div>w × h = F × s</div>
                  <div className="font-bold text-blue-700 mt-1">F = (w × h) / s = w / KM</div>
                </div>
                <p>
                  Semakin landai bidang miring (panjang <span className="font-mono">s</span> semakin besar dibandingkan tinggi <span className="font-mono">h</span>), maka gaya kuasa <span className="font-mono">F</span> akan semakin kecil.
                </p>
                <div className="text-[11px] text-slate-500">
                  <strong>Contoh nyata:</strong> Tangga berliku di pegunungan, ulir sekrup, baji kapak, pisau dapur.
                </div>
              </div>
            )}

            {subMachine === 'pulley' && (
              <div className="mt-3 space-y-2.5 text-xs text-slate-600">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 font-mono text-[11px] text-emerald-900">
                  <div>Katrol Tetap: KM = 1 (F = w)</div>
                  <div>Katrol Bebas: KM = 2 (F = w / 2)</div>
                  <div>Takal (Majemuk): KM = n (jumlah tali penopang)</div>
                </div>
                <p>
                  Katrol tetap tidak melipatgandakan gaya (<span className="font-mono">KM = 1</span>), tetapi <strong>mengubah arah gaya</strong> sehingga kita menarik ke bawah dengan memanfaatkan berat tubuh kita sendiri.
                </p>
                <div className="text-[11px] text-slate-500">
                  <strong>Contoh nyata:</strong> Tiang bendera upacara, kerekan sumur timba, crane konstruksi pencakar langit.
                </div>
              </div>
            )}

            {subMachine === 'lever' && (
              <div className="mt-3 space-y-2.5 text-xs text-slate-600">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 font-mono text-[11px] text-amber-900">
                  <div>w × lb = F × lk</div>
                  <div>KM = lk / lb = w / F</div>
                  <div className="font-bold text-amber-800 mt-1">F = (w × lb) / lk</div>
                </div>
                <p>
                  Agar gaya kuasa <span className="font-mono">F</span> sekecil mungkin, letakkan titik tumpu sedekat mungkin dengan beban (lengan beban <span className="font-mono">lb</span> pendek) dan buat lengan kuasa <span className="font-mono">lk</span> sepanjang mungkin.
                </p>
                <div className="text-[11px] text-slate-500">
                  <strong>Contoh nyata:</strong> Jungkat-jungkit, gunting, linggis pembuka paku, gerobak dorong roda satu.
                </div>
              </div>
            )}

            {subMachine === 'wheel-axle' && (
              <div className="mt-3 space-y-2.5 text-xs text-slate-600">
                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100 font-mono text-[11px] text-cyan-900">
                  <div>KM = R / r</div>
                  <div>F × R = w × r</div>
                  <div className="font-bold text-cyan-800 mt-1">F = w × (r / R)</div>
                </div>
                <p>
                  Roda dengan jari-jari besar (<span className="font-mono">R</span>) yang memutar poros drum kecil (<span className="font-mono">r</span>) melipatgandakan gaya putar.
                </p>
                <div className="text-[11px] text-slate-500">
                  <strong>Contoh nyata:</strong> Setir kemudi mobil, obeng bergagang besar, engkol katrol air, pedal sepeda.
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>IPA SMP Kelas 8</span>
            <span>Pesawat Sederhana</span>
          </div>
        </div>

      </div>

    </div>
  );
};
