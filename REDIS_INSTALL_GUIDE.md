# Redis Setup for Dragon Telegram Pro

## 🚀 **Problem Identified**
Docker Desktop is not running or not properly installed on Windows.

## 📋 **Solutions (Choose ONE)**

### **Option 1: Install Docker Desktop (Recommended)**
1. Download Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Run: `.\start-redis.bat`

### **Option 2: Use Redis Cloud (Free)**
1. Visit: https://redis.com/try-free
2. Create free account
3. Get connection URL
4. Add to `.env`: `REDIS_URL=redis://your-connection-url`

### **Option 3: Install Redis on Windows**
1. Download Redis for Windows: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Add to `.env`: `REDIS_URL=redis://localhost:6379`

### **Option 4: Use WSL2 (Linux)**
```bash
# Install WSL2 Ubuntu
wsl --install -d Ubuntu

# Start Redis in WSL
wsl -d Ubuntu
sudo apt update
sudo apt install redis-server
redis-server --daemonize yes --port 6379
```

---

## 🔧 **Environment Setup**

After choosing an option, add to your `.env` file:
```env
REDIS_URL=redis://localhost:6379
```

---

## ✅ **Verification**

Start the server and check for:
```
[Queue] BullMQ System Connected to Redis 🚀
```

---

## 🎯 **Recommendation**

**Use Option 1 (Docker Desktop)** - it's the easiest and most reliable method for Windows users.
