import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  FacebookAuthProvider,
  getRedirectResult,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type ActionCodeSettings,
  type User,
} from 'firebase/auth';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
  AndroidBiometryStrength,
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
} from '@aparajita/capacitor-biometric-auth';
import {
  AlertCircle,
  Fingerprint,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import {
  adminEmail,
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

const EMAIL_STORAGE_KEY = 'naftal_email_link_email_v1';
const BIOMETRIC_STORAGE_PREFIX = 'naftal_biometric_enabled_v1:';
const isAndroidApp = Capacitor.getPlatform() === 'android';

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeHost(value?: string): string {
  return (value || '').trim().replace(/^https?:\/\//i, '').split(/[/?#]/, 1)[0];
}

function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Login remains available if browser storage is disabled.
  }
}

function safeStorageRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function biometricKey(uid: string): string {
  return `${BIOMETRIC_STORAGE_PREFIX}${uid}`;
}

function getEmailLinkCandidate(auth: NonNullable<typeof firebaseAuth>, rawUrl: string): string | null {
  const candidates = new Set<string>([rawUrl]);
  try {
    const outerUrl = new URL(rawUrl);
    for (const key of ['link', 'deep_link_id', 'deepLink', 'continueUrl']) {
      const nestedUrl = outerUrl.searchParams.get(key);
      if (nestedUrl) candidates.add(nestedUrl);
    }
  } catch {
    return null;
  }

  for (const candidate of candidates) {
    try {
      if (isSignInWithEmailLink(auth, candidate)) return candidate;
    } catch {
      // Ignore malformed candidate URLs and try the next one.
    }
  }
  return null;
}

function buildEmailActionSettings(): ActionCodeSettings {
  const configuredContinueUrl = import.meta.env.VITE_FIREBASE_EMAIL_LINK_URL?.trim();
  const explicitLinkDomain = normalizeHost(import.meta.env.VITE_FIREBASE_LINK_DOMAIN);
  const authDomain = normalizeHost(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  const nativeFallbackHost = explicitLinkDomain || authDomain;
  const url = configuredContinueUrl || (isAndroidApp && nativeFallbackHost
    ? `https://${nativeFallbackHost}`
    : window.location.origin);

  return {
    url,
    handleCodeInApp: true,
    android: {
      packageName: 'com.naftal.station',
      installApp: false,
      minimumVersion: '1',
    },
    ...(explicitLinkDomain ? { linkDomain: explicitLinkDomain } : {}),
  };
}

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [redirectPending, setRedirectPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(adminEmail);
  const [pendingEmailLink, setPendingEmailLink] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLocked, setBiometricLocked] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [strongBiometryAvailable, setStrongBiometryAvailable] = useState<boolean | null>(null);
  const incomingLinks = useRef(new Set<string>());

  const isAdmin = isConfiguredAdmin(user?.uid, user?.email);

  const finishEmailLink = useCallback(async (link: string, emailAddress: string) => {
    const auth = firebaseAuth;
    if (!auth) return;

    const normalized = normalizeEmail(emailAddress);
    const configuredAdminEmail = normalizeEmail(adminEmail);
    if (!configuredAdminEmail || normalized !== configuredAdminEmail) {
      setError('هذا البريد غير مخوّل للدخول كمسؤول. استخدم البريد الإداري المسجّل في إعدادات التطبيق.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await signInWithEmailLink(auth, normalized, link);
      safeStorageRemove(EMAIL_STORAGE_KEY);
      setPendingEmailLink(null);
      setEmail(normalized);

      if (!isConfiguredAdmin(result.user.uid, result.user.email)) {
        await signOut(auth);
        setError('تم التحقق من البريد، لكنه غير مضاف كحساب مسؤول لهذا التطبيق.');
        return;
      }
      setNotice('تم تأكيد البريد بنجاح.');
      if (window.location.href === link) {
        const cleanUrl = new URL(window.location.href);
        for (const key of ['mode', 'oobCode', 'apiKey', 'continueUrl', 'link', 'lang', 'tenantId']) {
          cleanUrl.searchParams.delete(key);
        }
        window.history.replaceState({}, document.title, `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
      }
    } catch (reason: any) {
      const code = typeof reason?.code === 'string' ? reason.code : '';
      if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
        setError('انتهت صلاحية رابط الدخول أو استُخدم من قبل. اطلب رابطًا جديدًا من التطبيق.');
      } else if (code === 'auth/invalid-email') {
        setError('تعذر التحقق من البريد. أدخل البريد نفسه الذي استُلم عليه الرابط.');
      } else {
        setError('تعذر إكمال رابط الدخول. افتح أحدث رسالة على الجهاز نفسه أو أعد طلب الرابط.');
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const handleIncomingEmailLink = useCallback(async (rawUrl: string) => {
    const auth = firebaseAuth;
    if (!auth) return;

    const candidate = getEmailLinkCandidate(auth, rawUrl);
    if (!candidate || incomingLinks.current.has(candidate)) return;
    incomingLinks.current.add(candidate);

    const savedEmail = safeStorageGet(EMAIL_STORAGE_KEY);
    if (savedEmail) {
      await finishEmailLink(candidate, savedEmail);
      return;
    }

    setPendingEmailLink(candidate);
    setEmail(adminEmail);
    setNotice('لإكمال الدخول من هذا الجهاز، أكّد البريد الذي استُلم عليه الرابط.');
    setError('');
  }, [finishEmailLink]);

  useEffect(() => {
    const auth = firebaseAuth;
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      setRedirectPending(false);

      const nextIsAdmin = isConfiguredAdmin(nextUser?.uid, nextUser?.email);
      const enabled = Boolean(
        isAndroidApp
        && nextUser?.uid
        && nextIsAdmin
        && safeStorageGet(biometricKey(nextUser.uid)) === '1',
      );
      setBiometricEnabled(enabled);
      setBiometricLocked(enabled);
      setShowBiometricSetup(Boolean(isAndroidApp && nextUser?.uid && nextIsAdmin && !enabled));
      setStrongBiometryAvailable(null);
    });

    void getRedirectResult(auth)
      .then(() => setRedirectPending(false))
      .catch((reason: any) => {
        if (reason?.code !== 'auth/no-auth-event') {
          setError('تعذر إكمال تسجيل الدخول عبر Facebook. حاول مرة أخرى.');
        }
        setRedirectPending(false);
      });

    void handleIncomingEmailLink(window.location.href);

    let cancelled = false;
    let urlListener: { remove: () => Promise<void> } | undefined;
    if (isAndroidApp) {
      void (async () => {
        try {
          const listener = await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
            void handleIncomingEmailLink(url);
          });
          if (cancelled) {
            await listener.remove();
            return;
          }
          urlListener = listener;
          const launch = await CapacitorApp.getLaunchUrl();
          if (launch?.url) void handleIncomingEmailLink(launch.url);
        } catch {
          setError('تعذر تهيئة استقبال رابط البريد على هذا الجهاز. يمكنك استخدام Facebook كطريقة بديلة.');
        }
      })();
    }

    return () => {
      cancelled = true;
      unsubscribe();
      void urlListener?.remove();
    };
  }, [handleIncomingEmailLink]);

  useEffect(() => {
    if (!showBiometricSetup || !isAndroidApp) return;
    let cancelled = false;
    void BiometricAuth.checkBiometry()
      .then((info) => {
        if (!cancelled) setStrongBiometryAvailable(info.strongBiometryIsAvailable);
      })
      .catch(() => {
        if (!cancelled) setStrongBiometryAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showBiometricSetup]);

  useEffect(() => {
    if (!user?.uid || !isAdmin || !isAndroidApp || !biometricEnabled) return;
    let cancelled = false;
    let stateListener: { remove: () => Promise<void> } | undefined;
    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) setBiometricLocked(true);
    }).then((listener) => {
      if (cancelled) {
        void listener.remove();
      } else {
        stateListener = listener;
      }
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      void stateListener?.remove();
    };
  }, [user?.uid, isAdmin, biometricEnabled]);

  const contextValue = useMemo<AuthState>(() => ({
    user,
    isAdmin,
    signOutUser: async () => {
      if (firebaseAuth) await signOut(firebaseAuth);
    },
  }), [user, isAdmin]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const normalized = normalizeEmail(email);
    const configuredAdminEmail = normalizeEmail(adminEmail);

    if (!configuredAdminEmail) {
      setError('بريد المسؤول غير مضبوط في إعدادات التطبيق.');
      return;
    }
    if (normalized !== configuredAdminEmail) {
      setError('هذا البريد غير مخوّل. أدخل البريد الإداري المعتمد لهذا التطبيق.');
      return;
    }
    if (pendingEmailLink) {
      await finishEmailLink(pendingEmailLink, normalized);
      return;
    }

    const auth = firebaseAuth;
    if (!auth) return;
    setBusy(true);
    try {
      await sendSignInLinkToEmail(auth, normalized, buildEmailActionSettings());
      safeStorageSet(EMAIL_STORAGE_KEY, normalized);
      setNotice('أرسلنا رابط دخول لمرة واحدة إلى بريدك. افتحه على هذا الهاتف لإكمال الدخول.');
    } catch (reason: any) {
      const code = typeof reason?.code === 'string' ? reason.code : '';
      if (code === 'auth/unauthorized-continue-uri' || code === 'auth/unauthorized-domain') {
        setError('نطاق رابط العودة غير مفعّل في Firebase. أضف نطاق التطبيق إلى Authorized domains ثم أعد المحاولة.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('تسجيل الدخول عبر رابط البريد غير مفعّل في Firebase Authentication بعد.');
      } else {
        setError('تعذر إرسال رابط الدخول. تحقق من إعداد Email Link ونطاق Firebase ثم أعد المحاولة.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError('');
    setNotice('');
    const auth = firebaseAuth;
    if (!auth) return;
    try {
      setRedirectPending(true);
      await signInWithPopup(auth, facebookProvider);
      setRedirectPending(false);
    } catch (reason: any) {
      if (reason?.code === 'auth/popup-blocked' || reason?.code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, new FacebookAuthProvider());
          return;
        } catch {
          setRedirectPending(false);
          setError('تعذر فتح تسجيل الدخول عبر Facebook. حاول استخدام رابط البريد.');
          return;
        }
      }
      setRedirectPending(false);
      if (reason?.code !== 'auth/popup-closed-by-user') {
        setError('فشل تسجيل الدخول عبر Facebook. تأكد من إعداد Facebook داخل Firebase.');
      }
    }
  };

  const enableBiometric = async () => {
    if (!user?.uid) return;
    setError('');
    setBusy(true);
    try {
      const info = await BiometricAuth.checkBiometry();
      if (!info.strongBiometryIsAvailable) {
        setStrongBiometryAvailable(false);
        setError('لا توجد بصمة قوية مهيّأة للتطبيق. أضف بصمة في إعدادات Android أو تابع من دونها.');
        return;
      }
      await BiometricAuth.authenticate({
        reason: 'تحقق من هويتك لتفعيل الدخول بالبصمة إلى محطة نفطال.',
        androidTitle: 'تفعيل بصمة الدخول',
        androidSubtitle: 'استخدم البصمة أو وسيلة التحقق القوية المهيّأة على الجهاز.',
        androidConfirmationRequired: false,
        androidBiometryStrength: AndroidBiometryStrength.strong,
        allowDeviceCredential: false,
      });
      safeStorageSet(biometricKey(user.uid), '1');
      setBiometricEnabled(true);
      setBiometricLocked(false);
      setShowBiometricSetup(false);
      setNotice('تم تفعيل قفل البصمة على هذا الجهاز.');
    } catch (reason) {
      if (!(reason instanceof BiometryError && reason.code === BiometryErrorType.userCancel)) {
        setError('لم يتم تفعيل البصمة. جرّب مجددًا أو تابع من دونها.');
      }
    } finally {
      setBusy(false);
    }
  };

  const unlockWithBiometric = async () => {
    setError('');
    setBusy(true);
    try {
      const info = await BiometricAuth.checkBiometry();
      if (!info.strongBiometryIsAvailable) {
        setError('البصمة القوية غير متاحة حاليًا. استخدم تسجيل الدخول بالبريد لإعادة التحقق.');
        return;
      }
      await BiometricAuth.authenticate({
        reason: 'افتح تطبيق محطة نفطال باستخدام البصمة.',
        androidTitle: 'التحقق من المسؤول',
        androidSubtitle: 'أكّد هويتك للمتابعة.',
        androidConfirmationRequired: false,
        androidBiometryStrength: AndroidBiometryStrength.strong,
        allowDeviceCredential: false,
      });
      setBiometricLocked(false);
      setError('');
    } catch (reason) {
      if (reason instanceof BiometryError && reason.code === BiometryErrorType.userCancel) {
        setError('لم يكتمل التحقق. يمكنك المحاولة مرة أخرى.');
      } else {
        setError('تعذر التحقق بالبصمة. أعد المحاولة أو اختر تسجيل الدخول بالبريد.');
      }
    } finally {
      setBusy(false);
    }
  };

  const useEmailInsteadOfBiometric = async () => {
    if (user?.uid) safeStorageRemove(biometricKey(user.uid));
    setBiometricEnabled(false);
    setBiometricLocked(false);
    if (firebaseAuth) await signOut(firebaseAuth);
    setError('سُجّل خروجك بأمان. أرسل رابطًا جديدًا إلى بريد المسؤول لإعادة الدخول.');
  };

  if (loading || redirectPending) return <LoadingScreen />;
  if (!isFirebaseConfigured || !firebaseAuth) return <SetupScreen />;

  if (!user) {
    return (
      <LoginScreen
        email={email}
        setEmail={setEmail}
        error={error}
        notice={notice}
        busy={busy}
        awaitingEmailConfirmation={Boolean(pendingEmailLink)}
        onEmailSubmit={handleEmailSubmit}
        onFacebookLogin={handleFacebookLogin}
      />
    );
  }

  if (biometricLocked && isAdmin && isAndroidApp) {
    return (
      <BiometricLockScreen
        busy={busy}
        error={error}
        onUnlock={unlockWithBiometric}
        onUseEmail={useEmailInsteadOfBiometric}
      />
    );
  }

  if (showBiometricSetup && isAdmin && isAndroidApp) {
    return (
      <BiometricSetupScreen
        busy={busy}
        error={error}
        strongBiometryAvailable={strongBiometryAvailable}
        onEnable={enableBiometric}
        onSkip={() => {
          setError('');
          setShowBiometricSetup(false);
        }}
        onCheckAgain={() => {
          setStrongBiometryAvailable(null);
          void BiometricAuth.checkBiometry()
            .then((info) => setStrongBiometryAvailable(info.strongBiometryIsAvailable))
            .catch(() => setStrongBiometryAvailable(false));
        }}
      />
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      <div className="fixed top-2 left-2 z-50 hidden sm:flex items-center gap-2 rounded-full bg-white/90 border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur">
        {isAdmin ? <ShieldCheck size={13} className="text-emerald-600" /> : <LockKeyhole size={13} className="text-slate-500" />}
        <span>{isAdmin ? 'المسؤول الموثق' : 'وضع العرض'}</span>
        {isAdmin && isAndroidApp && biometricEnabled && <Fingerprint size={13} className="text-emerald-600" aria-label="البصمة مفعلة" />}
        <button type="button" onClick={contextValue.signOutUser} className="text-slate-400 hover:text-red-600" title="تسجيل الخروج" aria-label="تسجيل الخروج">
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
        <div><h1 className="text-lg font-black">إعداد الدخول الخاص</h1><p className="text-xs text-slate-500">يجب إعداد Firebase Authentication قبل تشغيل التطبيق</p></div>
      </div>
      <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside leading-7">
        <li>أنشئ مشروعًا في Firebase وأضف Web App.</li>
        <li>فعّل Facebook وEmail/Password وEmail link (passwordless) من Authentication.</li>
        <li>أضف نطاق التطبيق ضمن Authorized domains.</li>
        <li>ضع إعدادات Firebase وبريد المسؤول في ملف <code dir="ltr" className="bg-slate-100 px-1 rounded">.env</code>.</li>
      </ol>
      <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-6">
        التطبيق مغلق افتراضيًا حتى تكتمل هذه الإعدادات؛ لا توجد كلمة مرور أو بيانات دخول عامة.
      </div>
    </div>
  </div>
);

interface LoginScreenProps {
  email: string;
  setEmail: (value: string) => void;
  error: string;
  notice: string;
  busy: boolean;
  awaitingEmailConfirmation: boolean;
  onEmailSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFacebookLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  email,
  setEmail,
  error,
  notice,
  busy,
  awaitingEmailConfirmation,
  onEmailSubmit,
  onFacebookLogin,
}) => (
  <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#08264d] via-[#123862] to-[#1554a3] flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl text-center">
      <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-[#f5d32e] text-[#08264d] flex items-center justify-center"><LockKeyhole size={30} /></div>
      <h1 className="text-xl font-black text-[#08264d]">فضاء محطة نفطال</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">أرسل رابط دخول لمرة واحدة إلى بريد المسؤول. افتح الرابط على هذا الهاتف لإكمال التحقق.</p>

      <form onSubmit={onEmailSubmit} className="mt-6 text-right">
        <label htmlFor="admin-email" className="mb-2 block text-xs font-bold text-slate-700">البريد الإلكتروني للمسؤول</label>
        <div className="relative">
          <Mail size={17} className="absolute right-3 top-3.5 text-slate-400" />
          <input
            id="admin-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-3 pr-10 text-left text-sm text-slate-800 outline-none transition focus:border-[#1554a3] focus:bg-white focus:ring-2 focus:ring-blue-100"
            placeholder="name@example.com"
          />
        </div>
        <button type="submit" disabled={busy} className="mt-3 w-full rounded-2xl bg-[#08264d] hover:bg-[#123862] disabled:opacity-60 text-white py-3 font-black flex items-center justify-center gap-2 transition">
          {busy ? <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Mail size={18} />}
          {awaitingEmailConfirmation ? 'تأكيد البريد وإكمال الدخول' : 'إرسال رابط دخول آمن'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[10px] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /><span>أو الطريقة الاحتياطية</span><span className="h-px flex-1 bg-slate-200" />
      </div>
      <button type="button" onClick={onFacebookLogin} disabled={busy} className="w-full rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-60 text-white py-3 font-black flex items-center justify-center gap-2 transition">
        <FacebookIcon /> تسجيل الدخول عبر Facebook
      </button>
      <p className="mt-4 text-[11px] leading-5 text-slate-400">رابط البريد أحادي الاستخدام. إذا فتحته على جهاز آخر، أدخل البريد نفسه هنا للتأكيد.</p>
      {notice && <p role="status" className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold leading-5 text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold leading-5 text-red-700">{error}</p>}
    </div>
  </div>
);

interface BiometricScreenProps {
  busy: boolean;
  error: string;
}

const BiometricLockScreen: React.FC<BiometricScreenProps & { onUnlock: () => void; onUseEmail: () => void }> = ({
  busy,
  error,
  onUnlock,
  onUseEmail,
}) => (
  <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#08264d] via-[#123862] to-[#1554a3] flex items-center justify-center p-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-[#1554a3]"><Fingerprint size={42} /></div>
      <h1 className="text-xl font-black text-[#08264d]">تأكيد هوية المسؤول</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">تحقق بالبصمة أو وسيلة Android البيومترية القوية لفتح بيانات المحطة.</p>
      <button type="button" onClick={onUnlock} disabled={busy} className="mt-6 w-full rounded-2xl bg-[#08264d] py-3 font-black text-white transition hover:bg-[#123862] disabled:opacity-60">
        {busy ? 'جارٍ التحقق...' : 'فتح بالبصمة'}
      </button>
      <button type="button" onClick={onUseEmail} disabled={busy} className="mt-3 w-full rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60">
        تسجيل الخروج واستخدام رابط البريد
      </button>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold leading-5 text-red-700">{error}</p>}
    </div>
  </div>
);

interface BiometricSetupScreenProps extends BiometricScreenProps {
  strongBiometryAvailable: boolean | null;
  onEnable: () => void;
  onSkip: () => void;
  onCheckAgain: () => void;
}

const BiometricSetupScreen: React.FC<BiometricSetupScreenProps> = ({
  busy,
  error,
  strongBiometryAvailable,
  onEnable,
  onSkip,
  onCheckAgain,
}) => (
  <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#08264d] via-[#123862] to-[#1554a3] flex items-center justify-center p-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700"><Fingerprint size={42} /></div>
      <h1 className="text-xl font-black text-[#08264d]">تفعيل بصمة الدخول</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">بعد أول دخول بالبريد، يمكنك فتح التطبيق لاحقًا ببصمة الجهاز. تبقى بصمتك داخل Android ولا تصل إلى التطبيق.</p>
      {strongBiometryAvailable === null ? (
        <p className="mt-5 text-xs font-bold text-slate-500">جارٍ التحقق من توفر البصمة...</p>
      ) : strongBiometryAvailable ? (
        <button type="button" onClick={onEnable} disabled={busy} className="mt-6 w-full rounded-2xl bg-[#08264d] py-3 font-black text-white transition hover:bg-[#123862] disabled:opacity-60">
          {busy ? 'جارٍ التحقق...' : 'تفعيل البصمة على هذا الجهاز'}
        </button>
      ) : (
        <div className="mt-5 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">لم نعثر على بصمة قوية مهيّأة للتطبيق. أضف بصمة في إعدادات Android ثم أعد الفحص، أو تابع من دونها.</div>
      )}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onSkip} disabled={busy} className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60">لاحقًا</button>
        {strongBiometryAvailable === false && <button type="button" onClick={onCheckAgain} disabled={busy} className="flex-1 rounded-2xl border border-blue-200 py-3 text-sm font-bold text-[#1554a3] transition hover:bg-blue-50 disabled:opacity-60">إعادة الفحص</button>}
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold leading-5 text-red-700">{error}</p>}
    </div>
  </div>
);

const FacebookIcon = () => <span className="h-5 w-5 rounded-full bg-white text-[#1877F2] font-black leading-5">f</span>;
