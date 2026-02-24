import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlassCard } from "@/components/ui/glass-card";
import { FalconLogo } from "@/components/ui/falcon-logo";

export default function ToolsScreen() {
    const colors = useColors();
    const router = useRouter();

    const tools = [
        {
            id: 'extraction',
            name: 'استخراج الأعضاء',
            icon: 'arrow.down.doc.fill',
            description: 'سحب الأعضاء من المجموعات النشطة وتصدير البيانات.',
            route: '/(tabs)/extraction',
            color: '#3b82f6' // Blue
        },
        {
            id: 'extract-add',
            name: 'النقل المباشر',
            icon: 'arrow.up.arrow.down',
            description: 'نقل الأعضاء من مجموعة لأخرى تلقائياً.',
            route: '/(tabs)/extract-and-add',
            color: '#10b981' // Emerald
        },
        {
            id: 'channel-management',
            name: 'إدارة القنوات',
            icon: 'list.bullet',
            description: 'إدارة وتجهيز القنوات والمجموعات للنشر.',
            route: '/(tabs)/channel-management',
            color: '#8b5cf6' // Violet
        },
        {
            id: 'auto-reply',
            name: 'الردود التلقائية',
            icon: 'bubble.left.bubble',
            description: 'بوت الرد الآلي الذكي مع دعم الذكاء الاصطناعي.',
            route: '/(tabs)/auto-reply',
            color: '#f59e0b' // Amber
        },
        {
            id: 'content-cloner',
            name: 'ناسخ المحتوى',
            icon: 'doc.on.doc.fill',
            description: 'نسخ الرسائل والوسائط من القنوات المنافسة.',
            route: '/(tabs)/content-cloner',
            color: '#ec4899' // Pink
        },
        {
            id: 'bulk-ops',
            name: 'العمليات الجماعية',
            icon: 'square.stack.fill',
            description: 'انضمام، مغادرة، وتفاعل بحسابات متعددة.',
            route: '/(tabs)/bulk-ops',
            color: '#ef4444' // Red
        },
        {
            id: 'proxies',
            name: 'البروكسي والشبكة',
            icon: 'network',
            description: 'إدارة خوادم MTProto و SOCKS5.',
            route: '/(tabs)/proxies',
            color: '#6366f1' // Indigo
        },
        {
            id: 'developer',
            name: 'لوحة المطور',
            icon: 'lock.shield.fill',
            description: 'إعدادات متقدمة وفحص النظام.',
            route: '/(tabs)/developer-dashboard',
            color: '#64748b' // Slate
        }
    ];

    return (
        <ScreenContainer title="الأدوات" showHeader={false}>
            <View className="items-center mt-6 mb-8">
                <FalconLogo size={80} animated={false} />
                <Text className="text-2xl font-bold text-foreground mt-4">أدوات الصقر</Text>
                <Text className="text-sm text-muted text-center max-w-[80%] mt-2">
                    مجموعة متكاملة من أدوات التحكم والسيطرة الرقمية
                </Text>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap justify-between gap-y-4 pb-24">
                    {tools.map((tool) => (
                        <TouchableOpacity
                            key={tool.id}
                            className="w-[48%]"
                            onPress={() => router.push(tool.route as any)}
                        >
                            <GlassCard className="h-48 justify-between p-4 bg-surface/50 border-white/5">
                                <View className="w-12 h-12 rounded-2xl items-center justify-center bg-background/50 self-start mb-2" style={{ backgroundColor: `${tool.color}15` }}>
                                    <IconSymbol name={tool.icon as any} size={24} color={tool.color} />
                                </View>
                                <View>
                                    <Text className="text-sm font-bold text-foreground mb-1 text-right">{tool.name}</Text>
                                    <Text className="text-[10px] text-muted text-right h-8" numberOfLines={2}>
                                        {tool.description}
                                    </Text>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}
