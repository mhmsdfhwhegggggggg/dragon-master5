import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

import { useState, useEffect } from "react";
import { getUserInfo, type User } from "@/lib/_core/auth";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getUserInfo().then(setUser);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.email === 'admin@falcon.pro';

  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="accounts"
        options={{
          title: "الحسابات",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="tools"
        options={{
          title: "الأدوات",
          tabBarIcon: ({ color }) => <IconSymbol size={32} name="square.grid.2x2.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: "الإحصائيات",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "الإعدادات",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />

      {/* Hidden Screens (Accessible via Tools Hub) */}
      <Tabs.Screen name="extraction" options={{ href: null }} />
      <Tabs.Screen name="extract-and-add" options={{ href: null }} />
      <Tabs.Screen name="channel-management" options={{ href: null }} />
      <Tabs.Screen name="auto-reply" options={{ href: null }} />
      <Tabs.Screen name="content-cloner" options={{ href: null }} />
      <Tabs.Screen name="bulk-ops" options={{ href: null }} />
      <Tabs.Screen name="proxies" options={{ href: null }} />
      <Tabs.Screen
        name="developer-dashboard"
        options={{
          href: isAdmin ? "/developer-dashboard" : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="lock.shield.fill" color={color} />,
        }}
      />
      <Tabs.Screen name="onboarding" options={{ href: null }} />

      {/* System Screens */}
      <Tabs.Screen name="license-dashboard" options={{ href: null }} />
      <Tabs.Screen name="anti-ban-dashboard" options={{ href: null }} />
      <Tabs.Screen name="anti-ban-ml-dashboard" options={{ href: null }} />
      <Tabs.Screen name="anti-ban-monitoring" options={{ href: null }} />
      <Tabs.Screen name="activation-screen" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="scheduler" options={{ href: null }} />
      <Tabs.Screen name="setup" options={{ href: null }} />
    </Tabs>
  );
}
