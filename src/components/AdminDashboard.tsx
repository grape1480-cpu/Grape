import React, { useState, useMemo } from 'react';
import {
  Users,
  Activity,
  AlertTriangle,
  Trophy,
  Calendar,
  Download,
  Filter,
  TrendingUp,
  Clock,
  HeartPulse,
  MapPin,
  RefreshCw,
  Plus,
  Minus,
  Search,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { BangkokZone, CheckInRecord, SportType, Stadium } from '../types/index.ts';
import { BANGKOK_ZONES } from '../data/bangkokDistricts.ts';
import {
  exportRecordsToCsv,
  getAgeDistribution,
  getCapacityStatus,
  getHourlyPeakAnalysis,
  getSportPopularity,
} from '../utils/sportsLogic.ts';

interface AdminDashboardProps {
  records: CheckInRecord[];
  stadiums: Stadium[];
  onUpdateOccupancy: (stadiumId: string, delta: number) => void;
  onOpenQr: (stadiumId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  records,
  stadiums,
  onUpdateOccupancy,
  onOpenQr,
}) => {
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Filter records based on selected timeframe
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return records.filter((r) => {
      // Date filter
      const recordDateStr = r.checkInTime.slice(0, 10);
      let matchDate = true;
      if (dateRange === 'today') {
        matchDate = recordDateStr === todayStr;
      } else if (dateRange === '7days') {
        const diffMs = now.getTime() - new Date(r.checkInTime).getTime();
        matchDate = diffMs <= 7 * 86400000;
      } else if (dateRange === '30days') {
        const diffMs = now.getTime() - new Date(r.checkInTime).getTime();
        matchDate = diffMs <= 30 * 86400000;
      }

      // Zone filter
      const matchZone = selectedZone === 'all' || r.zone === selectedZone;

      // Sport filter
      const matchSport = selectedSport === 'all' || r.sportType === selectedSport;

      return matchDate && matchZone && matchSport;
    });
  }, [records, dateRange, selectedZone, selectedSport]);

  // Aggregate Metrics
  const totalCheckIns = filteredRecords.reduce((sum, r) => sum + (r.partySize || 1), 0);
  const activeNow = records.filter((r) => r.isActive).reduce((sum, r) => sum + (r.partySize || 1), 0);

  // Overcrowded stadiums
  const overcrowdedStadiums = stadiums.filter(
    (s) => getCapacityStatus(s.currentOccupancy, s.maxCapacity).isOvercrowded
  );

  // Analytics aggregations
  const sportRanking = useMemo(() => getSportPopularity(filteredRecords), [filteredRecords]);
  const ageDistribution = useMemo(() => getAgeDistribution(filteredRecords), [filteredRecords]);
  const hourlyPeaks = useMemo(() => getHourlyPeakAnalysis(filteredRecords), [filteredRecords]);

  // Daily Check-ins Aggregation for the Bar Chart
  const dailyTrends = useMemo(() => {
    const map: Record<string, number> = {};
    const days = 7;
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }

    for (const r of records) {
      const key = r.checkInTime.slice(0, 10);
      if (map[key] !== undefined) {
        map[key] += r.partySize || 1;
      }
    }

    return Object.entries(map).map(([dateStr, count]) => {
      const d = new Date(dateStr);
      const label = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
      return { dateStr, label, count };
    });
  }, [records]);

  const maxDailyCount = Math.max(...dailyTrends.map((d) => d.count), 1);

  // Top Stadiums by usage
  const stadiumUsageRanking = useMemo(() => {
    const map = new Map<string, { stadium: Stadium; count: number }>();
    for (const s of stadiums) {
      map.set(s.id, { stadium: s, count: 0 });
    }
    for (const r of filteredRecords) {
      const item = map.get(r.stadiumId);
      if (item) {
        item.count += r.partySize || 1;
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [stadiums, filteredRecords]);

  // Export CSV Handler
  const handleExportCsv = () => {
    const csvData = exportRecordsToCsv(filteredRecords);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BMA_Sports_Checkin_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold mb-1 border border-teal-200">
            <span>สำนักวัฒนธรรม กีฬา และการท่องเที่ยว กทม.</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard สถิติการใช้งานสนามกีฬา 50 เขต
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            วิเคราะห์ความนิยม พฤติกรรมผู้ใช้ตามช่วงอายุ และควบคุมความปลอดภัยความหนาแน่น
          </p>
        </div>

        {/* Global Action: Export CSV */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออกรายงาน (CSV)</span>
          </button>
        </div>
      </div>

      {/* Date & Demographic Filters Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Time Filter Buttons */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          <button
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              dateRange === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            วันนี้
          </button>
          <button
            onClick={() => setDateRange('7days')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              dateRange === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 วันล่าสุด
          </button>
          <button
            onClick={() => setDateRange('30days')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              dateRange === '30days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 วัน
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              dateRange === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด
          </button>
        </div>

        {/* Zone Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">โซน:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">ทุกโซนใน กทม.</option>
            {BANGKOK_ZONES.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        {/* Active Sample count */}
        <span className="text-slate-400">
          แสดงข้อมูลจาก <strong>{filteredRecords.length}</strong> รายการเช็คอิน
        </span>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Check-in */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              ผู้เข้าใช้บริการรวม ({dateRange === 'today' ? 'วันนี้' : 'ช่วงเวลาที่เลือก'})
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {totalCheckIns.toLocaleString()} <span className="text-xs font-normal text-slate-500">คน-ครั้ง</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>อัตราการใช้งานต่อเนื่อง</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Current Active Inside */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              กำลังใช้บริการอยู่ในสนาม
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 mt-1">
              {activeNow.toLocaleString()} <span className="text-xs font-normal text-slate-500">คน ณ ขณะนี้</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              กระจายใน 50 เขตทั่วกรุง
            </div>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Overcrowded Safety Alert */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              สนามที่ความหนาแน่นเกินเกณฑ์
            </span>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${overcrowdedStadiums.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {overcrowdedStadiums.length} <span className="text-xs font-normal text-slate-500">แห่ง</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {overcrowdedStadiums.length > 0 ? '⚠️ กำลังแจ้งเตือนผู้ใช้' : '✅ ทุกสนามปลอดภัย'}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${overcrowdedStadiums.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Top Sport */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              กีฬายอดนิยมอันดับ 1
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1 line-clamp-1">
              {sportRanking[0]?.sport || 'ฟุตบอล / ฟุตซอล'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              สัดส่วน {sportRanking[0]?.percentage || 0}% ของผู้เล่นทั้งหมด
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Row: Daily Usage Chart & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Usage Chart (7 Days Bar Chart) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                สถิติการใช้งานแบบรายวัน (Daily Check-ins Trend)
              </h3>
              <p className="text-xs text-slate-500">ปริมาณผู้ใช้บริการรายวัน 7 วันย้อนหลัง</p>
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              อัปเดตอัตโนมัติ
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {dailyTrends.map((item) => {
              const heightPercent = Math.max(12, Math.round((item.count / maxDailyCount) * 100));
              const isToday = item.dateStr === new Date().toISOString().slice(0, 10);

              return (
                <div key={item.dateStr} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[11px] font-bold text-slate-700 mb-1 opacity-80 group-hover:opacity-100">
                    {item.count}
                  </span>
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday ? 'bg-emerald-600' : 'bg-teal-500/80 group-hover:bg-teal-600'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className={`text-[10px] mt-2 font-medium text-center truncate w-full ${isToday ? 'text-emerald-800 font-bold' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span>แท่งสีเขียวเข้มคือวันปัจจุบัน (Today)</span>
            <span>จุดประสงค์: วิเคราะห์ความนิยมเพื่อจัดสรรเจ้าหน้าที่และเวลาเปิดปิด</span>
          </div>
        </div>

        {/* Peak Hours Analysis */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>ช่วงเวลาที่มีการใช้งานสูงสุด (Peak Hours)</span>
              </h3>
              <p className="text-xs text-slate-500">สถิติความหนาแน่นตลอด 24 ชั่วโมง</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
              <span className="text-base">⏰</span>
              <div>
                <strong>ช่วงเวลาเร่งด่วนประจำวัน:</strong>
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-slate-700">
                  <li>รอบเช้า: <strong>05:30 - 08:00 น.</strong> (วิ่ง/จ็อกกิ้ง, โยคะ, แบดมินตัน)</li>
                  <li>รอบเย็น: <strong>17:00 - 20:30 น.</strong> (ฟุตซอล, บาสเกตบอล, สระว่ายน้ำ, ฟิตเนส)</li>
                </ul>
              </div>
            </div>

            {/* Top 4 peak hour buckets */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">สัดส่วนผู้ใช้บริการตามช่วงเวลา:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">เช้า (05:00-09:00)</span>
                  <span className="font-bold text-slate-800 text-sm">28% ของวัน</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">กลางวัน (09:00-15:00)</span>
                  <span className="font-bold text-slate-800 text-sm">12% ของวัน</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 block text-[11px]">เย็น (16:00-19:00) 🔥</span>
                  <span className="font-bold text-emerald-900 text-sm">45% ของวัน</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">ค่ำ (19:00-22:00)</span>
                  <span className="font-bold text-slate-800 text-sm">15% ของวัน</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Age Demographics & Sports Popularity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Age Demographics Breakdown */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                <span>การกระจายกลุ่มอายุผู้ใช้งาน (Age Demographics)</span>
              </h3>
              <p className="text-xs text-slate-500">ข้อมูลจากแบบฟอร์มลงทะเบียนเพื่อวิเคราะห์นโยบายกีฬา กทม.</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {ageDistribution.map((item) => (
              <div key={item.ageGroup} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-800">{item.ageGroup}</span>
                  <span className="text-slate-600">
                    <strong>{item.count}</strong> คน ({item.percentage}%) • เฉลี่ย {item.avgDuration} นาที
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sports Popularity Ranking */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>อันดับความนิยมประเภทกีฬา (Sports Popularity)</span>
              </h3>
              <p className="text-xs text-slate-500">จำแนกตามจำนวนผู้เล่นที่เช็คอิน</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {sportRanking.slice(0, 6).map((item, idx) => (
              <div
                key={item.sport}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-amber-400 text-amber-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{item.sport}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{item.totalParticipants} คน</span>
                  <span className="text-[11px] text-slate-400 ml-1.5">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Stadium Real-time Occupancy & Live Gatekeeper Adjustment Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              การควบคุมความหนาแน่นสนามกีฬาประจำเขต (Gatekeeper Live Control)
            </h3>
            <p className="text-xs text-slate-500">
              ตรวจสอบความจุปลอดภัย ปรับยอดคนเข้า-ออก และสร้าง QR Code ประจำจุด
            </p>
          </div>
          <span className="text-xs text-slate-500">
            ระบบความปลอดภัยแจ้งเตือนอัตโนมัติเมื่อเกิน 80% และ 95%
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">ชื่อสนามกีฬา / เขต</th>
                <th className="py-2.5 px-3">โซน</th>
                <th className="py-2.5 px-3">ความจุขณะนี้ / สูงสุด</th>
                <th className="py-2.5 px-3">ระดับความหนาแน่น</th>
                <th className="py-2.5 px-3">สถานะความปลอดภัย</th>
                <th className="py-2.5 px-3 text-center">ปรับยอดคน (จนท. ประตู)</th>
                <th className="py-2.5 px-3 text-right">QR Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stadiums.map((stadium) => {
                const status = getCapacityStatus(
                  stadium.currentOccupancy,
                  stadium.maxCapacity,
                  stadium.id
                );

                return (
                  <tr key={stadium.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{stadium.name}</div>
                      <div className="text-[11px] text-slate-500">เขต{stadium.districtName}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{stadium.zone}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {stadium.currentOccupancy} / {stadium.maxCapacity} คน
                      </div>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status.level === 'critical'
                              ? 'bg-rose-500'
                              : status.level === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(status.percentage, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{status.percentage}%</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          status.level === 'critical'
                            ? 'bg-rose-100 text-rose-700 border border-rose-300'
                            : status.level === 'warning'
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}
                      >
                        {status.level === 'critical'
                          ? '🚨 อันตราย (ชะลอรับคน)'
                          : status.level === 'warning'
                          ? '⚠️ หนาแน่นใกล้เต็ม'
                          : '🟢 ปกติ'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          onClick={() => onUpdateOccupancy(stadium.id, -5)}
                          className="p-1 hover:bg-white text-slate-600 rounded transition"
                          title="ลดลง 5 คน (เช็คเอาท์)"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1 text-[11px] font-mono font-semibold">
                          {stadium.currentOccupancy}
                        </span>
                        <button
                          onClick={() => onUpdateOccupancy(stadium.id, 5)}
                          className="p-1 hover:bg-white text-emerald-700 rounded transition"
                          title="เพิ่มขึ้น 5 คน (เช็คอิน)"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onOpenQr(stadium.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg border border-slate-200 text-xs font-medium transition"
                      >
                        ป้าย QR
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row: Searchable Activity Log Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              ประวัติการลงทะเบียนเช็คอินล่าสุด (Check-in Records Log)
            </h3>
            <p className="text-xs text-slate-500">บันทึกข้อมูลอายุ เพศ และประเภทกีฬาแบบรายบุคคล/กลุ่ม</p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="ค้นหาชื่อผู้ใช้, กีฬา, หรือสนาม..."
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">เวลาเช็คอิน</th>
                <th className="py-2.5 px-3">ชื่อ / ข้อมูลติดต่อ</th>
                <th className="py-2.5 px-3">สนามกีฬา / เขต</th>
                <th className="py-2.5 px-3">ประเภทกีฬา</th>
                <th className="py-2.5 px-3">อายุ / กลุ่มประชากร</th>
                <th className="py-2.5 px-3">เพศ</th>
                <th className="py-2.5 px-3">จำนวนคน</th>
                <th className="py-2.5 px-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords
                .filter((r) => {
                  if (!tableSearch.trim()) return true;
                  const q = tableSearch.toLowerCase();
                  return (
                    (r.userName && r.userName.toLowerCase().includes(q)) ||
                    r.sportType.toLowerCase().includes(q) ||
                    r.stadiumName.toLowerCase().includes(q) ||
                    r.districtName.toLowerCase().includes(q)
                  );
                })
                .slice(0, 15)
                .map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {new Date(record.checkInTime).toLocaleString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })} น.
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {record.userName || 'ประชาชน'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{record.stadiumName}</div>
                      <div className="text-[11px] text-slate-400">เขต{record.districtName}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium text-[11px]">
                        {record.sportType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{record.age} ปี</div>
                      <div className="text-[10px] text-slate-400">{record.ageGroup}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{record.gender}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{record.partySize} คน</td>
                    <td className="py-2.5 px-3">
                      {record.isActive ? (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                          กำลังใช้งาน
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">เช็คเอาท์แล้ว</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
