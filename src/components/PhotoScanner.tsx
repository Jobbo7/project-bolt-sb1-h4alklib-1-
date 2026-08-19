import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Sparkles, RefreshCw } from 'lucide-react';
import { createWorker } from 'tesseract.js';

export default function PhotoScanner({ open, onClose, onResult, region }) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'streaming' | 'processing' | 'result'
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // 📹 ACTIVATE CAMERA HARDWARE AND REQUEST USER PERMISSIONS NATIVELY
  const startCameraStream = async () => {
    setErrorMessage(null);
    setPhase('idle');
    
    try {
      // Dispatches request directly to the tablet's operating system browser layer
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } }, // Force tablet's rear workshop camera lens
        audio: false
      }).catch(async () => {
        // Soft fallback to standard lens arrays if tablet doesn't report an "environment" label
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Prevents iOS Safari opening native full-screen player
        await videoRef.current.play();
        setPhase('streaming'); // Safely opens the camera viewport display
      }
    } catch (err) {
      console.error("Camera hardware access handshake rejected:", err);
      setErrorMessage("⚠️ LENS ACCESS DENIED: Please update your tablet's site privacy permissions to allow camera hardware access.");
      setPhase('idle');
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setPhase('idle');
    setProgress(0);
  };

  // Trigger camera activation when modal portals are opened by the user
  useEffect(() => {
    if (open) {
      startCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [open]);

  // 🧠 CAPTURE CANVAS FRAME BUFFER AND EXECUTE LIVE EDGE OCR
  const captureFrameAndScanText = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setPhase('processing');
    setProgress(20);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Freeze-frame the precise visual video pixels onto background canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setProgress(50);

    try {
      // Initialize text recognition workers locally inside your tablet device memory cache
      const worker = await createWorker('eng');
      const ocrOutput = await worker.recognize(canvas);
      
      // Filter out punctuation space lines and force uppercase alphanumeric codes
      const cleanRegoText = ocrOutput.data.text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
      await worker.terminate();
      setProgress(80);

      if (cleanRegoText && cleanRegoText.length >= 3) {
        console.log(`📡 Shipping decoded camera plate text to Vercel API lookup tunnel: ${cleanRegoText}`);
        
        // Pass the ACTUAL characters recognized by the lens out over the live internet
        const response = await fetch('/api/vehicle-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plate: cleanRegoText, type: 'rego', region: region || 'AU_VIC' })
        });

        const liveVehicleSpecs = await response.json();
        setProgress(100);

        // Map live response columns directly back up to your parent App.jsx layout cards
        onResult(`${liveVehicleSpecs.year || ''} ${liveVehicleSpecs.make || ''} ${liveVehicleSpecs.model || 'PLATE FOUND'}`, 99, cleanRegoText);
        stopCameraStream();
        onClose();
      } else {
        alert("⚠️ Text recognition timed out. Reposition tablet crosshairs directly over the registration numbers.");
        setPhase('streaming');
        setProgress(0);
      }
    } catch (error) {
      console.error("❌ Optical Text Evaluation Exception Failed:", error);
      alert("⚠️ Processing Exception: Server connection timeout.");
      setPhase('streaming');
      setProgress(0);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-[#0C111C] p-5 shadow-2xl text-slate-100">
        
        {/* Top Control Bar Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-orange-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Optical Image Scanner Lens</span>
          </div>
          <button onClick={() => { stopCameraStream(); onClose(); }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Display Alert Messages if Camera Hardware Permissions Are Blocked */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-950/40 bg-red-950/10 p-3 text-xs font-semibold text-red-400">
            {errorMessage}
          </div>
        )}

        {/* 📹 REAL TIME VIDEO STREAM TERMINAL VIEWPORT CONTAINER */}
        <div className="relative mt-4 h-64 w-full overflow-hidden rounded-xl border border-slate-800 bg-[#070A12] flex items-center justify-center">
          
          {phase === 'idle' && !errorMessage && (
            <div className="text-center space-y-2">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent inline-block" />
              <p className="text-xs text-slate-400 tracking-wider">Awaiting Operating System Camera Permission Prompt...</p>
            </div>
          )}

          {phase === 'streaming' && (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover opacity-90" />
              
              {/* Target Reticle Crosshair Bounding Frame Overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                <div className="h-20 w-full rounded-lg border-2 border-dashed border-orange-500 bg-orange-500/5 animate-pulse flex items-center justify-center">
                  <span className="bg-slate-950/80 px-2 py-0.5 rounded font-mono text-[8px] uppercase tracking-widest text-orange-400">Align Registration Text Inside Crosshair</span>
                </div>
              </div>
            </>
          )}

          {phase === 'processing' && (
            <div className="text-center space-y-3 px-6 w-full">
              <Sparkles className="h-6 w-6 text-orange-400 animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-300">Decoding Image Framework Arrays...</div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800">
                <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {/* Bottom Context Controls */}
        <div className="mt-4 flex gap-2">
          {phase === 'streaming' && (
            <button onClick={captureFrameAndScanText} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-slate-950 font-extrabold py-2.5 text-xs uppercase tracking-wider transition-colors shadow-md">
              <Camera className="h-4 w-4" /> Freeze Frame & OCR Decode
            </button>
          )}
          {errorMessage && (
            <button onClick={startCameraStream} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800">
              <RefreshCw className="h-3.5 w-3.5" /> Re-Authorize Camera Streams
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
