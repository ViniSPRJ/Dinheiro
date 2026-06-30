import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';

export interface LotInput {
  id?: string;
  side: 'BUY' | 'SELL';
  quantity: Prisma.Decimal | number | string;
  unitPrice: Prisma.Decimal | number | string;
  tradeDate: Date;
}

export interface FifoPosition {
  quantity: Prisma.Decimal;
  averagePrice: Prisma.Decimal;
  totalInvested: Prisma.Decimal;
}

export interface FifoSale {
  lotId?: string;
  tradeDate: Date;
  quantity: Prisma.Decimal;
  saleValue: Prisma.Decimal;
  costBasis: Prisma.Decimal;
  gain: Prisma.Decimal;
}

interface Tranche {
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
}

/**
 * Walks lots oldest-first, consuming open BUY tranches as SELL lots arrive.
 * Shared by computeFifoPosition (remaining open tranches) and computeFifoSales
 * (the realized sale events), so the FIFO consumption logic lives in one place.
 */
function walkFifo(lots: LotInput[]): { open: Tranche[]; sales: FifoSale[] } {
  const sorted = [...lots].sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime());
  const open: Tranche[] = [];
  const sales: FifoSale[] = [];

  for (const lot of sorted) {
    const quantity = new Prisma.Decimal(lot.quantity);
    const unitPrice = new Prisma.Decimal(lot.unitPrice);

    if (lot.side === 'BUY') {
      open.push({ quantity, unitPrice });
      continue;
    }

    // SELL: consume the oldest open tranches first (FIFO).
    let remaining = quantity;
    let costBasis = new Prisma.Decimal(0);
    while (remaining.greaterThan(0) && open.length > 0) {
      const tranche = open[0];
      const consumed = tranche.quantity.lessThanOrEqualTo(remaining) ? tranche.quantity : remaining;
      costBasis = costBasis.plus(consumed.times(tranche.unitPrice));

      if (tranche.quantity.lessThanOrEqualTo(remaining)) {
        remaining = remaining.minus(tranche.quantity);
        open.shift();
      } else {
        tranche.quantity = tranche.quantity.minus(remaining);
        remaining = new Prisma.Decimal(0);
      }
    }
    // Selling more than currently held leaves `remaining` > 0 — a short position
    // isn't modeled here, the holding simply zeroes out and cost basis only
    // covers what was actually available to sell.

    const saleValue = quantity.times(unitPrice);
    sales.push({
      lotId: lot.id,
      tradeDate: lot.tradeDate,
      quantity,
      saleValue,
      costBasis,
      gain: saleValue.minus(costBasis),
    });
  }

  return { open, sales };
}

/**
 * Pure FIFO cost-basis calculation: returns the remaining open position after
 * consuming sells against the oldest buys. Kept separate from
 * recomputeInvestmentFromLots so it's unit-testable without a DB.
 */
export function computeFifoPosition(lots: LotInput[]): FifoPosition {
  const { open } = walkFifo(lots);

  const totalQuantity = open.reduce((sum, t) => sum.plus(t.quantity), new Prisma.Decimal(0));
  const totalCost = open.reduce(
    (sum, t) => sum.plus(t.quantity.times(t.unitPrice)),
    new Prisma.Decimal(0)
  );
  const averagePrice = totalQuantity.greaterThan(0)
    ? totalCost.dividedBy(totalQuantity)
    : new Prisma.Decimal(0);

  return { quantity: totalQuantity, averagePrice, totalInvested: totalCost };
}

/**
 * Pure FIFO realized-sale calculation: one record per SELL lot with the cost
 * basis consumed and the resulting gain/loss. This is what capital-gains tax
 * (Fase 4) is computed from — kept separate from computeFifoPosition but
 * sharing the same walk so the two can never disagree on which tranches were
 * consumed.
 */
export function computeFifoSales(lots: LotInput[]): FifoSale[] {
  return walkFifo(lots).sales;
}

/**
 * Recomputes an Investment's derived quantity/averagePrice/totalInvested from its
 * lots and persists the result. Call after every lot create/delete so the
 * existing performance/allocation/advisor read-paths keep working unchanged.
 */
export async function recomputeInvestmentFromLots(investmentId: string): Promise<void> {
  const lots = await prisma.investmentLot.findMany({ where: { investmentId } });
  const position = computeFifoPosition(lots);

  await prisma.investment.update({
    where: { id: investmentId },
    data: {
      quantity: position.quantity,
      averagePrice: position.averagePrice,
      totalInvested: position.totalInvested,
    },
  });
}
