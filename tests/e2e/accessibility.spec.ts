import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.goto('/');
});

test('cenários sem violações automatizadas WCAG A/AA e sem overflow desde 320px', async ({
  page,
}) => {
  for (const width of [320, 375, 640, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const scenario of ['idle', 'loading', 'empty', 'error', 'success']) {
      await page.getByLabel('Cenário de demonstração').selectOption(scenario);
      if (scenario === 'success') {
        await page.getByRole('button', { name: 'Fahrenheit (°F)' }).click();
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `${scenario} em ${width}px`).toBe(false);
    }
  }

  for (const scenario of ['idle', 'loading', 'empty', 'error', 'success']) {
    await page.getByLabel('Cenário de demonstração').selectOption(scenario);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, scenario).toEqual([]);
  }
});

test('texto a 200% continua dentro da tela em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  await page.getByLabel('Cenário de demonstração').selectOption('success');
  await page.getByRole('button', { name: 'Fahrenheit (°F)' }).click();
  const overflowing = await page
    .locator('main, header, aside, footer')
    .evaluateAll((elements) =>
      elements
        .filter((element) => element.scrollWidth > element.clientWidth)
        .map((element) => element.tagName),
    );
  expect(overflowing).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('skip link, busca e retry mantêm foco útil por teclado', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  await page.getByRole('searchbox').focus();
  await page.keyboard.type('Curitiba');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Nenhuma cidade encontrada.');
  await expect(page.getByRole('searchbox')).toBeFocused();

  await page.getByLabel('Cenário de demonstração').selectOption('error');
  await page.getByRole('button', { name: 'Tentar novamente' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('movimento reduzido desativa o spinner', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByLabel('Cenário de demonstração').selectOption('loading');
  const animations = await page
    .getByRole('status')
    .filter({ hasText: 'Carregando...' })
    .evaluate((element) =>
      Array.from(element.children).map((child) => getComputedStyle(child).animationName),
    );
  expect(animations.every((name) => name === 'none')).toBe(true);
});

test('campo e indicador de foco têm contraste mínimo de 3:1', async ({ page }) => {
  const input = page.getByRole('searchbox');
  await input.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const contrast = await input.evaluate((element) => {
    const style = getComputedStyle(element);
    function luminance(color: string) {
      const channels = color.match(/[\d.]+/g);
      if (!channels || channels.length < 3) throw new Error(`Cor inválida: ${color}`);
      const [r, g, b] = channels.slice(0, 3).map((value) => {
        const channel = Number(value) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function ratio(foreground: string, background: string) {
      const a = luminance(foreground);
      const b = luminance(background);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }
    return {
      border: ratio(style.borderColor, style.backgroundColor),
      focus: ratio(style.outlineColor, style.backgroundColor),
      text: ratio(style.color, style.backgroundColor),
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(contrast.border).toBeGreaterThanOrEqual(3);
  expect(contrast.focus).toBeGreaterThanOrEqual(3);
  expect(contrast.text).toBeGreaterThanOrEqual(4.5);
  expect(contrast.outlineStyle).toBe('solid');
  expect(contrast.outlineWidth).toBeGreaterThanOrEqual(2);
});
