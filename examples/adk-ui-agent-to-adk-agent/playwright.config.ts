import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e-tests',
    fullyParallel: true,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:8080',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
