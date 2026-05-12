// app/(auth)/verification-status.tsx
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Masjid {
  id: string;
  name: string;
  city: string;
  country: string;
  imam_id: string | null;
  imam: { name: string } | null;
}

interface Reference {
  id: string;
  reference_name: string;
  reference_relationship: string;
  reference_phone: string;
  reference_email: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
}

interface ImamVerification {
  id: string;
  status: 'pending' | 'verified' | 'rejected';
  masjid_id: string;
  masjid?: { name: string } | null;
}

export default function VerificationStatusScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [accountType, setAccountType] = useState<'brother' | 'sister' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Masjid section
  const [imamVerification, setImamVerification] = useState<ImamVerification | null>(null);
  const [masajid, setMasajid] = useState<Masjid[]>([]);
  const [masjidSearch, setMasjidSearch] = useState('');
  const [selectedMasjid, setSelectedMasjid] = useState<string | null>(null);
  const [hasInformedImam, setHasInformedImam] = useState(false);
  const [isSavingMasjid, setIsSavingMasjid] = useState(false);
  const [masjidSectionOpen, setMasjidSectionOpen] = useState(false);

  // References section
  const [references, setReferences] = useState<Reference[]>([]);
  const [refSectionOpen, setRefSectionOpen] = useState(false);
  const [refName, setRefName] = useState('');
  const [refRelationship, setRefRelationship] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [refEmail, setRefEmail] = useState('');
  const [isAddingRef, setIsAddingRef] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.back(); return; }

      let profileId: string | null = null;
      let type: 'brother' | 'sister' | null = null;

      const { data: b } = await supabase.from('brother').select('id').eq('user_id', user.id).maybeSingle();
      if (b) { profileId = b.id; type = 'brother'; }
      else {
        const { data: s } = await supabase.from('sister').select('id').eq('user_id', user.id).maybeSingle();
        if (s) { profileId = s.id; type = 'sister'; }
      }

      if (!profileId || !type) { router.back(); return; }
      setUserId(profileId);
      setAccountType(type);

      await Promise.all([
        loadImamVerification(profileId, type),
        loadMasajid(),
        loadReferences(profileId, type),
      ]);
    } catch (err) {
      console.error('Error loading verification data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadImamVerification = async (profileId: string, type: 'brother' | 'sister') => {
    const { data } = await supabase
      .from('imam_verification')
      .select('id, status, masjid_id, masjid:masjid_id(name)')
      .eq('user_id', profileId)
      .eq('user_type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setImamVerification({
        ...data,
        masjid: Array.isArray(data.masjid) ? data.masjid[0] : data.masjid,
      } as ImamVerification);
    }
  };

  const loadMasajid = async () => {
    const { data } = await supabase
      .from('masjid')
      .select('id, name, city, country, imam_id, imam:imam_id(name)')
      .eq('is_active', true)
      .order('name');

    if (data) {
      setMasajid(data.map(m => ({
        ...m,
        imam: Array.isArray(m.imam) ? (m.imam[0] || null) : m.imam,
      })));
    }
  };

  const loadReferences = async (profileId: string, type: 'brother' | 'sister') => {
    const { data } = await supabase
      .from('reference')
      .select('id, reference_name, reference_relationship, reference_phone, reference_email, verification_status')
      .eq('user_id', profileId)
      .eq('user_type', type)
      .order('created_at', { ascending: false });

    if (data) setReferences(data as Reference[]);
  };

  const handleSaveMasjid = async () => {
    if (!selectedMasjid) {
      Alert.alert('Select a masjid', 'Please select a masjid from the list.');
      return;
    }
    if (!hasInformedImam) {
      Alert.alert('Confirmation required', 'Please confirm you have informed the imam to expect your request.');
      return;
    }
    if (!userId || !accountType) return;

    const doSave = async () => {
      setIsSavingMasjid(true);
      try {
        const table = accountType === 'brother' ? 'brother' : 'sister';

        // Cancel any existing verification
        if (imamVerification) {
          await supabase
            .from('imam_verification')
            .update({ status: 'cancelled' } as any)
            .eq('id', imamVerification.id);
        }

        // Update profile masjid
        await supabase.from(table).update({
          masjid_id: selectedMasjid,
          is_masjid_affiliated: true,
        }).eq('id', userId);

        // Create new verification request
        const { data: newVerification, error: verErr } = await supabase
          .from('imam_verification')
          .insert({
            user_id: userId,
            user_type: accountType,
            masjid_id: selectedMasjid,
            status: 'pending',
          })
          .select('id')
          .single();

        if (verErr) throw verErr;

        // Fire-and-forget SMS
        supabase.functions.invoke('send-imam-verification', {
          body: {
            imam_verification_id: newVerification.id,
            user_id: userId,
            user_type: accountType,
            masjid_id: selectedMasjid,
          },
        }).catch(err => console.error('Error sending imam SMS:', err));

        const masjid = masajid.find(m => m.id === selectedMasjid);
        Alert.alert(
          'Request Sent',
          `Your verification request has been sent to the imam of ${masjid?.name || 'your masjid'}. This usually takes 1–3 days.`,
          [{ text: 'OK' }]
        );

        setMasjidSectionOpen(false);
        setSelectedMasjid(null);
        setHasInformedImam(false);
        await loadImamVerification(userId, accountType);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to save. Please try again.');
      } finally {
        setIsSavingMasjid(false);
      }
    };

    if (imamVerification) {
      Alert.alert(
        'Change Masjid Affiliation?',
        `This will cancel your existing verification with ${imamVerification.masjid?.name || 'your current masjid'} and send a new request.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Change', style: 'destructive', onPress: doSave },
        ]
      );
    } else {
      doSave();
    }
  };

  const handleAddReference = async () => {
    if (!refName.trim()) { Alert.alert('Required', 'Please enter the reference name.'); return; }
    if (!refRelationship.trim()) { Alert.alert('Required', 'Please enter the relationship.'); return; }
    if (!refPhone.trim()) { Alert.alert('Required', 'Please enter a phone number.'); return; }
    if (!userId || !accountType) return;

    setIsAddingRef(true);
    try {
      const { data: profile } = await supabase
        .from(accountType)
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      const userName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'A Mithaq user';

      const { error } = await supabase.from('reference').insert({
        user_id: userId,
        user_type: accountType,
        reference_name: refName.trim(),
        reference_relationship: refRelationship.trim(),
        reference_phone: refPhone.trim(),
        reference_email: refEmail.trim() || null,
        verification_status: 'pending',
      });

      if (error) throw error;

      // Fire-and-forget SMS
      supabase.functions.invoke('send-sms', {
        body: { to: refPhone.trim(), userName },
      }).catch(err => console.error('Reference SMS failed:', err));

      Alert.alert(
        'Reference Added',
        `A verification message has been sent to ${refPhone.trim()}.`,
        [{ text: 'OK' }]
      );

      setRefName('');
      setRefRelationship('');
      setRefPhone('');
      setRefEmail('');
      setRefSectionOpen(false);
      await loadReferences(userId, accountType);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add reference.');
    } finally {
      setIsAddingRef(false);
    }
  };

  const filteredMasajid = masajid.filter(m => {
    const q = masjidSearch.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.city?.toLowerCase().includes(q) ||
      m.imam?.name?.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      verified:  { label: 'Verified',  color: '#17803A', bg: '#EAF5EE' },
      pending:   { label: 'Pending',   color: '#B45309', bg: '#FEF3C7' },
      rejected:  { label: 'Rejected',  color: '#B7312C', bg: '#FEF2F2' },
      cancelled: { label: 'Cancelled', color: '#7B8799', bg: '#F1F5F9' },
    };
    const s = map[status] || map.pending;
    return (
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verification Status</Text>
        <Text style={styles.subtitle}>
          Verified profiles build trust and receive more interest.
        </Text>

        {/* ── MASJID AFFILIATION ─────────────────────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setMasjidSectionOpen(prev => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>🕌</Text>
              <View>
                <Text style={styles.sectionTitle}>Masjid Affiliation</Text>
                {imamVerification ? (
                  <Text style={styles.sectionMeta}>
                    {imamVerification.masjid?.name || 'Unknown masjid'}
                  </Text>
                ) : (
                  <Text style={styles.sectionMetaNone}>Not affiliated</Text>
                )}
              </View>
            </View>
            <View style={styles.sectionHeaderRight}>
              {imamVerification && statusBadge(imamVerification.status)}
              <Text style={styles.chevron}>{masjidSectionOpen ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>

          {masjidSectionOpen && (
            <View style={styles.sectionBody}>
              {imamVerification && (
                <View style={styles.currentAffiliation}>
                  <Text style={styles.currentLabel}>Current affiliation</Text>
                  <Text style={styles.currentValue}>{imamVerification.masjid?.name}</Text>
                  <Text style={styles.currentHint}>
                    {imamVerification.status === 'verified'
                      ? 'Your imam has confirmed your affiliation.'
                      : imamVerification.status === 'pending'
                      ? 'Awaiting imam confirmation. This usually takes 1–3 days.'
                      : 'Your affiliation request was not confirmed.'}
                  </Text>
                </View>
              )}

              <Text style={styles.pickLabel}>
                {imamVerification ? 'Change masjid' : 'Select your masjid'}
              </Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, city, or imam..."
                placeholderTextColor="#9CA3AF"
                value={masjidSearch}
                onChangeText={setMasjidSearch}
              />

              <View style={styles.masjidList}>
                {(masjidSearch.length > 0 ? filteredMasajid : masajid).map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.masjidItem, selectedMasjid === m.id && styles.masjidItemSelected]}
                    onPress={() => { setSelectedMasjid(m.id); setHasInformedImam(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.masjidName}>{m.name}</Text>
                      <Text style={styles.masjidSub}>📍 {m.city}, {m.country}</Text>
                      {m.imam?.name && <Text style={styles.masjidSub}>Imam: {m.imam.name}</Text>}
                    </View>
                    {selectedMasjid === m.id && (
                      <View style={styles.checkmark}><Text style={styles.checkmarkText}>✓</Text></View>
                    )}
                  </TouchableOpacity>
                ))}
                {masajid.length === 0 && (
                  <Text style={styles.emptyText}>No masajid available</Text>
                )}
              </View>

              {selectedMasjid && (
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setHasInformedImam(prev => !prev)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, hasInformedImam && styles.checkboxChecked]}>
                    {hasInformedImam && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I (or my wali) have informed the imam of{' '}
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }}>
                      {masajid.find(m => m.id === selectedMasjid)?.name}
                    </Text>
                    {' '}to expect my affiliation request
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.saveButton, (!selectedMasjid || isSavingMasjid) && styles.saveButtonDisabled]}
                onPress={handleSaveMasjid}
                disabled={!selectedMasjid || isSavingMasjid}
              >
                <Text style={styles.saveButtonText}>
                  {isSavingMasjid ? 'Sending...' : 'Send Verification Request'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── REFERENCES ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setRefSectionOpen(prev => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>👤</Text>
              <View>
                <Text style={styles.sectionTitle}>References</Text>
                <Text style={styles.sectionMeta}>
                  {references.length === 0
                    ? 'No references added'
                    : `${references.length} reference${references.length !== 1 ? 's' : ''} · ${references.filter(r => r.verification_status === 'verified').length} verified`}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>{refSectionOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {refSectionOpen && (
            <View style={styles.sectionBody}>
              {/* Existing references */}
              {references.map(ref => (
                <View key={ref.id} style={styles.refCard}>
                  <View style={styles.refCardHeader}>
                    <Text style={styles.refName}>{ref.reference_name}</Text>
                    {statusBadge(ref.verification_status)}
                  </View>
                  <Text style={styles.refDetail}>{ref.reference_relationship}</Text>
                  <Text style={styles.refDetail}>{ref.reference_phone}</Text>
                  {ref.reference_email && <Text style={styles.refDetail}>{ref.reference_email}</Text>}
                </View>
              ))}

              {/* Add reference form */}
              <Text style={styles.pickLabel}>Add a reference</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Uncle Yusuf Ahmed"
                  placeholderTextColor="#9CA3AF"
                  value={refName}
                  onChangeText={setRefName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Colleague, Community member"
                  placeholderTextColor="#9CA3AF"
                  value={refRelationship}
                  onChangeText={setRefRelationship}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+44 7700 000000"
                  placeholderTextColor="#9CA3AF"
                  value={refPhone}
                  onChangeText={setRefPhone}
                  keyboardType="phone-pad"
                />
                <Text style={styles.inputHint}>They will receive an SMS asking them to confirm</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="reference@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={refEmail}
                  onChangeText={setRefEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isAddingRef && styles.saveButtonDisabled]}
                onPress={handleAddReference}
                disabled={isAddingRef}
              >
                <Text style={styles.saveButtonText}>
                  {isAddingRef ? 'Sending...' : 'Send Verification SMS'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FB' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 24 },
  backButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#F2CC66' },
  title: { fontFamily: 'PlayfairDisplay_700Bold_Italic', fontSize: 32, lineHeight: 43, color: '#070A12', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, color: '#7B8799', marginBottom: 32 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { fontSize: 22 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#070A12', fontStyle: 'italic' },
  sectionMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7B8799', marginTop: 2 },
  sectionMetaNone: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#C0C7D1', marginTop: 2 },
  chevron: { fontSize: 12, color: '#7B8799' },
  sectionBody: { paddingHorizontal: 18, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  currentAffiliation: {
    backgroundColor: '#F7F8FB',
    borderRadius: 8,
    padding: 14,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  currentLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#7B8799', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  currentValue: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#070A12', marginBottom: 4 },
  currentHint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7B8799', lineHeight: 17 },
  pickLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#070A12', marginBottom: 10, marginTop: 4 },
  searchInput: {
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#070A12',
    marginBottom: 12,
  },
  masjidList: { marginBottom: 16, gap: 8 },
  masjidItem: {
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  masjidItemSelected: { borderColor: '#F2CC66', backgroundColor: '#FFF9E6' },
  masjidName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#070A12', marginBottom: 2 },
  masjidSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7B8799' },
  checkmark: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F2CC66', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  checkmarkText: { fontSize: 14, color: '#070A12' },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7B8799', textAlign: 'center', paddingVertical: 20 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F2CC66',
    marginBottom: 16,
  },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#C0C7D1', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  checkboxChecked: { backgroundColor: '#F2CC66', borderColor: '#F2CC66' },
  checkboxTick: { fontSize: 11, color: '#070A12', fontFamily: 'Inter_700Bold' },
  checkboxLabel: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: '#070A12' },
  saveButton: {
    backgroundColor: '#070A12',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#F2CC66', fontStyle: 'italic' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  refCard: {
    backgroundColor: '#F7F8FB',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  refCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  refName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#070A12' },
  refDetail: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7B8799', marginTop: 1 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#070A12', marginBottom: 6 },
  input: {
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#070A12',
  },
  inputHint: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#7B8799', marginTop: 4 },
});
