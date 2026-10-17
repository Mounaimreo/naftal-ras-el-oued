import React, { useState } from 'react';
import {
  Users,
  Sliders,
  Calendar,
  ArrowUpDown,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Phone,
  AlertCircle,
  Save,
  RotateCcw,
  Download,
  Upload,
  ArrowRightLeft,
  Sparkles,
  ShieldCheck,
  FolderArchive,
} from 'lucide-react';
import { Worker, GroupId, ShiftKey, DailyRoster } from '../../types';
import { GROUPS, SHIFT_META } from '../../lib/constants';
import { formatArabicDate } from '../../lib/rosterEngine';

interface Props {
  workers: Worker[];
  onSaveWorkers: (workers: Worker[]) => void;
  cycleStartDate: string;
  onSaveCycleStartDate: (date: string) => void;
  groupOrder: GroupId[];
  onSaveGroupOrder: (order: GroupId[]) => void;
  currentRoster: DailyRoster;
  onSaveDailyOverride: (date: string, assignments: Record<string, ShiftKey>) => void;
  onClearDailyOverride: (date: string) => void;
  onResetDefaults: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => boolean;
}

export const WorkersControlCenter: React.FC<Props> = ({
  workers,
  onSaveWorkers,
  cycleStartDate,
  onSaveCycleStartDate,
  groupOrder,
  onSaveGroupOrder,
  currentRoster,
  onSaveDailyOverride,
  onClearDailyOverride,
  onResetDefaults,
  onExportData,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'workers' | 'rotation' | 'override' | 'backup'>('workers');

  // Edit worker modal state
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerBadge, setWorkerBadge] = useState('');
  const [workerGroup, setWorkerGroup] = useState<GroupId>('A');

  // Quick swap state
  const [swapWorkerAId, setSwapWorkerAId] = useState<string>('');
  const [swapWorkerBId, setSwapWorkerBId] = useState<string>('');
  const [swapSuccessMsg, setSwapSuccessMsg] = useState('');

  // Daily override modal/state
  const [overrideDate, setOverrideDate] = useState(currentRoster.date);
  const [dayAssignments, setDayAssignments] = useState<Record<string, ShiftKey>>({});

  // Cycle date state
  const [tempCycleDate, setTempCycleDate] = useState(cycleStartDate);
  const [cycleSavedFeedback, setCycleSavedFeedback] = useState(false);

  // Group order state
  const [currentOrder, setCurrentOrder] = useState<GroupId[]>(groupOrder);

  // Open edit modal for a worker
  const handleStartEdit = (w: Worker) => {
    setEditingWorker(w);
    setWorkerName(w.name);
    setWorkerRole(w.role);
    setWorkerPhone(w.phone || '');
    setWorkerBadge(w.badgeNumber || '');
    setWorkerGroup(w.groupId);
  };

  // Save edited worker
  const handleSaveWorkerModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker || !workerName.trim()) return;

    const updated = workers.map((w) => {
      if (w.id === editingWorker.id) {
        return {
          ...w,
          name: workerName.trim(),
          role: workerRole.trim() || 'عامل توزيع وقود',
          phone: workerPhone.trim(),
          badgeNumber: workerBadge.trim(),
          groupId: workerGroup,
          isPlaceholder: false,
        };
      }
      return w;
    });

    onSaveWorkers(updated);
    setEditingWorker(null);
  };

  // Quick swap two workers
  const handlePerformSwap = () => {
    if (!swapWorkerAId || !swapWorkerBId || swapWorkerAId === swapWorkerBId) return;

    const workerA = workers.find((w) => w.id === swapWorkerAId);
    const workerB = workers.find((w) => w.id === swapWorkerBId);
    if (!workerA || !workerB) return;

    // Swap their group assignments so they permanently exchange shift groups
    const updated = workers.map((w) => {
      if (w.id === workerA.id) {
        return { ...w, groupId: workerB.groupId, orderInGroup: workerB.orderInGroup };
      }
      if (w.id === workerB.id) {
        return { ...w, groupId: workerA.groupId, orderInGroup: workerA.orderInGroup };
      }
      return w;
    });

    onSaveWorkers(updated);
    setSwapSuccessMsg(`تم تبديل الفوج بنجاح بين ${workerA.name} و ${workerB.name}`);
    setTimeout(() => setSwapSuccessMsg(''), 4000);
  };

  // Move group in order
  const handleMoveGroup = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...currentOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    setCurrentOrder(newOrder);
    onSaveGroupOrder(newOrder);
  };

  // Save cycle start date
  const handleSaveCycleDate = () => {
    onSaveCycleStartDate(tempCycleDate);
    setCycleSavedFeedback(true);
    setTimeout(() => setCycleSavedFeedback(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#08264d] text-[#f5d32e] flex items-center justify-center shrink-0 shadow-xs">
            <Sliders size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#08264d]">
                أداة التحكم الاحترافية في العمال وترتيب المناوبات
              </h2>
              <span className="bg-[#f5d32e] text-[#08264d] text-[10px] font-black px-2 py-0.5 rounded-full">
                لوحة المشرف
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              تحكم كامل في أسماء عمال المحطة، تشكيلات الأفواج، إيقاع المناوبات، والتبديل المباشر
            </p>
          </div>
        </div>

        {/* Sub-tabs within Control Center */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('workers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'workers'
                ? 'bg-white text-[#08264d] shadow-xs'
                : 'text-slate-600 hover:text-[#08264d]'
            }`}
          >
            <Users size={14} />
            <span>أسماء العمال ({workers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rotation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'rotation'
                ? 'bg-white text-[#08264d] shadow-xs'
                : 'text-slate-600 hover:text-[#08264d]'
            }`}
          >
            <ArrowUpDown size={14} />
            <span>ترتيب المناوبات والدورة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('override')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'override'
                ? 'bg-white text-[#08264d] shadow-xs'
                : 'text-slate-600 hover:text-[#08264d]'
            }`}
          >
            <Calendar size={14} />
            <span>تعديل يوم مخصص</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-white text-[#08264d] shadow-xs'
                : 'text-slate-600 hover:text-[#08264d]'
            }`}
          >
            <Save size={14} />
            <span>نسخ وحفظ</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: WORKERS NAMES & GROUPS MANAGEMENT                      */}
      {/* ============================================================== */}
      {activeTab === 'workers' && (
        <div className="pt-6 space-y-6">
          {/* Quick Notice */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">إدارة عمال محطة رأس الوادي:</strong>
              <span>
                تضم المحطة 12 مقعداً موزعة على 4 أفواج (أ، ب، ج، د). اضغط على أي عامل لتعديل اسمه أو رقم هاتفه أو نقله لفوج آخر.
                المقاعد غير المسماة تظهر بوضوح ويمكن تسميتها فوراً.
              </span>
            </div>
          </div>

          {/* Quick Swap Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft size={16} className="text-[#08264d]" />
              <h4 className="text-xs font-black text-[#08264d]">
                أداة التبديل الفوري للأفواج بين عاملين:
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  العامل الأول:
                </label>
                <select
                  value={swapWorkerAId}
                  onChange={(e) => setSwapWorkerAId(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">اختر العامل الأول...</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (الفوج {w.groupId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  العامل الثاني (لتبديل الفوج معه):
                </label>
                <select
                  value={swapWorkerBId}
                  onChange={(e) => setSwapWorkerBId(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">اختر العامل الثاني...</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (الفوج {w.groupId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  disabled={!swapWorkerAId || !swapWorkerBId || swapWorkerAId === swapWorkerBId}
                  onClick={handlePerformSwap}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#08264d] hover:bg-[#123862] disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 transition"
                >
                  <ArrowRightLeft size={15} />
                  <span>تنفيذ التبديل الآن</span>
                </button>
              </div>
            </div>

            {swapSuccessMsg && (
              <div className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
                <Check size={16} />
                <span>{swapSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GROUPS.map((group) => {
              const groupWorkers = workers.filter((w) => w.groupId === group.id);
              const groupCurrentShift = currentRoster.groupShifts[group.id];
              const shiftMeta = SHIFT_META[groupCurrentShift];

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  {/* Group header */}
                  <div
                    className="p-3.5 border-b flex items-center justify-between"
                    style={{ backgroundColor: `${group.color}15`, borderColor: `${group.color}35` }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <h4 className="text-xs font-black text-slate-900">{group.name}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-medium">مناوبة اليوم:</span>
                      <span
                        className="text-[11px] font-black px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: shiftMeta.color, color: 'white' }}
                      >
                        {shiftMeta.shortTitle}
                      </span>
                    </div>
                  </div>

                  {/* Workers list in group */}
                  <div className="p-3 space-y-2">
                    {groupWorkers.map((worker, idx) => {
                      const isPlaceholder = worker.isPlaceholder || worker.name.includes('المقعد');

                      return (
                        <div
                          key={worker.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                            isPlaceholder
                              ? 'bg-amber-50/70 border-amber-200 border-dashed'
                              : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>

                            <div className="min-w-0">
                              <strong
                                className={`text-xs block truncate ${
                                  isPlaceholder ? 'text-amber-900 font-bold' : 'text-slate-900'
                                }`}
                              >
                                {worker.name}
                              </strong>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span>{worker.role}</span>
                                {worker.phone && (
                                  <>
                                    <span>•</span>
                                    <span dir="ltr">{worker.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(worker)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1 shrink-0 transition"
                          >
                            <Edit2 size={12} />
                            <span>تعديل</span>
                          </button>
                        </div>
                      );
                    })}

                    {groupWorkers.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-400">
                        لا يوجد عمال في هذا الفوج حالياً
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SHIFT ROTATION & CYCLE ORDER ENGINE                    */}
      {/* ============================================================== */}
      {activeTab === 'rotation' && (
        <div className="pt-6 space-y-6">
          {/* Cycle Start Date Controller */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#08264d] flex items-center gap-2">
                  <Calendar size={16} />
                  <span>تاريخ بداية دورة المناوبات (نقطة ارتكاز الحساب)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  تتكرر الدورة كل 8 أيام تلقائياً (يومان صباحاً ← يومان مساءً ← يومان ليلاً ← يومان راحة).
                  تعديل هذا التاريخ يعيد مزامنة حسابات النظام لتطابق اليوم الفعلي في سجل المحطة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={tempCycleDate}
                  onChange={(e) => setTempCycleDate(e.target.value)}
                  className="p-2 text-xs font-bold border border-slate-300 rounded-xl bg-white shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveCycleDate}
                  className="px-4 py-2 rounded-xl bg-[#08264d] hover:bg-[#123862] text-white text-xs font-black shadow-xs transition"
                >
                  حفظ التاريخ
                </button>
              </div>
            </div>

            {cycleSavedFeedback && (
              <div className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <Check size={14} />
                <span>تم تحديث تاريخ بداية الدورة وإعادة احتساب جميع المناوبات تلقائياً!</span>
              </div>
            )}
          </div>

          {/* Group Rotation Succession Arrangement */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#08264d] flex items-center gap-2">
                  <ArrowUpDown size={16} />
                  <span>ترتيب تسلسل استلام الورديات بين الأفواج</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  حدّد ترتيب تعاقب الأفواج الأربعة في استلام المناوبة عند انتهاء كل فترة 48 ساعة.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {currentOrder.map((groupId, index) => {
                const groupObj = GROUPS.find((g) => g.id === groupId);
                const assignedWorkers = workers.filter((w) => w.groupId === groupId);

                return (
                  <div
                    key={groupId}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#08264d] text-white font-black text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-slate-900">{groupObj?.name}</strong>
                          <span className="text-[10px] text-slate-500">
                            ({assignedWorkers.map((w) => w.name).join('، ')})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {index === 0
                            ? 'الفوج المرجعي (يبدأ بالفترة الصباحية عند بداية الدورة)'
                            : `يستلم بعد الفوج السابق بمقدار يومين`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveGroup(index, 'up')}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-700 text-xs font-bold"
                        title="تقديم الفوج للأعلى"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={index === currentOrder.length - 1}
                        onClick={() => handleMoveGroup(index, 'down')}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-700 text-xs font-bold"
                        title="تأخير الفوج للأسفل"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: CUSTOM DAY OVERRIDE                                    */}
      {/* ============================================================== */}
      {activeTab === 'override' && (
        <div className="pt-6 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <h4 className="text-xs sm:text-sm font-black text-[#08264d] mb-1">
              تعديل استثنائي ليوم محدد
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              يمكنك تخصيص وردية أي عامل في تاريخ محدد (مثلاً لتعويض غياب، ظرف خاص، أو عطلة رسمية) دون التأثير على الحساب التلقائي لباقي الأيام.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <label className="text-xs font-bold text-slate-700">التاريخ المراد تعديله:</label>
              <input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="p-2 text-xs font-bold border border-slate-300 rounded-xl bg-white shadow-xs"
              />
              <span className="text-xs text-slate-600 font-bold">
                ({formatArabicDate(overrideDate)})
              </span>
            </div>

            {/* Shift assignment editor for this day */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {workers.map((worker) => {
                  const defaultShift = currentRoster.groupShifts[worker.groupId];
                  const currentCustom = dayAssignments[worker.id] || defaultShift;

                  return (
                    <div
                      key={worker.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <strong className="text-xs text-slate-900 block truncate">
                          {worker.name}
                        </strong>
                        <span className="text-[10px] text-slate-500 block truncate">
                          فوج {worker.groupId} (الأصل: {SHIFT_META[defaultShift].shortTitle})
                        </span>
                      </div>

                      <select
                        value={currentCustom}
                        onChange={(e) => {
                          setDayAssignments({
                            ...dayAssignments,
                            [worker.id]: e.target.value as ShiftKey,
                          });
                        }}
                        className="text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-slate-50"
                      >
                        <option value="morning">صباحي (06-14)</option>
                        <option value="evening">مسائي (14-22)</option>
                        <option value="night">ليلي (22-06)</option>
                        <option value="rest">راحة (48س)</option>
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    onSaveDailyOverride(overrideDate, dayAssignments);
                    alert(`تم حفظ التعديل المخصص ليوم ${overrideDate}`);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#08264d] hover:bg-[#123862] text-white text-xs font-black shadow-xs transition"
                >
                  حفظ التعديل لهذا اليوم
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClearDailyOverride(overrideDate);
                    setDayAssignments({});
                    alert(`تمت إعادة ضبط يوم ${overrideDate} للدورة التلقائية.`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
                >
                  إلغاء التخصيص والعودة للدورة التلقائية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: BACKUP & RESTORE                                       */}
      {/* ============================================================== */}
      {activeTab === 'backup' && (
        <div className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-[#08264d] text-[#f5d32e] flex items-center justify-center mb-3">
                <Download size={20} />
              </div>
              <h4 className="text-xs sm:text-sm font-black text-[#08264d]">
                تصدير نسخة احتياطية من بيانات المحطة
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                احفظ ملف النسخة الاحتياطية (JSON) على هاتفك أو حاسوبك يحتوي على جميع أسماء العمال وتواريخ المناوبات والرسائل وسجل التسليم.
              </p>
              <button
                type="button"
                onClick={onExportData}
                className="w-full py-2.5 rounded-xl bg-[#08264d] hover:bg-[#123862] text-white text-xs font-black shadow-xs transition flex items-center justify-center gap-2"
              >
                <Download size={15} />
                <span>تحميل ملف النسخة الاحتياطية (JSON)</span>
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-3">
                <Upload size={20} />
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                استيراد نسخة احتياطية سابقة
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                استرجع جدولاً محفوظاً سابقاً على جهازك بسهولة بنقرة واحدة.
              </p>
              <label className="w-full py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-black shadow-xs transition flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={15} />
                <span>اختيار ملف النسخة الاحتياطية</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const text = evt.target?.result as string;
                      if (text && onImportData(text)) {
                        alert('تمت استعادة البيانات بنجاح!');
                      } else {
                        alert('تعذر استيراد الملف. تأكد من صحة الملف.');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Full Project Codebase ZIP Download Card */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FolderArchive size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-emerald-950">
                      تحميل كود المشروع كاملاً في ملف مضغوط (ZIP)
                    </h4>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                      جاهز 100%
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1 max-w-xl leading-relaxed">
                    يحتوي الأرشيف على كامل الكود المصدري للتطبيق (React + TypeScript + Tailwind + PWA + الأيقونات وملف README الشامل). يمكنك فك الضغط وتشغيله محلياً عبر <code>npm install</code> ثم <code>npm run dev</code> أو تحويله إلى APK.
                  </p>
                </div>
              </div>

              <a
                href="/naftal-station-app.zip"
                download="naftal-station-app.zip"
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Download size={16} />
                <span>تحميل ملف المشروع (ZIP)</span>
              </a>
            </div>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="text-xs font-black text-red-900 block">
                إعادة ضبط التطبيق للبيانات الافتراضية
              </strong>
              <span className="text-[11px] text-red-700">
                إعادة تعيين أسماء العمال الـ 12 والدورة إلى الإعدادات الأولية لمحطة نفطال رأس الوادي.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('هل أنت متأكد من إعادة الضبط إلى البيانات الأولية للمحطة؟')) {
                  onResetDefaults();
                }
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shrink-0 transition"
            >
              إعادة الضبط الأولي
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT WORKER MODAL                                             */}
      {/* ============================================================== */}
      {editingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#08264d] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 size={18} className="text-[#f5d32e]" />
                <h3 className="text-sm font-black">تعديل بيانات العامل / المقعد</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWorker(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveWorkerModal} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العامل:</label>
                <input
                  type="text"
                  required
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="الاسم الكامل للعامل..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-[#08264d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوظيفة / المهمة:</label>
                <input
                  type="text"
                  value={workerRole}
                  onChange={(e) => setWorkerRole(e.target.value)}
                  placeholder="مثلاً: رئيس فوج / عامل ضخ وتوزيع وقود / صراف..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-[#08264d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={workerPhone}
                    onChange={(e) => setWorkerPhone(e.target.value)}
                    placeholder="0661234567"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-[#08264d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم التسجيل / الشارة:</label>
                  <input
                    type="text"
                    value={workerBadge}
                    onChange={(e) => setWorkerBadge(e.target.value)}
                    placeholder="NFT-100"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-[#08264d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الفوج المخصص:</label>
                <select
                  value={workerGroup}
                  onChange={(e) => setWorkerGroup(e.target.value as GroupId)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-[#08264d] bg-white"
                >
                  {GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#08264d] hover:bg-[#123862] text-white font-black shadow-xs"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
