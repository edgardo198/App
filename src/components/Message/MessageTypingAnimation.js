import React, { useEffect, useRef, memo } from 'react';
import { Animated, Easing } from 'react-native';

const MessageTypingAnimation = memo(({ delay }) => {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const bump = 200;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, {
          toValue: 1,
          duration: bump,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: 0,
          duration: bump,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(1000 - bump * 2 - delay),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, y]);
  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        marginHorizontal: 1.5,
        borderRadius: 4,
        backgroundColor: '#606060',
        transform: [{ translateY }],
      }}
    />
  );
});

export default MessageTypingAnimation;
