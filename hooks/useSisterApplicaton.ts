// hooks/useSisterApplication.ts
import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

interface SisterApplicationData {
  first_name: string;
  last_name: string;
  nationality: string;
  email: string;
  phone_number: string;
  password: string;
  date_of_birth: string;
  has_wali: boolean;
  wali_first_name?: string;
  wali_last_name?: string;
  wali_email?: string;
  wali_phone?: string;
}

interface SubmitResponse {
  success?: boolean;
  message?: string;
  applicationId?: string;
  email?: string;
  status?: string;
  error?: string;
  user_id?: string;
  info?: string;
}

const submitSisterApplication = async (
  applicationData: SisterApplicationData
): Promise<SubmitResponse> => {
  const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseApiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseApiKey) {
    throw new Error('Missing Supabase configuration');
  }

  console.log("Making request to submit application...");

  const response = await fetch(
    `${supabaseUrl}/functions/v1/clever-task`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseApiKey}`,
      },
      body: JSON.stringify({ applicationData }),
    }
  );

  console.log("Response status:", response.status);

  // Parse the response body
  const data = await response.json();
  console.log("Response data:", data);

  if (!response.ok) {
    throw new Error(data.error || 'Submission failed');
  }

  return data;
};

export const useSisterApplication = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: submitSisterApplication,
    onSuccess: (data) => {
      console.log("Mutation success with data:", data);

      if (data.message === 'check_email') {
        // User already applied - generic message for security
        Alert.alert(
          'Please Check Your Email',
          data.info || 'If an application exists with this email, please check your inbox for login instructions.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/welcome'),
            },
          ]
        );
      } else if (data.success) {
        // New application submitted successfully
        Alert.alert(
          'Application Submitted!',
          'Your application has been submitted for review. Please check your email to confirm your account before logging in.',
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
      console.error('Submission error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit application. Please check your connection and try again.'
      );
    },
  });
};
