// app/_layout.tsx - UPDATED WITH IMAM ROUTING + PAYMENT INIT
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializePayments } from '@/lib/paymentService';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

// Import Google Fonts
import {
  Inter_400Regular,
  Inter_400Regular_Italic,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_700Bold_Italic,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isImam, setIsImam] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_400Regular_Italic,
    Inter_700Bold_Italic,
  });

  // Listen to auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session?.user?.id) {
        initializePayments(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsImam(null); // Reset imam status when auth changes
      queryClient.clear(); // Clear stale cache when user changes
      if (session?.user?.id) {
        initializePayments(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if user is imam when session loads
  useEffect(() => {
    if (!session) {
      setIsImam(null);
      return;
    }

    const checkIfImam = async () => {
      try {
        const { data: imam } = await supabase
          .from('imam')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        setIsImam(!!imam);
      } catch (error) {
        console.error('Error checking imam status:', error);
        setIsImam(false);
      }
    };

    checkIfImam();
  }, [session]);
  
  // Handle routing based on auth state (PROTECTED ROUTES)
  useEffect(() => {
    if (authLoading || !fontsLoaded) return;

    const inAuth = segments[0] === '(auth)';
    const inImam = segments[0] === '(imam)';
    
    // CRITICAL FIX: Allow public imam routes without authentication
    // Check if accessing imam login OR verify-reference pages
    const isPublicImamRoute = inImam && (
      segments.includes('login') || 
      segments.some(seg => seg?.includes('verify-reference'))
    );

    // Allow access to public imam routes without authentication
    if (isPublicImamRoute) {
      console.log('Accessing public imam route - allowing without auth check');
      return;
    }

    // Only redirect unauthenticated users trying to access OTHER protected routes
    if (!session && (inAuth || inImam)) {
      // User is NOT logged in but trying to access protected routes → Kick them out
      router.replace('/welcome');
      return;
    }

    // If user is authenticated, route based on user type
    if (session && isImam !== null) {
      // User is an imam but not in imam section
      if (isImam && !inImam) {
        router.replace('/(imam)/dashboard');
        return;
      }

      // Regular user on welcome/login screens
      if (!isImam && !inAuth && (segments[0] === 'welcome' || segments[0] === 'login' || segments[0] === 'index')) {
        router.replace('/(auth)');
        return;
      }
    }
  }, [session, segments, authLoading, fontsLoaded, isImam]);

  useEffect(() => {
    if (fontsLoaded && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authLoading]);

  if (!fontsLoaded || authLoading) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#070A12' },
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false,
              animation: 'none',
            }} 
          />
          <Stack.Screen 
            name="splash" 
            options={{ 
              headerShown: false,
              animation: 'none',
            }} 
          />
          <Stack.Screen 
            name="welcome" 
            options={{ 
              headerShown: false,
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="login" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="(application)" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="(auth)" 
            options={{ 
              headerShown: false,
              animation: 'fade',
            }} 
          />
          <Stack.Screen
            name="(imam)"
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="(onboarding)"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal', 
              title: 'Modal',
            }} 
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}