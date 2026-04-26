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
- [x] Final checkpoint saved
- [x] Published live URL (user action required — click Publish in UI)

## Simulation UX Redesign
- [x] Simulation page: step-by-step wizard (Step 1: Seed, Step 2: Scenario, Step 3: Launch)
- [x] Simulation page: visual seed preview card with transaction stats
- [x] Simulation page: better what-if sliders with live value display and descriptions
- [x] Simulation page: agent selection cards with role descriptions
- [x] SimulationDetail page: tabbed layout (Forecast / Risk / Agents / Chat / Report)
- [x] SimulationDetail page: improved forecast chart with confidence bands
- [x] SimulationDetail page: risk alert cards with color-coded severity badges
- [x] SimulationDetail page: agent insight cards with avatar/icon per agent
- [x] SimulationDetail page: polished chat with agent selector tabs

## Quick Demo
- [x] Quick Demo page with pre-filled sample business data (transactions, KPIs, charts)
- [x] Demo: Auto Seed Generator preview with sample seed text
- [x] Demo: What-if scenario sliders with live visual feedback
- [x] Demo: Swarm simulation results (forecast chart, risk alerts, agent insights)
- [x] Demo: Chat with Agent sample conversation
- [x] Demo: Indonesian report summary preview
- [x] Demo page accessible from landing page and sidebar (no login required)
- [x] Demo banner/badge to distinguish demo mode from real data

## Bug Fixes
- [x] Fix MySQL GROUP BY error in getMonthlyTrends (Dashboard chart fails)

## File Import Feature
- [x] Install papaparse (CSV) and xlsx (Excel) parsing libraries
- [x] Backend: tRPC bulkImportTransactions procedure with validation
- [x] Frontend: drag-and-drop file upload component (CSV, XLSX, JSON)
- [x] Frontend: auto-detect and map columns (date, description, type, amount)
- [x] Frontend: preview table showing parsed rows before import
- [x] Frontend: column mapper UI for non-standard column names
- [x] Frontend: import result summary (success/skipped/error counts)
- [x] Import accessible from Transactions page via "Import" button

## File Import Hardening
- [x] Fix date parser: correct YYYY/MM/DD regex check (isYMD logic bug)
- [x] Fix duplicate column mapping guard in mapper UI
- [x] Add Vitest tests for import parser utilities (date, amount, type normalisation)
- [x] Add integration test for bulkImport tRPC procedure

## Pitch Deck / PPT Export
- [x] Backend: LLM generates structured slide content (JSON) from simulation + report data
- [x] Backend: HTML slide renderer with chart data embedded (bar, area, risk table)
- [x] Backend: PDF export endpoint via Puppeteer/html-pdf
- [x] Frontend: "Export as Pitch Deck" button on ReportDetail page
- [x] Frontend: Slide preview modal before download
- [x] Slides: Cover, Executive Summary, KPI Overview, Income vs Expense, Cashflow Forecast, Risk Alerts, Agent Insights, Recommendations, Closing
- [x] All slide content in Bahasa Indonesia
- [x] Vitest test for slide content structure validation

## Pitch Deck Preview Fix
- [x] Fix white space on right side of preview modal
- [x] Fix slide scaling so slides fit correctly inside modal width
- [x] Remove overflow/body margin from pitch deck HTML template
- [x] Ensure each slide renders at correct aspect ratio (16:9) in preview

## Layout Fix
- [x] Fix white space on right side of main content area in DashboardLayout

## Reports Page Fix
- [x] Fix blank space on right side of /reports page

## ReportDetail Fix
- [x] Fix blank space on right side of /reports/:id page
- [x] Fix pitch deck slide preview being cut off in the modal

## Landing Page Redesign
- [x] Redesign hero section — asymmetric layout, strong headline, clear CTA
- [x] Fix navigation bar — sticky, correct links, active state, mobile-friendly
- [x] Add features grid section with icons and descriptions
- [x] Add how-it-works steps section
- [x] Add social proof / stats bar
- [x] Add footer with links

## Fintech Landing Page Redesign
- [x] Hero: full-viewport with radial glow, sharp headline, dashboard mockup preview
- [x] Nav: glassmorphism sticky bar with logo, links, and CTA pill
- [x] Stats ticker bar with animated numbers
- [x] Bento feature grid (mixed card sizes, code/data snippets inside cards)
- [x] How-it-works: horizontal timeline with connector lines
- [x] Agent cards: dark cards with colored borders and role badges
- [x] Testimonial / trust section
- [x] Final CTA section with gradient border card
- [x] Footer: multi-column with product links

## Rebrand to FiSwarm + English Conversion
- [x] Rename app title from AkunFish to FiSwarm (index.html, package.json, VITE_APP_TITLE)
- [x] Convert Home.tsx landing page to English
- [x] Convert DashboardLayout sidebar nav items to English
- [x] Convert Dashboard page to English
- [x] Convert Transactions page to English
- [x] Convert Simulation page to English
- [x] Convert SimulationDetail page to English
- [x] Convert Reports page to English
- [x] Convert ReportDetail page to English
- [x] Convert QuickDemo page to English
- [x] Replace all "AkunFish" text references with "FiSwarm"

## GitHub Push & Cleanup
- [ ] Remove all "MiroFish" mentions from UI text (replace with "Swarm AI Engine")
- [ ] Remove all "Manus" mentions from UI text
- [ ] Push project to https://github.com/maulana-tech/iALL-LoveHacks.git

## Pitch Deck Download Error Fix
- [x] Debug and fix "Failed to download pitch deck" error
- [x] Verify Puppeteer PDF rendering works correctly
- [x] Test download functionality end-to-end

## Branding Update: LOVHACKS → AI Agent Sol
- [x] Replace "LOVHACKS SEASON 2" with "AI Agent Sol" in all UI text
- [x] Update landing page hero and footer branding
- [x] Update sidebar and page headers
- [x] Update pitch deck branding

## Currency & Language Update: IDR → USD, Full English
- [x] Replace all "Rp" currency format with "$" (USD)
- [x] Update formatIDR function to formatUSD
- [x] Update pitch deck to use USD currency
- [x] Update demo data to use USD amounts
- [x] Verify all UI text is in English (verified in Dashboard and Quick Demo)
- [x] Convert all Indonesian text to English (reports, labels, descriptions)

## Quick Demo Pitch Deck Export Feature
- [x] Add "Export Pitch Deck" button to Quick Demo reports tab
- [x] Generate pitch deck PDF from demo data
- [x] Enable download functionality for demo pitch deck
- [x] Test end-to-end pitch deck export in Quick Demo
