const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Apple credentials from environment
const teamId = process.env.APPLE_TEAM_ID;
const keyId = process.env.APPLE_KEY_ID;
const clientId = process.env.APPLE_CLIENT_ID;
const privateKey = process.env.APPLE_PRIVATE_KEY;

if (!teamId || !keyId || !clientId || !privateKey) {
  console.error('Missing Apple credentials in .env.local');
  process.exit(1);
}

// Generate JWT token for Apple client secret
const now = Math.floor(Date.now() / 1000);
const payload = {
  iss: teamId,
  iat: now,
  exp: now + (6 * 30 * 24 * 60 * 60), // 6 months
  aud: 'https://appleid.apple.com',
  sub: clientId,
};

try {
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      kid: keyId,
      typ: 'JWT'
    }
  });
  
  console.log('Generated Apple Client Secret JWT:');
  console.log(token);
  console.log('\nAdd this to your .env.local as APPLE_CLIENT_SECRET');
  
} catch (error) {
  console.error('Error generating Apple client secret:', error.message);
}