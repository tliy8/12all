import { db } from './src/lib/database';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  const { data, error } = await db.from('platform_credentials').insert({
    id: uuidv4(),
    platform_name: 'facebook',
    auth_payload: 'dummy_encrypted_payload',
    metadata: {
      name: 'Facebook Page Demo',
      pageName: 'My Awesome Page'
    },
    is_active: true,
    updated_at: new Date().toISOString()
  }).select();

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Inserted dummy account:', data);
  }
}

run();
