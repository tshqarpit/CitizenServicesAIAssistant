const jsonwebtoken = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const token = jsonwebtoken.sign({ userId: 1, email: 'test@example.com' }, process.env.JWT_SECRET || 'fallback_secret');

async function testRequest(msg) {
  try {
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: msg })
    });
    const text = await res.text();
    console.log(`[${msg}] Status: ${res.status}`);
    console.log(`[${msg}] Response: ${text}`);
  } catch (err) {
    console.error(`[${msg}] Fetch error:`, err.message);
  }
}

async function run() {
  await testRequest('hi');
  await testRequest('How can I apply for e-fir?');
}

run();
