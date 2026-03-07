# دليل الإنتاج - FALCON Telegram Pro

## السيرفر الخارجي (Render)

- **URL:** https://dragon-master5.onrender.com
- **Health:** https://dragon-master5.onrender.com/health
- **الحالة:** يعمل (Database OK)
- **ملف إعداد المتغيرات:** انظر `RENDER_ENV_SETUP.md`

## التغييرات المنجزة

### إصلاحات تم تطبيقها
1. **export.router** - تم ربطه بالتطبيق وإصلاح fallback `userId`
2. **Worker** - إصلاح createBulkOperation (إضافة name، استخدام bulkOp مباشرة)
3. **قاعدة البيانات** - SSL شرطي (localhost بدون SSL)
4. **الاختبارات** - إصلاح auth test (password بدل passwordHash) + إضافة autoprefixer
5. **واجهة التصدير** - إضافة أزرار تصدير TXT/CSV في شاشة الاستخراج
6. **extraction.router** - إزالة addedDate الخاطئ من الأعضاء المستخرجين

### أوامر التشغيل

```bash
# التطوير (خادم + Metro + Worker)
npm run dev

# الإنتاج
npm run build
npm run build:worker
npm run start          # الخادم فقط
npm run start:worker   # Worker فقط
npm run start:free-tier  # الخادم + Worker معاً
```

### متطلبات الإنتاج

| المتغير | مطلوب | ملاحظات |
|---------|-------|---------|
| DATABASE_URL | نعم | PostgreSQL (Neon مدعوم) |
| REDIS_URL | نعم للعمليات الضخمة | Upstash مدعوم |
| JWT_SECRET | نعم | 32+ حرف للإنتاج |
| SESSION_SECRET | نعم | 32+ حرف |
| ENCRYPTION_KEY | نعم | بالضبط 32 حرف |
| TELEGRAM_API_ID | نعم | من my.telegram.org |
| TELEGRAM_API_HASH | نعم | من my.telegram.org |
| OAUTH_SERVER_URL | نعم | خادم OAuth |
| APP_ID | نعم | معرف التطبيق |

### ملاحظات Redis

- في حال فشل الاتصال بـ Redis، يتم استخدام Mock Queue
- المهام الخلفية (bulk ops) تحتاج Redis و Worker يعمل
- للتطوير: Mock Queue يكفي للاختبار

### التحقق من الجاهزية

```bash
npm run check   # فحص TypeScript
npm run test    # تشغيل الاختبارات
npm run build   # بناء الخادم
```
