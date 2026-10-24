const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Zero-dependency .env loader
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        let v = trimmed.slice(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}

loadEnv();

const ROOT_DIR = process.env.REPO_ROOT || path.resolve(__dirname, '..');
const CONFIRM_DIR = path.join(ROOT_DIR, 'documents', 'confirmations');
const TARGET_URL = process.env.PILOT_TARGET_URL || 'https://mx.indeed.com/viewjob?jk=0d50c6348b2822b8';
const EMAIL = process.env.CANDIDATE_EMAIL || 'candidate@example.com';

(async () => {
  console.log('Advancing Pilot Application with email entry...');

  if (!fs.existsSync(CONFIRM_DIR)) {
    fs.mkdirSync(CONFIRM_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'es-MX',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const applyButton = page.locator('#indeedApplyButton, button:has-text("Postularse"), button:has-text("Postularme")').first();
    await applyButton.click();
    console.log('Clicked Apply button.');
    await page.waitForTimeout(4000);

    // Check if on auth page
    console.log('Current URL:', page.url());

    const emailInput = page.locator('input[type="email"], input[name="__email"], input#ifl-InputFormField-3').first();
    if (await emailInput.count() > 0) {
      console.log('Found email input! Filling email:', EMAIL);
      await emailInput.fill(EMAIL);
      await page.waitForTimeout(1000);

      const submitBtn = page.locator('button[type="submit"], button:has-text("Continuar")').first();
      await submitBtn.click();
      console.log('Clicked Continuar.');
      await page.waitForTimeout(5000);

      const step3Screenshot = path.join(CONFIRM_DIR, 'pilot_step3_after_email.png');
      await page.screenshot({ path: step3Screenshot });
      console.log('Saved screenshot:', step3Screenshot);
      console.log('URL after email submit:', page.url());
    } else {
      console.log('No email input found directly on page.');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await page.waitForTimeout(4000);
    await browser.close();
    console.log('Finished.');
  }
})();
