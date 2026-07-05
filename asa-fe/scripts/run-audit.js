const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

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
    { name: 'ResetPassword', path: '/reset-password?token=test' },
    { name: 'Dashboard', path: '/dashboard', auth: true },
    { name: 'Profile', path: '/dashboard/profile', auth: true },
    { name: 'Timer', path: '/dashboard/timer', auth: true },
    { name: 'Goal', path: '/dashboard/goal', auth: true },
    { name: 'Notes', path: '/notes', auth: true },
];

const MOCK_TOKEN = 'header.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 86400, sub: 'user_123' })).toString('base64') + '.signature';
const MOCK_USER = {
    id: 'user_123',
    email: 'alex@example.com',
    name: 'Alex Morgan',
    avatar: ''
};

async function main() {
    console.log('🚀 Starting Comprehensive Playwright Audit...');
    const outputDir = path.join(__dirname, '..', 'test-results', 'screenshots');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const browser = await chromium.launch({ headless: true });

    const auditResults = [];
    const consoleErrors = [];

    for (const vp of VIEWPORTS) {
        console.log(`\n📱 Auditing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
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

        // Pre-set auth token in localStorage
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(({ token, user }) => {
            localStorage.setItem('study_buddy_token', token);
            localStorage.setItem('study_buddy_user', JSON.stringify(user));
        }, { token: MOCK_TOKEN, user: MOCK_USER });

        for (const route of ROUTES) {
            try {
                const targetUrl = `${BASE_URL}${route.path}`;
                await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
                await page.waitForTimeout(500);

                const vpDir = path.join(outputDir, vp.name);
                if (!fs.existsSync(vpDir)) fs.mkdirSync(vpDir, { recursive: true });

                const screenshotPath = path.join(vpDir, `${route.name}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });

                // Check horizontal scroll / overflow
                const overflow = await page.evaluate(() => {
                    const docWidth = document.documentElement.scrollWidth;
                    const winWidth = window.innerWidth;
                    return {
                        hasHorizontalScroll: docWidth > winWidth + 2,
                        docWidth,
                        winWidth
                    };
                });

                auditResults.push({
                    viewport: vp.name,
                    route: route.name,
                    path: route.path,
                    overflow: overflow.hasHorizontalScroll,
                    docWidth: overflow.docWidth,
                    winWidth: overflow.winWidth,
                    screenshot: screenshotPath
                });

                console.log(`  ✓ ${route.name} (${route.path}) - Screenshot saved, Overflow: ${overflow.hasHorizontalScroll ? '⚠️ YES' : 'NO'}`);
            } catch (err) {
                console.error(`  ❌ Failed route ${route.name}: ${err.message}`);
            }
        }

        await context.close();
    }

    await browser.close();

    console.log('\n========================================');
    console.log('AUDIT SUMMARY');
    console.log('========================================');
    console.log(`Total screens audited: ${auditResults.length}`);
    const overflowIssues = auditResults.filter(r => r.overflow);
    console.log(`Horizontal Overflow Issues: ${overflowIssues.length}`);
    overflowIssues.forEach(i => console.log(`  - [${i.viewport}] ${i.route}: docWidth=${i.docWidth}px > winWidth=${i.winWidth}px`));
    
    console.log(`Console Errors Caught: ${consoleErrors.length}`);
    consoleErrors.forEach(e => console.log(`  - [${e.viewport}] ${e.url}: ${e.text}`));

    fs.writeFileSync(
        path.join(__dirname, '..', 'test-results', 'audit-report.json'),
        JSON.stringify({ auditResults, consoleErrors, timestamp: new Date().toISOString() }, null, 2)
    );

    console.log('\nAudit complete! Report written to test-results/audit-report.json');
}

main().catch(console.error);
