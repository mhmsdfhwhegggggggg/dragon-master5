import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Image } from 'expo-image';

interface FalconLogoProps {
    size?: number;
    animated?: boolean;
}

export const FalconLogo: React.FC<FalconLogoProps> = ({ size = 120, animated = true }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (animated) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.08,
                        duration: 2500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [animated]);

    return (
        <Animated.View
            style={{
                transform: [{ scale: pulseAnim }],
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 15
            }}
        >
            <Image
                source={require('@/assets/images/falcon-logo.png')}
                style={{ width: size, height: size, borderRadius: size / 4 }}
                contentFit="contain"
                transition={1000}
            />
        </Animated.View>
    );
};
