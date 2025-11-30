const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const markedPackagePath = require.resolve('marked/package.json');
const markedScript = fs.readFileSync(path.join(markedPackagePath, '..', 'lib', 'marked.umd.js'), 'utf8');
const domPurifyScript = fs.readFileSync(require.resolve('dompurify/dist/purify.min.js'), 'utf8');

const STUB_MARKDOWN = `# Заголовок глоссария

## Раздел один
Текст для проверки загрузки.

### Подраздел
Ещё текст.
`;

async function mockMarkdownRequests(page) {
  await page.route(/https:\/\/raw\.githubusercontent\.com\/redvampir\/Diamant_Vill_Vibor\/main\/.*\.md/i, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'text/markdown; charset=utf-8',
      body: STUB_MARKDOWN
    });
  });

  await page.route('**/Доп.материалы/*.md', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'text/markdown; charset=utf-8',
      body: STUB_MARKDOWN
    });
  });
}

async function mockExternalScripts(page) {
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js', (route) => {
    route.fulfill({ status: 200, contentType: 'application/javascript', body: markedScript });
  });

  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js', (route) => {
    route.fulfill({ status: 200, contentType: 'application/javascript', body: domPurifyScript });
  });
}

async function failOnConsoleErrors(page) {
  page.on('pageerror', (error) => {
    throw error;
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      throw new Error(`Console error: ${msg.text()}`);
    }
  });
}

test.beforeEach(async ({ page }) => {
  await mockExternalScripts(page);
  await mockMarkdownRequests(page);
  await failOnConsoleErrors(page);
});

test('Просмотрщик загружается без ошибок и корректно работает в текущем диапазоне', async ({ page, viewport }) => {
  await page.goto('/viewer.html?file=glossary');
  await expect(page.locator('#content')).toContainText('Заголовок глоссария');
  await expect(page.locator('.toc a')).toHaveCount(3);

  const toggle = page.locator('#sidebarToggle');
  const body = page.locator('body');
  const isDesktop = (viewport?.width || 0) > 1024;

  if (isDesktop) {
    await expect(body).toHaveClass(/sidebar-open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  } else {
    await expect(body).not.toHaveClass(/sidebar-open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveText(/Содержание/);
  }

  if (await toggle.isVisible()) {
    await toggle.click();
    if (isDesktop) {
      await expect(body).not.toHaveClass(/sidebar-open/);
    } else {
      await expect(body).toHaveClass(/sidebar-open/);
    }

    await toggle.click();
    if (isDesktop) {
      await expect(body).toHaveClass(/sidebar-open/);
    } else {
      await expect(body).not.toHaveClass(/sidebar-open/);
    }
  }
});

test('Главная страница открывается и содержит базовый контент', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('h1')).toContainText('Диамант Вилл: Выбор');
  await expect(page.getByRole('link', { name: /Глоссарий/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Синопсис/ })).toBeVisible();
});
