import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('mock mode completes generate, save, iterate and delete flow', async ({ page }) => {
  await expect(page.getByText('Mock 模式', { exact: true }).first()).toBeVisible();

  await page.locator('#friction-input').fill('每次买菜前都想不起家里还有什么。');
  await page.getByRole('button', { name: /生成 3 个方案/ }).click();

  const ideaCards = page.locator('button[aria-pressed]');
  await expect(ideaCards).toHaveCount(3);
  await expect(
    page.getByText('买菜前 · 60 秒冰箱快扫', { exact: true }),
  ).toBeVisible();

  await ideaCards.first().click();
  await page.getByRole('button', { name: /生成这个工具/ }).click();

  const frame = page.frameLocator('iframe[title*="预览"]').first();
  await expect(frame.locator('h1')).toContainText('买菜前');

  await frame.locator('.item label').first().click();
  await expect(frame.locator('#progressText')).toContainText('1 /');
  await frame.locator('#newItem').fill('再检查一次冰箱门');
  await frame.getByRole('button', { name: '添加' }).click();
  await expect(frame.locator('#progressText')).toContainText('/ 5');

  await page.getByRole('button', { name: '保存工具' }).click();
  await expect(page.getByRole('button', { name: '已保存' })).toBeVisible();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('friction2tool.tools.v1') || '[]'),
  );
  expect(stored).toHaveLength(1);
  expect(stored[0].html).toContain('Content-Security-Policy');

  await page.reload();
  await expect(
    page.getByText('买菜前 · 60 秒冰箱快扫', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: /打开预览/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.locator('#iteration-feedback').fill('按钮再大一点，并增加一个重置按钮。');
  await page.getByRole('button', { name: /生成新版本/ }).click();
  await expect(page.getByText('这是尚未保存的新版本', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '保存为新版本' }).click();
  await expect(page.getByText('已保存为 v2。旧版本保留在版本记录中。')).toBeVisible();

  const updated = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('friction2tool.tools.v1') || '[]'),
  );
  expect(updated[0].versions).toHaveLength(1);
  expect(updated[0].versions[0].feedback).toContain('按钮再大一点');

  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: /删除「/ }).click();
  await page.getByRole('button', { name: '确认删除' }).click();
  await expect(page.getByText('还没有保存的工具')).toBeVisible();

  const empty = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('friction2tool.tools.v1') || '[]'),
  );
  expect(empty).toHaveLength(0);
});

test('provider presets and key prefix detection configure settings', async ({ page }) => {
  await page.getByRole('link', { name: '设置', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.locator('#api-base-url').click();
  const providerList = page.getByRole('listbox', { name: '常用 API 服务' });
  await expect(providerList).toBeVisible();
  await providerList.getByRole('option', { name: /^DeepSeek/ }).click();
  await expect(page.locator('#api-base-url')).toHaveValue(
    'https://api.deepseek.com/v1',
  );

  await page.getByRole('button', { name: '填入推荐模型' }).click();
  await expect(page.locator('#api-model')).toHaveValue('deepseek-chat');

  await page.locator('#api-key').fill('gsk_test_key');
  await expect(page.locator('#api-base-url')).toHaveValue(
    'https://api.groq.com/openai/v1',
  );
  await expect(page.getByText(/已根据 Key 前缀识别为 Groq/)).toBeVisible();
  await page.getByRole('button', { name: '填入推荐模型' }).click();
  await expect(page.locator('#api-model')).toHaveValue('llama-3.3-70b-versatile');

  await page.getByRole('button', { name: '保存设置' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  const settings = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('friction2tool.settings.v1') || '{}'),
  );
  expect(settings.apiBaseUrl).toBe('https://api.groq.com/openai/v1');
  expect(settings.model).toBe('llama-3.3-70b-versatile');
  expect(settings.apiKey).toBe('gsk_test_key');
});
