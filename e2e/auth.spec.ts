import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Look for login link - adjust selector based on your UI
    const loginLink = page.getByRole('link', { name: /login|sign in/i });

    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');

    // Check for form elements
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    const submitButton = page.getByRole('button', { name: /log in|sign in|submit/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');

    // Look for signup link - adjust selector based on your UI
    const signupLink = page.getByRole('link', { name: /sign up|register/i });

    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/\/signup/);
    }
  });

  test('should show signup form', async ({ page }) => {
    await page.goto('/signup');

    // Check for form elements
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    const submitButton = page.getByRole('button', { name: /sign up|register|create/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });
});
