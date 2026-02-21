# Dragon Telegram Pro - OAuth Setup Guide

## 🔐 **OAuth Configuration**

### **Current Setup**
- ✅ **Redis**: Connected to Upstash
- ✅ **Backend**: Ready on port 3000
- ✅ **Frontend**: Ready on port 8082
- ⚠️ **OAuth**: Needs configuration

---

## 🏗️ **OAuth Server Setup**

### **Option 1: Use Default OAuth Server**
```env
# Already configured in .env
OAUTH_SERVER_URL=https://oauth.dragaan-pro.com
APP_ID=dragon_telegram_pro_mobile
OWNER_OPEN_ID=your_owner_open_id
```

### **Option 2: Create Custom OAuth Server**

#### **Step 1: OAuth Provider Setup**
1. **GitHub OAuth** (Recommended)
   - Visit: https://github.com/settings/applications/new
   - Application name: `Dragon Telegram Pro`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/oauth/callback`

2. **Google OAuth**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Redirect URI: `http://localhost:3000/api/oauth/callback`

#### **Step 2: Environment Variables**
```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth Configuration
OAUTH_SERVER_URL=http://localhost:3000
APP_ID=dragon_telegram_pro_mobile
OWNER_OPEN_ID=admin@example.com
```

---

## 🚀 **Account Creation Process**

### **Method 1: Web Interface**
1. Start server: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Click "Login with OAuth"
4. Choose provider (GitHub/Google)
5. Authorize application
6. Account created automatically

### **Method 2: Mobile App**
1. Start Metro: `npm run dev:metro`
2. Open Expo app
3. Click "Sign Up"
4. Choose OAuth provider
5. Complete authentication
6. Account created in mobile

### **Method 3: Direct API**
```bash
# Create admin account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "Admin",
    "password": "secure_password"
  }'
```

---

## 🔧 **OAuth Endpoints**

### **Available Routes**
- `GET /api/oauth/callback` - OAuth callback handler
- `GET /api/oauth/mobile` - Mobile OAuth exchange
- `POST /api/auth/logout` - Logout endpoint
- `GET /api/auth/me` - Get current user
- `POST /api/auth/session` - Session establishment

---

## 📱 **Mobile OAuth Flow**

### **React Native Integration**
```typescript
// OAuth login in mobile app
const handleOAuthLogin = async (provider: 'github' | 'google') => {
  const oauthUrl = `${OAUTH_SERVER_URL}/oauth/${provider}`;
  const result = await WebBrowser.openAuthSessionAsync(oauthUrl);
  
  if (result.type === 'success') {
    // Exchange code for session
    const response = await fetch('/api/oauth/mobile', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${result.params.code}` }
    });
    
    const { app_session_id, user } = await response.json();
    // Store session and user data
  }
};
```

---

## 🎯 **Quick Start**

### **For Development**
```bash
# 1. Start with default OAuth
npm run dev

# 2. Visit http://localhost:3000
# 3. Click "Login" - account created automatically
```

### **For Production**
```bash
# 1. Configure OAuth provider
# 2. Update environment variables
# 3. Deploy with production OAuth
npm run start
```

---

## ✅ **OAuth Status**

**Current Configuration:**
- ✅ **OAuth Server**: https://oauth.dragaan-pro.com
- ✅ **App ID**: dragon_telegram_pro_mobile
- ⚠️ **Owner Open ID**: Needs your ID
- ✅ **Account Creation**: Automatic on first login

**Ready for account creation!** 🚀
