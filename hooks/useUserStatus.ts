// hooks/useUserStatus.ts
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface UserStatus {
  hasProfile: boolean;
  paid: boolean;
  accountType: 'brother' | 'sister' | null;
  onboardingCompleted: boolean;
  hasMasjidAffiliation: boolean;
  hasReferences: boolean;
  testingMode: boolean;
}

export function useUserStatus() {
  return useQuery({
    queryKey: ['userStatus'],
    queryFn: async (): Promise<UserStatus> => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No user found');
      }

      // Check testing mode
      const { data: appSettings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'testing_mode')
        .maybeSingle();
      const testingMode = appSettings?.value === true || appSettings?.value === 'true';

      // account_type is set at Sign Up (hooks/useSignUp.ts, via the sign-up edge function).
      // application_type is the equivalent key for accounts created before the Application
      // system was removed — same idea, different name.
      const accountType = (user.user_metadata?.account_type ?? user.user_metadata?.application_type ?? null) as 'brother' | 'sister' | null;

      if (!accountType) {
        throw new Error('No account type found');
      }

      const table = accountType === 'brother' ? 'brother' : 'sister';

      const { data: profile } = await supabase
        .from(table)
        .select('id, masjid_id, is_masjid_affiliated, references_skipped')
        .eq('user_id', user.id)
        .maybeSingle();

      // Check subscription status
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('subscribed')
        .eq('user_id', user.id)
        .maybeSingle();

      const paid = subscriber?.subscribed === true;

      let hasMasjidAffiliation = false;
      let hasReferences = false;

      if (profile) {
        // Check if masjid affiliation is set (either affiliated or explicitly not affiliated)
        hasMasjidAffiliation = profile.is_masjid_affiliated !== null;

        // Check if they have at least 1 reference
        const { count: refCount } = await supabase
          .from('reference')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('user_type', accountType);

        hasReferences = (refCount || 0) >= 1 || profile.references_skipped === true;
      }

      const onboardingCompleted = hasMasjidAffiliation && hasReferences;

      return {
        hasProfile: !!profile,
        paid,
        accountType,
        onboardingCompleted,
        hasMasjidAffiliation,
        hasReferences,
        testingMode,
      };
    },
    retry: false, // Don't retry on error
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
