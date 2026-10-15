import React from 'react';
import { X, CheckCircle2, Clock, LogOut, Share2, MapPin, Sparkles } from 'lucide-react';
import { CheckInRecord } from '../types/index.ts';

interface CheckInPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CheckInRecord | null;
  onCheckOut: (recordId: string) => void;
}

export const CheckInPassModal: React.FC<CheckInPassModalProps> = ({
  isOpen,
  onClose,
  record,
  onCheckOut,
}) => {
  if (!isOpen || !record) return null;

  const checkInDate = new Date(record.checkInTime);
  const formattedTime = checkInDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = checkInDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Pass Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            aria-label="ปิดบัตรคิว"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-3 backdrop-blur-xs shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-emerald-100" />
          </div>

          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-200 text-xs font-semibold mb-1">
            <Sparkles className="w-3 h-3" />
            <span>เช็คอินสำเร็จเรียบร้อย</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight">บัตรเข้าใช้สนามกีฬา</h2>
          <p className="text-xs text-emerald-100 mt-0.5">กรุงเทพมหานคร (BMA Sports)</p>
        </div>

        {/* Ticket Perforation / Sawtooth border visual */}
        <div className="relative bg-emerald-50 px-6 py-2 border-b border-dashed border-emerald-300 flex items-center justify-between text-xs text-emerald-800">
          <span className="font-mono font-semibold">PASS #{record.id.slice(-6).toUpperCase()}</span>
          <span className="font-medium">{formattedDate}</span>
        </div>

        {/* Pass Details */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center space-x-1 text-xs text-slate-500 mb-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>สนามกีฬา / เขต</span>
            </div>
            <p className="text-base font-bold text-slate-900 leading-snug">{record.stadiumName}</p>
            <p className="text-xs text-slate-500 font-medium">เขต{record.districtName} ({record.zone})</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">ประเภทกีฬา</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{record.sportType}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">เวลาเช็คอิน</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{formattedTime} น.</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">อายุ / กลุ่ม</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{record.age} ปี</span>
              <span className="text-[10px] text-emerald-600 block leading-tight">{record.ageGroup}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">จำนวนผู้เล่น</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{record.partySize} คน</span>
              <span className="text-[10px] text-slate-500 block">ประมาณ {record.durationMinutes} นาที</span>
            </div>
          </div>

          {/* Active status pulse */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-semibold text-emerald-900">สถานะ: กำลังใช้งานสนาม</span>
            </div>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                onCheckOut(record.id);
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>เช็คเอาท์ (เสร็จสิ้นการใช้งานเพื่อคืนพื้นที่)</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-800 font-medium transition"
            >
              ปิดหน้าต่าง (เก็บบัตรไว้นี้)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
