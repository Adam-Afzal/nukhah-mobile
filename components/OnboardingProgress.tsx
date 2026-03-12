import { StyleSheet, Text, View } from 'react-native';

const STEPS = ['Payment', 'Profile', 'Masjid', 'Reference'];

interface Props {
  currentStep: 1 | 2 | 3 | 4;
}

export default function OnboardingProgress({ currentStep }: Props) {
  return (
    <View style={styles.container}>
      {STEPS.map((label, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <View key={step} style={styles.stepWrapper}>
            <View style={styles.stepRow}>
              {/* Connector line before (except first) */}
              {index > 0 && (
                <View style={[styles.line, isCompleted && styles.lineActive]} />
              )}

              {/* Circle */}
              <View style={[
                styles.circle,
                isCompleted && styles.circleCompleted,
                isActive && styles.circleActive,
              ]}>
                {isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                    {step}
                  </Text>
                )}
              </View>

              {/* Connector line after (except last) */}
              {index < STEPS.length - 1 && (
                <View style={[styles.line, isCompleted && styles.lineActive]} />
              )}
            </View>

            <Text style={[
              styles.label,
              isActive && styles.labelActive,
              isCompleted && styles.labelCompleted,
            ]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 8,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#E7EAF0',
  },
  lineActive: {
    backgroundColor: '#F2CC66',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E7EAF0',
    backgroundColor: '#F7F8FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleActive: {
    borderColor: '#F2CC66',
    backgroundColor: '#F2CC66',
  },
  circleCompleted: {
    borderColor: '#F2CC66',
    backgroundColor: '#F2CC66',
  },
  stepNumber: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#7B8799',
  },
  stepNumberActive: {
    color: '#070A12',
  },
  checkmark: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#070A12',
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#7B8799',
    marginTop: 6,
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: '#070A12',
  },
  labelCompleted: {
    color: '#F2CC66',
  },
});
