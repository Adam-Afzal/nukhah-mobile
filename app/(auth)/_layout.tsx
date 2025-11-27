// app/(auth)/_layout.tsx
import { useUserStatus } from '@/hooks/useUserStatus';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { data: userStatus, isLoading } = useUserStatus();
  const rawSegments = useSegments();
  const segments = [...rawSegments];
  const router = useRouter();
  const isNavigatingRef = useRef(false);

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
      if (currentPage !== 'pending-approval') {
        isNavigatingRef.current = true;
        router.replace('/(auth)/pending-approval');
        setTimeout(() => { isNavigatingRef.current = false; }, 100);
      }
      return;
    }

    // Status is 'approved' - now check profile and payment
    if (userStatus.hasProfile) {
      console.log("HAS PROFILE!")
      
      if (!userStatus.paid) {
        console.log("Has profile but not paid - going to approved screen");
        if (currentPage !== 'application-approved') {
          isNavigatingRef.current = true;
          router.replace('/(auth)/application-approved');
          setTimeout(() => { isNavigatingRef.current = false; }, 100);
        }
        return;
      }

      // They have profile AND paid → full access to main app
      if (
        currentPage === 'pending-approval' || 
        currentPage === 'application-rejected' ||
        currentPage === 'application-approved' ||
        currentPage === 'profile-setup' ||
        currentPage === 'payment'
      ) {
        console.log("going to main app")
        isNavigatingRef.current = true;
        router.replace('/(auth)');
        setTimeout(() => { isNavigatingRef.current = false; }, 100);
      }
      return;
    }

    // No profile yet - check payment status
    console.log("Approved but no profile - checking payment status")
    
    if (!userStatus.paid) {
      // Approved but not paid - allow approved screen, payment screen, and profile-setup (for navigation)
      const allowedPages = ['application-approved', 'payment', 'profile-setup'];
      if (!allowedPages.includes(currentPage || '')) {
        console.log("Not paid - going to approved screen");
        isNavigatingRef.current = true;
        router.replace('/(auth)/application-approved');
        setTimeout(() => { isNavigatingRef.current = false; }, 100);
      }
    } else {
      // Approved AND paid but no profile yet → allow profile-setup
      if (currentPage !== 'profile-setup') {
        console.log("Paid but no profile - going to profile-setup");
        isNavigatingRef.current = true;
        router.replace('/(auth)/profile-setup');
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