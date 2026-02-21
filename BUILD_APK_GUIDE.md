# دليل بناء APK - Dragon Telegram Pro Mobile

## تاريخ الإنشاء: 8 فبراير 2026

---

## 📱 نظرة عامة

هذا الدليل يشرح كيفية بناء ملف APK للتطبيق للاستخدام على أجهزة Android.

---

## ⚙️ المتطلبات الأساسية

### 1. تثبيت EAS CLI (Expo Application Services)

```bash
npm install -g eas-cli
```

### 2. تسجيل الدخول إلى Expo

```bash
eas login
```

إذا لم يكن لديك حساب:
```bash
eas register
```

---

## 🔧 طرق البناء

### الطريقة 1: بناء APK محلي (Local Build)

**المميزات:**
- ✅ مجاني تماماً
- ✅ لا يحتاج اتصال بالإنترنت بعد التثبيت
- ✅ سريع

**المتطلبات:**
- Android SDK
- Java JDK 17+

**الخطوات:**

1. **تثبيت Android SDK**
   ```bash
   # على Linux/Mac
   wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
   unzip commandlinetools-linux-9477386_latest.zip
   mkdir -p ~/Android/Sdk/cmdline-tools/latest
   mv cmdline-tools/* ~/Android/Sdk/cmdline-tools/latest/
   
   # إضافة إلى PATH
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

2. **تثبيت Java JDK 17**
   ```bash
   sudo apt-get install openjdk-17-jdk
   ```

3. **بناء APK**
   ```bash
   cd /path/to/dragaan
   pnpm install
   npx expo prebuild --platform android
   cd android
   ./gradlew assembleRelease
   ```

4. **العثور على APK**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

---

### الطريقة 2: EAS Build (Cloud Build) - موصى به ⭐

**المميزات:**
- ✅ سهل جداً
- ✅ لا يحتاج إعداد محلي
- ✅ بناء احترافي
- ✅ توقيع تلقائي

**القيود:**
- ⚠️ يحتاج اتصال بالإنترنت
- ⚠️ الخطة المجانية: 30 بناء/شهر

**الخطوات:**

1. **تكوين EAS**
   ```bash
   cd /path/to/dragaan
   eas build:configure
   ```

2. **إنشاء ملف eas.json** (سيتم إنشاؤه تلقائياً)
   ```json
   {
     "cli": {
       "version": ">= 5.0.0"
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

3. **بناء APK للمعاينة**
   ```bash
   eas build --platform android --profile preview
   ```

4. **بناء APK للإنتاج**
   ```bash
   eas build --platform android --profile production
   ```

5. **تنزيل APK**
   - سيظهر رابط التنزيل في Terminal
   - أو من https://expo.dev/accounts/[your-account]/projects/dragon-telegram-pro-mobile/builds

---

### الطريقة 3: Expo Go (للتطوير فقط)

**ملاحظة:** هذه الطريقة للتطوير فقط، ليست للإنتاج.

```bash
cd /path/to/dragaan
pnpm android
```

---

## 🔐 توقيع APK (للإنتاج)

### إنشاء Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore dragon-telegram.keystore \
  -alias dragon-telegram-key \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Dragon Telegram Pro, OU=Mobile, O=Dragon Telegram, L=City, ST=State, C=US"
```

**احفظ:**
- Keystore password
- Key password
- Alias name

### تكوين Gradle للتوقيع

في `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('DRAGON_RELEASE_STORE_FILE')) {
                storeFile file(DRAGON_RELEASE_STORE_FILE)
                storePassword DRAGON_RELEASE_STORE_PASSWORD
                keyAlias DRAGON_RELEASE_KEY_ALIAS
                keyPassword DRAGON_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

في `android/gradle.properties`:

```properties
DRAGON_RELEASE_STORE_FILE=dragon-telegram.keystore
DRAGON_RELEASE_STORE_PASSWORD=your_store_password
DRAGON_RELEASE_KEY_ALIAS=dragon-telegram-key
DRAGON_RELEASE_KEY_PASSWORD=your_key_password
```

---

## 📦 تحسين حجم APK

### 1. تفعيل ProGuard

في `android/app/build.gradle`:

```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. تقسيم APK حسب Architecture

في `android/app/build.gradle`:

```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a'
            universalApk false
        }
    }
}
```

### 3. إزالة الموارد غير المستخدمة

```gradle
android {
    buildTypes {
        release {
            shrinkResources true
        }
    }
}
```

---

## 🧪 اختبار APK

### 1. تثبيت APK على الجهاز

```bash
adb install app-release.apk
```

### 2. اختبار على أجهزة متعددة

- استخدم Firebase Test Lab
- أو BrowserStack
- أو أجهزة فعلية

### 3. فحص الأداء

```bash
adb shell dumpsys meminfo com.dragon.telegram.pro
```

---

## 🚀 نشر APK

### 1. Google Play Store

**الخطوات:**
1. إنشاء حساب Google Play Developer ($25 مرة واحدة)
2. إنشاء تطبيق جديد
3. رفع APK الموقّع
4. ملء معلومات التطبيق
5. إرسال للمراجعة

**باستخدام EAS:**
```bash
eas submit --platform android
```

### 2. توزيع مباشر (Direct Distribution)

**الخيارات:**
- رفع على موقعك الخاص
- استخدام Firebase App Distribution
- استخدام TestFlight (للـ iOS)
- مشاركة عبر Google Drive

**ملاحظة:** يجب تفعيل "تثبيت من مصادر غير معروفة" على الجهاز.

### 3. متاجر بديلة

- Amazon Appstore
- Samsung Galaxy Store
- Huawei AppGallery
- APKPure
- F-Droid (للتطبيقات مفتوحة المصدر)

---

## 📋 Checklist قبل النشر

- [ ] اختبار جميع الوظائف
- [ ] اختبار على أجهزة مختلفة
- [ ] فحص الأداء والذاكرة
- [ ] التأكد من عدم وجود أخطاء
- [ ] مراجعة الأذونات المطلوبة
- [ ] تحديث رقم الإصدار
- [ ] توقيع APK بـ keystore الإنتاج
- [ ] تحسين حجم APK
- [ ] إنشاء screenshots للمتجر
- [ ] كتابة وصف التطبيق
- [ ] تجهيز Privacy Policy

---

## 🔧 حل المشاكل الشائعة

### المشكلة: Build failed - SDK not found

**الحل:**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

### المشكلة: Out of memory during build

**الحل:**
في `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

### المشكلة: APK size too large

**الحل:**
1. تفعيل ProGuard
2. تقسيم APK حسب Architecture
3. إزالة الموارد غير المستخدمة
4. استخدام WebP للصور

### المشكلة: App crashes on startup

**الحل:**
```bash
adb logcat | grep -i error
```

---

## 📊 معلومات إضافية

### حجم APK المتوقع
- **بدون تحسين:** ~50-80 MB
- **مع تحسين:** ~20-40 MB
- **مقسّم حسب Architecture:** ~15-25 MB لكل architecture

### وقت البناء المتوقع
- **Local Build:** 5-15 دقيقة
- **EAS Build:** 10-20 دقيقة
- **أول بناء:** قد يستغرق أطول

### متطلبات النظام للبناء المحلي
- **RAM:** 8 GB على الأقل (16 GB موصى به)
- **Storage:** 10 GB مساحة حرة
- **CPU:** معالج رباعي النواة أو أفضل

---

## 🎯 الخطوة التالية

بعد بناء APK بنجاح:

1. ✅ اختبر التطبيق على أجهزة حقيقية
2. ✅ اجمع feedback من المستخدمين
3. ✅ أصلح الأخطاء المكتشفة
4. ✅ حدّث التطبيق بانتظام
5. ✅ راقب الأداء والأخطاء

---

**تم إنشاء هذا الدليل بواسطة**: Manus AI  
**التاريخ**: 8 فبراير 2026
