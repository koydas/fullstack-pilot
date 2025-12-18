import { test, expect } from '@playwright/test';

function buildInitialApps() {
  return [
    {
      _id: 'app-1',
      name: 'Inventory Hub',
      createdAt: '2024-05-01T14:22:00.000Z',
    },
    {
      _id: 'app-2',
      name: 'Billing Console',
      createdAt: '2024-04-18T09:45:00.000Z',
    },
  ];
}

test.describe('app workflow', () => {
  test.beforeEach(async ({ page }) => {
    const apps = buildInitialApps();

    await page.route('**/api/apps', async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apps),
        });
        return;
      }

      if (method === 'POST') {
        const { name } = route.request().postDataJSON();
        const newApp = {
          _id: `app-${apps.length + 1}`,
          name,
          createdAt: new Date('2024-06-01T12:00:00.000Z').toISOString(),
        };

        apps.unshift(newApp);

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newApp),
        });
        return;
      }

      await route.fallback();
    });

    await page.route('**/api/apps/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        const id = route.request().url().split('/').pop();
        const remaining = apps.filter((app) => app._id !== id);

        apps.splice(0, apps.length, ...remaining);

        await route.fulfill({ status: 204, body: '' });
        return;
      }

      await route.fallback();
    });

    await page.goto('/');
  });

  test('user can view, create, open, and delete an app', async ({ page }) => {
    const listItems = page.getByRole('article');
    await expect(listItems).toHaveCount(2);
    await expect(page.getByText('Inventory Hub')).toBeVisible();
    await expect(page.getByText('Billing Console')).toBeVisible();

    await page.getByLabel('App name').fill('Analytics Dashboard');
    await page.getByRole('button', { name: 'Add app' }).click();

    const analyticsCard = page.getByRole('article', { name: /Analytics Dashboard/ });
    await expect(analyticsCard).toBeVisible();

    await analyticsCard.getByRole('button', { name: 'Open app' }).click();
    const appDialog = page.getByRole('dialog', { name: 'Analytics Dashboard' });
    await expect(appDialog).toBeVisible();
    await expect(appDialog.getByText('Manage your app settings', { exact: false })).toBeVisible();
    await appDialog.getByRole('button', { name: 'Close' }).click();
    await expect(appDialog).toBeHidden();

    await analyticsCard.getByRole('button', { name: 'Remove app' }).click();
    const deleteDialog = page.getByRole('dialog', { name: 'Delete "Analytics Dashboard"?' });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole('button', { name: 'Delete app' }).click();
    await expect(deleteDialog).toBeHidden();
    await expect(page.getByText('Analytics Dashboard')).not.toBeVisible();
  });
});
