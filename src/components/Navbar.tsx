import React from 'react';
import { Activity, ShieldAlert, QrCode, Building2, UserCheck, Flame } from 'lucide-react';

interface NavbarProps {
  currentView: 'citizen' | 'admin';
  onViewChange: (view: 'citizen' | 'admin') => void;
  onOpenQrModal: () => void;
  onOpenScannerModal: () => void;
  overcrowdedCount: number;
  totalActiveUsers: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenQrModal,
  onOpenScannerModal,
  overcrowdedCount,
  totalActiveUsers,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-emerald-800 text-white shadow-md border-b border-emerald-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & BMA Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onViewChange('citizen')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-300 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-emerald-900 rounded-[10px] flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                  BMA Sports Track
                  <span className="hidden md:inline-block px-2 py-0.5 text-xs font-medium bg-emerald-700/80 text-emerald-200 rounded-full border border-emerald-600">
                    กทม. 50 เขต
                  </span>
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 hidden sm:block">
                ระบบเช็คอินและติดตามความพร้อมสนามกีฬา กรุงเทพมหานคร
              </p>
            </div>
          </div>

          {/* Quick Active & Overcrowd Alert indicator */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-900/60 rounded-lg border border-emerald-700/60 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-200">กำลังใช้งานขณะนี้:</span>
              <span className="font-bold text-white text-sm">{totalActiveUsers.toLocaleString()} คน</span>
            </div>

            {overcrowdedCount > 0 && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/20 text-rose-200 border border-rose-500/40 rounded-lg text-xs animate-bounce font-medium">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>สนามหนาแน่นสูง: {overcrowdedCount} แห่ง</span>
              </div>
            )}
          </div>

          {/* Actions & Role Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Scan QR Code Button with Camera */}
            <button
              onClick={onOpenScannerModal}
              aria-label="สแกน QR Code เพื่อลงทะเบียน"
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-lg text-xs sm:text-sm font-bold transition shadow-sm"
              title="เปิดกล้องสแกน QR Code หน้าสนามจริง"
            >
              <QrCode className="w-4 h-4 text-emerald-950" />
              <span className="hidden sm:inline">สแกน QR ลงทะเบียน</span>
              <span className="sm:hidden">สแกน QR</span>
            </button>

            {/* QR Code Generator Button */}
            <button
              onClick={onOpenQrModal}
              aria-label="สร้าง QR Code สนามกีฬา"
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs sm:text-sm font-medium transition shadow-sm border border-emerald-600"
              title="สร้างป้าย QR Code สำหรับติดประจำจุด"
            >
              <span className="hidden md:inline">สร้าง QR ประจำจุด</span>
              <span className="md:hidden">ป้าย QR</span>
            </button>

            {/* View Switcher: Citizen vs Admin */}
            <div className="flex bg-emerald-950/70 p-1 rounded-xl border border-emerald-700/60">
              <button
                onClick={() => onViewChange('citizen')}
                aria-pressed={currentView === 'citizen'}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  currentView === 'citizen'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>ประชาชน</span>
              </button>
              <button
                onClick={() => onViewChange('admin')}
                aria-pressed={currentView === 'admin'}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  currentView === 'admin'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>ผู้ดูแลระบบ</span>
                {overcrowdedCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
