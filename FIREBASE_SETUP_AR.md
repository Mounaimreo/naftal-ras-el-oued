# إعداد الدخول الخاص عبر Facebook

التطبيق الآن **مغلق افتراضيًا** إذا لم تكن إعدادات Firebase موجودة. المستخدمون المصادق عليهم يستطيعون العرض فقط، أما حساب المسؤول المحدد في `VITE_ADMIN_FACEBOOK_UID` أو `VITE_ADMIN_EMAIL` فيستطيع تعديل أسماء العمال ومواقيت العمل.

## 1. إنشاء مشروع Firebase

1. افتح [Firebase Console](https://console.firebase.google.com/).
2. أنشئ مشروعًا جديدًا.
3. من **Project settings → Your apps** أضف تطبيق Web، ثم انسخ قيم الإعداد.
4. انسخ `.env.example` إلى `.env` وضع القيم في مكانها.

## 2. تفعيل Facebook

1. افتح **Authentication → Sign-in method**.
2. فعّل مزوّد **Facebook**.
3. أنشئ تطبيقًا من [Meta for Developers](https://developers.facebook.com/)، ثم ضع **App ID** و**App Secret** في إعداد مزوّد Facebook داخل Firebase.
4. أضف رابط OAuth Redirect URI الذي يعرضه Firebase إلى إعدادات Facebook Login في Meta.
5. أضف نطاق التطبيق المنشور إلى **Authentication → Settings → Authorized domains**.

## 3. تحديد المسؤول

بعد أول تسجيل دخول بحساب Facebook، احصل على Facebook UID من سجلات Firebase أو أداة الإدارة، ثم ضعه في:

```env
VITE_ADMIN_FACEBOOK_UID=Facebook_UID_الخاص_بك
```

يمكن بدلًا من ذلك ضبط البريد الموثق في Firebase:

```env
VITE_ADMIN_EMAIL=بريدك@example.com
```

لا تضع كلمة مرور أو App Secret داخل ملفات الواجهة أو مستودع Git.

## 4. التشغيل والبناء

```bash
cp .env.example .env
# عدّل .env بالقيم الصحيحة
npm install --legacy-peer-deps
npm run build
npx cap copy android
cd android
./gradlew assembleDebug
```

ملف APK الناتج سيكون داخل:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```
