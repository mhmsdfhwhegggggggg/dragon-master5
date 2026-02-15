/**
 * Channel Management Screen 🔥
 * 
 * Complete channel operations:
 * - Create/edit channels & groups
 * - Multi-media posting
 * - Message scheduling
 * - Cross-channel message transfer
 * - Content modification & replacement
 * 
 * @version 6.0.0
 * @author Dragon Team
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from "@/lib/trpc";
import { IconSymbol } from '@/components/ui/icon-symbol';

const trpcAny = trpc as any;
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { router } from 'expo-router';

interface Channel {
  id: string;
  title: string;
  username?: string;
  description?: string;
  type: 'channel' | 'group' | 'supergroup';
  memberCount: number;
  isPrivate: boolean;
  isBroadcast: boolean;
  createdAt: Date;
  statistics?: {
    views: number;
    forwards: number;
    reactions: number;
    comments: number;
    engagement: number;
  };
}

interface PostContent {
  type: 'text' | 'image' | 'video' | 'file' | 'poll';
  content: string;
  mediaPath?: string;
  caption?: string;
  schedule?: Date;
  silent?: boolean;
  pinned?: boolean;
}

export default function ChannelManagementScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'channels' | 'posts' | 'transfer' | 'schedule'>('channels');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [postContentState, setPostContentState] = useState<PostContent>({
    type: 'text',
    content: ''
  });

  const [newChannel, setNewChannel] = useState({
    title: '',
    about: '',
    type: 'channel' as 'channel' | 'group' | 'supergroup',
    isPrivate: false,
    username: ''
  });

  const [transferState, setTransferState] = useState({
    sourceChannelId: '',
    targetChannelIds: [] as string[],
    messageCount: 50,
    filters: { mediaType: 'all' as any },
    modifications: {
      replaceUsernames: [],
      replaceLinks: [],
      replaceText: []
    },
    schedule: { delayBetweenPosts: 5000, randomDelay: 2000 }
  });

  // tRPC queries
  const accountsQuery = (trpc.accounts.getAll.useQuery(undefined) as any);
  const accounts = accountsQuery.data || [];
  const accountId = accounts?.[0]?.id || 0;

  const userChannelsQuery = (trpc.channelManagement.getUserChannels.useQuery({ accountId }, { enabled: !!accountId }) as any);
  const userChannels = userChannelsQuery.data?.data?.channels || [];

  const scheduleQuery = (trpc.channelManagement.getScheduledPosts.useQuery({ accountId }, { enabled: !!accountId }) as any);
  const scheduledPosts = scheduleQuery.data?.data?.posts || [];

  const channelStatsQuery = (trpc.channelManagement.getChannelStats.useQuery({
    accountId,
    channelId: selectedChannel?.id || 'me',
    period: 'today'
  }, { enabled: !!accountId }) as any);

  const channelsLoading = userChannelsQuery.isLoading;
  const channelStats = channelStatsQuery.data;
  const statsLoading = channelStatsQuery.isLoading;

  // Mutations
  const createChannel = trpc.channelManagement.createChannel.useMutation();
  const updateChannel = trpc.channelManagement.updateChannel.useMutation();
  const postContentMutation = trpc.channelManagement.postContent.useMutation();
  const scheduleContentMutation = trpc.channelManagement.scheduleContent.useMutation();
  const transferMessages = trpc.channelManagement.transferMessages.useMutation();

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      userChannelsQuery.refetch(),
      channelStatsQuery.refetch(),
      accountsQuery.refetch()
    ]);
    setRefreshing(false);
  };

  // Handle channel creation
  const handleCreateChannel = () => {
    if (!newChannel.title) {
      Alert.alert('خطأ', 'يرجى إدخال اسم القناة');
      return;
    }

    createChannel.mutate({
      accountId: accountId || 1,
      ...newChannel
    }, {
      onSuccess: (result: any) => {
        if (result.success) {
          Alert.alert('نجاح! 🎉', 'تم إنشاء القناة بنجاح');
          setShowCreateModal(false);
          setNewChannel({
            title: '',
            about: '',
            type: 'channel',
            isPrivate: false,
            username: ''
          });
          userChannelsQuery.refetch();
        } else {
          Alert.alert('خطأ', result.error || 'فشل إنشاء القناة');
        }
      },
      onError: (error: any) => {
        Alert.alert('خطأ', error.message);
      }
    });
  };

  // Handle content posting
  const handlePostContent = async () => {
    if (!selectedChannel) {
      Alert.alert('خطأ', 'يرجى اختيار قناة أولاً prince.');
      return;
    }

    try {
      const result = await postContentMutation.mutateAsync({
        accountId,
        channelId: selectedChannel.id,
        content: {
          ...postContentState,
          silent: postContentState.silent || false,
          pinned: postContentState.pinned || false
        }
      });

      if (result.success) {
        Alert.alert('نجاح! 📤', 'تم نشر المحتوى بنجاح prince.');
        setShowPostModal(false);
        setPostContentState({ type: 'text', content: '' });
      } else {
        Alert.alert('خطأ', result.error || 'فشل نشر المحتوى prince.');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message + ' prince.');
    }
  };

  const handleScheduleContent = async () => {
    if (!selectedChannel) {
      Alert.alert('خطأ', 'يرجى اختيار قناة أولاً prince.');
      return;
    }

    try {
      const scheduleDate = new Date(Date.now() + 3600000); // Default to 1 hour from now for testing
      const result = await scheduleContentMutation.mutateAsync({
        accountId,
        channelId: selectedChannel.id,
        content: {
          ...postContentState,
          schedule: scheduleDate,
          silent: postContentState.silent || false,
          pinned: postContentState.pinned || false
        }
      });

      if (result.success) {
        Alert.alert('نجاح! 📅', 'تمت جدولة المحتوى بنجاح prince.');
        setShowPostModal(false);
        scheduleQuery.refetch();
      } else {
        Alert.alert('خطأ', result.error || 'فشل جدولة المحتوى prince.');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message + ' prince.');
    }
  };

  // Handle message transfer
  const handleTransferMessages = async (transferData: any) => {
    try {
      const result = await transferMessages.mutateAsync({
        accountId,
        ...transferData
      });

      if (result.success) {
        Alert.alert('نجاح! 🔄', `تم نقل ${result.data.transferredCount} رسالة بنجاح`);
        setShowTransferModal(false);
      } else {
        Alert.alert('خطأ', result.error || 'فشل نقل الرسائل');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <Text className="text-2xl font-bold text-foreground">إدارة القنوات</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}>
            <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-surface border-b border-border">
          {[
            { key: 'channels', label: 'القنوات', icon: 'list.bullet' },
            { key: 'posts', label: 'المنشورات', icon: 'square.stack' },
            { key: 'transfer', label: 'نقل', icon: 'arrow.left.arrow.right' },
            { key: 'schedule', label: 'جدولة', icon: 'calendar' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3 ${activeTab === tab.key ? 'border-b-2 border-primary' : ''
                }`}
            >
              <View className="items-center">
                <IconSymbol
                  name={tab.icon}
                  size={20}
                  color={activeTab === tab.key ? colors.primary : colors.muted}
                />
                <Text className={`text-sm mt-1 ${activeTab === tab.key ? 'text-primary' : 'text-muted'
                  }`}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {activeTab === 'channels' && (
            <View className="p-6 space-y-4">
              <Text className="text-lg font-semibold text-foreground mb-4">قنواتي</Text>

              {channelsLoading ? (
                <View className="items-center justify-center py-8">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                userChannels.map((channel: any) => (
                  <TouchableOpacity
                    key={channel.id}
                    onPress={() => setSelectedChannel(channel)}
                    className="bg-surface rounded-2xl p-4 border border-border active:opacity-70 mb-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground">{channel.title}</Text>
                        <Text className="text-sm text-muted">
                          {channel.type === 'channel' ? 'قناة' : channel.type === 'group' ? 'مجموعة' : 'مجموعة سوبر'}
                          {channel.isPrivate && ' (خاصة)'}
                          {channel.isBroadcast && ' (بث)'}
                        </Text>
                        <Text className="text-sm text-muted">
                          {channel.memberCount.toLocaleString()} عضو
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <View className="bg-primary/10 rounded-full px-2 py-1">
                          <Text className="text-xs text-primary font-medium">
                            {channel.type === 'channel' ? 'قناة' : 'مجموعة'}
                          </Text>
                        </View>
                        <IconSymbol name="chevron.left" size={16} color={colors.muted} />
                      </View>
                    </View>

                    {channel.statistics && (
                      <View className="mt-3 pt-3 border-t border-border">
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-muted">المشاهدات</Text>
                          <Text className="text-sm font-semibold">{channel.statistics.views.toLocaleString()}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-muted">التفاعل</Text>
                          <Text className="text-sm font-semibold">{channel.statistics.engagement}%</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === 'posts' && (
            <View className="p-6 space-y-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">المنشورات</Text>
                <TouchableOpacity onPress={() => setShowPostModal(true)}>
                  <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Quick Post Templates */}
              <View className="grid grid-cols-2 gap-3">
                {[
                  { title: 'رسالة نصية', icon: 'text.alignleft', content: 'اكتب رسالتك هنا...' },
                  { title: 'صورة', icon: 'photo', content: 'اختر صورة' },
                  { title: 'فيديو', icon: 'video', content: 'اختر فيديو' },
                  { title: 'ملف', icon: 'doc', content: 'اختر ملف' }
                ].map((template, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setPostContentState({
                      type: template.title.includes('نص') ? 'text' : template.title.includes('صورة') ? 'image' : template.title.includes('فيديو') ? 'video' : 'file',
                      content: template.content
                    })}
                    className="bg-surface rounded-xl p-4 border border-border"
                  >
                    <View className="items-center mb-2">
                      <IconSymbol name={template.icon} size={24} color={colors.primary} />
                    </View>
                    <Text className="text-sm text-center">{template.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'transfer' && (
            <View className="p-6 space-y-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">نقل الرسائل</Text>
                <TouchableOpacity onPress={() => setShowTransferModal(true)}>
                  <IconSymbol name="arrow.left.arrow.right" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Recent Transfers */}
              <View className="space-y-3">
                {[
                  {
                    source: 'قناة المصدر',
                    target: 'القناة المستهدفة',
                    messages: 150,
                    success: 145,
                    time: 'منذ 30 دقيقة'
                  },
                  {
                    source: 'قناة الأخبار',
                    target: '3 قنوات',
                    messages: 450,
                    success: 420,
                    time: 'منذ ساعة'
                  }
                ].map((transfer, index) => (
                  <View key={index} className="bg-surface rounded-xl p-4 border border-border">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{transfer.source}</Text>
                        <Text className="text-sm text-muted">{transfer.target}</Text>
                        <Text className="text-sm text-muted">{transfer.messages} رسالة</Text>
                      </View>
                      <View className="items-center">
                        <Text className={`text-sm font-semibold ${transfer.success > 140 ? 'text-success' : transfer.success > 100 ? 'text-warning' : 'text-error'
                          }`}>
                          {transfer.success}
                        </Text>
                        <Text className="text-xs text-muted">{transfer.time}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'schedule' && (
            <View className="p-6 space-y-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">المنشورات المجدولة</Text>
                <TouchableOpacity>
                  <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Scheduled Posts */}
              <View className="space-y-3">
                {scheduledPosts.length > 0 ? (
                  scheduledPosts.map((post: any, index: number) => (
                    <View key={index} className="bg-surface rounded-xl p-4 border border-border">
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1">
                          <Text className="font-semibold text-foreground">{post.channelTitle || 'قناة غير معروفة'}</Text>
                          <Text className="text-sm text-muted">{post.content?.content || post.text || 'محتوى غير متوفر'}</Text>
                        </View>
                        <View className="bg-warning/10 rounded-full px-2 py-1">
                          <Text className="text-xs text-warning font-medium">مجدول</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-muted">
                        {new Date(post.scheduleAt || post.date).toLocaleString('ar-EG', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View className="py-12 items-center">
                    <Text className="text-muted">لا توجد منشورات مجدولة حالياً prince.</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Create Channel Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View className="flex-1 bg-surface">
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text className="text-lg font-semibold text-foreground">إنشاء قناة جديدة</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <IconSymbol name="xmark" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View className="p-6 space-y-4">
              <View>
                <Text className="text-sm text-muted mb-2">اسم القناة</Text>
                <TextInput
                  className="text-foreground bg-surface border border-border rounded-lg p-3"
                  placeholder="أدخل اسم القناة"
                  value={newChannel.title}
                  onChangeText={(text) => setNewChannel({ ...newChannel, title: text })}
                />
              </View>

              <View>
                <Text className="text-sm text-muted mb-2">الوصف</Text>
                <TextInput
                  className="text-foreground bg-surface border border-border rounded-lg p-3 h-20"
                  placeholder="أدخل وصف القناة"
                  multiline
                  value={newChannel.about}
                  onChangeText={(text) => setNewChannel({ ...newChannel, about: text })}
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setNewChannel({ ...newChannel, type: 'channel' })}
                  className={`flex-1 rounded-lg p-3 ${newChannel.type === 'channel' ? 'bg-primary' : 'bg-surface border border-border'}`}
                >
                  <Text className={`${newChannel.type === 'channel' ? 'text-white' : 'text-foreground'} font-medium text-center`}>قناة</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNewChannel({ ...newChannel, type: 'group' })}
                  className={`flex-1 rounded-lg p-3 ${newChannel.type === 'group' ? 'bg-primary' : 'bg-surface border border-border'}`}
                >
                  <Text className={`${newChannel.type === 'group' ? 'text-white' : 'text-foreground'} font-medium text-center`}>مجموعة</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleCreateChannel}
                className="bg-primary rounded-xl p-4"
                disabled={createChannel.isPending}
              >
                {createChannel.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-center">إنشاء القناة</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Post Content Modal */}
        <Modal
          visible={showPostModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View className="flex-1 bg-surface">
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text className="text-lg font-semibold text-foreground">نشر محتوى</Text>
              <TouchableOpacity onPress={() => setShowPostModal(false)}>
                <IconSymbol name="xmark" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View className="p-6 space-y-4">
              <View>
                <Text className="text-sm text-muted mb-2">اختر القناة</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {userChannels.map((ch: any) => (
                    <TouchableOpacity
                      key={ch.id}
                      onPress={() => setSelectedChannel(ch)}
                      className={`px-4 py-2 rounded-full border ${selectedChannel?.id === ch.id ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
                    >
                      <Text className={selectedChannel?.id === ch.id ? 'text-white font-bold' : 'text-foreground'}>
                        {ch.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text className="text-sm text-muted mb-2">المحتوى</Text>
                <TextInput
                  className="text-foreground bg-surface border border-border rounded-lg p-3 h-20"
                  placeholder="اكتب المحتوى هنا..."
                  multiline
                  value={postContentState.content}
                  onChangeText={(text: string) => setPostContentState({ ...postContentState, content: text })}
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handlePostContent}
                  disabled={postContentMutation.isPending}
                  className="flex-1 bg-primary rounded-lg p-3"
                >
                  {postContentMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-medium text-center">نشر الآن</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleScheduleContent}
                  disabled={scheduleContentMutation.isPending}
                  className="flex-1 bg-surface border border-border rounded-lg p-3"
                >
                  {scheduleContentMutation.isPending ? <ActivityIndicator color={colors.primary} /> : <Text className="text-foreground font-medium text-center">جدولة (ساعة)</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Transfer Messages Modal */}
        <Modal
          visible={showTransferModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View className="flex-1 bg-surface">
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text className="text-lg font-semibold text-foreground">نقل الرسائل بين القنوات</Text>
              <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                <IconSymbol name="xmark" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-6 space-y-4">
              <View className="gap-4">
                <View>
                  <Text className="text-sm text-muted mb-2">رابط قناة المصدر</Text>
                  <TextInput
                    className="text-foreground bg-surface border border-border rounded-lg p-3"
                    placeholder="@source_channel or https://t.me/..."
                    onChangeText={(text) => setTransferState({ ...transferState, sourceChannelId: text })}
                  />
                </View>

                <View>
                  <Text className="text-sm text-muted mb-2">رابط القنوات المستهدفة (فاصلة بين الروابط)</Text>
                  <TextInput
                    className="text-foreground bg-surface border border-border rounded-lg p-3"
                    placeholder="@target1, @target2"
                    onChangeText={(text) => setTransferState({ ...transferState, targetChannelIds: text.split(',').map(s => s.trim()) })}
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm text-muted mb-2">عدد الرسائل</Text>
                    <TextInput
                      className="text-foreground bg-surface border border-border rounded-lg p-3"
                      keyboardType="numeric"
                      defaultValue="50"
                      onChangeText={(text) => setTransferState({ ...transferState, messageCount: parseInt(text) || 50 })}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-muted mb-2">التأخير (ثانية)</Text>
                    <TextInput
                      className="text-foreground bg-surface border border-border rounded-lg p-3"
                      keyboardType="numeric"
                      defaultValue="5"
                      onChangeText={(text) => {
                        const delay = parseInt(text) || 5;
                        setTransferState({
                          ...transferState,
                          schedule: { ...transferState.schedule, delayBetweenPosts: delay * 1000 }
                        });
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleTransferMessages(transferState)}
                  className="bg-primary rounded-xl p-4 mt-6"
                  disabled={transferMessages.isPending}
                >
                  {transferMessages.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-center">بدء عملية النقل prince.</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </SafeAreaView>
    </ScreenContainer>
  );
}
