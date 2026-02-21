import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { Metrics } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: any = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: any = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * RootLayoutContent - Contains business logic and navigation.
 * Needs to be inside RootLayout's Providers to access tRPC hooks.
 */
function RootLayoutContent({ onLayout }: { onLayout: () => void }) {
  const { data: licenseData, isLoading: isLicenseLoading, isError: isLicenseError } = trpc.license.getUserLicenses.useQuery({}, {
    enabled: true,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const router = require("expo-router").useRouter();
  const segments = require("expo-router").useSegments();

  // Handle license requirement and splash screen hiding
  useEffect(() => {
    if (isLicenseLoading) return;

    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) { }
    };
    hideSplash();

    const hasActiveLicense = licenseData?.success && licenseData?.licenses?.some((l: any) => l.status === 'active');
    const inTabs = segments[segments.length - 2] === '(tabs)';
    const isActivationScreen = segments[segments.length - 1] === 'activation-screen';

    if (!hasActiveLicense && inTabs && !isActivationScreen) {
      router.replace('/activation-screen');
    }
  }, [licenseData, isLicenseLoading, isLicenseError, segments, router]);

  return (
    <>
      <Stack
        screenOptions={{ headerShown: false }}
        onLayout={onLayout}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="oauth/callback" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

/**
 * RootLayout - Bootstraps all Providers.
 * Does NOT contain hooks that depend on those providers.
 */
export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<any>(initialInsets);
  const [frame, setFrame] = useState<any>(initialFrame);

  // Initialize Manus runtime
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Providers setup
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  // Safety Timeout to ensure splash screen hides even if everything fails
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => { });
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  const onLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RootLayoutContent onLayout={onLayout} />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        {content}
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
