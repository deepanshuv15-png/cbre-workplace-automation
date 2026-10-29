# CBRE-Style Workplace Ticket Automation

Playwright + TypeScript framework that tests a workplace facilities ticket lifecycle
(create → assign → update → close) against a **local demo helpdesk app** (`demo-app/`).

## Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npx playwright test           # starts the demo app automatically
npx playwright show-report
```

Look at the demo app yourself: `npm run start:app` → open http://localhost:3000
(login `facilities.user` / `Password123`).

| Command | What it does |
|---|---|
| `npm test` | Full suite |
| `npm run test:smoke` | Only `@smoke` tests (fast PR check) |
| `npm run test:regression` | Only `@regression` tests |
| `npm run test:headed` | Watch the browser |
| `npm run test:ui` | Playwright UI mode (debugging) |
| `npm run typecheck` | TypeScript check |

## Docker

```bash
docker build -t cbre-workplace-tests .
docker run --rm cbre-workplace-tests
```

## Structure

```
demo-app/     System under test (Express, in-memory data, synthetic users)
tests/        ticket-create / ticket-lifecycle / ticket-negative specs
pages/        Page Objects: LoginPage, DashboardPage, TicketPage
fixtures/     Custom fixtures: page objects, API clients, logged-in state
api/          TicketApi – fast setup & backend verification
data/         Synthetic test data
utils/        logger, helpers
.github/      GitHub Actions regression pipeline
```

## Requirements Traceability Matrix (RTM)

| Requirement | Test(s) | Automated |
|---|---|---|
| REQ-001 Create ticket (unique ID, Open) | ticket-create › REQ-001 | Yes |
| REQ-002 Correct site/category stored | ticket-create › REQ-002 (UI + API) | Yes |
| REQ-003 Assign to facilities team | ticket-create › REQ-003; ticket-lifecycle › REQ-003 | Yes |
| REQ-004 Progress update in history | ticket-lifecycle › REQ-004 | Yes |
| REQ-005 Close resolved issue | ticket-lifecycle › REQ-005; Full lifecycle | Yes |
| Negative: validation, permissions, duplicates, 500 errors | ticket-negative.spec.ts | Yes |

## Example JIRA defect

```
Title: Facilities ticket remains Open after successful closure
Environment: Staging   Severity: High
Steps: 1. Login as Facilities user 2. Open resolved ticket 3. Click Close 4. Refresh
Expected: Status changes to Closed.   Actual: Status remains Open after refresh.
Evidence: Playwright trace + screenshot + API response
Linked test: REQ-005 / ticket-lifecycle.spec.ts
```

## Security

Demo users and data are synthetic. Real environments must take `BASE_URL` and
credentials from CI secrets, never from source code.
