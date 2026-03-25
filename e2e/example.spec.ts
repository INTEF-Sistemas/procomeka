import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  // Add a simple dummy test so Playwright doesn't fail if there are no tests
  expect(true).toBe(true);
});
