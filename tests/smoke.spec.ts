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

  const htmlDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /导出「/ }).click();
  expect((await htmlDownload).suggestedFilename()).toMatch(/\.html$/);

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
  await expect(page.getByRole('button', { name: '测试连接' })).toBeDisabled();

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
  await expect(page.getByRole('button', { name: '测试连接' })).toBeEnabled();

  await page.getByRole('button', { name: '保存设置' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  const settings = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('friction2tool.settings.v1') || '{}'),
  );
  expect(settings.apiBaseUrl).toBe('https://api.groq.com/openai/v1');
  expect(settings.model).toBe('llama-3.3-70b-versatile');
  expect(settings.apiKey).toBe('gsk_test_key');
});

test('settings dialog traps focus and restores it after closing', async ({ page }) => {
  const settingsLink = page.getByRole('link', { name: '设置', exact: true });
  await settingsLink.focus();
  await settingsLink.press('Enter');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '关闭', exact: true })).toBeFocused();

  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab');
    const focusIsInsideDialog = await page.evaluate(() =>
      Boolean(document.activeElement?.closest('[role="dialog"]')),
    );
    expect(focusIsInsideDialog).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(settingsLink).toBeFocused();
});

test('imports a JSON backup and exports it again', async ({ page }) => {
  const now = Date.now();
  const importedTool = {
    id: 'imported-tool-1',
    title: '导入的测试工具',
    friction: '每次测试都要手写备份。',
    idea: {
      title: '导入的测试工具',
      problem: '测试导入',
      howItWorks: '导入后确认',
      whySmall: '只有一组数据',
    },
    html: '<!doctype html><html><head><title>Imported</title></head><body><h1>Imported</h1></body></html>',
    tags: ['测试'],
    createdAt: now,
    updatedAt: now,
    versions: [],
  };

  await page.locator('input[type="file"]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify([importedTool]), 'utf8'),
  });

  await expect(page.getByText('导入的测试工具', { exact: true })).toBeVisible();
  await expect(page.getByText(/导入完成：新增 1 个/)).toBeVisible();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('friction2tool.tools.v1') || '[]'),
  );
  expect(stored).toHaveLength(1);
  expect(stored[0].id).toBe('imported-tool-1');

  const backupDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出备份' }).click();
  expect((await backupDownload).suggestedFilename()).toMatch(
    /^friction2tool-backup-.*\.json$/,
  );
});

test.describe('mobile layout', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('has no horizontal overflow and scrolls provider presets', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: '把小摩擦，做成顺手的小工具。' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      ),
    ).toBe(false);

    await page.getByRole('link', { name: '设置', exact: true }).tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.locator('#api-base-url').tap();

    const providers = page.getByRole('listbox', { name: '常用 API 服务' });
    await expect(providers).toBeVisible();
    const metrics = await providers.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

    await providers.getByRole('option', { name: /^DeepSeek/ }).tap();
    await expect(page.locator('#api-base-url')).toHaveValue(
      'https://api.deepseek.com/v1',
    );

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      ),
    ).toBe(false);
  });
});
