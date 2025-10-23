import React, { useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar, 
  StyleSheet,
  TouchableOpacity,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import storage from '../src/utils/persistentStorage';

import Slide2A from '../assets/icons/onboarding-2a.svg';
import Slide2B from '../assets/icons/onboarding-2b.svg';
import Slide2C from '../assets/icons/onboarding-2c.svg';
import Slide2D from '../assets/icons/onboarding-2d.svg';
import Slide2E from '../assets/icons/onboarding-2e.svg';
import Slide2F from '../assets/icons/onboarding-2f.svg';

interface Props {
  navigation: any;
}

type SlideConfig = {
  key: string;
  Illustration: React.FC<any>;
  overlay?: {
    source: ImageSourcePropType;
    frame: { x: number; y: number; width: number; height: number };
  };
};

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 932;

const slides: SlideConfig[] = [
  {
    key: '2A',
    Illustration: Slide2A,
    overlay: {
      source: require('../assets/onboarding/images/slide-2a.png'),
      frame: { x: 72, y: 403.5, width: 287, height: 287 },
    },
  },
  {
    key: '2B',
    Illustration: Slide2B,
    overlay: {
      source: require('../assets/onboarding/images/slide-2b.png'),
      frame: { x: 72, y: 403, width: 287, height: 287 },
    },
  },
  { key: '2C', Illustration: Slide2C },
  { key: '2D', Illustration: Slide2D },
  { key: '2E', Illustration: Slide2E },
  {
    key: '2F',
    Illustration: Slide2F,
    overlay: {
      source: require('../assets/onboarding/images/slide-2f.png'),
      frame: { x: 72, y: 403, width: 287, height: 287 },
    },
  },
];

const HAS_COMPLETED_ONBOARDING = 'hasCompletedOnboarding';

export default function OnboardingScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scaleX = width / DESIGN_WIDTH;
  const scaleY = height / DESIGN_HEIGHT;


  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      storage.setItem(HAS_COMPLETED_ONBOARDING, 'true').catch(() => undefined);
      navigation.reset({ index: 0, routes: [{ name: 'BudgetAdvisor' }] });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#00D09E" />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {slides.map(({ key, Illustration, overlay }) => {
          const overlayStyle = overlay
            ? {
                width: overlay.frame.width * scaleX,
                height: overlay.frame.height * scaleY,
                left: overlay.frame.x * scaleX,
                top: overlay.frame.y * scaleY,
              }
            : undefined;
          const buttonWidth = Math.min(width * 0.5, 220);
          const buttonHeight = Math.max(height * 0.06, 50);
          const bottomOffset = Math.max(height * 0.18, 130);
          const computedButtonStyle = {
            width: buttonWidth,
            height: buttonHeight,
            left: (width - buttonWidth) / 2,
            bottom: bottomOffset,
            borderRadius: buttonHeight / 2,
          };

          return (
            <View key={key} style={[styles.slide, { width, height }]}>
              <Illustration width={width} height={height} preserveAspectRatio="xMidYMid meet" />
              {overlay && (
                <Image source={overlay.source} style={[styles.overlayImage, overlayStyle]} resizeMode="contain" />
              )}
              <TouchableOpacity
                style={[styles.nextOverlay, computedButtonStyle]}
                activeOpacity={0.8}
                onPress={goNext}
                accessibilityRole="button"
                accessibilityLabel="Passer à la page suivante"
              >
                <Text style={styles.nextText}>Suivant</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00D09E',
  },
  slide: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextOverlay: {
    position: 'absolute',
    backgroundColor: '#00C897',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayImage: {
    position: 'absolute',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
