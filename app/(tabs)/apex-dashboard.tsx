import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';
import Animated, { FadeInUp, FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const trpcAny = trpc as any;

export default function ApexDashboardScreen() {
    const colors = useColors();
    const [activeMissions, setActiveMissions] = useState<string[]>([]);

    // Apex Stats Query
    const statsQuery = (trpcAny.stats.getSystemStats.useQuery() as any);
    const stats = statsQuery.data || { totalOperations: 0, activeAccounts: 0, blocksAvoided: 0 };

    // Mutation for delegating new Apex Mission
    const delegateMutation = (trpcAny.apex.delegateMission.useMutation() as any);

    const handleLaunchApex = async () => {
        try {
            const result = await delegateMutation.mutateAsync({
                objective: 'Perform global growth and sentiment analysis'
            });
            if (result.success) {
                setActiveMissions(prev => [...prev, result.missionId]);
            }
        } catch (error) {
            console.error('Apex Launch Error:', error);
        }
    };

    return (
        <ScreenContainer style={{ backgroundColor: '#05070a' }}>
            <SafeAreaView className="flex-1">
                <ScrollView className="px-5 py-2">
                    {/* Apex Header */}
                    <Animated.View entering={FadeInUp.delay(100)} className="mb-8">
                        <Text className="text-white text-3xl font-bold tracking-tight">Falcon <Text className="text-[#00f2ff]">Apex</Text></Text>
                        <Text className="text-gray-400 text-sm mt-1">Autonomous 2026 Core v1.0.0-gold</Text>
                    </Animated.View>

                    {/* Global Neural Network Status */}
                    <Animated.View entering={FadeInUp.delay(200)} className="bg-[#0f172a] p-6 rounded-3xl border border-[#1e293b] mb-6 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-4">
                            <View>
                                <Text className="text-gray-400 text-xs uppercase tracking-widest font-bold">Neural Engine</Text>
                                <Text className="text-white text-2xl font-bold">Active & Learning</Text>
                            </View>
                            <View className="bg-[#00f2ff] h-12 w-12 rounded-full items-center justify-center">
                                <IconSymbol name="bolt.fill" size={24} color="#000" />
                            </View>
                        </View>
                        <View className="flex-row space-x-4">
                            <View className="flex-1 bg-[#1e293b] p-4 rounded-2xl">
                                <Text className="text-gray-400 text-[10px] mb-1">Detections Avoided</Text>
                                <Text className="text-[#00f2ff] text-xl font-bold">99.98%</Text>
                            </View>
                            <View className="flex-1 bg-[#1e293b] p-4 rounded-2xl">
                                <Text className="text-gray-400 text-[10px] mb-1">AI Confidence</Text>
                                <Text className="text-[#ffcf00] text-xl font-bold">Optimal</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Launch Section */}
                    <TouchableOpacity
                        onPress={handleLaunchApex}
                        disabled={delegateMutation.isLoading}
                        activeOpacity={0.8}
                        className="bg-[#00f2ff] p-5 rounded-2xl flex-row items-center justify-center mb-8 shadow-lg shadow-[#00f2ff]/20"
                    >
                        {delegateMutation.isLoading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <IconSymbol name="sparkles" size={20} color="#000" />
                                <Text className="text-black font-bold text-lg ml-2">Initiate Autonomous Apex Mission</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Active Missions Visualization */}
                    <View className="mb-6">
                        <Text className="text-white text-xl font-bold mb-4">Active Telemetry</Text>
                        {activeMissions.length === 0 ? (
                            <View className="bg-[#0f172a] p-8 rounded-3xl items-center border border-[#1e293b] border-dashed">
                                <IconSymbol name="eye.slash" size={32} color="#4b5563" />
                                <Text className="text-gray-500 mt-4 text-center">No active autonomous missions.{"\n"}Launch an Apex Mission to begin.</Text>
                            </View>
                        ) : (
                            activeMissions.map((id, idx) => (
                                <Animated.View
                                    key={id}
                                    entering={FadeInRight.delay(idx * 150)}
                                    className="bg-[#0f172a] p-4 rounded-2xl border border-[#1e293b] mb-3 flex-row items-center"
                                >
                                    <View className="bg-[#1e293b] h-10 w-10 rounded-full items-center justify-center mr-4">
                                        <IconSymbol name="circle.dashed" size={20} color="#00f2ff" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-medium">Mission: {id.split('_').pop()}</Text>
                                        <Text className="text-gray-500 text-xs">Autonomous Agent - Thinking...</Text>
                                    </View>
                                    <View className="bg-[#00f2ff]/10 px-3 py-1 rounded-full">
                                        <Text className="text-[#00f2ff] text-[10px] font-bold">STABLE</Text>
                                    </View>
                                </Animated.View>
                            ))
                        )}
                    </View>

                    {/* Statistics Grid */}
                    <View className="flex-row flex-wrap justify-between">
                        <ApexStatCard title="Total Operations" value={stats.totalOperations.toLocaleString()} icon="paperplane" delay={300} />
                        <ApexStatCard title="Ghost Proxies" value="1,280" icon="shield" delay={400} />
                        <ApexStatCard title="AI Extraction" value="42.5K" icon="square.grid.3x3" delay={500} />
                        <ApexStatCard title="Uptime" value="99.9%" icon="clock" delay={600} />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ScreenContainer>
    );
}

function ApexStatCard({ title, value, icon, delay }: { title: string, value: string, icon: any, delay: number }) {
    return (
        <Animated.View
            entering={FadeInUp.delay(delay)}
            style={{ width: (width - 56) / 2 }}
            className="bg-[#0f172a] p-5 rounded-3xl border border-[#1e293b] mb-4"
        >
            <View className="bg-[#1e293b] h-10 w-10 rounded-2xl items-center justify-center mb-3">
                <IconSymbol name={icon} size={20} color="#00f2ff" />
            </View>
            <Text className="text-gray-400 text-xs mb-1 font-medium">{title}</Text>
            <Text className="text-white text-xl font-bold">{value}</Text>
        </Animated.View>
    );
}
