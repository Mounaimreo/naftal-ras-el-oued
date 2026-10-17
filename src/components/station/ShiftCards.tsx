import React from 'react';
import { Sun, Sunset, Moon, Coffee, Phone, AlertCircle, Edit3 } from 'lucide-react';
import { SHIFT_META } from '../../lib/constants';
import { RosterWorker, ShiftKey } from '../../types';

interface Props {
  workers: RosterWorker[];
  isManualOverride: boolean;
  onEditWorker?: (worker: RosterWorker) => void;
  isAdmin?: boolean;
}

const SHIFT_ICONS: Record<ShiftKey, React.ComponentType<{ size?: number; className?: string }>> = {
  morning: Sun,
  evening: Sunset,
  night: Moon,
  rest: Coffee,
};

export const ShiftCards: React.FC<Props> = ({
  workers,
  isManualOverride,
  onEditWorker,
  isAdmin = false,
}) => {
  const shiftKeys: ShiftKey[] = ['morning', 'evening', 'night', 'rest'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {shiftKeys.map((key) => {
        const meta = SHIFT_META[key];
        const Icon = SHIFT_ICONS[key];
        const shiftWorkers = workers.filter((w) => w.shift === key);

        return (
          <div
            key={key}
            className="bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col transition hover:shadow-md"
            style={{ borderColor: meta.borderColor }}
          >
            {/* Header */}
            <div
              className="p-3.5 border-b flex items-center justify-between"
              style={{ backgroundColor: meta.bgLight, borderColor: meta.borderColor }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: meta.color }}
                >
                  <Icon size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">
                    {meta.title}
                  </h3>
                  <span className="text-[10px] text-slate-600 block">
                    {meta.timeRange}
                  </span>
                </div>
              </div>

              <span
                className="text-[11px] font-black px-2 py-0.5 rounded-full"
                style={{ backgroundColor: meta.color, color: 'white' }}
              >
                {shiftWorkers.length}/3 عمال
              </span>
            </div>

            {/* Workers List */}
            <div className="p-3 space-y-2 flex-1">
              {shiftWorkers.map((worker) => {
                const initials = Array.from(worker.name.trim())[0] || 'ع';
                const isPlaceholder = worker.isPlaceholder || worker.name.includes('المقعد');

                return (
                  <div
                    key={worker.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                      isPlaceholder
                        ? 'bg-amber-50/70 border-amber-200 border-dashed'
                        : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                          isPlaceholder ? 'bg-amber-400' : ''
                        }`}
                        style={!isPlaceholder ? { backgroundColor: worker.avatarColor || meta.color } : undefined}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong
                            className={`text-xs block truncate ${
                              isPlaceholder ? 'text-amber-900' : 'text-slate-900'
                            }`}
                          >
                            {worker.name}
                          </strong>
                          {worker.isManualOverride && (
                            <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1 rounded-sm shrink-0">
                              تعديل
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {isPlaceholder ? 'بانتظار تحديد الاسم' : worker.role}
                        </span>
                      </div>
                    </div>

                    {/* Quick Call or Edit button */}
                    <div className="flex items-center gap-1 shrink-0">
                      {worker.phone && !isPlaceholder && (
                        <a
                          href={`tel:${worker.phone}`}
                          className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition"
                          title={`اتصال بـ ${worker.name} (${worker.phone})`}
                        >
                          <Phone size={13} />
                        </a>
                      )}
                      {isAdmin && onEditWorker && (
                        <button
                          type="button"
                          onClick={() => onEditWorker(worker)}
                          className="w-7 h-7 rounded-lg bg-slate-200/70 text-slate-700 hover:bg-slate-300 flex items-center justify-center transition"
                          title="تعديل بيانات العامل"
                        >
                          <Edit3 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {shiftWorkers.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  لا يوجد عمال معينين في هذه الفترة
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span>{meta.description}</span>
              {shiftWorkers.some((w) => w.isPlaceholder) && (
                <span className="text-amber-700 font-bold flex items-center gap-0.5">
                  <AlertCircle size={11} /> مقعد شاغر
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
