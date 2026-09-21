// app/(auth)/payment.tsx
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { acceptInterest, expressInterest, rejectInterest } from '@/lib/interestService';
import {
  getOfferings,
  purchaseMonthly,
  restorePurchases,
} from '@/lib/paymentService';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Pending action this screen was launched to unblock — set by the "Get
// Membership" prompts in profile/[id].tsx when the interest-action gate
// stops a user with no active subscription. Absent when this screen is
// reached some other way (e.g. a future Settings "Upgrade" entry point).
type PendingAction =
  | { action: 'express'; profileId: string; currentUserId: string; accountType: 'brother' | 'sister'; recipientType: 'brother' | 'sister' }
  | { action: 'accept'; profileId: string; receivedInterestId: string }
  | { action: 'reject'; profileId: string; receivedInterestId: string };

// subscribers.subscribed is only updated once the RevenueCat webhook lands
// (supabase/functions/revenuecat-webhook), which happens asynchronously
// after purchaseMonthly() already resolved — poll briefly rather than
// immediately retrying the gated action against a stale row.
async function waitForSubscribed(maxAttempts = 5, delayMs = 1500): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data } = await supabase
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.subscribed === true) return true;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return false;
}

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    action?: 'express' | 'accept' | 'reject';
    profileId?: string;
    currentUserId?: string;
    accountType?: 'brother' | 'sister';
    recipientType?: 'brother' | 'sister';
    receivedInterestId?: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [priceString, setPriceString] = useState('£14.99/month');

  const pendingAction: PendingAction | null =
    params.action === 'express' && params.profileId && params.currentUserId && params.accountType && params.recipientType
      ? { action: 'express', profileId: params.profileId, currentUserId: params.currentUserId, accountType: params.accountType, recipientType: params.recipientType }
      : (params.action === 'accept' || params.action === 'reject') && params.profileId && params.receivedInterestId
      ? { action: params.action, profileId: params.profileId, receivedInterestId: params.receivedInterestId }
      : null;

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const offering = await getOfferings();
      if (offering?.monthly) {
        setPriceString(
          `${offering.monthly.product.priceString}/month`
        );
      }
    } catch (error) {
      console.error('Failed to load offerings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Returns to the profile screen the gate interrupted (if any), and
  // re-attempts the action that got blocked now that the purchase is
  // confirmed. Falls through to a plain "try again" message if the
  // subscribers row still hasn't synced within the poll window.
  const finalizeAndResume = async () => {
    queryClient.setQueryData(['userStatus'], (old: any) =>
      old ? { ...old, paid: true } : old
    );

    if (!pendingAction) {
      router.replace('/(auth)');
      return;
    }

    setFinalizing(true);
    const confirmed = await waitForSubscribed();
    queryClient.invalidateQueries({ queryKey: ['userStatus'] });
    setFinalizing(false);

    if (!confirmed) {
      Alert.alert(
        'Almost there',
        "Your payment was successful, but it's still finalizing. Please try again in a moment.",
        [{ text: 'OK', onPress: () => router.replace({ pathname: '/(auth)/profile/[id]', params: { id: pendingAction.profileId } }) }]
      );
      return;
    }

    let result: { success: boolean; error?: string };
    if (pendingAction.action === 'express') {
      result = await expressInterest(pendingAction.currentUserId, pendingAction.accountType, pendingAction.profileId, pendingAction.recipientType);
    } else if (pendingAction.action === 'accept') {
      result = await acceptInterest(pendingAction.receivedInterestId);
    } else {
      result = await rejectInterest(pendingAction.receivedInterestId);
    }

    if (!result.success) {
      Alert.alert('Membership Active', result.error || "You're subscribed, but that action couldn't be completed automatically — please try again.");
    }

    router.replace({ pathname: '/(auth)/profile/[id]', params: { id: pendingAction.profileId } });
  };

  const handleSubscribe = async () => {
    setPurchasing(true);
    try {
      const success = await purchaseMonthly();
      if (success) {
        await finalizeAndResume();
      }
    } catch (error: any) {
      // Don't alert on user cancellation
      if (error?.userCancelled || error?.code === '1') return;
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        await finalizeAndResume();
      } else {
        Alert.alert('No Subscription Found', 'No active subscription was found to restore.');
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', error.message || 'Something went wrong.');
    } finally {
      setRestoring(false);
    }
  };

  if (finalizing) {
    return (
      <View style={[styles.container, styles.finalizingContainer]}>
        <ActivityIndicator size="large" color="#F2CC66" />
        <Text style={styles.finalizingText}>Finalizing your membership...</Text>
      </View>
    );
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top gradient section */}
      <LinearGradient
        colors={['#070A12', '#1E2A3B', 'rgba(242, 204, 102, 0.3)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topGradient}
      >
        <AnimatedPressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </AnimatedPressable>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.memberCircle}>
            <Text style={styles.memberIcon}>&#9734;</Text>
          </View>
        </View>

        <Text style={styles.headerTitle}>Claim Your Membership</Text>
        <Text style={styles.headerSubtitle}>
          Join a curated community of serious, marriage-minded Muslims
        </Text>
      </LinearGradient>

      {/* Bottom white section */}
      <View style={styles.bottomSection}>
        <Text style={styles.title}>Monthly Membership</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#F2CC66" style={{ marginVertical: 24 }} />
        ) : (
          <>
            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{priceString}</Text>
              <Text style={styles.priceNote}>Cancel anytime</Text>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitCheck}>&#10003;</Text>
                <Text style={styles.benefitText}>Browse verified profiles</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitCheck}>&#10003;</Text>
                <Text style={styles.benefitText}>Express interest and connect</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitCheck}>&#10003;</Text>
                <Text style={styles.benefitText}>AI-powered compatibility matching</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitCheck}>&#10003;</Text>
                <Text style={styles.benefitText}>Masjid-verified community members</Text>
              </View>
            </View>

            {/* Subscribe Button */}
            <TouchableOpacity
              style={[styles.subscribeButton, (purchasing || restoring) && styles.buttonDisabled]}
              onPress={handleSubscribe}
              disabled={purchasing || restoring}
            >
              {purchasing ? (
                <ActivityIndicator color="#F2CC66" />
              ) : (
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              )}
            </TouchableOpacity>

            {/* Restore */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={purchasing || restoring}
            >
              {restoring ? (
                <ActivityIndicator color="#7B8799" size="small" />
              ) : (
                <Text style={styles.restoreText}>Restore Purchases</Text>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText}>
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              Payment will be charged to your App Store or Google Play account.
              Subscription automatically renews unless cancelled at least 24 hours
              before the end of the current period.
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  contentContainer: {
    flexGrow: 1,
  },
  finalizingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  finalizingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#7B8799',
  },
  topGradient: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#F2CC66',
  },
  iconContainer: {
    marginBottom: 24,
  },
  memberCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2CC66',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  memberIcon: {
    fontSize: 36,
    color: '#070A12',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: '#F2CC66',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 20,
    color: '#F7E099',
    textAlign: 'center',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderBottomWidth: 0,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    lineHeight: 27,
    color: '#070A12',
    textAlign: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    backgroundColor: '#F8F1DA',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: '#070A12',
    marginBottom: 4,
  },
  priceNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#7B8799',
  },
  benefitsContainer: {
    marginBottom: 28,
    gap: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitCheck: {
    fontSize: 16,
    color: '#17803A',
    fontWeight: '700',
  },
  benefitText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 18,
    color: '#070A12',
  },
  subscribeButton: {
    backgroundColor: '#070A12',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 19,
    color: '#F2CC66',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  restoreText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#7B8799',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#7B8799',
    textAlign: 'center',
  },
});
