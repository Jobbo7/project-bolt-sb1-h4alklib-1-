import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ScanLine, Camera, Loader2, CheckCircle2, AlertTriangle, Search } from 'lucide-react';

interface VinScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (vin: string) => void;
}

type ScanPhase = 'idle' | 'requesting' | 'scanning' | 'detected' | 'denied';

const SAMPLE_VINS = [
  { vin: 'JTEBU14R8F5081234', label: '2015 Toyota Hilux · 3.0L Diesel' },
  { vin: '1FTFW1ET5DFC10321', label: '2013 Ford F-150 · 5.0L V8' },
  { vin: 'WP0AB2A98PS160123', label: '2023 Porsche 911 · 3.0T' },
  { vin: '5TFCZ5AN8LX470987', label: '2020 Toyota Tacoma · 3.5L' },
];

export function VinScanner({ open, onClose, onDetected }: VinScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [detected, setDetected] = useState<{ vin: string; label: string } | null>(null);
  const [progress, setProgress] = useState(0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const beginScan = useCallback(() => {
    setPhase('scanning');
    setDetected(null);
    setProgress(0);

    const startedAt = Date.now();
    const duration = 2400;
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        scanTimerRef.current = setTimeout(tick, 40);
      } else {
        const pick = SAMPLE_VINS[Math.floor(Math.random() * SAMPLE_VINS.length)];
        setDetected(pick);
        setPhase('detected');
      }
    };
    scanTimerRef.current = setTimeout(tick, 40);
  }, []);

  const startCamera = useCallback(async () => {
    setPhase('requesting');
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
      beginScan();
    } catch {
      setPhase('denied');
    }
  }, [beginScan]);

  useEffect(() => {
    if (open) {
      startCamera();
    }
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleClose = () => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    stopCamera();
    setPhase('idle');
    setDetected(null);
    setProgress(0);
    onClose();
  };

  const handleUseVin = () => {
    if (detected) {
      onDetected(detected.vin);
    }
    handleClose();
  };

  const handleRetry = () => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    beginScan();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0A0D14]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#E2E8F0]">
          <ScanLine className="h-4 w-4 text-[#FF5A1F]" />
          VIN / Barcode Scanner
        </div>
        <button
          onClick={handleClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#121824]/90 text-slate-300 ring-1 ring-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition hover:bg-[#121824] active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Camera viewport */}
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4">
        <div className="relative w-full overflow-hidden rounded-3xl border border-[#1F293D] bg-[#121824] shadow-2xl shadow-black/50">
          <div className="relative aspect-[3/4] w-full">
            {phase === 'requesting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#64748B]">
                <Loader2 className="h-7 w-7 animate-spin text-[#FF5A1F]" />
                <p className="text-xs">Requesting camera…</p>
              </div>
            )}

            {phase === 'denied' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
                <p className="text-sm font-semibold text-[#E2E8F0]">Camera unavailable</p>
                <p className="text-xs text-[#64748B]">
                  We couldn't access your webcam. You can still run a simulated scan
                  to see how VIN detection works.
                </p>
                <button
                  onClick={beginScan}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-[#FF5A1F] px-4 py-2 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] transition active:scale-95"
                >
                  <ScanLine className="h-4 w-4" />
                  Run Simulated Scan
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${
                phase === 'requesting' || phase === 'denied' ? 'hidden' : 'block'
              }`}
            />

            {(phase === 'scanning' || phase === 'detected') && (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-black/40" />

                <div className="absolute left-1/2 top-1/2 h-44 w-72 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative h-full w-full rounded-2xl ring-2 ring-[#FF5A1F]/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    <span className="absolute -left-1 -top-1 h-6 w-6 rounded-tl-xl border-l-4 border-t-4 border-[#FF5A1F]" />
                    <span className="absolute -right-1 -top-1 h-6 w-6 rounded-tr-xl border-r-4 border-t-4 border-[#FF5A1F]" />
                    <span className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl-xl border-b-4 border-l-4 border-[#FF5A1F]" />
                    <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-br-xl border-b-4 border-r-4 border-[#FF5A1F]" />

                    {phase === 'scanning' && (
                      <div
                        className="absolute inset-x-2 h-0.5 bg-[#FF5A1F] shadow-[0_0_12px_2px_rgba(255,90,31,0.7)]"
                        style={{
                          top: `${progress}%`,
                          transition: 'top 40ms linear',
                        }}
                      />
                    )}

                    {phase === 'detected' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)]">
                          <CheckCircle2 className="h-7 w-7" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {phase === 'scanning' && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-xs font-medium text-[#FF5A1F]">
                      Align the VIN or barcode inside the frame
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {phase === 'scanning' && (
          <div className="mt-4 w-full max-w-xs">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#121824]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF5A1F] to-[#00E5FF] transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-[11px] text-[#64748B]">
              Scanning… {Math.round(progress)}%
            </p>
          </div>
        )}

        {phase === 'detected' && detected && (
          <div className="mt-4 w-full rounded-2xl border border-[#FF5A1F]/30 bg-[#FF5A1F]/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF5A1F]">
              <CheckCircle2 className="h-4 w-4" />
              VIN Detected
            </div>
            <p className="mt-2 break-all font-mono text-sm font-bold text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-2.5 py-1 rounded-md inline-block">
              {detected.vin}
            </p>
            <p className="mt-2 text-xs text-[#64748B]">{detected.label}</p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleRetry}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#121824]/90 py-2.5 text-xs font-semibold text-[#E2E8F0] ring-1 ring-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition hover:bg-[#121824] active:scale-95"
              >
                <Camera className="h-3.5 w-3.5" />
                Scan Again
              </button>
              <button
                onClick={handleUseVin}
                className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-[#FF5A1F] py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] transition active:scale-95"
              >
                <Search className="h-3.5 w-3.5" />
                Search Parts
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-6 pt-2 text-center">
        <p className="text-[11px] text-[#64748B]">
          {phase === 'denied'
            ? 'Simulated mode — no camera feed.'
            : 'Live camera feed · simulated decode for demo purposes.'}
        </p>
      </div>
    </div>
  );
}
