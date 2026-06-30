import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { computeFifoSales } from "./lotService.js";

export type AssetClassValue = "ACOES" | "FII" | "CRIPTO" | "OUTROS";

const STOCK_MONTHLY_EXEMPTION = 20000; // acoes: isencao para vendas totais <= R$20mil/mes
const CRYPTO_MONTHLY_EXEMPTION = 35000; // cripto: isencao para vendas totais <= R$35mil/mes
const CAPITAL_GAINS_RATE = 0.15; // ponytail: aliquota flat de 15%, sem faixas progressivas acima de R$5M/mes

export function classifyAssetClass(investmentType: string): AssetClassValue {
  if (investmentType === "STOCK") return "ACOES";
  if (investmentType === "FII") return "FII";
  if (investmentType === "CRYPTO") return "CRIPTO";
  return "OUTROS";
}

export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface MonthlySaleGroup {
  totalSaleValue: number;
  totalGain: number;
  assetClass: AssetClassValue;
}

export interface TaxResult {
  exempt: boolean;
  taxDue: number;
}

/**
 * Applies the Brazilian monthly exemption rules and a flat rate on the taxable
 * gain. ponytail: simplified -- no progressive brackets above R$5M/month, no
 * day-trade vs swing-trade distinction, no loss carryforward across months.
 * This is a calculator for orientation, not a filing system; real DARF filing
 * needs an accountant for edge cases.
 */
export function calculateTaxForGroup(group: MonthlySaleGroup): TaxResult {
  if (group.totalGain <= 0) {
    return { exempt: true, taxDue: 0 };
  }

  if (group.assetClass === "ACOES" && group.totalSaleValue <= STOCK_MONTHLY_EXEMPTION) {
    return { exempt: true, taxDue: 0 };
  }
  if (group.assetClass === "CRIPTO" && group.totalSaleValue <= CRYPTO_MONTHLY_EXEMPTION) {
    return { exempt: true, taxDue: 0 };
  }
  // FII has no monthly sale-value exemption -- always taxable on a positive gain.

  return { exempt: false, taxDue: Math.round(group.totalGain * CAPITAL_GAINS_RATE * 100) / 100 };
}

/**
 * Regenerates every CapitalGainEvent for an investment from its current lots.
 * Called after every lot create/delete (mirroring recomputeInvestmentFromLots)
 * so FIFO sale matching never drifts from the lot ledger. exemptUnder20k/taxDue
 * are written as a same-investment-only snapshot for inspectability; they are
 * NOT authoritative (see the CapitalGainEvent model comment) since the real
 * exemption depends on the user's other investments in the same month/class.
 */
export async function regenerateCapitalGainEvents(investmentId: string): Promise<void> {
  const investment = await prisma.investment.findUniqueOrThrow({ where: { id: investmentId } });
  const lots = await prisma.investmentLot.findMany({ where: { investmentId } });
  const sales = computeFifoSales(lots);

  await prisma.$transaction([
    prisma.capitalGainEvent.deleteMany({ where: { investmentId } }),
    ...sales.map((sale) => {
      const assetClass = classifyAssetClass(investment.type);
      const tax = calculateTaxForGroup({
        totalSaleValue: sale.saleValue.toNumber(),
        totalGain: sale.gain.toNumber(),
        assetClass,
      });

      return prisma.capitalGainEvent.create({
        data: {
          investmentId,
          lotId: sale.lotId,
          saleDate: sale.tradeDate,
          quantity: sale.quantity,
          saleValue: sale.saleValue,
          costBasis: sale.costBasis,
          gain: sale.gain,
          assetClass,
          exemptUnder20k: tax.exempt,
          taxDue: new Prisma.Decimal(tax.taxDue),
          month: monthKey(sale.tradeDate),
        },
      });
    }),
  ]);
}
