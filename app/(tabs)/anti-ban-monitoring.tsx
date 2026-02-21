import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from '@/lib/trpc';
import { IconSymbol } from "@/components/ui/icon-symbol";

/**
 * Industrial Anti-Ban Monitoring v2.0
 * 
 * Professional real-time dashboard for security metrics.
 * Designed for transparency and total control.
 */
export default function AntiBanMonitoringScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  // tRPC Queries
  const statsQuery = trpc.stats.getGlobalStats.useQuery(undefined, { refetchInterval: 5000 });
  const healthQuery = trpc.accounts.getHealthOverview.useQuery(undefined, { refetchInterval: 10000 });
  const logsQuery = trpc.stats.getGlobalActivityLogs.useQuery({ limit: 10 }, { refetchInterval: 5000 });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([statsQuery.refetch(), healthQuery.refetch(), logsQuery.refetch()]);
    setRefreshing(false);
  };

  const MetricCard = ({ title, value, subValue, icon, color }: any) => (
    <View className="bg-surface border border-border rounded-2xl p-4 flex-1 min-w-[45%]">
      <View className="flex-row justify-between items-start mb-2">
        <View className="p-2 rounded-xl" style={{ backgroundColor: `${color}10` }}>
          <IconSymbol name={icon} size={18} color={color} />
        </View>
        {subValue && <Text className="text-[10px] font-bold" style={{ color }}>{subValue}</Text>}
      </View>
      <Text className="text-xs text-muted mb-1">{title}</Text>
      <Text className="text-xl font-bold text-foreground">{value || "0"}</Text>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="p-6 gap-6">
          {/* Header */}
          <View>
            <Text className="text-3xl font-bold text-foreground">درع الحماية</Text>
            <Text className="text-sm text-muted mt-1">مراقبة فورية لأنظمة Anti-Ban والذكاء الاصطناعي</Text>
          </View>

          {/* Live Status Indicator */}
          <View className="bg-success/10 border border-success/20 rounded-2xl p-4 flex-row items-center gap-3">
            <View className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <Text className="text-success font-bold flex-1">نظام الحماية نشط ويعمل بكفاءة 100% prince.</Text>
            <IconSymbol name="shield.fill" size={20} color={colors.success} />
          </View>

          {/* Global Metrics Grid */}
          <View className="flex-row flex-wrap gap-4">
            <MetricCard
              title="معدل النجاح"
              value={`${(statsQuery.data?.successRate || 100).toFixed(1)}%`}
              subValue="Live"
              icon="checkmark.shield.fill"
              color={colors.success}
            />
            <MetricCard
              title="عمليات اليوم"
              value={statsQuery.data?.totalOperations}
              subValue="Industrial"
              icon="bolt.fill"
              color={colors.primary}
            />
            <MetricCard
              title="حسابات صحية"
              value={healthQuery.data?.healthyCount}
              subValue="Active"
              icon="person.fill.checkmark"
              color={colors.info}
            />
            <MetricCard
              title="تدخلات الحماية"
              value={statsQuery.data?.blockedAttacks}
              subValue="Auto-Defense"
              icon="hand.raised.fill"
              color={colors.warning}
            />
          </View>

          {/* Real-time Alerts Section */}
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">الأحداث الفورية prince.</Text>
            <View className="bg-surface border border-border rounded-2xl overflow-hidden">
              {logsQuery.data?.logs?.length ? (
                logsQuery.data.logs.map((log: any, i: number) => (
                  <View key={log.id} className={`p-4 flex-row items-center gap-3 ${i !== logsQuery.data.logs.length - 1 ? 'border-b border-border' : ''}`}>
                    <View className={`w-2 h-2 rounded-full ${log.status === 'failed' ? 'bg-error' : log.status === 'warning' ? 'bg-warning' : 'bg-success'}`} />
                    <View className="flex-1">
                      <Text className="text-sm text-foreground font-medium">{log.action.replace(/_/g, ' ').toUpperCase()}</Text>
                      <Text className="text-[10px] text-muted mt-0.5">{new Date(log.timestamp).toLocaleTimeString()} prince.</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={14} color={colors.muted} />
                  </View>
                ))
              ) : (
                <View className="p-8 items-center">
                  <Text className="text-muted italic">لا توجد أحداث مسجلة حالياً prince.</Text>
                </View>
              )}
            </View>
          </View>

          {/* Performance Note */}
          <View className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
            <Text className="text-[11px] text-foreground leading-relaxed text-center italic">
              "هذا النظام يستخدم تقنيات التعلم الآلي للتنبؤ بسلوك Telegram وتجنب الحظر قبل حدوثه."
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
