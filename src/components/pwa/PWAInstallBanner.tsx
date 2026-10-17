import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X, Share2, PlusSquare, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface Props {
  variant?: 'banner' | 'card' | 'compact';
}

export const PWAInstallBanner: React.FC<Props> = ({ variant = 'banner' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed as standalone PWA
  if (isInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 flex items-center justify-between text-xs font-medium mb-4 no-print">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>أنت تستخدم التطبيق كنسخة أندرويد مثبتة ومستقلة على هاتفك</span>
        </div>
        <span className="bg-emerald-200/60 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
          نشط 100%
        </span>
      </div>
    );
  }

  if (dismissed && variant === 'banner') {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5d32e] hover:bg-[#e5c320] text-[#08264d] text-xs font-bold shadow-sm transition active:scale-95"
          title="تثبيت التطبيق على هاتفك أندرويد"
        >
          <Smartphone size={15} />
          <span>تثبيت في الهاتف</span>
        </button>

        {showGuideModal && <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuideModal(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-r from-[#08264d] via-[#123862] to-[#1554a3] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-white/10 mb-6 no-print">
        {/* Decorative corner accent */}
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-[#f5d32e]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#f5d32e] text-[#08264d] flex items-center justify-center shrink-0 shadow-md">
              <Smartphone size={24} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5d32e]/20 text-[#f5d32e] text-[10px] font-bold">
                  <Sparkles size={11} /> تطبيق أندرويد دائم (PWA)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                تثبيت فضاء محطة نفطال على هاتفك
              </h3>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed max-w-xl">
                ثبّت التطبيق ليظهر كأيقونة مستقلة على شاشة هاتفك الرئيسية، مع سرعة تصفح فائقة وإمكانية العمل بدون اتصال بالإنترنت.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#f5d32e] hover:bg-[#e5c320] text-[#08264d] text-sm font-black shadow-md transition active:scale-95"
            >
              <Download size={17} strokeWidth={2.4} />
              <span>تثبيت كتطبيق أندرويد</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
              aria-label="إخفاء"
              title="إخفاء الإشعار"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {showGuideModal && <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuideModal(false)} />}
    </>
  );
};

interface ModalProps {
  isIOS: boolean;
  onClose: () => void;
}

const InstallGuideModal: React.FC<ModalProps> = ({ isIOS, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#08264d] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f5d32e] text-[#08264d] flex items-center justify-center">
              <Smartphone size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm">كيفية تثبيت التطبيق على هاتفك</h4>
              <span className="text-[11px] text-slate-300">خطوات سهلة لجميع الهواتف</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-700">
          {!isIOS ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#08264d] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">في متصفح Chrome أو Samsung Internet:</strong>
                  <span>اضغط على زر الخيارات (⋮) أعلى يمين أو يسار شاشة المتصفح.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#08264d] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">اختر أمر التثبيت:</strong>
                  <span>اضغط على <strong>"تثبيت التطبيق"</strong> (Install App) أو <strong>"إضافة إلى الشاشة الرئيسية"</strong> (Add to Home screen).</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#08264d] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">تأكيد التثبيت:</strong>
                  <span>اضغط على "تثبيت". سيظهر التطبيق كأيقونة مستقلة كاملة تعمل كالبرامج الأصلية في جهازك وتعمل أوفلاين.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Share2 size={20} className="text-[#08264d] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block text-xs">اضغط على زر المشاركة:</strong>
                  <span>في متصفح Safari، اضغط على زر المشاركة أسفل الشاشة (أيقونة المربع بسهم للأعلى).</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <PlusSquare size={20} className="text-[#08264d] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block text-xs">إضافة للشاشة الرئيسية:</strong>
                  <span>مرر القائمة للأسفل واضغط على <strong>"إضافة إلى الشاشة الرئيسية"</strong> (Add to Home Screen).</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#08264d] hover:bg-[#123862] text-white font-bold text-xs transition"
            >
              فهمت، حسناً
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
