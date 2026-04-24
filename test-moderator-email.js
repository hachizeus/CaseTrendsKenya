const fetch = require('node-fetch');

// Your actual moderator credentials
const MODERATOR_USER_ID = '60534c62-9a41-498b-801f-b84de20b0a3d';
const MODERATOR_EMAIL = 'info@casetrendskenya.co.ke';

// API URLs
const LOCAL_API = 'http://localhost:8000/api/send-email';
const PROD_API = 'https://casetrendskenya.onrender.com/api/send-email';

const testOrder = {
  id: 'test-order-' + Date.now(),
  customer_name: 'Victor',
  customer_email: 'victor@example.com',
  customer_phone: '+254759001048',
  delivery_method: 'pickup',
  status: 'confirmed',
  total_amount: 5000,
  items: [
    { name: 'Phone Case', price: 2500, quantity: 2, color: 'Black' }
  ],
  created_at: new Date().toISOString(),
  actor_role: 'moderator',
  user_id: MODERATOR_USER_ID
};

async function testEndpoint(url, role, useAuth) {
  console.log(\n========================================);
  console.log(Testing:  - );
  console.log(========================================);
  
  const body = {
    to: testOrder.customer_email,
    type: 'status_update',
    data: { ...testOrder, actor_role: role }
  };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (useAuth) {
    headers['Authorization'] = 'Bearer test-token';
  }

  console.log('Request Headers:', JSON.stringify(headers, null, 2));
  console.log('Request Body:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (response.status === 403) {
      console.log('\n⛔ 403 FORBIDDEN - Moderator is being blocked!');
    } else if (response.status === 200) {
      console.log('\n✅ SUCCESS - Email would be sent');
    }

    return { success: response.ok, status: response.status, role };
  } catch (err) {
    console.error('Error:', err.message);
    return { success: false, status: 0, error: err.message, role };
  }
}

async function runTests() {
  console.log('MODERATOR EMAIL TEST');
  console.log('Moderator: ' + MODERATOR_EMAIL);
  console.log('User ID: ' + MODERATOR_USER_ID);
  console.log('');

  // Test production API with both roles
  console.log('\n>>> TESTING PRODUCTION API <<<');
  const adminResult = await testEndpoint(PROD_API, 'admin', true);
  const modResult = await testEndpoint(PROD_API, 'moderator', true);

  // Summary
  console.log('\n\n====================');
  console.log('RESULTS');
  console.log('====================');
  console.log('Admin: ' + (adminResult.success ? '✅ Works' : '❌ Failed (Status: ' + adminResult.status + ')'));
  console.log('Moderator: ' + (modResult.success ? '✅ Works' : '❌ Failed (Status: ' + modResult.status + ')'));

  if (adminResult.success && !modResult.success) {
    console.log('\n🔴 CONFIRMED: Moderator is blocked while admin works');
    console.log('Fix needed: Update backend to allow moderator role');
  }
}

runTests().catch(console.error);
