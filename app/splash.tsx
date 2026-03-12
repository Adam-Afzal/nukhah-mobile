// app/splash.tsx
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

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
        {/* App Icon */}
        <View style={styles.logoContainer}>
          <Image source={require('../assets/splash.png')} style={styles.icon} />
        </View>

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
  icon: {
    width: 180,
    height: 180,
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