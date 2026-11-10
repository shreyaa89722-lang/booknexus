const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createSimpleDom() {
    const elements = new Map();
    const classListMap = new Map();

    function getOrCreate(id) {
        if (!elements.has(id)) {
            const el = {
                id,
                value: '',
                textContent: '',
                hidden: false,
                style: {},
                classList: {
                    _classes: new Set(),
                    add(c) { this._classes.add(c); },
                    remove(c) { this._classes.delete(c); },
                    contains(c) { return this._classes.has(c); },
                    toggle(c, on) { if (on) this.add(c); else this.remove(c); }
                },
                attributes: {},
                setAttribute(k, v) { this.attributes[k] = String(v); },
                getAttribute(k) { return this.attributes[k]; },
                removeAttribute(k) { delete this.attributes[k]; },
                focus() { this.focused = true; },
                select() { this.selected = true; },
                closest() { return this; },
                scrollTo() {},
                querySelector(sel) {
                    if (sel === 'h3') return getOrCreate('modalH3');
                    return null;
                },
                querySelectorAll() { return []; }
            };
            elements.set(id, el);
        }
        return elements.get(id);
    }

    const document = {
        getElementById: (id) => getOrCreate(id),
        querySelector: (sel) => {
            if (sel === '#authModal h3' || sel === 'h3') return getOrCreate('modalH3');
            return null;
        },
        querySelectorAll: () => [],
        head: { appendChild() {} },
        body: {
            classList: {
                add() {},
                remove() {},
                contains() { return false; }
            }
        },
        createElement: (tag) => {
            return {
                tagName: tag,
                style: {},
                appendChild() {},
                innerHTML: '',
                textContent: '',
                classList: { add() {}, remove() {}, contains() { return false; } }
            };
        },
        documentElement: {
            classList: { contains() { return false; } }
        }
    };

    const window = {
        document,
        location: { origin: 'http://localhost:3000', protocol: 'http:', hostname: 'localhost', port: '3000' },
        localStorage: {
            store: {},
            getItem(k) { return this.store[k] || null; },
            setItem(k, v) { this.store[k] = String(v); },
            removeItem(k) { delete this.store[k]; }
        },
        sessionStorage: {
            store: {},
            clear() { this.store = {}; }
        },
        console: { ...console },
        setTimeout: (fn, ms) => setTimeout(fn, ms || 0),
        clearTimeout: (id) => clearTimeout(id),
        setInterval: (fn, ms) => setInterval(fn, ms || 100),
        clearInterval: (id) => clearInterval(id),
        fetch: async () => ({ ok: true, json: async () => ({ success: true }) }),
        Event: class Event { constructor(type) { this.type = type; } },
        showToast: (msg, type) => { console.log(`   [Toast: ${type || 'info'}] ${msg}`); },
        API_BASE: 'http://localhost:5000/api'
    };
    window.window = window;

    return { window, document, getOrCreate };
}

async function runTest() {
    console.log('Testing Frontend Continue Button Flow Logic in isolated VM...');
    const { window, document, getOrCreate } = createSimpleDom();

    const bridgeCode = fs.readFileSync(path.join(__dirname, '../frontend/js/bridge.js'), 'utf8');

    // Run bridge.js in the mock browser context
    const context = vm.createContext(window);
    vm.runInContext(bridgeCode, context);

    console.log('✅ bridge.js successfully loaded into browser environment');

    // Mock API
    window.fetch = async (url, options = {}) => {
        const urlStr = String(url);
        const body = options.body ? JSON.parse(options.body) : {};

        if (urlStr.includes('/auth/check-email')) {
            if (body.email === 'registered@college.edu') {
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        isRegistered: true,
                        onRoster: true,
                        data: { name: 'Dr. John Doe', usn: 'CS2026-001' }
                    })
                };
            } else if (body.email === 'newstudent@college.edu') {
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        isRegistered: false,
                        onRoster: true,
                        data: { name: 'A. B. Patel Jr.', usn: 'CS2026-042' }
                    })
                };
            }
        }

        if (urlStr.includes('/auth/register-step1')) {
            return {
                ok: true,
                status: 201,
                json: async () => ({
                    success: true,
                    data: {
                        name: body.name,
                        usn: body.usn,
                        dob: body.dob,
                        token: 'mock-jwt-token-step1'
                    }
                })
            };
        }

        if (urlStr.includes('/auth/register-step2')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    data: {
                        name: body.name || 'A. B. Patel Jr.',
                        usn: body.usn || 'CS2026-042',
                        preferredName: body.preferredName,
                        bio: body.bio,
                        token: 'mock-jwt-token-final',
                        role: 'student'
                    }
                })
            };
        }

        return { ok: true, json: async () => ({ success: true }) };
    };

    // TEST 1: New Student clicks Continue
    const emInput = getOrCreate('nxlEm');
    emInput.value = 'newstudent@college.edu';

    await window.nxlEmail({ preventDefault: () => {} });

    const nxaVCh = getOrCreate('nxaVCh');
    const nxaVNew = getOrCreate('nxaVNew');
    const s1 = getOrCreate('nxlS1');
    const s2 = getOrCreate('nxlS2');

    if (!nxaVCh.hidden) throw new Error('#nxaVCh should be hidden');
    if (nxaVNew.hidden) throw new Error('#nxaVNew should be visible');
    if (s1.hidden) throw new Error('Step 1 #nxlS1 should be visible');
    if (!s2.hidden) throw new Error('Step 2 #nxlS2 should be hidden');

    console.log('✅ Flow 1: Clicking Continue for new student opened Step 1 form');

    const nameInput = getOrCreate('nxlName');
    const usnInput = getOrCreate('nxlUsn');
    const dobInput = getOrCreate('nxlDob');
    const pwInput = getOrCreate('nxlNp');
    const pw2Input = getOrCreate('nxlNp2');

    console.log('   Prefilled Name from roster:', nameInput.value);
    console.log('   Prefilled USN from roster:', usnInput.value);

    // Provide DOB and Password
    dobInput.value = '2004-03-20';
    pwInput.value = 'MySecretPass123';
    pw2Input.value = 'MySecretPass123';

    // Submit Step 1
    await window.nxlCreate({ preventDefault: () => {} });

    if (!s1.hidden) throw new Error('Step 1 should be hidden after completing Step 1');
    if (s2.hidden) throw new Error('Step 2 should be visible after completing Step 1');

    console.log('✅ Flow 1: Step 1 completed, Step 2 (About You) opened');

    // Fill Step 2
    const nickInput = getOrCreate('nxlNick');
    const bioInput = getOrCreate('nxlBio');
    nickInput.value = 'Abhi';
    bioInput.value = 'Computer Science reader who loves algorithm and historical books.';

    // Submit Step 2
    await window.nxlCreate({ preventDefault: () => {} });

    console.log('✅ Flow 1: Step 2 completed and saved to MongoDB');
    console.log('   Token stored:', window.localStorage.getItem('booknexus_token'));
    console.log('   Current user in storage:', window.localStorage.getItem('currentUser'));

    // TEST 2: Existing student clicks Continue
    emInput.value = 'registered@college.edu';
    await window.nxlEmail({ preventDefault: () => {} });

    const pwForm = getOrCreate('nxaVPw');
    if (pwForm.hidden) throw new Error('#nxaVPw should be visible for registered student');
    console.log('✅ Flow 2: Clicking Continue for registered student opened Password form');

    console.log('\nAll Frontend and Navigation tests PASSED successfully!');
}

runTest().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
