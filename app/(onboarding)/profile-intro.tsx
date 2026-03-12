// app/(onboarding)/profile-intro.tsx
import OnboardingProgress from '@/components/OnboardingProgress';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const TIPS = [
  {
    icon: '✍️',
    title: 'Be honest and specific',
    body: 'Vague answers reduce matches. Write as if you are speaking directly to your future spouse.',
  },
  {
    icon: '🕌',
    title: 'Your deen comes first',
    body: 'Brothers and sisters read your deen, lifestyle, and spouse criteria first. Make them count.',
  },
  {
    icon: '🔄',
    title: 'You can always update',
    body: 'Your profile is never locked. Return to settings any time to refine what you have written.',
  },
];

export default function ProfileIntroScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={2} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Build your profile</Text>
          <Text style={styles.subtitle}>
            Your profile is how brothers and sisters get to know you before expressing interest. Take your time with it.
          </Text>
        </View>

        <View style={styles.tips}>
          {TIPS.map((tip, i) => (
            <View key={i} style={styles.tipCard}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <View style={styles.tipText}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipBody}>{tip.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/(onboarding)/profile-setup')}
        >
          <Text style={styles.primaryButtonText}>Let&apos;s build it</Text>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={styles.arrow}>
            <Path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="#070A12"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  header: {
    marginBottom: 36,
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
  tips: {
    gap: 16,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  tipIcon: {
    fontSize: 24,
    lineHeight: 32,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: '#070A12',
    marginBottom: 4,
  },
  tipBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#7B8799',
  },
  bottomContainer: {
    paddingHorizontal: 28,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: '#F7F8FB',
    borderTopWidth: 1,
    borderTopColor: '#E7EAF0',
  },
  primaryButton: {
    backgroundColor: '#F2CC66',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 19,
    color: '#070A12',
    fontStyle: 'italic',
  },
  arrow: {
    marginTop: 1,
  },
});
