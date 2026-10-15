import React, { useState } from 'react';
import { AlertTriangle, Volume2, VolumeX, ChevronDown, ChevronUp, MapPin, ArrowRight } from 'lucide-react';
import { Stadium } from '../types/index.ts';
import { getCapacityStatus } from '../utils/sportsLogic.ts';

interface SafetyAlertBannerProps {
  stadiums: Stadium[];
  onSelectStadium: (stadium: Stadium) => void;
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({
  stadiums,
  onSelectStadium,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Find stadiums that are in warning or critical state
  const overcrowdedStadiums = stadiums
    .map((s) => ({
      stadium: s,
      status: getCapacityStatus(s.currentOccupancy, s.maxCapacity, s.id),
    }))
    .filter((item) => item.status.isOvercrowded);

  if (overcrowdedStadiums.length === 0) {
    return null;
  }

  const criticalCount = overcrowdedStadiums.filter((s) => s.status.level === 'critical').length;

  const playAlertSound = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  };

  return (
    <div className={`transition-all border-b ${criticalCount > 0 ? 'bg-amber-500/15 border-amber-400/30 text-amber-950' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Alert Title */}
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded-lg ${criticalCount > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-white'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold">
                {criticalCount > 0 ? 'แจ้งเตือนความปลอดภัยสูงสุด: ' : 'แจ้งเตือนความหนาแน่น: '}
                พบ {overcrowdedStadiums.length} สนามกีฬาเกินเกณฑ์มาตรฐานความปลอดภัย
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600">
                ระบบแนะนำให้ผู้ใช้ชะลอการเดินทาง หรือเลือกใช้สนามกีฬาใกล้เคียงในโซนเดียวกัน
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                if (nextMuted === false) {
                  playAlertSound();
                }
              }}
              aria-label={isMuted ? 'เปิดเสียงแจ้งเตือนความปลอดภัย' : 'ปิดเสียงแจ้งเตือน'}
              className="px-2.5 py-1 text-xs font-medium rounded bg-white/80 hover:bg-white border border-amber-300 text-slate-700 flex items-center space-x-1"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">เปิดเสียงเตือน</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">เสียงเปิดอยู่</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              className="px-2.5 py-1 text-xs font-medium rounded bg-amber-600 text-white hover:bg-amber-700 flex items-center space-x-1 shadow-sm"
            >
              <span>{isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายชื่อสนามที่หนาแน่น'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded List of Overcrowded Stadiums */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {overcrowdedStadiums.map(({ stadium, status }) => (
              <div
                key={stadium.id}
                className="bg-white/95 rounded-lg p-2.5 border border-amber-300 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1">
                      {stadium.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                        status.level === 'critical'
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-amber-100 text-amber-700 border border-amber-300'
                      }`}
                    >
                      {status.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>เขต{stadium.districtName} ({stadium.zone})</span>
                  </div>
                  <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${status.level === 'critical' ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(status.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>ความจุ: {stadium.currentOccupancy} / {stadium.maxCapacity} คน</span>
                    <span className="text-rose-600 font-medium">
                      {status.level === 'critical' ? 'เกินขีดจำกัด' : 'ใกล้เต็ม'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectStadium(stadium)}
                  className="mt-2 w-full py-1 text-center text-xs text-amber-800 font-medium bg-amber-50 hover:bg-amber-100 rounded flex items-center justify-center space-x-1 transition"
                >
                  <span>ดูรายละเอียด / ทางเลือก</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
