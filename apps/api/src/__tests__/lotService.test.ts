import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { computeFifoPosition, LotInput } from '../services/lotService.js';

function lot(side: 'BUY' | 'SELL', quantity: number, unitPrice: number, tradeDate: string): LotInput {
  return { side, quantity, unitPrice, tradeDate: new Date(tradeDate) };
}

describe('computeFifoPosition', () => {
  it('returns a zeroed position for no lots', () => {
    const position = computeFifoPosition([]);
    expect(position.quantity.toNumber()).toBe(0);
    expect(position.averagePrice.toNumber()).toBe(0);
    expect(position.totalInvested.toNumber()).toBe(0);
  });

  it('treats a single buy as the whole position', () => {
    const position = computeFifoPosition([lot('BUY', 10, 100, '2024-01-01')]);
    expect(position.quantity.toNumber()).toBe(10);
    expect(position.averagePrice.toNumber()).toBe(100);
    expect(position.totalInvested.toNumber()).toBe(1000);
  });

  it('consumes the oldest tranches first across 3 buys + 1 partial sell', () => {
    const lots = [
      lot('BUY', 10, 100, '2024-01-01'),
      lot('BUY', 10, 120, '2024-02-01'),
      lot('BUY', 10, 140, '2024-03-01'),
      lot('SELL', 15, 200, '2024-04-01'),
    ];

    const position = computeFifoPosition(lots);

    // FIFO consumes all of tranche 1 (10@100) then 5 of tranche 2 (10@120),
    // leaving 5@120 + 10@140.
    expect(position.quantity.toNumber()).toBe(15);
    expect(position.totalInvested.toNumber()).toBe(5 * 120 + 10 * 140);
    expect(position.averagePrice.toNumber()).toBeCloseTo((5 * 120 + 10 * 140) / 15, 8);
  });

  it('is order-independent (sorts by tradeDate, not array order)', () => {
    const lots = [
      lot('SELL', 15, 200, '2024-04-01'),
      lot('BUY', 10, 140, '2024-03-01'),
      lot('BUY', 10, 100, '2024-01-01'),
      lot('BUY', 10, 120, '2024-02-01'),
    ];

    const position = computeFifoPosition(lots);
    expect(position.quantity.toNumber()).toBe(15);
    expect(position.totalInvested.toNumber()).toBe(5 * 120 + 10 * 140);
  });

  it('zeroes out the position when fully sold', () => {
    const position = computeFifoPosition([
      lot('BUY', 10, 100, '2024-01-01'),
      lot('SELL', 10, 150, '2024-02-01'),
    ]);
    expect(position.quantity.toNumber()).toBe(0);
    expect(position.averagePrice.toNumber()).toBe(0);
    expect(position.totalInvested.toNumber()).toBe(0);
  });

  it('accepts Prisma.Decimal inputs, not just numbers', () => {
    const position = computeFifoPosition([
      { side: 'BUY', quantity: new Prisma.Decimal('10'), unitPrice: new Prisma.Decimal('100.50'), tradeDate: new Date('2024-01-01') },
    ]);
    expect(position.quantity.toNumber()).toBe(10);
    expect(position.totalInvested.toNumber()).toBe(1005);
  });
});
