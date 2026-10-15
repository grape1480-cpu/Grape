import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Clock,
  UserCheck,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Info,
  Filter,
  CheckCircle,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { BangkokZone, SportType, Stadium } from '../types/index.ts';
import { BANGKOK_ZONES, SPORT_CATEGORIES } from '../data/bangkokDistricts.ts';
import { getCapacityStatus } from '../utils/sportsLogic.ts';

interface CitizenViewProps {
  stadiums: Stadium[];
  onOpenCheckIn: (stadium: Stadium, sport?: SportType) => void;
  onOpenDetail: (stadium: Stadium) => void;
  onOpenQr: (stadiumId: string) => void;
  onOpenScanner: () => void;
}

export const CitizenView: React.FC<CitizenViewProps> = ({
  stadiums,
  onOpenCheckIn,
  onOpenDetail,
  onOpenQr,
  onOpenScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'warning'>('all');

  // Filter stadiums based on search, zone, sport, and status
  const filteredStadiums = useMemo(() => {
    return stadiums.filter((stadium) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        stadium.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stadium.districtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stadium.sportsAvailable.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchZone = selectedZone === 'all' || stadium.zone === selectedZone;

      const matchSport =
        selectedSport === 'all' || stadium.sportsAvailable.includes(selectedSport as SportType);

      const status = getCapacityStatus(stadium.currentOccupancy, stadium.maxCapacity, stadium.id);
      let matchStatus = true;
      if (statusFilter === 'available') {
        matchStatus = status.level === 'normal';
      } else if (statusFilter === 'warning') {
        matchStatus = status.isOvercrowded;
      }

      return matchSearch && matchZone && matchSport && matchStatus;
    });
  }, [stadiums, searchTerm, selectedZone, selectedSport, statusFilter]);

  // Count summaries
  const totalStadiums = stadiums.length;
  const availableCount = stadiums.filter(
    (s) => getCapacityStatus(s.currentOccupancy, s.maxCapacity).level === 'normal'
  ).length;
  const warningCount = stadiums.filter(
    (s) => getCapacityStatus(s.currentOccupancy, s.maxCapacity).isOvercrowded
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner for Citizens */}
      <section className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Background decorative shapes */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ระบบตรวจสอบสถานะความพร้อมแบบเรียลไทม์ 24 ชม.</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            เช็คความพร้อมสนามกีฬา กทม. <br className="hidden sm:inline" />
            <span className="text-emerald-300">รู้ความหนาแน่นก่อนเดินทางจริง</span>
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
            ตรวจสอบความจุสนามกีฬาทุกเขตในกรุงเทพมหานคร ลงทะเบียนเช็คอินผ่านสมาร์ทโฟน
            และรับการแจ้งเตือนความปลอดภัยเพื่อสุขภาพที่ดีของคนกรุงเทพฯ
          </p>

          {/* Quick Action: Real Camera QR Scan */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenScanner}
              className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-emerald-950/20 flex items-center space-x-2"
            >
              <QrCode className="w-4 h-4 text-emerald-950" />
              <span>📷 สแกน QR Code หน้าสนามจริง เพื่อเช็คอินทันที</span>
            </button>
          </div>

          {/* Quick Metrics Bar on Mobile */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4 max-w-xl">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-white/10 text-center">
              <span className="block text-lg sm:text-2xl font-bold text-white">{totalStadiums}</span>
              <span className="text-[10px] sm:text-xs text-emerald-200">สนามที่ติดตาม</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-white/10 text-center">
              <span className="block text-lg sm:text-2xl font-bold text-emerald-300">{availableCount}</span>
              <span className="text-[10px] sm:text-xs text-emerald-200">พร้อมใช้งาน (ว่าง)</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-white/10 text-center">
              <span className="block text-lg sm:text-2xl font-bold text-rose-300">{warningCount}</span>
              <span className="text-[10px] sm:text-xs text-emerald-200">หนาแน่นสูง</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อสนาม, เขต (เช่น ดินแดง, จตุจักร), หรือกีฬา..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* Sport Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="all">🎯 กีฬาทุกประเภท (All Sports)</option>
              {SPORT_CATEGORIES.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Status Filter Buttons */}
          <div className="md:col-span-3 flex bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition text-center ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition text-center ${
                statusFilter === 'available'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🟢 ว่าง
            </button>
            <button
              onClick={() => setStatusFilter('warning')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition text-center ${
                statusFilter === 'warning'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔴 หนาแน่น
            </button>
          </div>
        </div>

        {/* Bangkok Zone Chips */}
        <div className="pt-2 border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" />
            โซน กทม:
          </span>
          <button
            onClick={() => setSelectedZone('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
              selectedZone === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ทุกโซน
          </button>
          {BANGKOK_ZONES.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedZone === zone
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </section>

      {/* Stadium List / Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>รายชื่อสนามกีฬาประจำเขต</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              พบ {filteredStadiums.length} แห่ง
            </span>
          </h2>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            อัปเดตข้อมูลความจุแบบเรียลไทม์
          </span>
        </div>

        {filteredStadiums.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800">ไม่พบสนามกีฬาที่ตรงกับเงื่อนไข</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ลองค้นหาด้วยคำค้นอื่น หรือล้างตัวกรองเพื่อดูสนามกีฬาของกรุงเทพมหานครทั้งหมด
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedZone('all');
                setSelectedSport('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-700 transition"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStadiums.map((stadium) => {
              const status = getCapacityStatus(
                stadium.currentOccupancy,
                stadium.maxCapacity,
                stadium.id
              );

              return (
                <div
                  key={stadium.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Zone & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                          เขต{stadium.districtName}
                        </span>
                        <span className="text-[11px] text-slate-400">{stadium.zone}</span>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                          status.level === 'critical'
                            ? 'bg-rose-100 text-rose-700 border border-rose-300'
                            : status.level === 'warning'
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}
                      >
                        {status.level === 'critical' ? (
                          <>
                            <Flame className="w-3 h-3 text-rose-600" />
                            <span>เต็ม {status.percentage}%</span>
                          </>
                        ) : status.level === 'warning' ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>หนาแน่น {status.percentage}%</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>ว่าง {status.percentage}%</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Stadium Title */}
                    <div>
                      <h3
                        onClick={() => onOpenDetail(stadium)}
                        className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-emerald-700 transition cursor-pointer line-clamp-1"
                      >
                        {stadium.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center space-x-1 mt-1 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{stadium.address}</span>
                      </p>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-medium">ความจุผู้ใช้ขณะนี้:</span>
                        <span className="font-bold text-slate-800">
                          {stadium.currentOccupancy} / {stadium.maxCapacity} คน
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            status.level === 'critical'
                              ? 'bg-rose-500'
                              : status.level === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(status.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>ขีดจำกัดความปลอดภัย</span>
                        <span
                          className={`font-semibold ${
                            status.isOvercrowded ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {status.alertMessage.slice(0, 32)}...
                        </span>
                      </div>
                    </div>

                    {/* Available Sports Pills */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">กีฬาที่ให้บริการ:</span>
                      <div className="flex flex-wrap gap-1">
                        {stadium.sportsAvailable.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium"
                          >
                            {s}
                          </span>
                        ))}
                        {stadium.sportsAvailable.length > 4 && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                            +{stadium.sportsAvailable.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Opening Hours */}
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 pt-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>เปิด {stadium.openingHours}</span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => onOpenQr(stadium.id)}
                      aria-label="สร้าง QR Code ของสนามนี้"
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60 rounded-xl transition"
                      title="สร้างป้าย QR Code ประจำสนาม"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onOpenDetail(stadium)}
                      className="px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-200/60 rounded-xl transition font-medium flex items-center space-x-1"
                    >
                      <span>ข้อมูลสนาม</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenCheckIn(stadium)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>เช็คอินเข้าใช้</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Safety Notice Footer Card */}
      <section className="bg-emerald-50 rounded-2xl p-4 sm:p-5 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold">มาตรฐานความปลอดภัยสนามกีฬา กรุงเทพมหานคร</h4>
            <p className="text-[11px] sm:text-xs text-emerald-800 leading-relaxed mt-0.5">
              ทุกศูนย์กีฬามีเจ้าหน้าที่รักษาความปลอดภัย ตู้กระตุกหัวใจอัตโนมัติ (AED)
              และควบคุมจำนวนผู้ใช้บริการไม่ให้เกินค่าความจุปลอดภัยเพื่อสุขอนามัยที่ดี
            </p>
          </div>
        </div>
        <div className="text-xs text-emerald-700 font-medium whitespace-nowrap bg-white px-3 py-1.5 rounded-xl border border-emerald-300">
          สายด่วน กทม. 1555
        </div>
      </section>
    </div>
  );
};
