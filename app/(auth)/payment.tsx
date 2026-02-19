// app/(auth)/payment.tsx
import {
  getOfferings,
  purchaseMonthly,
  restorePurchases,
} from '@/lib/paymentService';
import { queryClient } from '@/lib/queryClient';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function PaymentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [priceString, setPriceString] = useState('$9.99/month');

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

  const handleSubscribe = async () => {
    setPurchasing(true);
    try {
      const success = await purchaseMonthly();
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['userStatus'] });
        router.replace('/(onboarding)/profile-setup');
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
        queryClient.invalidateQueries({ queryKey: ['userStatus'] });
        Alert.alert('Restored', 'Your subscription has been restored.', [
          { text: 'OK', onPress: () => router.replace('/(onboarding)/profile-setup') },
        ]);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top gradient section */}
      <LinearGradient
        colors={['#070A12', '#1E2A3B', 'rgba(242, 204, 102, 0.3)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topGradient}
      >
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
                <Text style={styles.benefitText}>Imam-verified community members</Text>
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
  topGradient: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
