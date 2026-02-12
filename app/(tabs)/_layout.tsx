import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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
        name="extraction"
        options={{
          title: "الاستخراج",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="arrow.down.doc.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="extract-and-add"
        options={{
          title: "استخراج+إضافة",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="arrow.up.arrow.down" color={color} />,
        }}
      />

      <Tabs.Screen
        name="bulk-ops"
        options={{
          title: "عمليات",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.stack.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="proxies"
        options={{
          title: "البروكسي",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="network" color={color} />,
        }}
      />

      <Tabs.Screen
        name="onboarding"
        options={{
          title: "Onboarding",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.badge.plus" color={color} />,
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

      <Tabs.Screen
        name="developer-dashboard"
        options={{
          title: "لوحة المطور",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="lock.shield.fill" color={color} />,
        }}
      />

      {/* Hidden screens */}
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
