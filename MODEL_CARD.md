# Model Card: NY Tax Tipping Point Calculator

## Model Overview

This calculator estimates how changes to New York State and New York City income tax rates affect total tax revenue, accounting for potential behavioral migration of high-income filers.

## Intended Use

- **Primary users**: Policy analysts, journalists, civic-minded citizens
- **Purpose**: Exploring tradeoffs in NY tax policy proposals
- **NOT for**: Definitive revenue forecasting, individual financial decisions, or political advocacy without caveat

## Data Sources

### Baseline Income Distribution
- **IRS Statistics of Income (SOI), Table 2** — Tax Year 2021
  - Number of returns, AGI, and income tax by state and income bracket
  - URL: https://www.irs.gov/statistics/soi-tax-stats-historic-table-2
- **NYS Department of Taxation and Finance** — PIT Filer Summary Datasets
  - NYS personal income tax liability by income range
  - URL: https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702
- **NYC Independent Budget Office** — Fiscal analysis
  - NYC personal income tax revenue (~$15.5B FY2022)
  - URL: https://www.ibo.nyc.ny.us/
- **NYS Comptroller** — Annual Financial Reports
  - Total NYS PIT collections (~$59.5B FY2022)
  - URL: https://www.osc.ny.gov/reports/finance

### Tax Rate Schedules
- **NYS Tax Law § 601** — 2024 brackets including temporary surcharges
  - Top rate: 10.9% on income over $25M
  - Temporary rates on $1.077M+ enacted in 2021 budget (sunset after 2027)
- **NYC Admin Code § 11-1701** — NYC income tax brackets
  - Top rate: 3.876% on income over $50K

### Behavioral Response Parameters
- **Young, Varner, Lurie, & Prisinzano (2016)** — "Millionaire Migration and Taxation of the Elite"
  - American Sociological Review, 81(3), 421-446
  - Finding: Modest migration response (elasticity ~0.1-0.4 for millionaires)
  - DOI: 10.1177/0003122416639625
- **Moretti & Wilson (2017)** — "The Effect of State Taxes on the Geographical Location of Top Earners"
  - Review of Economics and Statistics, 99(3), 421-434
  - Finding: Higher elasticity for star scientists (~1.6-2.3)
  - DOI: 10.1162/REST_a_00653
- **Kleven, Landais, Saez, & Schultz (2014)** — "Migration and Wage Effects of Taxing Top Earners"
  - Quarterly Journal of Economics, 129(1), 333-378
  - Finding: High elasticity for foreign top earners in Denmark (~1.6)
- **IRS SOI Migration Data** — Year-to-year address changes
  - Background out-migration rate for NY high-income filers: ~1.5%/year
  - URL: https://www.irs.gov/statistics/soi-tax-stats-migration-data

## Model Equations

### Mechanical Revenue (no behavioral response)
```
mechanical_gain(cohort) = additional_tax_per_filer × filer_count
additional_tax = surcharge_rate × max(0, avg_AGI - surcharge_threshold) + flat_rate_change × avg_AGI
```

### Behavioral Migration Models

**Elasticity Model:**
```
leavers_share = base_rate + elasticity × (additional_tax / avg_AGI)
```

**Threshold Model:**
```
if additional_tax < threshold:
  leavers_share = base_rate
else:
  leavers_share = base_rate + (max_share - base_rate) × min(1, (additional_tax - threshold) / threshold)
```

**Hybrid Logistic (default):**
```
sigmoid(x) = 1 / (1 + exp(-x))
x = (additional_tax - threshold) / slope
leavers_share = base_rate + (max_share - base_rate) × sigmoid(x)
```

All models apply:
- Time scaling: share × time_factor (30% year 1, 70% year 3, 100% year 5)
- Replacement offset: share × (1 - replacement_rate)
- Clamping to [0, max_migration_share]

### Revenue Loss from Migration
```
migration_loss(cohort) = departing_filers × (existing_tax_per_filer + additional_tax_per_filer)
```
Departing filers lose ALL their tax contribution, not just the marginal increase.

### Middle-Income Offset
```
if net_revenue < 0:
  rate_increase = |net_revenue| / total_middle_income_AGI
  per_filer = |net_revenue| / middle_income_filer_count
```

## Default Parameter Values

| Parameter | Default | Source | Type |
|-----------|---------|--------|------|
| Base migration rate | 1.5%/year | IRS SOI migration data | Data |
| Migration elasticity | 1.5 | Literature midpoint (0.4-2.3) | Assumption |
| Max migration share | 15% | None (cap assumption) | Assumption |
| Tipping threshold | $100,000 | None (informed by cost analysis) | Assumption |
| Logistic slope | $50,000 | None (curve shape assumption) | Assumption |
| Year 1 migration share | 30% | Young et al. lag analysis | Assumption |
| Year 3 cumulative share | 70% | Young et al. lag analysis | Assumption |
| Year 5 cumulative share | 100% | Assumption (fully realized) | Assumption |
| Replacement rate | 0% | Conservative default | Assumption |
| NYC resident share | 42-60% by bracket | Census + SOI | Partial assumption |

## Limitations

1. **Migration is individual**: The model uses probabilistic aggregate estimates. No model can predict whether a specific person will move.

2. **No general equilibrium**: The model does not account for:
   - Housing market effects (lower demand → lower prices → attraction for others)
   - Labor market effects (talent pool changes)
   - Business relocation spillovers
   - Political responses from competing states

3. **Static income assumption**: Filers' incomes are held constant. In reality, income may shift due to:
   - Timing of capital gains realizations
   - Business structure changes (pass-through vs. corporate)
   - Income-shifting strategies

4. **Data vintage**: Baseline data is from tax year 2021. Post-pandemic migration patterns may differ.

5. **NYC share estimation**: The share of NYS filers who are NYC residents by bracket is estimated, not directly observed.

6. **Federal interaction ignored**: Federal SALT cap effects and potential federal tax changes are not modeled.

7. **Linear surcharge**: The model applies a flat surcharge above a threshold. Real tax proposals may have graduated surcharges.

## Ethical Considerations

- This tool can be used by advocates on any side of tax debates
- Results should always be presented with uncertainty ranges, not point estimates
- The "tipping point" framing may overemphasize migration risk; present alongside static revenue estimates
- Revenue concentration data shows how much depends on a small number of filers, but this is a description, not a prescription

## Updates

- **2026-02-20**: Initial release with TY2021 baseline data
- Data should be refreshed when TY2022/2023 SOI data becomes available
