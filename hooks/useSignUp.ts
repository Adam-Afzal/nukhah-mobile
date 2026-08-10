// hooks/useSignUp.ts
import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

interface SignUpData {
  account_type: 'brother' | 'sister';
  first_name: string;
  last_name: string;
  nationality: string;
  email: string;
  phone_number: string;
  password: string;
  date_of_birth: string;
}

interface SignUpResponse {
  success?: boolean;
  message?: string;
  error?: string;
  user_id?: string;
  info?: string;
}

const submitSignUp = async (signUpData: SignUpData): Promise<SignUpResponse> => {
  const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseApiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseApiKey) {
    throw new Error('Missing Supabase configuration');
  }

  console.log("Making request to sign up...");

  const response = await fetch(
    `${supabaseUrl}/functions/v1/sign-up`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseApiKey}`,
      },
      body: JSON.stringify({ signUpData }),
    }
  );

  console.log("Response status:", response.status);

  const data = await response.json();
  console.log("Response data:", data);

  if (!response.ok) {
    throw new Error(data.error || 'Sign up failed');
  }

  return data;
};

export const useSignUp = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: submitSignUp,
    onSuccess: (data) => {
      console.log("Mutation success with data:", data);

      if (data.message === 'check_email') {
        // Account already exists — generic message for security
        Alert.alert(
          'Please Check Your Email',
          data.info || 'If an account exists with this email, please check your inbox for login instructions.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/welcome'),
            },
          ]
        );
      } else if (data.success) {
        Alert.alert(
          'Welcome to Mithaq!',
          'Check your inbox and confirm your email address — you won\'t be able to log in until this is done.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/login');
              },
            },
          ]
        );
      }
    },
    onError: (error: Error) => {
      console.error('Sign up error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to sign up. Please check your connection and try again.'
      );
    },
  });
};
