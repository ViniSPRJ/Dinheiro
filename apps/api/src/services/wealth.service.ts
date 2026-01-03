import { prisma } from '../utils/prisma.js';
import { InvestmentController } from '../controllers/investment.controller.js';

export class WealthService {
  /**
   * Calculates the Personal Hurdle Rate (Minimum Rate of Return)
   * Based on Personal Inflation + Risk Premium
   */
  static async calculatePersonalHurdleRate(userId: string) {
    // 1. Get Official Benchmark (IPCA)
    // In a real app, we would fetch the latest IPCA from MarketIndex table
    const ipcaIndex = await prisma.marketIndex.findFirst({
      where: { name: 'IPCA' },
      orderBy: { date: 'desc' },
    });
    const baseInflation = ipcaIndex ? Number(ipcaIndex.value) : 4.5; // Default 4.5% if not found

    // 2. Calculate Personal Inflation Impact
    // This assumes we have a recurring job updating PersonalBasketItems
    const basketItems = await prisma.personalBasketItem.findMany({
      where: { userId },
    });

    let personalInflationAdjustment = 0;
    
    if (basketItems.length > 0) {
      // Simple logic: If basket items increased more than IPCA, add the difference
      // We weight this by how many items are tracked (simplified for MVP)
      const basketInflation = basketItems.reduce((acc, item) => {
        const start = Number(item.basePrice);
        const end = Number(item.currentPrice);
        if (start === 0) return acc;
        return acc + ((end - start) / start);
      }, 0) / basketItems.length; // Average inflation of basket

      // If personal basket inflation is 10% and IPCA is 4.5%, the gap is 5.5%
      // We apply a "Lifestyle Weight" (e.g., 30% of your expenses are these tracked items)
      const lifestyleWeight = 0.3; 
      const inflationGap = (basketInflation * 100) - baseInflation;
      
      if (inflationGap > 0) {
        personalInflationAdjustment = inflationGap * lifestyleWeight;
      }
    }

    const personalInflation = baseInflation + personalInflationAdjustment;

    // 3. Add Risk Premium (Real Return Target)
    const riskPremium = 2.0; // 2% above inflation is the goal

    return {
      totalHurdleRate: personalInflation + riskPremium,
      breakdown: {
        baseInflation,
        personalAdjustment: personalInflationAdjustment,
        riskPremium
      }
    };
  }

  /**
   * Validates if the user's investment strategy is beating their personal inflation
   */
  static async validateInvestmentStrategy(userId: string) {
    const { totalHurdleRate, breakdown } = await this.calculatePersonalHurdleRate(userId);
    const { totals } = await InvestmentController.getPerformanceInternal(userId); // Use internal method

    const currentReturn = totals.totalProfitPercent;
    const realReturn = currentReturn - totalHurdleRate;
    const isWealthBuilding = realReturn > 0;

    let recommendation = "";
    if (isWealthBuilding) {
      recommendation = "Estratégia sólida. Seu patrimônio está crescendo acima do seu custo de vida real.";
    } else if (currentReturn > breakdown.baseInflation) {
        recommendation = "Atenção: Você supera o IPCA, mas perde para sua Inflação Pessoal. Considere ativos atrelados a índices de consumo.";
    } else {
        recommendation = "Crítico: Sua carteira está perdendo poder de compra. Aumente exposição em Renda Fixa IPCA+ ou Ações defensivas.";
    }

    // Save snapshot for history
    await prisma.userInflationSnapshot.create({
      data: {
        userId,
        personalInflation: totalHurdleRate - 2.0, // Remove risk premium to get just inflation
        officialBenchmark: breakdown.baseInflation,
        date: new Date(),
      }
    });

    return {
      isWealthBuilding,
      metrics: {
        userReturn: currentReturn,
        personalHurdleRate: totalHurdleRate,
        gap: realReturn,
      },
      breakdown,
      recommendation
    };
  }
}
