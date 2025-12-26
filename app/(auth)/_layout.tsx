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

    // Status is 'approved' - now check profile and payment
    if (userStatus.hasProfile) {
      console.log("HAS PROFILE!");

      if (!userStatus.paid) {
        console.log("Has profile but not paid - going to approved screen");
        if (currentPage !== 'application-approved') {
          isNavigatingRef.current = true;
          router.replace('/(auth)/application-approved');
          setTimeout(() => { isNavigatingRef.current = false; }, 100);
        }
        return;
      }

      // They have profile AND paid
      // Now check onboarding completion status
      console.log("Profile exists and paid - checking onboarding status");
      console.log("Onboarding completed:", userStatus.onboardingCompleted);
      console.log("Has masjid affiliation:", userStatus.hasMasjidAffiliation);
      console.log("Has references:", userStatus.hasReferences);

      // If onboarding not complete, redirect to appropriate step
      if (!userStatus.onboardingCompleted) {
        // Check which step they're on
        if (!userStatus.hasMasjidAffiliation) {
          console.log("No masjid affiliation - redirecting to masjid-affiliation");
          if (currentPage !== 'masjid-affiliation' && segments[0] !== '(onboarding)') {
            isNavigatingRef.current = true;
            router.replace('/(onboarding)/masjid-affiliation');
            setTimeout(() => { isNavigatingRef.current = false; }, 100);
          }
          return;
        }

        if (!userStatus.hasReferences) {
          console.log("No references - redirecting to references");
          if (currentPage !== 'references' && segments[0] !== '(onboarding)') {
            isNavigatingRef.current = true;
            router.replace('/(onboarding)/references');
            setTimeout(() => { isNavigatingRef.current = false; }, 100);
          }
          return;
        }
      }

      // Fully complete (profile + paid + onboarding) → full access to main app
      if (
        currentPage === 'pending-approval' || 
        currentPage === 'application-rejected' ||
        currentPage === 'application-approved' ||
        currentPage === 'payment' ||
        currentPage?.startsWith('(onboarding)')
      ) {
        console.log("Onboarding complete - going to main app");
        isNavigatingRef.current = true;
        router.replace('/(auth)'); 
        setTimeout(() => { isNavigatingRef.current = false; }, 100);
      }
      return;
    }

    // No profile yet - check payment status
    console.log("Approved but no profile - checking payment status");
    if (!userStatus.paid) {
      // Approved but not paid - allow approved screen and payment screen
      const allowedPages = ['application-approved', 'payment'];
      if (!allowedPages.includes(currentPage || '')) {
        console.log("Not paid - going to approved screen");
        isNavigatingRef.current = true;
        router.replace('/(auth)/application-approved');
        setTimeout(() => { isNavigatingRef.current = false; }, 100);
      }
    } else {
      // Approved AND paid but no profile yet → show approved screen FIRST
      // User clicks "Get Started" on approved screen, which then routes to profile-setup
      const allowedPages = ['application-approved', 'profile-setup', 'masjid-affiliation', 'references'];
      
      if (!allowedPages.includes(currentPage || '') && segments[0] !== '(onboarding)') {
        console.log("Paid but no profile - going to approved screen to click Get Started");
        isNavigatingRef.current = true;
        router.replace('/(auth)/application-approved');
        setTimeout(() => { isNavigatingRef.current = false; }, 100);
      }
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