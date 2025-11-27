// app/(auth)/application-rejected.tsx
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ApplicationRejected() {
  const router = useRouter();
  const [reviewComments, setReviewComments] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRejectionReason();
  }, []);

  const fetchRejectionReason = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check brother application
      const { data: brotherApp } = await supabase
        .from('brother_application')
        .select('review_comments')
        .eq('user_id', user.id)
        .single();

      if (brotherApp) {
        setReviewComments(brotherApp.review_comments || '');
        setLoading(false);
        return;
      }

      // Check sister application
      const { data: sisterApp } = await supabase
        .from('sister_application')
        .select('review_comments')
        .eq('user_id', user.id)
        .single();

      if (sisterApp) {
        setReviewComments(sisterApp.review_comments || '');
      }
    } catch (error) {
      console.error('Error fetching rejection reason:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    await supabase.auth.signOut();
    router.replace('/welcome');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoDot} />
          <View style={styles.logoAccent} />
        </View>
        <Text style={styles.logoText}>Nukhbah</Text>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        {/* Icon Circle */}
        <View style={styles.iconCircle}>
          <View style={styles.iconX}>
            <View style={styles.iconXLine1} />
            <View style={styles.iconXLine2} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Application Declined</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Thank you for your interest in Nukhbah.</Text>
        <Text style={styles.subtitle}>Unfortunately, we cannot approve your application</Text>
        <Text style={styles.subtitle}>at this time.</Text>

        {/* Reason Box */}
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonTitle}>Reason for Decline</Text>
          <View style={styles.reasonBox}>
            {loading ? (
              <Text style={styles.reasonText}>Loading...</Text>
            ) : reviewComments ? (
              <Text style={styles.reasonText}>{reviewComments}</Text>
            ) : (
              <Text style={styles.reasonText}>
                Based on your responses, specifically regarding aqeedah and sources of Islamic knowledge, we found areas that do not align with the standards required for Nukhbah membership.
              </Text>
            )}
            <Text style={styles.signature}>- Nukhbah Review Team</Text>
          </View>
        </View>

        {/* What can you do section */}
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>What can you do?</Text>
          
          <View style={styles.bulletContainer}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Strengthen your Islamic knowledge</Text>
          </View>

          <View style={styles.bulletContainer}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Seek knowledge from authentic sources</Text>
          </View>

          <View style={styles.bulletContainer}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Reapply in 6 months</Text>
          </View>
        </View>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          A copy of this decision has been sent to your email
        </Text>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  logoContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    marginBottom: 8,
  },
  logoDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F2CC66',
    left: 0,
    top: 0,
  },
  logoAccent: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F7E099',
    right: 0,
    bottom: 0,
  },
  logoText: {
    fontFamily: 'PlayfairDisplay-BoldItalic',
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#070A12',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 28,
    marginTop: 40,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconX: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  iconXLine1: {
    position: 'absolute',
    width: 4,
    height: 40,
    backgroundColor: '#B7312C',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    left: 18,
  },
  iconXLine2: {
    position: 'absolute',
    width: 4,
    height: 40,
    backgroundColor: '#B7312C',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
    left: 18,
  },
  title: {
    fontFamily: 'PlayfairDisplay-BoldItalic',
    fontSize: 28,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#B7312C',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '400',
    color: '#7B8799',
    textAlign: 'center',
    lineHeight: 22,
  },
  reasonContainer: {
    width: '100%',
    marginTop: 32,
  },
  reasonTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#070A12',
    marginBottom: 12,
  },
  reasonBox: {
    backgroundColor: '#F8F1DA',
    borderRadius: 12,
    padding: 16,
  },
  reasonText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: '#070A12',
    lineHeight: 20,
    marginBottom: 12,
  },
  signature: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '100',
    fontStyle: 'italic',
    color: '#7B8799',
    marginTop: 8,
  },
  actionSection: {
    width: '100%',
    marginTop: 24,
  },
  actionTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#070A12',
    marginBottom: 16,
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F2CC66',
    marginRight: 12,
  },
  bulletText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: '#7B8799',
    flex: 1,
  },
  footerNote: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    color: '#7B8799',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  closeButton: {
    width: '100%',
    backgroundColor: '#070A12',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  closeButtonText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#F2CC66',
  },
});