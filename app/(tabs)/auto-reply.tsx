import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, TextInput, Switch } from 'react-native';
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
        replyType: 'fixed' as 'fixed' | 'template' | 'ai',
        replyContent: '',
        matchType: 'contains' as 'exact' | 'contains' | 'fuzzy' | 'regex',
    });

    const createRuleMutation = (trpcAny.autoReply.createRule.useMutation() as any);

    const handleCreateRule = () => {
        if (!selectedAccountId) return Alert.alert("خطأ", "يرجى اختيار حساب أولاً");
        if (!newRule.name || !newRule.keywords || !newRule.replyContent) {
            return Alert.alert("خطأ", "يرجى ملء جميع الحقول");
        }

        createRuleMutation.mutate({
            accountId: selectedAccountId,
            name: newRule.name,
            keywords: newRule.keywords.split(',').map(k => k.trim()).filter(Boolean),
            replyType: newRule.replyType,
            replyContent: newRule.replyType === 'template' ? [newRule.replyContent] : newRule.replyContent,
            matchType: newRule.matchType,
            delay: { min: 2000, max: 5000 },
            options: {
                targetTypes: ['private', 'group', 'supergroup'],
                ignoreBots: true,
                caseSensitive: false
            }
        }, {
            onSuccess: () => {
                Alert.alert("نجاح", "تم إنشاء القاعدة بنجاح");
                setShowCreateModal(false);
                setNewRule({ name: '', keywords: '', replyType: 'fixed', replyContent: '', matchType: 'contains' });
                rulesQuery.refetch();
            },
            onError: (err: any) => Alert.alert("خطأ", err.message)
        });
    };

    const accountsQuery = (trpcAny.accounts.getAll.useQuery(undefined) as any);
    const accounts = accountsQuery.data || [];

    const rulesQuery = (trpcAny.autoReply.getRules.useQuery(
        { accountId: selectedAccountId || 0 },
        { enabled: !!selectedAccountId }
    ) as any);
    const rules = (rulesQuery.data as any)?.success ? (rulesQuery.data as any).data.rules : [];

    const statsQuery = (trpcAny.autoReply.getStats.useQuery(
        { accountId: selectedAccountId || 0 },
        { enabled: !!selectedAccountId }
    ) as any);
    const stats = (statsQuery.data as any)?.success ? (statsQuery.data as any).data : null;

    const onRefresh = async () => {
        setRefreshing(true);
        await rulesQuery.refetch();
        await statsQuery.refetch();
        setRefreshing(false);
    };

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

                {showCreateModal && (
                    <View className="absolute inset-0 z-50 bg-black/50 justify-center p-6">
                        <ScrollView className="bg-surface rounded-2xl border border-border max-h-[80%] p-6">
                            <Text className="text-xl font-bold text-foreground mb-4">إنشاء قاعدة رد تلقائي جديدة</Text>

                            <Text className="text-xs text-muted mb-1">اسم القاعدة</Text>
                            <TextInput
                                placeholder="مثال: الترحيب بالعملاء"
                                value={newRule.name}
                                onChangeText={(text) => setNewRule({ ...newRule, name: text })}
                                className="bg-background p-3 rounded-lg text-foreground border border-border mb-3"
                            />

                            <Text className="text-xs text-muted mb-1">الكلمات المفتاحية (فاصلة بين كل كلمة)</Text>
                            <TextInput
                                placeholder="مرحباً, اهلا, كيف"
                                value={newRule.keywords}
                                onChangeText={(text) => setNewRule({ ...newRule, keywords: text })}
                                className="bg-background p-3 rounded-lg text-foreground border border-border mb-3"
                            />

                            <Text className="text-xs text-muted mb-1">نوع الرد</Text>
                            <View className="flex-row gap-2 mb-3">
                                {(['fixed', 'template', 'ai'] as const).map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setNewRule({ ...newRule, replyType: type })}
                                        className={`flex-1 p-2 rounded-lg items-center border ${newRule.replyType === type ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                                    >
                                        <Text className={`text-[10px] ${newRule.replyType === type ? 'text-white font-bold' : 'text-muted'}`}>
                                            {type === 'fixed' ? 'نص ثابت' : type === 'template' ? 'قالب' : 'ذكاء اصطناعي'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text className="text-xs text-muted mb-1">محتوى الرد</Text>
                            <TextInput
                                placeholder={newRule.replyType === 'ai' ? 'وصف طبيعة الرد الذكي...' : 'اكتب نص الرد هنا...'}
                                multiline
                                numberOfLines={3}
                                value={newRule.replyContent}
                                onChangeText={(text) => setNewRule({ ...newRule, replyContent: text })}
                                className="bg-background p-3 rounded-lg text-foreground border border-border mb-4 min-h-[80px]"
                            />

                            <View className="flex-row gap-3 mt-2">
                                <TouchableOpacity
                                    onPress={() => setShowCreateModal(false)}
                                    className="flex-1 bg-surface-variant p-3 rounded-lg items-center"
                                >
                                    <Text className="text-foreground">إلغاء</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCreateRule}
                                    disabled={createRuleMutation.isLoading}
                                    className={`flex-1 p-3 rounded-lg items-center ${createRuleMutation.isLoading ? 'bg-muted' : 'bg-primary'}`}
                                >
                                    {createRuleMutation.isLoading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Text className="text-white font-bold">حفظ القاعدة</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                )}

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
                                            <Text className="font-semibold text-foreground">{rule.name}</Text>
                                            <Switch value={rule.isActive} />
                                        </View>
                                        <Text className="text-muted mt-2">الكلمات المفتاحية: {rule.keywords.join(', ')}</Text>
                                    </View>
                                ))
                            )}
                            {!rulesQuery.isLoading && (!rules || rules.length === 0) && (
                                <Text className="text-center text-muted mt-10">لا توجد قواعد رد تلقائي حالياً</Text>
                            )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </ScreenContainer>
    );
}
