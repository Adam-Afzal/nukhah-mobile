// app/(auth)/settings.tsx
import { supabase } from '@/lib/supabase';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Navigation Icons (reused from search screen)
const InterestsIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12075 20.84 4.61Z"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle
      cx={11}
      cy={11}
      r={8}
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
    />
    <Path
      d="M21 21L16.65 16.65"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
    />
  </Svg>
);

const NotificationsIcon = ({ active, count }: { active: boolean; count?: number }) => (
  <View style={{ position: 'relative' }}>
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke={active ? '#F2CC66' : '#7B8799'}
        strokeWidth={2}
      />
      <Path
        d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
        stroke={active ? '#F2CC66' : '#7B8799'}
        strokeWidth={2}
      />
    </Svg>
    {(count !== undefined && count > 0) && (
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationCount}>
          {count > 99 ? '99+' : String(count)}
        </Text>
      </View>
    )}
  </View>
);

const SettingsIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle
      cx={12}
      cy={12}
      r={3}
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
    />
    <Path d="M12 1V3" stroke={active ? '#F2CC66' : '#7B8799'} strokeWidth={2} />
    <Path d="M12 21V23" stroke={active ? '#F2CC66' : '#7B8799'} strokeWidth={2} />
    <Path d="M4.22 4.22L5.64 5.64" stroke={active ? '#F2CC66' : '#7B8799'} strokeWidth={2} />
    <Path d="M18.36 18.36L19.78 19.78" stroke={active ? '#F2CC66' : '#7B8799'} strokeWidth={2} />
    <Path d="M1 12H3" stroke={active ? '#F2CC66' : '#7B8799'} strokeWidth={2} />
    <Path d="M21 12H23" stroke={active ? '#F2CC66' : '#7B8799'} strokeWidth={2} />
    <Path d="M4.22 19.78L5.64 18.36" stroke={active ? '#F2CC66' : '#7B8799'} strokeWidth={2} />
    <Path d="M18.36 5.64L19.78 4.22" stroke={active ? '#F2CC66' : '#7B8799'} strokeWidth={2} />
  </Svg>
);

// Chevron Right Icon
const ChevronRightIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      d="M7.5 15L12.5 10L7.5 5"
      stroke="#7B8799"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function SettingsScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('Mercy-317K'); // TODO: Load from profile
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { unreadCount } = useUnreadNotifications();

  const handleEditProfile = () => {
    // TODO: Create edit profile screen
    Alert.alert(
      'Edit Profile',
      'This feature is coming soon. You will be able to edit your profile information here.',
      [{ text: 'OK' }]
    );
  };

  const handleSpouseCriteria = () => {
    // TODO: Create spouse criteria screen
    Alert.alert(
      'Spouse Criteria',
      'This feature is coming soon. You will be able to define and update your spouse criteria here.',
      [{ text: 'OK' }]
    );
  };

  const handleVerificationStatus = () => {
    // TODO: Create verification screen
    Alert.alert(
      'Verification Status',
      'This feature is coming soon. You will be able to complete profile verification here.',
      [{ text: 'OK' }]
    );
  };

  const handleManageMembership = () => {
    // TODO: Create membership management screen
    Alert.alert(
      'Manage Membership',
      'This feature is coming soon. You will be able to manage your subscription and payment details here.',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await supabase.auth.signOut();
              router.replace('/welcome');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Your profile and all data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert(
              'Confirm Deletion',
              'Are you absolutely sure? Type "DELETE" to confirm.',
              [{ text: 'Cancel', style: 'cancel' }]
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.username}>{username}</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
              <View style={styles.iconContainer}>
                <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                  <Rect width={32} height={32} rx={8} fill="#F8F1DA" />
                  <Path
                    d="M16 12C14.3431 12 13 13.3431 13 15C13 16.6569 14.3431 18 16 18C17.6569 18 19 16.6569 19 15C19 13.3431 17.6569 12 16 12Z"
                    stroke="#070A12"
                    strokeWidth={1.5}
                  />
                  <Path
                    d="M16 20C13.7909 20 12 18.2091 12 16C12 13.7909 13.7909 12 16 12C18.2091 12 20 13.7909 20 16C20 18.2091 18.2091 20 16 20Z"
                    stroke="#070A12"
                    strokeWidth={1.5}
                  />
                </Svg>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Edit Profile</Text>
                <Text style={styles.settingDescription}>Update your personal information</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem} onPress={handleSpouseCriteria}>
              <View style={styles.iconContainer}>
                <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                  <Rect width={32} height={32} rx={8} fill="#F8F1DA" />
                  <Path
                    d="M16 12L19 15L16 18"
                    stroke="#070A12"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M13 15H19"
                    stroke="#070A12"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Spouse Criteria</Text>
                <Text style={styles.settingDescription}>Define what you're looking for</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem} onPress={handleVerificationStatus}>
              <View style={styles.iconContainer}>
                <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                  <Rect width={32} height={32} rx={8} fill="#F8F1DA" />
                  <Path
                    d="M16 11L17.5 14L21 14.5L18.5 17L19 20.5L16 18.5L13 20.5L13.5 17L11 14.5L14.5 14L16 11Z"
                    stroke="#070A12"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Verification Status</Text>
                <Text style={styles.settingDescription}>Complete profile verification</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem} onPress={handleManageMembership}>
              <View style={styles.iconContainer}>
                <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                  <Rect width={32} height={32} rx={8} fill="#F8F1DA" />
                  <Path
                    d="M16 11L17.5 14L21 14.5L18.5 17L19 20.5L16 18.5L13 20.5L13.5 17L11 14.5L14.5 14L16 11Z"
                    stroke="#070A12"
                    strokeWidth={1.5}
                    fill="#070A12"
                  />
                </Svg>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Manage Membership</Text>
                <Text style={styles.settingDescription}>Active • Renews Dec 15, 2025</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleDanger}>DANGER ZONE</Text>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
              <View style={[styles.iconContainer, styles.iconContainerDanger]}>
                <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                  <Rect width={32} height={32} rx={8} fill="#F8E5E5" />
                  <Path
                    d="M13 14V20M19 14V20M10 11H22M20.5 11L19.5 20.5C19.5 21.3284 18.8284 22 18 22H14C13.1716 22 12.5 21.3284 12.5 20.5L11.5 11M14.5 11V10C14.5 9.44772 14.9477 9 15.5 9H16.5C17.0523 9 17.5 9.44772 17.5 10V11"
                    stroke="#B7312C"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitleDanger}>Delete Account</Text>
                <Text style={styles.settingDescription}>Permanently delete your account</Text>
              </View>
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                <Path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="#B7312C"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Logout Button */}
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <View style={[styles.iconContainer, styles.iconContainerWarning]}>
                <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                  <Rect width={32} height={32} rx={8} fill="#FEF3E5" />
                  <Path
                    d="M18 11L22 16L18 21M22 16H12M12 9H11C10.4477 9 10 9.44772 10 10V22C10 22.5523 10.4477 23 11 23H12"
                    stroke="#F2994A"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitleWarning}>
                  {isLoggingOut ? 'Logging out...' : 'Log Out'}
                </Text>
                <Text style={styles.settingDescription}>Sign out of your account</Text>
              </View>
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                <Path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="#F2994A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.navbar}>
        <View style={styles.navbarBorder} />
        
        <View style={styles.navRow}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => router.push('/(auth)/interests')}
          >
            <InterestsIcon active={false} />
            <Text style={styles.navLabelInactive}>Interests</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => router.push('/(auth)/')}
          >
            <SearchIcon active={false} />
            <Text style={styles.navLabelInactive}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => router.push('/(auth)/notifications')}
          >
            <NotificationsIcon active={false} count={unreadCount} />
            <Text style={styles.navLabelInactive}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => {}}>
            <SettingsIcon active={true} />
            <Text style={styles.navLabelActive}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navbarIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 44,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 32,
    lineHeight: 43,
    color: '#070A12',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#7B8799',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F2CC66',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 29,
    color: '#070A12',
    fontStyle: 'italic',
  },
  username: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 18,
    lineHeight: 24,
    color: '#070A12',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 28,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 13,
    color: '#7B8799',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  sectionTitleDanger: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 13,
    color: '#B7312C',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerDanger: {
    backgroundColor: '#F8E5E5',
  },
  iconContainerWarning: {
    backgroundColor: '#FEF3E5',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 18,
    color: '#070A12',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  settingTitleDanger: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 18,
    color: '#B7312C',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  settingTitleWarning: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 18,
    color: '#F2994A',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#7B8799',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7EAF0',
    marginLeft: 60,
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E7EAF0',
  },
  navbarBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E7EAF0',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabelActive: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 15,
    color: '#F2CC66',
    fontStyle: 'italic',
    marginTop: 4,
  },
  navLabelInactive: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#7B8799',
    marginTop: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E03A3A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 13,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  navbarIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    width: 100,
    height: 4,
    backgroundColor: '#070A12',
    opacity: 0.3,
    borderRadius: 2,
    transform: [{ translateX: -50 }],
  },
});