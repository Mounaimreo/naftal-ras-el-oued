import React, { useState } from 'react';
import { UserCheck, Calendar, Clock, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { GroupId, Worker } from '../../types';
import { SHIFT_META } from '../../lib/constants';
import { formatArabicDate, getWorkerSchedule } from '../../lib/rosterEngine';
import { OverridesMap } from '../../lib/storage';

interface Props {
  workers: Worker[];
  cycleStartDate: string;
  groupOrder: GroupId[];
  overrides: OverridesMap;
  todayDate: string;
}

export const PersonalScheduleLookup: React.FC<Props> = ({
  workers,
  cycleStartDate,
  groupOrder,
  overrides,
  todayDate,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(() => workers[0]?.id || '');
  const [viewDaysCount, setViewDaysCount] = useState<number>(14);
  const [copied, setCopied] = useState(false);

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
  const schedule = selectedWorker
    ? getWorkerSchedule(selectedWorker.id, todayDate, viewDaysCount, workers, cycleStartDate, groupOrder, overrides)
    : [];

  // Summary counts
  const counts = schedule.reduce(
    (acc, curr) => {
      acc[curr.shift] = (acc[curr.shift] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleCopySchedule = () => {
    if (!selectedWorker) return;
    const lines = [
      `جدول مناوبات: ${selectedWorker.name} (${selectedWorker.role})`,
      `محطة نفطال رأس الوادي · للفترة القادمة:`,
      '--------------------------------',
      ...schedule.map((item) => {
        const dateStr = formatArabicDate(item.date, { showDayName: true, showYear: false });
        const meta = SHIFT_META[item.shift];
        return `• ${dateStr}: ${meta.title} (${meta.timeRange})`;
      }),
      '--------------------------------',
      `صباحي: ${counts.morning || 0} | مسائي: ${counts.evening || 0} | ليلي: ${counts.night || 0} | راحة: ${counts.rest || 0}`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#08264d] text-[#f5d32e] flex items-center justify-center shrink-0">
            <UserCheck size={22} />
          </div>
          <div>
            <h3 className="text-base font-black text-[#08264d]">
              استعلام جدول العامل الفردي
            </h3>
            <p className="text-xs text-slate-500">
              اختر اسمك لعرض جميع مواعيد مناوباتك القادمة وساعات العمل وفترات الراحة بدقة
            </p>
          </div>
        </div>

        {/* Worker Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 text-slate-900 focus:outline-[#08264d] min-w-[200px]"
          >
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} (فوج {w.groupId})
              </option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewDaysCount(7)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewDaysCount === 7 ? 'bg-white text-[#08264d] shadow-2xs' : 'text-slate-600'
              }`}
            >
              7 أيام
            </button>
            <button
              type="button"
              onClick={() => setViewDaysCount(14)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewDaysCount === 14 ? 'bg-white text-[#08264d] shadow-2xs' : 'text-slate-600'
              }`}
            >
              14 يوماً
            </button>
            <button
              type="button"
              onClick={() => setViewDaysCount(30)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewDaysCount === 30 ? 'bg-white text-[#08264d] shadow-2xs' : 'text-slate-600'
              }`}
            >
              30 يوماً
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopySchedule}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            title="نسخ الجدول لمشاركته في واتساب"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'تم النسخ!' : 'نسخ لواتساب'}</span>
          </button>
        </div>
      </div>

      {selectedWorker && (
        <div className="pt-5 space-y-6">
          {/* Worker Profile Card */}
          <div className="bg-gradient-to-r from-slate-900 to-[#08264d] text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-xs"
                style={{ backgroundColor: selectedWorker.avatarColor || '#3b82f6' }}
              >
                {Array.from(selectedWorker.name.trim())[0] || 'ع'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-white">{selectedWorker.name}</h4>
                  <span className="bg-[#f5d32e] text-[#08264d] text-[10px] font-black px-2 py-0.5 rounded-full">
                    الفوج {selectedWorker.groupId}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                  <span>{selectedWorker.role}</span>
                  {selectedWorker.phone && (
                    <>
                      <span>•</span>
                      <span dir="ltr">{selectedWorker.phone}</span>
                    </>
                  )}
                  {selectedWorker.badgeNumber && (
                    <>
                      <span>•</span>
                      <span>شارة: {selectedWorker.badgeNumber}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Shift Counts preview */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white/10 p-2 rounded-xl">
                <span className="text-[10px] text-amber-300 block">صباحي</span>
                <strong className="text-base font-black">{counts.morning || 0}</strong>
              </div>
              <div className="bg-white/10 p-2 rounded-xl">
                <span className="text-[10px] text-blue-300 block">مسائي</span>
                <strong className="text-base font-black">{counts.evening || 0}</strong>
              </div>
              <div className="bg-white/10 p-2 rounded-xl">
                <span className="text-[10px] text-indigo-300 block">ليلي</span>
                <strong className="text-base font-black">{counts.night || 0}</strong>
              </div>
              <div className="bg-white/10 p-2 rounded-xl">
                <span className="text-[10px] text-emerald-300 block">راحة</span>
                <strong className="text-base font-black">{counts.rest || 0}</strong>
              </div>
            </div>
          </div>

          {/* Timeline list of shifts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {schedule.map((item, idx) => {
              const meta = SHIFT_META[item.shift];
              const isToday = item.date === todayDate;

              return (
                <div
                  key={item.date}
                  className={`p-3 rounded-2xl border transition ${
                    isToday
                      ? 'border-slate-800 shadow-sm ring-2 ring-slate-800/10'
                      : 'border-slate-200/80 hover:shadow-xs'
                  }`}
                  style={{ backgroundColor: meta.bgLight }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#08264d] text-white text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <strong className="text-xs text-slate-900 font-bold">
                        {formatArabicDate(item.date, { showDayName: true, showYear: false })}
                      </strong>
                    </div>

                    {isToday && (
                      <span className="bg-[#08264d] text-[#f5d32e] text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        اليوم
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-black" style={{ color: meta.textColor }}>
                      {meta.title}
                    </span>
                    <span className="text-[10px] text-slate-600 font-medium">
                      {meta.timeRange}
                    </span>
                  </div>

                  {item.isManual && (
                    <span className="mt-1.5 inline-block text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-sm">
                      تعديل استثنائي من المسؤول
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
