# NY Tax Tipping Point Calculator

Interactive, data-grounded calculator modeling how proposed NYS + NYC income tax changes affect revenue, accounting for behavioral migration response from high-income filers.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What It Does

1. **Baseline**: Loads real NYS+NYC income tax data by income cohort (IRS SOI + NYS DTF, tax year 2021)
2. **Policy Input**: User proposes tax changes (surcharge rates, thresholds, flat rate changes)
3. **Behavioral Response**: Estimates migration of high-income filers using selectable models
4. **Net Revenue**: Shows mechanical gain minus behavioral loss
5. **Middle-Class Offset**: If revenue falls short, computes what middle-income filers would need to pay to break even
6. **Transparency**: Every parameter labeled as "data-backed" or "assumption" with sources

## Behavioral Models

| Model | Description |
|-------|-------------|
| **No migration** | Static baseline—no behavioral response |
| **Elasticity** | Migration proportional to net-of-tax rate change |
| **Threshold/Tipping** | Sharp migration increase above a dollar threshold |
| **Hybrid (default)** | Logistic S-curve centered at threshold |

Default parameters calibrated from:
- Young et al. (2016) "Millionaire Migration and Taxation of the Elite"
- Moretti & Wilson (2017) "Effect of State Taxes on Location of Top Earners"
- IRS SOI Migration Data for New York

## Tech Stack

- **Next.js 16** + TypeScript + Tailwind CSS v4
- **Recharts** for interactive charts
- **Vitest** for unit tests
- No external APIs required—runs fully offline

## Project Structure

```
src/
  lib/
    types.ts      - Type definitions
    data.ts       - Baseline income/tax data (embedded)
    model.ts      - Core computation engine (pure functions)
    defaults.ts   - Default parameters and formatting
  components/
    RevenueChart.tsx      - Revenue vs surcharge rate curve
    WaterfallChart.tsx    - Baseline → gain → loss → net
    MigrationChart.tsx    - Migration % by income cohort
    CohortTable.tsx       - Detailed cohort breakdown
    TransparencyPanel.tsx - Sources and assumptions
  app/
    page.tsx       - Main single-page application
  __tests__/
    model.test.ts  - 30 unit tests
data/
  ny_income_tax_baseline_2021.csv  - Baseline data
  sources.json                      - Data source documentation
```

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm test         # Run unit tests (30 tests)
npm run lint     # ESLint
```

## Data Sources

| Source | What | Year |
|--------|------|------|
| IRS SOI Table 2 | Filer counts, AGI by bracket | 2021 |
| NYS Dept of Taxation & Finance | PIT liability by bracket | 2021 |
| NYC Independent Budget Office | NYC PIT revenue | FY2022 |
| NYS Comptroller | Total PIT collections ($59.5B) | FY2022 |
| IRS Migration Data | Interstate migration rates | 2021 |

## Neutrality

This tool does not assume a political conclusion. It presents:
- Multiple behavioral models with different assumptions
- Conservative, moderate, and aggressive scenarios
- Full parameter transparency with source citations
- Explicit uncertainty acknowledgment

See [MODEL_CARD.md](./MODEL_CARD.md) for detailed assumptions and limitations.
