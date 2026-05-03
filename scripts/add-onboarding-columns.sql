-- Migration: Add onboarding columns for suggested masjid name
-- Run in Supabase SQL editor

-- Allow brothers to store their masjid name/city when it's not in the DB
alter table brother
  add column if not exists suggested_masjid_name text,
  add column if not exists suggested_masjid_city text,
  add column if not exists references_skipped boolean default false;

-- Allow sisters to store their masjid name/city when it's not in the DB
alter table sister
  add column if not exists suggested_masjid_name text,
  add column if not exists suggested_masjid_city text,
  add column if not exists references_skipped boolean default false;
