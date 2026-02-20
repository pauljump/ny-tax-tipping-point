# NY Tax Tipping Point Calculator - Current State

## Status: MVP Complete
**Last updated:** 2026-02-20

## What's Built
- Full Next.js 16 + TypeScript + Tailwind v4 application
- Core computation engine with 4 behavioral migration models (none, elasticity, threshold, hybrid logistic)
- 10 income cohorts with real IRS SOI + NYS DTF baseline data (TY2021)
- Interactive UI with policy inputs, behavioral model parameters, and projection settings
- 4 visualizations: Revenue curve, Waterfall chart, Migration by cohort, Cohort detail table
- Scenario comparison (static, conservative, moderate, aggressive)
- Sensitivity analysis for key parameters
- Full transparency panel with data sources, assumptions, and interpretation guide
- Middle-class offset calculator
- CSV/JSON export
- 30 passing unit tests
- Model Card and README documentation

## Key Architecture Decisions
- **Embedded data** (no external API calls) — app runs fully offline
- **Pure functions** in model.ts — all computation is side-effect-free and testable
- **Hybrid logistic** as default behavioral model — most nuanced, S-curve centered at threshold
- **Conservative defaults** — migration elasticity 1.5 (midpoint of literature 0.4-2.3), 15% max migration cap
- **Static export** configured — can deploy to any static hosting

## Data Sources
- IRS SOI Table 2 (NY, TY2021)
- NYS DTF PIT Statistics
- NYC IBO fiscal analysis
- NYS Comptroller annual reports
- Academic: Young et al. (2016), Moretti & Wilson (2017)

## Readiness: 85%
- Core app is fully functional
- Could benefit from: real user testing, refined data with newer tax years, additional chart types
