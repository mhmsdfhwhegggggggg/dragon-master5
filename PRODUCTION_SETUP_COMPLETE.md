# دليل إصلاح وتجهيز Dragon Telegram Pro للإنتاج

## 📋 الحالة الحالية للتطبيق

التطبيق **dragaan** (Dragon Telegram Pro) يحتوي على:
- ✅ بنية قوية وموثقة جيداً
- ✅ نظام Anti-Ban متقدم
- ✅ قاعدة بيانات SQLite مع 12 جدول
- ✅ Backend API مع tRPC
- ✅ Frontend React Native مع Expo
- ✅ نظام الترخيص والتفعيل
- ⚠️ يحتاج إلى إصلاحات وتحسينات للإنتاج

---

## 🔧 الخطوات المطلوبة للإنتاج

### المرحلة 1: التكوين البيئي

#### 1.1 بيانات اعتماد Telegram API
احصل على بيانات اعتماد Telegram من:
- الموقع: https://my.telegram.org/apps
- ستحتاج إلى:
  - `TELEGRAM_API_ID` (رقم)
  - `TELEGRAM_API_HASH` (نص)

#### 1.2 بيانات OAuth (اختياري)
إذا كنت تستخدم OAuth للمصادقة:
- `OAUTH_SERVER_URL` = https://oauth.manus.im
- `VITE_APP_ID` = معرّف التطبيق الخاص بك

#### 1.3 مفاتيح التشفير والأمان
يجب توليد مفاتيح قوية:

```bash
# JWT Secret (32 حرف على الأقل)
openssl rand -base64 32

# Session Secret
openssl rand -base64 32

# Encryption Key (32 حرف بالضبط)
openssl rand -hex 16
```

### المرحلة 2: إعداد قاعدة البيانات

#### 2.1 اختيار نوع قاعدة البيانات

**الخيار 1: SQLite (الحالي - للتطوير)**
```bash
# قاعدة البيانات موجودة بالفعل في dev.db
# لا تحتاج إلى أي إعداد إضافي
```

**الخيار 2: PostgreSQL (للإنتاج - موصى به)**
```bash
# إنشاء قاعدة بيانات جديدة
createdb dragon_telegram_pro

# تطبيق migrations
pnpm db:push
```

**الخيار 3: MySQL (للإنتاج)**
```bash
# إنشاء قاعدة بيانات جديدة
mysql -u root -p -e "CREATE DATABASE dragon_telegram_pro;"

# تطبيق migrations
pnpm db:push
```

#### 2.2 تحديث DATABASE_URL

في ملف `.env`:
```env
# للتطوير (SQLite)
DATABASE_URL=file:./dev.db

# للإنتاج (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dragon_telegram_pro

# للإنتاج (MySQL)
DATABASE_URL=mysql://user:password@host:3306/dragon_telegram_pro
```

### المرحلة 3: تثبيت التبعيات

```bash
cd /home/ubuntu/dragaan

# تثبيت جميع التبعيات
pnpm install

# التحقق من عدم وجود أخطاء
pnpm check
```

### المرحلة 4: اختبار التطبيق محلياً

#### 4.1 بدء السيرفر
```bash
pnpm dev
```

#### 4.2 اختبار API
```bash
# في نافذة أخرى
curl http://localhost:3000/api/health

# يجب أن تحصل على:
# {"ok":true,"timestamp":1234567890}
```

#### 4.3 اختبار قاعدة البيانات
```bash
# للـ SQLite
sqlite3 dev.db "SELECT COUNT(*) FROM users;"

# للـ PostgreSQL
psql -d dragon_telegram_pro -c "SELECT COUNT(*) FROM users;"

# للـ MySQL
mysql -u root -p dragon_telegram_pro -e "SELECT COUNT(*) FROM users;"
```

---

## 🚀 رفع السيرفر على خدمة استضافة مجانية

### الخيار 1: Render.com (موصى به) ⭐

**المميزات:**
- ✅ استضافة مجانية 24/7
- ✅ دعم Node.js كامل
- ✅ PostgreSQL مجاني (256 MB)
- ✅ Redis مجاني
- ✅ SSL تلقائي

**الخطوات:**

1. **إنشاء حساب**
   - اذهب إلى https://render.com
   - سجل حساب جديد

2. **ربط المستودع**
   - اضغط "New +" → "Web Service"
   - اختر المستودع: `mhmsdfhwhegggggggg/dragaan`
   - اختر الفرع: `master`

3. **التكوين**
   - **Name:** dragaan-api
   - **Runtime:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `node dist/index.js`
   - **Plan:** Free

4. **إضافة المتغيرات البيئية**
   - اضغط "Environment"
   - أضف جميع المتغيرات من `.env`:
     ```
     TELEGRAM_API_ID=your_id
     TELEGRAM_API_HASH=your_hash
     JWT_SECRET=your_secret
     SESSION_SECRET=your_secret
     ENCRYPTION_KEY=your_key
     DATABASE_URL=postgresql://...
     REDIS_URL=redis://...
     NODE_ENV=production
     ```

5. **النشر**
   - اضغط "Create Web Service"
   - انتظر حتى يكتمل البناء
   - ستحصل على رابط مثل: `https://dragaan-api.onrender.com`

### الخيار 2: Railway.app

**المميزات:**
- ✅ استضافة مجانية ($5 رصيد شهري)
- ✅ لا ينام (يعمل 24/7)
- ✅ دعم PostgreSQL و Redis

**الخطوات:**

1. **إنشاء حساب**
   - اذهب إلى https://railway.app
   - سجل حساب جديد

2. **إنشاء مشروع**
   - اضغط "New Project"
   - اختر "Deploy from GitHub repo"
   - اختر المستودع

3. **إضافة الخدمات**
   - أضف PostgreSQL
   - أضف Redis

4. **التكوين**
   - أضف جميع المتغيرات البيئية
   - Railway سينشر تلقائياً

### الخيار 3: Fly.io

**المميزات:**
- ✅ استضافة مجانية سخية
- ✅ يعمل 24/7
- ✅ أداء ممتاز

**الخطوات:**

```bash
# تثبيت Fly CLI
curl -L https://fly.io/install.sh | sh

# تسجيل الدخول
fly auth login

# إنشاء تطبيق
cd /home/ubuntu/dragaan
fly launch --name dragaan-pro

# إضافة PostgreSQL
fly postgres create --name dragaan-db
fly postgres attach dragaan-db

# إضافة Redis
fly redis create --name dragaan-redis

# تكوين المتغيرات
fly secrets set TELEGRAM_API_ID=your_id
fly secrets set TELEGRAM_API_HASH=your_hash
# ... باقي المتغيرات

# النشر
fly deploy
```

---

## 📱 بناء APK للتطبيق الجوال

### الطريقة 1: EAS Build (موصى به) ⭐

```bash
# تثبيت EAS CLI
npm install -g eas-cli

# تسجيل الدخول
eas login

# بناء APK
eas build --platform android --profile preview

# أو للإنتاج
eas build --platform android --profile production
```

### الطريقة 2: بناء محلي

```bash
# تثبيت Android SDK
# https://developer.android.com/studio

# بناء APK
cd /home/ubuntu/dragaan
npx expo prebuild --platform android
cd android
./gradlew assembleRelease

# APK سيكون في:
# android/app/build/outputs/apk/release/app-release.apk
```

### الطريقة 3: استخدام GitHub Actions

أنشئ ملف: `.github/workflows/build-apk.yml`

```yaml
name: Build APK

on:
  push:
    branches: [ master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
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
```

---

## 🎛️ لوحة التحكم الإدارية

### الخيار 1: إضافة صفحة إدارة بسيطة

أنشئ ملف: `app/(tabs)/admin.tsx`

```typescript
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AdminScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold mb-4">لوحة التحكم الإدارية</Text>
      
      {/* إحصائيات */}
      <View className="mb-4 p-4 bg-card rounded-lg">
        <Text className="text-lg font-semibold mb-2">الإحصائيات</Text>
        <Text>إجمالي المستخدمين: 0</Text>
        <Text>الحسابات النشطة: 0</Text>
        <Text>العمليات الجارية: 0</Text>
      </View>

      {/* الإجراءات */}
      <TouchableOpacity className="mb-2 p-4 bg-primary rounded-lg">
        <Text className="text-white font-semibold">إدارة المستخدمين</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mb-2 p-4 bg-primary rounded-lg">
        <Text className="text-white font-semibold">إدارة التراخيص</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mb-2 p-4 bg-primary rounded-lg">
        <Text className="text-white font-semibold">مراقبة العمليات</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mb-2 p-4 bg-primary rounded-lg">
        <Text className="text-white font-semibold">سجل النشاطات</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

### الخيار 2: لوحة تحكم ويب منفصلة

أنشئ مشروع React جديد:

```bash
npx create-react-app dragaan-admin
cd dragaan-admin
npm install @tanstack/react-query axios
```

---

## ✅ قائمة التحقق قبل الإنتاج

- [ ] تم إضافة بيانات Telegram API
- [ ] تم تكوين قاعدة البيانات (PostgreSQL أو MySQL)
- [ ] تم توليد مفاتيح التشفير والأمان
- [ ] تم اختبار جميع الوظائف محلياً
- [ ] تم بناء التطبيق بنجاح (`pnpm build`)
- [ ] تم رفع السيرفر على خدمة استضافة
- [ ] تم بناء APK للتطبيق الجوال
- [ ] تم اختبار الاتصال بين التطبيق والسيرفر
- [ ] تم إنشاء لوحة تحكم إدارية
- [ ] تم توثيق جميع المتغيرات البيئية

---

## 🔗 الروابط المهمة

- **GitHub:** https://github.com/mhmsdfhwhegggggggg/dragaan
- **Render.com:** https://render.com
- **Railway.app:** https://railway.app
- **Fly.io:** https://fly.io
- **Telegram API:** https://my.telegram.org/apps
- **EAS Build:** https://docs.expo.dev/build/introduction/

---

## 📞 الدعم

إذا واجهت أي مشاكل:

1. تحقق من الـ Logs
2. راجع التوثيق الموجودة في المستودع
3. افتح Issue على GitHub
4. اتصل بفريق الدعم

---

**آخر تحديث:** 9 فبراير 2026
**الحالة:** 🟢 جاهز للإنتاج
