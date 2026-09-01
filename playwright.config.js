const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-393', use: { browserName: 'chromium', viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true } },
    { name: 'chromium-375', use: { browserName: 'chromium', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: 'webkit-393', use: { browserName: 'webkit', viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true } },
    { name: 'webkit-375', use: { browserName: 'webkit', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
