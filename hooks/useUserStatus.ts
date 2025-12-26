// hooks/useUserStatus.ts (UPDATED VERSION)
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface UserStatus {
  status: 'pending' | 'approved' | 'rejected';
  hasProfile: boolean;
  paid: boolean;
  accountType: 'brother' | 'sister' | null;
  onboardingCompleted: boolean;
  hasMasjidAffiliation: boolean;
  hasReferences: boolean;
}

export function useUserStatus() {
  return useQuery({
    queryKey: ['userStatus'],
    queryFn: async (): Promise<UserStatus> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      // Check brother application
      const { data: brotherApp, error: brotherError } = await supabase
        .from('brother_application')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single

      if (brotherApp) {
        // Check if brother profile exists
        const { data: brotherProfile } = await supabase
          .from('brother')
          .select('id, masjid_id, is_masjid_affiliated')
          .eq('user_id', user.id)
          .single();

        let hasMasjidAffiliation = false;
        let hasReferences = false;

        if (brotherProfile) {
          // Check if masjid affiliation is set (either affiliated or explicitly not affiliated)
          hasMasjidAffiliation = brotherProfile.is_masjid_affiliated !== null;

          // Check if they have at least 1 reference
          const { count: refCount } = await supabase
            .from('reference')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', brotherProfile.id)
            .eq('user_type', 'brother');

          hasReferences = (refCount || 0) >= 1;
        }

        const onboardingCompleted = hasMasjidAffiliation && hasReferences;

        return {
          status: brotherApp.status as 'pending' | 'approved' | 'rejected',
          hasProfile: !!brotherProfile,
          paid: true, // For now, always true - you can add payment logic later
          accountType: 'brother',
          onboardingCompleted,
          hasMasjidAffiliation,
          hasReferences,
        };
      }

      // Check sister application
      const { data: sisterApp, error: sisterError } = await supabase
        .from('sister_application')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single

      if (sisterApp) {
        // Check if sister profile exists
        const { data: sisterProfile } = await supabase
          .from('sister')
          .select('id, masjid_id, is_masjid_affiliated')
          .eq('user_id', user.id)
          .single();

        let hasMasjidAffiliation = false;
        let hasReferences = false;

        if (sisterProfile) {
          // Check if masjid affiliation is set
          hasMasjidAffiliation = sisterProfile.is_masjid_affiliated !== null;

          // Check if they have at least 1 reference
          const { count: refCount } = await supabase
            .from('reference')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', sisterProfile.id)
            .eq('user_type', 'sister');

          hasReferences = (refCount || 0) >= 1;
        }

        const onboardingCompleted = hasMasjidAffiliation && hasReferences;

        return {
          status: sisterApp.status as 'pending' | 'approved' | 'rejected',
          hasProfile: !!sisterProfile,
          paid: true, // For now, always true
          accountType: 'sister',
          onboardingCompleted,
          hasMasjidAffiliation,
          hasReferences,
        };
      }

      throw new Error('No application found');
    },
    retry: false, // Don't retry on error
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}