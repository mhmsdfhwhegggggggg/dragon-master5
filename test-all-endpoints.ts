import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/trpc';

async function testEndpoint(name: string, path: string, input: any = {}, method: 'GET' | 'POST' = 'POST') {
  console.log(`Testing ${name}...`);
  try {
    let response;
    if (method === 'POST') {
      response = await axios.post(`${BASE_URL}/${path}`, { json: input });
    } else {
      const params = encodeURIComponent(JSON.stringify(input));
      response = await axios.get(`${BASE_URL}/${path}?batch=1&input=%7B%220%22%3A%7B%22json%22%3A${params}%7D%7D`);
    }
    console.log(`✅ ${name} passed:`, JSON.stringify(response.data).substring(0, 100) + '...');
    return true;
  } catch (error: any) {
    console.error(`❌ ${name} failed:`, error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('=== Starting API Endpoint Tests ===');
  
  // 1. Health check
  try {
    const health = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Health check passed:', health.data);
  } catch (e: any) {
    console.error('❌ Health check failed:', e.message);
  }

  // Note: These tests will fail without a valid session token
  // But we can check if they return 403 (Unauthorized) vs 500 (Server Error)
  console.log('\n--- Testing Protected Endpoints (Expected to fail with 403 if no token) ---');
  
  await testEndpoint('Dashboard Stats', 'dashboard.getStats', {}, 'GET');
  await testEndpoint('Accounts GetAll', 'accounts.getAll', {}, 'GET');
  await testEndpoint('Stats Today', 'stats.getTodayStats', { accountId: 1 }, 'GET');
  
  console.log('\n=== Tests Completed ===');
}

runTests();
