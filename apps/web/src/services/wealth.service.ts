import { api } from './api';

export interface WealthHurdleRate {
  totalHurdleRate: number;
  breakdown: {
    baseInflation: number;
    personalAdjustment: number;
    riskPremium: number;
  };
}

export interface WealthHealthData {
  isWealthBuilding: boolean;
  metrics: {
    userReturn: number;
    personalHurdleRate: number;
    gap: number;
  };
  breakdown: {
    baseInflation: number;
    personalAdjustment: number;
    riskPremium: number;
  };
  recommendation: string;
}

export const wealthService = {
  getHealth: async (): Promise<WealthHealthData> => {
    const response = await api.get('/wealth/health');
    return response.data.data;
  },

  getHurdleRate: async (): Promise<WealthHurdleRate> => {
    const response = await api.get('/wealth/hurdle-rate');
    return response.data.data;
  },
};
