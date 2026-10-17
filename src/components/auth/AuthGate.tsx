import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  FacebookAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  getRedirectResult,
} from 'firebase/auth';
import { ShieldCheck, LogIn, LogOut, LockKeyhole, Settings2 } from 'lucide-react';
import {
  adminEmail,
  adminFacebookUid,
  facebookProvider,
  firebaseAuth,
  isConfiguredAdmin,
  isFirebaseConfigured,
} from '../../auth/firebase';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isAdmin: false,
  signOutUser: async () => undefined,
});

export const useAuth = () => useContext(AuthContext);

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirectPending, setRedirectPending] = useState(false);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    getRedirectResult(firebaseAuth).catch((reason) => {
      if (reason?.code !== 'auth/no-auth-event') {
        setError('تعذر إكمال تسجيل الدخول عبر Facebook. حاول مرة أخرى.');
      }
      setRedirectPending(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = isConfiguredAdmin(user?.uid, user?.email);
  const contextValue = useMemo(
    () => ({
      user,
      isAdmin,
      signOutUser: async () => {
        if (firebaseAuth) await signOut(firebaseAuth);
      },
    }),
    [user, isAdmin],
  );

  if (loading || redirectPending) {
    return <LoadingScreen />;
  }

  if (!isFirebaseConfigured || !firebaseAuth) {
    return <SetupScreen />;
  }

  if (!user) {
    return (
      <LoginScreen
        error={error}
        onLogin={async () => {
          setError('');
          const auth = firebaseAuth;
          if (!auth) return;
          try {
            setRedirectPending(true);
            await signInWithPopup(auth, facebookProvider);
          } catch (reason: any) {
            setRedirectPending(false);
            if (reason?.code === 'auth/popup-blocked' || reason?.code === 'auth/operation-not-supported-in-this-environment') {
              await signInWithRedirect(auth, new FacebookAuthProvider());
              return;
            }
            if (reason?.code !== 'auth/popup-closed-by-user') {
              setError('فشل تسجيل الدخول عبر Facebook. تأكد من إعداد Facebook داخل Firebase.');
            }
          }
        }}
      />
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      <div className="fixed top-2 left-2 z-50 hidden sm:flex items-center gap-2 rounded-full bg-white/90 border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur">
        {isAdmin ? <ShieldCheck size={13} className="text-emerald-600" /> : <LockKeyhole size={13} className="text-slate-500" />}
        <span>{isAdmin ? 'المسؤول الموثق' : 'وضع العرض'}</span>
        <button type="button" onClick={contextValue.signOutUser} className="text-slate-400 hover:text-red-600" title="تسجيل الخروج">
          <LogOut size={13} />
        </button>
      </div>
      {children}
    </AuthContext.Provider>
  );
};

const LoadingScreen = () => (
  <div dir="rtl" className="min-h-screen bg-[#f4f6f7] flex items-center justify-center text-[#08264d]">
    <div className="rounded-3xl bg-white border border-slate-200 px-8 py-7 shadow-lg text-center">
      <div className="mx-auto mb-3 h-8 w-8 rounded-full border-4 border-slate-200 border-t-[#08264d] animate-spin" />
      <p className="text-sm font-bold">جارٍ التحقق من الهوية...</p>
    </div>
  </div>
);

const SetupScreen = () => (
  <div dir="rtl" className="min-h-screen bg-[#f4f6f7] flex items-center justify-center p-4 text-[#08264d]">
    <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-12 w-12 rounded-2xl bg-[#f5d32e] flex items-center justify-center"><Settings2 size={24} /></div>
        <div><h1 className="text-lg font-black">إعداد الدخول الخاص</h1><p className="text-xs text-slate-500">يجب تفعيل Firebase وFacebook قبل تشغيل التطبيق</p></div>
      </div>
      <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside leading-7">
        <li>أنشئ مشروعًا في Firebase وأضف Web App.</li>
        <li>من Authentication فعّل مزوّد Facebook وأدخل Facebook App ID وApp Secret.</li>
        <li>أضف نطاق التطبيق ضمن Authorized domains.</li>
        <li>ضع قيم Firebase في ملف <code dir="ltr" className="bg-slate-100 px-1 rounded">.env</code>.</li>
        <li>ضع Facebook UID الخاص بك في <code dir="ltr" className="bg-slate-100 px-1 rounded">VITE_ADMIN_FACEBOOK_UID</code>.</li>
      </ol>
      <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-6">
        التطبيق مغلق افتراضيًا حتى تكتمل هذه الإعدادات؛ لا يوجد أي دخول تجريبي أو كلمة مرور عامة.
      </div>
    </div>
  </div>
);

const LoginScreen: React.FC<{ error: string; onLogin: () => Promise<void> }> = ({ error, onLogin }) => (
  <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#08264d] via-[#123862] to-[#1554a3] flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl text-center">
      <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-[#f5d32e] text-[#08264d] flex items-center justify-center"><LockKeyhole size={30} /></div>
      <h1 className="text-xl font-black text-[#08264d]">فضاء محطة نفطال</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">هذا التطبيق خاص. سجّل الدخول بحساب Facebook المصرح له للوصول إلى جداول المحطة.</p>
      <button type="button" onClick={onLogin} className="mt-6 w-full rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white py-3 font-black flex items-center justify-center gap-2 transition">
        <FacebookIcon /> تسجيل الدخول عبر Facebook
      </button>
      {error && <p className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">{error}</p>}
    </div>
  </div>
);

const FacebookIcon = () => <span className="h-5 w-5 rounded-full bg-white text-[#1877F2] font-black leading-5">f</span>;
