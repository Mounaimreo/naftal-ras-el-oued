import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { SHIFT_META } from '../../lib/constants';
import { ShiftKey } from '../../types';

interface Props {
  cycleDayIndex: number; // 0 to 7
  cycleStartDate: string;
}

export const CycleRibbon: React.FC<Props> = ({ cycleDayIndex, cycleStartDate }) => {
  const phases: { key: ShiftKey; label: string; days: string }[] = [
    { key: 'morning', label: 'الصباحية', days: 'يومان (06:00 - 14:00)' },
    { key: 'evening', label: 'المسائية', days: 'يومان (14:00 - 22:00)' },
    { key: 'night', label: 'الليلية', days: 'يومان (22:00 - 06:00)' },
    { key: 'rest', label: 'الراحة', days: 'يومان (استراحة 48 س)' },
  ];

  const currentPhaseIndex = Math.floor(cycleDayIndex / 2);
  const dayInCurrentPhase = (cycleDayIndex % 2) + 1;

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#08264d] text-[#f5d32e] flex items-center justify-center shrink-0">
            <RefreshCw size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-xs font-bold text-[#08264d]">دورة المناوبات المستمرة (3×8)</strong>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                اليوم {cycleDayIndex + 1} من 8
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              يومان لكل فترة · إجمالي 8 أيام تتكرر بانتظام بين الأفواج الأربعة
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-600 self-end sm:self-auto">
          <Clock size={13} className="text-slate-400" />
          <span>موقع الفوج (أ) اليوم: <strong className="text-[#08264d]">{phases[currentPhaseIndex].label} (اليوم {dayInCurrentPhase}/2)</strong></span>
        </div>
      </div>

      {/* Visual Sequence */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
        {phases.map((phase, idx) => {
          const meta = SHIFT_META[phase.key];
          const isCurrentForGroupA = idx === currentPhaseIndex;

          return (
            <div
              key={phase.key}
              className={`relative rounded-xl p-2.5 transition border ${
                isCurrentForGroupA
                  ? 'border-slate-800 shadow-xs ring-1 ring-slate-800/20'
                  : 'border-slate-100 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: meta.bgLight }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black" style={{ color: meta.textColor }}>
                  {meta.title}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
              </div>
              <div className="text-[10px] text-slate-600 mt-1 font-medium">
                {meta.timeRange}
              </div>

              {isCurrentForGroupA && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#08264d]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#08264d] animate-pulse" />
                  <span>نشطة الآن (اليوم {dayInCurrentPhase} من 2)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
