import React, { useState, useEffect, useRef } from 'react';
import { BangkokZone, CheckInRecord, Gender, SportType, Stadium } from './types/index.ts';
import { BANGKOK_STADIUMS } from './data/bangkokDistricts.ts';
import { INITIAL_CHECKINS } from './data/initialRecords.ts';
import { calculateAgeGroup, getCapacityStatus } from './utils/sportsLogic.ts';
import { Navbar } from './components/Navbar.tsx';
import { SafetyAlertBanner } from './components/SafetyAlertBanner.tsx';
import { CitizenView } from './components/CitizenView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { CheckInModal } from './components/CheckInModal.tsx';
import { CheckInPassModal } from './components/CheckInPassModal.tsx';
import { QRCodeGeneratorModal } from './components/QRCodeGeneratorModal.tsx';
import { QRScannerModal } from './components/QRScannerModal.tsx';
import { StadiumDetailModal } from './components/StadiumDetailModal.tsx';

const STADIUMS_STORAGE_KEY = 'bma_stadiums_data_v1';
const RECORDS_STORAGE_KEY = 'bma_checkin_records_v1';
const ACTIVE_PASS_STORAGE_KEY = 'bma_active_pass_v1';

export default function App() {
  // Load stadiums from localStorage or initial seed
  const [stadiums, setStadiums] = useState<Stadium[]>(() => {
    try {
      const saved = localStorage.getItem(STADIUMS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return BANGKOK_STADIUMS;
  });

  // Load check-in records
  const [records, setRecords] = useState<CheckInRecord[]>(() => {
    try {
      const saved = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_CHECKINS;
  });

  // User's active check-in pass on this device
  const [activePass, setActivePass] = useState<CheckInRecord | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_PASS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // View state
  const [currentView, setCurrentView] = useState<'citizen' | 'admin'>('citizen');

  // Modals state
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInTargetStadium, setCheckInTargetStadium] = useState<Stadium | null>(null);
  const [preselectedSport, setPreselectedSport] = useState<SportType | undefined>(undefined);
  const [isCheckInFromQr, setIsCheckInFromQr] = useState(false);

  const [isOpenQrModal, setIsOpenQrModal] = useState(false);
  const [qrStadiumId, setQrStadiumId] = useState<string | undefined>(undefined);

  const [isOpenScannerModal, setIsOpenScannerModal] = useState(false);
  const hasHandledUrlRef = useRef(false);

  const [selectedDetailStadium, setSelectedDetailStadium] = useState<Stadium | null>(null);
  const [isOpenPassModal, setIsOpenPassModal] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STADIUMS_STORAGE_KEY, JSON.stringify(stadiums));
    } catch (e) {
      console.error(e);
    }
  }, [stadiums]);

  useEffect(() => {
    try {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }, [records]);

  useEffect(() => {
    try {
      if (activePass) {
        localStorage.setItem(ACTIVE_PASS_STORAGE_KEY, JSON.stringify(activePass));
      } else {
        localStorage.removeItem(ACTIVE_PASS_STORAGE_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activePass]);

  // Check URL params for QR Code scanned deep link
  useEffect(() => {
    if (hasHandledUrlRef.current) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const targetStadiumId = params.get('stadiumId');
      const targetSport = params.get('sport') as SportType | null;

      if (action === 'checkin' && targetStadiumId) {
        hasHandledUrlRef.current = true;
        const found = stadiums.find((s) => s.id === targetStadiumId);
        if (found) {
          setCheckInTargetStadium(found);
          if (targetSport) {
            setPreselectedSport(targetSport);
          }
          setIsCheckInFromQr(true);
          setIsCheckInOpen(true);

          // Clean URL so refresh doesn't force re-trigger
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    } catch {
      // ignore url search param failures
    }
  }, [stadiums]);

  // Capacity summaries
  const overcrowdedCount = stadiums.filter(
    (s) => getCapacityStatus(s.currentOccupancy, s.maxCapacity).isOvercrowded
  ).length;

  const totalActiveUsers = stadiums.reduce((sum, s) => sum + s.currentOccupancy, 0);

  // Handle Check-in Confirmation
  const handleConfirmCheckIn = (data: {
    stadiumId: string;
    userName: string;
    phone: string;
    age: number;
    gender: Gender;
    sportType: SportType;
    durationMinutes: number;
    partySize: number;
  }) => {
    const targetStadium = stadiums.find((s) => s.id === data.stadiumId);
    if (!targetStadium) return;

    const ageGroup = calculateAgeGroup(data.age);
    const newRecordId = `bma-ci-${Date.now().toString().slice(-6)}`;

    const newRecord: CheckInRecord = {
      id: newRecordId,
      stadiumId: targetStadium.id,
      stadiumName: targetStadium.name,
      districtName: targetStadium.districtName,
      zone: targetStadium.zone,
      userName: data.userName,
      phone: data.phone,
      age: data.age,
      ageGroup,
      gender: data.gender,
      sportType: data.sportType,
      durationMinutes: data.durationMinutes,
      partySize: data.partySize,
      checkInTime: new Date().toISOString(),
      isActive: true,
    };

    // 1. Add record
    setRecords((prev) => [newRecord, ...prev]);

    // 2. Increment stadium occupancy
    setStadiums((prev) =>
      prev.map((s) =>
        s.id === targetStadium.id
          ? { ...s, currentOccupancy: s.currentOccupancy + data.partySize }
          : s
      )
    );

    // 3. Set active pass and open ticket
    setActivePass(newRecord);
    setIsCheckInOpen(false);
    setIsOpenPassModal(true);
  };

  // Handle Check-out
  const handleCheckOut = (recordId: string) => {
    const rec = records.find((r) => r.id === recordId);
    if (!rec) return;

    const partyCount = rec.partySize || 1;

    // 1. Update record status
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? { ...r, isActive: false, checkOutTime: new Date().toISOString() }
          : r
      )
    );

    // 2. Decrement stadium occupancy safely
    setStadiums((prev) =>
      prev.map((s) =>
        s.id === rec.stadiumId
          ? { ...s, currentOccupancy: Math.max(0, s.currentOccupancy - partyCount) }
          : s
      )
    );

    // 3. Clear active pass if matching
    if (activePass?.id === recordId) {
      setActivePass(null);
    }
  };

  // Admin Manual Occupancy Adjustment
  const handleUpdateOccupancy = (stadiumId: string, delta: number) => {
    setStadiums((prev) =>
      prev.map((s) =>
        s.id === stadiumId
          ? { ...s, currentOccupancy: Math.max(0, Math.min(s.maxCapacity * 1.3, s.currentOccupancy + delta)) }
          : s
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        onOpenQrModal={() => {
          setQrStadiumId(undefined);
          setIsOpenQrModal(true);
        }}
        onOpenScannerModal={() => setIsOpenScannerModal(true)}
        overcrowdedCount={overcrowdedCount}
        totalActiveUsers={totalActiveUsers}
      />

      {/* Safety Alert Banner */}
      <SafetyAlertBanner
        stadiums={stadiums}
        onSelectStadium={(s) => {
          setSelectedDetailStadium(s);
        }}
      />

      {/* Floating Active Pass Bar if citizen is currently checked in */}
      {activePass && activePass.isActive && (
        <div className="bg-emerald-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-inner">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              คุณกำลังเช็คอินที่: <strong>{activePass.stadiumName}</strong> ({activePass.sportType})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsOpenPassModal(true)}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded-md font-medium text-white transition text-[11px]"
            >
              เปิดบัตรคิว
            </button>
            <button
              onClick={() => handleCheckOut(activePass.id)}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 rounded-md font-medium text-white transition text-[11px]"
            >
              เช็คเอาท์
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'citizen' ? (
          <CitizenView
            stadiums={stadiums}
            onOpenCheckIn={(stadium, sport) => {
              setCheckInTargetStadium(stadium);
              setPreselectedSport(sport);
              setIsCheckInFromQr(false);
              setIsCheckInOpen(true);
            }}
            onOpenDetail={(stadium) => setSelectedDetailStadium(stadium)}
            onOpenQr={(stadiumId) => {
              setQrStadiumId(stadiumId);
              setIsOpenQrModal(true);
            }}
            onOpenScanner={() => setIsOpenScannerModal(true)}
          />
        ) : (
          <AdminDashboard
            records={records}
            stadiums={stadiums}
            onUpdateOccupancy={handleUpdateOccupancy}
            onOpenQr={(stadiumId) => {
              setQrStadiumId(stadiumId);
              setIsOpenQrModal(true);
            }}
          />
        )}
      </main>

      {/* Modals */}
      {/* 1. Check-In Form Modal */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          setCheckInTargetStadium(null);
          setIsCheckInFromQr(false);
        }}
        stadium={checkInTargetStadium}
        allStadiums={stadiums}
        initialSport={preselectedSport}
        isFromQr={isCheckInFromQr}
        onConfirmCheckIn={handleConfirmCheckIn}
      />

      {/* 2. Check-In Digital Pass Modal */}
      <CheckInPassModal
        isOpen={isOpenPassModal}
        onClose={() => setIsOpenPassModal(false)}
        record={activePass}
        onCheckOut={handleCheckOut}
      />

      {/* 3. QR Code Generator Modal */}
      <QRCodeGeneratorModal
        isOpen={isOpenQrModal}
        onClose={() => setIsOpenQrModal(false)}
        stadiums={stadiums}
        initialStadiumId={qrStadiumId}
        onSimulateScanCheckIn={(stadiumId, sport) => {
          const target = stadiums.find((s) => s.id === stadiumId);
          if (target) {
            setCheckInTargetStadium(target);
            setPreselectedSport(sport);
            setIsCheckInFromQr(true);
            setIsCheckInOpen(true);
          }
        }}
      />

      {/* 4. Real Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isOpenScannerModal}
        onClose={() => setIsOpenScannerModal(false)}
        stadiums={stadiums}
        onDetected={(stadiumId, sport) => {
          const target = stadiums.find((s) => s.id === stadiumId);
          if (target) {
            setCheckInTargetStadium(target);
            setPreselectedSport(sport);
            setIsCheckInFromQr(true);
            setIsCheckInOpen(true);
          }
        }}
      />

      {/* 4. Stadium Detail Modal */}
      <StadiumDetailModal
        isOpen={!!selectedDetailStadium}
        onClose={() => setSelectedDetailStadium(null)}
        stadium={selectedDetailStadium}
        onStartCheckIn={(stadium, sport) => {
          setCheckInTargetStadium(stadium);
          setPreselectedSport(sport);
          setIsCheckInOpen(true);
        }}
        onOpenQr={(stadiumId) => {
          setQrStadiumId(stadiumId);
          setIsOpenQrModal(true);
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            ระบบบริหารจัดการและติดตามข้อมูลผู้เข้าใช้งานสนามกีฬา 50 เขต กรุงเทพมหานคร
          </p>
          <p className="text-[11px] text-slate-400">
            สำนักวัฒนธรรม กีฬา และการท่องเที่ยว กรุงเทพมหานคร (BMA Sports Track)
          </p>
        </div>
      </footer>
    </div>
  );
}
