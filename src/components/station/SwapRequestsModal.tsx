import React, { useState } from 'react';
import { ArrowLeftRight, X, Check, Clock, Plus, AlertCircle } from 'lucide-react';
import { ShiftKey, ShiftSwapRequest, Worker } from '../../types';
import { SHIFT_META } from '../../lib/constants';
import { formatArabicDate } from '../../lib/rosterEngine';

interface Props {
  workers: Worker[];
  swapRequests: ShiftSwapRequest[];
  onAddSwapRequest: (req: Omit<ShiftSwapRequest, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void;
  isAdmin: boolean;
  onClose: () => void;
}

export const SwapRequestsModal: React.FC<Props> = ({
  workers,
  swapRequests,
  onAddSwapRequest,
  onUpdateStatus,
  isAdmin,
  onClose,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [requesterId, setRequesterId] = useState(workers[0]?.id || '');
  const [recipientId, setRecipientId] = useState(workers[1]?.id || '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [originalShift, setOriginalShift] = useState<ShiftKey>('morning');
  const [targetShift, setTargetShift] = useState<ShiftKey>('evening');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requesterId === recipientId) {
      alert('لا يمكن اختيار نفس العامل!');
      return;
    }

    const requester = workers.find((w) => w.id === requesterId);
    const recipient = workers.find((w) => w.id === recipientId);
    if (!requester || !recipient) return;

    onAddSwapRequest({
      requesterId,
      requesterName: requester.name,
      recipientId,
      recipientName: recipient.name,
      date,
      originalShift,
      targetShift,
      reason: reason.trim() || 'تبادل مناوبة باتفاق الطرفين',
    });

    setShowForm(false);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#08264d] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f5d32e] text-[#08264d] flex items-center justify-center font-bold">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">
                طلبات تبديل المناوبات بين العمال
              </h3>
              <span className="text-[11px] text-slate-300">
                تقديم طلب تبديل وردية بين زميلين وتأكيدها من طرف المسؤول
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">
              قائمة الطلبات ({swapRequests.length}):
            </span>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="px-3 py-1.5 rounded-xl bg-[#08264d] text-white font-bold flex items-center gap-1.5 hover:bg-[#123862] transition"
            >
              <Plus size={14} />
              <span>{showForm ? 'إلغاء' : 'تقديم طلب تبديل جديد'}</span>
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-[#08264d] text-xs">طلب تبادل وردية:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">العامل طالب التبديل:</label>
                  <select
                    value={requesterId}
                    onChange={(e) => setRequesterId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (فوج {w.groupId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">الزميل المراد التبديل معه:</label>
                  <select
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (فوج {w.groupId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">وردية الطالب:</label>
                  <select
                    value={originalShift}
                    onChange={(e) => setOriginalShift(e.target.value as ShiftKey)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="morning">صباحي (06-14)</option>
                    <option value="evening">مسائي (14-22)</option>
                    <option value="night">ليلي (22-06)</option>
                    <option value="rest">راحة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">وردية الزميل المستهدفة:</label>
                  <select
                    value={targetShift}
                    onChange={(e) => setTargetShift(e.target.value as ShiftKey)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="morning">صباحي (06-14)</option>
                    <option value="evening">مسائي (14-22)</option>
                    <option value="night">ليلي (22-06)</option>
                    <option value="rest">راحة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">السبب / الملاحظة:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ظرف طارئ، موعد إداري، التزام عائلي..."
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#08264d] text-white font-bold text-xs hover:bg-[#123862]"
                >
                  إرسال الطلب للمسؤول
                </button>
              </div>
            </form>
          )}

          {/* List */}
          <div className="space-y-3">
            {swapRequests.map((req) => (
              <div key={req.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs text-slate-900">{req.requesterName}</strong>
                    <ArrowLeftRight size={13} className="text-slate-400" />
                    <strong className="text-xs text-slate-900">{req.recipientName}</strong>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {req.status === 'approved'
                      ? 'تمت الموافقة'
                      : req.status === 'rejected'
                      ? 'مرفوض'
                      : 'بانتظار المشرف'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 flex items-center gap-3">
                  <span>التاريخ: <strong>{formatArabicDate(req.date)}</strong></span>
                  <span>التبديل: من {SHIFT_META[req.originalShift].shortTitle} إلى {SHIFT_META[req.targetShift].shortTitle}</span>
                </div>

                <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                  السبب: {req.reason}
                </p>

                {isAdmin && req.status === 'pending' && (
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(req.id, 'rejected')}
                      className="px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs"
                    >
                      رفض
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(req.id, 'approved')}
                      className="px-4 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs"
                    >
                      موافقة واعتماد التبديل
                    </button>
                  </div>
                )}
              </div>
            ))}

            {swapRequests.length === 0 && (
              <div className="text-center py-6 text-slate-400">
                لا توجد طلبات تبديل حالياً
              </div>
            )}
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
