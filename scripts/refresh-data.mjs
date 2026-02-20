#!/usr/bin/env node

/**
 * Data Refresh Script
 *
 * Downloads/validates baseline data from public sources.
 * Some sources require manual download; this script documents
 * the expected format and validates existing data.
 *
 * Usage: node scripts/refresh-data.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');

console.log('NY Tax Tipping Point - Data Validation\n');

// Validate baseline CSV
try {
  const csv = readFileSync(resolve(DATA_DIR, 'ny_income_tax_baseline_2021.csv'), 'utf-8');
  const lines = csv.trim().split('\n');
  const header = lines[0];

  console.log('✓ Baseline CSV found');
  console.log(`  Rows: ${lines.length - 1} (expected 10)`);

  // Parse and validate
  let totalFilers = 0;
  let totalAgi = 0;
  let totalNysLiability = 0;
  let totalNycLiability = 0;

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse (handles quoted fields)
    const fields = lines[i].match(/(".*?"|[^,]+)/g)?.map(f => f.replace(/^"|"$/g, ''));
    if (!fields || fields.length < 8) {
      console.error(`  ✗ Row ${i} has insufficient fields`);
      continue;
    }

    const filers = parseInt(fields[3]);
    const agi = parseFloat(fields[4]) * 1e6;
    const nysLiab = parseFloat(fields[5]) * 1e6;
    const nycLiab = parseFloat(fields[6]) * 1e6;

    totalFilers += filers;
    totalAgi += agi;
    totalNysLiability += nysLiab;
    totalNycLiability += nycLiab;
  }

  console.log(`  Total filers: ${(totalFilers / 1e6).toFixed(1)}M`);
  console.log(`  Total AGI: $${(totalAgi / 1e12).toFixed(2)}T`);
  console.log(`  Total NYS liability: $${(totalNysLiability / 1e9).toFixed(1)}B`);
  console.log(`  Total NYC liability: $${(totalNycLiability / 1e9).toFixed(1)}B`);

  // Cross-checks
  const expectedNysTotal = 59.5e9;
  const nysPctDiff = Math.abs(totalNysLiability - expectedNysTotal) / expectedNysTotal;
  if (nysPctDiff > 0.20) {
    console.warn(`  ⚠ NYS total differs from expected $59.5B by ${(nysPctDiff * 100).toFixed(0)}%`);
  } else {
    console.log(`  ✓ NYS total within 20% of Comptroller's $59.5B`);
  }

} catch (e) {
  console.error('✗ Baseline CSV not found or unreadable');
  console.error('  Expected: data/ny_income_tax_baseline_2021.csv');
}

// Document manual download steps
console.log('\n--- Manual Data Sources ---\n');

console.log('1. IRS SOI State Data (Table 2)');
console.log('   URL: https://www.irs.gov/statistics/soi-tax-stats-historic-table-2');
console.log('   Download: Excel file for most recent tax year');
console.log('   Filter: New York State rows');
console.log('   Columns needed: Size of AGI, Number of returns, AGI, Total income tax');
console.log('');

console.log('2. NYS DTF PIT Statistics');
console.log('   URL: https://www.tax.ny.gov/research/stats/statistics/pit-filers-summary-datasets-702');
console.log('   Download: Summary datasets (CSV/Excel)');
console.log('   Use: NYS personal income tax liability by income range');
console.log('');

console.log('3. NYC IBO Fiscal Briefs');
console.log('   URL: https://www.ibo.nyc.ny.us/');
console.log('   Look for: Revenue forecasts, PIT analysis');
console.log('   Use: NYC personal income tax total and distribution');
console.log('');

console.log('4. IRS Migration Data');
console.log('   URL: https://www.irs.gov/statistics/soi-tax-stats-migration-data');
console.log('   Download: State-to-state migration flows');
console.log('   Filter: New York outflows by income');
console.log('');

console.log('Done.');
