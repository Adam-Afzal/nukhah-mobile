import { useRouter } from 'expo-router';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const CrownIcon = () => (
  <Svg width={48} height={46} viewBox="0 0 58 56" fill="none">
    <Path d="M0 40 L58 40 L58 44 L0 44 Z" fill="#F2CC66" />
    <Path d="M2 20 L10 38 L48 38 L56 20 L40 32 L29 8 L18 32 Z" fill="#F2CC66" />
    <Path d="M5 24 L10 36 L15 28" stroke="#F7E099" strokeWidth="2" fill="none" />
    <Path d="M43 28 L48 36 L53 24" stroke="#F7E099" strokeWidth="2" fill="none" />
    <Path d="M24 16 L29 12 L34 16" stroke="#F7E099" strokeWidth="2" fill="none" />
  </Svg>
);

// const MaleIcon = () => (
//   <Svg width="40" height="40" viewBox="0 0 50 50" fill="none">
//     <Circle cx="20" cy="20" r="18" stroke="#070A12" strokeWidth="3" fill="none" />
//     <Line x1="31" y1="9" x2="45" y2="-5" stroke="#070A12" strokeWidth="3" />
//     <Polyline points="45,-5 45,5 35,-5" stroke="#070A12" strokeWidth="3" fill="none" />
//   </Svg>
// );

// const FemaleIcon = () => (
//   <Svg width="40" height="40" viewBox="0 0 50 50" fill="none">
//     <Circle cx="20" cy="18" r="18" stroke="#F2CC66" strokeWidth="3" fill="none" />
//     <Line x1="20" y1="36" x2="20" y2="52" stroke="#F2CC66" strokeWidth="3" />
//     <Line x1="12" y1="44" x2="28" y2="44" stroke="#F2CC66" strokeWidth="3" />
//   </Svg>
// );

export default function GenderSelectionScreen() {
  const router = useRouter();

  const handleBrotherApply = () => {
    router.push('/(application)/brother');
  };

  const handleSisterApply = () => {
    router.push('/(application)/sister');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Back Button */}
          <AnimatedPressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </AnimatedPressable>

          {/* Crown Logo */}
          <View style={styles.logoContainer}>
            <CrownIcon />
          </View>

          {/* Title */}
          <Text style={styles.title}>Apply as...</Text>
          <Text style={styles.subtitle}>Choose your application type</Text>

          {/* Options Container */}
          <View style={styles.optionsContainer}>
            {/* Brother Option */}
            <AnimatedPressable
              style={styles.brotherButton}
              onPress={handleBrotherApply}
            >
              <View style={styles.brotherButtonInner}>
                <View style={styles.buttonContent}>
                  <View style={styles.textContainer}>
                    <Text style={styles.buttonTitle}>Brother</Text>
                    <Text style={styles.buttonDescription}>High-value Muslim men</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </View>
            </AnimatedPressable>

            {/* Sister Option */}
            <AnimatedPressable
              style={styles.sisterButton}
              onPress={handleSisterApply}
            >
              <View style={styles.sisterButtonInner}>
                <View style={styles.buttonContent}>
                  <View style={styles.iconContainer}>
                  
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.sisterButtonTitle}>Sister</Text>
                    <Text style={styles.sisterButtonDescription}>
                      High-value Muslim women
                    </Text>
                  </View>
                  <Text style={styles.sisterArrow}>→</Text>
                </View>
              </View>
            </AnimatedPressable>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoIconContainer}>
              <View style={styles.infoIconCircle}>
                <Text style={styles.infoIconText}>i</Text>
              </View>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Important Notice</Text>
              <Text style={styles.infoText}>
                All applications are carefully reviewed to maintain our high community standards. This process typically takes 2-5 business days.
              </Text>
            </View>
          </View>

          {/* Spacer to push footer to bottom */}
          <View style={styles.spacer} />

          {/* Footer */}
          <Text style={styles.footer}>
            Your information is encrypted and confidential
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#C9A961',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 40,
    color: '#C9A961',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#E8D7B5',
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16, // Reduced from 20
  },
  brotherButton: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#C9A961',
  },
  brotherButtonInner: {
    flex: 1,
    padding: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 16, // Reduced from 20
  },
  textContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 28,
    color: '#0A0E1A',
    marginBottom: 4,
  },
  buttonDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#1A1F2E',
  },
  arrow: {
    fontFamily: 'Inter_400Regular',
    fontSize: 24,
    color: '#0A0E1A',
  },
  sisterButton: {
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    borderWidth: 1,
    borderColor: '#C9A961',
  },
  sisterButtonInner: {
    flex: 1,
    padding: 20,
  },
  sisterButtonTitle: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 28,
    color: '#C9A961',
    marginBottom: 4,
  },
  sisterButtonDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#E8D7B5',
  },
  sisterArrow: {
    fontFamily: 'Inter_400Regular',
    fontSize: 24,
    color: '#C9A961',
  },
  infoBox: {
    marginTop: 24,
    flexDirection: 'row',
    backgroundColor: 'rgba(201, 169, 97, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
    borderRadius: 8,
    padding: 16,
  },
  infoIconContainer: {
    marginRight: 12, // Reduced from 16
  },
  infoIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C9A961',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIconText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#C9A961',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#E8D7B5',
    marginBottom: 6,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#E8D7B5',
    lineHeight: 16,
  },
  spacer: {
    flex: 1, // Pushes footer to bottom
  },
  footer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11, // Reduced from 12
    color: '#7B8799',
    textAlign: 'center',
    paddingBottom: 8,
  },
});