import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const CrownIcon = () => (
  <Svg width={56} height={56} viewBox="0 0 58 56" fill="none">
    {/* Crown base */}
    <Path
      d="M0 40 L58 40 L58 44 L0 44 Z"
      fill="#F2CC66"
    />
    {/* Crown body */}
    <Path
      d="M2 20 L10 38 L48 38 L56 20 L40 32 L29 8 L18 32 Z"
      fill="#F2CC66"
    />
    {/* Left point highlight */}
    <Path
      d="M5 24 L10 36 L15 28"
      stroke="#F7E099"
      strokeWidth={2}
      fill="none"
    />
    {/* Right point highlight */}
    <Path
      d="M43 28 L48 36 L53 24"
      stroke="#F7E099"
      strokeWidth={2}
      fill="none"
    />
    {/* Center highlight */}
    <Path
      d="M24 16 L29 12 L34 16"
      stroke="#F7E099"
      strokeWidth={2}
      fill="none"
    />
  </Svg>
);

export default function WelcomeScreen() {
  const router = useRouter();

  const handleApply = () => {
    // TODO: Navigate to apply/registration screen
    router.push('/(application)');
  };

  const handleLogin = () => {
    // TODO: Navigate to login screen
    router.push('/login');
  };

  return (
    <LinearGradient
      colors={['#070A12', '#1E2A3B', 'rgba(242, 204, 102, 0.3)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      locations={[0.0058, 0.4534, 0.9011]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Crown Logo */}
        <View style={styles.logoContainer}>
          <CrownIcon />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Nukhbah</Text>

        {/* Main Tagline */}
        <Text style={styles.tagline}>
          Where high value brothers meet high value sisters
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Exclusive, curated matchmaking for high-performing Muslims
        </Text>

        {/* Buttons Container */}
        <View style={styles.buttonsContainer}>
          {/* Apply Button */}
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F2CC66', '#F2CC66']}
              style={styles.applyButtonGradient}
            >
              <Text style={styles.applyButtonText}>Apply for Membership</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Text */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Membership applications are carefully reviewed
          </Text>
          <Text style={styles.footerText}>
            to maintain our community standards
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
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
  appName: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 56,
    lineHeight: 75,
    textAlign: 'center',
    color: '#F2CC66',
    marginBottom: 16,
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
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flex: 1,
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