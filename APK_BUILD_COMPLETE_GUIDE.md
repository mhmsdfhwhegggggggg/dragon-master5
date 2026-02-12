# Dragon Telegram Pro - APK Build Complete Guide

## نظرة عامة
هذا الدليل يشرح كيفية بناء تطبيق Dragon Telegram Pro كملف APK جاهز للإنتاج.

## المتطلبات

### 1. تثبيت Expo CLI
```bash
npm install -g expo-cli
# أو
pnpm add -g expo-cli
```

### 2. تثبيت EAS CLI
```bash
npm install -g eas-cli
# أو
pnpm add -g eas-cli
```

### 3. إنشاء حساب Expo
```bash
eas login
# أو
eas register
```

## خطوات البناء

### الطريقة 1: البناء السحابي (الموصى به للإنتاج)

#### الخطوة 1: تكوين المشروع
```bash
cd /path/to/dragaan
eas build:configure
```

#### الخطوة 2: بناء APK
```bash
eas build --platform android --type apk
```

سيطلب منك:
- اختيار الملف الشخصي (profile)
- تأكيد الإعدادات

#### الخطوة 3: تحميل APK
بعد اكتمال البناء:
```bash
eas build:list
# سيعرض قائمة بالبناءات
# انسخ رابط التحميل من البناء الأخير
```

### الطريقة 2: البناء المحلي

#### المتطلبات الإضافية:
- Java Development Kit (JDK) 11 أو أحدث
- Android SDK
- Gradle

#### الخطوات:
```bash
# 1. تثبيت التبعيات
cd /path/to/dragaan
pnpm install

# 2. بناء APK محلياً
eas build --platform android --type apk --local

# 3. البحث عن الملف
# سيكون في: ./build-artifacts/android/
```

## إعدادات الإنتاج

### ملف app.json
تأكد من وجود الإعدادات التالية:

```json
{
  "expo": {
    "name": "Dragon Telegram Pro",
    "slug": "dragon-telegram-pro",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTabletMode": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.dragaontelegram.pro",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### ملف eas.json
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview2": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview3": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## التوقيع الرقمي

### إنشاء مفتاح التوقيع:
```bash
eas credentials
# اتبع الخطوات لإنشاء مفتاح جديد
```

### استخدام مفتاح موجود:
```bash
eas credentials --platform android
# اختر الخيار لاستخدام مفتاح موجود
```

## الاختبار

### اختبار APK محلياً:
```bash
# 1. نقل APK إلى جهاز Android
adb push build-artifacts/android/app-release.apk /sdcard/

# 2. تثبيت التطبيق
adb install /sdcard/app-release.apk

# 3. تشغيل التطبيق
adb shell am start -n com.dragaontelegram.pro/.MainActivity
```

### اختبار عبر الويب:
```bash
# استخدام Expo Go
expo start
# ثم افتح التطبيق على هاتفك من Expo Go
```

## النشر على Google Play Store

### المتطلبات:
1. حساب Google Play Developer ($25 رسم لمرة واحدة)
2. توقيع رقمي للتطبيق
3. صور وأوصاف للتطبيق

### الخطوات:
```bash
# 1. بناء AAB (Android App Bundle) للنشر
eas build --platform android --type app-bundle

# 2. تحميل على Google Play Console
# - انتقل إلى https://play.google.com/console
# - أنشئ تطبيق جديد
# - حمل ملف AAB
# - أكمل معلومات التطبيق والصور
# - أرسل للمراجعة
```

## استكشاف الأخطاء

### خطأ: "Build failed"
```bash
# امسح الذاكرة المؤقتة
eas build:cache --platform android --clear

# أعد المحاولة
eas build --platform android --type apk
```

### خطأ: "Invalid credentials"
```bash
# تحقق من بيانات الاعتماد
eas credentials

# أعد تعيين بيانات الاعتماد إذا لزم الأمر
eas credentials --platform android --clear
```

### خطأ: "Java not found"
```bash
# تثبيت JDK
# على Ubuntu/Debian:
sudo apt-get install openjdk-11-jdk

# على macOS:
brew install openjdk@11

# على Windows:
# حمل من https://www.oracle.com/java/technologies/javase-jdk11-downloads.html
```

## الحجم والأداء

### تقليل حجم APK:
```bash
# استخدم ProGuard/R8 للتصغير
# في app.json:
{
  "android": {
    "enableProguardInReleaseBuilds": true
  }
}
```

### حجم APK المتوقع:
- حجم قاعدي: ~50-100 MB
- مع الأصول: ~100-150 MB
- مع ProGuard: ~40-80 MB

## الإصدار والتحديثات

### إصدار جديد:
```bash
# 1. حدّث رقم الإصدار في app.json
{
  "version": "1.1.0"
}

# 2. حدّث versionCode في app.json
{
  "android": {
    "versionCode": 2
  }
}

# 3. بناء APK جديد
eas build --platform android --type apk
```

## الأمان

### أفضل الممارسات:
1. استخدم HTTPS لجميع الاتصالات
2. لا تخزن بيانات حساسة محلياً
3. استخدم التشفير للبيانات المحفوظة
4. قم بتحديث التبعيات بانتظام
5. استخدم توقيع رقمي قوي

## الموارد الإضافية

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android App Distribution](https://developer.android.com/distribute)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

## الدعم

للمساعدة والدعم:
- البريد الإلكتروني: support@dragaontelegram.pro
- الموقع: https://dragaontelegram.pro
- GitHub Issues: https://github.com/mhmsdfhwhegggggggg/dragaan/issues
