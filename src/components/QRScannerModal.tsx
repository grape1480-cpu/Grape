import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  SwitchCamera,
} from 'lucide-react';
import { SportType, Stadium } from '../types/index.ts';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stadiums: Stadium[];
  onDetected: (stadiumId: string, sport?: SportType) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  stadiums,
  onDetected,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'link'>('camera');
  const [cameraError, setCameraError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualLink, setManualLink] = useState('');
  const [scanningStatus, setScanningStatus] = useState<string>('กำลังสแกน...');
  const [detectedInfo, setDetectedInfo] = useState<{
    stadium: Stadium;
    sport?: SportType;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Parse QR content into stadiumId & sport
  const parseQRContent = (text: string) => {
    try {
      let targetStadiumId = '';
      let targetSport: SportType | undefined = undefined;

      // Handle standard URL like https://.../?action=checkin&stadiumId=bma-din-daeng&sport=...
      if (text.includes('stadiumId=')) {
        const url = new URL(text.startsWith('http') ? text : `https://dummy.com/${text}`);
        const stadiumIdParam = url.searchParams.get('stadiumId');
        const sportParam = url.searchParams.get('sport');

        if (stadiumIdParam) targetStadiumId = stadiumIdParam;
        if (sportParam) targetSport = sportParam as SportType;
      } else if (text.startsWith('bma-')) {
        // Direct ID format
        targetStadiumId = text;
      } else {
        // Search by stadium name or district
        const found = stadiums.find(
          (s) =>
            text.toLowerCase().includes(s.id.toLowerCase()) ||
            text.includes(s.name) ||
            text.includes(s.districtName)
        );
        if (found) targetStadiumId = found.id;
      }

      const matchedStadium = stadiums.find((s) => s.id === targetStadiumId);
      if (matchedStadium) {
        return { stadium: matchedStadium, sport: targetSport };
      }
    } catch {
      // not a standard URL, try matching ID
      const directMatch = stadiums.find((s) => text.includes(s.id));
      if (directMatch) {
        return { stadium: directMatch };
      }
    }
    return null;
  };

  // Sound feedback on successful scan
  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // ignore audio context restrictions
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    stopCamera();
    setCameraError('');
    setScanningStatus('กำลังเปิดกล้อง...');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง โปรดใช้วิธีอัปโหลดภาพ QR หรือวางลิงก์แทน');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setScanningStatus('หันกล้องไปที่คิวอาร์โค้ดของสนามกีฬา...');
        requestScan();
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ (โปรดอนุญาตสิทธิ์การใช้กล้อง หรือเลือกอัปโหลดรูปภาพ)');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Real-time scan loop
  const requestScan = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const result = parseQRContent(code.data);
        if (result) {
          playSuccessSound();
          setDetectedInfo(result);
          stopCamera();
          setTimeout(() => {
            onDetected(result.stadium.id, result.sport);
            onClose();
          }, 800);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(requestScan);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  // Handle Image File Upload for QR Code
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          const result = parseQRContent(code.data);
          if (result) {
            playSuccessSound();
            setDetectedInfo(result);
            setTimeout(() => {
              onDetected(result.stadium.id, result.sport);
              onClose();
            }, 800);
          } else {
            alert('อ่าน QR Code ได้ แต่ไม่ใช่ข้อมูลสนามกีฬา กทม. ที่รองรับ');
          }
        } else {
          alert('ไม่พบคิวอาร์โค้ดในภาพ กรุณาเลือกภาพที่ชัดเจน');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Manual Link Paste
  const handleManualLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLink.trim()) return;
    const result = parseQRContent(manualLink.trim());
    if (result) {
      playSuccessSound();
      setDetectedInfo(result);
      setTimeout(() => {
        onDetected(result.stadium.id, result.sport);
        onClose();
      }, 500);
    } else {
      alert('ลิงก์ไม่ถูกต้อง หรือไม่พบสนามกีฬาที่ระบุ');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                สแกน QR Code ลงทะเบียนเข้าสนาม
              </h3>
              <p className="text-[11px] text-emerald-200">สแกนป้ายหน้าสนามเพื่อเช็คอินอัตโนมัติ</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="ปิดกล้องสแกน"
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection: Camera vs Upload vs Paste */}
        <div className="flex border-b border-slate-100 text-xs font-medium bg-slate-50">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 flex items-center justify-center space-x-1 border-b-2 transition ${
              activeTab === 'camera'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>กล้องถ่ายรูป</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 flex items-center justify-center space-x-1 border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>อัปโหลดรูปภาพ</span>
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2.5 flex items-center justify-center space-x-1 border-b-2 transition ${
              activeTab === 'link'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>วางลิงก์</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 space-y-4">
          {detectedInfo ? (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 text-center space-y-2 animate-in zoom-in-95">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">สแกนสำเร็จแล้ว!</h4>
              <p className="text-xs text-emerald-800 font-semibold">{detectedInfo.stadium.name}</p>
              {detectedInfo.sport && (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[11px] font-bold">
                  จุดบริการ: {detectedInfo.sport}
                </span>
              )}
              <p className="text-[11px] text-slate-500 mt-2">กำลังเปิดแบบฟอร์มลงทะเบียน...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Live Camera Stream */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border-2 border-slate-800">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Viewfinder Target Frame */}
                    <div className="absolute inset-8 border-2 border-emerald-400 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                      <div className="flex justify-between">
                        <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-2 -ml-2" />
                        <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-2 -mr-2" />
                      </div>
                      <div className="w-full h-0.5 bg-emerald-400/80 animate-pulse" />
                      <div className="flex justify-between">
                        <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-2 -ml-2" />
                        <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-2 -mr-2" />
                      </div>
                    </div>

                    {/* Camera Switch button if available */}
                    <button
                      onClick={() =>
                        setFacingMode((prev) =>
                          prev === 'environment' ? 'user' : 'environment'
                        )
                      }
                      className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xs transition"
                      title="สลับกล้องหน้า/หลัง"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </div>

                  {cameraError ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{cameraError}</p>
                        <p className="text-[11px] text-amber-700 mt-1">
                          คุณสามารถใช้แท็บ <strong>"อัปโหลดรูปภาพ"</strong> เพื่อเลือกภาพถ่าย QR Code ได้เลย
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-xs text-slate-500 font-medium">
                      {scanningStatus}
                    </p>
                  )}
                </div>
              )}

              {/* Tab 2: Upload QR Image */}
              {activeTab === 'upload' && (
                <div className="space-y-3 text-center">
                  <label className="block border-2 border-dashed border-emerald-300 rounded-2xl p-6 hover:bg-emerald-50/50 cursor-pointer transition">
                    <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <span className="block text-xs font-semibold text-slate-800">
                      คลิกเพื่อเลือกไฟล์รูปถ่ายคิวอาร์โค้ด
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-1">
                      รองรับไฟล์ JPG, PNG, WEBP จากโทรศัพท์หรือคอมพิวเตอร์
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400">
                    💡 ถ่ายรูปป้าย QR Code ที่หน้าสนามกีฬา แล้วอัปโหลดได้ทันที
                  </p>
                </div>
              )}

              {/* Tab 3: Paste Link */}
              {activeTab === 'link' && (
                <form onSubmit={handleManualLinkSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      วางข้อความหรือ URL จากคิวอาร์โค้ด
                    </label>
                    <input
                      type="text"
                      value={manualLink}
                      onChange={(e) => setManualLink(e.target.value)}
                      placeholder="เช่น https://.../?action=checkin&stadiumId=bma-din-daeng"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    ตรวจสอบและเปิดลงทะเบียน
                  </button>
                </form>
              )}
            </>
          )}

          {/* Quick Demo Scan Buttons for Testing Real Venues */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              หรือกดทดสอบสแกนจุดบริการยอดนิยมได้ทันที:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onDetected('bma-din-daeng', 'ฟุตบอล / ฟุตซอล');
                  onClose();
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg text-xs font-medium transition"
              >
                ⚽ ไทย-ญี่ปุ่น ดินแดง (ฟุตบอล)
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onDetected('bma-chatuchak-vachira', 'วิ่ง / จ็อกกิ้ง');
                  onClose();
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg text-xs font-medium transition"
              >
                🏃 สวนรถไฟ (วิ่ง)
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onDetected('bma-pathumwan-lumpini', 'สระว่ายน้ำ');
                  onClose();
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg text-xs font-medium transition"
              >
                🏊 สวนลุมพินี (ว่ายน้ำ)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
