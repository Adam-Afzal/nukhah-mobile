// lib/notificationService.ts
import { supabase } from './supabase';

export type NotificationType = 
  | 'profile_view'
  | 'interest_expressed'
  | 'questions_started'
  | 'questions_progress'
  | 'questions_completed'
  | 'interest_accepted'
  | 'interest_rejected'
  | 'mutual_interest'
  | 'message_received';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  expires_at?: string;
}

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  expiresInDays?: number;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, type, title, message, data = {}, expiresInDays } = params;

    const notification: any = {
      user_id: userId,
      type,
      title,
      message,
      data,
    };

    // Set expiration if provided
    if (expiresInDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      notification.expires_at = expiresAt.toISOString();
    }

    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (error) throw error;

    console.log('✅ Notification created:', type, 'for user:', userId);
    return { success: true };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user ID from profile ID and type
 */
async function getUserIdFromProfile(profileId: string, profileType: 'brother' | 'sister'): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from(profileType)
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return data?.user_id || null;
  } catch (error) {
    console.error('Error getting user ID from profile:', error);
    return null;
  }
}

/**
 * Get username from profile ID and type
 */
async function getUsernameFromProfile(profileId: string, profileType: 'brother' | 'sister'): Promise<string> {
  try {
    const { data, error } = await supabase
      .from(profileType)
      .select('username')
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return data?.username || 'Someone';
  } catch (error) {
    console.error('Error getting username:', error);
    return 'Someone';
  }
}

/**
 * Notify when someone views your profile
 */
export async function notifyProfileView(
  viewedProfileId: string,
  viewedProfileType: 'brother' | 'sister',
  viewerProfileId: string,
  viewerProfileType: 'brother' | 'sister'
): Promise<void> {
  const userId = await getUserIdFromProfile(viewedProfileId, viewedProfileType);
  if (!userId) return;

  const viewerUsername = await getUsernameFromProfile(viewerProfileId, viewerProfileType);
  const genderText = viewerProfileType === 'brother' ? 'brother' : 'sister';

  await createNotification({
    userId,
    type: 'profile_view',
    title: 'Profile View',
    message: `${viewerUsername} viewed your profile`,
    data: {
      viewer_profile_id: viewerProfileId,
      viewer_profile_type: viewerProfileType,
      viewer_username: viewerUsername,
    },
    expiresInDays: 7, // Auto-delete after 7 days
  });
}

/**
 * Notify when someone expresses interest (starts questions)
 */
export async function notifyInterestExpressed(
  interestId: string,
  recipientProfileId: string,
  recipientProfileType: 'brother' | 'sister',
  requesterProfileId: string,
  requesterProfileType: 'brother' | 'sister'
): Promise<void> {
  const userId = await getUserIdFromProfile(recipientProfileId, recipientProfileType);
  if (!userId) return;

  const requesterUsername = await getUsernameFromProfile(requesterProfileId, requesterProfileType);
  const genderText = requesterProfileType === 'brother' ? 'brother' : 'sister';

  await createNotification({
    userId,
    type: 'interest_expressed',
    title: 'New Interest',
    message: `${requesterUsername} is interested in you`,
    data: {
      interest_id: interestId,
      requester_profile_id: requesterProfileId,
      requester_profile_type: requesterProfileType,
      requester_username: requesterUsername,
    },
  });
}

/**
 * Notify progress on questions (25%, 50%, 75% - optional milestone notifications)
 */
export async function notifyQuestionProgress(
  interestId: string,
  recipientProfileId: string,
  recipientProfileType: 'brother' | 'sister',
  requesterProfileId: string,
  requesterProfileType: 'brother' | 'sister',
  percentage: number
): Promise<void> {
  // Only notify at specific milestones to avoid spam
  if (percentage !== 40 && percentage !== 60 && percentage !== 80) return;

  const userId = await getUserIdFromProfile(recipientProfileId, recipientProfileType);
  if (!userId) return;

  const requesterUsername = await getUsernameFromProfile(requesterProfileId, requesterProfileType);

  await createNotification({
    userId,
    type: 'questions_progress',
    title: 'Progress Update',
    message: `${requesterUsername} is ${percentage}% done answering your questions`,
    data: {
      interest_id: interestId,
      requester_username: requesterUsername,
      percentage,
    },
    expiresInDays: 3, // Short expiry since progress notifications are transient
  });
}

/**
 * Notify when questions are completed (100%)
 */
export async function notifyQuestionsCompleted(
  interestId: string,
  recipientProfileId: string,
  recipientProfileType: 'brother' | 'sister',
  requesterProfileId: string,
  requesterProfileType: 'brother' | 'sister'
): Promise<void> {
  const userId = await getUserIdFromProfile(recipientProfileId, recipientProfileType);
  if (!userId) return;

  const requesterUsername = await getUsernameFromProfile(requesterProfileId, requesterProfileType);
  const genderText = requesterProfileType === 'brother' ? 'brother' : 'sister';

  await createNotification({
    userId,
    type: 'questions_completed',
    title: '🎉 Ready to Review!',
    message: `${requesterUsername} completed your questions. Review their match now!`,
    data: {
      interest_id: interestId,
      requester_profile_id: requesterProfileId,
      requester_profile_type: requesterProfileType,
      requester_username: requesterUsername,
    },
  });
}

/**
 * Notify when your interest is accepted
 */
export async function notifyInterestAccepted(
  interestId: string,
  requesterProfileId: string,
  requesterProfileType: 'brother' | 'sister',
  recipientProfileId: string,
  recipientProfileType: 'brother' | 'sister'
): Promise<void> {
  const userId = await getUserIdFromProfile(requesterProfileId, requesterProfileType);
  if (!userId) return;

  const recipientUsername = await getUsernameFromProfile(recipientProfileId, recipientProfileType);

  await createNotification({
    userId,
    type: 'interest_accepted',
    title: '✅ Interest Accepted!',
    message: `${recipientUsername} accepted your interest. You can now message each other!`,
    data: {
      interest_id: interestId,
      recipient_profile_id: recipientProfileId,
      recipient_profile_type: recipientProfileType,
      recipient_username: recipientUsername,
    },
  });
}

/**
 * Notify when your interest is rejected
 */
export async function notifyInterestRejected(
  interestId: string,
  requesterProfileId: string,
  requesterProfileType: 'brother' | 'sister'
): Promise<void> {
  const userId = await getUserIdFromProfile(requesterProfileId, requesterProfileType);
  if (!userId) return;

  await createNotification({
    userId,
    type: 'interest_rejected',
    title: 'Interest Update',
    message: 'Your interest was not accepted this time. Keep searching!',
    data: {
      interest_id: interestId,
    },
    expiresInDays: 7,
  });
}

/**
 * Notify mutual interest (when both completed questions)
 */
export async function notifyMutualInterest(
  interest1Id: string,
  interest2Id: string,
  user1ProfileId: string,
  user1ProfileType: 'brother' | 'sister',
  user2ProfileId: string,
  user2ProfileType: 'brother' | 'sister'
): Promise<void> {
  const user1Id = await getUserIdFromProfile(user1ProfileId, user1ProfileType);
  const user2Id = await getUserIdFromProfile(user2ProfileId, user2ProfileType);
  
  const user1Username = await getUsernameFromProfile(user1ProfileId, user1ProfileType);
  const user2Username = await getUsernameFromProfile(user2ProfileId, user2ProfileType);

  // Notify user 1
  if (user1Id) {
    await createNotification({
      userId: user1Id,
      type: 'mutual_interest',
      title: '🎯 Mutual Interest!',
      message: `You and ${user2Username} both completed each other's questions. Start messaging!`,
      data: {
        interest_id: interest1Id,
        match_profile_id: user2ProfileId,
        match_profile_type: user2ProfileType,
        match_username: user2Username,
      },
    });
  }

  // Notify user 2
  if (user2Id) {
    await createNotification({
      userId: user2Id,
      type: 'mutual_interest',
      title: '🎯 Mutual Interest!',
      message: `You and ${user1Username} both completed each other's questions. Start messaging!`,
      data: {
        interest_id: interest2Id,
        match_profile_id: user1ProfileId,
        match_profile_type: user1ProfileType,
        match_username: user1Username,
      },
    });
  }
}

/**
 * Get unread notification count for user
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Get notifications for current user
 */
export async function getNotifications(limit: number = 50): Promise<Notification[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}