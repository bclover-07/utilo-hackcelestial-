# Utlio Conductor: verified event planning and recovery

Research and implementation plan, 24 September 2026.

## Product direction

Build one connected hospitality resource decision workflow: describe an event, confirm requirements, assemble feasible multi-provider packages, inspect evidence, simulate a supplier failure, and create a reviewed marketplace request. Maintain the business dashboard with seeker/provider modes and the separate admin dashboard.

The distinctive demonstration is a live resource dependency graph and a recovery comparison, backed by real inventory calculations. Claims of availability are snapshots, not reservations. Delivery routes, safety certifications, predictions and model confidence must not be invented.

## Implementation sequence

1. Diagnose structured Gemini output and make parsing errors actionable. Add strict schemas, bounded model calls and editable manual requirements so operational planning can continue without a model response.
2. Implement a deterministic package allocator with split quantities, shared-stock accounting, whole-event budget, rental duration, delivery charges, excluded suppliers and structured attribute checks. Return alternatives, gaps, evidence, candidate bounds and explicit solver limitations.
3. Add authenticated plan records owned by the requesting business. Support versioned, deterministic replanning, source timestamps, before/after differences, scenario stress tests and creation of a reviewed request. Revalidate records before creating a request; do not silently create bookings.
4. Build a cohesive Conductor frontend: brief intake, requirement editor, package comparison, resource graph, cost chart, evidence ledger, exclusion and budget controls, recovery differences and an explicit request action. Keep neubrutalist rounded borders, mobile usability and reduced motion.
5. Validate extraction, allocation, stock sharing, budgets, infeasibility, ownership, stale revisions, exclusions, request creation and API failure behavior. Run lint, production build, backend tests and browser checks.

## Acceptance examples

- A 150-chair request may source 100 and 50 chairs from two providers when neither alone has sufficient quantity.
- Two requirements sharing a listing cannot consume the same available stock twice.
- A package over budget is never called feasible; explain the least-cost result found and the budget gap.
- Excluding a supplier triggers a new inventory query and a new plan version, with changes explained.
- Unsupported free-text requirements are visibly pending confirmation. Exact structured attributes are checked against listing records.
- Scenario resilience is reported as scenarios passed / scenarios tested, never as a real-world success probability.
- Model extraction is advisory and editable. No arbitrary model-suggested tools, bookings, messages or payments execute.

## Beyond this implementation

Multilingual audio intake, photo-assisted listing drafts, route travel time, supplier response assistance and calibrated forecasting remain separate extensions requiring integrations, data and evaluation. Do not represent them as complete. Properly evaluated optimization can later move from bounded Node search to an OR-Tools service.

## Research basis

- [Official PS-1 brief](https://www.tech.alegria.co.in/tracks): provider/seeker exchange, availability, logistics and intelligent matching.
- [Unstop](https://unstop.com/hackathons/hackcelestial-30-pillai-university-navi-mumbai-1737808/amp): Excellence in AI Application award; separate award cash amount and numeric rubric were not specified on the checked page.
- [Rules](https://www.tech.alegria.co.in/rules): clarify permitted use of pre-existing code with organizers; work must satisfy original-work and event-development requirements.
- [Cvent Vendor Marketplace](https://www.cvent.com/en/event-marketing-management/vendor-marketplace): conversational vendor matching and AI RFP creation already exist commercially. Do not claim those alone are novel.
- [LLM-Modulo research](https://arxiv.org/abs/2402.01817): combine language-model assistance with external verification. This motivates our architecture; it does not prove this application's correctness.
- [TravelPlanner, ICML 2024](https://proceedings.mlr.press/v235/xie24j.html): multi-constraint planning needs end-to-end evaluation. Historical benchmark outcomes are not measurements of current Utlio models.
- [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output), [LangGraph streaming](https://docs.langchain.com/oss/javascript/langgraph/streaming), [OR-Tools CP-SAT](https://developers.google.com/optimization/cp/cp_solver).

## Status

Plan written; implementation in progress. Completion and measured validation will be recorded after checks, without fabricated metrics.
