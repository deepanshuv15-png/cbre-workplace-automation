// tests/ticket-negative.spec.ts
import { test, expect } from '../fixtures/test-fixtures';
import { sites, incidents, users } from '../data/testData';
import { uniqueText } from '../utils/testHelpers';

test.describe('Negative and edge cases @regression', () => {
  test('Invalid login shows an error and stays on login page', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login(users.facilities.username, 'wrong-password');
    await expect(loginPage.errorMessage).toHaveText('Invalid username or password');
    await expect(page).toHaveURL(/login/);
  });

  test('Dashboard is protected: anonymous user is sent to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('Missing description shows validation message', async ({ loggedIn, ticketPage }) => {
    await ticketPage.createTicketWith('Facilities', sites.warehouse, '   ');
    await expect(ticketPage.message).toContainText('Description is required');
  });

  test('Invalid site/category combination is rejected', async ({ loggedIn, ticketPage }) => {
    await ticketPage.createTicketWith('IT', sites.warehouse, uniqueText('Laptop dock broken'));
    await expect(ticketPage.message).toContainText('IT tickets cannot be raised for GXO Warehouse');
  });

  test('Unauthorised user cannot close a ticket (403)', async ({ ticketApi, viewerApi }) => {
    const ticket = await ticketApi.createTicket({ category: 'Facilities', site: sites.warehouse, description: uniqueText(incidents.fireDoor) });
    const response = await viewerApi.tryCloseTicket(ticket.id);
    expect(response.status()).toBe(403);
    expect((await ticketApi.getTicket(ticket.id)).status).toBe('Open');
  });

  test('Closing an already-closed ticket is handled safely (409)', async ({ ticketApi }) => {
    const ticket = await ticketApi.createTicket({ category: 'Facilities', site: sites.warehouse, description: uniqueText(incidents.generator) });
    await ticketApi.closeTicket(ticket.id);
    const second = await ticketApi.tryCloseTicket(ticket.id);
    expect(second.status()).toBe(409);
  });

  test('Duplicate submission does not create two tickets', async ({ request }) => {
    const auth = { Authorization: 'Basic ' + Buffer.from(`${users.facilities.username}:${users.facilities.password}`).toString('base64') };
    const payload = { category: 'Facilities', site: sites.londonOffice, description: uniqueText('Duplicate check'), requestId: `dup-${Date.now()}-${Math.random()}` };

    const first = await request.post('/api/tickets', { data: payload, headers: auth });
    const second = await request.post('/api/tickets', { data: payload, headers: auth });

    expect(first.status()).toBe(201);
    expect((await second.json()).id).toBe((await first.json()).id);
  });

  test('UI shows an error when the backend returns 500', async ({ page, loggedIn, ticketPage }) => {
    // Network mocking: make ticket creation fail without touching the real backend.
    await page.route('**/api/tickets', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 500, json: { errors: ['Service unavailable, please try again'] } })
        : route.continue()
    );
    await ticketPage.createFacilitiesTicket(sites.warehouse, uniqueText(incidents.lightFailure));
    await expect(ticketPage.message).toContainText('Service unavailable');
  });
});
