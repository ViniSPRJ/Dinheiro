import axios from 'axios';
import { config } from '../config/index.js';

const ADVISOR_SERVICE_URL = config.advisorServiceUrl;

/** A single position sent to the advisor for evaluation. */
export interface AdvisorHolding {
  type: string;
  name?: string;
  ticker?: string | null;
  current_value: number;
  invested?: number;
}

export interface OptimizeParams {
  clientId: string;
  holdings: AdvisorHolding[];
  riskProfile?: string;
  currency?: string;
  totalValue?: number;
  stage?: boolean;
}

export interface RebalancingAction {
  asset_class: string;
  action: 'COMPRAR' | 'VENDER' | 'MANTER';
  current_pct: number;
  target_pct: number;
  delta_pct: number;
  amount: number;
}

export interface PortfolioReview {
  client_id: string;
  risk_profile: string;
  risk_profile_label: string;
  currency: string;
  total_value: number;
  summary: string;
  diagnosis: {
    score: number;
    drift: Array<{
      asset_class: string;
      current_pct: number;
      target_pct: number;
      delta_pct: number;
    }>;
    total_abs_drift_pct: number;
    issues: string[];
  };
  current_allocation: Record<string, number>;
  proposed_allocation: Record<string, number>;
  rebalancing_actions: RebalancingAction[];
  insights: string[];
  rationale: string;
  tax_implications: string;
  current_metrics: {
    expected_return_pct: number;
    expected_volatility_pct: number;
    diversification: number;
  };
  expected_metrics: {
    expected_return_pct: number;
    expected_volatility_pct: number;
    diversification: number;
  };
  engine: string;
  proposal_id?: string | null;
}

/**
 * Client for the OpenSwarm Advisor Service.
 *
 * Mirrors the resilient singleton pattern used by {@link MLService}: it health
 * checks the external Python service (with caching) and degrades gracefully —
 * returning `null` instead of throwing — so the advisor being offline never
 * breaks the investments experience.
 */
export class AdvisorService {
  private static instance: AdvisorService;
  private isAvailable = true;
  private lastCheck = 0;
  private readonly checkInterval = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): AdvisorService {
    if (!AdvisorService.instance) {
      AdvisorService.instance = new AdvisorService();
    }
    return AdvisorService.instance;
  }

  private async checkAvailability(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) {
      return this.isAvailable;
    }

    try {
      await axios.get(`${ADVISOR_SERVICE_URL}/health`, { timeout: 2000 });
      this.isAvailable = true;
    } catch {
      this.isAvailable = false;
    }
    this.lastCheck = now;
    return this.isAvailable;
  }

  async optimizePortfolio(params: OptimizeParams): Promise<PortfolioReview | null> {
    const available = await this.checkAvailability();
    if (!available) {
      return null;
    }

    try {
      const response = await axios.post<PortfolioReview>(
        `${ADVISOR_SERVICE_URL}/advisor/optimize`,
        {
          client_id: params.clientId,
          holdings: params.holdings,
          risk_profile: params.riskProfile ?? 'moderado',
          currency: params.currency ?? 'BRL',
          total_value: params.totalValue,
          stage: params.stage ?? true,
        },
        { timeout: 15000 } // allocation optimization can be heavier than categorization
      );
      return response.data;
    } catch (error) {
      console.error('Advisor Service optimize-portfolio error:', error);
      return null;
    }
  }
}

export const advisorService = AdvisorService.getInstance();
