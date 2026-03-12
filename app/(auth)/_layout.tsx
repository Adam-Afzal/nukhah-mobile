// app/(auth)/_layout.tsx
import { useUserStatus } from '@/hooks/useUserStatus';
import { supabase } from '@/lib/supabase';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { data: userStatus, isLoading, isError, error } = useUserStatus();
  const rawSegments = useSegments();
  const segments = [...rawSegments];
  const router = useRouter();
  const isNavigatingRef = useRef(false);

  // Handle error state - redirect to welcome/login
  useEffect(() => {
    if (isError) {
      console.log('Error loading user status:', error);
      console.log('Logging out and redirecting to welcome');
      
      // Clear auth and redirect
      supabase.auth.signOut().then(() => {
        router.replace('/welcome');
      });
    }
  }, [isError, error]);

  useEffect(() => {
    if (isLoading || !userStatus || isNavigatingRef.current) return;

    // Don't redirect if we've navigated outside the (auth) group
    if (segments[0] !== '(auth)') return;

    const currentPage = segments.length > 1 ? segments[1] : undefined;

    // Check application status first
    if (userStatus.status === 'rejected') {
      if (currentPage !== 'application-rejected') {
        isNavigatingRef.current = true;
        router.replace('/(auth)/application-rejected');
        setTimeout(() => { isNavigatingRef.current = false; }, 100);
      }
      return;
    }

    if (userStatus.status === 'pending') {
      console.log("pending!")
      if (currentPage !== 'pending-approval') {
        isNavigatingRef.current = true;
        router.replace('/(auth)/pending-approval');
        setTimeout(() => { isNavigatingRef.current = false; }, 100);
      }
      return;
    }

    // Status is 'approved' — route through onboarding steps in order
    const inOnboarding = segments[0] === '(onboarding)';
    const onboardingPage = inOnboarding ? segments[1] : null;

    const navigate = (path: string) => {
      isNavigatingRef.current = true;
      router.replace(path as any);
      setTimeout(() => { isNavigatingRef.current = false; }, 100);
    };

    // Step 1: Payment (skipped if testing mode is on or already paid)
    if (!userStatus.paid && !userStatus.testingMode) {
      if (onboardingPage !== 'payment') {
        console.log('Not paid, no testing mode → payment');
        navigate('/(onboarding)/payment');
      }
      return;
    }

    // Step 2: Profile setup (profile-intro leads directly into profile-setup)
    if (!userStatus.hasProfile) {
      const profilePages = ['profile-intro', 'profile-setup'];
      if (!profilePages.includes(onboardingPage || '')) {
        console.log('No profile → profile-intro');
        navigate('/(onboarding)/profile-intro');
      }
      return;
    }

    // Step 3: Masjid affiliation
    if (!userStatus.hasMasjidAffiliation) {
      if (onboardingPage !== 'masjid-affiliation') {
        console.log('No masjid affiliation → masjid-affiliation');
        navigate('/(onboarding)/masjid-affiliation');
      }
      return;
    }

    // Step 4: Reference (required before accessing main app)
    if (!userStatus.hasReferences) {
      if (onboardingPage !== 'references') {
        console.log('No references → references');
        navigate('/(onboarding)/references');
      }
      return;
    }

    // All steps complete → main app
    if (
      inOnboarding ||
      currentPage === 'pending-approval' ||
      currentPage === 'application-rejected' ||
      currentPage === 'application-approved'
    ) {
      console.log('Onboarding complete → main app');
      navigate('/(auth)');
    }
  }, [userStatus, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070A12' }}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}