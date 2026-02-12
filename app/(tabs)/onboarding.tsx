import { useMemo, useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function OnboardingScreen() {
  const colors = useColors();
  const [phonesCsv, setPhonesCsv] = useState("");
  const [confirmCsv, setConfirmCsv] = useState("");
  const [sendJobId, setSendJobId] = useState<string | null>(null);
  const [confirmJobId, setConfirmJobId] = useState<string | null>(null);

  const sendMutation = trpc.accounts.bulkSendLoginCodes.useMutation({
    onSuccess: (res) => {
      setSendJobId(res.jobId);
      Alert.alert("تم", "تمت إضافة مهمة إرسال الأكواد للطابور");
    },
    onError: (err) => Alert.alert("خطأ", err.message || "فشل إرسال الأكواد"),
  });

  const confirmMutation = trpc.accounts.bulkConfirmCodes.useMutation({
    onSuccess: (res) => {
      setConfirmJobId(res.jobId);
      Alert.alert("تم", "تمت إضافة مهمة تأكيد الأكواد للطابور");
    },
    onError: (err) => Alert.alert("خطأ", err.message || "فشل تأكيد الأكواد"),
  });

  const sendJobStatus = trpc.bulkOps.getJobStatus.useQuery(
    { jobId: sendJobId || "" },
    { enabled: !!sendJobId, refetchInterval: sendJobId ? 1500 : false }
  );
  const confirmJobStatus = trpc.bulkOps.getJobStatus.useQuery(
    { jobId: confirmJobId || "" },
    { enabled: !!confirmJobId, refetchInterval: confirmJobId ? 1500 : false }
  );

  const disableSend = useMemo(() => phonesCsv.trim().length === 0, [phonesCsv]);
  const disableConfirm = useMemo(() => confirmCsv.trim().length === 0, [confirmCsv]);

  const parsePhonesFromCsv = (text: string) => {
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  };

  const parseConfirmItemsFromCsv = (text: string) => {
    // CSV: phoneNumber,code,password(optional)
    const items: { phoneNumber: string; code: string; password?: string }[] = [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const [phoneNumber, code, password] = line.split(",").map((s) => (s ? s.trim() : ""));
      if (!phoneNumber || !code) continue;
      items.push({ phoneNumber, code, password: password || undefined });
    }
    return items;
  };

  const handleSendCodes = () => {
    const phones = parsePhonesFromCsv(phonesCsv);
    if (phones.length === 0) return Alert.alert("تنبيه", "أدخل أرقام هواتف صالحة");
    sendMutation.mutate({ phoneNumbers: phones });
  };

  const handleConfirmCodes = () => {
    const items = parseConfirmItemsFromCsv(confirmCsv);
    if (items.length === 0) return Alert.alert("تنبيه", "أدخل بيانات تأكيد صحيحة");
    confirmMutation.mutate({ items });
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Onboarding الحسابات</Text>
            <Text className="text-sm text-muted">إرسال وتأكيد أكواد الدخول لدفعات كبيرة بسهولة</Text>
          </View>

          {/* Send Codes */}
          <View className="bg-surface rounded-lg p-4 gap-3">
            <Text className="text-sm font-semibold text-foreground">1) إرسال الأكواد (قائمة أرقام)</Text>
            <Text className="text-xs text-muted">CSV (رقم هاتف في كل سطر)</Text>
            <TextInput
              multiline
              numberOfLines={6}
              placeholder={"مثال:\n+966500000000\n+201000000000"}
              value={phonesCsv}
              onChangeText={setPhonesCsv}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 10,
                color: colors.foreground,
                backgroundColor: colors.background,
                minHeight: 100,
              }}
              placeholderTextColor={colors.muted}
            />
            <Pressable
              onPress={handleSendCodes}
              disabled={disableSend || sendMutation.isPending}
              style={{
                backgroundColor: disableSend || sendMutation.isPending ? colors.muted : colors.primary,
                paddingVertical: 12,
                borderRadius: 8,
                opacity: disableSend || sendMutation.isPending ? 0.6 : 1,
              }}
            >
              <View className="flex-row items-center justify-center gap-2">
                {sendMutation.isPending && <ActivityIndicator color="white" />}
                <Text className="text-white font-semibold text-center">إرسال الأكواد</Text>
              </View>
            </Pressable>
            {sendJobId && sendJobStatus.data?.found && (
              <View className="bg-surface rounded-lg p-3 border border-border">
                <Text className="text-sm text-foreground">مهمة الإرسال: {sendJobId}</Text>
                <Text className="text-sm text-foreground">الحالة: {sendJobStatus.data.status}</Text>
                <Text className="text-sm text-foreground">التقدم: {sendJobStatus.data.progress}%</Text>
              </View>
            )}
          </View>

          {/* Confirm Codes */}
          <View className="bg-surface rounded-lg p-4 gap-3">
            <Text className="text-sm font-semibold text-foreground">2) تأكيد الأكواد (CSV)</Text>
            <Text className="text-xs text-muted">CSV: phoneNumber,code,password(optional)</Text>
            <TextInput
              multiline
              numberOfLines={6}
              placeholder={"مثال:\n+966500000000,12345\n+201000000000,67890,my2faPassword"}
              value={confirmCsv}
              onChangeText={setConfirmCsv}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 10,
                color: colors.foreground,
                backgroundColor: colors.background,
                minHeight: 100,
              }}
              placeholderTextColor={colors.muted}
            />
            <Pressable
              onPress={handleConfirmCodes}
              disabled={disableConfirm || confirmMutation.isPending}
              style={{
                backgroundColor: disableConfirm || confirmMutation.isPending ? colors.muted : colors.primary,
                paddingVertical: 12,
                borderRadius: 8,
                opacity: disableConfirm || confirmMutation.isPending ? 0.6 : 1,
              }}
            >
              <View className="flex-row items-center justify-center gap-2">
                {confirmMutation.isPending && <ActivityIndicator color="white" />}
                <Text className="text-white font-semibold text-center">تأكيد الأكواد وإنشاء الجلسات</Text>
              </View>
            </Pressable>
            {confirmJobId && confirmJobStatus.data?.found && (
              <View className="bg-surface rounded-lg p-3 border border-border">
                <Text className="text-sm text-foreground">مهمة التأكيد: {confirmJobId}</Text>
                <Text className="text-sm text-foreground">الحالة: {confirmJobStatus.data.status}</Text>
                <Text className="text-sm text-foreground">التقدم: {confirmJobStatus.data.progress}%</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
