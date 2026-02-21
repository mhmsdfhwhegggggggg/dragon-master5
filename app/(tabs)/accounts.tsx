import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlassCard } from "@/components/ui/glass-card";
import { trpc } from "@/lib/trpc";


/**
 * Accounts Screen - Smart Management Edition
 * 
 * Features:
 * - Real-time account health monitoring
 * - Smart Unban system
 * - Automatic warming progress
 * - Duplicate removal
 * - Bulk account onboarding
 */
const trpcAny = trpc as any;

export default function AccountsScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch accounts from API
  const { data: accounts, isLoading, refetch } = (trpcAny.accounts.getAll.useQuery() as any);
  const deleteAccountMutation = (trpcAny.accounts.delete.useMutation() as any);
  const unbanMutation = (trpcAny.accounts.unban.useMutation() as any);
  const removeDuplicatesMutation = (trpcAny.accounts.removeDuplicates.useMutation() as any);
  const warmAllMutation = (trpcAny.accounts.warmAll.useMutation() as any);
  const router = require("expo-router").useRouter();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAddAccount = () => {
    router.push("/onboarding");
  };

  const handleSmartUnban = (id: number) => {
    Alert.alert(
      "فك الحظر الذكي",
      "هل تريد بدء عملية فك الحظر الذكية لهذا الحساب؟ سيقوم النظام بإرسال طلبات رسمية ومتابعتها.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "بدء الآن",
          onPress: () => unbanMutation.mutate({ id }, {
            onSuccess: () => Alert.alert("تم البدء", "بدأت عملية فك الحظر في السيرفر."),
            onError: (err: any) => Alert.alert("خطأ", err.message || "فشل بدء العملية.")
          })
        }
      ]
    );
  };

  const handleRemoveDuplicates = () => {
    Alert.alert(
      "إزالة التكرار",
      "سيقوم النظام بفحص جميع الحسابات وإزالة المكرر منها لضمان نظافة البيانات.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تنظيف الآن",
          onPress: () => removeDuplicatesMutation.mutate(undefined, {
            onSuccess: (res: any) => {
              Alert.alert("تم", `تمت إزالة ${res.removedCount} حسابات مكررة.`);
              refetch();
            },
            onError: (err: any) => Alert.alert("خطأ", err.message || "فشل التنظيف.")
          })
        }
      ]
    );
  };

  const handleWarmAll = () => {
    Alert.alert(
      "تسخين الحسابات",
      "هل تريد بدء جلسة تسخين شاملة لجميع الحسابات النشطة لرفع مستوى الثقة؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تسخين الآن",
          onPress: () => warmAllMutation.mutate(undefined, {
            onSuccess: () => Alert.alert("تم", "بدأت عملية تسخين الحسابات في الخلفية."),
            onError: (err: any) => Alert.alert("خطأ", err.message || "فشل بدء التسخين.")
          })
        }
      ]
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="flex-1 mt-4">
            <Text className="text-4xl font-black text-foreground tracking-tight">
              الحسابات
            </Text>
            <Text className="text-sm text-muted mt-2 font-medium">
              إدارة أسطول حسابات FALCON Premium
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleAddAccount}
            className="bg-primary w-12 h-12 rounded-2xl items-center justify-center shadow-sm active:opacity-70"
          >
            <IconSymbol name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Smart Tools */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleRemoveDuplicates}
            className="flex-1"
          >
            <GlassCard className="items-center gap-2 bg-error/5 border-error/10">
              <IconSymbol name="trash" size={20} color={colors.error} />
              <Text className="text-xs font-bold text-foreground">إزالة التكرار</Text>
            </GlassCard>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleWarmAll}
            className="flex-1"
          >
            <GlassCard className="items-center gap-2 bg-warning/5 border-warning/10">
              <IconSymbol name="gear" size={20} color={colors.warning} />
              <Text className="text-xs font-bold text-foreground">تسخين الكل</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Accounts List */}
        <View className="gap-4">
          <Text className="text-lg font-bold text-foreground">قائمة الحسابات</Text>

          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : accounts && accounts.length > 0 ? (
            accounts.map((account: any) => (
              <GlassCard
                key={account.id}
                className="p-4 bg-surface/50 border-white/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    {/* Phone and Status */}
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-lg font-bold text-foreground">
                        {account.phoneNumber}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-lg ${account.isActive ? "bg-success/10" : "bg-error/10"}`}>
                        <Text className={`text-[10px] font-bold ${account.isActive ? "text-success" : "text-error"}`}>
                          {account.isActive ? "نشط" : "مقيد"}
                        </Text>
                      </View>
                    </View>

                    {/* Name/Username */}
                    <Text className="text-sm text-muted">
                      {account.firstName ? `${account.firstName} ${account.lastName || ""}` : "بدون اسم"}
                      {account.username ? ` (@${account.username})` : ""}
                    </Text>

                    {/* Warming Progress */}
                    <View className="mt-4 gap-1">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-[10px] text-muted">مستوى التسخين</Text>
                        <Text className="text-[10px] font-bold text-primary">{account.warmingLevel}%</Text>
                      </View>
                      <View className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-primary"
                          style={{ width: `${account.warmingLevel}%` }}
                        />
                      </View>
                    </View>

                    {/* Stats Row */}
                    <View className="flex-row items-center gap-4 mt-4">
                      <View>
                        <Text className="text-[10px] text-muted font-bold">رسائل اليوم</Text>
                        <Text className="text-sm font-black text-foreground">{account.messagesSentToday}/{account.dailyLimit}</Text>
                      </View>
                      <View className="w-[1px] h-6 bg-border/50" />
                      <View>
                        <Text className="text-[10px] text-muted font-bold">آخر نشاط</Text>
                        <Text className="text-sm font-black text-foreground">نشط الآن</Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="gap-2">
                    <TouchableOpacity
                      onPress={() => deleteAccountMutation.mutate({ id: account.id }, {
                        onSuccess: () => {
                          refetch();
                          Alert.alert("تم", "تم حذف الحساب بنجاح.");
                        },
                        onError: (err: any) => {
                          Alert.alert("خطأ", err.message || "فشل حذف الحساب.")
                        }
                      })}
                      className="w-10 h-10 rounded-xl bg-error/10 items-center justify-center border border-error/20"
                    >
                      <IconSymbol name="trash" size={18} color={colors.error} />
                    </TouchableOpacity>

                    {!account.isActive && (
                      <TouchableOpacity
                        onPress={() => handleSmartUnban(account.id)}
                        className="w-10 h-10 rounded-xl bg-warning/10 items-center justify-center border border-warning/20"
                      >
                        <IconSymbol name="info.circle" size={18} color={colors.warning} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </GlassCard>
            ))
          ) : (
            <GlassCard className="py-12 items-center bg-surface/30 border-dashed border-white/10">
              <IconSymbol name="person" size={48} color={colors.muted} />
              <Text className="text-muted mt-4 font-bold">لا توجد حسابات مضافة</Text>
              <TouchableOpacity onPress={handleAddAccount} className="mt-2">
                <Text className="text-primary font-extrabold text-lg">أضف حسابك الأول الآن</Text>
              </TouchableOpacity>
            </GlassCard>
          )}
        </View>

        {/* Smart Protection Card */}
        <GlassCard variant="neon" className="p-4 flex-row gap-4 items-center border-primary/20">
          <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="shield" size={24} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-primary">نظام الحماية الذكي</Text>
            <Text className="text-[11px] text-foreground leading-relaxed font-medium">
              يتم تدوير الحسابات تلقائياً وتوزيع الحمل لضمان عدم تعرض أي حساب للحظر الدائم.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </ScreenContainer >
  );
}
