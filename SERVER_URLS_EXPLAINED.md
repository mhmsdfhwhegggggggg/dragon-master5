# 🌐 Dragon Telegram Pro - Server URLs Explained

## 🏠 **Local Development (Current)**
```
Backend API: http://localhost:3000
Frontend Web: http://localhost:8082
Mobile App: Connects to localhost:3000
```

---

## 🚀 **Production Deployment**

### **Option 1: Render.com (موصى به)**
```
Backend API: https://dragon-telegram-pro-api.onrender.com
Frontend Web: https://dragon-telegram-pro.onrender.com
Mobile App: Connects to API URL
```

### **Option 2: Domain خاص**
```
Backend API: https://api.your-domain.com
Frontend Web: https://your-domain.com
Mobile App: Connects to api.your-domain.com
```

### **Option 3: VPS/Dedicated Server**
```
Backend API: https://your-server-ip:3000
Frontend Web: https://your-server-ip:8082
Mobile App: Connects to your-server-ip:3000
```

---

## 🔧 **كيفية التغيير**

### **1. تحديث متغيرات البيئة**
```env
# من localhost إلى إنتاجي
NODE_ENV=production
BACKEND_URL=https://api.your-domain.com
FRONTEND_URL=https://your-domain.com
```

### **2. تحديث التطبيق المحمول**
```typescript
// تغيير رابط API في التطبيق
const API_URL = 'https://api.your-domain.com';
```

### **3. نشر على السيرفر**
```bash
# نشر التطبيق
git push origin master
# التطبيق سيعمل على الرابط الجديد
```

---

## 📱 **التطبيق المحمول**

### **الوضع الحالي**
- **التطبيق**: يعمل على localhost
- **الاتصال**: يبحث عن الخادم المحلي
- **النتيجة**: يعمل فقط على نفس الجهاز

### **للعمل على جميع الأجهزة**
1. **نشر الخادم** على استضافة
2. **تحديث الروابط** في التطبيق
3. **بناء APK/IPA** للنشر
4. **التطبيق** سيعمل من أي مكان

---

## 🎯 **الخلاصة**

- **localhost**: للتطوير فقط على جهازك
- **Production**: ليعمل للجميع على الإنترنت
- **Mobile**: يحتاج لرابط الخادم الخارجي

**لجعل التطبيق يعمل للجميع، يجب نشره على استضافة!** 🌍
