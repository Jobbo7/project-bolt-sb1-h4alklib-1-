import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Sparkles } from 'lucide-react';
import { createWorker } from 'tesseract.js';

export default function PhotoScanner({ open, onClose, onResult, region }) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'streaming' | 'processing'
  const [errorMessage, setErrorMessage] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCameraStream = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } }, // Force tablet's rear lens
        audio: false
      }).catch(async () => {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); // Fallback to webcam
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setPhase('streaming');
      }
    } catch (err) {
      setErrorMessage("⚠️ LENS ACCESS DENIED: Please update your tablet's browser hardware privacy settings.");
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setPhase('idle');
  };

  useEffect(() => {
    if (open) { startCameraStream(); }
    return () => { stopCameraStream(); };
  }, [open]);

  const captureFrameAndScanText = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setPhase('processing');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const worker = await createWorker('eng');
      const ocrOutput = await worker.recognize(canvas);
      const cleanRegoText = ocrOutput.data.text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
      await worker.terminate();

      if (cleanRegoText && cleanRegoText.length >= 3) {
        const response = await fetch('/api/vehicle-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plate: cleanRegoText, type: 'rego', region: region || 'AU_VIC' })
        });
        const liveVehicleSpecs = await response.json();
        onResult(`${liveVehicleSpecs.year || ''} ${liveVehicleSpecs.make || ''} ${liveVehicleSpecs.model || 'PLATE FOUND'}`, 99, cleanRegoText);
        stopCameraStream();
        onClose();
      } else {
        alert("⚠️ Text recognition failed. Reposition tablet directly over the registration text.");
        setPhase('streaming');
      }
    } catch (error) {
      alert("⚠️ Processing Exception: Server lookup path timed out.");
      setPhase('streaming');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0C111C] p-5 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-200">
            <Camera className="h-4 w-4 text-orange-500 animate-pulse" /> Live Camera Hardware Lens Terminal
          </div>
          <button onClick={() => { stopCameraStream(); onClose(); }} className="text-slate-400 hover:text-slate-100"><X className="h-4 w-4" /></button>
        </div>

        {errorMessage && <div className="mt-3 p-3 rounded-lg bg-red-950/20 border border-red-900 text-xs text-red-400 font-semibold">{errorMessage}</div>}

        <div className="relative mt-4 h-64 w-full overflow-hidden rounded-xl border border-slate-800 bg-[#070A12] flex items-center justify-center">
          {phase === 'idle' && !errorMessage && <p className="text-xs text-slate-400 tracking-wider">Awaiting Native Operating System Camera Authorization Prompt...</p>}
          {phase === 'streaming' && (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                <div className="h-24 w-full rounded-lg border-2 border-dashed border-orange-500/60 bg-orange-500/5 animate-pulse flex items-center justify-center">
                  <span className="bg-slate-950/90 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest text-orange-400">Position Registration Text Inside Bounding Reticle</span>
                </div>
              </div>
            </>
          )}
          {phase === 'processing' && <div className="text-center space-y-2 text-xs text-orange-400 font-mono animate-pulse"><Sparkles className="h-5 w-5 mx-auto animate-spin" /> Decoding Image Frame Target... Running Client-Side OCR Scan...</div>}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-4 flex">
          {phase === 'streaming' && (
            <button onClick={captureFrameAndScanText} className="flex-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-slate-950 font-extrabold py-2.5 text-xs uppercase tracking-wider transition-colors shadow">
              Freeze Frame & OCR Decode
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
