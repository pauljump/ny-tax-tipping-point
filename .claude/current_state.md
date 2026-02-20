# NY Tax Tipping Point Calculator - Current State

## Status: MVP Complete (data-grounded with TY2022)
**Last updated:** 2026-02-20

## What's Built
- Full Next.js 16 + TypeScript + Tailwind v4 application
- Core computation engine with 4 behavioral migration models (none, elasticity, threshold, hybrid logistic)
- 10 income cohorts with **real IRS SOI TY2022 data** (9,767,160 filers, $1.019T AGI)
- State tax liability calibrated to NYS Comptroller ($58.5B) and NYC IBO ($16.8B)
- Revenue concentration validated against CBC: $1M+ filers (0.7%) pay 44% of NYS PIT
- Interactive UI with policy inputs, behavioral model parameters, and projection settings
- 4 visualizations: Revenue curve, Waterfall chart, Migration by cohort, Cohort detail table
- Scenario comparison (static, conservative, moderate, aggressive)
- Sensitivity analysis for key parameters
- Full transparency panel with data/assumption labeling and 9 cited sources
- Middle-class offset calculator ("who fills the gap")
- CSV/JSON export
- 30 passing unit tests
- Model Card and README documentation

## Key Data Points (from research)
- 69,780 millionaire filers = 0.7% of all NY filers, pay 42.4% of federal tax
- NY's share of national millionaires: 12.7% (2010) → 8.7% (2022) = ~$13B/yr lost revenue
- Combined top marginal rate: 14.776% (NYS 10.9% + NYC 3.876%) — highest in nation
- Bottom 50.8% of filers (under $50K) pay only 3.0% of total tax

## Key Architecture Decisions
- **Embedded data** (no external API calls) — app runs fully offline
- **Pure functions** in model.ts — all computation is side-effect-free and testable
- **Hybrid logistic** as default behavioral model — S-curve centered at threshold
- **Conservative defaults** — migration elasticity 1.5 (midpoint of literature 0.4-2.3)
- **Static export** configured — can deploy to any static hosting

## Readiness: 90%
- Core app is fully functional with real data
- Could benefit from: user testing, newer tax years as they release, additional sensitivity charts
