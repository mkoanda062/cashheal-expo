import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated, Easing } from 'react-native';

interface Props {
  navigation: any;
}

export default function SplashScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const logoSize = Math.min(width, height) * 0.8; // 80% du côté le plus court
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const pulseLoopRef = useRef<any>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 10,
        stiffness: 120,
        mass: 0.7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // subtle pulse while waiting
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.04,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoopRef.current.start();
    });

    const timer = setTimeout(() => {
      // stop pulse and fade out before navigating
      if (pulseLoopRef.current) {
        pulseLoopRef.current.stop();
      }
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('Home');
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/ecrandelancement.png')}
        style={[
          styles.logo,
          { width: logoSize, height: logoSize, opacity, transform: [{ scale }] },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // width/height définis dynamiquement via useWindowDimensions
  },
});


