import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { FalconLogo } from "@/components/ui/falcon-logo";
import { GlassCard } from "@/components/ui/glass-card";

const trpcAny = trpc as any;

/**
 * Home Screen - FALCON Premium Dashboard
 * 
 * Central hub for system intelligence and performance monitoring.
 */
export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard stats from API
  const { data: statsData, isLoading, refetch: refetchStats } = trpcAny.dashboard.getStats.useQuery(undefined);
  const { data: activitiesData, refetch: refetchActivities } = trpcAny.dashboard.getRecentActivities.useQuery(undefined);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchActivities()]);
    setRefreshing(false);
  }, [refetchStats, refetchActivities]);

  const stats = statsData || {
    totalAccounts: 0,
    activeAccounts: 0,
    membersExtracted: 0,
    messagesToday: 0,
  };

  return (
    <ScreenContainer className="bg-background" showHeader={false}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6 gap-8">
          {/* Central Logo & Branding */}
          <View className="items-center justify-center mt-4">
            <FalconLogo size={120} animated={true} />
            <Text className="text-4xl font-extrabold text-foreground mt-4 tracking-tight">
              FALCON <Text style={{ color: colors.primary }}>PRO</Text>
            </Text>
            <Text className="text-sm text-muted font-medium mt-1">
              أتمتة ذكية | حماية متقدمة | أداء احترافي
            </Text>
          </View>

          {/* Quick Stats Grid */}
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">بيانات الأداء</Text>
              <View className="bg-success/20 px-3 py-1 rounded-full border border-success/30">
                <Text className="text-[10px] font-bold text-success uppercase">Live Status</Text>
              </View>
            </View>

            {isLoading ? (
              <View className="h-40 items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-4">
                <View className="w-[47%]">
                  <GlassCard className="p-4 bg-primary/5 border-primary/20">
                    <IconSymbol name="person.2.fill" size={20} color={colors.primary} />
                    <Text className="text-2xl font-black text-foreground mt-2">{stats.totalAccounts}</Text>
                    <Text className="text-[10px] font-bold text-muted uppercase mt-1">إجمالي الحسابات</Text>
                  </GlassCard>
                </View>

                <View className="w-[47%]">
                  <GlassCard className="p-4 bg-success/5 border-success/20">
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                    <Text className="text-2xl font-black text-success mt-2">{stats.activeAccounts}</Text>
                    <Text className="text-[10px] font-bold text-muted uppercase mt-1">الحسابات النشطة</Text>
                  </GlassCard>
                </View>

                <View className="w-[47%]">
                  <GlassCard className="p-4 bg-warning/5 border-warning/20">
                    <IconSymbol name="arrow.down.doc.fill" size={20} color={colors.warning} />
                    <Text className="text-2xl font-black text-foreground mt-2">
                      {stats.membersExtracted > 1000 ? `${(stats.membersExtracted / 1000).toFixed(1)}K` : stats.membersExtracted}
                    </Text>
                    <Text className="text-[10px] font-bold text-muted uppercase mt-1">الأعضاء المستخرجين</Text>
                  </GlassCard>
                </View>

                <View className="w-[47%]">
                  <GlassCard className="p-4 bg-error/5 border-error/20">
                    <IconSymbol name="paperplane.fill" size={20} color={colors.error} />
                    <Text className="text-2xl font-black text-foreground mt-2">{stats.messagesToday}</Text>
                    <Text className="text-[10px] font-bold text-muted uppercase mt-1">رسائل اليوم</Text>
                  </GlassCard>
                </View>
              </View>
            )}
          </View>

          {/* Core Controls Banner */}
          <TouchableOpacity onPress={() => router.push('/tools')}>
            <GlassCard className="p-6 bg-surface/50 border-white/5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center">
                  <IconSymbol name="square.grid.2x2.fill" size={24} color="white" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">مركز الأدوات</Text>
                  <Text className="text-xs text-muted">الوصول لجميع الوظائف المتقدمة</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </GlassCard>
          </TouchableOpacity>

          {/* Anti-Ban Status Module */}
          <GlassCard variant="neon" className="p-5 border-primary/30">
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <Text className="font-bold text-foreground">جهاز الحماية (Anti-Ban V2)</Text>
            </View>
            <Text className="text-xs text-muted leading-relaxed">
              يقوم نظام الصقر حالياً بتحليل السلوك البشري ومحاكاة عمليات النقر لضمان أقصى درجات الأمان لحساباتك.
              <Text className="text-success font-bold"> النطاق آمن.</Text>
            </Text>
          </GlassCard>

          {/* Recent Operations */}
          <View className="gap-4 pb-12">
            <Text className="text-lg font-bold text-foreground">آخر العمليات</Text>
            <View className="gap-3">
              {activitiesData && activitiesData.length > 0 ? (
                (activitiesData as any[]).map((activity: any, index: number) => (
                  <GlassCard key={index} className="p-4 bg-surface/30 border-white/5 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className={`w-2 h-8 rounded-full ${activity.status === 'success' ? 'bg-success' : 'bg-error'}`} />
                      <View>
                        <Text className="text-sm font-bold text-foreground uppercase tracking-wide">
                          {activity.action.replace(/_/g, ' ')}
                        </Text>
                        <Text className="text-[10px] text-muted font-medium mt-1">
                          {new Date(activity.time).toLocaleTimeString()}
                        </Text>
                      </View>
                    </View>
                    <IconSymbol
                      name={activity.status === 'success' ? "checkmark.circle" : "xmark.circle"}
                      size={20}
                      color={activity.status === 'success' ? colors.success : colors.error}
                    />
                  </GlassCard>
                ))
              ) : (
                <Text className="text-center text-muted italic py-4">لا توجد عمليات مسجلة حالياً</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
