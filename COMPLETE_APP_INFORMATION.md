# 🚀 Dragon Telegram Pro - Complete Information & Links

## 🌐 **Application Links**

### **Production URLs**
- **🌐 Main App**: https://dragon-master5.onrender.com
- **🔗 API Base**: https://dragon-master5.onrender.com
- **🔗 Health Check**: https://dragon-master5.onrender.com/health
- **🔗 Auth Endpoint**: https://dragon-master5.onrender.com/api/auth/me
- **🔗 OAuth Callback**: https://dragon-master5.onrender.com/api/oauth/callback

### **Development URLs**
- **🏠 Local API**: http://localhost:3000
- **📱 Local Mobile**: http://localhost:8082
- **🔗 Local Health**: http://localhost:3000/health

---

## 📱 **Mobile App Information**

### **App Configuration**
```json
{
  "name": "Dragon Telegram Pro",
  "slug": "dragon-telegram-pro",
  "version": "1.0.0",
  "platforms": ["ios", "android", "web"],
  "orientation": "portrait"
}
```

### **Build Commands**
```bash
# Development
npx expo start

# Production Build - Android
npx expo build:android --release-channel production

# Production Build - iOS
npx expo build:ios --release-channel production
```

---

## 🗄️ **Database & Services**

### **PostgreSQL (Neon)**
- **🔗 Database**: postgresql://***@ep-snowy-smoke-ai6rt98l-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
- **🔗 Dashboard**: https://neon.tech
- **📊 ORM**: Drizzle ORM
- **📋 Tables**: users, telegram_accounts, extracted_members, bulk_operations, licenses, activity_logs

### **Redis (Upstash)**
- **🔗 Redis URL**: rediss://default:AZq_AAIncDE2ZWNiOGRhYzAzNmU0M2U5YjRmODNlMmYwNmU4MDE1MHAxMzk2MTU@subtle-manatee-39615.upstash.io:6379?maxRetriesPerRequest=null&family=6
- **🔗 REST URL**: https://subtle-manatee-39615.upstash.io
- **🔗 REST Token**: AZq_AAIncDE2ZWNiOGRhYzAzNmU0M2U5YjRmODNlMmYwNmU4MDE1MHAxMzk2MTU
- **🔗 Dashboard**: https://app.upstash.com
- **📋 Service**: BullMQ for background jobs

---

## 🔐 **Authentication & Security**

### **OAuth Configuration**
- **🔗 OAuth Server**: https://oauth.dragaan-pro.com
- **🆔 App ID**: dragon_telegram_pro_mobile
- **👤 Owner Open ID**: admin@example.com
- **🔗 Auth0 Alternative**: https://your-tenant.auth0.com

### **Security Features**
- **🔐 JWT Tokens**: For session management
- **🔒 HTTP-Only Cookies**: Web security
- **🛡️ AES-256 Encryption**: For sensitive data
- **📱 Secure Storage**: Mobile app credentials
- **🔑 Hardware Binding**: License system

---

## 📊 **GitHub & Repository**

### **Repository Links**
- **🔗 GitHub Repository**: https://github.com/mhmsdfhwhegggggggg/dragon-master5
- **🌿 Branch**: master
- **📝 Latest Commit**: e0e94cc - Add Render Deployment Ready Guide
- **📋 Repository Size**: ~50MB with all dependencies

### **Repository Structure**
```
dragon-master5/
├── app/                    # React Native app
├── server/                  # Node.js backend
├── components/              # UI components
├── constants/              # App constants
├── lib/                    # Utility libraries
├── assets/                 # Images and resources
├── package.json            # Dependencies
├── app.json               # Expo configuration
├── eas.json               # Expo Application Services
├── metro.config.js        # Metro bundler config
├── tsconfig.json          # TypeScript config
├── docker-compose.yml      # Docker configuration
└── .env.example          # Environment variables template
```

---

## 🚀 **Deployment & Hosting**

### **Render.com (Production)**
- **🔗 Dashboard**: https://render.com
- **🌐 Service URL**: https://dragon-master5.onrender.com
- **📊 Plan**: Free tier
- **🔧 Environment**: Node.js
- **📋 Build Command**: `npm run build`
- **🚀 Start Command**: `npm run start`

### **Environment Variables**
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://***@ep-snowy-smoke-ai6rt98l-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:AZq_AAIncDE2ZWNiOGRhYzAzNmU0M2U5YjRmODNlMmYwNmU4MDE1MHAxMzk2MTU@subtle-manatee-39615.upstash.io:6379?maxRetriesPerRequest=null&family=6
OAUTH_SERVER_URL=https://oauth.dragaan-pro.com
APP_ID=dragon_telegram_pro_mobile
OWNER_OPEN_ID=admin@example.com
JWT_SECRET=your_32_character_jwt_secret
SESSION_SECRET=your_32_character_session_secret
ENCRYPTION_KEY=your_exact_32_character_encryption_key
```

---

## 📱 **Mobile App Features**

### **Core Screens**
- **🏠 Dashboard**: Overview and statistics
- **👥 Accounts**: Telegram account management
- **📤 Extract & Add**: Member operations
- **🛡️ Anti-Ban Dashboard**: Protection monitoring
- **🔑 License Management**: License system
- **📊 Analytics**: Reports and analysis
- **⚙️ Settings**: App configuration

### **Key Features**
- **🔄 Multi-account support** (1000+ accounts)
- **📤 Member extraction** (100,000+ members)
- **➕ Member addition** (200 members/minute)
- **🛡️ Anti-Ban System v6.0** (AI-powered)
- **📊 Real-time monitoring**
- **🔒 Session management**
- **📱 Cross-platform** (iOS/Android/Web)

---

## 🛠️ **Development Tools**

### **Build Tools**
- **⚡ Metro**: React Native bundler
- **🔨 esbuild**: Backend bundler
- **📦 pnpm**: Package manager
- **🔧 TypeScript**: Type safety
- **🎨 Tailwind CSS**: Styling
- **📱 NativeWind**: React Native styling

### **Testing & Quality**
- **🧪 Vitest**: Unit testing
- **🔍 ESLint**: Code linting
- **💅 Prettier**: Code formatting
- **📊 Drizzle Kit**: Database management

---

## 📚 **Documentation & Guides**

### **Setup Guides**
- **📖 REDIS_SETUP.md**: Redis configuration
- **🌐 UPSTASH_REDIS_GUIDE.md**: Upstash setup
- **🔐 AUTH0_SETUP_GUIDE.md**: Auth0 configuration
- **📱 ANDROID_BUILD_GUIDE.md**: Android build process
- **🍎 IOS_BUILD_GUIDE.md**: iOS build process
- **🚀 RENDER_DEPLOYMENT_READY.md**: Render deployment
- **👤 CREATE_ACCOUNT_GUIDE.md**: Account creation

### **Technical Documentation**
- **📋 PRODUCTION_BUILD_CHECKLIST.md**: Pre-build checklist
- **🔧 PRODUCTION_URLS_SETUP.md**: Production URLs
- **🌍 SERVER_URLS_EXPLAINED.md**: Server URL explanation
- **🔍 REDIS_ERROR_EXPLANATION.md**: Redis troubleshooting

---

## 🎯 **Quick Access Summary**

### **Essential Links**
- **🌐 Live App**: https://dragon-master5.onrender.com
- **🔗 GitHub**: https://github.com/mhmsdfhwhegggggggg/dragon-master5
- **🗄️ Neon DB**: https://neon.tech
- **🔴 Upstash Redis**: https://app.upstash.com
- **🚀 Render**: https://render.com

### **Build Commands**
```bash
# Start development
npm run dev

# Build production
npm run build

# Start production
npm run start

# Build mobile
npx expo build:android --release-channel production
npx expo build:ios --release-channel production
```

---

## 📞 **Support & Contact**

### **Technical Stack**
- **Backend**: Node.js + Express + tRPC
- **Frontend**: React Native + Expo
- **Database**: PostgreSQL + Drizzle ORM
- **Cache/Queue**: Redis + BullMQ
- **Authentication**: OAuth + JWT
- **Deployment**: Render.com

### **Version Information**
- **📱 App Version**: 1.0.0
- **🔧 Node Version**: 22.x
- **📦 Expo SDK**: 54
- **🗄️ PostgreSQL**: 15+
- **🔴 Redis**: 7+

---
**🚀 Dragon Telegram Pro v6.0 - Enterprise Telegram Management System**
