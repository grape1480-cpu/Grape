import React from 'react';
import { X, MapPin, Clock, Phone, Sparkles, UserCheck, QrCode, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Stadium, SportType } from '../types/index.ts';
import { getCapacityStatus } from '../utils/sportsLogic.ts';

interface StadiumDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stadium: Stadium | null;
  onStartCheckIn: (stadium: Stadium, sport?: SportType) => void;
  onOpenQr: (stadiumId: string) => void;
}

export const StadiumDetailModal: React.FC<StadiumDetailModalProps> = ({
  isOpen,
  onClose,
  stadium,
  onStartCheckIn,
  onOpenQr,
}) => {
  if (!isOpen || !stadium) return null;

  const capacityStatus = getCapacityStatus(stadium.currentOccupancy, stadium.maxCapacity, stadium.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-start justify-between relative">
          <div>
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 text-xs font-medium mb-1">
              <span>{stadium.zone}</span>
              <span>•</span>
              <span>เขต{stadium.districtName}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold leading-snug">{stadium.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดรายละเอียดสนามกีฬา"
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Readiness & Safety Meter */}
        <div className="p-5 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">สถานะความพร้อม & ความหนาแน่นขณะนี้</span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                capacityStatus.level === 'critical'
                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                  : capacityStatus.level === 'warning'
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              }`}
            >
              {capacityStatus.isOvercrowded ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>
                {capacityStatus.level === 'critical'
                  ? 'หนาแน่นสูงสุด (ชะลอรับคน)'
                  : capacityStatus.level === 'warning'
                  ? 'หนาแน่น (ใกล้เต็ม)'
                  : 'พร้อมใช้งานปกติ'}
              </span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityStatus.level === 'critical'
                    ? 'bg-rose-500'
                    : capacityStatus.level === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(capacityStatus.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>กำลังใช้งาน: <strong className="text-slate-800">{stadium.currentOccupancy}</strong> คน</span>
              <span>ความจุปลอดภัย: <strong>{stadium.maxCapacity}</strong> คน ({capacityStatus.percentage}%)</span>
            </div>
          </div>

          {capacityStatus.isOvercrowded && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 leading-relaxed">
              {capacityStatus.alertMessage}
            </p>
          )}
        </div>

        {/* Stadium Info & Amenities */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs sm:text-sm">
          {/* Location & Time */}
          <div className="space-y-2 text-slate-600">
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{stadium.address}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>เปิดให้บริการ: <strong className="text-slate-800">{stadium.openingHours}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>โทรศัพท์สอบถาม: <strong className="text-slate-800">{stadium.phone}</strong></span>
            </div>
          </div>

          {/* Available Sports */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
              <span>ประเภทกีฬาที่มีให้บริการในสนามนี้</span>
              <span className="text-xs font-normal text-slate-500">({stadium.sportsAvailable.length} ประเภท)</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {stadium.sportsAvailable.map((sport) => (
                <button
                  key={sport}
                  onClick={() => {
                    onStartCheckIn(stadium, sport);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200 transition flex items-center space-x-1"
                >
                  <span>{sport}</span>
                  <span className="text-emerald-500 text-[10px]">เช็คอิน</span>
                </button>
              ))}
            </div>
          </div>

          {/* Facilities / Amenities */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">สิ่งอำนวยความสะดวก</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {stadium.amenities.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onOpenQr(stadium.id);
              onClose();
            }}
            className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>สร้างป้าย QR Code</span>
          </button>

          <button
            onClick={() => {
              onStartCheckIn(stadium);
              onClose();
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            <span>ลงทะเบียนเข้าใช้งานทันที</span>
          </button>
        </div>
      </div>
    </div>
  );
};
