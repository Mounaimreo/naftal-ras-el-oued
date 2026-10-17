import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Fuel,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  ArrowRightLeft,
  FileText,
  SlidersHorizontal,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Users,
  FolderArchive,
  LockKeyhole,
} from 'lucide-react';
import {
  getStoredWorkers,
  saveStoredWorkers,
  getStoredCycleStartDate,
  saveStoredCycleStartDate,
  getStoredGroupOrder,
  saveStoredGroupOrder,
  getStoredOverrides,
  saveStoredOverrides,
  setDayOverride,
  removeDayOverride,
  getStoredSwapRequests,
  saveStoredSwapRequests,
  getStoredHandovers,
  saveStoredHandovers,
  getStoredChatMessages,
  saveStoredChatMessages,
  exportStationData,
  importStationData,
  resetToDefaults,
} from './lib/storage';
import {
  getStationToday,
  addDays,
  getDailyRoster,
  formatArabicDate,
} from './lib/rosterEngine';
import { STATION_INFO, SHIFT_META } from './lib/constants';
import { TopBar } from './components/navigation/TopBar';
import { MobileNavBar } from './components/navigation/MobileNavBar';
import { CycleRibbon } from './components/station/CycleRibbon';
import { ShiftCards } from './components/station/ShiftCards';
import { WorkersControlCenter } from './components/station/WorkersControlCenter';
import { MonthlyCalendarView } from './components/station/MonthlyCalendarView';
import { PersonalScheduleLookup } from './components/station/PersonalScheduleLookup';
import { TeamChatSection } from './components/station/TeamChatSection';
import { HandoverLogModal } from './components/station/HandoverLogModal';
import { SwapRequestsModal } from './components/station/SwapRequestsModal';
import { AuthGate, useAuth } from './components/auth/AuthGate';
import { Worker, GroupId, ShiftKey, ShiftSwapRequest, HandoverReport, ChatMessage } from './types';

export default function App() {
  return (
    <AuthGate>
      <StationApp />
    </AuthGate>
  );
}

function StationApp() {
  const { isAdmin } = useAuth();
  // Navigation & Date
  const [currentTab, setCurrentTab] = useState<'today' | 'control' | 'calendar' | 'personal' | 'chat'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(getStationToday);

  // Persistent State
  const [workers, setWorkers] = useState<Worker[]>(getStoredWorkers);
  const [cycleStartDate, setCycleStartDate] = useState<string>(getStoredCycleStartDate);
  const [groupOrder, setGroupOrder] = useState<GroupId[]>(getStoredGroupOrder);
  const [overrides, setOverrides] = useState(getStoredOverrides);
  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>(getStoredSwapRequests);
  const [handovers, setHandovers] = useState<HandoverReport[]>(getStoredHandovers);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(getStoredChatMessages);
  // Modals
  const [showHandoversModal, setShowHandoversModal] = useState<boolean>(false);
  const [showSwapsModal, setShowSwapsModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Read URL query params on load (e.g. ?tab=control from PWA shortcut)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['today', 'control', 'calendar', 'personal', 'chat'].includes(tabParam)) {
        setCurrentTab(tabParam as any);
      }
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Compute today's calculated roster
  const dailyRoster = getDailyRoster(selectedDate, workers, cycleStartDate, groupOrder, overrides);
  const isToday = selectedDate === getStationToday();
  const pendingSwapsCount = swapRequests.filter((s) => s.status === 'pending').length;

  // Handlers
  const handleSaveWorkers = (updated: Worker[]) => {
    setWorkers(updated);
    saveStoredWorkers(updated);
    showToast('تم حفظ تعديل بيانات العمال بنجاح.');
  };

  const handleSaveCycleStartDate = (date: string) => {
    setCycleStartDate(date);
    saveStoredCycleStartDate(date);
    showToast('تم تحديث تاريخ بداية دورة المناوبات.');
  };

  const handleSaveGroupOrder = (order: GroupId[]) => {
    setGroupOrder(order);
    saveStoredGroupOrder(order);
    showToast('تم حفظ ترتيب تسلسل الأفواج.');
  };

  const handleSaveDailyOverride = (date: string, assignments: Record<string, ShiftKey>) => {
    setDayOverride(date, assignments);
    setOverrides(getStoredOverrides());
    showToast(`تم حفظ التعديل المخصص ليوم ${date}`);
  };

  const handleClearDailyOverride = (date: string) => {
    removeDayOverride(date);
    setOverrides(getStoredOverrides());
    showToast(`تمت استعادة الدورة التلقائية ليوم ${date}`);
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    setWorkers(getStoredWorkers());
    setCycleStartDate(getStoredCycleStartDate());
    setGroupOrder(getStoredGroupOrder());
    setOverrides(getStoredOverrides());
    showToast('تمت إعادة ضبط النظام إلى القيم الأولية.');
  };

  const handleExportData = () => {
    const jsonStr = exportStationData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_محطة_نفطال_رأس_الوادي_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('تم تحميل ملف النسخة الاحتياطية.');
  };

  const handleImportData = (jsonStr: string): boolean => {
    const ok = importStationData(jsonStr);
    if (ok) {
      setWorkers(getStoredWorkers());
      setCycleStartDate(getStoredCycleStartDate());
      setGroupOrder(getStoredGroupOrder());
      setOverrides(getStoredOverrides());
      setSwapRequests(getStoredSwapRequests());
      setHandovers(getStoredHandovers());
      setChatMessages(getStoredChatMessages());
      showToast('تم استيراد النسخة الاحتياطية بنجاح!');
    }
    return ok;
  };

  const handleAddSwapRequest = (req: Omit<ShiftSwapRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: ShiftSwapRequest = {
      ...req,
      id: `swap-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const updated = [newReq, ...swapRequests];
    setSwapRequests(updated);
    saveStoredSwapRequests(updated);
    showToast('تم إرسال طلب التبديل إلى المشرف.');
  };

  const handleUpdateSwapStatus = (id: string, status: 'approved' | 'rejected') => {
    const updated = swapRequests.map((s) => {
      if (s.id === id) {
        return { ...s, status, resolvedAt: new Date().toISOString() };
      }
      return s;
    });
    setSwapRequests(updated);
    saveStoredSwapRequests(updated);

    // If approved, automatically apply daily override for that date
    if (status === 'approved') {
      const req = swapRequests.find((s) => s.id === id);
      if (req) {
        const curDayOverrides = overrides[req.date] || {};
        const newDayOverrides = {
          ...curDayOverrides,
          [req.requesterId]: req.targetShift,
          [req.recipientId]: req.originalShift,
        };
        handleSaveDailyOverride(req.date, newDayOverrides);
      }
    }
    showToast(status === 'approved' ? 'تمت الموافقة على التبديل وتعديل الجدول!' : 'تم رفض الطلب.');
  };

  const handleAddHandover = (report: Omit<HandoverReport, 'id' | 'createdAt'>) => {
    const newReport: HandoverReport = {
      ...report,
      id: `handover-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newReport, ...handovers];
    setHandovers(updated);
    saveStoredHandovers(updated);
    showToast('تم توثيق محضر تسليم الوردية في السجل.');
  };

  const handleSendMessage = (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    saveStoredChatMessages(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f7] text-[#122944] pb-20 lg:pb-8 selection:bg-[#f5d32e] selection:text-[#08264d]">
      {/* Top Bar */}
      <TopBar
        isAdmin={isAdmin}
        pendingSwapsCount={pendingSwapsCount}
        onOpenSwaps={() => setShowSwapsModal(true)}
        onOpenHandovers={() => setShowHandoversModal(true)}
        onOpenBackup={() => setCurrentTab('control')}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab as any)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 flex-1 w-full">
        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#08264d] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-white/20 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle size={16} className="text-[#f5d32e]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TAB 1: TODAY'S SHIFT */}
        {currentTab === 'today' && (
          <section className="space-y-6">
            {/* Station Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#08264d] via-[#123862] to-[#1554a3] text-white rounded-3xl p-5 sm:p-7 shadow-md border border-white/10 no-print">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl text-center md:text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-semibold">
                    <MapPin size={13} className="text-[#f5d32e]" />
                    <span>رأس الوادي · ولاية برج بوعريريج · الجزائر</span>
                  </div>

                  <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                    فريق حاضر. خدمة متواصلة 24/24 ساعة.
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    فضاء التنسيق الرسمي لمناوبات بيع الوقود، البنزين، والغاز (GPL) بمحطة نفطال رأس الوادي.
                    12 عاملاً موزعين بانتظام على 4 فترات دورية.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentTab('control')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f5d32e] hover:bg-[#e5c320] text-[#08264d] text-xs font-black shadow-xs transition"
                    >
                      <SlidersHorizontal size={14} />
                      <span>فتح أداة تحكم العمال والمناوبات</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentTab('calendar')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-xs font-bold transition"
                    >
                      <CalendarDays size={14} />
                      <span>عرض الجدول الشهري الشامل</span>
                    </button>

                    <a
                      href="/naftal-station-app.zip"
                      download="naftal-station-app.zip"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-xs transition"
                      title="تحميل كود المشروع كاملاً في ملف ZIP"
                    >
                      <FolderArchive size={14} />
                      <span>تحميل المشروع كاملاً (ZIP)</span>
                    </a>
                  </div>
                </div>

                {/* Artwork display */}
                <div className="w-full md:w-56 h-36 sm:h-44 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 shrink-0 bg-[#08264d]/60">
                  <img
                    src={STATION_INFO.artworkUrl}
                    alt="صورة محطة نفطال رأس الوادي"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Shift Date Navigation Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={20} className="text-[#08264d]" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-[#08264d]">
                      جدول المناوبة لتاريخ:
                    </h2>
                    <span className="text-xs sm:text-sm font-black text-blue-900">
                      {formatArabicDate(selectedDate)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {isToday ? 'وردية اليوم الفعلية في المحطة' : 'استعراض تاريخ محدد'}
                  </span>
                </div>
              </div>

              {/* Prev / Today / Next controls */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1 transition"
                  title="اليوم السابق"
                >
                  <ChevronRight size={15} />
                  <span>السابق</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDate(getStationToday())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                    isToday
                      ? 'bg-[#08264d] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  اليوم
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1 transition"
                  title="اليوم التالي"
                >
                  <span>التالي</span>
                  <ChevronLeft size={15} />
                </button>
              </div>
            </div>

            {/* 8-Day Cycle Ribbon */}
            <CycleRibbon
              cycleDayIndex={dailyRoster.cycleDayIndex}
              cycleStartDate={cycleStartDate}
            />

            {/* 4 Shift Cards (Morning, Evening, Night, Rest) */}
            <ShiftCards
              workers={dailyRoster.workers}
              isManualOverride={dailyRoster.isManualOverride}
              isAdmin={isAdmin}
              onEditWorker={(w) => {
                setCurrentTab('control');
              }}
            />

            {/* Quick Status Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#08264d] shrink-0" />
                <span>
                  نظام التناوب الدوري: كل فترة تدوم يومين (48 ساعة) وتتكرر الدورة كاملة كل 8 أيام بانتظام.
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowSwapsModal(true)}
                  className="text-xs font-bold text-[#08264d] hover:underline flex items-center gap-1"
                >
                  <ArrowRightLeft size={13} />
                  <span>طلب تبديل وردية</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowHandoversModal(true)}
                  className="text-xs font-bold text-[#08264d] hover:underline flex items-center gap-1"
                >
                  <FileText size={13} />
                  <span>محضر تسليم الوردية</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: WORKERS CONTROL & SHIFT ARRANGEMENT CENTER */}
        {currentTab === 'control' && isAdmin && (
          <WorkersControlCenter
            workers={workers}
            onSaveWorkers={handleSaveWorkers}
            cycleStartDate={cycleStartDate}
            onSaveCycleStartDate={handleSaveCycleStartDate}
            groupOrder={groupOrder}
            onSaveGroupOrder={handleSaveGroupOrder}
            currentRoster={dailyRoster}
            onSaveDailyOverride={handleSaveDailyOverride}
            onClearDailyOverride={handleClearDailyOverride}
            onResetDefaults={handleResetDefaults}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        )}

        {currentTab === 'control' && !isAdmin && (
          <section className="rounded-3xl bg-white border border-slate-200 p-8 text-center shadow-sm">
            <LockKeyhole className="mx-auto mb-3 text-slate-400" size={32} />
            <h2 className="text-lg font-black text-[#08264d]">أداة التحكم محمية</h2>
            <p className="mt-2 text-sm text-slate-500">تعديل أسماء العمال ومواقيت العمل متاح للمسؤول الموثق فقط.</p>
          </section>
        )}

        {/* TAB 3: MONTHLY CALENDAR GRID */}
        {currentTab === 'calendar' && (
          <MonthlyCalendarView
            workers={workers}
            cycleStartDate={cycleStartDate}
            groupOrder={groupOrder}
            overrides={overrides}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setCurrentTab('today');
            }}
          />
        )}

        {/* TAB 4: PERSONAL SCHEDULE LOOKUP */}
        {currentTab === 'personal' && (
          <PersonalScheduleLookup
            workers={workers}
            cycleStartDate={cycleStartDate}
            groupOrder={groupOrder}
            overrides={overrides}
            todayDate={getStationToday()}
          />
        )}

        {/* TAB 5: TEAM CHAT */}
        {currentTab === 'chat' && (
          <TeamChatSection
            messages={chatMessages}
            workers={workers}
            onSendMessage={handleSendMessage}
            isAdmin={isAdmin}
            onClearChat={() => {
              setChatMessages([]);
              saveStoredChatMessages([]);
              showToast('تم مسح سجل الدردشة.');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavBar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab as any)}
        isAdmin={isAdmin}
        unreadChatCount={0}
      />

      {/* Modals */}
      {showHandoversModal && (
        <HandoverLogModal
          handovers={handovers}
          onAddHandover={handleAddHandover}
          onClose={() => setShowHandoversModal(false)}
        />
      )}

      {showSwapsModal && (
        <SwapRequestsModal
          workers={workers}
          swapRequests={swapRequests}
          onAddSwapRequest={handleAddSwapRequest}
          onUpdateStatus={handleUpdateSwapStatus}
          isAdmin={isAdmin}
          onClose={() => setShowSwapsModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200/80 text-center text-xs text-slate-500 max-w-7xl mx-auto px-4 no-print">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{STATION_INFO.name} · {STATION_INFO.subName}</span>
          <span className="text-[11px] text-slate-400">
            تطبيق أندرويد دائم لتنظيم المناوبات وإدارة عمال المحطة © {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
