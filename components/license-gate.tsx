import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { LicenseStore } from '@/lib/_core/license-store';
import { Redirect } from 'expo-router';

interface LicenseGateProps {
    children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
    const [isActivated, setIsActivated] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkLicense() {
            const activated = await LicenseStore.isActivated();
            setIsActivated(activated);
        }
        checkLicense();
    }, []);

    if (isActivated === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    if (!isActivated) {
        return <Redirect href="/(tabs)/activation-screen" />;
    }

    return <>{children}</>;
}
