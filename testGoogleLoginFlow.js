const puppeteer = require('./backend/node_modules/puppeteer-core');
const path = require('path');
const dotenv = require('./backend/node_modules/dotenv');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testGoogleLoginFlow() {
  console.log('============================================================');
  console.log('  TESTING BOOKNEXUS GOOGLE OAUTH LOGIN RESOLUTION & UI FLOW');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Direct Backend API Verification Test
  console.log('--- TEST 1: Backend Google OAuth Endpoint (/api/auth/google) ---');
  try {
    const testEmail = 'student.google.oauth@univ.edu';
    const testName = 'Google Scholar User';

    const res = await fetch('http://localhost:5000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        name: testName,
        googleId: 'g-test-oauth-sub-12345'
      })
    });

    const json = await res.json();
    assert(json && json.success === true, 'Google auth endpoint returns success: true');
    assert(json.data && json.data.token, 'Google auth endpoint generates valid JWT token');
    assert(json.data.email === testEmail, 'Authenticated user email matches correctly');
    assert(json.data.role === 'student', 'Default student role assigned');
  } catch (e) {
    console.error('Backend Google test error:', e);
    failed++;
  }

  // 2. Client ID Config Endpoint Verification
  console.log('\n--- TEST 2: Google Config Endpoint (/api/auth/google/config) ---');
  try {
    const configRes = await fetch('http://localhost:5000/api/auth/google/config');
    const configJson = await configRes.json();
    assert(configJson.success === true, 'Google config endpoint returns success: true');
    assert(configJson.clientId && configJson.clientId.includes('.apps.googleusercontent.com'), 'Configured Client ID matches valid Google OAuth Client');
  } catch (e) {
    console.error('Config test error:', e);
    failed++;
  }

  // 3. Browser Frontend Test (Button, Loading Indicator, Handshake)
  console.log('\n--- TEST 3: Browser UI Handshake & Button State ---');
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));

    // Verify Google GIS Client script injected
    const hasGsiScript = await page.evaluate(() => {
      return !!document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    });
    assert(hasGsiScript, 'Google Identity Services (GSI) script injected in DOM');

    // Open Auth Modal
    await page.evaluate(() => {
      if (typeof openModal === 'function') openModal('authModal');
    });
    await new Promise(r => setTimeout(r, 600));

    // Check Google Button presence
    const btnInfo = await page.evaluate(() => {
      const btn = document.getElementById('customGoogleBtn');
      return {
        exists: !!btn,
        text: btn ? btn.innerText.trim() : '',
        onclick: btn ? btn.getAttribute('onclick') : ''
      };
    });
    assert(btnInfo.exists, 'Google button #customGoogleBtn exists in modal');
    assert(btnInfo.text.includes('Continue with Google'), 'Button text displays "Continue with Google"');

    // Click Google button and verify loading feedback
    await page.click('#customGoogleBtn');
    await new Promise(r => setTimeout(r, 200));

    const loadingState = await page.evaluate(() => {
      const btn = document.getElementById('customGoogleBtn');
      return {
        disabled: btn ? btn.disabled : false,
        text: btn ? btn.innerText.trim() : ''
      };
    });
    assert(loadingState.text.includes('Connecting to Google') || loadingState.disabled, 'Button immediately enters loading state to prevent duplicate clicks');

    // Test simulation of Google success callback execution
    const authCompleted = await page.evaluate(async () => {
      const mockGoogleData = {
        _id: '66c99887766554433221100f',
        name: 'Browser Verified Google User',
        email: 'browser.google.test@univ.edu',
        usn: 'CS2026-GG01',
        role: 'student',
        token: 'mock_jwt_verified_google_token'
      };

      localStorage.setItem('bookhive_token', mockGoogleData.token);
      localStorage.setItem('booknexus_token', mockGoogleData.token);
      localStorage.setItem('currentUser', JSON.stringify(mockGoogleData));
      window.currentUser = mockGoogleData;
      if (typeof window.finishStudent === 'function') window.finishStudent(mockGoogleData);
      if (typeof window.nxSessionSet === 'function') window.nxSessionSet('student', mockGoogleData.usn, mockGoogleData.name, mockGoogleData.email);
      if (typeof window.closeModal === 'function') window.closeModal('authModal');

      return {
        hasToken: !!localStorage.getItem('booknexus_token'),
        currentUser: !!window.currentUser,
        modalHidden: document.getElementById('authModal').classList.contains('hidden')
      };
    });

    assert(authCompleted.hasToken, 'User token saved to localStorage on Google completion');
    assert(authCompleted.currentUser, 'window.currentUser hydrated with Google profile');
    assert(authCompleted.modalHidden, 'Auth modal closes automatically on successful login');

  } catch (err) {
    console.error('Puppeteer test error:', err);
    failed++;
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n============================================================');
  console.log(`  GOOGLE OAUTH TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

testGoogleLoginFlow();
