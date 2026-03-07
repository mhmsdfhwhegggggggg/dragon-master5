# بناء APK للإنتاج - FALCON Telegram Pro

## الطريقة 1: EAS Build (مُوصى به)

يعتمد على السحابة ولا يحتاج Android SDK محلياً.

```bash
# 1. تسجيل الدخول (مرة واحدة)
npx eas login

# 2. بناء APK للإنتاج
npx eas build --platform android --profile production
```

بعد اكتمال البناء:
- سيظهر رابط لتحميل الـ APK من [expo.dev](https://expo.dev)
- أو استخدم: `npx eas build:list` لعرض البناءات

### متغيرات الإنتاج (مُعدّة في eas.json)
- `EXPO_PUBLIC_API_BASE_URL`: https://dragon-master5.onrender.com
- `EXPO_PUBLIC_OAUTH_SERVER_URL`: https://oauth.dragaan-pro.com
- `EXPO_PUBLIC_APP_ID`: falcon_telegram_pro

---

## الطريقة 2: البناء المحلي

### المتطلبات
- Android Studio + Android SDK
- متغير ANDROID_HOME مضبوط
- Java 17

### الخطوات

```bash
# 1. تعيين متغيرات API
$env:EXPO_PUBLIC_API_BASE_URL="https://dragon-master5.onrender.com"
$env:EXPO_PUBLIC_OAUTH_SERVER_URL="https://oauth.dragaan-pro.com"
$env:EXPO_PUBLIC_APP_ID="falcon_telegram_pro"

# 2. إنشاء مجلد Android (إذا لم يكن موجوداً)
npx expo prebuild --platform android --clean

# 3. بناء APK
cd android
.\gradlew assembleRelease

# 4. مسار الـ APK الناتج
# android/app/build/outputs/apk/release/app-release.apk
```

### إذا ظهر خطأ Gradle checksum
احذف مجلد التخزين المؤقت ثم أعد المحاولة:
```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\wrapper\dists\gradle-8.10.2-all" -ErrorAction SilentlyContinue
```

---

## الطريقة 3: GitHub Actions (تلقائي)

1. أضف `EXPO_TOKEN` في GitHub → Settings → Secrets
2. احصل عليه من: https://expo.dev/accounts/[account]/settings/access-tokens
3. نفّذ البناء يدوياً: Actions → Build Production APK → Run workflow

أو أنشئ tag للإصدار: `git tag v1.0.0 && git push origin v1.0.0`

---

## التطبيق جاهز للإنتاج

- **API:** https://dragon-master5.onrender.com
- **المستودع:** https://github.com/mhmsdfhwhegggggggg/dragon-master5
