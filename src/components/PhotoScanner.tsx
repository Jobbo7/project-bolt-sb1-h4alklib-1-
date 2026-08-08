import { useEffect, useRef, useState } from 'react';
import { X, Camera, Loader2, Cpu, ScanLine, CheckCircle2, Zap } from 'lucide-react';

interface PhotoScannerProps {
  open: boolean;
  onClose: () => void;
  onResult: (component: string, confidence: number, searchQuery: string) => void;
}

type Phase = 'idle' | 'capturing' | 'analyzing' | 'result';

export function PhotoScanner({ open, onClose, onResult }: PhotoScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ component: string; confidence: number } | null>(null);
  const [scanLineY, setScanLineY] = useState(0);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!open) return;

    let raf: number;
    let direction = 1;
    const animateScanLine = () => {
      setScanLineY((prev) => {
        let next = prev + direction * 1.4;
        if (next >= 100) {
          next = 100;
          direction = -1;
        } else if (next <= 0) {
          next = 0;
          direction = 1;
        }
        return next;
      });
      raf = requestAnimationFrame(animateScanLine);
    };

    const startCamera = async () => {
      setPhase('idle');
      setResult(null);
      setProgress(0);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        raf = requestAnimationFrame(animateScanLine);
      } catch {
        raf = requestAnimationFrame(animateScanLine);
      }
    };
    startCamera();

    return () => {
      cancelAnimationFrame(raf);
      stopCamera();
    };
  }, [open]);

  const handleCapture = () => {
    setPhase('capturing');
    setProgress(0);

    const startedAt = Date.now();
    const duration = 2000;
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        setTimeout(tick, 30);
      } else {
        setResult({ component: 'Alternator', confidence: 94 });
        setPhase('result');
      }
    };
    setTimeout(tick, 30);
  };

  const handleUseResult = () => {
    if (result) {
      onResult(result.component, result.confidence, result.component.toLowerCase());
    }
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setPhase('idle');
    setResult(null);
    setProgress(0);
    setScanLineY(0);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#0A0D14]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#E2E8F0]">
          <Cpu className="h-4 w-4 text-[#FF5A1F]" />
          AI Photo Recognition
        </div>
        <button
          onClick={handleClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#121824]/90 text-slate-300 ring-1 ring-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition hover:bg-[#121824] active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4">
        <div className="relative w-full overflow-hidden rounded-3xl border border-[#1F293D] bg-[#121824] shadow-2xl shadow-black/50">
          <div className="relative aspect-[3/4] w-full">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Dark vignette */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0D14]/70 via-transparent to-[#0A0D14]/40" />

            {/* Scanning matrix overlay */}
            {phase !== 'result' && (
              <div className="pointer-events-none absolute inset-0">
                {/* Targeting reticle */}
                <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2">
                  <span className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-[#FF5A1F]" />
                  <span className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-[#FF5A1F]" />
                  <span className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-[#FF5A1F]" />
                  <span className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-[#FF5A1F]" />

                  {/* Animated scan line */}
                  <div
                    className="absolute inset-x-0 h-0.5 bg-[#FF5A1F] shadow-[0_0_12px_2px_rgba(255,90,31,0.7)]"
                    style={{ top: `${scanLineY}%` }}
                  />

                  {/* Matrix grid lines */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute left-1/3 top-0 h-full w-px bg-[#FF5A1F]/40" />
                    <div className="absolute left-2/3 top-0 h-full w-px bg-[#FF5A1F]/40" />
                    <div className="absolute top-1/3 w-full h-px bg-[#FF5A1F]/40" />
                    <div className="absolute top-2/3 w-full h-px bg-[#FF5A1F]/40" />
                  </div>
                </div>

                {/* HUD telemetry */}
                <div className="absolute left-3 top-3 font-mono text-[10px] text-[#FF5A1F]/80">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF5A1F]" />
                    AI.VISION v2.1
                  </div>
                  <div className="mt-0.5 text-slate-500">MODE: COMPONENT_ID</div>
                </div>
                <div className="absolute right-3 top-3 text-right font-mono text-[10px] text-slate-500">
                  <div>FPS: 30</div>
                  <div>RES: 1080p</div>
                </div>
              </div>
            )}

            {/* Capturing / analyzing progress */}
            {(phase === 'capturing' || phase === 'analyzing') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0A0D14]/80 backdrop-blur-sm">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF5A1F]" />
                <p className="font-mono text-xs uppercase tracking-wider text-[#FF5A1F]">
                  {phase === 'capturing' ? 'Analyzing component…' : 'Processing…'}
                </p>
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[#121824]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF5A1F] to-[#00E5FF] transition-[width] duration-75"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="font-mono text-[10px] text-[#64748B]">{Math.round(progress)}%</p>
              </div>
            )}

            {/* Result overlay */}
            {phase === 'result' && result && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0A0D14]/85 px-6 backdrop-blur-md">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF5A1F] text-slate-950 shadow-[0_0_20px_rgba(255,90,31,0.5)]">
                  <CheckCircle2 className="h-9 w-9" />
                </span>
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5A1F]">
                    AI Object Match
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#E2E8F0]">{result.component}</p>
                  <p className="mt-1 text-sm text-[#00E5FF]">
                    {result.confidence}% fitment confidence
                  </p>
                </div>
                <button
                  onClick={handleUseResult}
                  className="flex items-center gap-2 rounded-xl bg-[#FF5A1F] px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,90,31,0.6)] active:scale-[0.98]"
                >
                  <Zap className="h-4 w-4" />
                  Find Matching Parts
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Capture button */}
        {phase === 'idle' && (
          <button
            onClick={handleCapture}
            className="mt-6 flex items-center gap-2 rounded-full bg-[#FF5A1F] px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,90,31,0.6)] active:scale-[0.98]"
          >
            <Camera className="h-4 w-4" />
            Capture &amp; Analyze
          </button>
        )}

        {phase === 'idle' && (
          <p className="mt-3 text-center text-[11px] text-[#64748B]">
            Point at any engine bay component — AI will identify it and find matching parts.
          </p>
        )}
      </div>

      <div className="px-4 pb-6 pt-2 text-center">
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
          <ScanLine className="h-3 w-3 text-[#FF5A1F]" />
          Simulated AI vision · demo mode
        </p>
      </div>
    </div>
  );
}
