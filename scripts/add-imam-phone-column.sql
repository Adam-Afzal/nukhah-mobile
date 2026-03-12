-- Add phone number to imam table so we can look up imams by their Twilio sender number
alter table imam add column if not exists phone text;

-- Optional: index for fast lookup in the webhook
create index if not exists imam_phone_idx on imam(phone);
