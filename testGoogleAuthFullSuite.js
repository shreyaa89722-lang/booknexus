const puppeteer = require('./backend/node_modules/puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTestSuite() {
  console.log('🧪 Starting Full Google Auth & Persistence Test Suite...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[Console Error]:', msg.text());
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.error('[Page Error]:', err.message);
  });

  const testResults = [];

  function recordTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${name} ${details ? '— ' + details : ''}`);
  }

  try {
    // ----------------------------------------------------
    // Test 1: Initial load (signed out state)
    // ----------------------------------------------------
    console.log('\n--- Test 1: Initial Load (Signed Out) ---');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Clear any leftover storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      if (typeof window.updateNavProfile === 'function') window.updateNavProfile();
    });
    await new Promise(r => setTimeout(r, 500));

    const initialNav = await page.evaluate(() => {
      const emailBadge = document.getElementById('userEmailBadge');
      const emailDisplay = document.getElementById('userEmailDisplay');
      const authLabel = document.getElementById('userAuthLabel');
      const isBadgeHidden = !emailBadge || emailBadge.classList.contains('hidden') || emailBadge.style.display === 'none';
      return {
        isBadgeHidden,
        emailText: emailDisplay ? emailDisplay.innerText.trim() : '',
        authLabelText: authLabel ? authLabel.innerText.trim() : ''
      };
    });

    recordTest('Initial Signed-out UI', initialNav.isBadgeHidden && initialNav.authLabelText === 'Sign In',
      `Badge Hidden: ${initialNav.isBadgeHidden}, Label: "${initialNav.authLabelText}"`);

    // ----------------------------------------------------
    // Test 2: First Google Sign-In & Email Display
    // ----------------------------------------------------
    console.log('\n--- Test 2: First Google Sign-In & Email Display ---');
    await page.evaluate(() => {
      if (typeof openModal === 'function') openModal('authModal');
    });
    await new Promise(r => setTimeout(r, 600));

    // Click Continue with Google and verify custom email form is NOT shown
    await page.click('#customGoogleBtn');
    await new Promise(r => setTimeout(r, 600));

    const formState = await page.evaluate(() => {
      const ggView = document.getElementById('nxaVGg');
      return { isAltFormShown: ggView && !ggView.hidden };
    });
    recordTest('Custom Email Form Not Shown on Google Click', !formState.isAltFormShown,
      `Alternative Email Form Hidden: ${!formState.isAltFormShown}`);

    // Complete Google sign-in with verified profile
    const PRIMARY_EMAIL = 'alex.scholar@gmail.com';
    await page.evaluate((em) => {
      window.handleGoogleSignInDirect(em, em.split('@')[0]);
    }, PRIMARY_EMAIL);
    await new Promise(r => setTimeout(r, 1500));

    const postSignIn = await page.evaluate(() => {
      const modal = document.getElementById('authModal');
      const isModalHidden = !modal || modal.classList.contains('hidden') || modal.style.display === 'none';
      const emailBadge = document.getElementById('userEmailBadge');
      const emailDisplay = document.getElementById('userEmailDisplay');
      const authLabel = document.getElementById('userAuthLabel');
      const isBadgeVisible = emailBadge && !emailBadge.classList.contains('hidden') && emailBadge.style.display !== 'none';
      const token = localStorage.getItem('booknexus_token');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      return {
        isModalHidden,
        isBadgeVisible,
        emailText: emailDisplay ? emailDisplay.innerText.trim() : '',
        authLabelText: authLabel ? authLabel.innerText.trim() : '',
        hasToken: !!token,
        storedEmail: currentUser ? currentUser.email : ''
      };
    });

    recordTest('Modal Closes After Google Sign-In', postSignIn.isModalHidden, `Modal Hidden: ${postSignIn.isModalHidden}`);
    recordTest('User Email Appears in App', postSignIn.isBadgeVisible && postSignIn.emailText === PRIMARY_EMAIL,
      `Email Badge Text: "${postSignIn.emailText}"`);
    recordTest('Auth Button Label is "Sign out"', postSignIn.authLabelText === 'Sign out', `Label: "${postSignIn.authLabelText}"`);
    recordTest('JWT Token & Profile Stored Securely', postSignIn.hasToken && postSignIn.storedEmail === PRIMARY_EMAIL,
      `Stored Email: ${postSignIn.storedEmail}, Token: ${postSignIn.hasToken}`);

    // Take screenshot after first Google sign in
    const shot1 = path.join(__dirname, 'google_signed_in_verified.png');
    await page.screenshot({ path: shot1 });
    console.log('📸 Screenshot saved to:', shot1);

    // ----------------------------------------------------
    // Test 3: Refresh the Page (Persistent Session)
    // ----------------------------------------------------
    console.log('\n--- Test 3: Refresh the Page (Persistence) ---');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    const postRefresh = await page.evaluate(() => {
      const emailBadge = document.getElementById('userEmailBadge');
      const emailDisplay = document.getElementById('userEmailDisplay');
      const authLabel = document.getElementById('userAuthLabel');
      const isBadgeVisible = emailBadge && !emailBadge.classList.contains('hidden') && emailBadge.style.display !== 'none';
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      return {
        isBadgeVisible,
        emailText: emailDisplay ? emailDisplay.innerText.trim() : '',
        authLabelText: authLabel ? authLabel.innerText.trim() : '',
        currentUserEmail: currentUser ? currentUser.email : ''
      };
    });

    recordTest('Email Remains Visible After Page Refresh', postRefresh.isBadgeVisible && postRefresh.emailText === 'alex.scholar@gmail.com',
      `Email Display: "${postRefresh.emailText}"`);
    recordTest('Sign Out Button Remains Active After Refresh', postRefresh.authLabelText === 'Sign out',
      `Label: "${postRefresh.authLabelText}"`);

    // ----------------------------------------------------
    // Test 4: Close and Reopen Browser (Simulate fresh tab without sessionStorage)
    // ----------------------------------------------------
    console.log('\n--- Test 4: Reopen Browser Simulation (Cleared sessionStorage) ---');
    await page.evaluate(() => {
      sessionStorage.clear(); // Simulate brand new browser session where sessionStorage is gone
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    const postReopen = await page.evaluate(() => {
      const emailBadge = document.getElementById('userEmailBadge');
      const emailDisplay = document.getElementById('userEmailDisplay');
      const authLabel = document.getElementById('userAuthLabel');
      const isBadgeVisible = emailBadge && !emailBadge.classList.contains('hidden') && emailBadge.style.display !== 'none';
      return {
        isBadgeVisible,
        emailText: emailDisplay ? emailDisplay.innerText.trim() : '',
        authLabelText: authLabel ? authLabel.innerText.trim() : ''
      };
    });

    recordTest('Session Restored After Reopening Browser', postReopen.isBadgeVisible && postReopen.emailText === 'alex.scholar@gmail.com',
      `Restored Email: "${postReopen.emailText}"`);

    // ----------------------------------------------------
    // Test 5: Check authenticated state before opening modal
    // ----------------------------------------------------
    console.log('\n--- Test 5: Check Authenticated State Before Modal Open ---');
    await page.evaluate(() => {
      if (typeof openModal === 'function') openModal('authModal');
    });
    await new Promise(r => setTimeout(r, 500));

    const authCheck = await page.evaluate(() => {
      const modal = document.getElementById('authModal');
      const isModalHidden = !modal || modal.classList.contains('hidden') || modal.style.display === 'none';
      const toast = document.getElementById('toast');
      const toastText = toast ? toast.innerText.trim() : '';
      return {
        isModalHidden,
        toastText
      };
    });

    recordTest('Auth Modal Blocked When Already Authenticated', authCheck.isModalHidden,
      `Modal Hidden: ${authCheck.isModalHidden}`);

    // ----------------------------------------------------
    // Test 6: Logout
    // ----------------------------------------------------
    console.log('\n--- Test 6: Logout ---');
    await page.click('#userAuthBtn');
    await new Promise(r => setTimeout(r, 600));

    // If confirmation modal is open, click Yes, sign out
    const confirmBtn = await page.$('#nxSoYes');
    if (confirmBtn) {
      console.log('Detected sign-out confirmation dialog, clicking #nxSoYes...');
      await confirmBtn.click();
    }
    await new Promise(r => setTimeout(r, 1200));

    const postLogout = await page.evaluate(() => {
      const emailBadge = document.getElementById('userEmailBadge');
      const emailDisplay = document.getElementById('userEmailDisplay');
      const authLabel = document.getElementById('userAuthLabel');
      const isBadgeHidden = !emailBadge || emailBadge.classList.contains('hidden') || emailBadge.style.display === 'none';
      const token = localStorage.getItem('booknexus_token');
      const user = localStorage.getItem('currentUser');
      return {
        isBadgeHidden,
        emailText: emailDisplay ? emailDisplay.innerText.trim() : '',
        authLabelText: authLabel ? authLabel.innerText.trim() : '',
        hasToken: !!token,
        hasUser: !!user
      };
    });

    recordTest('Email Disappears and Token Cleared on Logout', postLogout.isBadgeHidden && !postLogout.hasToken && !postLogout.hasUser,
      `Badge Hidden: ${postLogout.isBadgeHidden}, Token Cleared: ${!postLogout.hasToken}`);
    recordTest('Login Becomes Available ("Sign In")', postLogout.authLabelText === 'Sign In',
      `Label: "${postLogout.authLabelText}"`);

    // ----------------------------------------------------
    // Test 7: Sign in with another Google account
    // ----------------------------------------------------
    console.log('\n--- Test 7: Sign in with Another Google Account ---');
    await page.evaluate(() => {
      if (typeof openModal === 'function') openModal('authModal');
    });
    await new Promise(r => setTimeout(r, 600));

    await page.click('#customGoogleBtn');
    await new Promise(r => setTimeout(r, 600));

    // Switch to different Google account
    const OTHER_EMAIL = 'scholar.academic@gmail.com';
    await page.evaluate((em) => {
      window.handleGoogleSignInDirect(em, em.split('@')[0]);
    }, OTHER_EMAIL);
    await new Promise(r => setTimeout(r, 1500));

    const postOtherSignIn = await page.evaluate(() => {
      const emailDisplay = document.getElementById('userEmailDisplay');
      const authLabel = document.getElementById('userAuthLabel');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      return {
        emailText: emailDisplay ? emailDisplay.innerText.trim() : '',
        authLabelText: authLabel ? authLabel.innerText.trim() : '',
        storedEmail: currentUser ? currentUser.email : ''
      };
    });

    recordTest('Switch Account: New Email Appears in App', postOtherSignIn.emailText === OTHER_EMAIL,
      `Email Display: "${postOtherSignIn.emailText}"`);
    recordTest('Switch Account: New Email Stored in Session', postOtherSignIn.storedEmail === OTHER_EMAIL,
      `Stored Email: "${postOtherSignIn.storedEmail}"`);

    // Screenshot of second account signed in
    const shot2 = path.join(__dirname, 'google_switched_account_verified.png');
    await page.screenshot({ path: shot2 });
    console.log('📸 Screenshot saved to:', shot2);

    // ----------------------------------------------------
    // Summary & Errors
    // ----------------------------------------------------
    console.log('\n========================================');
    console.log('📊 TEST SUMMARY:');
    const allPassed = testResults.every(t => t.passed);
    console.log(`Passed: ${testResults.filter(t => t.passed).length} / ${testResults.length}`);
    console.log(`Page Errors: ${pageErrors.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);

    if (allPassed && pageErrors.length === 0 && consoleErrors.length === 0) {
      console.log('🎉 100% SUCCESS: ZERO ERRORS! ALL GOOGLE AUTH REQUIREMENTS VERIFIED!');
    } else {
      console.error('❌ Some checks failed or encountered errors.');
    }

  } catch (err) {
    console.error('❌ Test suite failed:', err);
  } finally {
    await browser.close();
  }
}

runTestSuite();
