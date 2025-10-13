import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Animated, Easing, Image } from 'react-native';
import LaunchScreen from '../components/LaunchScreen';

interface Props {
  navigation: any;
}

export default function SplashScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Après 2.5 secondes, naviguer vers l'onboarding
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Onboarding' }],
        });
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          StyleSheet.absoluteFillObject,
          { opacity }
        ]}
      >
        <LaunchScreen width={width} height={height} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1FFF3',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a5d3a',
  },
});


