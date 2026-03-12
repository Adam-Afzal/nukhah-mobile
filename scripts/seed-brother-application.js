// @ts-nocheck
// scripts/seed-brother-application.js
// Run this with: node scripts/seed-brother-application.js <email>
// Creates a brother auth user + approved application, but no profile (simulates post-approval, pre-onboarding state)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('Make sure you have EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env or .env.local');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/seed-brother-application.js <email>');
  process.exit(1);
}

const PASSWORD = 'Noodles@123';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedBrotherApplication() {
  console.log(`\nSeeding brother application for: ${email}\n`);

  // Check if user already exists and remove them first
  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users?.users.find((u) => u.email === email);

  if (existingUser) {
    console.log(`User already exists (${existingUser.id}), please delete them first with: node scripts/delete-user.js ${email}`);
    process.exit(1);
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    throw new Error(`Failed to create user: ${authError.message}`);
  }

  const userId = authData.user.id;
  console.log(`Auth user created: ${userId}`);

  // Create approved brother application (no profile)
  const { error: appError } = await supabase
    .from('brother_application')
    .insert({
      user_id: userId,
      first_name: 'Ahmad',
      last_name: 'T',
      nationality: 'United Kingdom',
      email: email,
      phone_number: '+447368867022',
      date_of_birth: '1995-06-15',
      status: 'approved',
    });

  if (appError) {
    throw new Error(`Failed to create brother application: ${appError.message}`);
  }
  console.log('  Brother application created (status: approved)');

  console.log(`\nDone!`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  State:    Approved application, no profile yet\n`);
}

seedBrotherApplication()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
