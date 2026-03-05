import { test, expect } from '@playwright/test';

test.describe('Chat Interface (Gaunt Sloth AG-UI)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5555');
        await expect(page.locator('.chat-interface')).toBeVisible();
    });

    test('should send message via button', async ({ page }) => {
        const input = page.locator('input[name="chat-input"]');
        const sendButton = page.locator('.input-area').getByRole('button', { name: 'Send' });

        await input.fill('Hello via Button. Your response must include word Button.');
        await sendButton.click();

        await expect(page.locator('.message.user', { hasText: 'Hello via Button' })).toBeVisible();

        await expect(page.locator('.is-loading')).not.toBeVisible({ timeout: 30000 });

        const aiMessage = page.locator('.message.ai').last();
        await expect(aiMessage).toBeVisible();
        await expect(aiMessage).not.toContainText('Error');
        await expect(aiMessage).toContainText('Button');
    });

    test('should send message via Enter key', async ({ page }) => {
        const input = page.locator('input[name="chat-input"]');

        await input.fill('Hello via Enter. Your response must include word Enter.');
        await input.press('Enter');

        await expect(page.locator('.message.user', { hasText: 'Hello via Enter' })).toBeVisible();

        await expect(page.locator('.is-loading')).not.toBeVisible({ timeout: 30000 });

        const aiMessage = page.locator('.message.ai').last();
        await expect(aiMessage).toBeVisible();
        await expect(aiMessage).not.toContainText('Error');
        await expect(aiMessage).toContainText('Enter');
    });

    test('should use identity from system prompt', async ({ page }) => {
        const input = page.locator('input[name="chat-input"]');
        await input.fill('What is your name? Reply in one sentence.');
        await input.press('Enter');
        await expect(page.locator('.is-loading')).not.toBeVisible({ timeout: 30000 });
        const aiMessage = page.locator('.message.ai').last();
        await expect(aiMessage).toContainText('Gaunt Sloth');
    });
});
