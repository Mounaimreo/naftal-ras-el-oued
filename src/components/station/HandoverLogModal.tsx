import React, { useState } from 'react';
import { FileText, X, Check, Plus, Fuel, Clock } from 'lucide-react';
import { HandoverReport, ShiftKey } from '../../types';
import { formatArabicDate } from '../../lib/rosterEngine';

interface Props {
  handovers: HandoverReport[];
  onAddHandover: (report: Omit<HandoverReport, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export const HandoverLogModal: React.FC<Props> = ({ handovers, onAddHandover, onClose }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<ShiftKey>('morning');
  const [supervisorName, setSupervisorName] = useState('');
  const [gasoilMeter, setGasoilMeter] = useState('');
  const [sansPlombMeter, setSansPlombMeter] = useState('');
  const [gplMeter, setGplMeter] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorName.trim()) return;

    onAddHandover({
      date,
      shift,
      supervisorName: supervisorName.trim(),
      gasoilMeter: gasoilMeter.trim() || 'عادي',
      sansPlombMeter: sansPlombMeter.trim() || 'عادي',
      gplMeter: gplMeter.trim() || 'عادي',
      notes: notes.trim() || 'تمت الوردية بشكل اعتيادي دون تسجيل أي عوائق.',
    });

    setShowAddForm(false);
    setSupervisorName('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#08264d] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f5d32e] text-[#08264d] flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">
                سجل تسليم واستلام الوردية (الدفتر اليومي للمحطة)
              </h3>
              <span className="text-[11px] text-slate-300">
                توثيق عدادات الوقود والملاحظات الفنية بين رؤساء الأفواج
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">
              التقارير المسجلة ({handovers.length}):
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-[#08264d] text-white font-bold flex items-center gap-1.5 hover:bg-[#123862] transition"
            >
              <Plus size={14} />
              <span>{showAddForm ? 'إلغاء الإدخال' : 'تسجيل تسليم وردية جديدة'}</span>
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-[#08264d] text-xs">إدخال محضر تسليم الوردية:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">التاريخ:</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">الوردية المسلمة:</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as ShiftKey)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="morning">الفترة الصباحية (06-14)</option>
                    <option value="evening">الفترة المسائية (14-22)</option>
                    <option value="night">الفترة الليلية (22-06)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم رئيس الفوج / المسلّم:</label>
                  <input
                    type="text"
                    required
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    placeholder="الاسم الكامل للمسؤول..."
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Tank and meter meters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">عداد المازوت (Gasoil):</label>
                  <input
                    type="text"
                    value={gasoilMeter}
                    onChange={(e) => setGasoilMeter(e.target.value)}
                    placeholder="مثلاً: 145,230 لتر"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">عداد البنزين (Sans Plomb):</label>
                  <input
                    type="text"
                    value={sansPlombMeter}
                    onChange={(e) => setSansPlombMeter(e.target.value)}
                    placeholder="مثلاً: 99,800 لتر"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">سيرغاز (GPL / بوتان):</label>
                  <input
                    type="text"
                    value={gplMeter}
                    onChange={(e) => setGplMeter(e.target.value)}
                    placeholder="مثلاً: 12,900 م³"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">ملاحظات وحالة العتاد والمضخات:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="سجل أي عطل، وصول شاحنة تزويد، ملاحظة أمنية، أو وصية للوردية القادمة..."
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#08264d] text-white font-bold text-xs hover:bg-[#123862]"
                >
                  حفظ المحضر في السجل
                </button>
              </div>
            </form>
          )}

          {/* List of past handovers */}
          <div className="space-y-3">
            {handovers.map((h) => (
              <div key={h.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs text-[#08264d]">
                      {h.supervisorName}
                    </strong>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                      {h.shift === 'morning' ? 'صباحي' : h.shift === 'evening' ? 'مسائي' : 'ليلي'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold">
                    {formatArabicDate(h.date)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-xl border border-slate-100 text-[11px]">
                  <div><span className="text-slate-400">مازوت:</span> <strong className="text-slate-800">{h.gasoilMeter}</strong></div>
                  <div><span className="text-slate-400">بنزين:</span> <strong className="text-slate-800">{h.sansPlombMeter}</strong></div>
                  <div><span className="text-slate-400">سيرغاز:</span> <strong className="text-slate-800">{h.gplMeter}</strong></div>
                </div>

                <p className="text-xs text-slate-700 bg-white/60 p-2 rounded-lg">
                  {h.notes}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
