# Dragon Telegram Pro Mobile - User Guide

## Getting Started

Welcome to **Dragon Telegram Pro Mobile**, a powerful application for managing multiple Telegram accounts, extracting member data, and automating engagement while protecting your accounts from restrictions.

---

## 1. Home Screen (Dashboard)

The Home Screen provides a quick overview of your system's performance and status.

### 1.1. Statistics Cards

Four key metrics are displayed at the top:

- **Total Accounts**: Number of Telegram accounts you've added
- **Active Accounts**: How many accounts are currently operational
- **Members Extracted**: Total members extracted from groups
- **Messages Today**: Number of messages sent in the current day

### 1.2. Quick Action Buttons

Six main operations are accessible from the home screen:

1. **الحسابات (Accounts)**: Manage your Telegram accounts
2. **استخراج الأعضاء (Extract Members)**: Extract member data from groups
3. **عمليات جماعية (Bulk Operations)**: Execute mass messaging and group operations
4. **الإحصائيات (Statistics)**: View detailed analytics and reports
5. **الإعدادات (Settings)**: Configure app behavior and security
6. **الصحة (Health)**: Monitor account health and restrictions

### 1.3. Recent Activity Feed

The activity feed shows your last 5 actions with timestamps and status indicators:
- ✅ Green indicator: Successful operation
- ❌ Red indicator: Failed operation

### 1.4. System Health Status

A status banner at the bottom shows the overall system health. Green means all systems are operational.

---

## 2. Accounts Management

The Accounts screen allows you to manage multiple Telegram accounts with full control and monitoring.

### 2.1. Adding a New Account

1. Tap the **+ إضافة (Add)** button in the top-right corner
2. Enter your Telegram phone number (with country code, e.g., +20)
3. You'll receive an SMS code - enter it when prompted
4. If you have 2FA enabled, enter your password
5. Your account will be added and appear in the list

### 2.2. Account Information

Each account card displays:

- **Phone Number**: Your Telegram phone (partially masked for privacy)
- **Username**: Your Telegram username (if set)
- **Status Badge**: Shows if account is Active (green) or Inactive (gray)
- **Messages Today**: Current message count vs. daily limit (e.g., 45/100)
- **Warming Level**: Account reputation percentage (0-100%)
- **Last Activity**: When the account was last used

### 2.3. Account Status Indicators

- **Active (Green)**: Account is operational and ready to use
- **Inactive (Gray)**: Account is not currently active
- **Restricted (Red)**: Account has been restricted by Telegram - use with caution

### 2.4. Deleting an Account

1. Tap the trash icon on the right side of an account card
2. Confirm the deletion in the popup dialog
3. The account will be permanently removed

### 2.5. Account Warming

New accounts need a "warming period" before full usage:
- **0-30%**: Account is very new, limit activity
- **30-60%**: Account is warming up, moderate activity
- **60-90%**: Account is warming well, normal activity
- **90-100%**: Account is fully warmed, full activity allowed

---

## 3. Member Extraction

Extract valuable member data from Telegram groups for targeting and analysis.

### 3.1. Extraction Types

**Tab 1: الأعضاء (All Members)**
- Extracts complete member list from a group
- Includes names, usernames, phone numbers, and last seen timestamps

**Tab 2: المتفاعلين (Engaged Members)**
- Filters for members active in the last 7 days
- Useful for targeting active users

**Tab 3: الأدمن (Admins)**
- Extracts only group administrators and moderators
- Useful for direct outreach

**Tab 4: البحث (Search)**
- Search for specific groups by name or ID
- Filter by location, member count, or activity level

### 3.2. How to Extract Members

1. Select the extraction type from the tabs
2. Enter the group ID or paste the group link
3. Tap **استخرج الأعضاء (Extract Members)**
4. Wait for the extraction to complete (progress bar shows status)
5. View results showing total members, active members, and those with phone numbers

### 3.3. Exporting Data

After extraction, you can export data in multiple formats:
- **CSV**: Comma-separated values (Excel compatible)
- **Excel**: Direct Excel file format
- **JSON**: Structured data format for developers

---

## 4. Bulk Operations

Execute large-scale automated operations safely and efficiently.

### 4.1. Operation Types

**1. رسائل شخصية (Send Personalized Messages)**
- Send custom messages to multiple users
- Use variables like {firstName}, {lastName}, {username} for personalization
- Example: "مرحباً {firstName}، شكراً لك!"

**2. إضافة أعضاء (Add Users to Group)**
- Bulk add extracted members to your group
- Automatically handles errors and retries

**3. الانضمام للجروبات (Join Groups)**
- Automatically join multiple groups
- Useful for community building

**4. مغادرة الجروبات (Leave Groups)**
- Bulk leave from multiple groups
- Helps clean up account activity

**5. تعزيز التفاعل (Boost Engagement)**
- Increase post views and reactions
- Enhance content visibility

### 4.2. Configuration

**Message Template**:
- Write your message with personalization variables
- Available variables: {firstName}, {lastName}, {username}
- Example: "Hi {firstName}, check this out!"

**Delay Between Actions**:
- Set in milliseconds (1000 = 1 second)
- Recommended: 1000-3000ms to avoid detection
- Longer delays = safer but slower

**Auto-Repeat (24/7)**:
- Enable to run operations continuously
- Disable for one-time operations

**Account Selection**:
- Choose which accounts to use for the operation
- Distributes load across multiple accounts

### 4.3. Running an Operation

1. Select operation type
2. Configure settings (message, delay, etc.)
3. Tap **ابدأ العملية (Start Operation)**
4. Monitor progress with the progress bar
5. View results: success count, failed count, success rate

### 4.4. Safety Features

- **Pause/Resume**: Pause operation at any time
- **Cancel**: Stop operation completely
- **Error Handling**: Automatically retries failed actions
- **Rate Limiting**: Prevents account bans through intelligent delays

---

## 5. Statistics & Analytics

Monitor your performance and account health with detailed analytics.

### 5.1. Time Periods

Select the time range for your analytics:
- **اليوم (Today)**: Current day statistics
- **هذا الأسبوع (This Week)**: Last 7 days
- **هذا الشهر (This Month)**: Last 30 days

### 5.2. Key Metrics

**Messages Sent**: Total messages sent with trend indicator
**Failed Messages**: Messages that failed to send
**Members Extracted**: Total members extracted
**Groups Joined**: Total groups joined

Trend indicators show percentage change (↑ increase, ↓ decrease)

### 5.3. Performance Indicators

**معدل النجاح (Success Rate)**
- Percentage of successful operations
- Higher is better (target: >95%)

**استخدام الحد اليومي (Daily Limit Usage)**
- How much of your daily limit you've used
- Prevents exceeding Telegram's limits

**صحة الحسابات (Account Health)**
- Number of healthy accounts vs. total
- Restricted accounts reduce this score

### 5.4. Activity Timeline

Chronological list of all your recent actions:
- Time of action
- Action description
- Status (success/error)

### 5.5. Exporting Reports

Tap **📊 تصدير التقرير (Export Report)** to download:
- PDF report with charts and statistics
- Excel file with detailed data
- Useful for documentation and analysis

---

## 6. Settings & Configuration

Customize the app to match your needs and security requirements.

### 6.1. Security & Protection

**حماية من الحظر (Anti-Ban Protection)**
- Toggle ON/OFF to enable/disable anti-ban system
- Recommended: Always ON

**تدوير البروكسيات (Proxy Rotation)**
- Enable to use multiple IP addresses
- Prevents IP-based bans
- Requires proxy configuration

**مستوى تحديد السرعة (Rate Limiting Level)**
- **منخفض (Low)**: Slow, very safe (1-2 actions/minute)
- **متوسط (Medium)**: Balanced, safe (5-10 actions/minute)
- **عالي (High)**: Fast, riskier (20+ actions/minute)

### 6.2. Appearance

**الوضع الليلي (Dark Mode)**
- Toggle between light and dark themes
- Reduces eye strain in low light

**اللغة (Language)**
- Currently: العربية (Arabic)
- English support coming soon

**حجم الخط (Font Size)**
- S (Small), M (Medium), L (Large)
- Adjust for readability

### 6.3. Performance

**التأخير الافتراضي (Default Delay)**
- Default delay between operations (in milliseconds)
- Can be overridden per operation

**حجم الدفعة (Batch Size)**
- Number of items processed per batch
- Larger batches = faster but more resource-intensive

**إعدادات الذاكرة المؤقتة (Cache Settings)**
- Clear cache to free up storage
- Useful if app is running slowly

### 6.4. About

View app information:
- App version
- Build number
- Last update date
- License information

### 6.5. Danger Zone

⚠️ **Warning**: These actions cannot be undone!

**مسح الذاكرة المؤقتة (Clear Cache)**
- Removes temporary files
- Frees up storage space

**تسجيل الخروج (Logout)**
- Logs you out of the app
- Requires re-authentication

**حذف جميع البيانات (Delete All Data)**
- Permanently deletes all app data
- Cannot be recovered

---

## 7. Best Practices & Safety

### 7.1. Avoiding Account Bans

1. **Use Realistic Delays**: Minimum 1000ms between actions
2. **Vary Your Behavior**: Don't repeat the same actions exactly
3. **Use Multiple Accounts**: Distribute operations across accounts
4. **Monitor Account Health**: Check warming levels regularly
5. **Use Proxies**: Rotate IP addresses for safety
6. **Respect Limits**: Don't exceed daily message limits

### 7.2. Data Privacy

1. **Phone Numbers**: Always masked in the UI
2. **Session Strings**: Encrypted before storage
3. **Credentials**: Never shared or logged
4. **Backups**: Keep backups of important data

### 7.3. Ethical Usage

1. **Respect Users**: Don't spam or harass
2. **Follow Terms**: Comply with Telegram's terms of service
3. **Transparency**: Be clear about automated messages
4. **Consent**: Only message users who have opted in

---

## 8. Troubleshooting

### Problem: Account shows "Restricted"

**Solution**:
- Reduce activity level
- Use longer delays between actions
- Switch to a different account
- Enable proxy rotation
- Wait 24-48 hours before using again

### Problem: Extraction is very slow

**Solution**:
- Check internet connection
- Try extracting from a smaller group
- Reduce batch size in settings
- Use a faster proxy

### Problem: Messages are failing

**Solution**:
- Check account has enough daily limit
- Verify recipient user IDs are correct
- Increase delay between messages
- Try with a different account

### Problem: App crashes on startup

**Solution**:
- Clear app cache in settings
- Restart the app
- Reinstall if problem persists
- Check for app updates

---

## 9. Keyboard Shortcuts (Web Version)

- **Tab**: Navigate between fields
- **Enter**: Submit form or confirm action
- **Esc**: Close modals or dialogs
- **Ctrl+S**: Save settings

---

## 10. Support & Feedback

If you encounter issues or have suggestions:

1. **Check This Guide**: Most issues are covered here
2. **Check Settings**: Verify your configuration
3. **Restart App**: Often resolves temporary issues
4. **Contact Support**: Reach out to our support team

---

## 11. FAQ

**Q: Is this app legal?**
A: The app itself is legal. However, usage must comply with Telegram's terms of service. Automated messaging and member extraction may violate terms depending on usage.

**Q: Will my account get banned?**
A: The anti-ban system significantly reduces ban risk, but no system is 100% safe. Always use realistic delays and monitor account health.

**Q: Can I use this on multiple devices?**
A: Yes, but be careful not to use the same account simultaneously on multiple devices, as this may trigger restrictions.

**Q: How often should I check account health?**
A: Check daily, especially for new accounts. Monitor warming levels and activity status.

**Q: Can I export my data?**
A: Yes, extraction results and analytics can be exported as CSV, Excel, or JSON.

**Q: Is my data secure?**
A: Yes, sensitive data is encrypted and never logged. Session strings are encrypted before storage.

---

## 12. Glossary

- **Account Warming**: Process of building reputation for new accounts
- **Anti-Ban System**: Protection mechanism to prevent account restrictions
- **Batch Size**: Number of items processed together
- **Daily Limit**: Maximum messages allowed per account per day
- **Extraction**: Process of collecting member data from groups
- **FloodWait**: Telegram's rate limit error requiring waiting
- **Proxy**: Intermediary server for IP rotation
- **Rate Limiting**: Controlling action frequency to prevent bans
- **Session String**: Authentication token for Telegram account
- **Warming Level**: Account reputation percentage (0-100%)

---

## Conclusion

Dragon Telegram Pro Mobile is a powerful tool for Telegram automation. Use it responsibly, follow best practices, and always respect Telegram's terms of service. For questions or support, contact our support team.
