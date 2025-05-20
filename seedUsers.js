// #!/usr/bin/env node
// seedUsers.js

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import readline from 'node:readline';

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('email', {
    alias: 'e',
    type: 'string',
    description: 'User email address',
    demandOption: true,
  })
  .option('password', {
    alias: 'p',
    type: 'string',
    description: 'User password (optional, will be generated if not provided)',
  })
  .option('role', {
    alias: 'r',
    type: 'string',
    choices: ['super_admin', 'admin', 'teacher', 'student'],
    description: 'User role',
    demandOption: true,
  })
  .option('force', {
    alias: 'f',
    type: 'boolean',
    description: 'Skip confirmation prompt',
    default: false,
  })
  .help()
  .alias('help', 'h').argv;

// Check environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\x1b[31mERROR: Missing environment variables\x1b[0m');
  console.error('Please create a .env file with:');
  console.error('SUPABASE_URL=your-project-url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

// Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate a random password
const generatePassword = () => {
  const length = 16;
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Confirm user creation
const promptForConfirmation = async () => {
  if (argv.force) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\x1b[33m⚠️  WARNING: You are about to create a user with high privileges!\x1b[0m');
  console.log(`Email: ${argv.email}`);
  console.log(`Role: ${argv.role}`);

  return new Promise((resolve) => {
    rl.question('Are you sure you want to continue? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
};

// Create or update user
const createUser = async () => {
  try {
    const confirmed = await promptForConfirmation();
    if (!confirmed) {
      console.log('Operation cancelled.');
      process.exit(0);
    }

    const password = argv.password || generatePassword();

    console.log('\x1b[36mCreating user in Supabase Auth...\x1b[0m');

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: argv.email,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.error('\x1b[31mUser already exists.\x1b[0m');

        const { data: existingUsers, error: fetchError } =
          await supabase.auth.admin.listUsers();

        if (fetchError) throw fetchError;

        const existingUser = existingUsers.users.find((u) => u.email === argv.email);
        if (!existingUser) {
          console.error('\x1b[31mFailed to find existing user.\x1b[0m');
          process.exit(1);
        }

        console.log('\x1b[36mUser exists, updating profile only...\x1b[0m');
        await updateUserProfile(existingUser.id);
      } else {
        throw authError;
      }
    } else {
      console.log('\x1b[32mUser created successfully!\x1b[0m');
      if (!argv.password) {
        console.log('\x1b[32mGenerated password:\x1b[0m', password);
      }

      await updateUserProfile(authUser.user.id);
    }
  } catch (error) {
    console.error('\x1b[31mError creating user:\x1b[0m', error?.message || JSON.stringify(error, null, 2));
    process.exit(1);
  }
};

// Create or update user profile
// const updateUserProfile = async (userId) => {
//   try {
//     console.log('\x1b[36mCreating user profile...\x1b[0m');

//     const { data: existingProfile, error: fetchError } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', userId)
//       .single();

//     if (!fetchError && existingProfile) {
//       const { error: updateError } = await supabase
//         .from('profiles')
//         .update({
//           role: argv.role,
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', userId);

//       if (updateError) throw updateError;

//       console.log('\x1b[32mProfile updated successfully!\x1b[0m');
//     } else {
//       const { error: insertError } = await supabase.from('profiles').insert([
//         {
//           id: userId,
//           email: argv.email,
//           role: argv.role,
//           google_linked: false,
//         },
//       ]);

//       if (insertError) throw insertError;

//       console.log('\x1b[32mProfile created successfully!\x1b[0m');
//     }

//     console.log('\x1b[32mOperation completed successfully!\x1b[0m');
//     console.log('\x1b[32mUser ID:\x1b[0m', userId);
//     console.log('\x1b[32mEmail:\x1b[0m', argv.email);
//     console.log('\x1b[32mRole:\x1b[0m', argv.role);
//   } catch (error) {
//     console.error('\x1b[31mError updating profile:\x1b[0m', error?.message || JSON.stringify(error, null, 2));
//     process.exit(1);
//   }
// };
// const updateUserProfile = async (userId) => {
//   try {
//     console.log('\x1b[36mCreating user profile...\x1b[0m');

//     console.log('Fetching existing profile for userId:', userId);
//     const { data: existingProfile, error: fetchError } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', userId)
//       .single();

//     console.log('Fetch profile result:', { existingProfile, fetchError });

//     if (!fetchError && existingProfile) {
//       console.log('Updating existing profile...');
//       const { error: updateError, data: updateData } = await supabase
//         .from('profiles')
//         .update({
//           role: argv.role,
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', userId);

//       console.log('Update profile result:', { updateError, updateData });

//       if (updateError) throw updateError;

//       console.log('\x1b[32mProfile updated successfully!\x1b[0m');
//     } else {
//       console.log('Inserting new profile...');
//       const { error: insertError, data: insertData } = await supabase.from('profiles').insert([
//         {
//           id: userId,
//           email: argv.email,
//           role: argv.role,
//           google_linked: false,
//         },
//       ]);

//       console.log('Insert profile result:', { insertError, insertData });

//       if (insertError) throw insertError;

//       console.log('\x1b[32mProfile created successfully!\x1b[0m');
//     }

//     console.log('\x1b[32mOperation completed successfully!\x1b[0m');
//     console.log('\x1b[32mUser ID:\x1b[0m', userId);
//     console.log('\x1b[32mEmail:\x1b[0m', argv.email);
//     console.log('\x1b[32mRole:\x1b[0m', argv.role);
//   } catch (error) {
//     console.error('\x1b[31mError updating profile:\x1b[0m', error);
//     if (error.details) console.error('Details:', error.details);
//     if (error.hint) console.error('Hint:', error.hint);
//     if (error.message) console.error('Message:', error.message);
//     process.exit(1);
//   }
// };
const updateUserProfile = async (userId) => {
  try {
    console.log('\x1b[36mCreating user profile...\x1b[0m');

    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingProfile) {
      console.log('Updating existing profile...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: argv.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      console.log('\x1b[32mProfile updated successfully!\x1b[0m');
    } else {
      console.log('Inserting new profile...');
      const { error: insertError } = await supabase.from('profiles').insert([
        {
          id: userId,
          email: argv.email,
          role: argv.role,
          google_linked: false,
        },
      ]);

      if (insertError) throw insertError;

      console.log('\x1b[32mProfile created successfully!\x1b[0m');
    }

    console.log('\x1b[32mOperation completed successfully!\x1b[0m');
    console.log('\x1b[32mUser ID:\x1b[0m', userId);
    console.log('\x1b[32mEmail:\x1b[0m', argv.email);
    console.log('\x1b[32mRole:\x1b[0m', argv.role);
  } catch (error) {
    console.error('\x1b[31mError updating profile:\x1b[0m', error);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    if (error.message) console.error('Message:', error.message);
    process.exit(1);
  }
};

// Start
createUser();
