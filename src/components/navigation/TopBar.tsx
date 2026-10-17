import React from 'react';
import { Fuel, ShieldCheck, ShieldAlert, WifiOff, FileText, ArrowLeftRight, FolderArchive } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { STATION_INFO } from '../../lib/constants';

interface Props {
  isAdmin: boolean;
  pendingSwapsCount: number;
  onOpenSwaps: () => void;
  onOpenHandovers: () => void;
  onOpenBackup: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const TopBar: React.FC<Props> = ({
  isAdmin,
  pendingSwapsCount,
  onOpenSwaps,
  onOpenHandovers,
  onOpenBackup,
  currentTab,
  onSelectTab,
}) => {
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 cursor-pointer" onClick={() => onSelectTab('today')}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f5d32e] border-2 border-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-amber-300">
            <img
              src={STATION_INFO.artworkUrl}
              alt="شعار محطة نفطال رأس الوادي"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to Fuel icon if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Fuel className="text-[#08264d] hidden peer-only:block" size={20} strokeWidth={2.4} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <strong className="text-xs sm:text-sm font-black text-[#08264d] truncate block leading-tight">
                فضاء محطة نفطال
              </strong>
              <span className="hidden sm:inline-block bg-[#08264d] text-[#f5d32e] text-[10px] font-bold px-1.5 py-0.2 rounded-sm">
                رأس الوادي
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block mt-0.5">
              تنسيق المناوبات وإدارة الفريق · برج بوعريريج
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectTab('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentTab === 'today'
                ? 'bg-[#08264d] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#08264d] hover:bg-slate-100'
            }`}
          >
            وردية اليوم
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('control')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'control'
                ? 'bg-[#08264d] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#08264d] hover:bg-slate-100'
            }`}
          >
            <span>أداة تحكم العمال والمناوبات</span>
            {isAdmin && <span className="w-2 h-2 rounded-full bg-[#f5d32e]" />}
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentTab === 'calendar'
                ? 'bg-[#08264d] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#08264d] hover:bg-slate-100'
            }`}
          >
            الجدول الشهري الشامل
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('personal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentTab === 'personal'
                ? 'bg-[#08264d] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#08264d] hover:bg-slate-100'
            }`}
          >
            جدول العامل الفردي
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentTab === 'chat'
                ? 'bg-[#08264d] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#08264d] hover:bg-slate-100'
            }`}
          >
            دردشة الفريق
          </button>
        </nav>

        {/* Right Tools & Admin Switch */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Offline badge */}
          {!isOnline && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-bold">
              <WifiOff size={12} />
              <span className="hidden sm:inline">أوفلاين</span>
            </span>
          )}

          {/* Quick Handover Button */}
          <button
            type="button"
            onClick={onOpenHandovers}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition"
            title="سجل تسليم واستلام الوردية"
          >
            <FileText size={15} className="text-slate-500" />
            <span className="hidden md:inline">دفتر التسليم</span>
          </button>

          {/* Swap requests button with counter badge */}
          <button
            type="button"
            onClick={onOpenSwaps}
            className="relative p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition"
            title="طلبات تبديل المناوبة"
          >
            <ArrowLeftRight size={15} className="text-slate-500" />
            <span className="hidden md:inline">تبديل وردية</span>
            {pendingSwapsCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:static sm:top-auto sm:right-auto bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {pendingSwapsCount}
              </span>
            )}
          </button>

          {/* Download Full Project ZIP */}
          <a
            href="/naftal-station-app.zip"
            download="naftal-station-app.zip"
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="تحميل كود المشروع كاملاً في ملف ZIP"
          >
            <FolderArchive size={15} className="text-emerald-600" />
            <span className="hidden sm:inline">تحميل ZIP</span>
          </a>

          {/* Authenticated permission status; there is no local PIN bypass. */}
          <div
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold border ${
              isAdmin ? 'bg-[#08264d] text-white border-[#08264d] shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
            title={isAdmin ? 'المسؤول الموثق يستطيع تعديل بيانات المحطة' : 'حساب العرض لا يملك صلاحية التعديل'}
          >
            {isAdmin ? (
              <>
                <ShieldCheck size={14} className="text-[#f5d32e]" />
                <span className="hidden sm:inline">وضع المسؤول</span>
                <span className="sm:hidden text-[11px]">مشرف</span>
              </>
            ) : (
              <>
                <ShieldAlert size={14} className="text-slate-400" />
                <span className="hidden sm:inline">دخول المشرف</span>
                <span className="sm:hidden text-[11px]">دخول</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
