# Auth0 Setup Guide for Dragon Telegram Pro

## 🚀 **إنشاء حساب Auth0 مجاني**

### **الخطوة 1: التسجيل في Auth0**
1. افتح: https://auth0.com
2. اضغط "Sign Up"
3. اختر الخطة المجانية "Free"
4. أكمل التسجيل بالبريد الإلكتروني

### **الخطوة 2: إنشاء Application**
1. بعد تسجيل الدخول، اذهب إلى "Applications"
2. اضغط "Create Application"
3. اختر "Single Page Web Applications"
4. الاسم: `Dragon Telegram Pro`
5. اضغط "Create"

### **الخطوة 3: إعدادات Application**
1. في صفحة Application، اذهب إلى "Settings"
2. **Allowed Callback URLs**:
   ```
   http://localhost:3000/api/oauth/callback
   http://localhost:8082
   ```
3. **Allowed Logout URLs**:
   ```
   http://localhost:3000
   http://localhost:8082
   ```
4. **Allowed Web Origins**:
   ```
   http://localhost:3000
   http://localhost:8082
   ```
5. اضغط "Save Changes"

### **الخطوة 4: الحصول على بيانات الاعتماد**
1. اذهب إلى "Settings" → "Basic Information"
2. انسخ:
   - **Domain**: `your-tenant.auth0.com`
   - **Client ID**: `your_client_id_here`
   - **Client Secret**: `your_client_secret_here`

---

## 🔧 **إعدادات البيئة**

### **أضف إلى ملف .env**:
```env
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_CALLBACK_URL=http://localhost:3000/api/oauth/callback

# OAuth Configuration
OAUTH_SERVER_URL=https://your-tenant.auth0.com
APP_ID=dragon_telegram_pro_mobile
OWNER_OPEN_ID=admin@example.com
```

---

## 📝 **تعديل كود OAuth**

### **تحديث ملف OAuth**:
```typescript
// server/_core/oauth.ts
// أضف دعم Auth0
async function exchangeAuth0Code(code: string) {
  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.AUTH0_CALLBACK_URL
    })
  });
  
  return response.json();
}

async function getAuth0UserInfo(accessToken: string) {
  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  return response.json();
}
```

---

## 🎯 **رابط تسجيل الدخول**

### **إنشاء رابط OAuth**:
```
https://your-tenant.auth0.com/authorize?
  response_type=code&
  client_id=your_client_id&
  redirect_uri=http://localhost:3000/api/oauth/callback&
  scope=openid profile email&
  state=random_string_here
```

---

## 🚀 **الخطوات النهائية**

### **1. اختبار الاتصال**:
```bash
# اختبر Auth0 connection
node -e "
const fetch = require('node-fetch');
const domain = 'your-tenant.auth0.com';
fetch(\`https://\${domain}/.well-known/openid-configuration\`)
  .then(res => res.json())
  .then(config => console.log('✅ Auth0 connected:', config.issuer))
  .catch(err => console.log('❌ Auth0 failed:', err.message));
"
```

### **2. تشغيل التطبيق**:
```bash
npm run dev
```

### **3. فحص المتصفح**:
```
http://localhost:3000
```

---

## 📊 **مميزات الخطة المجانية**

- ✅ **7,500 مستخدم نشط شهرياً**
- ✅ **2 تطبيق مخصص**
- ✅ **Social Login** (Google, GitHub, Facebook)
- ✅ **Multi-factor Authentication**
- ✅ ** breached password detection**
- ✅ **Basic logging and monitoring**

---

## 🎯 **النتيجة**

بعد إعداد Auth0:
- ✅ **نظام مصادقة احترافي**
- ✅ **Social Login جاهز**
- ✅ **Security متقدم**
- ✅ **User Management كامل**
- ✅ **Ready for production**

**ابدأ الآن!** 🚀
