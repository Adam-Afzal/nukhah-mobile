// app/splash.tsx
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const CrownIcon = () => (
  <Svg width={58} height={56} viewBox="0 0 58 56" fill="none">
    {/* Crown base */}
    <Path
      d="M0 40 L58 40 L58 44 L0 44 Z"
      fill="#F2CC66"
    />
    {/* Crown body */}
    <Path
      d="M2 20 L10 38 L48 38 L56 20 L40 32 L29 8 L18 32 Z"
      fill="#F2CC66"
    />
    {/* Left point highlight */}
    <Path
      d="M5 24 L10 36 L15 28"
      stroke="#F7E099"
      strokeWidth={2}
      fill="none"
    />
    {/* Right point highlight */}
    <Path
      d="M43 28 L48 36 L53 24"
      stroke="#F7E099"
      strokeWidth={2}
      fill="none"
    />
    {/* Center highlight */}
    <Path
      d="M24 16 L29 12 L34 16"
      stroke="#F7E099"
      strokeWidth={2}
      fill="none"
    />
  </Svg>
);

const LoadingDots = () => (
  <View style={styles.dotsContainer}>
    <View style={[styles.dot, styles.dot1]} />
    <View style={[styles.dot, styles.dot2]} />
    <View style={[styles.dot, styles.dot3]} />
  </View>
);

export default function SplashScreen() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleNavigation = async () => {
      // Wait at least 2.5 seconds for splash animation
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Check auth state
      const { data: { session } } = await supabase.auth.getSession();

      if (isNavigating) return; // Prevent double navigation
      setIsNavigating(true);

      if (session) {
        // User is logged in → Go to auth routes (will handle further routing)
        router.replace('/(auth)');
      } else {
        // User is NOT logged in → Go to welcome
        router.replace('/welcome');
      }
    };

    handleNavigation();
  }, []);

  return (
    <LinearGradient
      colors={['#070A12', '#1E2A3B', 'rgba(242, 204, 102, 0.3)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      locations={[0.0058, 0.4534, 0.9011]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Crown Logo */}
        <View style={styles.logoContainer}>
          <CrownIcon />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Nukhbah</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Where high value brothers meet high value sisters
        </Text>

        {/* Loading Dots */}
        <LoadingDots />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.16,
  },
  logoContainer: {
    marginBottom: 32,
  },
  appName: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 60,
    lineHeight: 80,
    textAlign: 'center',
    color: '#F2CC66',
    marginBottom: 16,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    color: '#F7E099',
    marginBottom: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F2CC66',
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
});