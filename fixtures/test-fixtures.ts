// fixtures/test-fixtures.ts
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TicketPage } from '../pages/TicketPage';
import { TicketApi } from '../api/TicketApi';
import { users } from '../data/testData';
import { basicAuth } from '../utils/testHelpers';

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  ticketPage: TicketPage;
  /** API helper logged in as the Facilities user. */
  ticketApi: TicketApi;
  /** API helper logged in as a read-only user (for permission tests). */
  viewerApi: TicketApi;
  /** Logs in through the UI as the Facilities user and lands on the dashboard. */
  loggedIn: void;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  ticketPage: async ({ page }, use) => {
    await use(new TicketPage(page));
  },

  ticketApi: async ({ playwright, baseURL }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: basicAuth(users.facilities.username, users.facilities.password) },
    });
    await use(new TicketApi(ctx));
    await ctx.dispose(); // teardown
  },

  viewerApi: async ({ playwright, baseURL }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: basicAuth(users.viewer.username, users.viewer.password) },
    });
    await use(new TicketApi(ctx));
    await ctx.dispose();
  },

  loggedIn: async ({ page, loginPage, dashboardPage }, use) => {
    await loginPage.goto();
    await loginPage.login(users.facilities.username, users.facilities.password);
    await expect(dashboardPage.heading).toBeVisible();
    await use();
  },
});

export { expect };
