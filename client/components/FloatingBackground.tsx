import React, { useEffect } from 'react';
import { View, Dimensions, DimensionValue } from 'react-native';
import Animated, {
    useSharedValue,
    withRepeat,
    withTiming,
    withDelay,
    useAnimatedStyle,
    Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface FloatingWidgetProps {
    size: number;
    color: string;
    top?: DimensionValue;
    left?: DimensionValue;
    right?: DimensionValue;
    bottom?: DimensionValue;
    delay?: number;
    duration?: number;
    opacity?: number;
}

const FloatingWidget = ({ size, color, top, left, right, bottom, delay = 0, duration = 3000, opacity = 0.1 }: FloatingWidgetProps) => {
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withRepeat(
                withTiming(-20, { duration, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    top,
                    left,
                    right,
                    bottom,
                    opacity
                },
                animatedStyle
            ]}
        />
    );
};

export const FloatingBackground = ({ primaryColor, secondaryColor }: { primaryColor: string, secondaryColor: string }) => {
    return (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
            <FloatingWidget size={150} color={primaryColor} top={100} left={-50} duration={4000} />
            <FloatingWidget size={100} color={secondaryColor} top={400} left={width - 50} delay={1000} duration={3500} />
            <FloatingWidget size={120} color={primaryColor} top={height - 200} left={width - 100} delay={500} duration={4500} />
        </View>
    );
};
