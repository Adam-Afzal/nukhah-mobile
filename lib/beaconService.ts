// lib/beaconService.ts
import { supabase } from './supabase';

export const GEOFENCE_TASK = 'MITHAQ_GEOFENCE_TASK';

// Use require() with try/catch so the module doesn't crash in Expo Go or web
// when the native modules aren't registered yet.
let Location: typeof import('expo-location') | null = null;
let TaskManager: typeof import('expo-task-manager') | null = null;
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Location = require('expo-location');
  TaskManager = require('expo-task-manager');
  Notifications = require('expo-notifications');
} catch {}

// ---------------------------------------------------------------------------
// Task definition — must be called at module level so it's registered before
// the app mounts. Wrapped in try/catch for environments without native support.
// ---------------------------------------------------------------------------
if (TaskManager) {
  try {
    TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }: any) => {
      if (error) {
        console.error('Geofence task error:', error);
        return;
      }
      if (!data || !Location) return;

      const { eventType, region } = data;
      const masjidId: string = region.identifier;

      if (eventType === Location.GeofencingEventType.Enter) {
        await handleGeofenceEnter(masjidId);
      } else if (eventType === Location.GeofencingEventType.Exit) {
        await handleGeofenceExit(masjidId);
      }
    });
  } catch (e) {
    console.log('TaskManager.defineTask not available:', e);
  }
}

// ---------------------------------------------------------------------------
// Geofencing init
// ---------------------------------------------------------------------------

/**
 * Fetch nearby masjids with coordinates and start geofencing.
 * Call this once after location permission is granted.
 */
export async function initGeofencing(userLat: number, userLng: number): Promise<void> {
  if (!Location || !TaskManager) {
    console.log('Geofencing not available in this environment');
    return;
  }

  try {
    const { data: masjids, error } = await supabase
      .from('masjid')
      .select('id, name, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(20);

    if (error) throw error;
    if (!masjids || masjids.length === 0) {
      console.log('No masjids with coordinates found — skipping geofencing');
      return;
    }

    const regions = masjids.map((m: any) => ({
      identifier: m.id,
      latitude: m.latitude,
      longitude: m.longitude,
      radius: 150,
    }));

    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
    console.log('✅ Geofencing started for', regions.length, 'masjids');
  } catch (error) {
    console.error('Error initialising geofencing:', error);
  }
}

// ---------------------------------------------------------------------------
// Enter / exit handlers
// ---------------------------------------------------------------------------

async function handleGeofenceEnter(masjidId: string): Promise<void> {
  if (!Notifications) return;
  try {
    const { data: masjid } = await supabase
      .from('masjid')
      .select('name')
      .eq('id', masjidId)
      .single();

    const masjidName = masjid?.name || 'a nearby masjid';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `You're visiting ${masjidName}`,
        body: "Want to see who's here from the community?",
        data: { type: 'geofence_enter', masjidId, masjidName },
        sound: 'default',
      },
      trigger: null,
    });

    console.log('📍 Geofence entered:', masjidName);
  } catch (error) {
    console.error('Error handling geofence enter:', error);
  }
}

async function handleGeofenceExit(masjidId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const table of ['brother', 'sister'] as const) {
      const { data: profile } = await supabase
        .from(table)
        .select('id, visiting_masjid_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile && profile.visiting_masjid_id === masjidId) {
        await supabase
          .from(table)
          .update({ visiting_masjid_id: null })
          .eq('id', profile.id);
        console.log('📍 Geofence exited — cleared visiting status');
        break;
      }
    }
  } catch (error) {
    console.error('Error handling geofence exit:', error);
  }
}

// ---------------------------------------------------------------------------
// Visiting status CRUD
// ---------------------------------------------------------------------------

export async function setVisitingStatus(
  profileId: string,
  profileType: 'brother' | 'sister',
  masjidId: string
): Promise<void> {
  const { error } = await supabase
    .from(profileType)
    .update({ visiting_masjid_id: masjidId })
    .eq('id', profileId);

  if (error) console.error('Error setting visiting status:', error);
}

export async function clearVisitingStatus(
  profileId: string,
  profileType: 'brother' | 'sister'
): Promise<void> {
  const { error } = await supabase
    .from(profileType)
    .update({ visiting_masjid_id: null })
    .eq('id', profileId);

  if (error) console.error('Error clearing visiting status:', error);
}

// ---------------------------------------------------------------------------
// Query visiting members
// ---------------------------------------------------------------------------

export interface VisitingProfile {
  id: string;
  username: string;
  location_country: string;
  location_city: string;
  ethnicity: string;
  marital_status: string;
  build?: string;
  date_of_birth?: string;
  prayer_consistency?: string;
  open_to_polygyny?: boolean;
  hijab_commitment?: string;
  visiting_masjid_id: string;
  isVisiting: true;
}

export async function getVisitingMembers(
  masjidId: string,
  targetGender: 'brother' | 'sister'
): Promise<VisitingProfile[]> {
  try {
    const extraFields = targetGender === 'sister' ? ', open_to_polygyny, hijab_commitment' : '';
    const { data, error } = await supabase
      .from(targetGender)
      .select(`id, username, location_country, location_city, ethnicity, marital_status, build, date_of_birth, prayer_consistency, visiting_masjid_id${extraFields}`)
      .eq('visiting_masjid_id', masjidId);

    if (error) throw error;

    return (data || []).map((p: any) => ({ ...p, isVisiting: true as const }));
  } catch (error) {
    console.error('Error fetching visiting members:', error);
    return [];
  }
}
