# دليل بناء APK - Dragon Telegram Pro Mobile

## تاريخ: 9 فبراير 2026

---

## 📱 نظرة عامة

هذا الدليل يشرح كيفية بناء ملف APK للتطبيق الجوال بطرق مختلفة.

---

## 🎯 الطريقة 1: EAS Build (موصى به) ⭐

**المميزات:**
- ✅ بناء احترافي في السحابة
- ✅ توقيع تلقائي
- ✅ دعم كامل لجميع المكتبات
- ✅ لا يحتاج Android Studio

**المتطلبات:**
- حساب Expo (مجاني)
- EAS CLI

### الخطوات:

#### 1. تثبيت EAS CLI
```bash
npm install -g eas-cli
```

#### 2. تسجيل الدخول
```bash
eas login
```

#### 3. تكوين المشروع
```bash
cd dragaan
eas build:configure
```

#### 4. بناء APK
```bash
# بناء APK للإنتاج
eas build --platform android --profile production

# أو بناء APK للاختبار (أسرع)
eas build --platform android --profile preview
```

#### 5. تنزيل APK
- بعد اكتمال البناء، ستحصل على رابط تنزيل
- أو استخدم:
```bash
eas build:list
```

---

## 🎯 الطريقة 2: Expo Build (محلي)

**المميزات:**
- ✅ مجاني تماماً
- ✅ بناء محلي
- ✅ تحكم كامل

**العيوب:**
- ⚠️ يحتاج Android SDK
- ⚠️ إعداد معقد

### الخطوات:

#### 1. تثبيت Android SDK
```bash
# على Linux/Mac
sudo apt-get install android-sdk

# أو تنزيل Android Studio
# https://developer.android.com/studio
```

#### 2. تكوين المتغيرات البيئية
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### 3. بناء APK
```bash
cd dragaan
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

#### 4. العثور على APK
```bash
# APK سيكون في:
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🎯 الطريقة 3: استخدام GitHub Actions (تلقائي)

**المميزات:**
- ✅ بناء تلقائي عند كل push
- ✅ مجاني (2000 دقيقة/شهر)
- ✅ لا يحتاج إعداد محلي

### الخطوات:

#### 1. إنشاء ملف Workflow
أنشئ ملف: `.github/workflows/build-apk.yml`

```yaml
name: Build APK

on:
  push:
    branches: [ master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Setup Expo
      uses: expo/expo-github-action@v8
      with:
        expo-version: latest
        eas-version: latest
        token: ${{ secrets.EXPO_TOKEN }}
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Build APK
      run: eas build --platform android --profile preview --non-interactive
      
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-release.apk
        path: '*.apk'
```

#### 2. إضافة Secrets
في GitHub Repository:
- Settings → Secrets → New repository secret
- أضف: `EXPO_TOKEN` (احصل عليه من: `npx expo login`)

#### 3. تشغيل Workflow
- اذهب إلى Actions
- اختر "Build APK"
- اضغط "Run workflow"

---

## 🎯 الطريقة 4: استخدام Expo Application Services (EAS)

### ملف eas.json (موجود بالفعل)

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### أوامر البناء:

```bash
# بناء للتطوير (مع DevTools)
eas build --profile development --platform android

# بناء للمعاينة (للاختبار)
eas build --profile preview --platform android

# بناء للإنتاج (للنشر)
eas build --profile production --platform android
```

---

## 📝 تكوين التطبيق

### ملف app.config.ts

تأكد من تحديث المعلومات التالية:

```typescript
export default {
  expo: {
    name: "Dragon Telegram Pro",
    slug: "dragaan-pro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "dragaan",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0a7ea4"
    },
    android: {
      package: "com.dragaan.pro",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0a7ea4"
      },
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    plugins: [
      "expo-router",
      "expo-secure-store"
    ]
  }
}
```

---

## 🔐 توقيع APK

### إنشاء Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore dragaan-release-key.keystore \
  -alias dragaan-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```

### تكوين Gradle

في `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('dragaan-release-key.keystore')
            storePassword 'your_store_password'
            keyAlias 'dragaan-key-alias'
            keyPassword 'your_key_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 🎨 تخصيص الأيقونات

### إنشاء الأيقونات

يجب أن يكون لديك:
- `icon.png` (1024x1024)
- `adaptive-icon.png` (1024x1024)
- `splash.png` (1284x2778)

### استخدام أداة تلقائية

```bash
# تثبيت الأداة
npm install -g app-icon

# توليد جميع الأحجام
app-icon generate -i icon.png
```

---

## 📦 تحسين حجم APK

### 1. تفعيل ProGuard
في `android/app/build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
    }
}
```

### 2. تقسيم APK حسب ABI
```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk false
        }
    }
}
```

### 3. استخدام App Bundle (AAB)
```bash
# بدلاً من APK، استخدم AAB للنشر على Google Play
eas build --platform android --profile production
# سيتم إنشاء AAB تلقائياً
```

---

## 🧪 اختبار APK

### 1. تثبيت على جهاز حقيقي

```bash
# عبر ADB
adb install app-release.apk

# أو انقل الملف إلى الهاتف وثبّته يدوياً
```

### 2. اختبار الوظائف

قائمة التحقق:
- [ ] التطبيق يفتح بدون أخطاء
- [ ] تسجيل الدخول يعمل
- [ ] الاتصال بالسيرفر يعمل
- [ ] جميع الشاشات تعمل
- [ ] لا توجد أخطاء في Console

---

## 🚀 نشر APK

### الخيار 1: Google Play Store

1. **إنشاء حساب مطور** ($25 مرة واحدة)
2. **إنشاء تطبيق جديد**
3. **رفع AAB** (وليس APK)
4. **ملء المعلومات المطلوبة**
5. **إرسال للمراجعة**

### الخيار 2: توزيع مباشر

1. **رفع APK على خدمة استضافة**
   - Firebase App Distribution
   - GitHub Releases
   - موقعك الخاص

2. **مشاركة الرابط**
   ```
   https://yourdomain.com/downloads/dragaan-v1.0.0.apk
   ```

3. **السماح بالتثبيت من مصادر غير معروفة**
   - المستخدم يحتاج لتفعيل هذا الخيار

---

## 🔧 حل المشاكل الشائعة

### المشكلة 1: فشل البناء - "SDK not found"
**الحل:**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
```

### المشكلة 2: فشل البناء - "Out of memory"
**الحل:**
في `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

### المشكلة 3: APK كبير جداً
**الحل:**
- فعّل ProGuard
- استخدم App Bundle
- قسّم APK حسب ABI

### المشكلة 4: التطبيق يتعطل عند الفتح
**الحل:**
- تحقق من Logs: `adb logcat`
- تأكد من تكوين المتغيرات البيئية
- تأكد من صحة URL السيرفر

---

## 📊 معلومات إضافية

### حجم APK المتوقع
- **بدون تحسين:** ~50-80 MB
- **مع ProGuard:** ~30-50 MB
- **مع App Bundle:** ~20-30 MB (لكل ABI)

### وقت البناء المتوقع
- **EAS Build:** 10-20 دقيقة
- **بناء محلي:** 5-10 دقائق
- **GitHub Actions:** 15-25 دقيقة

### المتطلبات
- **RAM:** 8 GB على الأقل
- **Storage:** 10 GB مساحة حرة
- **Internet:** اتصال سريع (للتنزيلات)

---

## ✅ قائمة التحقق النهائية

قبل نشر APK:

- [ ] تم اختبار جميع الوظائف
- [ ] تم تحديث رقم الإصدار
- [ ] تم توقيع APK
- [ ] تم تحسين الحجم
- [ ] تم اختبار على أجهزة مختلفة
- [ ] تم تحديث URL السيرفر
- [ ] تم إضافة الأيقونات الصحيحة
- [ ] تم كتابة ملاحظات الإصدار

---

## 🎯 الخلاصة

**للبدء السريع:** استخدم EAS Build
```bash
eas build --platform android --profile preview
```

**للإنتاج:** استخدم EAS Build مع profile production
```bash
eas build --platform android --profile production
```

**للتوزيع:** استخدم Google Play Store أو Firebase App Distribution

---

## 📞 الدعم

إذا واجهت مشاكل:
1. راجع [Expo Documentation](https://docs.expo.dev)
2. راجع [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
3. افتح Issue في GitHub
