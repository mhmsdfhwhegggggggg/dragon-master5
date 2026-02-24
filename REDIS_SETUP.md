# Dragon Telegram Pro - Redis Setup Guide

## 🚀 Quick Redis Setup (Free & Easy)

### **Option 1: Docker (Recommended)**
```bash
# Start Redis with Docker
docker run -d --name dragon-redis -p 6379:6379 redis:7-alpine

# Or use docker-compose
docker-compose up -d
```

### **Option 2: Windows (Manual)**
```powershell
# Download Redis for Windows
# Visit: https://redis.io/download
# Install redis-server.exe
# Start: redis-server
```

### **Option 3: Cloud (Free)**
```bash
# Redis Cloud (Free tier)
# Visit: https://redis.com/try-free
# Get connection URL
```

---

## 🔧 **Environment Variables**

Add to your `.env` file:
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
# Or for cloud: REDIS_URL=redis://username:password@host:port
```

---

## ✅ **Verification**

After starting Redis:
```bash
# Test connection
npm run dev:server

# Should see:
[Queue] BullMQ System Connected to Redis 🚀
```

---

## 🎯 **Benefits of Redis**

✅ **Background Jobs** - Bulk operations work properly  
✅ **Caching** - Faster API responses  
✅ **Session Storage** - Better performance  
✅ **Anti-Ban Monitoring** - Real-time protection  
✅ **Queue Management** - Job tracking and retries  

---

## 📱 **Redis Mobile Apps**

- **RedisInsight** (Desktop)
- **Another Redis Desktop Manager** (Free)
- **TablePlus** (Redis GUI)

---

**Choose what works best for you!** 🚀
