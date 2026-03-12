-- Migration: Push notifications + Beacons (geofencing)
-- Run these in order in the Supabase SQL editor

-- Phase 1: Push notification tokens
alter table brother add column if not exists push_token text;
alter table sister add column if not exists push_token text;

-- Phase 2: Masjid coordinates (for geofencing)
alter table masjid add column if not exists latitude float;
alter table masjid add column if not exists longitude float;

-- Phase 3: Visiting status on profiles
alter table brother add column if not exists visiting_masjid_id uuid references masjid(id);
alter table sister add column if not exists visiting_masjid_id uuid references masjid(id);
