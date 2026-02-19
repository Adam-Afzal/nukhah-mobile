// app/(auth)/pending-approval.tsx
// Matches Figma design exactly

import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PendingApprovalScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/welcome');
  };

  // Mock data - replace with real data from application
  const applicationId = "#NKH-2025-1147";
  const submittedDate = "Nov 7, 2025";

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon} />
          </View>
          <Text style={styles.headerTitle}>Mithaq</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⏳</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Under Review</Text>

          {/* Description */}
          <Text style={styles.description}>
            Your application is being carefully reviewed{'\n'}by the Mithaq team.
          </Text>

          {/* Info Section */}
          <View style={styles.infoSection}>
            {/* Submitted */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Submitted</Text>
              <Text style={styles.infoValue}>{submittedDate}</Text>
            </View>
            <View style={styles.divider} />

            {/* Estimated Time */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estimated Time</Text>
              <Text style={styles.infoValue}>3-5 days</Text>
            </View>
            <View style={styles.divider} />

            {/* Application ID */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Application ID</Text>
              <Text style={styles.infoValueSmall}>{applicationId}</Text>
            </View>
          </View>

          {/* What happens next */}
          <Text style={styles.sectionTitle}>What happens next?</Text>

          {/* Steps */}
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={[styles.stepDot, { backgroundColor: '#17803A' }]} />
              <Text style={styles.stepText}>Your answers will be reviewed</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepDot, { backgroundColor: '#F2CC66' }]} />
              <Text style={styles.stepText}>We'll verify your information</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepDot, { backgroundColor: '#E7EAF0' }]} />
              <Text style={styles.stepText}>You'll receive a decision via email</Text>
            </View>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleLogout}>
            <Text style={styles.closeButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Text */}
        <Text style={styles.footerText}>
          We'll send an email once your application is reviewed
        </Text>
      </ScrollView>
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
    paddingBottom: 80,
    minHeight: '100%',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#F2CC66',
    borderRadius: 15,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    color: '#070A12',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    marginHorizontal: 28,
    marginTop: 40,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#F2CC66',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 28,
    lineHeight: 37,
    textAlign: 'center',
    color: '#070A12',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 18,
    textAlign: 'center',
    color: '#7B8799',
    marginBottom: 32,
  },
  infoSection: {
    width: '100%',
    backgroundColor: '#F8F1DA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    lineHeight: 16,
    color: '#070A12',
  },
  infoValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'right',
    color: '#7B8799',
  },
  infoValueSmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'right',
    color: '#7B8799',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7EAF0',
    marginVertical: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 17,
    color: '#070A12',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  stepsList: {
    width: '100%',
    marginBottom: 32,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  stepText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 16,
    color: '#7B8799',
    flex: 1,
  },
  closeButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#070A12',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 18,
    textAlign: 'center',
    color: '#F2CC66',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    color: '#7B8799',
    marginTop: 24,
    paddingHorizontal: 44,
  },
});