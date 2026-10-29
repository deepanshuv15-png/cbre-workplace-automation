// tests/ticket-lifecycle.spec.ts
// Uses the API for fast setup, then the UI for the user-critical steps.
import { test, expect } from '../fixtures/test-fixtures';
import { sites, teams, incidents } from '../data/testData';
import { uniqueText } from '../utils/testHelpers';

test.describe('Ticket lifecycle @regression', () => {
  test('REQ-003: ticket can be re-assigned to another team', async ({ loggedIn, ticketApi, ticketPage }) => {
    const ticket = await ticketApi.createTicket({ category: 'Facilities', site: sites.warehouse, description: uniqueText(incidents.fireDoor) });

    await ticketApi.assignTicket(ticket.id, teams.Security);

    await ticketPage.gotoTicket(ticket.id);
    await expect(ticketPage.assignedTeam).toHaveText(teams.Security);
    await expect(ticketPage.history).toContainText(`Assigned to ${teams.Security}`);
  });

  test('REQ-004: progress update appears in ticket history', async ({ loggedIn, ticketApi, ticketPage }) => {
    const ticket = await ticketApi.createTicket({ category: 'Facilities', site: sites.warehouse, description: uniqueText(incidents.lightFailure) });
    const update = 'Electrician booked for 14:00';

    await ticketPage.gotoTicket(ticket.id);
    await ticketPage.addProgressComment(update);

    await expect(ticketPage.message).toHaveText('Comment added');
    await expect(ticketPage.history).toContainText(update);
    // Backend agrees with the UI
    const stored = await ticketApi.getTicket(ticket.id);
    expect(stored.history.map((h) => h.text)).toContain(update);
  });

  test('REQ-005: resolved ticket can be closed', async ({ page, loggedIn, ticketApi, ticketPage }) => {
    const ticket = await ticketApi.createTicket({ category: 'Facilities', site: sites.londonOffice, description: uniqueText(incidents.generator) });

    await ticketPage.gotoTicket(ticket.id);
    await ticketPage.closeTicket.click();
    await expect(ticketPage.status).toHaveText('Closed');

    // Refresh to prove the change was saved (this is the exact JIRA defect example in the guide).
    await page.reload();
    await expect(ticketPage.status).toHaveText('Closed');
    expect((await ticketApi.getTicket(ticket.id)).status).toBe('Closed');
  });

  test('Full lifecycle: create -> assign -> update -> close', async ({ loggedIn, ticketPage, dashboardPage, ticketApi }) => {
    await test.step('Create ticket in UI', async () => {
      await ticketPage.createFacilitiesTicket(sites.warehouse, uniqueText(incidents.rollerDoor));
      await expect(ticketPage.createdTicketStatus).toHaveText('Open');
    });
    const ticketId = (await ticketPage.createdTicketId.textContent())!;

    await test.step('Ticket appears on dashboard and opens', async () => {
      await expect(dashboardPage.ticketRow(ticketId)).toContainText(teams.Facilities);
      await dashboardPage.openTicket(ticketId);
    });

    await test.step('Add progress update', async () => {
      await ticketPage.addProgressComment('Contractor on site');
      await expect(ticketPage.history).toContainText('Contractor on site');
    });

    await test.step('Close ticket', async () => {
      await ticketPage.closeTicket.click();
      await expect(ticketPage.status).toHaveText('Closed');
      expect((await ticketApi.getTicket(ticketId)).status).toBe('Closed');
    });
  });
});
