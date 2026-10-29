// tests/ticket-create.spec.ts
import { test, expect } from '../fixtures/test-fixtures';
import { sites, teams, incidents, users } from '../data/testData';
import { uniqueText } from '../utils/testHelpers';
import { logger } from '../utils/logger';

test.describe('Ticket creation @smoke', () => {
  test('REQ-001: create workplace facilities ticket', async ({ page, loginPage, ticketPage }) => {
    await loginPage.goto();
    await loginPage.login(users.facilities.username, users.facilities.password);
    await expect(page).toHaveURL(/dashboard/);

    await ticketPage.createFacilitiesTicket(sites.warehouse, uniqueText(incidents.rollerDoor));

    await expect(ticketPage.message).toContainText('Ticket created successfully');
    await expect(ticketPage.createdTicketId).toHaveText(/^WP-\d+$/); // unique ID format
    await expect(ticketPage.createdTicketStatus).toHaveText('Open');
    logger.info(`Created ticket ${await ticketPage.createdTicketId.textContent()}`);
  });

  test('REQ-002: site and category are stored correctly (UI + API check)', async ({ loggedIn, ticketPage, ticketApi }) => {
    const description = uniqueText(incidents.lightFailure);
    await ticketPage.createFacilitiesTicket(sites.londonOffice, description);
    await expect(ticketPage.message).toContainText('Ticket created successfully');

    // Verify what the backend actually stored, not just what the screen shows.
    const ticketId = (await ticketPage.createdTicketId.textContent())!;
    const stored = await ticketApi.getTicket(ticketId);
    expect(stored.site).toBe(sites.londonOffice);
    expect(stored.category).toBe('Facilities');
    expect(stored.description).toBe(description);
    expect(stored.status).toBe('Open');
  });

  test('REQ-003: new ticket is auto-assigned to the Facilities team', async ({ loggedIn, ticketPage }) => {
    await ticketPage.createFacilitiesTicket(sites.manchesterHub, uniqueText(incidents.generator));
    await expect(ticketPage.createdTicketTeam).toHaveText(teams.Facilities);
  });
});
