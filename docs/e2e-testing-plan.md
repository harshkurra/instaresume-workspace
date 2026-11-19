# E2E Testing Plan — InstaResume.io

## Recommended Tool: Playwright

| | Playwright | Cypress |
|---|---|---|
| Firebase auth persistence | `storageState` — auth once, reuse everywhere | Re-auth every test or complex workaround |
| MUI portals (Menu, Dialog) | Works natively | Known issues |
| Mobile emulation | Built-in device profiles | Paid plan |
| Speed | Parallel by default | Sequential by default |
| Codegen | Records clicks → generates test code | No |

---

## Auth Strategy (done once, reused everywhere)

```ts
// tests/global-setup.ts
import { chromium } from '@playwright/test';

export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Sign in via the login page using a dedicated test Firebase account
  await page.goto('http://localhost:3000/signin');
  await page.fill('[name="email"]', process.env.TEST_EMAIL!);
  await page.fill('[name="password"]', process.env.TEST_PASSWORD!);
  await page.click('[type="submit"]');
  await page.waitForURL('**/resumes');

  // Save auth state (Firebase token lives in localStorage/cookies)
  await page.context().storageState({ path: 'tests/auth-state.json' });
  await browser.close();
}
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './tests/global-setup.ts',
  use: {
    storageState: 'tests/auth-state.json', // every test starts logged in
    baseURL: 'http://localhost:3000',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
  ],
});
```

---

## Test Cases — Menu Changes

These 8 cases cover every change made in the create-new menu work:

```ts
// tests/menus/resume-create-new.spec.ts

test('Resume tab — CREATE NEW dropdown shows 3 rows', async ({ page }) => {
  await page.goto('/resumes');
  await page.click('[aria-label="KeyboardArrowDown"]'); // dropdown chevron
  await expect(page.getByText('Blank resume')).toBeVisible();
  await expect(page.getByText('From a template')).toBeVisible();
  await expect(page.getByText('Import a resume')).toBeVisible();
});

test('Resume tab — From a template submenu shows both options', async ({ page }) => {
  await page.goto('/resumes');
  await page.click('[aria-label="KeyboardArrowDown"]');
  await page.getByText('From a template').click();
  await expect(page.getByText('Start from my role')).toBeVisible();
  await expect(page.getByText('Pick a design')).toBeVisible();
});

test('Resume tab — Start from my role opens role picker dialog', async ({ page }) => {
  await page.goto('/resumes');
  await page.click('[aria-label="KeyboardArrowDown"]');
  await page.getByText('From a template').click();
  await page.getByText('Start from my role').click();
  await expect(page.getByText('Edit a sample resume')).toBeVisible();
  await expect(page.getByText('Data Scientist')).toBeVisible(); // role-based content
});

test('Resume tab — Pick a design opens blank template picker', async ({ page }) => {
  await page.goto('/resumes');
  await page.click('[aria-label="KeyboardArrowDown"]');
  await page.getByText('From a template').click();
  await page.getByText('Pick a design').click();
  // dialog opens but no role names visible (blank templates)
  await expect(page.getByText('Edit a sample resume')).toBeVisible();
  await expect(page.getByText('Data Scientist')).not.toBeVisible();
});

test('Resume tab — Import submenu shows PDF and LinkedIn', async ({ page }) => {
  await page.goto('/resumes');
  await page.click('[aria-label="KeyboardArrowDown"]');
  await page.getByText('Import a resume').click();
  await expect(page.getByText('PDF or DOCX')).toBeVisible();
  await expect(page.getByText('LinkedIn')).toBeVisible();
});

test('Resume tab — Tailor to a job button opens JD dialog', async ({ page }) => {
  await page.goto('/resumes');
  await page.getByRole('button', { name: 'Tailor to a job' }).click();
  await expect(page.getByText('Tailor resume to job description')).toBeVisible();
});

test('Cover Letter tab — Create with AI button opens generator', async ({ page }) => {
  await page.goto('/resumes');
  await page.getByText('Cover Letters').click();
  await page.getByRole('button', { name: 'Create with AI' }).click();
  await expect(page.getByText('Generate cover letter')).toBeVisible();
});
```

```ts
// tests/menus/mobile-create-sheet.spec.ts (uses iPhone 12 project)

test('Mobile — FAB is visible on resumes page', async ({ page }) => {
  await page.goto('/resumes');
  await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
});

test('Mobile — FAB opens bottom sheet with correct options', async ({ page }) => {
  await page.goto('/resumes');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Create new')).toBeVisible();
  await expect(page.getByText('Blank resume')).toBeVisible();
  await expect(page.getByText('From a template')).toBeVisible();
  await expect(page.getByText('Import a resume')).toBeVisible();
});

test('Mobile — From a template sub-panel slides in', async ({ page }) => {
  await page.goto('/resumes');
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByText('From a template').click();
  await expect(page.getByText('Start from my role')).toBeVisible();
  await expect(page.getByText('Pick a design')).toBeVisible();
});
```

---

## Setup Steps

| Step | Command / Action | Time |
|---|---|---|
| Install Playwright | `npm init playwright@latest` | 5 min |
| Create test Firebase account | Firebase Console → create user | 10 min |
| Add to `.env.test` | `TEST_EMAIL`, `TEST_PASSWORD` | 5 min |
| Write `global-setup.ts` | See above | 30 min |
| Codegen remaining tests | `npx playwright codegen http://localhost:3000/resumes` | 1–2 hrs |
| Add to CI | GitHub Actions — see below | 30 min |

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

---

## Key Principle

Test user journeys, not implementation details.

- **Don't test**: `setDialogType` was called with `'templateSelectDialog'`
- **Do test**: clicking "Start from my role" shows a dialog containing "Data Scientist"

This catches the real bugs (like the `createPrefilledResume is not a function` error) while staying resilient to refactors.
