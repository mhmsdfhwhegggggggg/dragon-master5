# 🔧 Redis Connection Error Fix - connectTimeout Issue

## 🚨 **المشكلة الجديدة**

### **الخطأ**
```
TypeError [ERR_INVALID_ARG_TYPE]: The "msecs" argument must be of type number. Received type string ('10000')
```

### **السبب**
- **connectTimeout=10000**: يجب أن يكون رقم وليس string
- **ioredis**: يتوقع number للـ timeout

---

## 🔧 **الحل الصحيح**

### **الرابط المعدل**
```env
REDIS_URL=rediss://default:AZq_AAIncDE2ZWNiOGRhYzAzNmU0M2U5YjRmODNlMmYwNmU4MDE1MHAxMzk2MTU@subtle-manatee-39615.upstash.io:6379?maxRetriesPerRequest=null&family=6
```

### **ما تم إزالته**
- ❌ **connectTimeout=10000**: يسبب خطأ type error
- ✅ **maxRetriesPerRequest=null**: مهم جداً
- ✅ **family=6**: مهم للأداء

---

## 🔍 **لماذا يحدث هذا؟**

### **ioredis Timeout Configuration**
```typescript
// ioredis يتوقع:
{
  connectTimeout: 10000,  // number
  commandTimeout: 5000,   // number
}

// وليس:
{
  connectTimeout: "10000",  // string - خطأ!
}
```

### **URL Parameters vs Options**
- **URL Parameters**: دائماً strings
- **ioredis Options**: تحتاج numbers للـ timeouts

---

## 🚀 **الحلول الممكنة**

### **الحل 1: إزالة connectTimeout (موصى به)**
```env
REDIS_URL=rediss://default:AZq_AAIncDE2ZWNiOGRhYzAzNmU0M2U5YjRmODNlMmYwNmU4MDE1MHAxMzk2MTU@subtle-manatee-39615.upstash.io:6379?maxRetriesPerRequest=null&family=6
```

### **الحل 2: تعديل الكود (إذا لزم)**
```typescript
// server/_core/queue.ts
const redis = new Redis(REDIS_URL, {
  connectTimeout: 10000,  // number هنا
  commandTimeout: 5000,   // number هنا
});
```

---

## 📊 **النتيجة المتوقعة**

### **بعد الإصلاح**
```
[OAuth] Initialized with baseURL: https://oauth.dragaan-pro.com
[Database] Connected successfully to PostgreSQL
[Queue] BullMQ System Connected to Redis 🚀
[Queue] Redis connection successful
[Queue] Background jobs enabled
```

---

## 🎯 **الخطوات الفورية**

### **1. اذهب إلى Render Dashboard**
```
https://render.com → dragon-master5 → Environment
```

### **2. حدث REDIS_URL**
```env
# استخدم هذا الرابط بالضبط
REDIS_URL=rediss://default:AZq_AAIncDE2ZWNiOGRhYzAzNmU0M2U5YjRmODNlMmYwNmU4MDE1MHAxMzk2MTU@subtle-manatee-39615.upstash.io:6379?maxRetriesPerRequest=null&family=6
```

### **3. أعد النشر**
```
Save Changes → Manual Deploy
```

---

## 🔧 **الخلاصة**

### **المشكلة**
- connectTimeout=10000 في URL يسبب type error
- ioredis يتوقع number وليس string

### **الحل**
- إزالة connectTimeout من URL
- ioredis سيستخدم القيم الافتراضية
- maxRetriesPerRequest=null يبقى مهم جداً

**استخدم الرابط المعدل بدون connectTimeout!** 🚀
