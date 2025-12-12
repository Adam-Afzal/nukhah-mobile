// app/(auth)/notifications.tsx
import {
    deleteNotification,
    getNotifications,
    markAllAsRead,
    markAsRead,
    Notification,
} from '@/lib/notificationService';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// Navigation Icons
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
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 21L16.65 16.65"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
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
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
          stroke={active ? '#F2CC66' : '#7B8799'}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
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
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 1V3"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 21V23"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4.22 4.22L5.64 5.64"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.36 18.36L19.78 19.78"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1 12H3"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 12H23"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4.22 19.78L5.64 18.36"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.36 5.64L19.78 4.22"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { unreadCount, refresh: refreshUnreadCount } = useUnreadNotifications();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    const data = await getNotifications(50); // Get last 50 notifications
    setNotifications(data);
    setIsLoading(false);
    refreshUnreadCount(); // Update badge count
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on type
    switch (notification.type) {
      case 'profile_view':
        if (notification.data.viewer_profile_id) {
          router.push(`/(auth)/profile/${notification.data.viewer_profile_id}`);
        }
        break;

      case 'interest_expressed':
      case 'questions_progress':
      case 'questions_completed':
        router.push('/(auth)/interests');
        break;

      case 'interest_accepted':
      case 'interest_rejected':
      case 'mutual_interest':
        router.push('/(auth)/interests');
        break;

      default:
        console.log('Unknown notification type:', notification.type);
    }

    // Refresh list
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    loadNotifications();
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
    loadNotifications();
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string): string => {
    const icons: Record<string, string> = {
      profile_view: '👁️',
      interest_expressed: '💕',
      questions_progress: '📝',
      questions_completed: '✅',
      interest_accepted: '🎉',
      interest_rejected: '❌',
      mutual_interest: '✨',
      message_received: '💬',
    };
    return icons[type] || '🔔';
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unread]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleDeleteNotification(item.id)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{formatTime(item.created_at)}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  const localUnreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {localUnreadCount > 0 && (
            <Text style={styles.unreadCountText}>{localUnreadCount} unread</Text>
          )}
        </View>
        
        {localUnreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              You'll receive notifications when someone views your profile, expresses interest, or responds to your interest.
            </Text>
          </View>
        }
      />

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
            onPress={() => router.push('/(auth)')}
          >
            <SearchIcon active={false} />
            <Text style={styles.navLabelInactive}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => {}}>
            <NotificationsIcon active={true} count={0} />
            <Text style={styles.navLabelActive}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => router.push('/(auth)/settings')}
          >
            <SettingsIcon active={false} />
            <Text style={styles.navLabelInactive}>Settings</Text>
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
    backgroundColor: '#F7F8FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 28,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 28,
    color: '#070A12',
  },
  unreadCountText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#7B8799',
    marginTop: 4,
  },
  markAllRead: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#F2CC66',
  },
  list: {
    padding: 20,
    paddingBottom: 120, // Extra padding for bottom nav
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unread: {
    backgroundColor: '#FFF9E6',
    borderColor: '#F2CC66',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    fontSize: 24,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#070A12',
    marginBottom: 4,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F2CC66',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: '#070A12',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Navigation
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
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