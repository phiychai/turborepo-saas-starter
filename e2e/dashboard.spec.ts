import { expect, test } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  // Add authenticated tests here
  // You'll need to implement a login helper or use Playwright's storage state

  // Example:
  // test.describe('Authenticated', () => {
  //   test.use({ storageState: 'e2e/.auth/user.json' })
  //
  //   test('should show dashboard', async ({ page }) => {
  //     await page.goto('/dashboard')
  //     await expect(page).toHaveTitle(/Dashboard/)
  //   })
  // })
});
