import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    withRepeat,
    withTiming,
    useAnimatedStyle,
    Easing,
    FadeIn,
    FadeOut,
    FadeInDown
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
    icon?: keyof typeof Feather.glyphMap;
    color?: string;
}

export const BrandedLoadingOverlay = ({
    visible,
    message = "Loading...",
    icon = "home",
    color: customColor
}: LoadingOverlayProps) => {
    const { isDark } = useTheme();
    const logoScale = useSharedValue(1);
    const color = customColor || Colors.primary.main;

    useEffect(() => {
        if (visible) {
            logoScale.value = withRepeat(
                withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            logoScale.value = 1;
        }
    }, [visible]);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
    }));

    if (!visible) return null;

    return (
        <BlurView intensity={30} style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={styles.card}
                >
                    <Animated.View style={logoAnimatedStyle}>
                        <Feather name={icon} size={40} color={color} />
                    </Animated.View>
                    <ThemedText type="body" style={{ color, fontWeight: 'bold', marginTop: 10 }}>
                        {message}
                    </ThemedText>
                </Animated.View>
            </View>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        ...Shadows.modal,
    },
});
