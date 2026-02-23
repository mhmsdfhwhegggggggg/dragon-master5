# 📱 تكوين بيئة التطبيق المحمول

## 🎯 **إعداد روابط API للإنتاج**

### **إنشاء ملف التكوين**
```typescript
// app/config/environment.ts
export const API_BASE_URL = 'https://dragon-master5.onrender.com';
export const OAUTH_URL = 'https://oauth.dragaan-pro.com';
export const APP_ID = 'dragon_telegram_pro_mobile';

// إعدادات الإنتاج
export const IS_PRODUCTION = true;
export const API_TIMEOUT = 10000;
export const RETRY_ATTEMPTS = 3;
```

### **تحديث app.json للإنتاج**
```json
{
  "expo": {
    "name": "Dragon Telegram Pro",
    "slug": "dragon-telegram-pro",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.dragantelegram.pro",
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.dragantelegram.pro",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/splash.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    "scheme": "dragon-telegram-pro",
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

---

## 🔧 **إعداد EAS Build**

### **تثبيت EAS CLI**
```bash
npm install -g @expo/eas-cli
```

### **تكوين EAS**
```json
{
  "cli": {
    "version": ">= 9.2.0"
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
      },
      "ios": {
        "buildType": "archive"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🚀 **أوامر البناء الإنتاجي**

### **الخطوة 1: تسجيل الدخول**
```bash
npx expo login
```

### **الخطوة 2: تثبيت الاعتماديات**
```bash
npm install
```

### **الخطوة 3: بناء Android APK**
```bash
# بناء APK للإنتاج
npx expo build:android --release-channel production --type apk

# أو باستخدام EAS
eas build --platform android --profile production
```

### **الخطوة 4: بناء iOS IPA**
```bash
# بناء IPA للإنتاج
npx expo build:ios --release-channel production --type archive

# أو باستخدام EAS
eas build --platform ios --profile production
```

---

## 📋 **التحقق من المتطلبات**

### **قبل البناء**
- [ ] تحديث روابط API في التطبيق
- [ ] التحقق من أن الخادم يعمل
- [ ] اختبار جميع نقاط API
- [ ] التحقق من مصادقة OAuth
- [ ] التحقق من تكوين EAS

### **أثناء البناء**
- [ ] متابعة سجل البناء
- [ ] التحقق من الأخطاء
- [ ] التأكد من اكتمال العملية

---

## 🔍 **اختبار التطبيق**

### **اختبار API**
```bash
# اختبار الصحة
curl https://dragon-master5.onrender.com/health

# اختبار المصادقة
curl https://dragon-master5.onrender.com/api/auth/me
```

### **اختبار التطبيق المحلي**
```bash
# تشغيل التطبيق محلياً
npx expo start --dev-client

# اختبار مع الخادم الإنتاجي
npx expo start --clear
```

---

## 📱 **خطوات البناء الكاملة**

### **1. التحضير**
```bash
# تثبيت الأدوات
npm install -g @expo/eas-cli
npm install

# تسجيل الدخول
npx expo login
eas login
```

### **2. التكوين**
```bash
# تهيئة المشروع
eas build:configure

# التحقق من التكوين
eas build:list
```

### **3. البناء**
```bash
# بناء Android APK
eas build --platform android --profile production

# بناء iOS IPA
eas build --platform ios --profile production
```

### **4. التنزيل**
```bash
# عرض البنيات
eas build:list

# تنزيل APK
eas build:view --platform android

# تنزيل IPA
eas build:view --platform ios
```

---

## 🎯 **النتيجة النهائية**

### **ملفات البناء**
- **Android**: `dragon-telegram-pro.apk`
- **iOS**: `Dragon Telegram Pro.ipa`

### **التثبيت**
```bash
# تثبيت Android
adb install dragon-telegram-pro.apk

# تثبيت iOS (iTunes)
# استخدم Xcode أو iTunes
```

---

## 🚨 **ملاحظات هامة**

### **الأمان**
- لا تضع مفاتيح API في التطبيق
- استخدم متغيرات البيئة
- تأمين نقاط النهاية

### **الأداء**
- تحسين الصور والأصول
- تقليل حجم التطبيق
- اختبار على أجهزة حقيقية

### **النشر**
- اختبار البناء النهائي
- التحقق من جميع الوظائف
- إعداد متجر التطبيقات

---

## 🎯 **الخلاصة**

### **ما تم إنجازه**
- ✅ تكوين بيئة الإنتاج
- ✅ إعداد روابط API
- ✅ تكوين EAS Build
- ✅ أوامر البناء الجاهزة
- ✅ خطوات الاختبار

### **الخطوات التالية**
1. **تنفيذ أوامر البناء**
2. **تنزيل ملفات APK/IPA**
3. **اختبار التطبيق**
4. **التوزيع للمستخدمين**

**الآن يمكنك بناء التطبيق وتحويله إلى APK!** 🚀
