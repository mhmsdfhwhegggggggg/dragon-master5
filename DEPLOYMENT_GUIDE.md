# دليل النشر على Render.com

## الخطوات المطلوبة

### 1. إنشاء حساب على Render
1. اذهب إلى [Render.com](https://render.com)
2. قم بإنشاء حساب جديد أو تسجيل الدخول
3. اربط حسابك بـ GitHub

### 2. رفع الكود إلى GitHub
```bash
cd /home/ubuntu/dragaan
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 3. إنشاء PostgreSQL Database
1. من لوحة تحكم Render، اضغط على "New +"
2. اختر "PostgreSQL"
3. املأ البيانات:
   - Name: `dragon-telegram-db`
   - Database: `dragon_telegram_pro`
   - User: `dragon_user`
   - Region: `Oregon (US West)`
   - Plan: `Free`
4. اضغط "Create Database"
5. انتظر حتى يتم إنشاء قاعدة البيانات
6. احفظ الـ **Internal Database URL** (سنحتاجه لاحقاً)

### 4. إنشاء Redis Instance
1. من لوحة تحكم Render، اضغط على "New +"
2. اختر "Redis"
3. املأ البيانات:
   - Name: `dragon-telegram-redis`
   - Region: `Oregon (US West)`
   - Plan: `Free` (30 MB)
   - Maxmemory Policy: `noeviction`
4. اضغط "Create Redis"
5. احفظ الـ **Internal Redis URL** (سنحتاجه لاحقاً)

### 5. إنشاء Web Service
1. من لوحة تحكم Render، اضغط على "New +"
2. اختر "Web Service"
3. اختر المستودع: `dragaan`
4. املأ البيانات:
   - Name: `dragon-telegram-api`
   - Region: `Oregon (US West)`
   - Branch: `main`
   - Root Directory: (اتركه فارغاً)
   - Runtime: `Node`
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `node dist/index.js`
   - Plan: `Free`

### 6. إضافة Environment Variables
في صفحة إعدادات الـ Web Service، أضف المتغيرات التالية:

#### متغيرات إلزامية:
```
NODE_ENV=production
PORT=10000
DATABASE_URL=[الصق Internal Database URL من الخطوة 3]
REDIS_URL=[الصق Internal Redis URL من الخطوة 4]
TELEGRAM_API_ID=[احصل عليه من https://my.telegram.org/apps]
TELEGRAM_API_HASH=[احصل عليه من https://my.telegram.org/apps]
JWT_SECRET=[أي نص عشوائي طويل - استخدم: openssl rand -base64 32]
SESSION_SECRET=[أي نص عشوائي طويل]
ENCRYPTION_KEY=[يجب أن يكون 32 حرف بالضبط]
```

#### متغيرات اختيارية:
```
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_APP_ID=dragon_telegram_pro_mobile
CORS_ORIGINS=https://dragon-telegram-api.onrender.com
ANTI_BAN_ENABLED=true
DEFAULT_MESSAGE_DELAY_MS=2000
DEFAULT_ACTION_DELAY_MS=3000
MAX_MESSAGES_PER_DAY=100
MAX_GROUPS_JOIN_PER_DAY=10
ENABLE_LICENSE_CHECK=false
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
LOG_LEVEL=info
ENABLE_LOGGING=true
```

### 7. تطبيق Database Migrations
بعد نشر التطبيق، قم بتطبيق migrations:
1. من لوحة تحكم Render، افتح Web Service
2. اذهب إلى "Shell"
3. نفذ الأمر:
```bash
pnpm db:push
```

### 8. الحصول على الـ URL
بعد اكتمال النشر، ستحصل على URL مثل:
```
https://dragon-telegram-api.onrender.com
```

### 9. اختبار التطبيق
```bash
curl https://dragon-telegram-api.onrender.com/api/health
```

يجب أن تحصل على:
```json
{"ok":true,"redis":true,"db":true,"timestamp":1234567890}
```

---

## ملاحظات مهمة

### القيود على الطبقة المجانية:
- ⚠️ التطبيق سيدخل في وضع السكون بعد 15 دقيقة من عدم النشاط
- ⚠️ قاعدة البيانات محدودة بـ 1 GB
- ⚠️ Redis محدود بـ 30 MB
- ⚠️ 750 ساعة مجانية شهرياً (حوالي 31 يوم)

### لإبقاء التطبيق نشطاً 24/7:
استخدم خدمة Ping مثل:
- [UptimeRobot](https://uptimerobot.com) - مجاني
- [Cron-job.org](https://cron-job.org) - مجاني

قم بإعداد ping كل 10 دقائق إلى:
```
https://dragon-telegram-api.onrender.com/api/health
```

---

## البدائل للاستضافة المجانية

### 1. Railway.app
- $5 رصيد شهري مجاني
- أسهل في الإعداد
- دعم أفضل لـ Redis و PostgreSQL

### 2. Fly.io
- لم يعد يوفر طبقة مجانية
- لكن الأسعار معقولة ($5-10/شهر)

### 3. Koyeb
- طبقة مجانية محدودة
- سهل الاستخدام

---

## استكشاف الأخطاء

### إذا فشل البناء:
1. تحقق من أن `pnpm` مثبت
2. تحقق من أن جميع الحزم في `package.json` صحيحة
3. راجع سجلات البناء في Render

### إذا فشل التشغيل:
1. تحقق من Environment Variables
2. تحقق من أن DATABASE_URL صحيح
3. تحقق من أن REDIS_URL صحيح
4. راجع سجلات التطبيق في Render

### إذا كانت قاعدة البيانات فارغة:
```bash
# من Shell في Render
pnpm db:push
```

---

## الأمان

⚠️ **مهم جداً:**
- لا تشارك `TELEGRAM_API_ID` و `TELEGRAM_API_HASH` مع أحد
- لا تشارك `JWT_SECRET` و `ENCRYPTION_KEY`
- استخدم HTTPS دائماً
- فعّل CORS بشكل صحيح

---

## الدعم

إذا واجهت أي مشاكل:
1. راجع [Render Docs](https://render.com/docs)
2. راجع [Render Community](https://community.render.com)
3. راجع سجلات التطبيق في Render Dashboard
