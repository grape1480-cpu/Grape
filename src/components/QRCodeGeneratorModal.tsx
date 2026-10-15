import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Download, Printer, Copy, Check, ExternalLink, Building2, Smartphone } from 'lucide-react';
import { Stadium, SportType } from '../types/index.ts';

interface QRCodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  stadiums: Stadium[];
  initialStadiumId?: string;
  onSimulateScanCheckIn: (stadiumId: string, sportType?: SportType) => void;
}

export const QRCodeGeneratorModal: React.FC<QRCodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  stadiums,
  initialStadiumId,
  onSimulateScanCheckIn,
}) => {
  const [selectedStadiumId, setSelectedStadiumId] = useState<string>(
    initialStadiumId || stadiums[0]?.id || ''
  );
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [isCopied, setIsCopied] = useState(false);
  const [isPosterMode, setIsPosterMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (initialStadiumId) {
      setSelectedStadiumId(initialStadiumId);
    }
  }, [initialStadiumId]);

  const currentStadium = stadiums.find((s) => s.id === selectedStadiumId) || stadiums[0];

  // Construct target registration URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://bma-sports.bangkok.go.th';
  const qrTargetUrl = `${baseUrl}?action=checkin&stadiumId=${encodeURIComponent(
    selectedStadiumId
  )}${selectedSport !== 'all' ? `&sport=${encodeURIComponent(selectedSport)}` : ''}`;

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !currentStadium) return;

    QRCode.toCanvas(
      canvasRef.current,
      qrTargetUrl,
      {
        width: 260,
        margin: 2,
        color: {
          dark: '#064e3b', // Deep emerald
          light: '#ffffff',
        },
      },
      (err) => {
        if (err) console.error('Error generating QR code:', err);
      }
    );
  }, [isOpen, qrTargetUrl, currentStadium, isPosterMode]);

  if (!isOpen || !currentStadium) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `QR_CheckIn_${currentStadium.districtName}_${selectedSport}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrTargetUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">สร้างคิวอาร์โค้ดลงทะเบียน (QR Code Generator)</h2>
              <p className="text-xs text-emerald-100">สำหรับติดป้ายหน้าสนามกีฬา หรือประจำคอร์ทกีฬา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง QR Code"
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Controls: Select Stadium & Court */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลือกสนามกีฬาประจำเขต
              </label>
              <select
                value={selectedStadiumId}
                onChange={(e) => setSelectedStadiumId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {stadiums.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.districtName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จุดติดตั้ง / ป้ายประจำจุด
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">📍 ทางเข้าหลัก (ทุกประเภทกีฬา)</option>
                {currentStadium.sportsAvailable.map((sport) => (
                  <option key={sport} value={sport}>
                    🎯 หน้าสนาม: {sport}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* QR Code Poster Preview Box */}
          <div className="bg-gradient-to-b from-slate-50 to-emerald-50/40 p-5 rounded-2xl border border-emerald-100 text-center flex flex-col items-center">
            {/* Poster Header */}
            <div className="mb-3">
              <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wide uppercase mb-1">
                กรุงเทพมหานคร • BMA SPORTS
              </span>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {currentStadium.name}
              </h3>
              <p className="text-xs text-emerald-700 font-medium">
                {selectedSport === 'all'
                  ? 'จุดลงทะเบียนทางเข้าหลัก'
                  : `จุดลงทะเบียนโซน: ${selectedSport}`}
              </p>
            </div>

            {/* QR Canvas */}
            <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-emerald-600 inline-block">
              <canvas ref={canvasRef} className="rounded-lg max-w-full" />
            </div>

            <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600 inline" />
              <span>ใช้กล้องมือถือสแกน เพื่อลงทะเบียนเข้าใช้สนาม</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ไม่ต้องโหลดแอพ • บันทึกอายุและประเภทกีฬา • ตรวจสอบความจุแบบเรียลไทม์
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              onClick={handleDownload}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด PNG</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition border border-slate-200"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition border border-slate-200"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ป้าย A4</span>
            </button>

            <button
              onClick={() => {
                onSimulateScanCheckIn(
                  currentStadium.id,
                  selectedSport !== 'all' ? (selectedSport as SportType) : undefined
                );
                onClose();
              }}
              className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <ExternalLink className="w-4 h-4 text-teal-600" />
              <span>ทดสอบสแกนทันที</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
