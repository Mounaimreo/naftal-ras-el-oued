import React, { useState } from 'react';
import { CalendarRange, Printer, Download, ChevronRight, ChevronLeft, Filter, Users } from 'lucide-react';
import { DailyRoster, GroupId, ShiftKey, Worker } from '../../types';
import { GROUPS, SHIFT_META, STATION_INFO } from '../../lib/constants';
import { formatArabicDate, getDailyRoster, getMonthDays } from '../../lib/rosterEngine';
import { OverridesMap } from '../../lib/storage';

interface Props {
  workers: Worker[];
  cycleStartDate: string;
  groupOrder: GroupId[];
  overrides: OverridesMap;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const MonthlyCalendarView: React.FC<Props> = ({
  workers,
  cycleStartDate,
  groupOrder,
  overrides,
  selectedDate,
  onSelectDate,
}) => {
  const [currentYear, setCurrentYear] = useState(() => Number(selectedDate.slice(0, 4)) || 2026);
  const [currentMonth, setCurrentMonth] = useState(() => Number(selectedDate.slice(5, 7)) || 10);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<'ALL' | GroupId>('ALL');

  const monthDays = getMonthDays(currentYear, currentMonth);

  const monthNames = [
    'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['التاريخ', 'اليوم', 'الصباحية (06-14)', 'المسائية (14-22)', 'الليلية (22-06)', 'الراحة (48س)'];
    const rows = monthDays.map((d) => {
      const roster = getDailyRoster(d, workers, cycleStartDate, groupOrder, overrides);
      const morning = roster.workers.filter((w) => w.shift === 'morning').map((w) => w.name).join(' | ');
      const evening = roster.workers.filter((w) => w.shift === 'evening').map((w) => w.name).join(' | ');
      const night = roster.workers.filter((w) => w.shift === 'night').map((w) => w.name).join(' | ');
      const rest = roster.workers.filter((w) => w.shift === 'rest').map((w) => w.name).join(' | ');
      return `"${d}","${formatArabicDate(d, { showDayName: true, showYear: false })}","${morning}","${evening}","${night}","${rest}"`;
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `جدول_مناوبات_محطة_نفطال_${currentYear}_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-8">
      {/* Printable Station Official Header */}
      <div className="hidden print-only mb-6 border-b-2 border-[#08264d] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#08264d]">الشركة الوطنية لتسويق وتوزيع المواد البترولية - نفطال</h1>
            <h2 className="text-base font-bold text-slate-800">{STATION_INFO.name}</h2>
            <span className="text-xs text-slate-600">{STATION_INFO.subName}</span>
          </div>
          <div className="text-left font-bold text-sm">
            <div>جدول المناوبات الشهري (3×8)</div>
            <div className="text-blue-900">{monthNames[currentMonth - 1]} {currentYear}</div>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 no-print">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#08264d] text-[#f5d32e] flex items-center justify-center shrink-0">
            <CalendarRange size={22} />
          </div>
          <div>
            <h3 className="text-base font-black text-[#08264d]">
              الجدول الشهري الشامل لجميع الأفواج
            </h3>
            <p className="text-xs text-slate-500">
              استعراض كامل توزيع الورديات على مدار الشهر، مع إمكانية الطباعة على A4 أو التصدير
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Navigator */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition"
              title="الشهر السابق"
            >
              <ChevronRight size={16} />
            </button>
            <span className="text-xs font-black text-[#08264d] px-3 min-w-[110px] text-center">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition"
              title="الشهر التالي"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
            <Filter size={13} className="text-slate-400 mr-1" />
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">جميع الأفواج</option>
              {GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            title="تصدير إلى Excel"
          >
            <Download size={14} />
            <span className="hidden md:inline">تصدير Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#08264d] hover:bg-[#123862] text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition"
            title="طباعة الجدول"
          >
            <Printer size={14} />
            <span>طباعة الجدول</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 py-3 text-[11px] text-slate-600 border-b border-slate-100 mb-4">
        <span className="font-bold text-slate-800">دليل الرموز:</span>
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
          <span className="w-2 h-2 rounded-full bg-[#e4b420]" />
          صباحي (06:00 - 14:00)
        </span>
        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-md">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
          مسائي (14:00 - 22:00)
        </span>
        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded-md">
          <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
          ليلي (22:00 - 06:00)
        </span>
        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          راحة (48 ساعة)
        </span>
      </div>

      {/* Table Grid */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-right border-collapse text-xs min-w-[650px]">
          <thead>
            <tr className="bg-[#08264d] text-white">
              <th className="p-3 font-bold w-28">التاريخ واليوم</th>
              <th className="p-3 font-bold bg-[#b45309]/30">الوردية الصباحية (06-14)</th>
              <th className="p-3 font-bold bg-[#1e40af]/30">الوردية المسائية (14-22)</th>
              <th className="p-3 font-bold bg-[#3730a3]/30">الوردية الليلية (22-06)</th>
              <th className="p-3 font-bold bg-[#065f46]/30">فترة الراحة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthDays.map((d) => {
              const roster = getDailyRoster(d, workers, cycleStartDate, groupOrder, overrides);
              const isToday = d === selectedDate;

              const morningWorkers = roster.workers.filter(
                (w) => w.shift === 'morning' && (selectedGroupFilter === 'ALL' || w.groupId === selectedGroupFilter)
              );
              const eveningWorkers = roster.workers.filter(
                (w) => w.shift === 'evening' && (selectedGroupFilter === 'ALL' || w.groupId === selectedGroupFilter)
              );
              const nightWorkers = roster.workers.filter(
                (w) => w.shift === 'night' && (selectedGroupFilter === 'ALL' || w.groupId === selectedGroupFilter)
              );
              const restWorkers = roster.workers.filter(
                (w) => w.shift === 'rest' && (selectedGroupFilter === 'ALL' || w.groupId === selectedGroupFilter)
              );

              return (
                <tr
                  key={d}
                  onClick={() => onSelectDate(d)}
                  className={`cursor-pointer transition hover:bg-slate-50 ${
                    isToday ? 'bg-amber-50/80 font-bold' : ''
                  }`}
                >
                  {/* Date column */}
                  <td className="p-2.5 border-l border-slate-100 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                        isToday ? 'bg-[#08264d] text-white' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {d.slice(8)}
                      </span>
                      <div>
                        <span className="block text-[11px] text-slate-800 font-bold">
                          {formatArabicDate(d, { showDayName: true, showYear: false })}
                        </span>
                        {isToday && (
                          <span className="text-[9px] text-[#b45309] font-black">
                            (اليوم المختار)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Morning column */}
                  <td className="p-2.5 border-l border-slate-100 bg-[#fef9c3]/30">
                    <div className="space-y-1">
                      {morningWorkers.map((w) => (
                        <span
                          key={w.id}
                          className="inline-block text-[11px] bg-white border border-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md shadow-2xs ml-1"
                        >
                          {w.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Evening column */}
                  <td className="p-2.5 border-l border-slate-100 bg-[#dbeafe]/30">
                    <div className="space-y-1">
                      {eveningWorkers.map((w) => (
                        <span
                          key={w.id}
                          className="inline-block text-[11px] bg-white border border-blue-200 text-blue-900 px-1.5 py-0.5 rounded-md shadow-2xs ml-1"
                        >
                          {w.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Night column */}
                  <td className="p-2.5 border-l border-slate-100 bg-[#e0e7ff]/30">
                    <div className="space-y-1">
                      {nightWorkers.map((w) => (
                        <span
                          key={w.id}
                          className="inline-block text-[11px] bg-white border border-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded-md shadow-2xs ml-1"
                        >
                          {w.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Rest column */}
                  <td className="p-2.5 bg-[#d1fae5]/30">
                    <div className="space-y-1">
                      {restWorkers.map((w) => (
                        <span
                          key={w.id}
                          className="inline-block text-[11px] bg-white border border-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md shadow-2xs ml-1"
                        >
                          {w.name}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Print footer notes */}
      <div className="hidden print-only mt-8 pt-4 border-t border-slate-300 text-xs flex justify-between">
        <div>توقيع وتأشيرة مسؤول المحطة: .......................................</div>
        <div>خاتم محطة نفطال رأس الوادي: .......................................</div>
      </div>
    </div>
  );
};
