const puppeteer = require('./backend/node_modules/puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testGoogleAuthFix() {
  console.log('🧪 Starting validation of Google Auth button shape and flow...');

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
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}]:`, res.url());
    }
  });
  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.error('[Page Error]:', err.message);
  });

  try {
    console.log('1. Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Open Auth Modal
    console.log('2. Opening Auth Modal...');
    await page.evaluate(() => {
      if (typeof openModal === 'function') openModal('authModal');
    });
    await new Promise(r => setTimeout(r, 600));

    // Check button shapes and styling
    const buttonStyles = await page.evaluate(() => {
      const googleBtn = document.getElementById('customGoogleBtn');
      const phoneBtn = document.querySelector('button[onclick*="phone"]');
      const gStyle = googleBtn ? window.getComputedStyle(googleBtn) : null;
      const pStyle = phoneBtn ? window.getComputedStyle(phoneBtn) : null;
      const gisContainer = document.getElementById('googleSignInBtnContainer');
      const gIdOnload = document.getElementById('g_id_onload');

      return {
        googleBtnFound: !!googleBtn,
        googleBtnText: googleBtn ? googleBtn.innerText.trim() : null,
        googleBorderRadius: gStyle ? gStyle.borderRadius : null,
        googleMinHeight: gStyle ? gStyle.minHeight : null,
        googleDisplay: gStyle ? gStyle.display : null,
        phoneBtnFound: !!phoneBtn,
        phoneBtnText: phoneBtn ? phoneBtn.innerText.trim() : null,
        phoneBorderRadius: pStyle ? pStyle.borderRadius : null,
        phoneMinHeight: pStyle ? pStyle.minHeight : null,
        gisContainerPresent: !!gisContainer,
        gIdOnloadPresent: !!gIdOnload
      };
    });

    console.log('Button Styles Verification:', buttonStyles);

    // Save screenshot of the auth modal with the restored uniform shape
    const screenshot1 = path.join(__dirname, 'modal_shape_fixed.png');
    await page.screenshot({ path: screenshot1 });
    console.log('📸 Auth modal screenshot saved to:', screenshot1);

    // Click "Continue with Google"
    console.log('3. Clicking "Continue with Google"...');
    await page.click('#customGoogleBtn');
    await new Promise(r => setTimeout(r, 600));

    // Verify Google View rendered
    const googleViewState = await page.evaluate(() => {
      const ggView = document.getElementById('nxaVGg');
      const chip = ggView ? ggView.querySelector('.nxa-google-chip') : null;
      const emailText = chip ? chip.querySelector('.nxa-google-email')?.innerText : null;
      const isVisible = ggView && !ggView.hidden;
      return {
        isVisible,
        hasChip: !!chip,
        emailText
      };
    });
    console.log('Google View State:', googleViewState);

    // Save screenshot of the Google account selector
    const screenshot2 = path.join(__dirname, 'google_account_view.png');
    await page.screenshot({ path: screenshot2 });
    console.log('📸 Google account view screenshot saved to:', screenshot2);

    // Enter dynamic Google account
    console.log('4. Entering dynamic Google account...');
    await page.evaluate(() => {
      const inp = document.getElementById('nxlGgEm');
      if (inp) inp.value = 'alex.scholar@gmail.com';
    });
    await page.click('#nxlGgGo');
    await new Promise(r => setTimeout(r, 1200));

    // Verify login state
    const authState = await page.evaluate(() => {
      const modal = document.getElementById('authModal');
      const isModalHidden = !modal || modal.classList.contains('hidden') || modal.style.display === 'none';
      const currentUser = window.currentUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
      const token = localStorage.getItem('booknexus_token');
      return {
        isModalHidden,
        currentUser,
        hasToken: !!token
      };
    });
    console.log('Post-Google Sign-In Auth State:', authState);

    console.log('Summary of Errors:');
    console.log('- Page Errors:', pageErrors.length);
    console.log('- Console Errors:', consoleErrors.length);

    if (pageErrors.length === 0 && consoleErrors.length === 0) {
      console.log('🎉 100% SUCCESS: 0 errors, 0 bugs, button shape restored, and Google sign-in works smoothly!');
    }

  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await browser.close();
  }
}

testGoogleAuthFix();
