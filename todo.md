# AkunFish - Project TODO

## Database & Backend
- [x] Define full database schema (transactions, simulations, agent_logs, reports)
- [x] Apply database migrations
- [x] Transaction CRUD procedures (create, list, update, delete)
- [x] Simulation run procedure with LLM multi-agent engine
- [x] Auto Seed Generator procedure
- [x] What-if scenario procedure
- [x] Risk Alert detection procedure
- [x] Chat with Agent procedure
- [x] Report Summary generator procedure (Indonesian language)

## Accounting Dashboard
- [x] KPI cards: total income, expenses, balance, net cashflow
- [x] Transaction input form (income, expense, invoice)
- [x] Transaction history table with date/type filter
- [x] Income vs expense trend chart (line/bar)
- [x] Cashflow projection chart

## Simulation Engine
- [x] Auto Seed Generator UI — convert 3-6 months data to seed text
- [x] Simulation launcher with agent configuration (owner, supplier, customer, bank)
- [x] What-if scenario sliders (price change %, employee count, inventory budget)
- [x] Simulation progress/status display
- [x] Simulation results view with cashflow forecast

## Risk & Alerts
- [x] Risk Alert panel with severity levels (low/medium/high/critical)
- [x] Automatic risk detection from simulation results

## Chat with Agent
- [x] Chat interface with message history
- [x] Agent selector (owner, supplier, customer, bank, report agent)
- [x] Conversation log storage and retrieval

## Report Summary
- [x] Indonesian-language report generator (LLM-powered)
- [x] Report display with structured sections and markdown rendering
- [x] Report history list

## UI & Navigation
- [x] DashboardLayout with sidebar navigation (resizable)
- [x] Design system: dark theme, teal primary, no gradients, no emoji
- [x] Landing/Home page with product overview and workflow steps
- [x] Responsive layout for all pages
- [x] Loading states and empty states

## Testing
- [x] Vitest tests for transaction procedures (create, list, KPI, validation)
- [x] Vitest tests for simulation seed generator
- [x] Vitest tests for agent chat and reports
- [x] All 16 tests passing

## Deployment
- [ ] Final checkpoint saved
- [ ] Published live URL
