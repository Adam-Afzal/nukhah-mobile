-- Migration: Add wali application columns to sister and sister_application tables
-- Run in Supabase SQL editor

-- Tracks whether a wali registered on behalf of a sister (vs the sister registering herself)
alter table sister
  add column if not exists applied_by_wali boolean default false;

-- Stores the wali's relationship to the sister on the application (e.g. Father, Brother, Uncle)
alter table sister_application
  add column if not exists wali_relationship_to_sister text;
