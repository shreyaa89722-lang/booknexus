const puppeteer = require('./backend/node_modules/puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testFrontend() {
  console.log('🧪 Starting Puppeteer Integration Test for BookNexus...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.error('[Browser PageError]:', err.message);
  });

  try {
    console.log('1. Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Check title and basic layout
    const title = await page.title();
    console.log('Page Title:', title);

    // Verify bridge initialization and backend books sync
    const bridgeState = await page.evaluate(() => {
      return {
        booksDataLength: typeof booksData !== 'undefined' ? booksData.length : -1,
        librarianStudentsCount: typeof librarianStudentsList !== 'undefined' ? librarianStudentsList.length : -1,
        hasCollegeRecords: typeof NX_COLLEGE !== 'undefined' && Object.keys(NX_COLLEGE).length > 0,
        hasGoogleSignIn: typeof window.openGoogleSignIn === 'function',
      };
    });
    console.log('Bridge & Data State:', bridgeState);

    // Test Opening Auth Modal
    console.log('2. Opening Auth Modal...');
    await page.evaluate(() => {
      if (typeof openModal === 'function') openModal('authModal');
    });
    await new Promise(r => setTimeout(r, 800));

    const authModalState = await page.evaluate(() => {
      const modal = document.getElementById('authModal');
      const isVisible = modal && !modal.classList.contains('hidden');
      const hasChips = document.getElementById('nxaChips')?.children.length || 0;
      return { isVisible, hasChips };
    });
    console.log('Auth Modal State:', authModalState);

    // Test Student Login via bridge
    console.log('3. Testing Student Login via UI...');
    await page.evaluate(async () => {
      const s = window.REAL_STUDENTS ? window.REAL_STUDENTS[0] : null;
      const rec = s && typeof nxLookupUSN === 'function' ? nxLookupUSN(s.rollNo).rec : null;
      if (rec && typeof window.finishStudent === 'function') {
        window.finishStudent(rec);
      }
    });
    await new Promise(r => setTimeout(r, 2500));

    const loginResult = await page.evaluate(() => {
      return {
        currentUser: typeof currentUser !== 'undefined' ? currentUser : null,
        currentRole: typeof currentRole !== 'undefined' ? currentRole : null,
        hasToken: !!localStorage.getItem('booknexus_token')
      };
    });
    console.log('Student Login Result:', loginResult);

    // 4. Test Rental Request Hook (Connected to Backend & Hardhat Blockchain)
    console.log('4. Testing Rental Request with Blockchain...');
    const rentalResult = await page.evaluate(async () => {
      const book = typeof booksData !== 'undefined' && booksData.length > 0 ? booksData[0] : null;
      if (book && typeof window.requestRental === 'function') {
        await window.requestRental(book.id);
        return { requestedBook: book.title, success: true };
      }
      return { success: false };
    });
    console.log('Rental Request Result:', rentalResult);
    await new Promise(r => setTimeout(r, 2000));

    // Take screenshot of page
    const screenshotPath = path.join(__dirname, 'frontend_verified.png');
    await page.screenshot({ path: screenshotPath });
    console.log('📸 Screenshot saved to:', screenshotPath);

    if (pageErrors.length > 0) {
      console.warn('⚠️ Page encountered errors:', pageErrors);
    } else {
      console.log('🎉 No unhandled page errors detected!');
    }

  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await browser.close();
  }
}

testFrontend();
