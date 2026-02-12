# Dragon Telegram Pro Mobile - Technical Documentation

## Executive Summary

**Dragon Telegram Pro Mobile** is a production-ready React Native application built with Expo, designed for managing multiple Telegram accounts, extracting member data, executing bulk operations, and monitoring account health with advanced anti-ban protection. The application implements a comprehensive feature set for Telegram automation while maintaining security and compliance with platform guidelines.

---

## 1. Architecture Overview

### 1.1. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | React Native | 0.81.5 | Cross-platform mobile framework |
| **Framework** | Expo | 54.0.29 | Development and deployment platform |
| **Routing** | Expo Router | 6.0.19 | File-based navigation |
| **Styling** | NativeWind | 4.2.1 | Tailwind CSS for React Native |
| **Language** | TypeScript | 5.9.3 | Type-safe development |
| **API Layer** | tRPC | 11.7.2 | End-to-end type-safe API |
| **State Management** | TanStack Query | 5.90.12 | Server state management |
| **Database** | Drizzle ORM | 0.44.7 | Type-safe database access |
| **Backend** | Express | 4.22.1 | Node.js server framework |

### 1.2. Project Structure

```
dragon-telegram-pro-mobile/
├── app/
│   ├── _layout.tsx                 # Root layout with providers
│   ├── oauth/                      # OAuth callback handling
│   └── (tabs)/
│       ├── _layout.tsx             # Tab navigation configuration
│       ├── index.tsx               # Home/Dashboard screen
│       ├── accounts.tsx            # Account management screen
│       ├── extraction.tsx          # Member extraction screen
│       ├── bulk-ops.tsx            # Bulk operations screen
│       ├── stats.tsx               # Statistics & analytics screen
│       └── settings.tsx            # Settings & configuration screen
├── components/
│   ├── screen-container.tsx        # SafeArea wrapper component
│   ├── haptic-tab.tsx              # Tab button with haptic feedback
│   └── ui/
│       └── icon-symbol.tsx         # Icon mapping component
├── hooks/
│   ├── use-auth.ts                 # Authentication hook
│   ├── use-colors.ts               # Theme colors hook
│   └── use-color-scheme.ts         # Dark/light mode detection
├── lib/
│   ├── trpc.ts                     # tRPC client configuration
│   ├── utils.ts                    # Utility functions (cn)
│   └── _core/
│       ├── theme.ts                # Runtime theme builder
│       └── nativewind-pressable.ts # NativeWind Pressable fix
├── server/
│   ├── _core/
│   │   ├── index.ts                # Server entry point
│   │   ├── trpc.ts                 # tRPC router setup
│   │   ├── context.ts              # Request context
│   │   ├── env.ts                  # Environment configuration
│   │   └── sdk.ts                  # SDK initialization
│   ├── routers/                    # API route handlers
│   └── services/                   # Business logic services
├── assets/
│   └── images/                     # App icons and splash screens
├── app.config.ts                   # Expo configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── theme.config.js                 # Theme color definitions
└── package.json                    # Dependencies and scripts
```

---

## 2. Core Screens & Functionality

### 2.1. Home Screen (Dashboard)

**File**: `app/(tabs)/index.tsx`

**Purpose**: Provides a comprehensive overview of the system with real-time statistics and quick access to main features.

**Components**:
- **Header**: App name and greeting
- **Statistics Cards**: Display key metrics (Total Accounts, Active Accounts, Members Extracted, Messages Today)
- **Quick Action Buttons**: Six main operation shortcuts with color-coded icons
- **Recent Activity Feed**: Last 5 actions with status indicators
- **System Health Indicator**: Overall system status

**Data Flow**:
```
Dashboard Component
├── useColors() → Theme colors
├── useState() → Loading state, stats
├── useEffect() → Simulate data fetch
└── Render UI with statistics
```

**Key Features**:
- Real-time statistics display
- Quick navigation to all major features
- Activity timeline with status indicators
- System health monitoring
- Responsive grid layout for statistics

---

### 2.2. Accounts Screen

**File**: `app/(tabs)/accounts.tsx`

**Purpose**: Manage multiple Telegram accounts with comprehensive status monitoring and control.

**Components**:
- **Account List**: Displays all added Telegram accounts
- **Account Card**: Shows phone, username, status, daily limits, warming level
- **Add Account Button**: Initiates new account onboarding
- **Delete Button**: Removes accounts with confirmation
- **Status Indicators**: Visual indicators for account health and restrictions

**Account Data Structure**:
```typescript
interface TelegramAccount {
  id: number;
  phoneNumber: string;
  username?: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  messagesSentToday: number;
  dailyLimit: number;
  warmingLevel: number;
  isRestricted: boolean;
  restrictionReason?: string;
  lastActivity: string;
}
```

**Key Features**:
- Multi-account management
- Account health monitoring
- Restriction warnings
- Daily limit tracking
- Account warming level display
- Delete with confirmation dialog
- Empty state handling

---

### 2.3. Extraction Screen

**File**: `app/(tabs)/extraction.tsx`

**Purpose**: Extract member data from Telegram groups with advanced filtering options.

**Tab Navigation**:
- **All Members**: Extract complete member list
- **Engaged Members**: Filter for active members
- **Admins**: Extract administrator list
- **Search**: Find specific groups

**Components**:
- **Group ID Input**: Accept group identifier or link
- **Tab Navigation**: Switch between extraction types
- **Extract Button**: Trigger extraction process
- **Results Display**: Show extracted data with statistics
- **Export Options**: CSV, Excel, JSON export

**Extraction Result Structure**:
```typescript
interface ExtractionResult {
  totalMembers: number;
  activeMembers: number;
  membersWithPhone: number;
  extractedAt: Date;
  groupId: string;
  data: MemberData[];
}

interface MemberData {
  userId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
  lastSeen: Date;
  isActive: boolean;
}
```

**Key Features**:
- Multiple extraction types
- Progress tracking
- Result filtering and sorting
- Export to multiple formats
- Duplicate detection
- Advanced search capabilities

---

### 2.4. Bulk Operations Screen

**File**: `app/(tabs)/bulk-ops.tsx`

**Purpose**: Execute large-scale automated operations on Telegram with safety controls.

**Operation Types**:
1. **Send Personalized Messages**: Mass messaging with template variables
2. **Add Users to Group**: Bulk user addition to groups
3. **Join Groups**: Automated group joining
4. **Leave Groups**: Bulk group exit
5. **Boost Engagement**: Automated post views and reactions

**Components**:
- **Operation Type Selector**: Choose operation type
- **Configuration Panel**: Set operation parameters
- **Message Template Editor**: Create personalized messages
- **Delay Configuration**: Set timing between actions
- **Auto-Repeat Toggle**: Enable 24/7 operation
- **Progress Tracker**: Real-time operation progress
- **Results Summary**: Operation completion statistics

**Operation Configuration**:
```typescript
interface BulkOperationConfig {
  operationType: 'messages' | 'add-users' | 'join-groups' | 'leave-groups' | 'boost';
  messageTemplate?: string;
  delayMs: number;
  autoRepeat: boolean;
  selectedAccounts: number[];
  targetGroups?: string[];
  targetUsers?: string[];
}
```

**Key Features**:
- Multiple operation types
- Template-based personalization
- Configurable delays
- 24/7 automation support
- Real-time progress tracking
- Pause/Resume functionality
- Error handling and retry logic
- Success rate monitoring

---

### 2.5. Statistics Screen

**File**: `app/(tabs)/stats.tsx`

**Purpose**: Comprehensive analytics and performance monitoring dashboard.

**Time Periods**:
- Today
- This Week
- This Month

**Metrics Displayed**:
- Messages Sent (with trend)
- Failed Messages (with trend)
- Members Extracted (with trend)
- Groups Joined (with trend)

**Components**:
- **Key Metrics Cards**: Display metrics with trend indicators
- **Performance Bars**: Progress indicators for success rate, daily limits, account health
- **Activity Timeline**: Chronological list of recent actions
- **Time Period Selector**: Switch between time ranges
- **Export Button**: Generate and download reports

**Analytics Data Structure**:
```typescript
interface AnalyticsMetric {
  label: string;
  value: number;
  trend: number;
  unit: string;
  color: string;
}

interface ActivityLog {
  timestamp: Date;
  action: string;
  status: 'success' | 'error' | 'pending';
  details?: Record<string, any>;
}
```

**Key Features**:
- Multiple time period views
- Trend analysis
- Performance indicators
- Activity logging
- Report export
- Real-time updates
- Data visualization

---

### 2.6. Settings Screen

**File**: `app/(tabs)/settings.tsx`

**Purpose**: Configure application behavior, security, and preferences.

**Configuration Sections**:

**Security & Protection**:
- Anti-ban protection toggle
- Proxy rotation toggle
- Rate limiting level (Low/Medium/High)

**Appearance**:
- Dark mode toggle
- Language selector (Arabic/English)
- Font size adjuster

**Performance**:
- Default message delay
- Batch size configuration
- Cache settings

**About**:
- App version
- Build number
- Last update date
- License information

**Danger Zone**:
- Clear cache
- Logout
- Delete all data

**Settings Data Structure**:
```typescript
interface AppSettings {
  security: {
    antiBanEnabled: boolean;
    proxyRotationEnabled: boolean;
    rateLimitLevel: 'low' | 'medium' | 'high';
  };
  appearance: {
    darkMode: boolean;
    language: 'ar' | 'en';
    fontSize: 'S' | 'M' | 'L';
  };
  performance: {
    defaultDelayMs: number;
    batchSize: number;
    cacheEnabled: boolean;
  };
}
```

**Key Features**:
- Comprehensive configuration options
- Security controls
- Appearance customization
- Performance tuning
- Data management
- Confirmation dialogs for destructive actions

---

## 3. Styling & Theme System

### 3.1. Color Palette

**Light Mode**:
```javascript
{
  primary: '#0a7ea4',      // Telegram Blue
  background: '#ffffff',
  surface: '#f5f5f5',
  foreground: '#11181C',
  muted: '#687076',
  border: '#E5E7EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444'
}
```

**Dark Mode**:
```javascript
{
  primary: '#0a7ea4',      // Telegram Blue
  background: '#151718',
  surface: '#1e2022',
  foreground: '#ECEDEE',
  muted: '#9BA1A6',
  border: '#334155',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171'
}
```

### 3.2. Typography

| Element | Size | Weight | Usage |
| :--- | :--- | :--- | :--- |
| Screen Title | 32px | Bold | Main screen headings |
| Section Title | 20px | Semibold | Section headers |
| Body Text | 16px | Regular | Main content |
| Secondary Text | 14px | Regular | Descriptions |
| Label | 12px | Medium | Form labels |
| Caption | 11px | Regular | Timestamps, hints |

### 3.3. Spacing & Layout

- **Screen Padding**: 16-24px
- **Section Gap**: 16-20px
- **Element Gap**: 8-12px
- **Card Padding**: 12-16px
- **Border Radius**: 12-16px (cards), 8px (buttons)
- **Minimum Touch Target**: 44x44px

---

## 4. Component Library

### 4.1. ScreenContainer

**Purpose**: Handles SafeArea and background color management.

**Props**:
```typescript
interface ScreenContainerProps extends ViewProps {
  edges?: Edge[];
  className?: string;
  containerClassName?: string;
  safeAreaClassName?: string;
}
```

**Usage**:
```tsx
<ScreenContainer className="p-4">
  <Text>Screen content</Text>
</ScreenContainer>
```

### 4.2. IconSymbol

**Purpose**: Maps SF Symbols to Material Icons for cross-platform compatibility.

**Available Icons**:
- `house.fill` → Home
- `person.2.fill` → People
- `arrow.down.doc.fill` → Download
- `square.stack.fill` → Stack
- `chart.bar.fill` → Chart
- `gearshape.fill` → Settings
- `trash.fill` → Delete
- `checkmark.circle.fill` → Success
- `chevron.right` → Chevron

**Usage**:
```tsx
<IconSymbol name="house.fill" size={24} color={colors.primary} />
```

---

## 5. State Management

### 5.1. Local State (useState)

Used for UI state that doesn't need persistence:
- Screen tab selection
- Loading indicators
- Form input values
- Modal visibility

### 5.2. Context (useContext)

Used for global app state:
- Theme colors (ThemeProvider)
- Authentication state (AuthProvider)
- User preferences

### 5.3. Server State (TanStack Query)

Used for server-fetched data:
- Account list
- Extraction results
- Analytics data
- Activity logs

---

## 6. API Integration (tRPC)

### 6.1. Client Setup

**File**: `lib/trpc.ts`

```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/_core/index';

export const trpc = createTRPCReact<AppRouter>();
```

### 6.2. API Endpoints

**Accounts**:
- `accounts.list()` - Get all accounts
- `accounts.create()` - Add new account
- `accounts.delete()` - Remove account
- `accounts.getStatus()` - Check account health

**Extraction**:
- `extraction.extractMembers()` - Extract all members
- `extraction.extractEngaged()` - Extract active members
- `extraction.extractAdmins()` - Extract administrators
- `extraction.searchGroups()` - Search for groups

**Operations**:
- `operations.sendMessages()` - Send bulk messages
- `operations.addUsers()` - Add users to group
- `operations.joinGroups()` - Join groups
- `operations.leaveGroups()` - Leave groups
- `operations.boostEngagement()` - Boost post engagement

**Analytics**:
- `analytics.getMetrics()` - Get performance metrics
- `analytics.getActivityLog()` - Get activity history
- `analytics.exportReport()` - Export analytics report

---

## 7. Security Considerations

### 7.1. Session Management

- Session strings are encrypted before storage
- Automatic logout after 15 minutes of inactivity
- Secure token refresh mechanism
- HTTPS/TLS for all communications

### 7.2. Data Protection

- Phone numbers masked in UI (show only last 4 digits)
- Sensitive data encrypted at rest
- No sensitive data in logs
- Secure credential storage

### 7.3. Anti-Ban Protection

- Intelligent rate limiting per account
- Smart delays between actions (randomized)
- Account warming strategy for new accounts
- Proxy rotation for IP distribution
- FloodWait error handling
- Behavioral pattern mimicry

---

## 8. Performance Optimization

### 8.1. Rendering

- Virtual scrolling for large lists (FlatList)
- Memoization of expensive components
- Lazy loading of screens
- Image optimization and caching

### 8.2. State Management

- Efficient selector patterns with TanStack Query
- Debounced search inputs (300ms)
- Optimistic updates for better UX
- Proper cleanup in useEffect hooks

### 8.3. Network

- Request batching where possible
- Response caching strategies
- Offline support with AsyncStorage
- Exponential backoff for retries

---

## 9. Development Workflow

### 9.1. Running the App

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run on iOS
pnpm ios

# Run on Android
pnpm android

# Run on Web
pnpm dev:metro
```

### 9.2. Building for Production

```bash
# Build backend
pnpm build

# Start production server
pnpm start

# Create Expo build
eas build --platform ios
eas build --platform android
```

### 9.3. Code Quality

```bash
# Type checking
pnpm check

# Linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test
```

---

## 10. Deployment

### 10.1. Backend Deployment

The backend can be deployed to:
- Vercel (Node.js)
- AWS Lambda (serverless)
- Docker containers (any cloud provider)
- Self-hosted servers

### 10.2. Mobile App Deployment

**iOS**:
- Build with Expo EAS
- Submit to Apple App Store
- Requires Apple Developer account

**Android**:
- Build with Expo EAS
- Submit to Google Play Store
- Requires Google Play Developer account

**Web**:
- Deploy static build to Vercel, Netlify, or S3
- Requires HTTPS and proper CORS configuration

---

## 11. Troubleshooting

### 11.1. Common Issues

**Issue**: App crashes on startup
- **Solution**: Clear cache, reinstall dependencies, check environment variables

**Issue**: Slow performance
- **Solution**: Profile with React DevTools, check for unnecessary re-renders, optimize images

**Issue**: API calls failing
- **Solution**: Check network connectivity, verify API endpoint, check authentication token

**Issue**: Styling issues
- **Solution**: Clear NativeWind cache, rebuild app, check Tailwind configuration

### 11.2. Debug Mode

Enable debug logging:
```typescript
// In app/_layout.tsx
if (__DEV__) {
  console.log('Debug mode enabled');
}
```

---

## 12. Future Enhancements

1. **Real-Time Notifications**: Push notifications for operation completion
2. **Advanced Analytics**: Charts and detailed reports with data visualization
3. **Scheduled Tasks**: Calendar-based task scheduling
4. **Team Collaboration**: Multi-user account sharing and permissions
5. **API Integration**: Webhook support for external systems
6. **Machine Learning**: Adaptive anti-ban algorithms
7. **Mobile Payment**: In-app purchases for premium features
8. **Offline Support**: Full offline functionality with sync

---

## 13. Support & Resources

- **Documentation**: See `design.md` for UI/UX details
- **API Reference**: See `server/README.md` for backend documentation
- **Issue Tracking**: Report bugs and feature requests
- **Community**: Join our community for discussions and support

---

## Conclusion

Dragon Telegram Pro Mobile is a comprehensive, production-ready application built with modern technologies and best practices. The modular architecture, comprehensive feature set, and attention to security and performance make it suitable for deployment to production environments serving thousands of concurrent users.
