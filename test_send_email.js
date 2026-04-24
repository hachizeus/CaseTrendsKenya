const fetch = require('node-fetch');

const API_URL = 'http://localhost:8000/api/send-email';

async function testSendEmail(role) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: 'customer@example.com',
      type: 'status_update',
      data: {
        id: 'order123',
        customer_name: 'John Doe',
        status: 'confirmed',
      },
      role,
    }),
  });

  const result = await response.json();
  console.log(`Role: ${role}, Status: ${response.status}, Response:`, result);
}

(async () => {
  console.log('Testing admin role...');
  await testSendEmail('admin');

  console.log('Testing moderator role...');
  await testSendEmail('moderator');

  console.log('Testing unauthorized role...');
  await testSendEmail('user');
})();