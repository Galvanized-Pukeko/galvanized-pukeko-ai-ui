import { test, expect } from '@playwright/test';

test.describe('Example Project E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        // Wait for initial load
        await expect(page.locator('.chat-interface')).toBeVisible();
    });

    test('should send message and get response from demo-agent', async ({ page }) => {
        const input = page.locator('input[name="chat-input"]');
        const sendButton = page.locator('.input-area').getByRole('button', { name: 'Send' });

        await input.fill('Hello from E2E test');
        await sendButton.click();

        await expect(page.locator('.message.user', { hasText: 'Hello from E2E test' })).toBeVisible();

        // Wait for AI response
        const aiMessage = page.locator('.message.ai').last();
        await expect(aiMessage).toBeVisible();
        await expect(aiMessage).not.toContainText('Error');
    });
});
