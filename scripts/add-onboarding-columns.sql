-- Migration: Add onboarding columns for suggested masjid name
-- Run in Supabase SQL editor

-- Allow brothers to store their masjid name when it's not in the DB
alter table brother
  add column if not exists suggested_masjid_name text;

-- Allow sisters to store their masjid name when it's not in the DB
alter table sister
  add column if not exists suggested_masjid_name text;
