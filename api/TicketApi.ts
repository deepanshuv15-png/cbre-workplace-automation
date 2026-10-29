// api/TicketApi.ts
// Fast backend helper: create test data and verify results without clicking through the UI.
import { APIRequestContext, APIResponse, expect } from '@playwright/test';

export type Ticket = {
  id: string;
  category: string;
  site: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  assignedTeam: string;
  history: { at: string; by: string; text: string }[];
};

export class TicketApi {
  constructor(private request: APIRequestContext) {}

  async createTicket(data: { category: string; site: string; description: string }): Promise<Ticket> {
    const response = await this.request.post('/api/tickets', { data });
    expect(response.status(), await response.text()).toBe(201);
    return response.json();
  }

  async getTicket(ticketId: string): Promise<Ticket> {
    const response = await this.request.get(`/api/tickets/${ticketId}`);
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async assignTicket(ticketId: string, team: string): Promise<Ticket> {
    const response = await this.request.patch(`/api/tickets/${ticketId}`, { data: { assignedTeam: team } });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async addComment(ticketId: string, text: string): Promise<Ticket> {
    const response = await this.request.post(`/api/tickets/${ticketId}/comments`, { data: { text } });
    expect(response.status()).toBe(201);
    return response.json();
  }

  async closeTicket(ticketId: string) {
    const response = await this.request.patch(`/api/tickets/${ticketId}`, { data: { status: 'Closed' } });
    expect(response.ok()).toBeTruthy();
  }

  /** Raw call (no assertion) for negative tests that expect an error status. */
  async tryCloseTicket(ticketId: string): Promise<APIResponse> {
    return this.request.patch(`/api/tickets/${ticketId}`, { data: { status: 'Closed' } });
  }
}
