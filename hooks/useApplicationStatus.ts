// hooks/useApplicationStatus.ts

import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface ApplicationStatus {
  status: string | null;
  applicationType: 'brother' | 'sister' | null;
  applicationId?: string;
}

const fetchApplicationStatus = async (email: string): Promise<ApplicationStatus> => {
  // Check brother applications
  const { data: brotherApp, error: brotherError } = await supabase
    .from('brother_application')
    .select('id, application_status')
    .eq('email', email)
    .single();

  if (!brotherError && brotherApp) {
    return {
      status: brotherApp.application_status,
      applicationType: 'brother',
      applicationId: brotherApp.id,
    };
  }

  // Check sister applications
  const { data: sisterApp, error: sisterError } = await supabase
    .from('sister_application')
    .select('id, application_status')
    .eq('email', email)
    .single();

  if (!sisterError && sisterApp) {
    return {
      status: sisterApp.application_status,
      applicationType: 'sister',
      applicationId: sisterApp.id,
    };
  }

  // No application found
  return {
    status: null,
    applicationType: null,
  };
};

export const useApplicationStatus = (email: string | undefined) => {
  return useQuery({
    queryKey: ['application-status', email],
    queryFn: () => fetchApplicationStatus(email!),
    enabled: !!email, // Only run query if email is provided
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2,
  });
};