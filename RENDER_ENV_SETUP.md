# إعداد متغيرات Render لـ dragon-master5.onrender.com

## المتغيرات المطلوبة في Render Dashboard

اذهب إلى: **Render Dashboard** → **dragon-master5** (أو اسم الخدمة) → **Environment**

أضف أو حدّث المتغيرات التالية:

| Key | Value | ملاحظات |
|-----|-------|---------|
| `NODE_ENV` | `production` | افتراضي |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_tFnLiav3dO9Z@ep-snowy-smoke-ai6rt98l-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require` | إزالة `channel_binding=require` إذا سبب مشاكل |
| `REDIS_URL` | `redis://default:AZq_AAIncDE2ZWNiOGRhYzAzNmU0M2U5YjRmODNlMmYwNmU4MDE1MHAxMzk2MTU@subtle-manatee-39615.upstash.io:6379` | Upstash |
| `ENCRYPTION_KEY` | `ff41efdab1bb9352c266cb1800db80em` | 32 حرف بالضبط |
| `JWT_SECRET` | `dragon_master5_production_jwt_secret_32chars_min_2025` | 32+ حرف |
| `SESSION_SECRET` | `production_ready_session_secret_key_9911_dragon_master` | |
| `TELEGRAM_API_ID` | `20997129` | |
| `TELEGRAM_API_HASH` | `ff41efdab1bb9352c266cb1800db80e` | |
| `OAUTH_SERVER_URL` | `https://oauth.dragaan-pro.com` | |
| `APP_ID` | `falcon_telegram_pro` | |
| `CORS_ORIGINS` | `https://dragon-master5.onrender.com` | |
| `ENABLE_REGISTRATION` | `true` | |
| `ENABLE_LICENSE_CHECK` | `false` | |
| `ANTI_BAN_ENABLED` | `true` | |

## التحقق من الجاهزية

```bash
# فحص الصحة
curl https://dragon-master5.onrender.com/health

# الصفحة الرئيسية
curl https://dragon-master5.onrender.com/
```

## رابط التطبيق

- **API/Backend:** https://dragon-master5.onrender.com
- **Health:** https://dragon-master5.onrender.com/health
- **OAuth Callback:** https://dragon-master5.onrender.com/api/oauth/callback
