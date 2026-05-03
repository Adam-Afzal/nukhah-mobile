import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Place your video file at assets/welcome-bg.mp4
const VIDEO_SOURCE = require('../assets/welcome-bg.mov');

export default function WelcomeScreen() {
  const router = useRouter();

  const player = useVideoPlayer(VIDEO_SOURCE, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.container}>
      {/* Full-screen looping video */}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Dark gradient overlay so text remains readable */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/splash.png')} style={styles.icon} />
        </View>

        <Text style={styles.tagline}>
          Find your spouse, without stress.
        </Text>

        <Text style={styles.subtitle}>
          Matchmaking you can finally trust.
        </Text>

        <View style={styles.buttonsContainer}>
          <AnimatedPressable
            style={styles.applyButton}
            onPress={() => router.push('/(application)')}
          >
            <Text style={styles.applyButtonText}>Apply for Membership</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Membership applications are carefully reviewed
          </Text>
          <Text style={styles.footerText}>
            to maintain our community standards
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    backgroundColor: '#070A12',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 18, 0.55)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: width * 0.064,
    paddingTop: height * 0.234,
  },
  logoContainer: {
    marginBottom: 24,
  },
  icon: {
    width: 120,
    height: 120,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    color: '#F7E099',
    marginBottom: 24,
    paddingHorizontal: width * 0.06,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    textAlign: 'center',
    color: '#F7E099',
    marginBottom: 48,
    paddingHorizontal: width * 0.02,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: width * 0.064,
    gap: 24,
  },
  applyButton: {
    width: '100%',
    height: 66,
    borderRadius: 8,
    backgroundColor: '#F2CC66',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter_700Bold_Italic',
    fontSize: 16,
    lineHeight: 19,
    textAlign: 'center',
    color: '#070A12',
  },
  loginButton: {
    width: '100%',
    height: 66,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F2CC66',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loginButtonText: {
    fontFamily: 'Inter_700Bold_Italic',
    fontSize: 16,
    lineHeight: 19,
    textAlign: 'center',
    color: '#F2CC66',
  },
  footerContainer: {
    position: 'absolute',
    bottom: height * 0.134,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    color: '#F7E099',
  },
});
