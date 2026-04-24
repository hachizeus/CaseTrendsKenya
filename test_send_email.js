const fetch = require('node-fetch');

// Your actual moderator credentials from the database
const MODERATOR_USER_ID = '60534c62-9a41-498b-801f-b84de20b0a3d';
const MODERATOR_EMAIL = 'info@casetrendskenya.co.ke';
const MODERATOR_ROLE_ID = '8d38eeca-6c8c-4301-bcf7-0a3a4e482467';

// API URLs - test both local and production
const LOCAL_API = 'http://localhost:8000/api/send-email';
const PROD_API = 'https://casetrendskenya.onrender.com/api/send-email';

// Test data simulating a real order status update
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
  actor_role: 'moderator', // This is crucial - tells the backend who is sending
  user_id: MODERATOR_USER_ID
};

// Simulated Supabase session token (you might need to get a real one)
const MOCK_SESSION_TOKEN = 'mock-session-token-for-testing';

async function testEmailEndpoint(apiUrl, role, useAuth = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${role.toUpperCase()} - ${apiUrl}`);
  console.log(`${'='.repeat(60)}`);
  
  const emailBody = {
    to: testOrder.customer_email,
    type: 'status_update',
    data: {
      ...testOrder,
      actor_role: role, // Include the role in the data
    }
  };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add mock authorization if testing with auth
  if (useAuth) {
    headers['Authorization'] = `Bearer ${MOCK_SESSION_TOKEN}`;
  }

  console.log('📤 Request Details:');
  console.log('  URL:', apiUrl);
  console.log('  Method: POST');
  console.log('  Headers:', JSON.stringify(headers, null, 2));
  console.log('  Body:', JSON.stringify(emailBody, null, 2));

  try {
    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(emailBody),
    });
    const endTime = Date.now();

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('\n📥 Response Details:');
    console.log('  Status:', response.status, response.statusText);
    console.log('  Time:', (endTime - startTime) + 'ms');
    console.log('  Headers:', JSON.stringify(Object.fromEntries(response.headers), null, 2));
    console.log('  Body:', JSON.stringify(responseData, null, 2));

    // Check for common issues
    if (response.status === 403) {
      console.log('\n⛔ 403 FORBIDDEN DETECTED!');
      console.log('  Possible causes:');
      console.log('  1. Role-based access control blocking moderator');
      console.log('  2. Missing or invalid authentication token');
      console.log('  3. CORS policy blocking the request');
      console.log('  4. IP or origin restriction');
    } else if (response.status === 401) {
      console.log('\n🔐 401 UNAUTHORIZED DETECTED!');
      console.log('  Authentication is required but not provided or invalid');
    } else if (response.status === 200) {
      console.log('\n✅ SUCCESS! Email would be sent');
    } else if (response.status === 404) {
      console.log('\n❌ 404 NOT FOUND - Endpoint does not exist');
      console.log('  The API endpoint might not be deployed yet');
    }

    return {
      success: response.ok,
      status: response.status,
      data: responseData,
      role
    };
  } catch (error) {
    console.error('\n❌ Network Error:', error.message);
    console.log('  This usually means:');
    console.log('  1. The API server is not running');
    console.log('  2. Wrong URL or port');
    console.log('  3. Network connectivity issue');
    
    return {
      success: false,
      status: 0,
      error: error.message,
      role
    };
  }
}

async function testModeratorSpecific() {
  console.log('\n🔍 TESTING MODERATOR-SPECIFIC SCENARIOS');
  console.log('Moderator Details:');
  console.log('  User ID:', MODERATOR_USER_ID);
  console.log('  Email:', MODERATOR_EMAIL);
  console.log('  Role ID:', MODERATOR_ROLE_ID);
  console.log('  Role:', 'moderator');

  // Test the actual data structure sent from the frontend
  const actualFrontendPayload = {
    to: 'victor@example.com',
    type: 'status_update',
    data: {
      id: 'actual-order-123',
      customer_name: 'Victor',
      customer_email: 'victor@example.com',
      customer_phone: '+254759001048',
      delivery_method: 'pickup',
      status: 'confirmed',
      total_amount: 5000,
      items: [{ name: 'Phone Case', price: 2500, quantity: 2 }],
      created_at: new Date().toISOString(),
      actor_role: 'moderator', // This is what the frontend sends
      user_id: MODERATOR_USER_ID
    }
  };

  console.log('\n📦 Actual Frontend Payload:');
  console.log(JSON.stringify(actualFrontendPayload, null, 2));

  return actualFrontendPayload;
}

async function runAllTests() {
  console.log('🚀 STARTING MODERATOR EMAIL TESTS');
  console.log('Time:', new Date().toISOString());
  
  const results = [];

  // Test 1: Local API - Admin role (baseline)
  results.push(await testEmailEndpoint(LOCAL_API, 'admin', true));
  
  // Test 2: Local API - Moderator role (the problematic case)
  results.push(await testEmailEndpoint(LOCAL_API, 'moderator', true));
  
  // Test 3: Local API - Moderator without auth
  results.push(await testEmailEndpoint(LOCAL_API, 'moderator', false));
  
  // Test 4: Production API - Admin role (should work)
  results.push(await testEmailEndpoint(PROD_API, 'admin', true));
  
  // Test 5: Production API - Moderator role (the actual issue)
  results.push(await testEmailEndpoint(PROD_API, 'moderator', true));
  
  // Test 6: Production API - Moderator without auth
  results.push(await testEmailEndpoint(PROD_API, 'moderator', false));

  // Test moderator-specific payload
  const moderatorPayload = await testModeratorSpecific();

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const forbidden = results.filter(r => r.status === 403);
  
  console.log(`Total tests: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⛔ 403 Forbidden: ${forbidden.length}`);
  
  if (forbidden.length > 0) {
    console.log('\n🔴 ISSUE CONFIRMED: Moderator getting 403 Forbidden');
    console.log('The backend is explicitly rejecting moderator requests');
    console.log('\nRecommended fixes:');
    console.log('1. Check backend middleware for role restrictions');
    console.log('2. Update authorizeRoles to include "moderator"');
    console.log('3. Check if the deployed code matches your source');
    console.log('4. Verify CORS settings allow all origins');
  }

  // Specific recommendations based on results
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (results.some(r => r.role === 'admin' && r.success) && 
      results.some(r => r.role === 'moderator' && !r.success)) {
    console.log('✅ Admin works, ❌ Moderator fails - This confirms role-based blocking');
    console.log('Solution: Update backend to allow moderator role');
  }
  
  if (results.every(r => r.status === 404 || r.status === 0)) {
    console.log('❌ Endpoint not found - Deploy the backend first');
    console.log('Solution: Deploy your Express backend to Render');
  }
}

// Run the tests
runAllTests().catch(console.error);