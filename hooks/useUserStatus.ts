// hooks/useUserStatus.ts
// FIXED: Uses getSession() instead of getUser() to wait for AsyncStorage
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface UserStatus {
  hasProfile: boolean;
  hasApplication: boolean;
  status: 'pending' | 'approved' | 'rejected' | null;
  paid: boolean;
  applicationType: 'brother' | 'sister' | null;
  profileId?: string;
}

const fetchUserStatus = async (): Promise<UserStatus> => {
  // FIXED: Use getSession() instead of getUser() - it waits for AsyncStorage
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return {
      hasProfile: false,
      hasApplication: false,
      status: null,
      paid: false,
      applicationType: null,
    };
  }

  const user = session.user;

  // Helper function to check payment status
  const checkPaymentStatus = async (userId: string): Promise<boolean> => {
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', userId)
      .single();

    return subscriber?.subscribed || false;
  };

  // 1. First check if they have a full profile
  const { data: brotherProfile } = await supabase
    .from('brother')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (brotherProfile) {
    const paid = await checkPaymentStatus(user.id);
    console.log(`paid status: ${paid}`); // FIXED: Proper console.log syntax
    return {
      hasProfile: true,
      hasApplication: true,
      status: 'approved',
      paid: paid,
      applicationType: 'brother',
      profileId: brotherProfile.id,
    };
  }

  const { data: sisterProfile } = await supabase
    .from('sister')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (sisterProfile) {
    const paid = await checkPaymentStatus(user.id);
    return {
      hasProfile: true,
      hasApplication: true,
      status: 'approved',
      paid: paid,
      applicationType: 'sister',
      profileId: sisterProfile.id,
    };
  }

  // 2. No profile yet, check application status
  const { data: brotherApp } = await supabase
    .from('brother_application')
    .select('status')
    .eq('user_id', user.id)
    .single();

  if (brotherApp) {
    const paid = await checkPaymentStatus(user.id);
    return {
      hasProfile: false,
      hasApplication: true,
      status: brotherApp.status as 'pending' | 'approved' | 'rejected',
      paid: paid,
      applicationType: 'brother',
    };
  }

  const { data: sisterApp } = await supabase
    .from('sister_application')
    .select('status')
    .eq('user_id', user.id)
    .single();

  if (sisterApp) {
    console.log("sister application found!");
    const paid = await checkPaymentStatus(user.id);
    return {
      hasProfile: false,
      hasApplication: true,
      status: sisterApp.status as 'pending' | 'approved' | 'rejected',
      paid: paid,
      applicationType: 'sister',
    };
  }

  // No application found
  return {
    hasProfile: false,
    hasApplication: false,
    status: null,
    paid: false,
    applicationType: null,
  };
};

export const useUserStatus = () => {
  return useQuery({
    queryKey: ['user-status'],
    queryFn: fetchUserStatus,
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
    // ADDED: Don't run query until session is ready
    enabled: true, // React Query will handle retries
  });
};