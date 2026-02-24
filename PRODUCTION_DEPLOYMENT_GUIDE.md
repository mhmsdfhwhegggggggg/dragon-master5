# دليل النشر للإنتاج - Dragon Telegram Pro Mobile

## 📋 المحتويات

1. [المتطلبات الأساسية](#المتطلبات-الأساسية)
2. [الإعداد الأولي](#الإعداد-الأولي)
3. [تكوين قاعدة البيانات](#تكوين-قاعدة-البيانات)
4. [تكوين المتغيرات البيئية](#تكوين-المتغيرات-البيئية)
5. [بناء التطبيق](#بناء-التطبيق)
6. [النشر](#النشر)
7. [المراقبة والصيانة](#المراقبة-والصيانة)
8. [الأمان](#الأمان)
9. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🔧 المتطلبات الأساسية

### البرمجيات المطلوبة

| البرنامج | الإصدار المطلوب | الغرض |
|---------|-----------------|-------|
| Node.js | 18.x أو أحدث | تشغيل التطبيق |
| pnpm | 9.x أو أحدث | إدارة الحزم |
| PostgreSQL | 14.x أو أحدث | قاعدة البيانات الرئيسية |
| Redis | 7.x أو أحدث | نظام الطوابير والتخزين المؤقت |
| PM2 | آخر إصدار | إدارة العمليات (اختياري) |

### الموارد المطلوبة (الحد الأدنى)

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: اتصال إنترنت مستقر

### الموارد الموصى بها (للإنتاج)

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Network**: اتصال إنترنت عالي السرعة

---

## 🚀 الإعداد الأولي

### 1. استنساخ المشروع

```bash
git clone https://github.com/mhmsdfhwhegggggggg/dragaan.git
cd dragaan
```

### 2. تثبيت التبعيات

```bash
pnpm install
```

### 3. تشغيل سكريبت الإعداد

```bash
bash scripts/setup-production.sh
```

هذا السكريبت سيقوم بـ:
- ✅ التحقق من جميع التبعيات
- ✅ إنشاء ملف .env
- ✅ توليد مفاتيح التشفير
- ✅ بناء التطبيق
- ✅ إعداد PM2 (اختياري)

---

## 💾 تكوين قاعدة البيانات

### PostgreSQL (موصى به)

#### 1. تثبيت PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**CentOS/RHEL:**
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
```

#### 2. إنشاء قاعدة البيانات والمستخدم

```bash
sudo -u postgres psql

CREATE DATABASE dragon_telegram_pro;
CREATE USER dragon_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE dragon_telegram_pro TO dragon_user;
\q
```

#### 3. تطبيق Migrations

```bash
pnpm db:push
```

### Redis

#### 1. تثبيت Redis

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**CentOS/RHEL:**
```bash
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis
```

#### 2. تكوين Redis (اختياري)

```bash
sudo nano /etc/redis/redis.conf
```

تغييرات موصى بها:
```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
requirepass your_redis_password
```

---

## ⚙️ تكوين المتغيرات البيئية

### 1. نسخ ملف المثال

```bash
cp .env.example .env
```

### 2. تحرير ملف .env

```bash
nano .env
```

### 3. المتغيرات الحرجة (يجب تغييرها)

#### قاعدة البيانات
```env
DATABASE_URL=postgresql://dragon_user:your_strong_password@localhost:5432/dragon_telegram_pro
```

#### Telegram API
احصل على بيانات الاعتماد من: https://my.telegram.org/apps

```env
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
```

#### الأمان
```bash
# توليد مفتاح تشفير (32 حرف بالضبط)
openssl rand -base64 32 | head -c 32

# توليد JWT secret
openssl rand -base64 64
```

```env
ENCRYPTION_KEY=your_32_character_encryption_key
JWT_SECRET=your_jwt_secret_min_32_characters
SESSION_SECRET=your_session_secret
```

#### Redis
```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password  # إذا كنت تستخدم كلمة مرور
```

### 4. المتغيرات الاختيارية

#### OAuth (Manus Platform)
```env
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_APP_ID=your_manus_app_id
OWNER_OPEN_ID=your_owner_open_id
```

#### CORS
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Monitoring (Sentry)
```env
SENTRY_DSN=your_sentry_dsn
```

---

## 🏗️ بناء التطبيق

### 1. بناء الخادم

```bash
pnpm build
```

هذا سينشئ:
- `dist/index.js` - الخادم الرئيسي
- `dist/worker.js` - عامل الطوابير

### 2. بناء تطبيق الموبايل (اختياري)

#### Android
```bash
pnpm android
```

#### iOS
```bash
pnpm ios
```

---

## 🚢 النشر

### الطريقة 1: PM2 (موصى به)

#### 1. تثبيت PM2
```bash
npm install -g pm2
```

#### 2. بدء التطبيق
```bash
pm2 start server/pm2.config.cjs
```

#### 3. حفظ التكوين
```bash
pm2 save
pm2 startup
```

#### 4. أوامر PM2 المفيدة
```bash
# عرض الحالة
pm2 status

# عرض السجلات
pm2 logs

# إعادة التشغيل
pm2 restart all

# إيقاف
pm2 stop all

# حذف
pm2 delete all

# مراقبة
pm2 monit
```

### الطريقة 2: Systemd

#### 1. إنشاء ملف خدمة

```bash
sudo nano /etc/systemd/system/dragon-telegram.service
```

```ini
[Unit]
Description=Dragon Telegram Pro
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/dragaan
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 2. تفعيل وبدء الخدمة

```bash
sudo systemctl daemon-reload
sudo systemctl enable dragon-telegram
sudo systemctl start dragon-telegram
sudo systemctl status dragon-telegram
```

### الطريقة 3: Docker (قريباً)

```bash
# سيتم إضافة Dockerfile و docker-compose.yml قريباً
```

---

## 📊 المراقبة والصيانة

### 1. فحص الصحة

```bash
# فحص صحة الخادم
curl http://localhost:3000/api/health

# فحص اتصال قاعدة البيانات
psql -U dragon_user -d dragon_telegram_pro -c "SELECT 1;"

# فحص Redis
redis-cli ping
```

### 2. مراقبة السجلات

#### مع PM2
```bash
pm2 logs dragon-telegram --lines 100
```

#### مع Systemd
```bash
sudo journalctl -u dragon-telegram -f
```

### 3. مراقبة الموارد

```bash
# استخدام CPU والذاكرة
top
htop

# مساحة القرص
df -h

# اتصالات قاعدة البيانات
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### 4. النسخ الاحتياطي

#### قاعدة البيانات
```bash
# نسخ احتياطي يومي
pg_dump -U dragon_user dragon_telegram_pro > backup_$(date +%Y%m%d).sql

# استعادة
psql -U dragon_user dragon_telegram_pro < backup_20260207.sql
```

#### Redis (اختياري)
```bash
# النسخ الاحتياطي التلقائي مفعّل افتراضياً في /var/lib/redis/dump.rdb
```

---

## 🔒 الأمان

### 1. جدار الحماية

```bash
# السماح فقط بالمنافذ الضرورية
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 2. SSL/TLS (موصى به بشدة)

#### مع Nginx

```bash
sudo apt install nginx certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d yourdomain.com
```

#### تكوين Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. تحديثات الأمان

```bash
# تحديث النظام بانتظام
sudo apt update && sudo apt upgrade -y

# تحديث التبعيات
pnpm update

# فحص الثغرات الأمنية
pnpm audit
pnpm audit fix
```

### 4. تقييد الوصول لقاعدة البيانات

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

```conf
# السماح فقط من localhost
host    dragon_telegram_pro    dragon_user    127.0.0.1/32    md5
```

---

## 🔍 استكشاف الأخطاء

### المشكلة: التطبيق لا يبدأ

**الحل:**
1. تحقق من السجلات: `pm2 logs` أو `journalctl -u dragon-telegram`
2. تحقق من المتغيرات البيئية: `cat .env`
3. تحقق من اتصال قاعدة البيانات
4. تحقق من اتصال Redis

### المشكلة: خطأ في قاعدة البيانات

**الحل:**
```bash
# إعادة تطبيق migrations
pnpm db:push

# التحقق من اتصال قاعدة البيانات
psql -U dragon_user -d dragon_telegram_pro -c "SELECT 1;"
```

### المشكلة: خطأ Telegram API

**الحل:**
1. تحقق من صحة `TELEGRAM_API_ID` و `TELEGRAM_API_HASH`
2. تحقق من اتصال الإنترنت
3. تحقق من حالة حساب Telegram

### المشكلة: استخدام عالي للذاكرة

**الحل:**
```bash
# إعادة تشغيل التطبيق
pm2 restart all

# زيادة حد الذاكرة في PM2
pm2 start server/pm2.config.cjs --max-memory-restart 1G
```

### المشكلة: Rate Limiting

**الحل:**
1. تحقق من إعدادات Anti-Ban
2. قلل سرعة العمليات
3. استخدم proxies متعددة
4. زد التأخير بين العمليات

---

## 📞 الدعم والمساعدة

### الموارد

- **التوثيق الفني**: `TECHNICAL_DOCUMENTATION.md`
- **تحليل الجاهزية**: `PRODUCTION_READINESS_ANALYSIS.md`
- **دليل المستخدم**: `USER_GUIDE.md`

### الحصول على المساعدة

1. تحقق من السجلات أولاً
2. راجع التوثيق
3. ابحث في GitHub Issues
4. أنشئ Issue جديد مع:
   - وصف المشكلة
   - السجلات ذات الصلة
   - الخطوات لإعادة إنتاج المشكلة

---

## ✅ قائمة التحقق قبل النشر

- [ ] جميع المتغيرات البيئية مكونة بشكل صحيح
- [ ] قاعدة البيانات منشأة ومهيأة
- [ ] Redis يعمل بشكل صحيح
- [ ] مفاتيح التشفير تم تغييرها من القيم الافتراضية
- [ ] SSL/TLS مفعّل
- [ ] جدار الحماية مكون بشكل صحيح
- [ ] النسخ الاحتياطي التلقائي مفعّل
- [ ] المراقبة مفعّلة
- [ ] السجلات تعمل بشكل صحيح
- [ ] تم اختبار جميع الوظائف الأساسية

---

**تم إنشاء هذا الدليل بواسطة:** Manus AI  
**التاريخ:** 7 فبراير 2026  
**الإصدار:** 1.0.0
