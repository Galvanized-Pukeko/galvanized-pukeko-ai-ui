import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5555');
        // Wait for initial load
        await expect(page.locator('.chat-interface')).toBeVisible();
    });

    test('should send message via button', async ({ page }) => {
        const input = page.locator('input[name="chat-input"]');
        const sendButton = page.locator('.input-area').getByRole('button', { name: 'Send' });

        await input.fill('Hello via Button');
        await sendButton.click();

        await expect(page.locator('.message.user', { hasText: 'Hello via Button' })).toBeVisible();
    });

    test('should send message via Enter key', async ({ page }) => {
        const input = page.locator('input[name="chat-input"]');

        await input.fill('Hello via Enter');
        await input.press('Enter');

        await expect(page.locator('.message.user', { hasText: 'Hello via Enter' })).toBeVisible();
    });

    test('should display helper text', async ({ page }) => {
        await expect(page.getByText('Click Send or press Enter to send your message')).toBeVisible();
    });

    test('should render form when requested', async ({ page }) => {
        const input = page.locator('input[name="chat-input"]');
        await input.fill('Show me a contact form with name and email fields');
        await input.press('Enter');

        // Wait for form to appear
        await expect(page.locator('.dynamic-form')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('heading', { name: 'Server-Requested Form' })).toBeVisible();
        await expect(page.locator('input[name="Name"]')).toBeVisible();
        await expect(page.locator('input[name="Email"]')).toBeVisible();
    });

    test('should render chart when requested with data', async ({ page }) => {
        const input = page.locator('input[name="chat-input"]');

        // Request chart
        await input.fill('Show me a bar chart of sales');
        await input.press('Enter');

        // Wait for agent response (simplified check, just wait a bit or check for ai message)
        await page.waitForTimeout(2000);

        // Provide data
        await input.fill('Here is the data: Q1: 100, Q2: 150, Q3: 200, Q4: 300');
        await input.press('Enter');

        // Wait for chart to appear
        await expect(page.locator('.chart-section')).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'Server-Requested Chart' })).toBeVisible();
        // Check for canvas which implies chart.js rendered
        await expect(page.locator('canvas')).toBeVisible();
    });
});
