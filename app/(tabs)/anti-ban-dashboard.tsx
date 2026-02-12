import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { LineChart, LineChartData } from 'react-native-chart-kit';

/**
 * Anti-Ban Dashboard Screen
 * 
 * Provides comprehensive monitoring and control interface for Anti-Ban system
 * Features:
 * - Real-time metrics
 * - Account health monitoring
 * - Performance analytics
 * - Alert management
 * - System controls
 */
export default function AntiBanDashboardScreen() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'accounts' | 'analytics' | 'alerts'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // tRPC queries
  const { data: systemStats, isLoading: systemLoading, refetch: refetchSystem } = trpc.antiBan.getSystemStatistics.useQuery();
  const { data: healthData, refetch: refetchHealth } = trpc.antiBan.getAccountStatus.useQuery({ accountId: 123 }); // Example account
  const { data: configData } = trpc.antiBan.getConfiguration.useQuery();

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchSystem(),
        refetchHealth(),
      ]);
    } catch (error) {
      Alert.alert('خطأ', 'فشل تحديث البيانات');
    } finally {
      setRefreshing(false);
    }
  };

  // Tab components
  const OverviewTab = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>نظرة عامة</Text>
      
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>📊 إحصائيات النظام</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{systemStats?.totalAccounts || 0}</Text>
            <Text style={styles.statLabel}>إجمالي الحسابات</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{systemStats?.healthyAccounts || 0}</Text>
            <Text style={styles.statLabel}>حسابات صحية</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{systemStats?.averageSuccessRate ? (systemStats.averageSuccessRate * 100).toFixed(1) : 0}%</Text>
            <Text style={styles.statLabel}>معدل النجاح</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>🛡️ حالة الحماية</Text>
        <View style={styles.protectionStatus}>
          <Badge 
            label="نشط" 
            variant="success" 
            style={styles.badge}
          />
          <Text style={styles.protectionText}>نظام الحماية من الحظر يعمل بكامل طاقته</Text>
        </View>
        <View style={styles.features}>
          <Text style={styles.feature}>✅ الحماية متعددة الطبقات</Text>
          <Text style={styles.feature}>✅ التعلم الآلي المتقدم</Text>
          <Text style={styles.feature}>✅ المراقبة الفورية</Text>
          <Text style={styles.feature}>✅ التحليلات المتقدمة</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>📈 أداء النظام</Text>
        <View style={styles.performanceMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>متوسط وقت الاستجابة</Text>
            <Text style={styles.metricValue}>{systemStats?.averageDelay || 0}ms</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>معدل المخاطر</Text>
            <Text style={styles.metricValue}>{systemStats?.averageRiskScore?.toFixed(1) || 0}/100</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>الحمل النظامي</Text>
            <Text style={styles.metricValue}>{systemStats?.systemLoad ? (systemStats.systemLoad * 100).toFixed(1) : 0}%</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  const AccountsTab = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>مراقبة الحسابات</Text>
      
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>📊 صحة الحساب</Text>
        <View style={styles.accountHealth}>
          <View style={styles.healthScore}>
            <Text style={styles.healthScoreNumber}>{healthData?.healthScore || 0}</Text>
            <Text style={styles.healthScoreLabel}>درجة الصحة</Text>
          </View>
          <View style={styles.healthStatus}>
            <Badge 
              label={healthData?.status?.healthLevel || 'unknown'} 
              variant={healthData?.status?.healthLevel === 'excellent' ? 'success' : 
                     healthData?.status?.healthLevel === 'good' ? 'warning' : 'danger'}
              style={styles.badge}
            />
            <Text style={styles.healthStatusText}>
              {healthData?.status?.healthLevel === 'excellent' ? 'ممتاز' :
               healthData?.status?.healthLevel === 'good' ? 'جيد' :
               healthData?.status?.healthLevel === 'fair' ? 'متوسط' : 'ضعيف'}
            </Text>
          </View>
        </View>
        
        <View style={styles.healthMetrics}>
          <Text style={styles.metric}>
            <Text style={styles.metricLabel}>العمليات الإجمالية:</Text>
            <Text style={styles.metricValue}>{healthData?.status?.totalOperations || 0}</Text>
          </Text>
          <Text style={styles.metric}>
            <Text style={styles.metricLabel}>معدل النجاح:</Text>
            <Text style={styles.metricValue}>{healthData?.status?.successRate ? (healthData.status.successRate * 100).toFixed(1) : 0}%</Text>
          </Text>
          <Text style={styles.metric}>
            <Text style={styles.metricLabel}>الفشل المتتالي:</Text>
            <Text style={styles.metricValue}>{healthData?.status?.consecutiveFailures || 0}</Text>
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>⏱️ إحصائيات التأخير</Text>
        <View style={styles.delayStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{healthData?.delayStatistics?.averageDelay || 0}ms</Text>
            <Text style={styles.statLabel}>متوسط التأخير</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{healthData?.delayStatistics?.consistencyScore ? (healthData.delayStatistics.consistencyScore * 100).toFixed(1) : 0}%</Text>
            <Text style={styles.statLabel}>معدل الانتظام</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{healthData?.delayStatistics?.averageSuccessRate ? (healthData.delayStatistics.averageSuccessRate * 100).toFixed(1) : 0}%</Text>
            <Text style={styles.statLabel}>معدل النجاح</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>🌐 إحصائيات البروكسي</Text>
        <View style={styles.proxyStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{healthData?.proxyStatistics?.totalProxies || 0}</Text>
            <Text style={styles.statLabel}>إجمالي البروكسي</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{healthData?.proxyStatistics?.healthyProxies || 0}</Text>
            <Text style={styles.statLabel}>بروكسي صحية</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{healthData?.proxyStatistics?.healthPercentage ? healthData.proxyStatistics.healthPercentage.toFixed(1) : 0}%</Text>
            <Text style={styles.statLabel}>نسبة الصحة</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  const AnalyticsTab = () => {
    // Sample chart data
    const chartData: LineChartData = {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      datasets: [
        {
          data: [85, 88, 82, 90, 87, 91],
          color: 'rgb(75, 192, 192)',
          strokeWidth: 2,
        },
        {
          data: [1200, 1100, 1300, 1050, 1150, 1000],
          color: 'rgb(255, 99, 132)',
          strokeWidth: 2,
        },
      ],
    };

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>التحليلات المتقدمة</Text>
        
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>📈 أداء العمليات</Text>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>معدل النجاح (%)</Text>
            <LineChart
              data={chartData}
              width={320}
              height={200}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
                strokeWidth: 2,
              }}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🧠 أنماط التعلم الآلي</Text>
          <View style={styles.patterns}>
            <View style={styles.pattern}>
              <Text style={styles.patternTitle}>التعرف على الأنماط</Text>
              <Text style={styles.patternDesc}>اكتشاف 95% من الأنماط غير الطبيعية</Text>
            </View>
            <View style={styles.pattern}>
              <Text style={styles.patternTitle}>التنبؤ بالأداء</Text>
              <Text style={styles.patternDesc}>دقة تنبؤ 92%</Text>
            </View>
            <View style={styles.pattern}>
              <Text style={styles.patternTitle}>التحسين التلقائي</Text>
              <Text style={styles.patternDesc}>تحسين 40% من الأداء تلقائياً</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>📊 إحصائيات التعلم</Text>
          <View style={styles.mlStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1,250</Text>
              <Text style={styles.statLabel}>عملية تم تدريبها</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>15</Text>
              <Text style={styles.statLabel}>نموذج مدرب</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>92%</Text>
              <Text style={styles.statLabel}>دقة التنبؤ</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    );
  };

  const AlertsTab = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>التنبيهات والتحذيرات</Text>
      
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>🚨 التنبيهات النشطة</Text>
        <View style={styles.alertsList}>
          <View style={styles.alertItem}>
            <Badge label="حرج" variant="danger" style={styles.badge} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>ارتفاع معدل الخطأ</Text>
              <Text style={styles.alertDesc}>الحساب 123 - معدل الخطأ 35% (أعلى من الحد الآمن)</Text>
              <Text style={styles.alertTime}>منذ 5 دقائق</Text>
            </View>
          </View>
          
          <View style={styles.alertItem}>
            <Badge label="تحذير" variant="warning" style={styles.badge} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>بطء استجابة البروكسي</Text>
              <Text style={styles.alertDesc}>متوسط وقت استجابة البروكسي 4.5 ثانية</Text>
              <Text style={styles.alertTime}>منذ 15 دقيقة</Text>
            </View>
          </View>
          
          <View style={styles.alertItem}>
            <Badge label="معلومات" variant="info" style={styles.badge} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>تحديث النموذج</Text>
              <Text style={styles.alertDesc}>تم تحديث نموذج التعلم الآلي بنجاح</Text>
              <Text style={styles.alertTime}>منذ 1 ساعة</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ إعدادات التنبيهات</Text>
        <View style={styles.alertSettings}>
          <View style={styles.setting}>
            <Text style={styles.settingLabel}>التنبيهات الحرجة</Text>
            <TouchableOpacity style={styles.settingToggle}>
              <Text style={styles.settingValue}>مفعلة</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.setting}>
            <Text style={styles.settingLabel}>التنبيهات التحذير</Text>
            <TouchableOpacity style={styles.settingToggle}>
              <Text style={styles.settingValue}>مفعلة</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.setting}>
            <Text style={styles.settingLabel}>التنبيهات المعلومات</Text>
            <TouchableOpacity style={styles.settingToggle}>
              <Text style={styles.settingValue}>مفعلة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  const renderTab = () => {
    switch (selectedTab) {
      case 'overview':
        return <OverviewTab />;
      case 'accounts':
        return <AccountsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'alerts':
        return <AlertsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ لوحة تحكم الحماية من الحظر</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={refreshData}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>
            {refreshing ? 'جاري التحديث...' : 'تحديث'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {['overview', 'accounts', 'analytics', 'alerts'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab as any)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab && styles.activeTabText
            ]}>
              {tab === 'overview' ? 'نظرة عامة' :
               tab === 'accounts' ? 'الحسابات' :
               tab === 'analytics' ? 'التحليلات' : 'التنبيهات'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  protectionStatus: {
    alignItems: 'center',
    marginBottom: 16,
  },
  protectionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  feature: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    margin: 4,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  badge: {
    marginBottom: 8,
  },
  performanceMetrics: {
    gap: 12,
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  accountHealth: {
    gap: 16,
  },
  healthScore: {
    alignItems: 'center',
    marginBottom: 16,
  },
  healthScoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  healthScoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  healthStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  healthMetrics: {
    gap: 8,
  },
  delayStats: {
    gap: 8,
  },
  proxyStats: {
    gap: 8,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  chartTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  patterns: {
    gap: 12,
  },
  pattern: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  patternTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  patternDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  mlStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  alertsList: {
    gap: 12,
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 10,
    color: '#9ca3af',
  },
  alertSettings: {
    gap: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingToggle: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  settingValue: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
  },
});
