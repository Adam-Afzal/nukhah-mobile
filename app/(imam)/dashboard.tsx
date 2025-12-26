// app/(imam)/dashboard.tsx - WITH VERIFICATION CHECKLIST
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface VerificationRequest {
  id: string;
  user_id: string;
  user_type: 'brother' | 'sister';
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  user_name: string;
  user_phone: string;
  user_location: string;
  reference_name: string;
  reference_relationship: string;
  reference_phone: string;
}

export default function ImamDashboardScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [imamData, setImamData] = useState<any>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  
  // Checklist modal state
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{
    id: string;
    userId: string;
    userType: 'brother' | 'sister';
    userName: string;
  } | null>(null);
  const [checklist, setChecklist] = useState({
    knowPerson: false,
    vouchCharacter: false,
  });

  useEffect(() => {
    checkImamAuth();
  }, []);

  useEffect(() => {
    if (imamData) {
      loadVerificationRequests();
    }
  }, [imamData, filter]);

  const checkImamAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/(imam)/login');
        return;
      }

      // Get imam data
      const { data: imam, error } = await supabase
        .from('imam')
        .select('*, masjid:masjid_id(*)')
        .eq('user_id', user.id)
        .single();

      if (error || !imam) {
        Alert.alert('Access Denied', 'You are not registered as an imam.');
        await supabase.auth.signOut();
        router.replace('/(imam)/login');
        return;
      }

      setImamData(imam);
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/(imam)/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVerificationRequests = async () => {
    if (!imamData) return;

    try {
      let query = supabase
        .from('imam_verification')
        .select(`
          id,
          user_id,
          user_type,
          status,
          created_at
        `)
        .eq('masjid_id', imamData.masjid_id);

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data: verifications, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Get user details and reference details for each verification
      const requestsWithUserData = await Promise.all(
        verifications.map(async (verification) => {
          // Get user profile data
          const { data: userData } = await supabase
            .from(verification.user_type)
            .select('first_name, last_name, phone, location')
            .eq('id', verification.user_id)
            .maybeSingle();

          // Get reference data (use maybeSingle to avoid errors when no reference exists)
          const { data: referenceData, error: refError } = await supabase
            .from('reference')
            .select('reference_name, reference_relationship, reference_phone')
            .eq('user_id', verification.user_id)
            .eq('user_type', verification.user_type)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (refError) {
            console.log('Error fetching reference:', refError);
          }

          return {
            ...verification,
            user_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unknown',
            user_phone: userData?.phone || 'N/A',
            user_location: userData?.location || 'N/A',
            reference_name: referenceData?.reference_name || 'No reference',
            reference_relationship: referenceData?.reference_relationship || 'N/A',
            reference_phone: referenceData?.reference_phone || 'N/A',
          };
        })
      );

      setRequests(requestsWithUserData);
    } catch (error) {
      console.error('Error loading verification requests:', error);
      Alert.alert('Error', 'Failed to load verification requests');
    }
  };

  const handleVerify = (requestId: string, userId: string, userType: 'brother' | 'sister', userName: string) => {
    setSelectedRequest({ id: requestId, userId, userType, userName });
    setChecklist({ knowPerson: false, vouchCharacter: false });
    setShowChecklistModal(true);
  };

  const confirmVerification = async () => {
    if (!checklist.knowPerson || !checklist.vouchCharacter) {
      Alert.alert('Incomplete', 'Please confirm both statements before verifying');
      return;
    }

    if (!selectedRequest) return;

    try {
      const { error: verifyError } = await supabase
        .from('imam_verification')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (verifyError) throw verifyError;

      setShowChecklistModal(false);
      setSelectedRequest(null);
      Alert.alert('Success', 'Member verified successfully');
      loadVerificationRequests();
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Error', error.message || 'Failed to verify member');
    }
  };

  const handleReject = async (requestId: string) => {
    Alert.alert(
      'Reject Verification',
      'Are you sure you want to reject this verification request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('imam_verification')
                .update({
                  status: 'rejected',
                })
                .eq('id', requestId);

              if (error) throw error;

              Alert.alert('Rejected', 'Verification request rejected');
              loadVerificationRequests();
            } catch (error: any) {
              console.error('Rejection error:', error);
              Alert.alert('Error', error.message || 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(imam)/login');
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadVerificationRequests();
    setIsRefreshing(false);
  };

  const toggleKnowPerson = useCallback(() => {
    setChecklist(prev => ({ ...prev, knowPerson: !prev.knowPerson }));
  }, []);

  const toggleVouchCharacter = useCallback(() => {
    setChecklist(prev => ({ ...prev, vouchCharacter: !prev.vouchCharacter }));
  }, []);

  const renderRequest = ({ item }: { item: VerificationRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View>
          <Text style={styles.requestName}>{item.user_name}</Text>
          <Text style={styles.requestMeta}>
            {item.user_type === 'brother' ? '👨' : '👩'} {item.user_type.charAt(0).toUpperCase() + item.user_type.slice(1)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          item.status === 'pending' && styles.statusPending,
          item.status === 'verified' && styles.statusVerified,
          item.status === 'rejected' && styles.statusRejected,
        ]}>
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone:</Text>
          <Text style={styles.detailValue}>{item.user_phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>{item.user_location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Requested:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.referenceSection}>
        <Text style={styles.referenceSectionTitle}>Character Reference</Text>
        <View style={styles.referenceDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{item.reference_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Relationship:</Text>
            <Text style={styles.detailValue}>
              {item.reference_relationship === 'family' && 'Family Member'}
              {item.reference_relationship === 'friend' && 'Friend'}
              {item.reference_relationship === 'colleague' && 'Colleague'}
              {item.reference_relationship === 'community_member' && 'Community Member'}
              {!['family', 'friend', 'colleague', 'community_member'].includes(item.reference_relationship) && item.reference_relationship}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{item.reference_phone}</Text>
          </View>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.verifyButton]}
            onPress={() => handleVerify(item.id, item.user_id, item.user_type, item.user_name)}
          >
            <Text style={styles.verifyButtonText}>✓ Verify</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.masjidName}>{imamData?.masjid?.name}</Text>
          <Text style={styles.imamName}>Imam {imamData?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.tab, filter === 'pending' && styles.tabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.tabText, filter === 'pending' && styles.tabTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'all' && styles.tabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              {filter === 'pending' 
                ? 'No pending verification requests' 
                : 'No verification requests'}
            </Text>
          </View>
        }
      />

      <Modal
        visible={showChecklistModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChecklistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verification Checklist</Text>
            <Text style={styles.modalSubtitle}>
              Before verifying {selectedRequest?.userName}, please confirm:
            </Text>

            <View style={styles.checklistContainer}>
              <TouchableOpacity
                style={styles.checklistItem}
                onPress={toggleKnowPerson}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  checklist.knowPerson && styles.checkboxChecked
                ]}>
                  {checklist.knowPerson && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checklistText}>
                  I can confirm I know of this person
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checklistItem}
                onPress={toggleVouchCharacter}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  checklist.vouchCharacter && styles.checkboxChecked
                ]}>
                  {checklist.vouchCharacter && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checklistText}>
                  I can vouch for this person's character
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowChecklistModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  (!checklist.knowPerson || !checklist.vouchCharacter) && styles.confirmButtonDisabled
                ]}
                onPress={confirmVerification}
                disabled={!checklist.knowPerson || !checklist.vouchCharacter}
              >
                <Text style={[
                  styles.confirmButtonText,
                  (!checklist.knowPerson || !checklist.vouchCharacter) && styles.confirmButtonTextDisabled
                ]}>
                  Verify Member
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FB',
  },
  header: {
    backgroundColor: '#070A12',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masjidName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 32,
    color: '#F2CC66',
    marginBottom: 4,
  },
  imamName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#F7E099',
  },
  logoutButton: {
    backgroundColor: 'rgba(242, 204, 102, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#F2CC66',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F7F8FB',
  },
  tabActive: {
    backgroundColor: '#F2CC66',
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#7B8799',
  },
  tabTextActive: {
    color: '#070A12',
  },
  listContent: {
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  requestName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 22,
    color: '#070A12',
    marginBottom: 4,
  },
  requestMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 16,
    color: '#7B8799',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FFF4E0',
  },
  statusVerified: {
    backgroundColor: '#E6F7ED',
  },
  statusRejected: {
    backgroundColor: '#FEE5E5',
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 13,
    color: '#070A12',
  },
  requestDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 16,
    color: '#7B8799',
  },
  detailValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 16,
    color: '#070A12',
  },
  referenceSection: {
    backgroundColor: '#F7F8FB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  referenceSectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 16,
    color: '#070A12',
    marginBottom: 8,
  },
  referenceDetails: {
    gap: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  verifyButton: {
    backgroundColor: '#17803A',
  },
  rejectButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#070A12',
  },
  verifyButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#7B8799',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 32,
    color: '#070A12',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#7B8799',
    marginBottom: 24,
  },
  checklistContainer: {
    marginBottom: 24,
    gap: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E7EAF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#17803A',
    borderColor: '#17803A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checklistText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#070A12',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  cancelButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#070A12',
  },
  confirmButton: {
    backgroundColor: '#17803A',
  },
  confirmButtonDisabled: {
    backgroundColor: '#E7EAF0',
  },
  confirmButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  confirmButtonTextDisabled: {
    color: '#7B8799',
  },
});