// app/login.tsx
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      // Success - navigation will be handled by auth state listener
      console.log('Login successful');
      router.replace('/(auth)');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again.'
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
    colors={['#070A12', '#1E2A3B', 'rgba(242, 204, 102, 0.3)']}
    start={{ x: 0, y: 0 }}
    end={{ x: 0.5, y: 1 }}
    locations={[0.0058, 0.4534, 0.9011]}
    style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to check your application status</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              placeholderTextColor="#7B8799"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#7B8799"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F2CC66', '#F2CC66']}
              style={styles.loginButtonGradient}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Logging in...' : 'Log In'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => {
              // TODO: Implement forgot password
              Alert.alert('Forgot Password', 'Password reset functionality coming soon');
            }}
          >
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Apply Link */}
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => router.push('/(application)')}
          >
            <Text style={styles.applyButtonText}>
              Don't have an account? <Text style={styles.applyButtonTextBold}>Apply Now</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 28,
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#F2CC66',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 40,
    color: '#F2CC66',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#F7E099',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#F7E099',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  loginButton: {
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  loginButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#070A12',
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#F7E099',
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(231, 234, 240, 0.3)',
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
    marginHorizontal: 16,
  },
  applyButton: {
    alignSelf: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#F7E099',
  },
  applyButtonTextBold: {
    fontFamily: 'Inter_600SemiBold',
    color: '#F2CC66',
  },
});