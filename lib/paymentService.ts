// lib/paymentService.ts
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically import RevenueCat
let Purchases: typeof import('react-native-purchases').default | null = null;
if (Platform.OS !== 'web') {
  Purchases = require('react-native-purchases').default;
}

export async function initializePayments(userId: string) {
  if (!Purchases) return;

  const appleKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;
  const googleKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;

  const apiKey = Platform.OS === 'ios' ? appleKey : googleKey;

  if (!apiKey || apiKey === 'appl_xxx' || apiKey === 'goog_xxx') {
    console.warn('RevenueCat API key not configured');
    return;
  }

  try {
    Purchases.configure({ apiKey });
    await Purchases.logIn(userId);
    console.log('RevenueCat initialized for user:', userId);
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
}

export async function getOfferings() {
  if (!Purchases) return null;

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
}

export async function purchaseMonthly() {
  if (!Purchases) {
    throw new Error('Purchases not available');
  }

  const offerings = await Purchases.getOfferings();
  const monthlyPackage = offerings.current?.monthly;

  if (!monthlyPackage) {
    throw new Error('Monthly package not found');
  }

  const { customerInfo } = await Purchases.purchasePackage(monthlyPackage);
  const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

  if (isPremium) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('subscribers').upsert({
        user_id: user.id,
        email: user.email,
        subscribed: true,
        provider: 'revenuecat',
        provider_customer_id: customerInfo.originalAppUserId,
        plan: 'monthly',
        subscribed_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }
  }

  return isPremium;
}

export async function restorePurchases() {
  if (!Purchases) {
    throw new Error('Purchases not available');
  }

  const customerInfo = await Purchases.restorePurchases();
  const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

  if (isPremium) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('subscribers').upsert({
        user_id: user.id,
        email: user.email,
        subscribed: true,
        provider: 'revenuecat',
        provider_customer_id: customerInfo.originalAppUserId,
        plan: 'monthly',
        subscribed_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }
  }

  return isPremium;
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('subscribers')
    .select('subscribed')
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.subscribed === true;
}

export async function getManagementUrl(): Promise<string | null> {
  if (!Purchases) return null;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.managementURL;
  } catch {
    return null;
  }
}
