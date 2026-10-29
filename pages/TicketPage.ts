// pages/TicketPage.ts
// Covers both the "create ticket" form (on the dashboard) and the ticket detail page.
import { Page, Locator } from '@playwright/test';

export class TicketPage {
  // Create form
  readonly createTicket: Locator;
  readonly category: Locator;
  readonly site: Locator;
  readonly description: Locator;
  readonly submit: Locator;
  readonly message: Locator;
  readonly createdTicketId: Locator;
  readonly createdTicketStatus: Locator;
  readonly createdTicketTeam: Locator;

  // Detail page
  readonly status: Locator;
  readonly assignedTeam: Locator;
  readonly detailSite: Locator;
  readonly detailCategory: Locator;
  readonly comment: Locator;
  readonly addComment: Locator;
  readonly closeTicket: Locator;
  readonly history: Locator;

  constructor(private page: Page) {
    this.createTicket = page.getByRole('button', { name: 'Create ticket' });
    this.category = page.getByLabel('Category');
    this.site = page.getByLabel('Site');
    this.description = page.getByLabel('Description');
    this.submit = page.getByRole('button', { name: 'Submit' });
    this.message = page.getByRole('status');
    this.createdTicketId = page.getByTestId('ticket-id');
    this.createdTicketStatus = page.getByTestId('ticket-status');
    this.createdTicketTeam = page.getByTestId('ticket-team');

    this.status = page.getByTestId('status');
    this.assignedTeam = page.getByTestId('team');
    this.detailSite = page.getByTestId('site');
    this.detailCategory = page.getByTestId('category');
    this.comment = page.getByLabel('Comment');
    this.addComment = page.getByRole('button', { name: 'Add comment' });
    this.closeTicket = page.getByRole('button', { name: 'Close ticket' });
    this.history = page.getByRole('list', { name: 'History' });
  }

  async fillTicket(category: string, site: string, description: string) {
    await this.createTicket.click();
    if (category) await this.category.selectOption(category);
    if (site) await this.site.selectOption(site);
    await this.description.fill(description);
  }

  async createTicketWith(category: string, site: string, description: string) {
    await this.fillTicket(category, site, description);
    await this.submit.click();
  }

  async createFacilitiesTicket(site: string, description: string) {
    await this.createTicketWith('Facilities', site, description);
  }

  async gotoTicket(ticketId: string) {
    await this.page.goto(`/tickets/${ticketId}`);
  }

  async addProgressComment(text: string) {
    await this.comment.fill(text);
    await this.addComment.click();
  }
}
