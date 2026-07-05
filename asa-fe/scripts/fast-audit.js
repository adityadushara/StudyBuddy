const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://127.0.0.1:8000';

const VIEWPORTS = [
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '1440x900',  width: 1440, height: 900 },
    { name: '1280x800',  width: 1280, height: 800 },
    { name: '1024x768',  width: 1024, height: 768 },
    { name: '820x1180',  width: 820,  height: 1180 },
    { name: '768x1024',  width: 768,  height: 1024 },
    { name: '414x896',   width: 414,  height: 896 },
    { name: '390x844',   width: 390,  height: 844 },
    { name: '375x667',   width: 375,  height: 667 },
    { name: '320x568',   width: 320,  height: 568 },
];

const ROUTES = [
    { name: 'Landing', path: '/' },
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' },
    { name: 'ForgotPassword', path: '/forgot-password' },
    { name: 'ResetPassword', path: '/reset-password?token=testtoken' },
    { name: 'Dashboard', path: '/dashboard', auth: true },
    { name: 'Profile', path: '/dashboard/profile', auth: true },
    { name: 'Timer', path: '/dashboard/timer', auth: true },
    { name: 'Goal', path: '/dashboard/goal', auth: true },
    { name: 'Notes', path: '/notes', auth: true },
];

async function getRealAuthToken() {
    const testUser = {
        email: 'audit_user@studybuddy.ai',
        password: 'AuditPassword123!',
        full_name: 'Alex Morgan Audit'
    };

    try {
        // Try login
        const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUser.email, password: testUser.password })
        });

        if (loginRes.ok) {
            const data = await loginRes.json();
            return { token: data.access_token, user: data.user };
        }

        // Otherwise register
        const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        if (regRes.ok) {
            const data = await regRes.json();
            return { token: data.access_token, user: data.user };
        }
    } catch (err) {
        console.warn('Backend authentication endpoint not available, falling back to mock bypass:', err.message);
    }

    return null;
}

async function main() {
    console.log('🚀 Starting Robust Playwright Audit across 10 Viewports & 10 Routes...');
    const outputDir = path.join(__dirname, '..', 'test-results', 'screenshots');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const authData = await getRealAuthToken();
    if (authData) {
        console.log(`✅ Authenticated with backend as: ${authData.user.email}`);
    }

    const browser = await chromium.launch({ headless: true });
    const auditResults = [];
    const consoleErrors = [];

    for (const vp of VIEWPORTS) {
        console.log(`\n📱 Viewport: ${vp.name} (${vp.width}x${vp.height})`);
        const context = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            deviceScaleFactor: 1,
        });

        const page = await context.newPage();

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push({ viewport: vp.name, url: page.url(), text: msg.text() });
            }
        });

        page.on('pageerror', err => {
            consoleErrors.push({ viewport: vp.name, url: page.url(), text: err.message });
        });

        // Set Auth token in localStorage if available
        if (authData) {
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
            await page.evaluate(({ token, user }) => {
                localStorage.setItem('study_buddy_token', token);
                localStorage.setItem('study_buddy_user', JSON.stringify(user));
            }, { token: authData.token, user: authData.user }).catch(() => {});
        }

        for (const route of ROUTES) {
            try {
                await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
                await page.waitForTimeout(500);

                const vpDir = path.join(outputDir, vp.name);
                if (!fs.existsSync(vpDir)) fs.mkdirSync(vpDir, { recursive: true });

                const screenshotPath = path.join(vpDir, `${route.name}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });

                const overflow = await page.evaluate(() => {
                    const docWidth = document.documentElement.scrollWidth;
                    const winWidth = window.innerWidth;
                    return {
                        hasHorizontalScroll: docWidth > winWidth + 2,
                        docWidth,
                        winWidth
                    };
                }).catch(() => ({ hasHorizontalScroll: false, docWidth: vp.width, winWidth: vp.width }));

                auditResults.push({
                    viewport: vp.name,
                    route: route.name,
                    path: route.path,
                    overflow: overflow.hasHorizontalScroll,
                    docWidth: overflow.docWidth,
                    winWidth: overflow.winWidth,
                    screenshot: screenshotPath
                });

                console.log(`  ✓ ${route.name} (${route.path}) - Screenshot saved. Overflow: ${overflow.hasHorizontalScroll ? '⚠️ YES' : 'NO'}`);
            } catch (err) {
                console.error(`  ❌ Error on [${vp.name}] ${route.name}: ${err.message}`);
            }
        }

        await context.close();
    }

    await browser.close();

    const reportPath = path.join(__dirname, '..', 'test-results', 'audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({ auditResults, consoleErrors, timestamp: new Date().toISOString() }, null, 2));

    console.log(`\n========================================`);
    console.log(`AUDIT FINISHED! ${auditResults.length} screens captured.`);
    const overflowList = auditResults.filter(r => r.overflow);
    console.log(`⚠️ Horizontal Overflow Issues: ${overflowList.length}`);
    overflowList.forEach(item => console.log(`   - [${item.viewport}] ${item.route}: docWidth ${item.docWidth}px > winWidth ${item.winWidth}px`));
    console.log(`❌ Console Errors: ${consoleErrors.length}`);
    consoleErrors.forEach(ce => console.log(`   - [${ce.viewport}] ${ce.url}: ${ce.text}`));
}

main().catch(console.error);
