import React, { useState } from 'react';
import { X, UserCheck, AlertTriangle, Clock, Users, ShieldCheck, HeartPulse } from 'lucide-react';
import { Gender, SportType, Stadium } from '../types/index.ts';
import { SPORT_CATEGORIES } from '../data/bangkokDistricts.ts';
import { calculateAgeGroup, getCapacityStatus } from '../utils/sportsLogic.ts';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  stadium: Stadium | null;
  allStadiums: Stadium[];
  onConfirmCheckIn: (data: {
    stadiumId: string;
    userName: string;
    phone: string;
    age: number;
    gender: Gender;
    sportType: SportType;
    durationMinutes: number;
    partySize: number;
  }) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  stadium,
  allStadiums,
  onConfirmCheckIn,
}) => {
  const [selectedStadiumId, setSelectedStadiumId] = useState<string>(stadium ? stadium.id : allStadiums[0]?.id || '');
  const [age, setAge] = useState<number | ''>(25);
  const [gender, setGender] = useState<Gender>('ชาย');
  const [sportType, setSportType] = useState<SportType>('ฟุตบอล / ฟุตซอล');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [partySize, setPartySize] = useState<number>(1);
  const [userName, setUserName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const currentStadium = allStadiums.find((s) => s.id === (stadium ? stadium.id : selectedStadiumId)) || stadium || allStadiums[0];
  const capacityStatus = currentStadium ? getCapacityStatus(currentStadium.currentOccupancy, currentStadium.maxCapacity, currentStadium.id) : null;
  const computedAgeGroup = typeof age === 'number' && age > 0 ? calculateAgeGroup(age) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStadium) {
      setErrorMsg('กรุณาเลือกสนามกีฬา');
      return;
    }
    if (age === '' || isNaN(Number(age)) || Number(age) < 3 || Number(age) > 110) {
      setErrorMsg('กรุณากรอกอายุที่ถูกต้อง (3 - 110 ปี)');
      return;
    }
    if (partySize < 1 || partySize > 30) {
      setErrorMsg('จำนวนผู้เล่นต้องอยู่ระหว่าง 1 ถึง 30 คน');
      return;
    }

    setErrorMsg('');
    onConfirmCheckIn({
      stadiumId: currentStadium.id,
      userName: userName.trim() || 'ผู้ใช้บริการ กทม.',
      phone: phone.trim(),
      age: Number(age),
      gender,
      sportType,
      durationMinutes,
      partySize,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">เช็คอินเข้าใช้บริการสนามกีฬา</h2>
              <p className="text-xs text-emerald-100">ระบบบันทึกสถิติและควบคุมความปลอดภัย กทม.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stadium Capacity Status Banner inside form */}
        {currentStadium && capacityStatus && (
          <div
            className={`px-4 py-2.5 flex items-center justify-between text-xs border-b ${
              capacityStatus.level === 'critical'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : capacityStatus.level === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center space-x-1.5 font-medium">
              {capacityStatus.isOvercrowded ? (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              ) : (
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              )}
              <span>ความจุสนาม: {currentStadium.currentOccupancy}/{currentStadium.maxCapacity} คน ({capacityStatus.percentage}%)</span>
            </div>
            <span className="font-semibold px-2 py-0.5 rounded-full text-[11px] bg-white border border-current">
              {capacityStatus.level === 'critical'
                ? 'หนาแน่นสูงสุด'
                : capacityStatus.level === 'warning'
                ? 'หนาแน่น'
                : 'พร้อมใช้งาน'}
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Stadium Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              สนามกีฬาที่เข้าใช้บริการ <span className="text-rose-500">*</span>
            </label>
            <select
              value={stadium ? stadium.id : selectedStadiumId}
              onChange={(e) => setSelectedStadiumId(e.target.value)}
              disabled={!!stadium}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {allStadiums.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (เขต{s.districtName})
                </option>
              ))}
            </select>
          </div>

          {/* Sport Type Selector (Required by User Prompt) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ระบุประเภทกีฬาที่ใช้บริการ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPORT_CATEGORIES.map((sport) => (
                <button
                  key={sport.name}
                  type="button"
                  onClick={() => {
                    setSportType(sport.name);
                    setDurationMinutes(sport.defaultDuration);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2 ${
                    sportType === sport.name
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-lg">{sport.icon}</span>
                  <span className="text-xs font-medium leading-tight line-clamp-1">{sport.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Age & Demographic Bracket (Required by User Prompt) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="age-input" className="block text-xs font-semibold text-slate-700 mb-1">
                อายุ (ปี) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="age-input"
                  type="number"
                  min="3"
                  max="110"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="เช่น 25"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">ปี</span>
              </div>
              {computedAgeGroup && (
                <div className="mt-1 flex items-center space-x-1 text-[11px] text-emerald-700 font-medium">
                  <HeartPulse className="w-3 h-3 text-emerald-600" />
                  <span>กลุ่ม: {computedAgeGroup}</span>
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เพศ <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="LGBTQ+">LGBTQ+</option>
                <option value="ไม่ระบุ">ไม่ระบุ</option>
              </select>
            </div>
          </div>

          {/* Party Size & Estimated Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>จำนวนผู้ร่วมเล่น (คน)</span>
                <span className="text-slate-400 font-normal">รวมตัวคุณ</span>
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={partySize}
                    onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                  <Users className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระยะเวลาที่คาดว่าจะใช้
              </label>
              <div className="relative">
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value={30}>30 นาที</option>
                  <option value={45}>45 นาที</option>
                  <option value={60}>1 ชั่วโมง (60 นาที)</option>
                  <option value={90}>1.5 ชั่วโมง (90 นาที)</option>
                  <option value={120}>2 ชั่วโมง (120 นาที)</option>
                  <option value={180}>3 ชั่วโมง (180 นาที)</option>
                </select>
                <Clock className="w-4 h-4 text-slate-400 absolute right-8 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Optional user info for contact/membership */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-medium text-slate-500 mb-2">ข้อมูลผู้ติดต่อ (กรอกหรือไม่กรอกก็ได้ สะดวกและรวดเร็ว)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="tel"
                placeholder="เบอร์โทรศัพท์ (ถ้ามี)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>ยืนยันการเช็คอิน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
