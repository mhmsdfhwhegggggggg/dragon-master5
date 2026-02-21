# دليل النشر - Dragon Telegram Pro Mobile

## تاريخ الإنشاء: 8 فبراير 2026

---

## 🚀 خيارات النشر المتاحة

يمكن نشر التطبيق على عدة منصات مجانية. إليك الخيارات المتاحة:

### 1. Render.com (موصى به) ⭐

**المميزات:**
- ✅ مجاني تماماً (750 ساعة/شهر)
- ✅ يدعم Node.js و Redis
- ✅ SSL مجاني
- ✅ نشر تلقائي من GitHub
- ✅ سهل الإعداد

**الخطوات:**

1. **إنشاء حساب على Render.com**
   - اذهب إلى https://render.com
   - سجل دخول باستخدام GitHub

2. **إنشاء Redis Instance**
   - اضغط على "New +" → "Redis"
   - الاسم: `dragon-telegram-redis`
   - الخطة: Free
   - اضغط "Create Redis"
   - احفظ الـ Connection String

3. **إنشاء Web Service للـ API**
   - اضغط على "New +" → "Web Service"
   - اختر المستودع: `mhmsdfhwhegggggggg/dragaan`
   - الاسم: `dragon-telegram-api`
   - البيئة: Node
   - Branch: `master`
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`
   - الخطة: Free

4. **إضافة Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=file:./dev.db
   TELEGRAM_API_ID=<your_api_id>
   TELEGRAM_API_HASH=<your_api_hash>
   JWT_SECRET=<generate_random>
   SESSION_SECRET=<generate_random>
   ENCRYPTION_KEY=<generate_random>
   REDIS_URL=<redis_connection_string>
   CORS_ORIGINS=*
   ANTI_BAN_ENABLED=true
   DEFAULT_MESSAGE_DELAY_MS=2000
   MAX_MESSAGES_PER_DAY=100
   ENABLE_LICENSE_CHECK=false
   ```

5. **إنشاء Background Worker (اختياري)**
   - اضغط على "New +" → "Background Worker"
   - نفس الإعدادات لكن Start Command: `pnpm start:worker`

6. **الحصول على URL**
   - بعد النشر، ستحصل على URL مثل:
   - `https://dragon-telegram-api.onrender.com`

---

### 2. Railway.app

**المميزات:**
- ✅ مجاني ($5 رصيد شهري)
- ✅ يدعم PostgreSQL و Redis
- ✅ نشر تلقائي
- ✅ سهل جداً

**الخطوات:**

1. **إنشاء حساب على Railway**
   - اذهب إلى https://railway.app
   - سجل دخول باستخدام GitHub

2. **إنشاء مشروع جديد**
   - اضغط "New Project"
   - اختر "Deploy from GitHub repo"
   - اختر `mhmsdfhwhegggggggg/dragaan`

3. **إضافة Redis**
   - اضغط "New" → "Database" → "Redis"
   - سيتم إضافة `REDIS_URL` تلقائياً

4. **إضافة Environment Variables**
   - نفس المتغيرات المذكورة أعلاه

5. **الحصول على URL**
   - Railway ستعطيك URL تلقائياً

---

### 3. Fly.io

**المميزات:**
- ✅ مجاني (3 VMs صغيرة)
- ✅ أداء ممتاز
- ✅ يدعم Docker
- ✅ مناطق متعددة

**الخطوات:**

1. **تثبيت Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **تسجيل الدخول**
   ```bash
   flyctl auth login
   ```

3. **إنشاء التطبيق**
   ```bash
   cd /path/to/dragaan
   flyctl launch
   ```

4. **إضافة Redis**
   ```bash
   flyctl redis create
   ```

5. **إضافة Environment Variables**
   ```bash
   flyctl secrets set TELEGRAM_API_ID=your_api_id
   flyctl secrets set TELEGRAM_API_HASH=your_api_hash
   # ... باقي المتغيرات
   ```

6. **النشر**
   ```bash
   flyctl deploy
   ```

---

### 4. Vercel (للـ API فقط)

**المميزات:**
- ✅ مجاني
- ✅ سريع جداً
- ✅ CDN عالمي

**القيود:**
- ⚠️ لا يدعم WebSockets
- ⚠️ لا يدعم background workers
- ⚠️ Timeout 10 ثواني

**الخطوات:**

1. **تثبيت Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **النشر**
   ```bash
   cd /path/to/dragaan
   vercel
   ```

---

### 5. Heroku

**المميزات:**
- ✅ موثوق
- ✅ يدعم Redis
- ✅ سهل الإعداد

**القيود:**
- ⚠️ لم يعد مجانياً تماماً ($5/شهر)

**الخطوات:**

1. **إنشاء حساب على Heroku**
   - اذهب إلى https://heroku.com

2. **تثبيت Heroku CLI**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

3. **تسجيل الدخول**
   ```bash
   heroku login
   ```

4. **إنشاء التطبيق**
   ```bash
   cd /path/to/dragaan
   heroku create dragon-telegram-api
   ```

5. **إضافة Redis**
   ```bash
   heroku addons:create heroku-redis:hobby-dev
   ```

6. **إضافة Environment Variables**
   ```bash
   heroku config:set TELEGRAM_API_ID=your_api_id
   # ... باقي المتغيرات
   ```

7. **النشر**
   ```bash
   git push heroku master
   ```

---

## 🔧 الإعداد بعد النشر

### 1. التحقق من عمل السيرفر

```bash
curl https://your-api-url.com/health
```

يجب أن يرجع:
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T12:00:00.000Z"
}
```

### 2. اختبار الـ API

```bash
curl https://your-api-url.com/api/trpc/dashboard.getStats
```

### 3. إنشاء بيانات أولية (إذا لزم الأمر)

```bash
# SSH إلى السيرفر وتشغيل:
pnpm tsx scripts/seed-database.ts
```

---

## 📱 ربط التطبيق بالسيرفر

### 1. تحديث URL في التطبيق

في ملف `lib/_core/trpc.ts`:

```typescript
const API_URL = "https://your-api-url.com/api/trpc";
```

### 2. إعادة بناء التطبيق

```bash
pnpm android  # للأندرويد
pnpm ios      # للآيفون
```

---

## 🔐 الحصول على Telegram API Credentials

1. اذهب إلى https://my.telegram.org/apps
2. سجل دخول برقم هاتفك
3. اضغط "Create new application"
4. املأ البيانات:
   - App title: Dragon Telegram Pro
   - Short name: dragontelegram
   - Platform: Android/iOS
5. احفظ `api_id` و `api_hash`

---

## 🎯 الخيار الموصى به

**للبداية السريعة:** استخدم **Render.com**

**السبب:**
- مجاني تماماً
- سهل الإعداد
- يدعم كل ما تحتاجه
- استقرار ممتاز
- نشر تلقائي من GitHub

---

## 📊 مراقبة التطبيق

### Logs على Render:
```
Dashboard → Your Service → Logs
```

### Logs على Railway:
```
Dashboard → Your Project → Deployments → View Logs
```

### Logs على Fly.io:
```bash
flyctl logs
```

---

## 🆘 حل المشاكل الشائعة

### المشكلة: Database not found

**الحل:**
```bash
# تأكد من وجود DATABASE_URL في Environment Variables
# تأكد من تطبيق migrations
pnpm db:push
```

### المشكلة: Redis connection failed

**الحل:**
```bash
# تأكد من REDIS_URL صحيح
# تأكد من Redis instance يعمل
```

### المشكلة: API returns 500

**الحل:**
```bash
# تحقق من الـ logs
# تأكد من جميع Environment Variables موجودة
# تأكد من TELEGRAM_API_ID و TELEGRAM_API_HASH صحيحة
```

---

## 📝 ملاحظات مهمة

1. **قاعدة البيانات**: التطبيق يستخدم SQLite حالياً، وهو مناسب للتطوير. للإنتاج الحقيقي، يُفضل PostgreSQL.

2. **Redis**: مطلوب لنظام الطوابير (BullMQ). بدونه، العمليات الجماعية لن تعمل.

3. **Telegram API**: يجب الحصول على credentials حقيقية من my.telegram.org

4. **CORS**: في الإنتاج، يجب تحديد CORS_ORIGINS بدلاً من "*"

5. **License System**: حالياً معطّل (ENABLE_LICENSE_CHECK=false). يمكن تفعيله لاحقاً.

---

## 🎉 بعد النشر الناجح

1. ✅ احفظ URL السيرفر
2. ✅ اختبر جميع الـ APIs
3. ✅ حدّث التطبيق بالـ URL الجديد
4. ✅ ابنِ APK للتطبيق
5. ✅ اختبر التطبيق مع السيرفر الحقيقي

---

**تم إنشاء هذا الدليل بواسطة**: Manus AI  
**التاريخ**: 8 فبراير 2026
