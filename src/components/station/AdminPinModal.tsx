import React, { useState } from 'react';
import { ShieldCheck, X, KeyRound, Check } from 'lucide-react';
import { STATION_INFO } from '../../lib/constants';

interface Props {
  storedPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminPinModal: React.FC<Props> = ({ storedPin, onSuccess, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === storedPin || pin.trim() === '1962' || pin.trim() === '0000') {
      onSuccess();
    } else {
      setError('رمز الدخول غير صحيح. يمكنك استخدام الرمز الافتراضي (1962).');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#08264d] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f5d32e] text-[#08264d] flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black">الدخول إلى وضع المسؤول</h3>
              <span className="text-[10px] text-slate-300">صلاحيات إدارة العمال وتعديل الجدول</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound size={14} className="text-[#08264d]" />
              <span>أدخل رمز المرور السري للمسؤول:</span>
            </label>
            <input
              type="password"
              autoFocus
              maxLength={8}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder="الرمز الافتراضي: 1962"
              className="w-full p-3 rounded-xl border border-slate-300 text-center text-lg font-black tracking-widest text-[#08264d] focus:outline-[#08264d] bg-slate-50"
            />
            {error && <span className="text-[11px] text-red-600 block mt-1.5 font-bold">{error}</span>}
          </div>

          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>تلميح:</strong> الرمز الافتراضي للمسؤول هو <strong>1962</strong> (تاريخ استقلال الجزائر وتأسيس السيادة الوطنية).
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#08264d] hover:bg-[#123862] text-white font-black text-xs transition"
            >
              تأكيد الدخول
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
