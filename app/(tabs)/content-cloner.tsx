import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';

export default function ContentClonerScreen() {
    const colors = useColors();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [newRule, setNewRule] = useState({
        name: '',
        sourceChannel: '',
        targetChannels: '',
    });

    const accountsQuery = (trpc.accounts.getAll.useQuery(undefined) as any);
    const accounts = accountsQuery.data || [];

    const { data: tasks, isLoading, refetch } = (trpc.contentCloner as any).getTasks.useQuery(
        { accountId: selectedAccountId || 0 },
        { enabled: !!selectedAccountId }
    );

    const createRuleMutation = (trpc.contentCloner as any).createRule.useMutation();

    const handleCreateRule = () => {
        if (!selectedAccountId) return Alert.alert("خطأ", "يرجى اختيار حساب أولاً");
        if (!newRule.name || !newRule.sourceChannel || !newRule.targetChannels) {
            return Alert.alert("خطأ", "يرجى ملء جميع الحقول");
        }

        createRuleMutation.mutate({
            accountId: selectedAccountId,
            name: newRule.name,
            sourceChannel: newRule.sourceChannel,
            targetChannels: newRule.targetChannels.split(',').map(c => c.trim()).filter(Boolean),
            options: {
                aiRewrite: true,
                rewriteMode: 'smart',
                removeLinks: true,
                addWatermark: false,
                mediaHashRandomization: true
            }
        }, {
            onSuccess: () => {
                Alert.alert("نجاح", "تم البدء في تفويض المهمة للمحرك العملاق بنجاح");
                setShowCreateModal(false);
                setNewRule({ name: '', sourceChannel: '', targetChannels: '' });
                refetch();
            },
            onError: (err: any) => Alert.alert("خطأ", err.message)
        });
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    return (
        <ScreenContainer className="bg-background">
            <SafeAreaView className="flex-1">
                <View className="flex-row items-center justify-between p-4 border-b border-border">
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-foreground">نسخ المحتوى</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                            {accounts?.map((acc: any) => (
                                <TouchableOpacity
                                    key={acc.id}
                                    onPress={() => setSelectedAccountId(acc.id)}
                                    className={`mr-2 px-3 py-1 rounded-full border ${selectedAccountId === acc.id ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
                                >
                                    <Text className={`text-xs ${selectedAccountId === acc.id ? 'text-white' : 'text-foreground'}`}>{acc.phoneNumber}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                    <TouchableOpacity onPress={() => setShowCreateModal(true)}>
                        <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {showCreateModal && (
                    <View className="absolute inset-0 z-50 bg-black/50 justify-center p-6">
                        <View className="bg-surface p-6 rounded-2xl border border-border">
                            <Text className="text-xl font-bold text-foreground mb-4">إنشاء مهمة نسخ محتوى جديدة</Text>
                            <TextInput
                                placeholder="اسم المهمة"
                                value={newRule.name}
                                onChangeText={(text) => setNewRule({ ...newRule, name: text })}
                                className="bg-background p-3 rounded-lg text-foreground border border-border mb-3"
                            />
                            <TextInput
                                placeholder="معرف القناة المصدر (@channel)"
                                value={newRule.sourceChannel}
                                onChangeText={(text) => setNewRule({ ...newRule, sourceChannel: text })}
                                className="bg-background p-3 rounded-lg text-foreground border border-border mb-3"
                            />
                            <TextInput
                                placeholder="معرفات القنوات الهدف (فاصلة بينها)"
                                value={newRule.targetChannels}
                                onChangeText={(text) => setNewRule({ ...newRule, targetChannels: text })}
                                className="bg-background p-3 rounded-lg text-foreground border border-border mb-4"
                            />
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => setShowCreateModal(false)}
                                    className="flex-1 bg-surface-variant p-3 rounded-lg items-center"
                                >
                                    <Text className="text-foreground">إلغاء</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCreateRule}
                                    disabled={createRuleMutation.isPending}
                                    className={`flex-1 p-3 rounded-lg items-center ${createRuleMutation.isPending ? 'bg-muted' : 'bg-primary'}`}
                                >
                                    {createRuleMutation.isPending ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Text className="text-white font-bold">بدء النسخ</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                <View className="flex-row bg-surface border-b border-border">
                    {[
                        { key: 'tasks', label: 'المهام', icon: 'list.bullet' },
                        { key: 'logs', label: 'السجل', icon: 'clock' }
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => setActiveTab(tab.key as any)}
                            className={`flex-1 py-3 ${activeTab === tab.key ? 'border-b-2 border-primary' : ''}`}
                        >
                            <View className="items-center">
                                <IconSymbol name={tab.icon} size={20} color={activeTab === tab.key ? colors.primary : colors.muted} />
                                <Text className={`text-sm mt-1 ${activeTab === tab.key ? 'text-primary' : 'text-muted'}`}>{tab.label}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                    {activeTab === 'tasks' && (
                        <View className="p-4">
                            {isLoading ? (
                                <ActivityIndicator size="large" color={colors.primary} />
                            ) : (
                                tasks?.map((task: any) => (
                                    <View key={task.id} className="bg-surface p-4 rounded-xl border border-border mb-3">
                                        <Text className="font-semibold text-foreground">{task.name}</Text>
                                        <Text className="text-muted text-sm">Source: {task.sourceChannel} → Target: {task.targetChannels.join(', ')}</Text>
                                    </View>
                                ))
                            )}
                            {!isLoading && (!tasks || tasks.length === 0) && (
                                <Text className="text-center text-muted mt-10">لا توجد مهام نسخ محتوى حالياً</Text>
                            )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </ScreenContainer>
    );
}
