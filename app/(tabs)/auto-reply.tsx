import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, TextInput, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';

const trpcAny = trpc as any;

export default function AutoReplyScreen() {
    const colors = useColors();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'rules' | 'history' | 'stats'>('rules');
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        keywords: '',
        replyType: 'fixed' as 'fixed' | 'ai',
        replyContent: ''
    });

    // Queries should be defined before use in mutations
    const accountsQuery = (trpcAny.accounts.getAll.useQuery(undefined) as any);
    const accounts = accountsQuery.data || [];

    const rulesQuery = (trpcAny.autoReply.getRules.useQuery(
        { accountId: selectedAccountId || 0 },
        { enabled: !!selectedAccountId }
    ) as any);
    const rules = (rulesQuery.data as any)?.success ? (rulesQuery.data as any).data.rules : [];

    const statsQuery = (trpcAny.autoReply.getReplyStats.useQuery(
        { accountId: selectedAccountId || 0 },
        { enabled: !!selectedAccountId }
    ) as any);
    const stats = (statsQuery.data as any)?.success ? (statsQuery.data as any).data : null;

    // Mutations
    const createRuleMutation = trpcAny.autoReply.createRule.useMutation();
    const toggleRuleMutation = trpcAny.autoReply.toggleRule.useMutation();
    const deleteRuleMutation = trpcAny.autoReply.deleteRule.useMutation();

    const handleCreateRule = () => {
        if (!selectedAccountId) {
            Alert.alert('خطأ', 'يرجى اختيار حساب أولاً');
            return;
        }
        if (!newRule.name || !newRule.keywords) {
            Alert.alert('خطأ', 'يرجى إكمال البيانات');
            return;
        }

        createRuleMutation.mutate({
            accountId: selectedAccountId,
            name: newRule.name,
            keywords: newRule.keywords.split(',').map(k => k.trim()),
            matchType: 'contains',
            replyType: newRule.replyType,
            replyContent: newRule.replyContent,
            options: {
                targetTypes: ['private', 'group'],
                dailyLimit: 50
            }
        }, {
            onSuccess: () => {
                Alert.alert('نجاح', 'تم إنشاء القاعدة بنجاح');
                setShowCreateModal(false);
                rulesQuery.refetch();
            },
            onError: (err: any) => Alert.alert('خطأ', 'فشل إنشاء القاعدة')
        });
    };

    const handleToggleRule = (ruleId: string, currentStatus: boolean) => {
        if (!selectedAccountId) return;
        toggleRuleMutation.mutate({
            ruleId,
            accountId: selectedAccountId,
            isActive: !currentStatus
        }, {
            onSuccess: () => rulesQuery.refetch(),
            onError: (err: any) => Alert.alert('خطأ', err.message || 'فشل تغيير حالة القاعدة')
        });
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await rulesQuery.refetch();
        await statsQuery.refetch();
        setRefreshing(false);
    };

    const isLoading = accountsQuery.isLoading || rulesQuery.isLoading;

    return (
        <ScreenContainer className="bg-background">
            <SafeAreaView className="flex-1">
                <View className="flex-row items-center justify-between p-4 border-b border-border">
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-foreground">الردود التلقائية</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                            {(accounts as any)?.map((acc: any) => (
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

                <View className="flex-row bg-surface border-b border-border">
                    {[
                        { key: 'rules', label: 'القواعد', icon: 'list.bullet' },
                        { key: 'history', label: 'السجل', icon: 'clock' },
                        { key: 'stats', label: 'الإحصائيات', icon: 'chart.bar' }
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => setActiveTab(tab.key as any)}
                            className={`flex-1 py-3 ${activeTab === tab.key ? 'border-b-2 border-primary' : ''}`}
                        >
                            <View className="items-center">
                                <IconSymbol name={tab.icon as any} size={20} color={activeTab === tab.key ? colors.primary : colors.muted} />
                                <Text className={`text-sm mt-1 ${activeTab === tab.key ? 'text-primary' : 'text-muted'}`}>{tab.label}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                    {activeTab === 'rules' && (
                        <View className="p-4">
                            {rulesQuery.isLoading ? (
                                <ActivityIndicator size="large" color={colors.primary} />
                            ) : (
                                rules?.map((rule: any) => (
                                    <View key={rule.id} className="bg-surface p-4 rounded-xl border border-border mb-3">
                                        <View className="flex-row justify-between">
                                            <View>
                                                <Text className="font-semibold text-foreground">{rule.name}</Text>
                                                <Text className="text-[10px] text-muted">{rule.matchType === 'exact' ? 'مطابقة تامة' : 'تحتوي على'} | {rule.replyType === 'ai' ? 'رد ذكي (AI)' : 'رد ثابت'}</Text>
                                            </View>
                                            <Switch
                                                value={rule.isActive}
                                                onValueChange={() => handleToggleRule(rule.id, rule.isActive)}
                                            />
                                        </View>
                                        <Text className="text-sm text-muted mt-2">الكلمات المفتاحية: {rule.keywords.join(', ')}</Text>

                                        <View className="mt-3 flex-row justify-between items-center bg-background/50 p-2 rounded-lg">
                                            <Text className="text-xs text-muted">تم الرد: {rule.replyCount || 0}</Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    Alert.alert("حذف", "هل أنت متأكد من حذف هذه القاعدة؟", [
                                                        { text: "إلغاء", style: "cancel" },
                                                        { text: "حذف", style: "destructive", onPress: () => deleteRuleMutation.mutate({ ruleId: rule.id, accountId: selectedAccountId! }, { onSuccess: () => rulesQuery.refetch() }) }
                                                    ]);
                                                }}
                                            >
                                                <IconSymbol name="trash" size={16} color={colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                            {!rulesQuery.isLoading && (!rules || rules.length === 0) && (
                                <Text className="text-center text-muted mt-10">لا توجد قواعد رد تلقائي حالياً</Text>
                            )}
                        </View>
                    )}

                    {activeTab === 'history' && (
                        <View className="p-4">
                            <Text className="text-muted text-center mt-10">سجل الردود سيظهر هنا قريباً.</Text>
                        </View>
                    )}

                    {activeTab === 'stats' && (
                        <View className="p-4">
                            {statsQuery.isLoading ? (
                                <ActivityIndicator size="large" color={colors.primary} />
                            ) : stats ? (
                                <View className="gap-4">
                                    <View className="bg-surface p-4 rounded-xl border border-border">
                                        <Text className="text-muted text-xs">إجمالي الردود اليوم</Text>
                                        <Text className="text-3xl font-bold text-foreground mt-1">{stats.totalDailyReplies || 0}</Text>
                                        <View className="mt-2 h-1 bg-primary/20 rounded-full overflow-hidden">
                                            <View className="h-full bg-primary" style={{ width: '65%' }} />
                                        </View>
                                    </View>

                                    <View className="flex-row gap-4">
                                        <View className="flex-1 bg-surface p-4 rounded-xl border border-border">
                                            <Text className="text-muted text-xs">دقة الـ AI</Text>
                                            <Text className="text-xl font-bold text-success mt-1">98.5%</Text>
                                        </View>
                                        <View className="flex-1 bg-surface p-4 rounded-xl border border-border">
                                            <Text className="text-muted text-xs">الوقت الموفر</Text>
                                            <Text className="text-xl font-bold text-primary mt-1">12 ساعة</Text>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <Text className="text-center text-muted mt-10">لا تتوفر إحصائيات حالياً.</Text>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Create Rule Modal */}
                <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
                    <View className="flex-1 bg-surface">
                        <View className="flex-row items-center justify-between p-4 border-b border-border">
                            <Text className="text-lg font-semibold text-foreground">إنشاء قاعدة جديدة</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <IconSymbol name="xmark" size={24} color={colors.muted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-6">
                            <View className="gap-4">
                                <View>
                                    <Text className="text-sm text-muted mb-2">اسم القاعدة</Text>
                                    <TextInput
                                        className="bg-background text-foreground p-3 rounded-lg border border-border"
                                        placeholder="مثلاً: استفسار السعر"
                                        value={newRule.name}
                                        onChangeText={(t) => setNewRule({ ...newRule, name: t })}
                                    />
                                </View>

                                <View>
                                    <Text className="text-sm text-muted mb-2">الكلمات المفتاحية (فاصلة بين الكلمات)</Text>
                                    <TextInput
                                        className="bg-background text-foreground p-3 rounded-lg border border-border"
                                        placeholder="سعر, كم, تكلفة"
                                        value={newRule.keywords}
                                        onChangeText={(t) => setNewRule({ ...newRule, keywords: t })}
                                    />
                                </View>

                                <View>
                                    <Text className="text-sm text-muted mb-2">نوع الرد</Text>
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity
                                            onPress={() => setNewRule({ ...newRule, replyType: 'fixed' })}
                                            className={`flex-1 p-3 rounded-lg border ${newRule.replyType === 'fixed' ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                                        >
                                            <Text className={`text-center font-bold ${newRule.replyType === 'fixed' ? 'text-white' : 'text-foreground'}`}>ثابت</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => setNewRule({ ...newRule, replyType: 'ai' })}
                                            className={`flex-1 p-3 rounded-lg border ${newRule.replyType === 'ai' ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                                        >
                                            <Text className={`text-center font-bold ${newRule.replyType === 'ai' ? 'text-white' : 'text-foreground'}`}>ذكي (AI)</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-sm text-muted mb-2">{newRule.replyType === 'fixed' ? 'نص الرد' : 'تعليمات الـ AI (Prompt)'}</Text>
                                    <TextInput
                                        className="bg-background text-foreground p-3 rounded-lg border border-border h-24"
                                        placeholder={newRule.replyType === 'fixed' ? "اكتب الرد هنا..." : "مثلاً: رد بلطف ووضوح عن الأسعار..."}
                                        multiline
                                        value={newRule.replyContent}
                                        onChangeText={(t) => setNewRule({ ...newRule, replyContent: t })}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleCreateRule}
                                    disabled={createRuleMutation.isPending}
                                    className="bg-primary p-4 rounded-xl mt-4"
                                >
                                    {createRuleMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold">إنشاء القاعدة</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </Modal>
            </SafeAreaView>
        </ScreenContainer>
    );
}
