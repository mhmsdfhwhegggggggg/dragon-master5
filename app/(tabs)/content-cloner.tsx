import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';

export default function ContentClonerScreen() {
    const colors = useColors();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks');
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [sourceChannels, setSourceChannels] = useState('');
    const [targetChannels, setTargetChannels] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

    const { data: accounts } = (trpc.accounts as any).getAll.useQuery();
    const { data: taskResponse, isLoading, refetch } = (trpc.contentCloner as any).getClonerRules.useQuery({
        accountId: selectedAccountId || (accounts?.[0]?.id || 0)
    }, { enabled: !!accounts });

    const createMutation = (trpc.contentCloner as any).createClonerRule.useMutation({
        onSuccess: () => {
            Alert.alert('نجاح', 'تم إنشاء مهمة النسخ بنجاح prince.');
            setModalVisible(false);
            refetch();
            resetForm();
        },
        onError: (err: any) => Alert.alert('خطأ', err.message)
    });

    const resetForm = () => {
        setName('');
        setSourceChannels('');
        setTargetChannels('');
    };

    const handleCreateTask = () => {
        if (!name || !sourceChannels || !targetChannels || !selectedAccountId) {
            Alert.alert('تنبيه', 'يرجى ملء جميع الحقول prince.');
            return;
        }

        createMutation.mutate({
            accountId: selectedAccountId,
            name,
            sourceChannelIds: sourceChannels.split(',').map(s => s.trim()),
            targetChannelIds: targetChannels.split(',').map(s => s.trim()),
            filters: { mediaType: 'all' },
            modifications: {},
            schedule: { delayBetweenPosts: 10000, randomDelay: 5000 },
            isActive: true
        });
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const tasks = taskResponse?.data?.rules || [];

    return (
        <ScreenContainer className="bg-background">
            <SafeAreaView className="flex-1">
                <View className="flex-row items-center justify-between p-4 border-b border-border">
                    <Text className="text-2xl font-bold text-foreground">نسخ المحتوى</Text>
                    <TouchableOpacity onPress={() => {
                        if (!accounts || accounts.length === 0) {
                            Alert.alert('تنبيه', 'يجب إضافة حساب Telegram أولاً prince.');
                            return;
                        }
                        setSelectedAccountId(accounts[0].id);
                        setModalVisible(true);
                    }}>
                        <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

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
                                tasks.map((task: any) => (
                                    <View key={task.id} className="bg-surface p-4 rounded-xl border border-border mb-3">
                                        <Text className="font-semibold text-foreground">{task.name}</Text>
                                        <Text className="text-muted text-sm">
                                            المصدر: {task.sourceChannelIds?.join(', ')} → الهدف: {task.targetChannelIds?.join(', ')}
                                        </Text>
                                        <View className="flex-row justify-between mt-2">
                                            <Text className="text-xs text-muted">تم نسخ: {task.totalCloned || 0}</Text>
                                            <View className={`px-2 py-0.5 rounded-full ${task.isActive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                <Text className={`text-[10px] ${task.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                                    {task.isActive ? 'نشط' : 'متوقف'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                            {!isLoading && tasks.length === 0 && (
                                <Text className="text-center text-muted mt-10">لا توجد مهام نسخ محتوى حالياً prince.</Text>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Create Task Modal */}
                <Modal visible={modalVisible} animationType="slide" transparent={true}>
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-background p-6 rounded-t-3xl border-t border-border">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-foreground">مهمة نسخ جديدة prince</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <IconSymbol name="xmark.circle.fill" size={24} color={colors.muted} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView>
                                <View className="mb-4">
                                    <Text className="text-foreground mb-2 font-medium">اسم المهمة</Text>
                                    <TextInput
                                        className="bg-surface p-4 rounded-xl border border-border text-foreground"
                                        placeholder="مثلاً: نسخ قناة الأخبار"
                                        placeholderTextColor={colors.muted}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>

                                <View className="mb-4">
                                    <Text className="text-foreground mb-2 font-medium">الحساب المستخدم</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {accounts?.map((acc: any) => (
                                            <TouchableOpacity
                                                key={acc.id}
                                                onPress={() => setSelectedAccountId(acc.id)}
                                                className={`px-4 py-2 rounded-full border ${selectedAccountId === acc.id ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
                                            >
                                                <Text className={selectedAccountId === acc.id ? 'text-white' : 'text-foreground'}>
                                                    {acc.phoneNumber}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-foreground mb-2 font-medium">قنوات المصدر (فواصل بين الأسماء)</Text>
                                    <TextInput
                                        className="bg-surface p-4 rounded-xl border border-border text-foreground"
                                        placeholder="@channel1, @channel2"
                                        placeholderTextColor={colors.muted}
                                        value={sourceChannels}
                                        onChangeText={setSourceChannels}
                                    />
                                </View>

                                <View className="mb-4">
                                    <Text className="text-foreground mb-2 font-medium">قنوات الهدف</Text>
                                    <TextInput
                                        className="bg-surface p-4 rounded-xl border border-border text-foreground"
                                        placeholder="@mytarget"
                                        placeholderTextColor={colors.muted}
                                        value={targetChannels}
                                        onChangeText={setTargetChannels}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleCreateTask}
                                    disabled={createMutation.isLoading}
                                    className="bg-primary p-4 rounded-xl items-center mt-4"
                                >
                                    {createMutation.isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-bold text-lg">بدء مهمة النسخ 🚀</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </ScreenContainer>
    );
}
