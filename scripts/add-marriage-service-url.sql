-- Add marriage_service_url column to masjid table
-- Run this in Supabase SQL Editor

ALTER TABLE masjid
ADD COLUMN IF NOT EXISTS marriage_service_url TEXT;

COMMENT ON COLUMN masjid.marriage_service_url IS 'URL to the masjid website marriage/nikkah service page';
