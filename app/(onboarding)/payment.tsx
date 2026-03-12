// app/(onboarding)/payment.tsx
import OnboardingProgress from '@/components/OnboardingProgress';
import { getOfferings, purchaseMonthly, restorePurchases } from '@/lib/paymentService';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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

const TIER_FEATURES = [
  'Browse profiles of brothers & sisters',
  'Express interest and receive matches',
  'Wali contact revealed on acceptance',
  'Verified by your local imam community',
];

export default function PaymentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: userStatus } = useUserStatus();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState<string | null>(null);

  useEffect(() => {
    // Load price from RevenueCat offerings
    getOfferings().then(offering => {
      const price = offering?.monthly?.product?.priceString;
      if (price) setMonthlyPrice(price);
    });
  }, []);

  const handleContinue = () => {
    router.replace('/(onboarding)/profile-intro');
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      const success = await purchaseMonthly();
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['userStatus'] });
        router.replace('/(onboarding)/profile-intro');
      }
    } catch (error: any) {
      if (error?.userCancelled) return;
      Alert.alert('Purchase Failed', error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['userStatus'] });
        router.replace('/(onboarding)/profile-intro');
      } else {
        Alert.alert('No Purchase Found', 'No previous subscription was found for this account.');
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error?.message || 'Could not restore purchases.');
    } finally {
      setIsRestoring(false);
    }
  };

  const isTestingMode = userStatus?.testingMode === true;

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={1} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Testing mode banner */}
        {isTestingMode && (
          <View style={styles.testingBanner}>
            <Text style={styles.testingBannerIcon}>🧪</Text>
            <Text style={styles.testingBannerText}>
              Testing mode is active — payment is being skipped
            </Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>Begin your journey</Text>
          <Text style={styles.subtitle}>
            A monthly subscription keeps Mithaq running and ensures every member is serious about finding a spouse.
          </Text>
        </View>

        {/* Pricing card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.planName}>Mithaq Membership</Text>
            <View style={styles.priceBadge}>
              <Text style={styles.price}>{monthlyPrice ?? '...'}</Text>
              <Text style={styles.pricePeriod}> / month</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.features}>
            {TIER_FEATURES.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Restore link */}
        {!isTestingMode && (
          <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={styles.restoreButton}>
            {isRestoring
              ? <ActivityIndicator size="small" color="#7B8799" />
              : <Text style={styles.restoreText}>Restore previous purchase</Text>
            }
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          Subscription renews monthly. Cancel anytime from your device settings.
        </Text>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomContainer}>
        {isTestingMode ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>Continue (skipping payment)</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, isPurchasing && styles.buttonDisabled]}
            onPress={handlePurchase}
            disabled={isPurchasing}
          >
            {isPurchasing
              ? <ActivityIndicator color="#070A12" />
              : <Text style={styles.primaryButtonText}>Subscribe {monthlyPrice ? `· ${monthlyPrice}/mo` : ''}</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 120,
  },
  testingBanner: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#F2CC66',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  testingBannerIcon: {
    fontSize: 18,
  },
  testingBannerText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#856404',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 32,
    lineHeight: 43,
    color: '#070A12',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#7B8799',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 20,
  },
  planName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 16,
    color: '#7B8799',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 40,
    lineHeight: 48,
    color: '#070A12',
  },
  pricePeriod: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#7B8799',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7EAF0',
    marginBottom: 20,
  },
  features: {
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureCheck: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#F2CC66',
    lineHeight: 20,
  },
  featureText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#070A12',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  restoreText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#7B8799',
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E7EAF0',
  },
  primaryButton: {
    backgroundColor: '#F2CC66',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 19,
    color: '#070A12',
    fontStyle: 'italic',
  },
});
