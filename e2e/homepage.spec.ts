import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check if the page loads
    await expect(page).toHaveTitle(/Turborepo|Home|SaaS/i);

    // Check for common elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have navigation', async ({ page }) => {
    await page.goto('/');

    // Look for navigation elements
    // Adjust selectors based on your actual navigation
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page).toHaveTitle(/Turborepo|Home|SaaS/i);

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page).toHaveTitle(/Turborepo|Home|SaaS/i);
  });
});
