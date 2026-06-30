import { describe, it, expect } from 'vitest';
import { calculateTaxForGroup, classifyAssetClass, monthKey } from '../services/taxEngine.js';
import { computeFifoSales } from '../services/lotService.js';

describe('classifyAssetClass', () => {
  it('maps known investment types to their tax asset class', () => {
    expect(classifyAssetClass('STOCK')).toBe('ACOES');
    expect(classifyAssetClass('FII')).toBe('FII');
    expect(classifyAssetClass('CRYPTO')).toBe('CRIPTO');
    expect(classifyAssetClass('CDB')).toBe('OUTROS');
  });
});

describe('calculateTaxForGroup', () => {
  it('is exempt for a loss regardless of asset class or sale value', () => {
    const result = calculateTaxForGroup({ assetClass: 'FII', totalSaleValue: 100000, totalGain: -500 });
    expect(result.exempt).toBe(true);
    expect(result.taxDue).toBe(0);
  });

  it('exempts acoes sales at exactly R$19.999 in the month (just under the R$20k line)', () => {
    const result = calculateTaxForGroup({ assetClass: 'ACOES', totalSaleValue: 19999, totalGain: 1000 });
    expect(result.exempt).toBe(true);
    expect(result.taxDue).toBe(0);
  });

  it('exempts acoes sales at exactly R$20.000 (the boundary is inclusive)', () => {
    const result = calculateTaxForGroup({ assetClass: 'ACOES', totalSaleValue: 20000, totalGain: 1000 });
    expect(result.exempt).toBe(true);
  });

  it('taxes acoes sales at R$20.001 in the month (just over the R$20k line)', () => {
    const result = calculateTaxForGroup({ assetClass: 'ACOES', totalSaleValue: 20001, totalGain: 1000 });
    expect(result.exempt).toBe(false);
    expect(result.taxDue).toBeCloseTo(1000 * 0.15, 8);
  });

  it('applies the R$35k exemption line for cripto, not the R$20k acoes line', () => {
    const justUnder = calculateTaxForGroup({ assetClass: 'CRIPTO', totalSaleValue: 34999, totalGain: 1000 });
    const justOver = calculateTaxForGroup({ assetClass: 'CRIPTO', totalSaleValue: 35001, totalGain: 1000 });
    expect(justUnder.exempt).toBe(true);
    expect(justOver.exempt).toBe(false);
  });

  it('FII has no sale-value exemption -- any positive gain is taxable', () => {
    const result = calculateTaxForGroup({ assetClass: 'FII', totalSaleValue: 100, totalGain: 10 });
    expect(result.exempt).toBe(false);
    expect(result.taxDue).toBeCloseTo(10 * 0.15, 8);
  });
});

describe('monthKey', () => {
  it('formats as YYYY-MM with zero-padded month', () => {
    expect(monthKey(new Date(Date.UTC(2026, 0, 15)))).toBe('2026-01');
    expect(monthKey(new Date(Date.UTC(2026, 11, 1)))).toBe('2026-12');
  });
});

describe('computeFifoSales (used as the input to capital-gains tax)', () => {
  it('matches a sell against multiple buy tranches via FIFO', () => {
    const sales = computeFifoSales([
      { side: 'BUY', quantity: 10, unitPrice: 100, tradeDate: new Date('2024-01-01') },
      { side: 'BUY', quantity: 10, unitPrice: 120, tradeDate: new Date('2024-02-01') },
      { id: 'sell-1', side: 'SELL', quantity: 15, unitPrice: 200, tradeDate: new Date('2024-03-01') },
    ]);

    expect(sales).toHaveLength(1);
    const sale = sales[0];
    expect(sale.lotId).toBe('sell-1');
    expect(sale.saleValue.toNumber()).toBe(15 * 200);
    // cost basis: 10 @ 100 + 5 @ 120 = 1600
    expect(sale.costBasis.toNumber()).toBe(1600);
    expect(sale.gain.toNumber()).toBe(15 * 200 - 1600);
  });

  it('produces no sale records when there are no SELL lots', () => {
    const sales = computeFifoSales([
      { side: 'BUY', quantity: 10, unitPrice: 100, tradeDate: new Date('2024-01-01') },
    ]);
    expect(sales).toHaveLength(0);
  });
});
