// pages/DashboardPage.ts
import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly heading: Locator;
  readonly ticketsTable: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Workplace Dashboard' });
    this.ticketsTable = page.getByRole('table', { name: 'Tickets' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  /** The table row for a given ticket ID. */
  ticketRow(ticketId: string): Locator {
    return this.ticketsTable.getByRole('row').filter({ hasText: ticketId });
  }

  async openTicket(ticketId: string) {
    await this.ticketsTable.getByRole('link', { name: ticketId }).click();
  }
}
