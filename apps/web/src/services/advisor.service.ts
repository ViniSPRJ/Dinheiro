import { api } from './api';

export type RiskProfile = 'conservador' | 'moderado' | 'arrojado';

export interface RebalancingAction {
  asset_class: string;
  action: 'COMPRAR' | 'VENDER' | 'MANTER';
  current_pct: number;
  target_pct: number;
  delta_pct: number;
  amount: number;
}

export interface PortfolioMetrics {
  expected_return_pct: number;
  expected_volatility_pct: number;
  diversification: number;
}

export interface PortfolioReview {
  client_id: string;
  risk_profile: RiskProfile;
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
  current_metrics: PortfolioMetrics;
  expected_metrics: PortfolioMetrics;
  engine: string;
  proposal_id?: string | null;
}

export interface AdvisorReviewResponse {
  available: boolean;
  riskProfile: RiskProfile;
  review?: PortfolioReview;
  message?: string;
}

export const advisorService = {
  getReview: async (riskProfile?: RiskProfile): Promise<AdvisorReviewResponse> => {
    const params = riskProfile ? `?riskProfile=${riskProfile}` : '';
    const response = await api.get(`/advisor/review${params}`);
    return response.data.data;
  },

  updateProfile: async (riskProfile: RiskProfile): Promise<{ riskProfile: RiskProfile }> => {
    const response = await api.patch('/advisor/profile', { riskProfile });
    return response.data.data;
  },
};
