# Dragon Telegram Pro - Quick Start Guide

## Prerequisites Completed ✅

The following setup has been completed for you:

1. **PostgreSQL Database** - Installed and running with database `dragon_telegram_pro`
2. **Database Schema** - All 12 tables created and migrated
3. **Backend Server** - Running on port 3000 with tRPC APIs
4. **Frontend Integration** - Home and Accounts screens connected to real APIs
5. **Dependencies** - All npm packages installed via pnpm

## Running the Application

### Option 1: Full Development Mode (Recommended)

Start both backend server and Expo metro bundler:

```bash
cd /home/ubuntu
export DATABASE_URL="postgresql://postgres:password@localhost:5432/dragon_telegram_pro"
pnpm dev
```

This will start:
- Backend API server on `http://localhost:3000`
- Expo Metro bundler on `http://localhost:8081`

### Option 2: Backend Only

If you only want to test the backend APIs:

```bash
cd /home/ubuntu
export DATABASE_URL="postgresql://postgres:password@localhost:5432/dragon_telegram_pro"
pnpm dev:server
```

### Option 3: Frontend Only

If the backend is already running:

```bash
cd /home/ubuntu
pnpm dev:metro
```

## Testing the Setup

### 1. Test Backend Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{"ok":true,"timestamp":1234567890}
```

### 2. Run Automated Tests

```bash
cd /home/ubuntu
bash test-api.sh
```

### 3. Check Database

```bash
sudo -u postgres psql -d dragon_telegram_pro -c "SELECT COUNT(*) FROM users;"
```

## Accessing the Mobile App

### For Web Development

Once the dev server is running, open your browser to:
```
http://localhost:8081
```

### For Mobile Device (Android/iOS)

1. Install Expo Go app on your mobile device
2. Run the QR code generator:
   ```bash
   pnpm qr
   ```
3. Scan the QR code with Expo Go app

### For Android Emulator

```bash
pnpm android
```

### For iOS Simulator (Mac only)

```bash
pnpm ios
```

## Project Structure

```
/home/ubuntu/
├── app/                    # Frontend screens (React Native)
│   └── (tabs)/
│       ├── index.tsx       # Home/Dashboard (✅ Connected to API)
│       ├── accounts.tsx    # Accounts Management (✅ Connected to API)
│       ├── extraction.tsx  # Member Extraction
│       ├── bulk-ops.tsx    # Bulk Operations
│       ├── stats.tsx       # Statistics
│       └── settings.tsx    # Settings
├── server/                 # Backend API
│   ├── _core/
│   │   ├── db.ts          # Database connection (✅ Created)
│   │   └── trpc.ts        # tRPC setup
│   └── routers/
│       ├── dashboard.router.ts  # Dashboard API (✅ Created)
│       ├── accounts.router.ts   # Accounts API (✅ Created)
│       ├── extraction.router.ts # Extraction API
│       ├── bulk-ops.router.ts   # Bulk Operations API
│       └── stats.router.ts      # Statistics API
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Database tables definition
└── .env                   # Environment variables (✅ Configured)
```

## Available API Endpoints

### Dashboard
- `dashboard.getStats` - Get total accounts, active accounts, members extracted, messages today
- `dashboard.getRecentActivities` - Get last 10 activities

### Accounts
- `accounts.getAll` - Get all Telegram accounts for current user
- `accounts.add` - Add new Telegram account
- `accounts.delete` - Delete account by ID
- `accounts.updateStatus` - Update account active status

### Extraction (Pre-configured)
- `extraction.extractAllMembers` - Extract all members from a group
- `extraction.extractEngagedMembers` - Extract engaged members
- `extraction.extractAdmins` - Extract group administrators
- `extraction.getExtractedMembers` - Get extracted members from database

### Bulk Operations (Pre-configured)
- Available in `bulkOpsRouter`

### Statistics (Pre-configured)
- Available in `statsRouter`

## Environment Variables

The following environment variables are configured in `/home/ubuntu/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/dragon_telegram_pro
JWT_SECRET=dragon_telegram_pro_secret_key_2024
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_APP_ID=dragon-telegram-pro
NODE_ENV=development
EXPO_PORT=8081
```

## Common Commands

### Database Operations

```bash
# Generate new migration
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Push schema to database (generate + migrate)
pnpm db:push

# Access database CLI
sudo -u postgres psql -d dragon_telegram_pro
```

### Development

```bash
# Type checking
pnpm check

# Linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Build server
pnpm build
```

## Next Steps

1. **Add Authentication** - Implement OAuth login flow
2. **Complete Frontend Integration** - Connect remaining screens to APIs
3. **Telegram Integration** - Add Telegram API credentials and implement session management
4. **Testing** - Add unit and integration tests
5. **Deployment** - Configure production environment

## Troubleshooting

### Server won't start

Check if PostgreSQL is running:
```bash
sudo service postgresql status
```

If not running:
```bash
sudo service postgresql start
```

### Database connection error

Verify the DATABASE_URL is set:
```bash
echo $DATABASE_URL
```

If not set, export it:
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/dragon_telegram_pro"
```

### Port already in use

Kill the process using the port:
```bash
# For port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# For port 8081 (expo)
lsof -ti:8081 | xargs kill -9
```

## Support

For detailed technical documentation, see:
- `/home/ubuntu/TECHNICAL_DOCUMENTATION.md`
- `/home/ubuntu/USER_GUIDE.md`
- `/home/ubuntu/SETUP_COMPLETE.md`

---

**Status**: ✅ Ready for Development

All core infrastructure is set up and tested. You can now start developing features!
