import axios from 'axios';
import superjson from 'superjson';

const BASE_URL = 'http://localhost:3000/api/trpc';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcGVuSWQiOiJ1c2VyQGV4YW1wbGUuY29tIiwiYXBwSWQiOiJkcmFnb24tdGVsZWdyYW0tcHJvIiwibmFtZSI6IkRyYWdvblVzZXIiLCJleHAiOjE4MDE3OTEzODV9.Cqx8EmVJ3Z0HE3_nN4RA2yMJpt_nUSfJf9RgzKDG7e4';

async function testEndpoint(name: string, path: string, input: any = {}, method: 'GET' | 'POST' = 'POST') {
  console.log(`Testing ${name}...`);
  try {
    let response;
    const headers = { Authorization: `Bearer ${TOKEN}` };
    
    if (method === 'POST') {
      const payload = superjson.serialize(input);
      response = await axios.post(`${BASE_URL}/${path}`, { json: payload.json, meta: payload.meta }, { headers });
    } else {
      const serialized = superjson.serialize(input);
      const inputParam = encodeURIComponent(JSON.stringify({ "0": serialized }));
      response = await axios.get(`${BASE_URL}/${path}?batch=1&input=${inputParam}`, { headers });
    }
    console.log(`✅ ${name} passed:`, JSON.stringify(response.data).substring(0, 100) + '...');
    return true;
  } catch (error: any) {
    console.error(`❌ ${name} failed:`, error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('=== Starting API Endpoint Tests with Token ===');
  
  await testEndpoint('Dashboard Stats', 'dashboard.getStats', {}, 'GET');
  await testEndpoint('Accounts GetAll', 'accounts.getAll', {}, 'GET');
  await testEndpoint('Stats Today', 'stats.getTodayStats', { accountId: 1 }, 'GET');
  
  console.log('\n=== Tests Completed ===');
}

runTests();
