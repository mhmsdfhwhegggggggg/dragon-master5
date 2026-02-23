# 🚀 Production Environment Variables - Complete Setup

## 📋 **Required Environment Variables for Production**

### **Core Application**
```env
NODE_ENV=production
PORT=10000
APP_NAME=Dragon Telegram Pro
APP_VERSION=1.0.0
```

### **Database (PostgreSQL - Neon)**
```env
DATABASE_URL=postgresql://***@ep-snowy-smoke-ai6rt98l-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### **Security Keys (Generate these!)**
```env
JWT_SECRET=your_super_secure_32_character_jwt_secret_key_here
SESSION_SECRET=your_super_secure_32_character_session_secret_here
ENCRYPTION_KEY=your_exact_32_character_encryption_key_here
SESSION_ENC_KEY=your_base64_encoded_session_key_here
```

### **OAuth Configuration**
```env
OAUTH_SERVER_URL=https://oauth.dragaan-pro.com
APP_ID=dragon_telegram_pro_mobile
OWNER_OPEN_ID=admin@example.com
```

### **Telegram API (Required for Production)**
```env
TELEGRAM_API_ID=your_telegram_api_id_number
TELEGRAM_API_HASH=your_telegram_api_hash_string
```

### **Redis (Disabled for now)**
```env
REDIS_URL=
REDIS_PASSWORD=
REDIS_DB=0
```

### **CORS Configuration**
```env
CORS_ORIGINS=https://dragon-master5.onrender.com,https://dragon-master5.onrender.com/*
```

### **Feature Flags**
```env
ENABLE_REGISTRATION=true
ENABLE_LICENSE_CHECK=false
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
ANTI_BAN_ENABLED=true
```

### **Anti-Ban Configuration**
```env
DEFAULT_MESSAGE_DELAY_MS=2000
DEFAULT_ACTION_DELAY_MS=3000
MAX_MESSAGES_PER_DAY=100
MAX_GROUPS_JOIN_PER_DAY=10
```

### **Rate Limiting**
```env
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### **Monitoring**
```env
LOG_LEVEL=info
ENABLE_LOGGING=true
```

---

## 🔧 **Generate Security Keys**

### **Generate JWT Secret**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Generate Session Secret**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Generate Encryption Key**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Generate Session Encryption Key**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🚀 **Render.com Setup**

### **Step 1: Go to Render Dashboard**
1. Visit: https://render.com
2. Select `dragon-master5` service
3. Go to "Environment" tab

### **Step 2: Add Environment Variables**
Copy and paste all the variables above, replacing:
- `***` with your actual database credentials
- `your_..._here` with generated keys
- `your_telegram_...` with your Telegram API credentials

### **Step 3: Save and Deploy**
1. Click "Save Changes"
2. Click "Manual Deploy"
3. Wait for deployment to complete

---

## 📱 **Mobile App Configuration**

### **Update API URLs**
```typescript
// app/config/environment.ts
export const API_BASE_URL = 'https://dragon-master5.onrender.com';
export const OAUTH_URL = 'https://oauth.dragaan-pro.com';
export const APP_ID = 'dragon_telegram_pro_mobile';
```

### **Build Commands**
```bash
# Android Production Build
npx expo build:android --release-channel production --type apk

# iOS Production Build
npx expo build:ios --release-channel production --type archive
```

---

## 🔍 **Validation**

### **Check Environment Variables**
The application will validate these variables on startup:
- ✅ `DATABASE_URL` - Required
- ✅ `JWT_SECRET` - Required (32+ chars)
- ✅ `ENCRYPTION_KEY` - Required (32+ chars)
- ✅ `SESSION_ENC_KEY` - Required (16+ chars base64)
- ⚠️ `TELEGRAM_API_ID` - Required in production
- ⚠️ `TELEGRAM_API_HASH` - Required in production
- ❌ `REDIS_URL` - Optional (disabled for now)

### **Startup Logs**
You should see:
```
=== Environment Configuration ===
Environment: production
App Name: Dragon Telegram Pro
App Version: 1.0.0
Port: 10000
Database: ✓ Configured
Redis: ✗ Missing (expected)
Telegram API: ✓ Configured
JWT Secret: ✓ Configured
Encryption: ✓ Configured
Anti-Ban: ✓ Enabled
License Check: ✓ Disabled
================================
```

---

## 🎯 **Production Build Process**

### **1. Backend Build**
```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Start production server
pnpm start
```

### **2. Mobile App Build**
```bash
# Install dependencies
npm install

# Build Android
npx expo build:android --release-channel production

# Build iOS
npx expo build:ios --release-channel production
```

### **3. Deployment**
```bash
# Deploy to Render (automatic)
git push origin master

# Or manual deploy via Render Dashboard
```

---

## 📊 **Expected Results**

### **Successful Deployment**
```
[OAuth] Initialized with baseURL: https://oauth.dragaan-pro.com
[Database] Connected successfully to PostgreSQL
[Queue] Using mock queue (Redis disabled)
[Integrity] ✅ Initial integrity check passed
[INFO] [Startup] All services initialized successfully
[api] server listening on port 10000
==> Your service is live 🎉
```

### **API Endpoints Working**
- ✅ `https://dragon-master5.onrender.com/health`
- ✅ `https://dragon-master5.onrender.com/api/auth/me`
- ✅ `https://dragon-master5.onrender.com/trpc/health`

---

## 🚨 **Important Notes**

### **Security**
- **Never commit secrets to git**
- **Use strong, unique keys**
- **Rotate keys regularly**
- **Monitor for breaches**

### **Performance**
- **Redis is disabled** (using mock queue)
- **Background jobs process synchronously**
- **Caching is basic**
- **Can be optimized later**

### **Features**
- **All core features work**
- **Authentication works**
- **Telegram integration works**
- **Anti-Ban system works**
- **Mobile app connects**

---

## 🎯 **Ready for Production**

The application is now ready for production with:
- ✅ **Complete environment setup**
- ✅ **Security configuration**
- ✅ **Database connectivity**
- ✅ **API endpoints**
- ✅ **Mobile app build ready**

**Deploy now and test all functionality!** 🚀
