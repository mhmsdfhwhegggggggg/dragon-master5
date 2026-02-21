import { ScrollView, View, Text, Pressable, Switch, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Auth from "@/lib/_core/auth";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlassCard } from "@/components/ui/glass-card";
import { FalconLogo } from "@/components/ui/falcon-logo";


/**
 * Settings Screen - Control Center Edition
 * 
 * Centralized configuration for Anti-Ban, Proxy, and UI preferences.
 * Designed for ease of use and professional control.
 */
const trpcAny = trpc as any;

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [antiBanEnabled, setAntiBanEnabled] = useState(true);
  const [proxyRotation, setProxyRotation] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [rateLimitLevel, setRateLimitLevel] = useState("medium");

  const logoutMutation = (trpcAny.auth.logout.useMutation() as any);
  const licenseQuery = (trpcAny.security.checkLicense.useQuery() as any);
  const licenseData = licenseQuery.data;

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج من التطبيق؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "تسجيل الخروج",
        style: "destructive",
        onPress: () => logoutMutation.mutate(undefined, {
          onSuccess: async () => {
            await Auth.clearSession();
            router.replace("/(auth)/login");
          },
          onError: (error: any) => {
            Alert.alert("خطأ", error.message || "فشل تسجيل الخروج");
          }
        }),
      },
    ]);
  };

  const SettingSection = ({ title, icon, children }: any) => (
    <View className="gap-3 mb-6">
      <View className="flex-row items-center gap-2 px-1">
        <IconSymbol name={icon} size={18} color={colors.primary} />
        <Text className="text-sm font-extrabold text-foreground uppercase tracking-widest">{title}</Text>
      </View>
      <GlassCard className="bg-surface/50 border-white/5 p-0 overflow-hidden">
        {children}
      </GlassCard>
    </View>
  );

  const SettingItem = ({ label, description, icon, children, isLast, onPress }: any) => (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      className={`flex-row items-center justify-between p-5 ${!isLast ? 'border-b border-white/5' : ''}`}
    >
      <View className="flex-row items-center gap-4 flex-1">
        {icon && (
          <View className="w-10 h-10 rounded-xl bg-background/50 items-center justify-center">
            <IconSymbol name={icon} size={20} color={colors.primary} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">{label}</Text>
          {description && <Text className="text-xs text-muted mt-1 font-medium">{description}</Text>}
        </View>
      </View>
      {children}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="bg-background" showHeader={false}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="p-6 gap-2">
          {/* Header */}
          <View className="mb-8 mt-4">
            <Text className="text-4xl font-black text-foreground tracking-tight">الإعدادات</Text>
            <Text className="text-sm text-muted mt-2 font-medium">تحكم في أداء وأمان نظام FALCON Pro</Text>
          </View>

          {/* Security & Protection */}
          <SettingSection title="الأمان والحماية" icon="shield">
            <SettingItem
              label="نظام Anti-Ban"
              description="حماية ذكية تمنع حظر الحسابات"
              icon="lock"
            >
              <Switch value={antiBanEnabled} onValueChange={setAntiBanEnabled} trackColor={{ true: colors.primary }} />
            </SettingItem>

            <SettingItem
              label="تدوير البروكسي"
              description="تبديل تلقائي للبروكسيات عند الفشل"
              icon="globe"
            >
              <Switch value={proxyRotation} onValueChange={setProxyRotation} trackColor={{ true: colors.primary }} />
            </SettingItem>

            <View className="p-5 border-t border-white/5">
              <Text className="text-sm font-bold text-foreground mb-4">مستوى ضغط العمليات</Text>
              <View className="flex-row gap-3">
                {[
                  { id: "low", label: "آمن جداً" },
                  { id: "medium", label: "متوازن" },
                  { id: "high", label: "أقصى سرعة" }
                ].map((level: any) => (
                  <TouchableOpacity
                    key={level.id}
                    onPress={() => setRateLimitLevel(level.id)}
                    className={`flex-1 py-4 rounded-2xl border items-center ${rateLimitLevel === level.id ? 'bg-primary border-primary' : 'bg-background/30 border-white/5'}`}
                  >
                    <Text className={`text-xs font-black ${rateLimitLevel === level.id ? 'text-white' : 'text-muted'}`}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </SettingSection>

          {/* Appearance & UI */}
          <SettingSection title="المظهر والواجهة" icon="photo">
            <SettingItem
              label="الوضع الليلي"
              description="تغيير مظهر التطبيق للوضع الداكن"
              icon="eye"
            >
              <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: colors.primary }} />
            </SettingItem>

            <SettingItem
              label="لغة التطبيق"
              description="العربية (AR)"
              icon="public"
              isLast
            >
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </SettingItem>
          </SettingSection>

          {/* Version Info */}
          <View className="items-center py-10">
            <FalconLogo size={40} animated={false} />
            <Text className="text-xs text-muted mt-4 font-bold">FALCON Pro v1.5.0 Premium Edition</Text>
            <Text className="text-[10px] text-muted mt-1 font-medium">© 2026 FALCON Pro Systems. All rights reserved.</Text>
          </View>

          {/* Danger Zone */}
          <TouchableOpacity
            onPress={handleLogout}
            disabled={logoutMutation.isPending}
            className="bg-error/10 border border-error/20 rounded-3xl p-5 flex-row items-center justify-center gap-3 active:opacity-70 mb-12"
          >
            {logoutMutation.isPending ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <IconSymbol name="xmark.circle" size={20} color={colors.error} />
            )}
            <Text className="text-error font-black text-lg">تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
